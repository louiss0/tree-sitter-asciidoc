# AsciiDoc Highlight Query Testing Script for Windows PowerShell
# Wrapper around the Python validation script

param(
    [switch]$Verbose,
    [switch]$Help
)

if ($Help) {
    Write-Host "AsciiDoc Highlight Query Testing" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This script validates your AsciiDoc tree-sitter highlighting queries"
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\test-highlights.ps1 [-Verbose] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Verbose    Show detailed output"
    Write-Host "  -Help       Show this help message"
    Write-Host ""
    Write-Host "Requirements:"
    Write-Host "  - Python 3.6+ installed and in PATH"
    Write-Host "  - tree-sitter CLI (optional, for advanced validation)"
    Write-Host ""
    exit 0
}

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "🐍 Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found in PATH" -ForegroundColor Red
    Write-Host "   Please install Python 3.6+ and add it to your PATH" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "queries")) {
    Write-Host "❌ Error: queries/ directory not found" -ForegroundColor Red
    Write-Host "   Please run this script from the tree-sitter-asciidoc root directory" -ForegroundColor Yellow
    exit 1
}

# Build Python command arguments
$pythonArgs = @("test-highlights.py")
if ($Verbose) {
    $pythonArgs += "--verbose"
}

# Run the Python validation script
Write-Host "🚀 Starting AsciiDoc highlight validation..." -ForegroundColor Cyan
Write-Host ""

try {
    python @pythonArgs
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "🎉 Validation completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Test in Neovim: nvim tests/samples/all_features.adoc" -ForegroundColor White
        Write-Host "2. Check captures: :TSPlaygroundToggle" -ForegroundColor White
        Write-Host "3. Verify highlighting with your theme" -ForegroundColor White
    } else {
        Write-Host "⚠️  Validation found some issues (see above)" -ForegroundColor Yellow
        Write-Host "   These may be warnings rather than critical errors" -ForegroundColor Gray
    }
    
    exit $exitCode
} catch {
    Write-Host "❌ Error running validation script: $_" -ForegroundColor Red
    exit 1
}