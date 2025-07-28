#!/bin/bash

# Automated Code Review Script for tree-sitter-asciidoc
# This script runs various checks to ensure code quality and standards compliance

set -e

echo "======================================"
echo "Running Automated Code Review"
echo "======================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track overall status
REVIEW_PASSED=true

# Function to print colored status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        REVIEW_PASSED=false
    fi
}

# Function to print warnings
print_warning() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $1"
}

echo "1. Running Tree Sitter Tests"
echo "----------------------------"
if tree-sitter test > /tmp/test-results.txt 2>&1; then
    print_status 0 "All tests passed"
    # Check for slow parse warnings
    if grep -q "Slow parse rate" /tmp/test-results.txt; then
        print_warning "Some tests have slow parse rates"
        grep "Slow parse rate" /tmp/test-results.txt | head -5
    fi
else
    print_status 1 "Tests failed"
    cat /tmp/test-results.txt
fi
echo ""

echo "2. Checking Grammar Generation"
echo "------------------------------"
if tree-sitter generate > /dev/null 2>&1; then
    print_status 0 "Grammar generates successfully"
else
    print_status 1 "Grammar generation failed"
fi
echo ""

echo "3. Checking for TODO/FIXME Comments"
echo "-----------------------------------"
TODO_COUNT=$(grep -c "TODO\|FIXME\|XXX\|HACK" grammar.js 2>/dev/null || echo "0")
if [ "$TODO_COUNT" -eq 0 ]; then
    print_status 0 "No TODO/FIXME comments found"
else
    print_warning "Found $TODO_COUNT TODO/FIXME comments"
    grep -n "TODO\|FIXME\|XXX\|HACK" grammar.js | head -5
fi
echo ""

echo "4. Checking for Debug Statements"
echo "--------------------------------"
if grep -q "console\.log\|debug" grammar.js 2>/dev/null; then
    DEBUG_COUNT=$(grep -c "console\.log\|debug" grammar.js)
    print_status 1 "Found $DEBUG_COUNT debug statements"
    grep -n "console\.log\|debug" grammar.js | head -5
else
    print_status 0 "No debug statements found"
fi
echo ""

echo "5. Checking File Consistency"
echo "----------------------------"
# Check if generated files are up to date
tree-sitter generate > /dev/null 2>&1
if git diff --quiet src/parser.c src/grammar.json src/node-types.json; then
    print_status 0 "Generated files are up to date"
else
    print_status 1 "Generated files need to be regenerated"
    echo "Run 'tree-sitter generate' and commit the changes"
fi
echo ""

echo "6. Checking Grammar Structure"
echo "-----------------------------"
# Check for common naming convention issues
UPPERCASE_RULES=$(grep -E "^[[:space:]]*[A-Z_]+:" grammar.js | grep -v "^[[:space:]]*[A-Z_]+:" | wc -l || echo "0")
if [ "$UPPERCASE_RULES" -eq 0 ]; then
    print_status 0 "Token naming conventions followed"
else
    print_warning "Some rules might not follow naming conventions"
fi
echo ""

echo "7. Performance Analysis"
echo "-----------------------"
# Run a simple performance test
echo "Running performance test on sample files..."
if [ -f "test/corpus/text-formatting.txt" ]; then
    PARSE_TIME=$(tree-sitter parse test/corpus/text-formatting.txt 2>&1 | grep -oE "[0-9.]+ ms" | head -1 || echo "N/A")
    echo "Parse time for text-formatting corpus: $PARSE_TIME"
fi
echo ""

echo "8. Test Coverage Summary"
echo "------------------------"
if [ -d "test/corpus" ]; then
    TEST_FILES=$(find test/corpus -name "*.txt" | wc -l)
    echo "Total test corpus files: $TEST_FILES"
    for file in test/corpus/*.txt; do
        if [ -f "$file" ]; then
            TEST_COUNT=$(grep -c "^===========" "$file" 2>/dev/null || echo "0")
            echo "  - $(basename "$file"): $TEST_COUNT tests"
        fi
    done
fi
echo ""

echo "======================================"
echo "Code Review Summary"
echo "======================================"
if [ "$REVIEW_PASSED" = true ]; then
    echo -e "${GREEN}✓ All automated checks passed!${NC}"
    echo "Please proceed with manual review using CODE-REVIEW-CHECKLIST.adoc"
else
    echo -e "${RED}✗ Some checks failed. Please address the issues above.${NC}"
fi
echo ""

# Clean up
rm -f /tmp/test-results.txt

exit 0
