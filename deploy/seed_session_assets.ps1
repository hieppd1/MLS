# Seed demo session assets via SSH + Posh-SSH
param(
    [string]$ServerIP   = "103.20.97.97",
    [string]$ServerUser = "root"
)

$secretFile = "$PSScriptRoot\.env.secret"
$sshPass = (Get-Content $secretFile | Where-Object { $_ -match '^SSH_PASS\s*=' } | Select-Object -First 1) -replace '^SSH_PASS\s*=\s*', ''
$dbPass  = (Get-Content "$PSScriptRoot\.env.production" | Where-Object { $_ -match '^DB_PASSWORD\s*=' } | Select-Object -First 1) -replace '^DB_PASSWORD\s*=\s*', ''

Import-Module Posh-SSH -ErrorAction Stop

$cred = [System.Management.Automation.PSCredential]::new(
    $ServerUser,
    (ConvertTo-SecureString $sshPass -AsPlainText -Force)
)

Write-Host "Connecting to $ServerIP..." -ForegroundColor Cyan
$session = New-SSHSession -ComputerName $ServerIP -Credential $cred -AcceptKey -Force

function Run([string]$cmd) {
    $r = Invoke-SSHCommand -SessionId $session.SessionId -Command $cmd -TimeOut 30
    $r.Output | ForEach-Object { Write-Host $_ }
    if ($r.Error) { Write-Warning $r.Error }
    return $r
}

# Check tables
Write-Host "`n--- Listing tenant_demo tables ---" -ForegroundColor Yellow
Run "docker exec mls_postgres psql -U mls_user -d mls -c `"SELECT table_name FROM information_schema.tables WHERE table_schema = 'tenant_demo' ORDER BY table_name;`""

# Check session_assets specifically
Write-Host "`n--- Check session_assets columns ---" -ForegroundColor Yellow
Run "docker exec mls_postgres psql -U mls_user -d mls -c `"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'tenant_demo' AND table_name ILIKE '%asset%' ORDER BY table_name, ordinal_position;`""

# Check sessions
Write-Host "`n--- Check sessions ---" -ForegroundColor Yellow
Run "docker exec mls_postgres psql -U mls_user -d mls -c `"SET search_path TO tenant_demo; SELECT \`"Id\`", \`"Title\`" FROM \`"Sessions\`" LIMIT 5;`""

# Check segments for our target session
Write-Host "`n--- Check segments for session f0000004 ---" -ForegroundColor Yellow
Run "docker exec mls_postgres psql -U mls_user -d mls -c `"SET search_path TO tenant_demo; SELECT \`"Id\`", \`"Title\`", \`"OrderIndex\`" FROM \`"Segments\`" WHERE \`"SessionId\`" = 'f0000004-0000-0000-0000-00000000000a' ORDER BY \`"OrderIndex\`";`""

# Check LearningAssets
Write-Host "`n--- Check existing LearningAssets ---" -ForegroundColor Yellow
Run "docker exec mls_postgres psql -U mls_user -d mls -c `"SET search_path TO tenant_demo; SELECT la.\`"Id\`", la.\`"Type\`", la.\`"Title\`", la.\`"SegmentId\`" FROM \`"LearningAssets\`" la JOIN \`"Segments\`" s ON la.\`"SegmentId\`" = s.\`"Id\`" JOIN \`"Sessions\`" sess ON s.\`"SessionId\`" = sess.\`"Id\`" WHERE sess.\`"Id\`" = 'f0000004-0000-0000-0000-00000000000a' ORDER BY la.\`"OrderIndex\`";`""

Remove-SSHSession -SessionId $session.SessionId | Out-Null
Write-Host "`nDone." -ForegroundColor Green
