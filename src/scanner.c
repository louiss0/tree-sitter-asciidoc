#include <tree_sitter/parser.h>
#include <wctype.h>

// External token types (must match grammar.js externals)
enum {
    BLOCK_FENCE_START,
    BLOCK_FENCE_END, 
    TABLE_FENCE_START,
    TABLE_FENCE_END,
    LIST_CONTINUATION,
    AUTOLINK_BOUNDARY,
    ATTRIBUTE_LIST_START,
    _LIST_UNORDERED_MARKER, // "* " or "- " at start of line (hidden from AST)
    LIST_ORDERED_MARKER,    // "N. " at start of line
    DESCRIPTION_LIST_SEP,   // "::"
    CALLOUT_MARKER,        // "<N> " at start of line
    _SECTION_MARKER,       // "={1,6} " at start of line (hidden from AST)
    _ifdef_open_token,     // "ifdef::" at start of line
    _ifndef_open_token,    // "ifndef::" at start of line
    _ifeval_open_token,    // "ifeval::" at start of line
    _endif_directive_token // "endif::" at start of line
};

typedef struct {
    char fence_chars[5];
    uint8_t fence_length;
    uint8_t fence_count;
    bool at_line_start;
} Scanner;

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

// Skip whitespace except newlines
static void skip_spaces(TSLexer *lexer) {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
        skip(lexer);
    }
}

// Check if at start of line (only whitespace before)
static bool at_line_start(TSLexer *lexer) {
    return lexer->get_column(lexer) == 0;
}

// Scan for delimited block fences (====, ----, ...., ____, ****, ---, ++++)
static bool scan_block_fence_start(Scanner *scanner, TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    char fence_char = lexer->lookahead;
    if (fence_char != '=' && fence_char != '-' && fence_char != '.' && 
        fence_char != '_' && fence_char != '*' && fence_char != '+') {
        return false;
    }
    
    uint8_t count = 0;
    while (lexer->lookahead == fence_char && count < 255) {
        advance(lexer);
        count++;
    }
    
    // Must have at least 4 characters for valid fence
    if (count < 4) return false;
    
    // Store fence info for matching close
    scanner->fence_chars[0] = fence_char;
    scanner->fence_length = 1;
    scanner->fence_count = count;
    scanner->at_line_start = true;
    
    // Must be followed by end of line or attributes
    skip_spaces(lexer);
    if (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer)) {
        return true;
    }
    
    return false;
}

static bool scan_block_fence_end(Scanner *scanner, TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    if (scanner->fence_length == 0) return false;
    
    char expected_char = scanner->fence_chars[0];
    uint8_t count = 0;
    
    while (lexer->lookahead == expected_char) {
        advance(lexer);
        count++;
    }
    
    // Must match stored fence count and be at line end
    if (count >= scanner->fence_count) {
        skip_spaces(lexer);
        if (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer)) {
            // Clear fence state
            scanner->fence_length = 0;
            scanner->fence_count = 0;
            return true;
        }
    }
    
    return false;
}

// Scan for table fences |===
static bool scan_table_fence(TSLexer *lexer, bool is_start) {
    if (!at_line_start(lexer)) return false;
    
    skip_spaces(lexer);
    
    if (lexer->lookahead != '|') return false;
    advance(lexer);
    
    // Look for at least 3 equals signs
    uint8_t equals_count = 0;
    while (lexer->lookahead == '=') {
        advance(lexer);
        equals_count++;
    }
    
    if (equals_count < 3) return false;
    
    // Must be followed by line end
    skip_spaces(lexer);
    return (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer));
}

// Scan for list continuation (line with only '+')
static bool scan_list_continuation(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    skip_spaces(lexer);
    
    if (lexer->lookahead != '+') return false;
    advance(lexer);
    
    // Must be only '+' on the line
    skip_spaces(lexer);
    return (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer));
}

// Scan for autolink boundary (detect trailing punctuation)
static bool scan_autolink_boundary(TSLexer *lexer) {
    // Look for common trailing punctuation that shouldn't be part of URLs
    char c = lexer->lookahead;
    
    // These characters commonly follow URLs but aren't part of them
    if (c == '.' || c == ',' || c == ';' || c == ':' || 
        c == '!' || c == '?' || c == ')' || c == ']' || c == '}') {
        // Check if followed by space or line end (not part of URL)
        TSLexer temp = *lexer;
        temp.advance(&temp, false);
        if (temp.lookahead == ' ' || temp.lookahead == '\t' || 
            temp.lookahead == '\n' || temp.lookahead == '\r' || temp.eof(&temp)) {
            return true;
        }
    }
    
    return false;
}

