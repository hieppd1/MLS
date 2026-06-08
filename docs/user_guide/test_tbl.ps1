# Test: xac dinh vi tri cursor sau Tables.Add trong WPS/Word COM
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
$doc = $word.Documents.Add(); $sel = $word.Selection

# --- Truoc bang ---
$sel.TypeText("=== TRUOC BANG ==="); $sel.TypeParagraph()
$startChar = $sel.Start
Write-Host "Truoc Tables.Add: Start=$($sel.Start) End=$($sel.End)"

# --- Tao bang 3 hang, 2 cot ---
$tbl = $doc.Tables.Add($sel.Range, 3, 2)
Write-Host "Sau Tables.Add: Start=$($sel.Start) End=$($sel.End)"
Write-Host "Table.Range: Start=$($tbl.Range.Start) End=$($tbl.Range.End)"

# Dien cell
$tbl.Cell(1,1).Range.Text = "H1"; $tbl.Cell(1,2).Range.Text = "H2"
$tbl.Cell(2,1).Range.Text = "A";  $tbl.Cell(2,2).Range.Text = "B"
$tbl.Cell(3,1).Range.Text = "C";  $tbl.Cell(3,2).Range.Text = "D"
Write-Host "Sau dien cell: Start=$($sel.Start) End=$($sel.End)"
Write-Host "Table.Range.End = $($tbl.Range.End)"

# --- Thu 1: MoveDown(5,$nr) ---
$nr = 3 # tong so hang
$selBefore = $sel.Start
$sel.MoveDown(5,$nr) | Out-Null
Write-Host "Sau MoveDown(5,$nr): Start=$($sel.Start) End=$($sel.End) (truoc=$selBefore, table.End=$($tbl.Range.End))"

# Reset cursor vao bang de thu cach 2
$tbl.Cell(3,2).Range.Select()

# --- Thu 2: sel.Start = tbl.Range.End ---
Write-Host "Sau Cell.Select: Start=$($sel.Start) End=$($sel.End)"
try {
    $sel.Start = $tbl.Range.End
    $sel.End   = $tbl.Range.End
    Write-Host "Sau sel.Start=tbl.End: Start=$($sel.Start) End=$($sel.End)"
} catch { Write-Host "SetStart FAILED: $($_.Exception.Message)" }

# --- Thu 3: SetRange ---
try {
    $sel.SetRange($tbl.Range.End, $tbl.Range.End)
    Write-Host "Sau SetRange: Start=$($sel.Start) End=$($sel.End)"
} catch { Write-Host "SetRange FAILED: $($_.Exception.Message)" }

$sel.TypeText("=== SAU BANG ==="); $sel.TypeParagraph()

$OUT = "D:\HiepPD\MLS\docs\user_guide\test_tbl_out.docx"
if(Test-Path $OUT){Remove-Item $OUT -Force}
$doc.SaveAs2($OUT, 16); $doc.Close($false); $word.Quit()
Write-Host "Saved: $OUT"
