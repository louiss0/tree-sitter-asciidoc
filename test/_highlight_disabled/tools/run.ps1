# Tree Sitter Highlighting Test Runner
param(
    [switch]$Update
)

$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$CASES_DIR = Join-Path $ROOT "test\highlight\cases"
$EXP_DIR = Join-Path $ROOT "test\highlight\expected"
$ACT_DIR = Join-Path $ROOT "test\highlight\.actual"

# Clean and create actual results directory
if (Test-Path $ACT_DIR) {
    Remove-Item $ACT_DIR -Recurse -Force
}
New-Item -Path $ACT_DIR -ItemType Directory -Force | Out-Null

$FAIL = $false

# Process each test case
Get-ChildItem "$CASES_DIR\*.adoc" | ForEach-Object {
    $base = $_.BaseName
    $out = Join-Path $ACT_DIR "$base.captures"
    $expected = Join-Path $EXP_DIR "$base.captures"
    
    Write-Host "Processing $base..."
    
    # Run tree-sitter query to get captures
    $queryPath = Join-Path $ROOT "queries\highlights.scm"
    try {
        $captures = tree-sitter query -c "$queryPath" "$($_.FullName)" 2>$null
        
        # Normalize whitespace for consistent diffs
        $normalizedCaptures = $captures -replace '^\s+', '' -replace '\s+', ' '
        $normalizedCaptures | Out-File -FilePath $out -Encoding UTF8
        
        if (-not (Test-Path $expected)) {
            Write-Host "Missing expected for $base; copying actual to expected to bootstrap."
            Copy-Item $out $expected
            continue
        }
        
        # Compare with expected results
        $actualContent = Get-Content $out -Raw
        $expectedContent = Get-Content $expected -Raw
        
        if ($actualContent -ne $expectedContent) {
            Write-Host "Mismatch: $base" -ForegroundColor Red
            Write-Host "Expected:" -ForegroundColor Yellow
            $expectedContent
            Write-Host "Actual:" -ForegroundColor Yellow
            $actualContent
            $FAIL = $true
        } else {
            Write-Host "OK $base" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Error processing $base : $_" -ForegroundColor Red
        $FAIL = $true
    }
}

if ($FAIL) {
    Write-Host "Some tests failed!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
}