// Scan for attribute list start [.role, [#id, etc.]
static bool scan_attribute_list_start(TSLexer *lexer) {
    if (lexer->lookahead != '[') return false;
    advance(lexer);
    
    // Look for common attribute patterns
    char c = lexer->lookahead;
    if (c == '.' || c == '#' || c == '%' || iswalpha(c)) {
        return true;
    }
    
    return false;
}

// Check if character is a digit
static bool is_digit(int32_t c) {
    return c >= '0' && c <= '9';
}

// Scan for unordered list marker: "* " or "- " at start of line
static bool scan_unordered_list_marker(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    if (lexer->lookahead == '*' || lexer->lookahead == '-') {
        advance(lexer);
        
        // Must be followed by whitespace
        if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
            advance(lexer);
            return true;
        }
    }
    return false;
}

// Scan for ordered list marker: "N. " at start of line
static bool scan_ordered_list_marker(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    // Must start with a digit
    if (!is_digit(lexer->lookahead)) {
        return false;
    }
    
    // Consume all digits
    while (is_digit(lexer->lookahead)) {
        advance(lexer);
    }
    
    // Must be followed by ". "
    if (lexer->lookahead == '.') {
        advance(lexer);
        if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
            advance(lexer);
            return true;
        }
    }
    
    return false;
}

// Scan for description list separator: "::"
static bool scan_description_list_sep(TSLexer *lexer) {
    if (lexer->lookahead == ':') {
        advance(lexer);
        if (lexer->lookahead == ':') {
            advance(lexer);
            
            // Must be followed by whitespace or end of line
            if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
                advance(lexer);
            }
            return true;
        }
    }
    return false;
}

// Scan for callout marker: "<N> " at start of line
static bool scan_callout_marker(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    if (lexer->lookahead == '<') {
        advance(lexer);
        
        // Must have at least one digit
        if (!is_digit(lexer->lookahead)) {
            return false;
        }
        
        // Consume all digits
        while (is_digit(lexer->lookahead)) {
            advance(lexer);
        }
        
        // Must be followed by "> "
        if (lexer->lookahead == '>') {
            advance(lexer);
            if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
                advance(lexer);
                return true;
            }
        }
    }
    
    return false;
}

// Scan for section marker: "={1,6} " at start of line
static bool scan_section_marker(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    if (lexer->lookahead == '=') {
        int count = 0;
        
        // Count consecutive = characters (1-6)
        while (lexer->lookahead == '=' && count < 6) {
            advance(lexer);
            count++;
        }
        
        // Must be followed by whitespace
        if (count >= 1 && count <= 6 && 
            (lexer->lookahead == ' ' || lexer->lookahead == '\t')) {
            advance(lexer);
            return true;
        }
    }
    
    return false;
}

