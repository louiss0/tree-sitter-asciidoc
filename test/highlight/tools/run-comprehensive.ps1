#!/usr/bin/env pwsh
# Comprehensive AsciiDoc Highlight Test Runner
# Tests all enhanced highlight features

param(
    [switch]$Update,      # Update expected captures
    [switch]$Verbose,     # Show detailed output
    [switch]$OnlyNew,     # Only test new enhanced files
    [string]$Filter       # Filter test files by pattern
)

$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow" 
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorText($Text, $Color) {
    Write-Host $Text -ForegroundColor $Color
}

function Write-Header($Text) {
    Write-Host ""
    Write-ColorText ("=" * 60) $Colors.Header
    Write-ColorText $Text $Colors.Header
    Write-ColorText ("=" * 60) $Colors.Header
}

# Get project root
$ProjectRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.FullName
$TestDir = Join-Path (Join-Path $ProjectRoot "test") "highlight"
$CasesDir = Join-Path $TestDir "cases"
$ExpectedDir = Join-Path $TestDir "expected"
$ActualDir = Join-Path $TestDir ".actual"

Write-Header "AsciiDoc Comprehensive Highlight Tests"

# Ensure directories exist
if (!(Test-Path $ActualDir)) {
    New-Item -ItemType Directory -Path $ActualDir | Out-Null
}

# Define test files
$AllTestFiles = @(
    # Existing files
    "headings.adoc",
    "attributes.adoc", 
    "paragraphs.adoc",
    "lists.adoc",
    "conditionals.adoc",
    "comprehensive.adoc"
)

$NewEnhancedFiles = @(
    # New comprehensive test files
    "attributes-enhanced.adoc",
    "conditional-directives.adoc",
    "delimited-blocks.adoc", 
    "tables-advanced.adoc",
    "lists-enhanced.adoc",
    "inline-formatting.adoc",
    "links-anchors.adoc",
    "macros.adoc",
    "math.adoc"
)

# Select files to test
if ($OnlyNew) {
    $TestFiles = $NewEnhancedFiles
    Write-ColorText "Testing only new enhanced files" $Colors.Info
} else {
    $TestFiles = $AllTestFiles + $NewEnhancedFiles
    Write-ColorText "Testing all files (existing + new)" $Colors.Info
}

# Apply filter if specified
if ($Filter) {
    $TestFiles = $TestFiles | Where-Object { $_ -like "*$Filter*" }
    Write-ColorText "Filtered to: $($TestFiles -join ', ')" $Colors.Info
}

Write-ColorText "Testing $($TestFiles.Count) file(s)" $Colors.Info

# Check for tree-sitter
$TreeSitterCmd = $null
if (Get-Command "tree-sitter" -ErrorAction SilentlyContinue) {
    $TreeSitterCmd = "tree-sitter"
} elseif (Test-Path "node_modules/.bin/tree-sitter.cmd") {
    $TreeSitterCmd = "node_modules/.bin/tree-sitter.cmd"
} else {
    Write-ColorText "tree-sitter CLI not found. Install with: npm install -g tree-sitter-cli" $Colors.Warning
    exit 1
}

Write-ColorText "Using tree-sitter: $TreeSitterCmd" $Colors.Success

# Test results tracking
$TestResults = @{
    Passed = @()
    Failed = @()
    Updated = @()
    NewFiles = @()
}

