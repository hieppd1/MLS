# Verify: kiem tra anh co nam dung vi tri khong (truoc bang, khong phai cuoi doc)
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
$OUT = "D:\HiepPD\MLS\docs\User_Guide_MLS.docx"
$doc = $word.Documents.Open($OUT)

$shapes = $doc.InlineShapes
Write-Host "Tong so anh: $($shapes.Count)"
$docEnd = $doc.Content.End

for($i=1; $i -le [Math]::Min($shapes.Count,8); $i++){
    $s = $shapes.Item($i)
    $pos = $s.Range.Start
    $pct = [Math]::Round($pos / $docEnd * 100, 1)
    # Tim ten file
    try { $fn = $s.LinkFormat.SourceFullName } catch { $fn = "(embedded)" }
    Write-Host "  Anh $i : pos=$pos  ($pct% of doc)  $fn"
}

# Kiem tra xem co anh nao o phan cuoi doc (>90%) khong
$lateImages = 0
for($i=1; $i -le $shapes.Count; $i++){
    $pos = $shapes.Item($i).Range.Start
    $pct = $pos / $docEnd * 100
    if($pct -gt 90){ $lateImages++ }
}
Write-Host ""
Write-Host "So anh o phan cuoi (>90% doc): $lateImages"
if($lateImages -eq 0){ Write-Host "=> OK! Anh duoc phan bo deu khap tai lieu" }
else { Write-Host "=> LOI: $lateImages anh bi day xuong cuoi!" }

$doc.Close($false); $word.Quit()
