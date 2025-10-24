#!/bin/bash

# Script to extract test cases from corpus files and create parse test files
# This is a workaround for Windows stack overflow issues in tree-sitter test

CORPUS_DIR="../corpus"
PARSE_DIR="."

# List of files that cause segfaults
SEGFAULT_FILES=(
    "12_conditional_conflicts.txt"
    "15_anchors_footnotes_xrefs.txt"
    "16_admonitions.txt"
    "19_inline_formatting.txt"
    "20_inline_edge_cases.txt"
    "20_links_images.txt"
    "21_passthrough.txt"
    "22_macros_roles.txt"
    "23_inline_edge_cases.txt"
    "25_include_directives.txt"
    "26_index_terms.txt"
    "28_advanced_tables.txt"
)

extract_test_cases() {
    local input_file="$1"
    local output_base="$2"
    local test_num=0
    local in_test=0
    local test_name=""
    local test_content=""
    
    while IFS= read -r line; do
        # Check for test separator
        if [[ "$line" == "================================================================================" ]]; then
            # Save previous test if exists
            if [[ $in_test -eq 2 && -n "$test_content" ]]; then
                local safe_name=$(echo "$test_name" | sed 's/[^a-zA-Z0-9_-]/_/g' | tr '[:upper:]' '[:lower:]')
                local output_file="${output_base}_${test_num}_${safe_name}.adoc"
                printf "%s" "$test_content" > "$output_file"
                echo "Created: $output_file"
                test_num=$((test_num + 1))
            fi
            
            # Start new test
            in_test=1
            test_content=""
            test_name=""
        elif [[ $in_test -eq 1 ]]; then
            # This is the test name line
            test_name="$line"
            in_test=2
        elif [[ $in_test -eq 2 ]]; then
            # Check for end of input section (separator line: --- or ------------------------...)
            if [[ "$line" =~ ^-{3,}$ ]]; then
                # End of test input section, skip until next test
                in_test=0
            else
                # Add line to test content (including empty lines)
                if [[ -n "$test_content" ]]; then
                    test_content="${test_content}"$'\n'"${line}"
                else
                    test_content="${line}"
                fi
            fi
        fi
    done < "$input_file"
    
    # Save last test if exists
    if [[ $in_test -eq 2 && -n "$test_content" ]]; then
        local safe_name=$(echo "$test_name" | sed 's/[^a-zA-Z0-9_-]/_/g' | tr '[:upper:]' '[:lower:]')
        local output_file="${output_base}_${test_num}_${safe_name}.adoc"
        printf "%s" "$test_content" > "$output_file"
        echo "Created: $output_file"
    fi
}

# Process each segfaulting file
for file in "${SEGFAULT_FILES[@]}"; do
    echo "Processing $file..."
    basename="${file%.txt}"
    extract_test_cases "${CORPUS_DIR}/${file}" "${PARSE_DIR}/${basename}"
done

echo ""
echo "Extraction complete! Test files created in test/parses/"
