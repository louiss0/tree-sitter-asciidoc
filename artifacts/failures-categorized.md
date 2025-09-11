# Failing Tests Categorization

Analysis of 21 failing tests, grouped by likely root cause:

## Category 1: Malformed Conditionals (3 tests)
Should be parsed as paragraphs instead of broken conditional blocks.

| Test # | Test Name | File | Issue |
|--------|-----------|------|-------|
| 48 | Malformed conditionals should be paragraphs | 12_conditional_conflicts.txt | `ifdef::attr[extra content after bracket]` parsed as conditional instead of paragraph |
| 53 | Simple inline ifdef | 13_inline_conditionals.txt | Inline conditional syntax issue |
| 54 | Block conditional with single line content | 13_inline_conditionals.txt | Single-line conditional parsing issue |

**Root Cause:** Scanner in `src/scanner.c` is too permissive in recognizing conditional directives. Grammar.js token patterns conflict with scanner implementation.

## Category 2: Delimited Blocks Fence Matching (3 tests)
Fence opening/closing not properly matched.

| Test # | Test Name | File | Issue |
|--------|-----------|------|-------|
| 57 | Listing block with content | 14_delimited_blocks.txt | Missing closing fence detection |
| 69 | Example block | 14_delimited_blocks.txt | Fence matching issue |
| 148 | Example block as continuation | 21_block_edge_cases.txt | List continuation with example blocks |

**Root Cause:** External scanner fence detection logic not properly tracking fence state and matching pairs.

## Category 3: Inline Formatting & Role Spans Precedence (6 tests)
Role spans and inline formatting precedence/attachment issues.

| Test # | Test Name | File | Issue |
|--------|-----------|------|-------|
| 84 | Adjacent inline elements | 15_anchors_footnotes_xrefs.txt | Role span attachment to adjacent elements |
| 86 | Malformed anchors should be plain text | 15_anchors_footnotes_xrefs.txt | Malformed inline constructs |
| 88 | Malformed footnotes should be plain text | 15_anchors_footnotes_xrefs.txt | Malformed footnote parsing |
| 136 | Role spans with complex attributes | 20_inline_edge_cases.txt | Complex role attribute parsing |
| 137 | Nested formatting edge cases | 20_inline_edge_cases.txt | Nested inline formatting precedence |
| 163 | Inline inside role span content | 23_inline_edge_cases.txt | Inline elements inside role spans |

**Root Cause:** Grammar precedence rules for inline elements not properly defined. Role span parsing too aggressive.

## Category 4: Block Admonitions with Metadata (3 tests)
Admonition blocks with delimited block types not properly parsed.

| Test # | Test Name | File | Issue |
|--------|-----------|------|-------|
| 111 | WARNING block with listing delimiters | 17_block_admonitions.txt | Admonition + listing block combo |
| 114 | TIP block with metadata | 17_block_admonitions.txt | Block metadata parsing |
| 117 | First note block | 17_block_admonitions.txt | Admonition block parsing |

**Root Cause:** Metadata parsing conflicts with admonition block recognition.

## Category 5: Macro vs Formatting Precedence (3 tests) 
Macros not getting proper precedence over inline formatting.

| Test # | Test Name | File | Issue |
|--------|-----------|------|-------|
| 138 | Macro and attribute edge cases | 20_inline_edge_cases.txt | UI macros vs formatting precedence |
| 160 | UI macros | 22_macros_roles.txt | UI macro parsing (`btn:`, `kbd:`, `menu:`) |
| 175 | Macro precedence over formatting | 23_inline_edge_cases.txt | Math macros vs superscript precedence |

**Root Cause:** Grammar precedence for macros too low. Macro tokens need higher precedence than formatting.

## Category 6: Complex Block Nesting (1 test)
Complex nested conditional blocks.

| Test # | Test Name | File | Issue |
|--------|-----------|------|-------|
| 149 | Conditional blocks with nesting | 21_block_edge_cases.txt | Nested conditionals with errors |

**Root Cause:** Complex conditional nesting with missing directives.

## Category 7: Role Span Edge Cases (1 test)
Role span attribute parsing edge cases.

| Test # | Test Name | File | Issue |
|--------|-----------|------|-------|
| 180 | Role span with dots in name | 23_inline_edge_cases.txt | Role names containing dots |

**Root Cause:** Role name pattern too restrictive.

## Category 8: Table Cell Specifications (1 test)
Table cell span/format specifications not parsing correctly.

| Test # | Test Name | File | Issue |
|--------|-----------|------|-------|
| 183 | Table with Cell Specifications - Spans and Formats | 24_tables.txt | Cell specs like `2+\|`, `^.^\|` not parsed |

**Root Cause:** Grammar rules for table cell specifications incomplete.

## Priority Order for Fixes:

1. **Conditionals** (3 tests) - Fundamental parsing logic, affects multiple categories
2. **Delimited Blocks** (3 tests) - Core block structure parsing 
3. **Inline Formatting** (6 tests) - Most failing tests, affects user experience
4. **Macros** (3 tests) - Important for AsciiDoc functionality
5. **Admonitions** (3 tests) - Block-level features
6. **Tables** (1 test) - Specific feature
7. **Complex Nesting** (1 test) - Edge case
8. **Role Edge Cases** (1 test) - Minor edge case

## Next Steps:

1. Fix conditional parsing in scanner.c and grammar.js
2. Implement proper delimited block fence matching
3. Redesign inline element precedence rules
4. Fix macro precedence over formatting
5. Address remaining edge cases
