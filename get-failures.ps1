# Extract all failing test information
Write-Host "=== EXTRACTING FAILING TESTS ===" -ForegroundColor Yellow

$output = npx tree-sitter test 2>&1
$lines = $output -split "`n"

$failingTests = @()
$inFailureSection = $false
$currentTest = ""

foreach ($line in $lines) {
    # Look for test result lines with ✗
    if ($line -match "^\s+(\d+)\.\s+✗\s+(.+)$") {
        $testNum = $matches[1]
        $testName = $matches[2].Trim()
        $failingTests += @{
            "Number" = $testNum
            "Name" = $testName
        }
    }
}

Write-Host "Found $($failingTests.Count) failing tests:" -ForegroundColor Red
Write-Host ""

$categories = @{
    "Delimited Blocks" = @()
    "Inline/Formatting" = @()
    "Anchors/XRefs" = @()
    "Conditionals" = @()
    "Block Admonitions" = @()
    "Complex Edge Cases" = @()
    "Other" = @()
}

foreach ($test in $failingTests) {
    $name = $test.Name
    $num = $test.Number
    
    # Categorize tests
    if ($name -match "block|listing|example|delimited|nested") {
        $categories["Delimited Blocks"] += "$num. $name"
    }
    elseif ($name -match "role|span|macro|math|UI|formatting|inline|nested") {
        $categories["Inline/Formatting"] += "$num. $name"
    }
    elseif ($name -match "anchor|xref|footnote|cross-reference") {
        $categories["Anchors/XRefs"] += "$num. $name"
    }
    elseif ($name -match "conditional|ifdef|ifndef|ifeval") {
        $categories["Conditionals"] += "$num. $name"
    }
    elseif ($name -match "admonition|NOTE|TIP|WARNING|IMPORTANT|CAUTION") {
        $categories["Block Admonitions"] += "$num. $name"
    }
    elseif ($name -match "edge|complex|malformed|adjacent|nesting") {
        $categories["Complex Edge Cases"] += "$num. $name"
    }
    else {
        $categories["Other"] += "$num. $name"
    }
}

# Display categorized results
foreach ($category in $categories.Keys) {
    if ($categories[$category].Count -gt 0) {
        Write-Host "$category ($($categories[$category].Count)):" -ForegroundColor Cyan
        foreach ($test in $categories[$category]) {
            Write-Host "  $test" -ForegroundColor White
        }
        Write-Host ""
    }
}

Write-Host "TOTAL FAILING TESTS: $($failingTests.Count)" -ForegroundColor Red
