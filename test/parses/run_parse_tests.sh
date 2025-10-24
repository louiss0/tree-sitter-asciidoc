#!/bin/bash

# Test runner for parse-based tests
# This script tests that all extracted test cases can be parsed without errors

cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

total=0
passed=0
failed=0
errors=()

echo "Running parse tests..."
echo "====================="
echo ""

# Test each .adoc file
for file in *.adoc; do
    if [[ ! -f "$file" ]]; then
        continue
    fi
    
    total=$((total + 1))
    
    # Run tree-sitter parse and capture output
    output=$(tree-sitter parse "$file" 2>&1)
    result=$?
    
    # Check if parse succeeded (exit code 0 and output contains source_file)
    if [[ $result -eq 0 ]] && echo "$output" | grep -q "(source_file"; then
        echo -e "${GREEN}✓${NC} $file"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗${NC} $file"
        failed=$((failed + 1))
        errors+=("$file")
        
        # Show first few lines of error for debugging
        if [[ $result -ne 0 ]]; then
            echo "  Exit code: $result"
        fi
        if ! echo "$output" | grep -q "(source_file"; then
            echo "  Output didn't contain valid parse tree"
            echo "$output" | head -3 | sed 's/^/  /'
        fi
    fi
done

echo ""
echo "====================="
echo "Test Summary"
echo "====================="
echo -e "Total:  $total"
echo -e "${GREEN}Passed: $passed${NC}"

if [[ $failed -gt 0 ]]; then
    echo -e "${RED}Failed: $failed${NC}"
    echo ""
    echo "Failed tests:"
    for error in "${errors[@]}"; do
        echo -e "  ${RED}✗${NC} $error"
    done
    exit 1
else
    echo -e "${YELLOW}Failed: $failed${NC}"
    echo ""
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
