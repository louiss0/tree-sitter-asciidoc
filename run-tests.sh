#!/usr/bin/env bash
# Workaround script to run tree-sitter tests in batches on Windows
# to avoid segfault when running all tests at once

echo "Running tree-sitter tests in batches..."
echo "========================================"

total_pass=0
total_fail=0
failed_files=()

for test_file in test/corpus/*.txt; do
    filename=$(basename "$test_file")
    echo -n "Testing $filename... "
    
    # Run test and capture output and exit code
    output=$(timeout 10 tree-sitter test --file-name "$filename" 2>&1)
    exit_code=$?
    
    # Check for segfault (exit code 139) or timeout (exit code 124)
    if [ $exit_code -eq 139 ]; then
        echo "✗ (SEGFAULT)"
        ((total_fail++))
        failed_files+=("$filename (segfault)")
    elif [ $exit_code -eq 124 ]; then
        echo "✗ (TIMEOUT)"
        ((total_fail++))
        failed_files+=("$filename (timeout)")
    elif [ $exit_code -ne 0 ]; then
        # Check if there are actual test failures in the output
        if echo "$output" | grep -q "failure"; then
            echo "✗ (test failures)"
            ((total_fail++))
            failed_files+=("$filename (test failures)")
        else
            echo "✗ (error)"
            ((total_fail++))
            failed_files+=("$filename (error)")
        fi
    else
        echo "✓"
        ((total_pass++))
    fi
done

echo ""
echo "========================================"
echo "Results: $total_pass passed, $total_fail failed"

if [ ${#failed_files[@]} -gt 0 ]; then
    echo ""
    echo "Failed test files:"
    for file in "${failed_files[@]}"; do
        echo "  - $file"
    done
    exit 1
else
    echo "All tests passed!"
    exit 0
fi
