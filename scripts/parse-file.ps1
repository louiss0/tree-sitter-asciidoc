#!/usr/bin/env pwsh
# Debug parse script - parse a single file with tree-sitter

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

if (-not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"
    exit 1
}

Write-Host "Parsing file: $FilePath" -ForegroundColor Green
tree-sitter parse $FilePath
