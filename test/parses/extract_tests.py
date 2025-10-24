#!/usr/bin/env python3

import re
import os
from pathlib import Path

# List of files that cause segfaults
SEGFAULT_FILES = [
    "12_conditional_conflicts.txt",
    "15_anchors_footnotes_xrefs.txt",
    "16_admonitions.txt",
    "19_inline_formatting.txt",
    "20_inline_edge_cases.txt",
    "20_links_images.txt",
    "21_passthrough.txt",
    "22_macros_roles.txt",
    "23_inline_edge_cases.txt",
    "25_include_directives.txt",
    "26_index_terms.txt",
    "28_advanced_tables.txt",
]

CORPUS_DIR = Path("../corpus")
PARSE_DIR = Path(".")

def extract_test_cases(input_file, output_base):
    """Extract test cases from a corpus file."""
    test_num = 0
    state = "waiting"  # waiting, name, skip_separator, skip_blank, content
    test_name = ""
    test_content: list[str] = []

    def write_current():
        nonlocal test_num, test_content, test_name
        if not test_content:
            return
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', test_name.lower()) or "case"
        output_file = f"{output_base}_{test_num}_{safe_name}.adoc"
        # Join with newlines exactly as in input
        content_text = "\n".join(test_content)
        with open(output_file, 'w', encoding='utf-8') as out:
            out.write(content_text)
        print(f"Created: {output_file}")
        test_num += 1
        test_content = []

    with open(input_file, 'r', encoding='utf-8') as f:
        for raw_line in f:
            line = raw_line.rstrip('\n')

            # Check for test separator (80 equal signs)
            if line == "=" * 80:
                # If we were collecting content but didn't hit a dashed separator,
                # finalize the previous test now.
                if state == "content":
                    write_current()
                # Start new test or skip the second separator
                if state in ("waiting",):
                    state = "name"
                    test_name = ""
                    test_content = []
                elif state == "skip_separator":
                    state = "skip_blank"
                continue

            if state == "name":
                # This line is the test name
                test_name = line.strip()
                state = "skip_separator"
                continue

            if state == "skip_blank":
                # Skip blank line after second separator
                if not line.strip():
                    state = "content"
                continue

            if state == "content":
                # Check for end of content (line of dashes: --- or longer)
                if re.fullmatch(r'-{3,}', line):
                    write_current()
                    state = "waiting"
                else:
                    # Add line to content
                    test_content.append(line)
                continue

    # Save last test if we ended while in content (rare)
    if state == "content" and test_content:
        write_current()

def main():
    """Process all segfaulting corpus files."""
    for filename in SEGFAULT_FILES:
        print(f"Processing {filename}...")
        input_path = CORPUS_DIR / filename
        output_base = PARSE_DIR / filename.replace('.txt', '')
        
        if input_path.exists():
            extract_test_cases(input_path, str(output_base))
        else:
            print(f"  Warning: {input_path} not found")
    
    print("\nExtraction complete! Test files created in test/parses/")

if __name__ == "__main__":
    main()
