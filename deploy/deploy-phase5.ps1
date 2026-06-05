param(
    [string]$ServerIP   = "103.20.97.97",
    [string]$ServerUser = "root",
    [string]$AppDir     = "/opt/mls",
    [switch]$SkipBuild,
    [switch]$MigrateOnly,
    [switch]$SeedOnly
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$secretFile = "$PSScriptRoot\.env.secret"
if (-not (Test-Path $secretFile)) { throw "Missing $secretFile" }
$sshPass = (Get-Content $secretFile |
    Where-Object { $_ -match '^SSH_PASS\s*=' } |
    Select-Object -First 1) -replace '^SSH_PASS\s*=\s*',''
if (-not $sshPass) { throw "SSH_PASS not found in .env.secret" }

Import-Module Posh-SSH -ErrorAction Stop

$cred = [System.Management.Automation.PSCredential]::new(
    $ServerUser,
    (ConvertTo-SecureString $sshPass -AsPlainText -Force)
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MLS Phase 5 Deployment" -ForegroundColor Cyan
Write-Host "  Target: $ServerUser@$ServerIP" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

function Run([string]$cmd, [int]$timeout = 120) {
    $r = Invoke-SSHCommand -SessionId $session.SessionId -Command $cmd -TimeOut $timeout
    if ($r.Output) { $r.Output | ForEach-Object { Write-Host "  $_" } }
    if ($r.Error -and $r.ExitStatus -ne 0) { Write-Warning "  ERR: $($r.Error)" }
    return $r
}

Write-Host "[SSH] Connecting to $ServerUser@$ServerIP..." -ForegroundColor Yellow
$session = New-SSHSession -ComputerName $ServerIP -Credential $cred -AcceptKey -Force
Write-Host "[SSH] Connected!`n" -ForegroundColor Green

if (-not $MigrateOnly -and -not $SeedOnly) {

    if (-not $SkipBuild) {
        Write-Host "[1/5] Building .NET backend..." -ForegroundColor Yellow
        Set-Location $root
        dotnet publish backend/MLS.API/MLS.API.csproj -c Release `
            -o deploy/_publish/backend --nologo -v quiet
        if ($LASTEXITCODE -ne 0) { throw "Backend build failed!" }
        Write-Host "  Build OK" -ForegroundColor Green
    }

    Write-Host "`n[2/5] Creating source archive..." -ForegroundColor Yellow
    $zipPath = "$env:TEMP\mls-phase5.zip"
    $tempDir = "$env:TEMP\mls-phase5-src"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    New-Item -ItemType Directory "$tempDir\backend" | Out-Null
    New-Item -ItemType Directory "$tempDir\frontend" | Out-Null

    Write-Host "  Copying sources (excluding bin/obj/node_modules)..."
    $null = robocopy "$root\backend"  "$tempDir\backend"  /E /XD bin obj .git /XF *.user *.suo /NFL /NDL /NJH /NJS
    $null = robocopy "$root\frontend" "$tempDir\frontend" /E /XD node_modules .next .git /NFL /NDL /NJH /NJS
    Copy-Item "$root\docker-compose.prod.yml" "$tempDir\" -Force

    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath
    Remove-Item $tempDir -Recurse -Force

    $sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
    Write-Host "  Archive: $sizeMB MB - uploading to $ServerIP..."

    Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
        -Path $zipPath -Destination "$AppDir/" -Verbose:$false

    Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
        -Path "$PSScriptRoot\.env.production" -Destination "$AppDir/" -Verbose:$false

    Run "mv -f $AppDir/.env.production $AppDir/.env; echo env_ok" 10
    Write-Host "  Upload OK" -ForegroundColor Green

    Write-Host "`n[3/5] Extracting sources and rebuilding containers..." -ForegroundColor Yellow
    Write-Host "  (docker compose build takes 3-5 minutes)" -ForegroundColor DarkYellow

    $extractCmd = "cd $AppDir" + ' && rm -rf backend frontend && unzip -q mls-phase5.zip && rm -f mls-phase5.zip && echo extract_ok'
    $downCmd    = "cd $AppDir" + ' && docker compose -f docker-compose.prod.yml --env-file .env down --remove-orphans; echo down_ok'
    $upCmd      = "cd $AppDir" + ' && docker compose -f docker-compose.prod.yml --env-file .env up -d --build && echo up_ok'

    Run $extractCmd 60
    Write-Host "  Stopping old containers..."
    Run $downCmd 60
    Write-Host "  Building and starting containers..."
    Run $upCmd 600

    Write-Host "  Waiting 12s for services to initialize..."
    Start-Sleep -Seconds 12

    Run 'docker ps --format "table {{.Names}}\t{{.Status}}"' 20
    Run 'curl -s http://127.0.0.1:5009/api/health' 15
}

if (-not $SeedOnly) {
    Write-Host "`n[4/5] Running Phase 5 DB migration..." -ForegroundColor Yellow

    Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
        -Path "$PSScriptRoot\phase5-migration.sql" -Destination "/tmp/" -Verbose:$false

    Run 'docker cp /tmp/phase5-migration.sql mls_postgres:/tmp/' 15

    $migCmd    = 'docker exec mls_postgres psql -U mls_user -d mls -f /tmp/phase5-migration.sql'
    $migResult = Run $migCmd 60

    if ($migResult.Output -match "migration completed") {
        Write-Host "  Migration OK" -ForegroundColor Green
    } elseif ($migResult.Output -match "already exists|already applied") {
        Write-Host "  Already applied - OK" -ForegroundColor Yellow
    } else {
        Write-Warning "  Check output above for errors"
    }
}

Write-Host "`n[5/5] Running Phase 5 seed data..." -ForegroundColor Yellow

Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
    -Path "$PSScriptRoot\seed-vps-phase5.sql" -Destination "/tmp/" -Verbose:$false

Run 'docker cp /tmp/seed-vps-phase5.sql mls_postgres:/tmp/' 15

$seedCmd    = 'docker exec mls_postgres psql -U mls_user -d mls -f /tmp/seed-vps-phase5.sql'
$seedResult = Run $seedCmd 120

if ($seedResult.Output -match "seed completed") {
    Write-Host "  Seed OK" -ForegroundColor Green
} else {
    Write-Host "  Seed done - check output above" -ForegroundColor Yellow
}

Write-Host "`n=== Container Status ===" -ForegroundColor Cyan
Run 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"' 20

Write-Host "`n=== API Health ===" -ForegroundColor Cyan
Run 'curl -s http://127.0.0.1:5009/api/health' 15

Write-Host "`n=== DB Summary ===" -ForegroundColor Cyan
$dbSql  = "SET search_path TO tenant_demo;"
$dbSql += " SELECT (SELECT COUNT(*) FROM ""Courses"" WHERE ""IsFree""=false) AS paid_courses,"
$dbSql += " (SELECT COUNT(*) FROM ""Orders"" WHERE ""PaymentStatus""=''Paid'') AS paid_orders,"
$dbSql += " (SELECT COUNT(*) FROM ""OrderItems"" WHERE ""ItemType""=''Course'') AS course_items,"
$dbSql += " (SELECT COUNT(*) FROM ""Invoices"") AS invoices,"
$dbSql += " (SELECT COUNT(*) FROM ""CourseEnrollments"" WHERE ""Source""=''Payment'') AS enrollments;"
$dbCmd  = "docker exec mls_postgres psql -U mls_user -d mls -c '$dbSql'"
Run $dbCmd 30

Remove-SSHSession -SessionId $session.SessionId | Out-Null

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "  Phase 5 Deploy COMPLETE!" -ForegroundColor Green
Write-Host "  App:   http://$ServerIP" -ForegroundColor Cyan
Write-Host "  API:   http://$ServerIP/api" -ForegroundColor Cyan
Write-Host "  Admin: http://$ServerIP/admin" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan
Write-Host "Demo accounts (password: Demo@123456):" -ForegroundColor White
Write-Host "  admin@demo.local     - SuperAdmin" -ForegroundColor Gray
Write-Host "  giaovien1@demo.local - Teacher" -ForegroundColor Gray
Write-Host "  giaovien2@demo.local - Teacher" -ForegroundColor Gray
Write-Host "  hocvien1@demo.local  - Student (Python + books; orders A+D)" -ForegroundColor Gray
Write-Host "  hocvien2@demo.local  - Student (Figma + Tieng Anh; orders B+E)" -ForegroundColor Gray
Write-Host "  hocvien3@demo.local  - Student (IELTS + Toan; orders C+F)" -ForegroundColor Gray