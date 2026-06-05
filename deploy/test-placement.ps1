$body = @{email="student@demo.com"; password="Test@123"} | ConvertTo-Json
$h = @{"Content-Type"="application/json"; "X-Tenant-Slug"="demo"}
$resp = Invoke-RestMethod "http://localhost:5009/api/v1/auth/login" -Method POST -Body $body -Headers $h
$tok = $resp.accessToken
Write-Host "Token: $($tok.Substring(0,20))..."

$h2 = @{"Authorization"="Bearer $tok"; "X-Tenant-Slug"="demo"; "Content-Type"="application/json"}
$b2 = @{quizId="11111111-1111-1111-1111-000000000001"} | ConvertTo-Json

try {
    $r = Invoke-RestMethod "http://localhost:5009/api/v1/placement/start" -Method POST -Headers $h2 -Body $b2
    Write-Host "START OK: attemptId=$($r.attemptId)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    Write-Host "START FAIL $statusCode"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}
