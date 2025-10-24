#!/bin/bash
pass_count=0
fail_count=0
segfault_count=0

for f in *.adoc; do
    timeout 2 tree-sitter parse "$f" > /tmp/parse_output.txt 2>&1
    exit_code=$?
    
    if [ $exit_code -eq 139 ] || [ $exit_code -eq 124 ]; then
        echo "SEGFAULT: $f"
        ((segfault_count++))
    elif [ $exit_code -eq 0 ]; then
        if grep -q "ERROR" /tmp/parse_output.txt; then
            echo "PARSE_ERROR: $f"
            ((fail_count++))
        else
            echo "PASS: $f"
            ((pass_count++))
        fi
    else
        echo "OTHER_ERROR: $f (exit code: $exit_code)"
        ((fail_count++))
    fi
done

echo ""
echo "Summary:"
echo "Passed: $pass_count"
echo "Parse errors: $fail_count"
echo "Segfaults: $segfault_count"