# Process each test file
foreach ($TestFile in $TestFiles) {
    $CasePath = Join-Path $CasesDir $TestFile
    $ExpectedPath = Join-Path $ExpectedDir ($TestFile.Replace('.adoc', '.captures'))
    $ActualPath = Join-Path $ActualDir ($TestFile.Replace('.adoc', '.captures'))
    
    Write-Host ""
    Write-ColorText "Testing: $TestFile" $Colors.Info
    
    if (!(Test-Path $CasePath)) {
        Write-ColorText "Test case not found: $CasePath" $Colors.Error
        $TestResults.Failed += $TestFile
        continue
    }

    # Run tree-sitter query
    try {
        Push-Location $ProjectRoot
        
        $QueryFile = Join-Path (Join-Path $ProjectRoot "queries") "highlights.scm"
        
        # Run tree-sitter query with captures
        $CaptureOutput = & $TreeSitterCmd query --captures "$QueryFile" "$CasePath" 2>&1 | Out-String
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorText "tree-sitter query failed for $TestFile" $Colors.Error
            if ($Verbose) {
                Write-ColorText $CaptureOutput $Colors.Error
            }
            $TestResults.Failed += $TestFile
            continue
        }

        # Clean up and normalize output
        $CleanOutput = $CaptureOutput.Trim() -replace '\r\n', "`n" -replace '\r', "`n"
        
        # Add file path header to match expected format
        $FinalOutput = "$CasePath`n$CleanOutput"
        
        # Write actual output
        Set-Content -Path $ActualPath -Value $FinalOutput -Encoding UTF8

        if ($Update -or !(Test-Path $ExpectedPath)) {
            # Update or create expected file
            Copy-Item $ActualPath $ExpectedPath
            if (Test-Path $ExpectedPath) {
                Write-ColorText "Updated expected captures for $TestFile" $Colors.Warning
                $TestResults.Updated += $TestFile
            } else {
                Write-ColorText "Created expected captures for $TestFile" $Colors.Success
                $TestResults.NewFiles += $TestFile
            }
        } else {
            # Compare with expected
            $Expected = Get-Content $ExpectedPath -Raw
            $Actual = Get-Content $ActualPath -Raw
            
            if ($Expected -eq $Actual) {
                Write-ColorText "PASS - Captures match expected" $Colors.Success
                $TestResults.Passed += $TestFile
            } else {
                Write-ColorText "FAIL - Captures don't match expected" $Colors.Error
                $TestResults.Failed += $TestFile
                
                if ($Verbose) {
                    Write-ColorText "Expected file: $ExpectedPath" $Colors.Info
                    Write-ColorText "Actual file: $ActualPath" $Colors.Info
                    Write-ColorText "Use -Update to update expected captures" $Colors.Info
                }
            }
        }
        
    } catch {
        Write-ColorText "Error processing $TestFile : $_" $Colors.Error
        $TestResults.Failed += $TestFile
    } finally {
        Pop-Location
    }
}

# Summary
Write-Header "Test Results Summary"

if ($TestResults.Passed.Count -gt 0) {
    Write-ColorText "PASSED ($($TestResults.Passed.Count)): $($TestResults.Passed -join ', ')" $Colors.Success
}

if ($TestResults.Updated.Count -gt 0) {
    Write-ColorText "UPDATED ($($TestResults.Updated.Count)): $($TestResults.Updated -join ', ')" $Colors.Warning
}

if ($TestResults.NewFiles.Count -gt 0) {
    Write-ColorText "NEW FILES ($($TestResults.NewFiles.Count)): $($TestResults.NewFiles -join ', ')" $Colors.Success
}

if ($TestResults.Failed.Count -gt 0) {
    Write-ColorText "FAILED ($($TestResults.Failed.Count)): $($TestResults.Failed -join ', ')" $Colors.Error
}

$TotalTests = $TestFiles.Count
$TotalPassed = $TestResults.Passed.Count + $TestResults.Updated.Count + $TestResults.NewFiles.Count

Write-Host ""
Write-ColorText "Overall: $TotalPassed/$TotalTests tests successful" $(if ($TestResults.Failed.Count -eq 0) { $Colors.Success } else { $Colors.Warning })

# Coverage info
Write-Host ""
Write-ColorText "Enhanced Coverage Summary:" $Colors.Info
Write-ColorText "   • Block fences and delimited blocks" $Colors.Info
Write-ColorText "   • Conditional directives (ifdef/ifndef/ifeval)" $Colors.Info
Write-ColorText "   • Advanced table specifications" $Colors.Info
Write-ColorText "   • Enhanced list markers and continuations" $Colors.Info
Write-ColorText "   • Comprehensive macro highlighting" $Colors.Info
Write-ColorText "   • Inline formatting with roles" $Colors.Info
Write-ColorText "   • Links, anchors, and cross-references" $Colors.Info
Write-ColorText "   • Math expressions (stem/latex/asciimath)" $Colors.Info
Write-ColorText "   • Enhanced attribute handling" $Colors.Info

Write-Host ""
if ($TestResults.Failed.Count -eq 0) {
    Write-ColorText "All tests passed! AsciiDoc highlighting is working excellently." $Colors.Success
    exit 0
} else {
    Write-ColorText "Some tests failed. Use -Verbose for details, -Update to refresh expected captures." $Colors.Warning
    exit 1
}