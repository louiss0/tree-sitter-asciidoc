#!/usr/bin/env pwsh
# Build parser with debug instrumentation enabled

Write-Host "Building parser with debug instrumentation..." -ForegroundColor Yellow

# Generate parser first
tree-sitter generate
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate parser"
    exit 1
}

# Build with DEBUG flag
$env:CFLAGS = "-DDEBUG"
tree-sitter build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build parser with debug flags"
    exit 1
}

Write-Host "Debug build complete!" -ForegroundColor Green
Write-Host "Use scripts/parse-file.ps1 to test parsing with debug output" -ForegroundColor Cyan