// Simplified conditional scanners - use basic pattern matching
// Scan for ifdef directive: "ifdef::" at start of line
static bool scan_ifdef_open(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    // Match "ifdef::" literally - only advance if we're sure to succeed
    if (lexer->lookahead == 'i') {
        advance(lexer);
        if (lexer->lookahead == 'f') {
            advance(lexer);
            if (lexer->lookahead == 'd') {
                advance(lexer);
                if (lexer->lookahead == 'e') {
                    advance(lexer);
                    if (lexer->lookahead == 'f') {
                        advance(lexer);
                        if (lexer->lookahead == ':') {
                            advance(lexer);
                            if (lexer->lookahead == ':') {
                                advance(lexer);
                                // Found "ifdef::", consume rest of line
                                while (lexer->lookahead && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                                    advance(lexer);
                                }
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

// Temporarily disable ifndef to avoid crashes
static bool scan_ifndef_open(TSLexer *lexer) {
    return false;
}

// Temporarily disable ifeval to avoid conflicts - will fix this properly later
static bool scan_ifeval_open(TSLexer *lexer) {
    return false;
}

// Scan for endif directive: "endif::[]" at start of line
static bool scan_endif_directive(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    // Match "endif::[]" literally
    if (lexer->lookahead == 'e') {
        advance(lexer);
        if (lexer->lookahead == 'n') {
            advance(lexer);
            if (lexer->lookahead == 'd') {
                advance(lexer);
                if (lexer->lookahead == 'i') {
                    advance(lexer);
                    if (lexer->lookahead == 'f') {
                        advance(lexer);
                        if (lexer->lookahead == ':') {
                            advance(lexer);
                            if (lexer->lookahead == ':') {
                                advance(lexer);
                                if (lexer->lookahead == '[') {
                                    advance(lexer);
                                    if (lexer->lookahead == ']') {
                                        advance(lexer);
                                        // Found "endif::[]"
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

bool tree_sitter_asciidoc_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner *)payload;
    
    // Try high-priority line-anchored markers first
    if (valid_symbols[_SECTION_MARKER] && scan_section_marker(lexer)) {
        lexer->result_symbol = _SECTION_MARKER;
        return true;
    }
    
    // Conditional directives (high priority)
    if (valid_symbols[_ifdef_open_token] && scan_ifdef_open(lexer)) {
        lexer->result_symbol = _ifdef_open_token;
        return true;
    }
    
    if (valid_symbols[_ifndef_open_token] && scan_ifndef_open(lexer)) {
        lexer->result_symbol = _ifndef_open_token;
        return true;
    }
    
    if (valid_symbols[_ifeval_open_token] && scan_ifeval_open(lexer)) {
        lexer->result_symbol = _ifeval_open_token;
        return true;
    }
    
    if (valid_symbols[_endif_directive_token] && scan_endif_directive(lexer)) {
        lexer->result_symbol = _endif_directive_token;
        return true;
    }
    
    // List markers
    if (valid_symbols[_LIST_UNORDERED_MARKER] && scan_unordered_list_marker(lexer)) {
        lexer->result_symbol = _LIST_UNORDERED_MARKER;
        return true;
    }
    
    if (valid_symbols[LIST_ORDERED_MARKER] && scan_ordered_list_marker(lexer)) {
        lexer->result_symbol = LIST_ORDERED_MARKER;
        return true;
    }
    
    if (valid_symbols[CALLOUT_MARKER] && scan_callout_marker(lexer)) {
        lexer->result_symbol = CALLOUT_MARKER;
        return true;
    }
    
    if (valid_symbols[DESCRIPTION_LIST_SEP] && scan_description_list_sep(lexer)) {
        lexer->result_symbol = DESCRIPTION_LIST_SEP;
        return true;
    }
    
    // Original block fence handling
    if (valid_symbols[BLOCK_FENCE_START] && scan_block_fence_start(scanner, lexer)) {
        lexer->result_symbol = BLOCK_FENCE_START;
        return true;
    }
    
    if (valid_symbols[BLOCK_FENCE_END] && scan_block_fence_end(scanner, lexer)) {
        lexer->result_symbol = BLOCK_FENCE_END;
        return true;
    }
    
    if (valid_symbols[TABLE_FENCE_START] && scan_table_fence(lexer, true)) {
        lexer->result_symbol = TABLE_FENCE_START;
        return true;
    }
    
    if (valid_symbols[TABLE_FENCE_END] && scan_table_fence(lexer, false)) {
        lexer->result_symbol = TABLE_FENCE_END;
        return true;
    }
    
    if (valid_symbols[LIST_CONTINUATION] && scan_list_continuation(lexer)) {
        lexer->result_symbol = LIST_CONTINUATION;
        return true;
    }
    
    if (valid_symbols[AUTOLINK_BOUNDARY] && scan_autolink_boundary(lexer)) {
        lexer->result_symbol = AUTOLINK_BOUNDARY;
        return true;
    }
    
    if (valid_symbols[ATTRIBUTE_LIST_START] && scan_attribute_list_start(lexer)) {
        lexer->result_symbol = ATTRIBUTE_LIST_START;
        return true;
    }
    
    return false;
}

unsigned tree_sitter_asciidoc_external_scanner_serialize(void *payload, char *buffer) {
    Scanner *scanner = (Scanner *)payload;
    
    if (scanner->fence_length > 4) return 0; // Sanity check
    
    buffer[0] = scanner->fence_length;
    for (uint8_t i = 0; i < scanner->fence_length && i < 4; i++) {
        buffer[i + 1] = scanner->fence_chars[i];
    }
    buffer[5] = scanner->fence_count;
    buffer[6] = scanner->at_line_start ? 1 : 0;
    
    return 7;
}

void tree_sitter_asciidoc_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    Scanner *scanner = (Scanner *)payload;
    
    scanner->fence_length = 0;
    scanner->fence_count = 0;
    scanner->at_line_start = false;
    
    if (length >= 7) {
        scanner->fence_length = buffer[0];
        if (scanner->fence_length <= 4) {
            for (uint8_t i = 0; i < scanner->fence_length; i++) {
                scanner->fence_chars[i] = buffer[i + 1];
            }
            scanner->fence_count = buffer[5];
            scanner->at_line_start = buffer[6] != 0;
        } else {
            scanner->fence_length = 0;
        }
    }
}

void *tree_sitter_asciidoc_external_scanner_create() {
    Scanner *scanner = calloc(1, sizeof(Scanner));
    return scanner;
}

void tree_sitter_asciidoc_external_scanner_destroy(void *payload) {
    free(payload);
}
