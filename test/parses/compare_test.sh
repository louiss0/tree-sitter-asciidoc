#!/bin/bash

# Compare actual parse output with expected output from corpus
# Usage: ./compare_test.sh <test_file.adoc>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <test_file.adoc>"
    exit 1
fi

TEST_FILE="$1"
BASE_NAME=$(basename "$TEST_FILE" .adoc)

# Extract the corpus file name and test number from the test filename
# Format: NN_name_N_testname.adoc
CORPUS_FILE=$(echo "$BASE_NAME" | sed -E 's/^([0-9]+_[^_]+)_.*/\1.txt/')
CORPUS_PATH="../corpus/$CORPUS_FILE"

if [ ! -f "$CORPUS_PATH" ]; then
    echo "Error: Corpus file not found: $CORPUS_PATH"
    exit 1
fi

# Get the test input
echo "=== TEST INPUT ==="
cat "$TEST_FILE"
echo ""

# Get expected output from corpus file
echo "=== EXPECTED OUTPUT (from corpus) ==="
# Find the test case in corpus file by matching the input content
INPUT_CONTENT=$(cat "$TEST_FILE")
# This is complex - for now just show the corpus file section
# We'll improve this later
echo "(Extract from $CORPUS_PATH - manual inspection needed)"
echo ""

# Get actual output
echo "=== ACTUAL OUTPUT ==="
if timeout 2 tree-sitter parse "$TEST_FILE" 2>&1; then
    echo ""
    echo "✓ Parse succeeded"
else
    EXIT_CODE=$?
    echo ""
    if [ $EXIT_CODE -eq 139 ]; then
        echo "✗ SEGFAULT"
    elif [ $EXIT_CODE -eq 124 ]; then
        echo "✗ TIMEOUT"
    else
        echo "✗ Failed with exit code $EXIT_CODE"
    fi
fi
