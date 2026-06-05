# ============================================================
# MLS Full Deploy Script (Posh-SSH)
# Usage: .\deploy\setup-vps.ps1
# Lần đầu: cài Docker, upload code, chạy containers
# ============================================================

param(
    [string]$ServerIP   = "103.20.97.97",
    [string]$ServerUser = "root",
    [string]$AppDir     = "/opt/mls"
)

$ErrorActionPreference = "Stop"

# Load password from .env.secret
$secretFile = "$PSScriptRoot\.env.secret"
if (-not (Test-Path $secretFile)) {
    throw "Không tìm thấy $secretFile. Tạo file với SSH_PASS=your_password"
}
$secrets = Get-Content $secretFile | Where-Object { $_ -match '=' } |
    ForEach-Object { $k, $v = $_ -split '=', 2; @{$k.Trim() = $v.Trim()} } |
    ForEach-Object { $_ }
$sshPass = ($secrets | Where-Object { $_.Keys -eq 'SSH_PASS' }).Values

if (-not $sshPass) { throw "SSH_PASS không tìm thấy trong .env.secret" }

Import-Module Posh-SSH -ErrorAction Stop

$cred = [System.Management.Automation.PSCredential]::new(
    $ServerUser,
    (ConvertTo-SecureString $sshPass -AsPlainText -Force)
)

Write-Host "`n[1/6] Connecting to $ServerUser@$ServerIP..." -ForegroundColor Cyan
$session = New-SSHSession -ComputerName $ServerIP -Credential $cred -AcceptKey -Force
Write-Host "Connected!" -ForegroundColor Green

function Run($cmd) {
    $r = Invoke-SSHCommand -SessionId $session.SessionId -Command $cmd -TimeOut 300
    if ($r.Output) { Write-Host $r.Output }
    if ($r.ExitStatus -ne 0) { Write-Warning "Exit: $($r.ExitStatus) | $($r.Error)" }
    return $r
}

# ── Bước 2: Cài Docker ─────────────────────────────────────
Write-Host "`n[2/6] Installing Docker..." -ForegroundColor Cyan
$dockerCheck = Run "docker --version 2>/dev/null || echo 'NOT_INSTALLED'"
if ($dockerCheck.Output -match 'NOT_INSTALLED') {
    Write-Host "  Docker not found, installing..." -ForegroundColor Yellow
    Run "curl -fsSL https://get.docker.com | sh"
    Run "systemctl enable docker && systemctl start docker"
    Write-Host "  Docker installed!" -ForegroundColor Green
} else {
    Write-Host "  Docker already installed: $($dockerCheck.Output)" -ForegroundColor Green
}

# ── Bước 3: Tạo thư mục ───────────────────────────────────
Write-Host "`n[3/6] Creating app directories..." -ForegroundColor Cyan
Run "mkdir -p $AppDir/nginx $AppDir/media $AppDir/logs"
Write-Host "Directories OK" -ForegroundColor Green

# ── Bước 4: Upload files via SCP ──────────────────────────
Write-Host "`n[4/6] Uploading project files..." -ForegroundColor Cyan
$root = "$PSScriptRoot\.."

Write-Host "  Uploading docker-compose.prod.yml..."
Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
    -Path "$root\docker-compose.prod.yml" -Destination $AppDir

Write-Host "  Uploading nginx config..."
Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
    -Path "$root\deploy\nginx\nginx.conf" -Destination "$AppDir/nginx/"
Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
    -Path "$root\deploy\nginx\default.conf" -Destination "$AppDir/nginx/"

Write-Host "  Uploading .env.production..."
Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
    -Path "$root\deploy\.env.production" -Destination "$AppDir/"
Run "mv -f $AppDir/.env.production $AppDir/.env 2>/dev/null; ls -la $AppDir/.env"

# Zip source (exclude bin/obj/node_modules/.next/.git)
Write-Host "  Creating source archive (excluding bin/obj/node_modules/.next)..."
$zipPath = "$env:TEMP\mls-source.zip"
$tempDir = "$env:TEMP\mls-deploy"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory "$tempDir\backend" | Out-Null
New-Item -ItemType Directory "$tempDir\frontend" | Out-Null

# robocopy: /E=subfolders, /XD=exclude dirs, /NFL/NDL/NJH/NJS=quiet
$rc = robocopy "$root\backend" "$tempDir\backend" /E /XD bin obj .git /XF *.user /NFL /NDL /NJH /NJS
$rc = robocopy "$root\frontend" "$tempDir\frontend" /E /XD node_modules .next .git /NFL /NDL /NJH /NJS

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath
Remove-Item $tempDir -Recurse -Force

Write-Host "  Archive size: $([math]::Round((Get-Item $zipPath).Length/1MB, 1)) MB"
Write-Host "  Uploading archive..."
Set-SCPItem -ComputerName $ServerIP -Credential $cred -AcceptKey `
    -Path $zipPath -Destination "$AppDir/"

Write-Host "  Extracting on server..."
Run "cd $AppDir && rm -rf backend frontend && unzip -q mls-source.zip && rm mls-source.zip && echo 'Extract OK'"

Write-Host "Upload OK" -ForegroundColor Green

# ── Bước 5: Build và chạy containers ──────────────────────
Write-Host "`n[5/6] Building & starting containers..." -ForegroundColor Cyan
Run "cd $AppDir && docker compose -f docker-compose.prod.yml --env-file .env up -d --build 2>&1"
Write-Host "Containers started!" -ForegroundColor Green

# ── Bước 6: Kiểm tra ─────────────────────────────────────
Write-Host "`n[6/6] Health check..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
Run "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
Run "curl -s -o /dev/null -w '%{http_code}' http://localhost/api/health 2>/dev/null || echo 'API not ready yet'"

# ── Cleanup ───────────────────────────────────────────────
Remove-SSHSession -SessionId $session.SessionId | Out-Null

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  DEPLOY COMPLETE!" -ForegroundColor Green
Write-Host "  App: http://$ServerIP" -ForegroundColor Cyan
Write-Host "  API: http://$ServerIP/api" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
