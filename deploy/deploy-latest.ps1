# =============================================================================
# MLS -- Deploy Latest + VNPay Sandbox + Quiz Seeds
# Usage:  .\deploy\deploy-latest.ps1
#         .\deploy\deploy-latest.ps1 -SkipBuild
#         .\deploy\deploy-latest.ps1 -MigrateAndSeedOnly
# Requires: Install-Module Posh-SSH
# =============================================================================
param(
    [string]$ServerIP          = "103.20.97.97",
    [string]$ServerUser        = "root",
    [string]$AppDir            = "/opt/mls",
    [switch]$SkipBuild,
    [switch]$MigrateAndSeedOnly
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

# -- Read SSH password from .env.secret
$secretFile = "$PSScriptRoot\.env.secret"
if (-not (Test-Path $secretFile)) { throw "Missing $secretFile (need SSH_PASS)" }
$sshPass = (Get-Content $secretFile |
    Where-Object { $_ -match '^SSH_PASS\s*=' } |
    Select-Object -First 1) -replace '^SSH_PASS\s*=\s*', ''
if (-not $sshPass) { throw "SSH_PASS not found in .env.secret" }

Import-Module Posh-SSH -ErrorAction Stop

$cred = [System.Management.Automation.PSCredential]::new(
    $ServerUser,
    (ConvertTo-SecureString $sshPass -AsPlainText -Force)
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MLS -- Deploy Latest" -ForegroundColor Cyan
Write-Host "  Target: $ServerUser@$ServerIP" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

function Run([string]$cmd, [int]$timeout = 120) {
    $r = Invoke-SSHCommand -SessionId $session.SessionId -Command $cmd -TimeOut $timeout
    if ($r.Output) { $r.Output | ForEach-Object { Write-Host "  $_" } }
    if ($r.ExitStatus -ne 0 -and $r.Error) { Write-Warning "  STDERR: $($r.Error)" }
    return $r
}

function Upload([string]$local, [string]$remote) {
    Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
        -Path $local -Destination $remote -Verbose:$false
}

Write-Host "`n[SSH] Connecting to $ServerUser@$ServerIP..." -ForegroundColor Yellow
$session = New-SSHSession -ComputerName $ServerIP -Credential $cred -AcceptKey -Force
Write-Host "[SSH] Connected!" -ForegroundColor Green

# =============================================================================
# PART 1: BUILD + DEPLOY SOURCE CODE
# =============================================================================
if (-not $MigrateAndSeedOnly) {

    if (-not $SkipBuild) {
        Write-Host "`n[1/5] Building .NET backend (Release)..." -ForegroundColor Yellow
        Set-Location $root
        dotnet publish backend/MLS.API/MLS.API.csproj -c Release `
            -o deploy/_publish/backend --nologo -v quiet
        if ($LASTEXITCODE -ne 0) { throw "Backend build failed!" }
        Write-Host "  Build OK" -ForegroundColor Green
    }

    Write-Host "`n[2/5] Packaging source code..." -ForegroundColor Yellow
    $zipPath = "$env:TEMP\mls-latest.zip"
    $tempDir = "$env:TEMP\mls-latest-src"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    New-Item -ItemType Directory "$tempDir\backend"  | Out-Null
    New-Item -ItemType Directory "$tempDir\frontend" | Out-Null

    Write-Host "  Copying sources (exclude bin/obj/node_modules)..."
    $null = robocopy "$root\backend"  "$tempDir\backend"  /E /XD bin obj .git /XF *.user *.suo /NFL /NDL /NJH /NJS
    $null = robocopy "$root\frontend" "$tempDir\frontend" /E /XD node_modules .next .git /NFL /NDL /NJH /NJS
    Copy-Item "$root\docker-compose.prod.yml" "$tempDir\" -Force
    # Nginx config (mounted into mls_nginx container as volume)
    New-Item -ItemType Directory "$tempDir\nginx" -Force | Out-Null
    Copy-Item "$root\deploy\nginx\*" "$tempDir\nginx\" -Recurse -Force

    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -CompressionLevel Optimal
    Remove-Item $tempDir -Recurse -Force

    $sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
    Write-Host "  Archive: $sizeMB MB -- uploading..." -ForegroundColor Yellow
    Upload $zipPath "$AppDir/"
    Upload "$PSScriptRoot\.env.production" "$AppDir/"
    Run ("mv -f $AppDir/.env.production $AppDir/.env" + " && echo env_ok") 10
    Write-Host "  Upload OK" -ForegroundColor Green

    Write-Host "`n[3/5] Rebuild Docker containers (5-8 min)..." -ForegroundColor Yellow
    $extractCmd = "cd $AppDir" + " && rm -rf backend frontend && unzip -qo mls-latest.zip && rm -f mls-latest.zip && echo extract_ok"
    $downCmd    = "cd $AppDir" + " && docker compose -f docker-compose.prod.yml --env-file .env down --remove-orphans && echo down_ok"
    $upCmd      = "cd $AppDir" + " && docker compose -f docker-compose.prod.yml --env-file .env up -d --build && echo up_ok"

    Run $extractCmd 180
    Write-Host "  Stopping old containers..."
    Run $downCmd 60
    Write-Host "  Building and starting containers..."
    Run $upCmd 600

    Write-Host "  Waiting 15s for services to start..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 15

    Write-Host "  Container status:"
    Run 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"' 20
    $health = Run 'curl -sf http://127.0.0.1:5009/api/health || echo health_fail' 15
    if ($health.Output -match "health_fail") {
        Write-Warning "  Backend health check failed -- check: docker logs mls_backend"
    } else {
        Write-Host "  Backend OK" -ForegroundColor Green
    }
}

# =============================================================================
# PART 2: MIGRATIONS (all idempotent -- safe to re-run)
# =============================================================================
Write-Host "`n[4/5] Running DB migrations..." -ForegroundColor Yellow

$migrations = @(
    "phase3-migration.sql",
    "phase3-quiz-migration.sql",
    "phase3-quiz-review-fixes.sql",
    "quiz-type-config-migration.sql",
    "opic-migration.sql",
    "opic-quiz-selection-migration.sql",
    "sprint6-speaking-migration.sql",
    "sprint7-writing-migration.sql",
    "sprint8-adaptive-seed.sql",
    "sprint9-realtime-migration.sql",
    "phase4-migration.sql",
    "phase5-migration.sql",
    "activation-migration.sql",
    "book-commerce-migration.sql",
    "order-migration.sql",
    "vstep-migration.sql",
    "phase6-chat-migration.sql",
    "phase6-notifications-migration.sql",
    "phase7-analytics-migration.sql",
    "shipping-migration.sql"
)

foreach ($mig in $migrations) {
    $localPath = "$PSScriptRoot\$mig"
    if (-not (Test-Path $localPath)) {
        Write-Host "  [SKIP] $mig (file not found)" -ForegroundColor DarkGray
        continue
    }
    Write-Host "  Running $mig ..." -NoNewline
    Upload $localPath "/tmp/"
    Run ("docker cp /tmp/$mig mls_postgres:/tmp/") 15 | Out-Null
    Run ("docker exec mls_postgres psql -U mls_user -d mls -f /tmp/$mig 2>&1 | tail -3") 60 | Out-Null
    Write-Host " OK" -ForegroundColor Green
}

Write-Host "  Migrations done" -ForegroundColor Green

# =============================================================================
# PART 3: SEED QUIZ DATA (Standard + OPIC + VSTEP)
# =============================================================================
Write-Host "`n[5/5] Seeding quiz data (Standard / OPIC / VSTEP)..." -ForegroundColor Yellow

$seeds = @(
    @{ file="seed-phase3-quiz.sql";       label="[Standard] English Placement Test" },
    @{ file="seed-phase3a-testdata.sql";  label="[Standard] Phase 3A practice quiz" },
    @{ file="seed-opic-demo.sql";         label="[OPIC] Demo 15 speaking questions" },
    @{ file="seed-vstep-tieng-viet.sql";  label="[VSTEP] Listening/Reading/Writing/Speaking" },
    @{ file="seed-vps-phase5.sql";        label="[Phase5] Course pricing + sample orders" },
    @{ file="seed-chat-groups.sql";       label="[Phase6] Chat groups + sample messages" }
)

foreach ($s in $seeds) {
    $localPath = "$PSScriptRoot\$($s.file)"
    if (-not (Test-Path $localPath)) {
        Write-Host "  [SKIP] $($s.label) (file not found)" -ForegroundColor DarkGray
        continue
    }
    Write-Host "  $($s.label)..."
    Upload $localPath "/tmp/"
    Run ("docker cp /tmp/$($s.file) mls_postgres:/tmp/") 10 | Out-Null
    Run ("docker exec mls_postgres psql -U mls_user -d mls -f /tmp/$($s.file) 2>&1 | tail -5") 120
}

Write-Host "  Seeds done" -ForegroundColor Green

# =============================================================================
# PART 4: VERIFY VNPAY SANDBOX CONFIG
# =============================================================================
Write-Host "`nVerifying VNPay config on container..." -ForegroundColor Yellow
$vnpayCheck = Run 'docker exec mls_backend env | grep -i vnpay' 10
if ($vnpayCheck.Output -match "VNPAY_TMN_CODE\|VNPay__TmnCode\|TmnCode") {
    Write-Host "  VNPay config: OK" -ForegroundColor Green
} else {
    Write-Warning "  VNPay env vars not set -- check .env and docker-compose.prod.yml"
    Write-Host "  Manual fix: docker exec mls_backend env | grep -i vnpay" -ForegroundColor Yellow
}

# =============================================================================
# DONE
# =============================================================================
Remove-SSHSession -SessionId $session.SessionId | Out-Null

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY COMPLETE!" -ForegroundColor Green
Write-Host "  App:     http://$ServerIP" -ForegroundColor Cyan
Write-Host "  API:     http://$ServerIP/api/health" -ForegroundColor Cyan
Write-Host "  Swagger: http://$ServerIP/swagger" -ForegroundColor Cyan
Write-Host "" 
Write-Host "  VNPay Sandbox -- configure on VNPAY merchant portal:" -ForegroundColor Yellow
Write-Host "    IPN URL:    http://$ServerIP/api/v1/payment/vnpay/ipn" -ForegroundColor White
Write-Host "    Return URL: http://$ServerIP/api/v1/payment/vnpay/return" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan