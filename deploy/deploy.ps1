# ============================================================
# MLS Deploy Script (PowerShell - Windows)
# Usage: .\deploy\deploy.ps1
# Requires: OpenSSH (built-in Windows 10+) or PuTTY (plink/pscp)
# ============================================================

param(
    [string]$ServerIP   = "103.20.97.97",
    [string]$ServerUser = "root",
    [string]$AppDir     = "/opt/mls",
    [string]$SshKey     = "$env:USERPROFILE\.ssh\mls_vps"
)

$ErrorActionPreference = "Stop"

# SSH/SCP helpers using key file
function Invoke-Ssh([string]$Cmd) {
    ssh -i $SshKey -o StrictHostKeyChecking=no "${ServerUser}@${ServerIP}" $Cmd
}
function Invoke-Scp([string]$Src, [string]$Dst, [switch]$Recurse) {
    if ($Recurse) { scp -i $SshKey -o StrictHostKeyChecking=no -r $Src "${ServerUser}@${ServerIP}:${Dst}" }
    else          { scp -i $SshKey -o StrictHostKeyChecking=no    $Src "${ServerUser}@${ServerIP}:${Dst}" }
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MLS Deployment Script" -ForegroundColor Cyan
Write-Host "  Target: $ServerUser@$ServerIP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ── Bước 1: Build backend ──────────────────────────────────
Write-Host "`n[1/5] Building .NET backend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\.."
dotnet publish backend/MLS.API/MLS.API.csproj -c Release -o deploy/_publish/backend
if ($LASTEXITCODE -ne 0) { throw "Backend build failed!" }
Write-Host "Backend build OK" -ForegroundColor Green

# ── Bước 2: Build frontend ─────────────────────────────────
Write-Host "`n[2/5] Building Next.js frontend..." -ForegroundColor Yellow
Set-Location "frontend"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend build failed!" }
Set-Location ".."
Write-Host "Frontend build OK" -ForegroundColor Green

# ── Bước 3: Tạo thư mục trên server ───────────────────────
Write-Host "`n[3/5] Setting up server directories..." -ForegroundColor Yellow
Invoke-Ssh "mkdir -p $AppDir/backend $AppDir/frontend $AppDir/media $AppDir/logs $AppDir/nginx"
Write-Host "Directories OK" -ForegroundColor Green

# ── Bước 4: Upload files ───────────────────────────────────
Write-Host "`n[4/5] Uploading files..." -ForegroundColor Yellow

# Upload backend binaries
Write-Host "  Uploading backend..."
Invoke-Scp "deploy/_publish/backend/*" "${AppDir}/backend/" -Recurse

# Upload frontend
Write-Host "  Uploading frontend..."
Invoke-Scp "frontend/.next/standalone/*" "${AppDir}/frontend/" -Recurse
Invoke-Scp "frontend/.next/static" "${AppDir}/frontend/.next/" -Recurse
Invoke-Scp "frontend/public" "${AppDir}/frontend/" -Recurse

# Upload configs
Write-Host "  Uploading docker-compose and nginx config..."
Invoke-Scp "docker-compose.prod.yml" "${AppDir}/"
Invoke-Scp "deploy/nginx/nginx.conf" "${AppDir}/nginx/"
Invoke-Scp "deploy/nginx/default.conf" "${AppDir}/nginx/"

Write-Host "Upload OK" -ForegroundColor Green

# ── Bước 5: Khởi động/Restart services ────────────────────
Write-Host "`n[5/5] Restarting services on server..." -ForegroundColor Yellow
Invoke-Ssh "cd $AppDir && docker compose -f docker-compose.prod.yml up -d --build 2>&1 | tail -20"
Write-Host "Services restarted" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Deploy COMPLETE!" -ForegroundColor Green
Write-Host "  App: http://$ServerIP" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
