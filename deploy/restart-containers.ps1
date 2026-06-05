#!/usr/bin/env pwsh
# restart-containers.ps1
# 1. Start frontend docker build in background (nohup) - avoids SSH timeout
# 2. Restart backend container with new image
# 3. Show status

param(
    [switch]$CheckBuildOnly   # just check log status, don't restart
)

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $scriptDir

# Load SSH password
$secretFile = Join-Path $scriptDir ".env.secret"
$sshPass = ""
if (Test-Path $secretFile) {
    Get-Content $secretFile | ForEach-Object {
        if ($_ -match "SSH_PASS\s*=\s*(.+)") { $sshPass = $matches[1].Trim() }
    }
}
if (-not $sshPass) {
    Write-Error "SSH_PASS not found in deploy/.env.secret"
    exit 1
}

Import-Module Posh-SSH -ErrorAction Stop
$cred = New-Object System.Management.Automation.PSCredential(
    "root",
    (ConvertTo-SecureString $sshPass -AsPlainText -Force)
)

Write-Host "[SSH] Connecting to 103.20.97.97..."
$session = New-SSHSession -ComputerName "103.20.97.97" -Credential $cred -AcceptKey -Force
if (-not $session) { Write-Error "SSH failed"; exit 1 }
$sid = $session.SessionId

function SSH($cmd, $timeout=30) {
    (Invoke-SSHCommand -SessionId $sid -Command $cmd -TimeOut $timeout).Output
}

if ($CheckBuildOnly) {
    Write-Host "=== Frontend build log (last 30 lines) ==="
    SSH "tail -30 /tmp/frontend-build.log 2>/dev/null || echo 'No log found'"
    Write-Host ""
    Write-Host "=== Docker images ==="
    SSH "docker images --format 'table {{.Repository}}`t{{.Tag}}`t{{.CreatedSince}}`t{{.ID}}' | grep -E 'mls|REPO'"
    Write-Host ""
    Write-Host "=== Containers ==="
    SSH "docker ps --format 'table {{.Names}}`t{{.Image}}`t{{.Status}}'"
    Remove-SSHSession -SessionId $sid | Out-Null
    exit 0
}

Write-Host ""
Write-Host "=== Step 1: Start frontend build in background ==="
$buildLog = "/tmp/frontend-build.log"
# Clear old log
SSH "rm -f $buildLog" 10
# Start background build - nohup ensures it survives SSH disconnect
$bgCmd = "cd /opt/mls && nohup docker compose -f docker-compose.prod.yml --env-file .env build frontend > $buildLog 2>&1 &"
SSH $bgCmd 15
Write-Host "  Frontend build started in background. Log: $buildLog"
Write-Host "  (Run this script with -CheckBuildOnly to check status)"

Start-Sleep -Seconds 3
Write-Host "  Initial log output:"
SSH "head -5 $buildLog 2>/dev/null || echo '  (build starting...)'" 10

Write-Host ""
Write-Host "=== Step 2: Restart backend with new image ==="
# Force-recreate backend so it picks up mls-backend:latest
SSH "cd /opt/mls && docker compose -f docker-compose.prod.yml --env-file .env up -d --no-build --force-recreate backend 2>&1" 60
Write-Host "  Backend restarted."

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=== Step 3: Status ==="
SSH "docker ps --format 'table {{.Names}}`t{{.Image}}`t{{.Status}}`t{{.CreatedAt}}'" 30

Write-Host ""
Write-Host "=== Backend health ==="
SSH "curl -sf http://127.0.0.1:5009/api/health 2>&1 || echo 'Not ready yet (wait ~10s)'" 15

Write-Host ""
Write-Host "Done. Backend restarted with new image (DB auto-migration will run)."
Write-Host "Check frontend build with: .\deploy\restart-containers.ps1 -CheckBuildOnly"

Remove-SSHSession -SessionId $sid | Out-Null
