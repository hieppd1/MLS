# Find which images are at end of document
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
$doc = $word.Documents.Open("D:\HiepPD\MLS\docs\User_Guide_MLS.docx")
$shapes = $doc.InlineShapes
$docEnd = $doc.Content.End
Write-Host "Total images: $($shapes.Count), docEnd=$docEnd"
for($i=1; $i -le $shapes.Count; $i++){
    $s = $shapes.Item($i)
    $pos = $s.Range.Start
    $pct = [Math]::Round($pos / $docEnd * 100, 1)
    if($pct -gt 85){
        $ctx = $doc.Range([Math]::Max(0,$pos-80), $pos).Text -replace "[\r\n]"," "
        Write-Host "Img $i : $pct%  ctx=...[$ctx]"
    }
}
$doc.Close($false); $word.Quit()
