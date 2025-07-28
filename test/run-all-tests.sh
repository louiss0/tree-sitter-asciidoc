#!/bin/bash
# Test runner for tree-sitter-asciidoc corpus tests

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Tree-sitter AsciiDoc Test Suite"
echo "======================================"
echo

# Ensure grammar is generated
echo "Generating grammar..."
tree-sitter generate

echo
echo "Running corpus tests..."
echo "----------------------"

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run all corpus tests
for test_file in test/corpus/*.txt; do
    if [ -f "$test_file" ]; then
        filename=$(basename "$test_file")
        echo -n "Testing $filename... "
        
        if tree-sitter test -f "$test_file" > /dev/null 2>&1; then
            echo -e "${GREEN}PASSED${NC}"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}FAILED${NC}"
            ((FAILED_TESTS++))
            # Show error details
            echo -e "${YELLOW}Error details:${NC}"
            tree-sitter test -f "$test_file" 2>&1 | grep -A 5 -B 5 "Failed" || true
            echo
        fi
        ((TOTAL_TESTS++))
    fi
done

echo
echo "======================================"
echo "Test Summary"
echo "======================================"
echo "Total tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. ✗${NC}"
    exit 1
fi
