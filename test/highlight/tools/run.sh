#!/usr/bin/env bash
set -euo pipefail

# Check for --update flag
UPDATE_MODE=false
if [[ "${1:-}" == "--update" ]]; then
    UPDATE_MODE=true
    echo "Running in update mode - will overwrite expected files"
fi

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CASES_DIR="$ROOT/test/highlight/cases"
EXP_DIR="$ROOT/test/highlight/expected"
ACT_DIR="$ROOT/test/highlight/.actual"

rm -rf "$ACT_DIR"
mkdir -p "$ACT_DIR"

FAIL=0

for f in "$CASES_DIR"/*.adoc; do
    if [ ! -f "$f" ]; then
        echo "No test cases found in $CASES_DIR"
        exit 1
    fi
    
    base="$(basename "$f" .adoc)"
    out="$ACT_DIR/$base.captures"
    expected="$EXP_DIR/$base.captures"
    
    echo "Processing $base..."
    
    # Run tree-sitter query to get captures
    tree-sitter query -c "$ROOT/queries/highlights.scm" "$f" 2>/dev/null \
        | sed 's/^[[:space:]]*//g' \
        | sed 's/[[:space:]]\+/ /g' \
        > "$out"

    if [ ! -f "$expected" ]; then
        echo "Missing expected for $base; copying actual to expected to bootstrap."
        cp "$out" "$expected"
        continue
    fi

    if [[ "$UPDATE_MODE" == "true" ]]; then
        echo "Updating expected for $base..."
        cp "$out" "$expected"
        echo "✓ $base (updated)"
    elif ! diff -u "$expected" "$out"; then
        echo "Mismatch: $base"
        FAIL=1
    else
        echo "✓ $base"
    fi
done

if [ $FAIL -eq 1 ]; then
    echo "Some tests failed!"
    exit 1
else
    echo "All tests passed!"
    exit 0
fi
