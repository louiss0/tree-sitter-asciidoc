# Run all corpus tests individually since full suite crashes
$corpusFiles = Get-ChildItem -Path "test\corpus" -Name "*.txt"
$totalFiles = 0
$totalPassing = 0  
$totalFailing = 0
$results = @()

foreach ($file in $corpusFiles) {
    Write-Host "=== Testing $file ===" -ForegroundColor Yellow
    $result = tree-sitter test --file-name $file
    $totalFiles++
    
    # Extract passing/failing counts from output if possible
    if ($result -match "successful parses: (\d+); failed parses: (\d+)") {
        $passing = [int]$matches[1]
        $failing = [int]$matches[2]
        $totalPassing += $passing
        $totalFailing += $failing
        
        $results += [PSCustomObject]@{
            File = $file
            Passing = $passing
            Failing = $failing  
            Status = if ($failing -eq 0) { "✅ PASS" } else { "❌ FAIL" }
        }
    } else {
        $results += [PSCustomObject]@{
            File = $file
            Passing = "?"
            Failing = "?"
            Status = "⚠️ ERROR"
        }
    }
    
    Write-Host $result
    Write-Host ""
}

Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total files tested: $totalFiles"
Write-Host "Total passing tests: $totalPassing"  
Write-Host "Total failing tests: $totalFailing"
Write-Host "Overall success rate: $([math]::Round($totalPassing / ($totalPassing + $totalFailing) * 100, 2))%"

# Display results table
$results | Format-Table -AutoSize

# Save results to file
$results | ConvertTo-Json | Out-File "artifacts\test-results-summary.json" -Encoding UTF8
Write-Host "Detailed results saved to artifacts\test-results-summary.json"
