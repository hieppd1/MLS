param(
    [string]$ServerIP    = "103.20.97.97",
    [string]$ServerUser  = "root",
    [string]$AppDir      = "/opt/mls",
    [string]$VideoSrcDir = "D:\MLSMedia\demo\videos"
)
$ErrorActionPreference = "Stop"
$sshPass = (Get-Content "$PSScriptRoot\.env.secret" | Where-Object { $_ -match "SSH_PASS" } | ForEach-Object { ($_ -split "=",2)[1].Trim() })
Import-Module Posh-SSH -ErrorAction Stop
$cred = New-Object System.Management.Automation.PSCredential($ServerUser,(ConvertTo-SecureString $sshPass -AsPlainText -Force))
Write-Host "[1/4] Connecting..." -ForegroundColor Cyan
$session = New-SSHSession  -ComputerName $ServerIP -Credential $cred -AcceptKey -Force
$sftp    = New-SFTPSession  -ComputerName $ServerIP -Credential $cred -AcceptKey -Force
Write-Host "Connected!" -ForegroundColor Green

function SSHRun($cmd, [int]$timeout=120) {
    $r = Invoke-SSHCommand -SessionId $session.SessionId -Command $cmd -TimeOut $timeout
    if ($r.Output) { Write-Host ($r.Output -join "`n") }
    return $r
}

$v1src = "YTDown_YouTube_1-Day-tieng-Viet-Phu-am-123Vietnamese_Media_5bVqUZBvmz4_004_360p.mp4"
$v2src = "YTDown_YouTube_2-Day-tieng-Viet-Nguyen-am-don-123Vietna_Media_wLmERFUxdyA_003_360p.mp4"
$v3src = "YTDown_YouTube_4-Day-tieng-Viet-Chao-hoi-tam-biet-va-da_Media_bm133KdODU0_003_360p.mp4"
$v1dst = "viet-phu-am-day1.mp4"
$v2dst = "viet-nguyen-am-day2.mp4"
$v3dst = "viet-chao-hoi-day4.mp4"

Write-Host "[2/4] Creating media directory on server..." -ForegroundColor Cyan
SSHRun "mkdir -p $AppDir/media/demo/videos" | Out-Null
Write-Host "  OK" -ForegroundColor Green

Write-Host "[3/4] Uploading videos..." -ForegroundColor Cyan
$tmp = "$env:TEMP\mlsvid"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

$pairs = @(
    @{s="$VideoSrcDir\$v1src"; d="$tmp\$v1dst"; name=$v1dst},
    @{s="$VideoSrcDir\$v2src"; d="$tmp\$v2dst"; name=$v2dst},
    @{s="$VideoSrcDir\$v3src"; d="$tmp\$v3dst"; name=$v3dst}
)

foreach ($p in $pairs) {
    if (-not (Test-Path $p.s)) { Write-Warning "Not found: $($p.s)"; continue }
    Copy-Item $p.s $p.d -Force
    $mb = [math]::Round((Get-Item $p.d).Length / 1MB, 1)
    $remote = "$AppDir/media/demo/videos/$($p.name)"
    $chk = SSHRun "test -f $remote; echo $?"
    if ($chk.Output -contains "0") {
        Write-Host "  SKIP (exists): $($p.name)" -ForegroundColor Yellow
        continue
    }
    Write-Host "  Uploading $($p.name) ($mb MB)..."
    Set-SFTPItem -SessionId $sftp.SessionId -Path $p.d -Destination "$AppDir/media/demo/videos/" -Force
    Write-Host "  Done: $($p.name)" -ForegroundColor Green
}
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
SSHRun "ls -lh $AppDir/media/demo/videos/"

Write-Host "[4/4] Running seed SQL..." -ForegroundColor Cyan
Set-SFTPItem -SessionId $sftp.SessionId -Path "$PSScriptRoot\seed-viet-course.sql" -Destination "/tmp/" -Force
$r = SSHRun "docker exec -i mls_postgres psql -U mls_user -d mls -f /tmp/seed-viet-course.sql 2>&1" -timeout 60
Write-Host "Seed ExitStatus: $($r.ExitStatus)"

Remove-SSHSession -SessionId $session.SessionId | Out-Null
Remove-SFTPSession -SessionId $sftp.SessionId   | Out-Null
Write-Host "DONE!" -ForegroundColor Green