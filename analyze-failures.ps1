# Analyze test failures by category
$testOutput = npx tree-sitter test 2>&1 | Out-String

# Extract failure information
$failures = @()
$lines = $testOutput -split "`n"
$inFailureSection = $false
$currentFailure = ""

foreach ($line in $lines) {
    if ($line -match "^\s*\d+\.\s*(.+):$") {
        if ($currentFailure -ne "") {
            $failures += $currentFailure
        }
        $currentFailure = $matches[1].Trim()
        $inFailureSection = $true
    }
    elseif ($inFailureSection -and $line -match "^\s*\d+\.\s*") {
        # Start of next failure
        if ($currentFailure -ne "") {
            $failures += $currentFailure
        }
        $currentFailure = $line -replace "^\s*\d+\.\s*", ""
        $currentFailure = $currentFailure -replace ":$", ""
    }
}

if ($currentFailure -ne "") {
    $failures += $currentFailure
}

# Categorize failures
$categories = @{
    "Section Hierarchy" = @()
    "List Parsing" = @()
    "Inline Formatting" = @()
    "Delimited Blocks" = @()
    "Admonitions" = @()
    "Anchors/XRefs" = @()
    "Role Spans/Macros" = @()
    "Other" = @()
}

foreach ($failure in $failures) {
    $failure = $failure.Trim()
    if ($failure -eq "") { continue }
    
    # Categorization logic
    if ($failure -match "section|hierarchy|nesting|multiple sections|deep nesting") {
        $categories["Section Hierarchy"] += $failure
    }
    elseif ($failure -match "list|asterisk|hyphen|mixed.*list") {
        $categories["List Parsing"] += $failure
    }
    elseif ($failure -match "formatting|strong|emphasis|nested|role span|superscript|subscript") {
        $categories["Inline Formatting"] += $failure
    }
    elseif ($failure -match "block|delimited|listing|example|quote|sidebar") {
        $categories["Delimited Blocks"] += $failure
    }
    elseif ($failure -match "admonition|NOTE|TIP|WARNING|IMPORTANT|CAUTION") {
        $categories["Admonitions"] += $failure
    }
    elseif ($failure -match "anchor|xref|footnote|cross-reference") {
        $categories["Anchors/XRefs"] += $failure
    }
    elseif ($failure -match "role|macro|math|UI") {
        $categories["Role Spans/Macros"] += $failure
    }
    else {
        $categories["Other"] += $failure
    }
}

# Output categorized results
Write-Host "=== TEST FAILURE ANALYSIS ===" -ForegroundColor Yellow
Write-Host ""

foreach ($category in $categories.Keys) {
    if ($categories[$category].Count -gt 0) {
        Write-Host "$category ($($categories[$category].Count) failures):" -ForegroundColor Cyan
        foreach ($failure in $categories[$category]) {
            Write-Host "  - $failure" -ForegroundColor White
        }
        Write-Host ""
    }
}

Write-Host "Total failures: $($failures.Count)" -ForegroundColor Red
