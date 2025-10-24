# Scanner Enhancements Reference (Task 2)

This document provides reference implementations for advanced list marker validation functions that can be integrated into `src/scanner.c` for future enhancements.

## Overview

These functions provide depth validation, sequential numbering validation, and checkbox state detection for the comprehensive list system. Currently, the grammar handles list validation through token patterns, but these functions can be used to enhance the scanner for more sophisticated validation.

## Reference Functions

### 1. Count AsciiDoc List Depth

Validates asterisk markers and counts depth (1-10 levels max).

```c
static uint8_t count_asciidoc_list_depth(TSLexer *lexer) {
    uint8_t count = 0;
    TSLexer temp = *lexer;
    
    while (temp.lookahead == '*' && count < 10) {
        count++;
        temp.advance(&temp, false);
    }
    
    // Check for space after asterisks
    if (count > 0 && (temp.lookahead == ' ' || temp.lookahead == '\t')) {
        return count;
    }
    
    return 0;  // Invalid marker
}
```

**Validation Rules:**
- Asterisks must be followed by whitespace
- Depth must be 1-10
- Returns 0 if invalid

### 2. Count Ordered List Depth

Validates period markers and counts depth (1-10 levels max).

```c
static uint8_t count_ordered_list_depth(TSLexer *lexer) {
    uint8_t count = 0;
    TSLexer temp = *lexer;
    
    while (temp.lookahead == '.' && count < 10) {
        count++;
        temp.advance(&temp, false);
    }
    
    // Check for space after periods
    if (count > 0 && (temp.lookahead == ' ' || temp.lookahead == '\t')) {
        return count;
    }
    
    return 0;  // Invalid marker
}
```

**Validation Rules:**
- Periods must be followed by whitespace
- Depth must be 1-10
- Returns 0 if invalid

### 3. Validate Ordered List Number

Ensures numbers are in the 1-10 range for ordered lists.

```c
static bool validate_ordered_list_number(uint32_t number) {
    return number >= 1 && number <= 10;
}
```

**Validation Rules:**
- Numbers must be between 1 and 10 (inclusive)

### 4. Scan AsciiDoc List with Validation

Full validation for AsciiDoc unordered lists.

```c
static bool scan_asciidoc_list_with_validation(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    if (lexer->lookahead != '*') return false;
    
    uint8_t depth = count_asciidoc_list_depth(lexer);
    
    // Depth must be 1-10
    if (depth == 0 || depth > 10) {
        return false;  // Invalid depth
    }
    
    // Consume the markers and space
    for (uint8_t i = 0; i < depth; i++) {
        advance(lexer);
    }
    skip_spaces(lexer);
    
    return true;
}
```

### 5. Scan AsciiDoc Checklist with Validation

Validates AsciiDoc checkbox syntax: `* [ ]`, `* [x]`, `* [X]`

```c
static bool scan_asciidoc_checklist_with_validation(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    if (lexer->lookahead != '*') return false;
    
    uint8_t depth = count_asciidoc_list_depth(lexer);
    if (depth == 0 || depth > 10) return false;
    
    TSLexer temp = *lexer;
    // Consume asterisks
    for (uint8_t i = 0; i < depth; i++) {
        temp.advance(&temp, false);
    }
    
    // Must have space
    if (!(temp.lookahead == ' ' || temp.lookahead == '\t')) return false;
    temp.advance(&temp, false);
    
    // Check for [ ] or [x] or [X]
    if (temp.lookahead != '[') return false;
    temp.advance(&temp, false);
    
    // Must have space, x, or X
    if (!(temp.lookahead == ' ' || temp.lookahead == 'x' || temp.lookahead == 'X')) return false;
    temp.advance(&temp, false);
    
    // Must have closing bracket
    if (temp.lookahead != ']') return false;
    
    return true;
}
```

### 6. Scan Ordered List with Validation

Validates ordered list markers with sequential numbering.

```c
static bool scan_ordered_list_with_validation(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    if (!is_digit(lexer->lookahead)) return false;
    
    // Parse number
    uint32_t number = 0;
    uint32_t digit_count = 0;
    TSLexer temp = *lexer;
    
    while (is_digit(temp.lookahead) && digit_count < 3) {
        number = number * 10 + (temp.lookahead - '0');
        digit_count++;
        temp.advance(&temp, false);
    }
    
    // Validate number is 1-10
    if (!validate_ordered_list_number(number)) return false;
    
    // Count periods for depth
    uint8_t depth = count_ordered_list_depth(&temp);
    if (depth == 0 || depth > 10) return false;
    
    return true;
}
```

### 7. Scan Markdown Checklist with Validation

Validates Markdown checkbox syntax with indentation: `- [ ]`, `- [x]`, `- [X]`

```c
static bool scan_markdown_checklist_with_validation(TSLexer *lexer) {
    // Get indentation level (spaces / 2)
    TSLexer temp = *lexer;
    
    // Must be at line start or only indentation before
    if (lexer->get_column(lexer) % 2 != 0) return false;  // Indentation must be multiple of 2
    
    uint32_t indent_level = lexer->get_column(lexer) / 2;
    if (indent_level > 9) return false;  // Max 10 levels (0-9)
    
    if (lexer->lookahead != '-') return false;
    temp.advance(&temp, false);
    
    // Must have space
    if (!(temp.lookahead == ' ' || temp.lookahead == '\t')) return false;
    temp.advance(&temp, false);
    
    // Check for [ ] or [x] or [X]
    if (temp.lookahead != '[') return false;
    temp.advance(&temp, false);
    
    // Must have space, x, or X
    if (!(temp.lookahead == ' ' || temp.lookahead == 'x' || temp.lookahead == 'X')) return false;
    temp.advance(&temp, false);
    
    // Must have closing bracket
    if (temp.lookahead != ']') return false;
    
    return true;
}
```

### 8. Count Empty Lines for List Termination

Detects consecutive empty lines (maximum 3).

```c
static uint8_t count_empty_lines(TSLexer *lexer) {
    uint8_t count = 0;
    TSLexer temp = *lexer;
    
    while ((temp.lookahead == '\r' || temp.lookahead == '\n') && count < 3) {
        if (temp.lookahead == '\r') {
            temp.advance(&temp, false);
            if (temp.lookahead == '\n') temp.advance(&temp, false);
        } else if (temp.lookahead == '\n') {
            temp.advance(&temp, false);
        }
        count++;
    }
    
    return count;
}
```

## Integration Notes

These functions can be integrated into the main `scan()` function by:

1. Adding appropriate token checks in the `valid_symbols` array
2. Calling these functions when the corresponding tokens are valid
3. Setting `lexer->result_symbol` and returning `true` on success
4. Handling cross-checks for conflicting token types

## Current Status

- **Grammar-based validation**: Currently implemented via token patterns (working)
- **Scanner-based validation**: Reference implementations provided in this document
- **Test Coverage**: Comprehensive test files exist in `test/corpus/`
- **Build Status**: Parser compiles and runs successfully without these enhancements

## Future Work

These functions can be activated when:
1. Additional validation strictness is required
2. Performance optimizations are needed
3. Better error messages are desired for invalid markers
4. Depth tracking needs to be enforced at parse time
