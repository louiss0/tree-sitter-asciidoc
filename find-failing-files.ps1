# Find which test files have failures
$testFiles = Get-ChildItem "test\corpus\*.txt"

Write-Host "=== CHECKING INDIVIDUAL TEST FILES ===" -ForegroundColor Yellow
Write-Host ""

$failingFiles = @()

foreach ($file in $testFiles) {
    $fileName = $file.Name
    Write-Host "Checking $fileName..." -ForegroundColor Gray
    
    $result = npx tree-sitter test --file-name $fileName 2>&1
    if ($LASTEXITCODE -ne 0) {
        # Count failures
        $failures = ($result | Select-String "failures:" | Select-Object -Last 1).ToString()
        if ($failures -match "(\d+) failures:") {
            $failureCount = [int]$matches[1]
            if ($failureCount -gt 0) {
                $failingFiles += @{
                    "File" = $fileName
                    "Failures" = $failureCount
                }
                Write-Host "  ✗ $fileName: $failureCount failures" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  ✓ $fileName: All tests passing" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Yellow
Write-Host ""

if ($failingFiles.Count -gt 0) {
    Write-Host "Files with failures:" -ForegroundColor Red
    $totalFailures = 0
    foreach ($failing in $failingFiles | Sort-Object { $_.Failures } -Descending) {
        Write-Host "  $($failing.File): $($failing.Failures) failures" -ForegroundColor Red
        $totalFailures += $failing.Failures
    }
    Write-Host ""
    Write-Host "Total failing files: $($failingFiles.Count)" -ForegroundColor Red
    Write-Host "Total failures: $totalFailures" -ForegroundColor Red
} else {
    Write-Host "🎉 ALL TEST FILES PASSING! 🎉" -ForegroundColor Green
}
