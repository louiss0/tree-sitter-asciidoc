#include <tree_sitter/parser.h>
#include <wctype.h>
#include <stdio.h>

// Debug logging - disabled for normal operation
#ifdef DEBUG_DISABLED_FOR_NOW
#define DEBUG_LOG(fmt, ...) fprintf(stderr, "[SCANNER] " fmt "\n", ##__VA_ARGS__)
#else
#define DEBUG_LOG(fmt, ...) do { } while (0)
#endif

// External token types (must match grammar.js externals)
enum {
    TABLE_FENCE_START,
    TABLE_FENCE_END,
    EXAMPLE_FENCE_START,    // ====
    EXAMPLE_FENCE_END,
    LISTING_FENCE_START,    // ----
    LISTING_FENCE_END,
    LITERAL_FENCE_START,    // ....
    LITERAL_FENCE_END,
    QUOTE_FENCE_START,      // ____
    QUOTE_FENCE_END,
    SIDEBAR_FENCE_START,    // ****
    SIDEBAR_FENCE_END,
    PASSTHROUGH_FENCE_START, // ++++
    PASSTHROUGH_FENCE_END,
    OPENBLOCK_FENCE_START,  // --
    OPENBLOCK_FENCE_END,
    LIST_CONTINUATION,
    AUTOLINK_BOUNDARY,
    ATTRIBUTE_LIST_START,
    DELIMITED_BLOCK_CONTENT_LINE, // Content line within delimited blocks (not fence end)
    _LIST_UNORDERED_MARKER, // "* " or "- " at start of line (hidden from AST)
    _LIST_ORDERED_MARKER,   // "N. " at start of line (hidden from AST)
    DESCRIPTION_LIST_SEP,   // "::"
    _DESCRIPTION_LIST_ITEM, // "term:: description" pattern (hidden from AST)
    CALLOUT_MARKER,        // "<N> " at start of line
    _ifdef_open_token,     // "ifdef::" at start of line
    _ifndef_open_token,    // "ifndef::" at start of line
    _ifeval_open_token,    // "ifeval::" at start of line
    _endif_directive_token // "endif::" at start of line
};

typedef struct {
    char fence_chars[5];
    uint8_t fence_length;
    uint8_t fence_count;
    uint8_t fence_type;    // Store which type of fence we're in
    bool at_line_start;
    // List state tracking
    bool in_unordered_list;
    bool in_ordered_list;
    char last_unordered_marker; // '*' or '-'
    bool list_block_consumed;   // Track if we've consumed a list block
} Scanner;

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }


// Skip whitespace except newlines
static void skip_spaces(TSLexer *lexer) {
    uint32_t count = 0;
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
        if (++count > 1000) break; // Prevent infinite loops
        skip(lexer);
    }
}

// Check if at start of line (only whitespace before)
static bool at_line_start(TSLexer *lexer) {
    return lexer->get_column(lexer) == 0;
}

// Map fence characters to token types
static int get_fence_start_token(char fence_char, uint8_t count) {
    switch (fence_char) {
        case '=': return EXAMPLE_FENCE_START;
        case '-': 
            if (count == 2) return OPENBLOCK_FENCE_START;  // -- for open blocks
            else return LISTING_FENCE_START;               // ---- for listing blocks
        case '.': return LITERAL_FENCE_START;
        case '_': return QUOTE_FENCE_START;
        case '*': return SIDEBAR_FENCE_START;
        case '+': return PASSTHROUGH_FENCE_START;
        default: return -1;
    }
}

static int get_fence_end_token(char fence_char, uint8_t count) {
    switch (fence_char) {
        case '=': return EXAMPLE_FENCE_END;
        case '-': 
            if (count == 2) return OPENBLOCK_FENCE_END;
            else return LISTING_FENCE_END;
        case '.': return LITERAL_FENCE_END;
        case '_': return QUOTE_FENCE_END;
        case '*': return SIDEBAR_FENCE_END;
        case '+': return PASSTHROUGH_FENCE_END;
        default: return -1;
    }
}

// Scan for delimited block fences (====, ----, ...., ____, ****, --, ++++)
static bool scan_block_fence_start(Scanner *scanner, TSLexer *lexer) {
    DEBUG_LOG("scan_block_fence_start: checking at column %d, char='%c'", lexer->get_column(lexer), lexer->lookahead);
    if (!at_line_start(lexer)) {
        DEBUG_LOG("scan_block_fence_start: not at line start, skipping");
        return false;
    }
    
    char fence_char = lexer->lookahead;
    if (fence_char != '=' && fence_char != '-' && fence_char != '.' && 
        fence_char != '_' && fence_char != '*' && fence_char != '+') {
        return false;
    }
    
    uint8_t count = 0;
    uint32_t loop_count = 0;
    while (lexer->lookahead == fence_char && count < 255) {
        if (++loop_count > 500) break; // Prevent infinite loops
        advance(lexer);
        count++;
    }
    
    // Different minimum counts for different fence types
    uint8_t min_count = 4; // All fences use 4+ chars except open blocks with exactly 2
    uint8_t max_count = 50; // Reasonable maximum to prevent tree-sitter test separators from being parsed as fences
    
    if (fence_char == '-') {
        // Open blocks use exactly 2, listing blocks use 4+
        if (count == 2) {
            min_count = 2;
        } else if (count < 4) {
            return false; // 3 dashes not valid (avoids tree-sitter test separators)
        }
    }
    
    if (count < min_count || count > max_count) return false;
    
    // Store fence info for matching close
    scanner->fence_chars[0] = fence_char;
    scanner->fence_length = 1;
    scanner->fence_count = count;
    scanner->fence_type = get_fence_start_token(fence_char, count);
    scanner->at_line_start = true;
    DEBUG_LOG("scan_block_fence_start: matched fence '%c' x%d, type=%d", fence_char, count, scanner->fence_type);
    if (fence_char == '-' && count >= 4) {
        DEBUG_LOG("LISTING_FENCE_START: stored fence_count=%d, fence_type=%d", scanner->fence_count, scanner->fence_type);
    }
    
    // Must be followed by end of line or attributes
    skip_spaces(lexer);
    if (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer)) {
        // Include the newline as part of the fence token
        if (lexer->lookahead == '\r') {
            advance(lexer);
            if (lexer->lookahead == '\n') advance(lexer);
        } else if (lexer->lookahead == '\n') {
            advance(lexer);
        }
        return true;
    }
    
    return false;
}

static bool scan_block_fence_end(Scanner *scanner, TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    if (scanner->fence_length == 0) return false;
    
    char expected_char = scanner->fence_chars[0];
    uint8_t count = 0;
    
    if (expected_char == '-' && scanner->fence_count >= 4) {
        DEBUG_LOG("LISTING_FENCE_END: checking for '%c' x%d at column %d, found '%c'", expected_char, scanner->fence_count, lexer->get_column(lexer), lexer->lookahead);
    }
    
    uint32_t loop_count = 0;
    while (lexer->lookahead == expected_char) {
        if (++loop_count > 500) break; // Prevent infinite loops
        advance(lexer);
        count++;
    }
    
    // Must match stored fence count and be at line end
    // Allow more chars than the opening fence, but require at least the same count
    if (count >= scanner->fence_count) {
        skip_spaces(lexer);
        if (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer)) {
            if (scanner->fence_chars[0] == '-' && scanner->fence_count >= 4) {
                DEBUG_LOG("LISTING_FENCE_END: SUCCESS! Found %d chars, clearing fence state", count);
            }
            // Include the newline as part of the fence token
            if (lexer->lookahead == '\r') {
                advance(lexer);
                if (lexer->lookahead == '\n') advance(lexer);
            } else if (lexer->lookahead == '\n') {
                advance(lexer);
            }
            // Clear fence state
            scanner->fence_length = 0;
            scanner->fence_count = 0;
            scanner->fence_type = 0;
            return true;
        } else {
            if (scanner->fence_chars[0] == '-' && scanner->fence_count >= 4) {
                DEBUG_LOG("LISTING_FENCE_END: FAIL - not at line end, found char '%c' (code %d)", lexer->lookahead, (int)lexer->lookahead);
            }
        }
    } else {
        if (scanner->fence_chars[0] == '-' && scanner->fence_count >= 4) {
            DEBUG_LOG("LISTING_FENCE_END: FAIL - count mismatch, found %d, needed %d", count, scanner->fence_count);
        }
    }
    
    return false;
}

// Scan for table fences |===
static bool scan_table_fence(TSLexer *lexer, bool is_start) {
    DEBUG_LOG("scan_table_fence: checking %s fence at column %d, char='%c'", is_start ? "start" : "end", lexer->get_column(lexer), lexer->lookahead);
    if (!at_line_start(lexer)) {
        DEBUG_LOG("scan_table_fence: not at line start, skipping");
        return false;
    }
    
    // Don't skip spaces - table fences must start with | at BOL
    // skip_spaces(lexer);
    
    if (lexer->lookahead != '|') return false;
    advance(lexer);
    
    // Look for at least 3 equals signs
    uint8_t equals_count = 0;
    uint32_t loop_count = 0;
    while (lexer->lookahead == '=') {
        if (++loop_count > 100) break; // Prevent infinite loops
        advance(lexer);
        equals_count++;
    }
    
    if (equals_count < 3) return false;
    
    // Must be followed by line end
    skip_spaces(lexer);
    if (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer)) {
        // Include the newline as part of the fence token like other fence scanners
        if (lexer->lookahead == '\r') {
            advance(lexer);
            if (lexer->lookahead == '\n') advance(lexer);
        } else if (lexer->lookahead == '\n') {
            advance(lexer);
        }
        return true;
    }
    
    return false;
}

// Scan for list continuation (line with only '+')
static bool scan_list_continuation(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    skip_spaces(lexer);
    
    if (lexer->lookahead != '+') return false;
    advance(lexer);
    
    // Must be only '+' on the line
    skip_spaces(lexer);
    if (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer)) {
        // Consume the newline as part of the list continuation token
        if (lexer->lookahead == '\r') {
            advance(lexer);
            if (lexer->lookahead == '\n') advance(lexer);
        } else if (lexer->lookahead == '\n') {
            advance(lexer);
        }
        return true;
    }
    return false;
}

// Scan for content line within delimited blocks - only when fence is open
static bool scan_delimited_block_content_line(Scanner *scanner, TSLexer *lexer) {
    // Only valid when we have an open fence
    if (scanner->fence_length == 0) {
        return false;
    }
    
    // Must be at start of line
    if (!at_line_start(lexer)) {
        return false;
    }
    
    // Check if this line would be a fence end - if so, don't consume it
    // We need to peek ahead without consuming to see if this is a fence end
    TSLexer temp = *lexer;
    char expected_char = scanner->fence_chars[0];
    uint8_t count = 0;
    
    // Count repeated characters at start of line
    uint32_t loop_count = 0;
    while (temp.lookahead == expected_char && count < 255) {
        if (++loop_count > 500) break; // Prevent infinite loops
        temp.advance(&temp, false);
        count++;
    }
    
    // If this looks like a fence end (enough chars + line end), don't consume it
    if (count >= scanner->fence_count) {
        // Skip trailing spaces
        while (temp.lookahead == ' ' || temp.lookahead == '\t') {
            temp.advance(&temp, false);
        }
        // If at line end, this is a fence end line - don't consume
        if (temp.lookahead == '\n' || temp.lookahead == '\r' || temp.eof(&temp)) {
            return false;
        }
    }
    // This is not a fence end line, consume the entire line as content
    uint32_t char_count = 0;
    while (lexer->lookahead && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
        if (++char_count > 10000) break; // Prevent infinite loops
        advance(lexer);
    }
    
    // Include the newline
    if (lexer->lookahead == '\r') {
        advance(lexer);
        if (lexer->lookahead == '\n') advance(lexer);
    } else if (lexer->lookahead == '\n') {
        advance(lexer);
    }
    
    return true;
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
// IMPORTANT: Be conservative to avoid conflicting with inline role spans
static bool scan_attribute_list_start(TSLexer *lexer) {
    if (lexer->lookahead != '[') return false;
    
    // Only match attribute lists that are clearly block attributes
    // This avoids conflicts with inline role spans like [.role]#text#
    
    // For now, we'll be very conservative and only match at line start
    // or after whitespace (indicating block attributes)
    if (!at_line_start(lexer)) {
        // Not at line start, so this might be an inline role span
        // Let the grammar handle it instead
        return false;
    }
    
    advance(lexer);
    
    // Look for common attribute patterns - be more conservative
    char c = lexer->lookahead;
    if (c == '.' || c == '#' || c == '%') {
        // These are clear attribute indicators at line start
        return true;
    }
    
    // For alphabetic characters, be very conservative
    if (iswalpha(c)) {
        // Only match if it's at line start and looks like block attributes
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
        
        // Must be followed by whitespace, but don't consume it - leave for grammar
        if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
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
    
    // Must be followed by ". " but only consume the dot, leave space for grammar
    if (lexer->lookahead == '.') {
        advance(lexer);
        if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
            return true;
        }
    }
    
    return false;
}

// Scan for entire unordered list block (consecutive * or - items)
static bool scan_unordered_list_block(Scanner *scanner, TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    // Must start with unordered marker
    if (lexer->lookahead != '*' && lexer->lookahead != '-') {
        return false;
    }
    
    char marker = lexer->lookahead;
    bool consumed_any = false;
    
    // Consume all consecutive unordered list items with same or compatible markers
    while (at_line_start(lexer) && (lexer->lookahead == '*' || lexer->lookahead == '-')) {
        // For mixed markers, we accept both * and - as valid
        char current_marker = lexer->lookahead;
        advance(lexer);
        
        // Must be followed by whitespace
        if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
            advance(lexer);
            
            // Consume rest of line (list item content)
            while (lexer->lookahead && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                advance(lexer);
            }
            
            // Consume newline
            if (lexer->lookahead == '\r') advance(lexer);
            if (lexer->lookahead == '\n') advance(lexer);
            
            consumed_any = true;
            
            // Skip blank lines between list items
            while (lexer->lookahead == '\r' || lexer->lookahead == '\n') {
                advance(lexer);
            }
            
        } else {
            // Not a valid list marker, stop here
            break;
        }
    }
    
    if (consumed_any) {
        scanner->in_unordered_list = true;
        scanner->last_unordered_marker = marker;
        scanner->list_block_consumed = true;
        return true;
    }
    
    return false;
}

// Scan for entire ordered list block (consecutive numbered items)
static bool scan_ordered_list_block(Scanner *scanner, TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    // Must start with digit
    if (!is_digit(lexer->lookahead)) {
        return false;
    }
    
    bool consumed_any = false;
    
    // Consume all consecutive ordered list items
    while (at_line_start(lexer) && is_digit(lexer->lookahead)) {
        // Consume digits
        while (is_digit(lexer->lookahead)) {
            advance(lexer);
        }
        
        // Must be followed by ". "
        if (lexer->lookahead == '.') {
            advance(lexer);
            if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
                advance(lexer);
                
                // Consume rest of line (list item content)
                while (lexer->lookahead && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                    advance(lexer);
                }
                
                // Consume newline
                if (lexer->lookahead == '\r') advance(lexer);
                if (lexer->lookahead == '\n') advance(lexer);
                
                consumed_any = true;
                
                // Skip blank lines between list items
                while (lexer->lookahead == '\r' || lexer->lookahead == '\n') {
                    advance(lexer);
                }
                
            } else {
                // Not a valid list marker, stop here
                break;
            }
        } else {
            // Not a valid list marker, stop here
            break;
        }
    }
    
    if (consumed_any) {
        scanner->in_ordered_list = true;
        scanner->list_block_consumed = true;
        return true;
    }
    
    return false;
}

// Scan for description list separator: "::"
// Very restrictive - only match as part of a proper description list item
static bool scan_description_list_sep(TSLexer *lexer) {
    // This should only match :: that are clearly part of description list syntax
    // We'll be very conservative to avoid false positives in regular text
    if (lexer->lookahead == ':') {
        advance(lexer);
        if (lexer->lookahead == ':') {
            advance(lexer);
            
            // Must be followed by whitespace (required for description lists)
            if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
                // Additional check: make sure we're not at start of line with just ::
                // This prevents matching lines like ":: starts with double colon"
                advance(lexer);
                return true;
            }
        }
    }
    return false;
}

// Scan for description list item: "term:: description" at start of line
// Very restrictive - only match clear description list patterns
static bool scan_description_list_item(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    // Skip leading whitespace
    skip_spaces(lexer);
    
    // For a valid description list term, we need:
    // 1. A single word or short phrase (no spaces or very few)
    // 2. Followed by exactly :: and then space  
    // 3. This helps distinguish from sentences that happen to contain ::
    // 4. Terms should not contain common article words or sentence starters
    
    // Look for a term - be very conservative about what we accept
    int char_count = 0;
    int space_count = 0;
    bool has_alpha = false;
    
    // Store the term to check for common sentence patterns
    char term_buffer[100] = {0};
    int term_pos = 0;
    
    uint32_t loop_count = 0;
    while (lexer->lookahead && lexer->lookahead != ':' && 
           lexer->lookahead != '\r' && lexer->lookahead != '\n') {
        
        // Prevent infinite loops
        if (++loop_count > 1000) return false;
        
        if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
            space_count++;
            // If we have too many spaces, this is probably a sentence, not a term
            if (space_count > 2) return false;  // Even more restrictive
            if (term_pos < 99) term_buffer[term_pos++] = ' ';
        } else if (iswalpha(lexer->lookahead) || lexer->lookahead == '_' || 
                   lexer->lookahead == '-' || is_digit(lexer->lookahead)) {
            has_alpha = true;
            // Convert to lowercase manually for comparison
            char c = (char)lexer->lookahead;
            if (c >= 'A' && c <= 'Z') c = c + ('a' - 'A');
            if (term_pos < 99) term_buffer[term_pos++] = c;
        } else {
            // Other characters that might appear in description list terms
            // but be careful about punctuation that suggests a sentence
            if (lexer->lookahead == '.' || lexer->lookahead == ',' || 
                lexer->lookahead == ';' || lexer->lookahead == '!') {
                // These suggest a sentence rather than a term
                return false;
            }
            if (term_pos < 99) term_buffer[term_pos++] = (char)lexer->lookahead;
        }
        
        char_count++;
        // Shorter terms are more likely to be actual description list terms
        if (char_count > 30) return false;  // More restrictive
        
        advance(lexer);
    }
    
    // Must have some alphanumeric content and not be too short or too long
    if (!has_alpha || char_count < 1 || char_count > 30) return false;
    
    // Check for common sentence starters/patterns that suggest this isn't a term
    if (term_pos >= 5) {  // Only check if we have enough characters
        // Check for common sentence starters - simple prefix matching
        if ((term_buffer[0] == 's' && term_buffer[1] == 'o' && 
             term_buffer[2] == 'm' && term_buffer[3] == 'e' && term_buffer[4] == ' ') ||
            (term_buffer[0] == 't' && term_buffer[1] == 'h' && 
             term_buffer[2] == 'e' && term_buffer[3] == ' ') ||
            (term_buffer[0] == 't' && term_buffer[1] == 'h' && 
             term_buffer[2] == 'i' && term_buffer[3] == 's' && term_buffer[4] == ' ') ||
            (term_buffer[0] == 't' && term_buffer[1] == 'h' && 
             term_buffer[2] == 'a' && term_buffer[3] == 't' && term_buffer[4] == ' ')) {
            return false;
        }
    }
    
    // Must be followed by exactly "::"
    if (lexer->lookahead == ':') {
        advance(lexer);
        if (lexer->lookahead == ':') {
            advance(lexer);
            
            // Must be followed by whitespace (required for description lists)
            if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
                advance(lexer);
                // Consume the rest of the line as description with loop guard
                uint32_t desc_count = 0;
                while (lexer->lookahead && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                    if (++desc_count > 10000) break; // Prevent infinite loops
                    advance(lexer);
                }
                return true;
            }
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
        
        // Consume all digits with loop guard
        uint32_t digit_count = 0;
        while (is_digit(lexer->lookahead)) {
            if (++digit_count > 20) return false; // Prevent infinite loops
            advance(lexer);
        }
        
        // Must be followed by "> " but only consume ">", leave space for grammar
        if (lexer->lookahead == '>') {
            advance(lexer);
            if (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
                return true;
            }
        }
    }
    
    return false;
}



// Strict conditional scanners - require proper bracket syntax
// Scan for ifdef directive: "ifdef::" at start of line with proper brackets
static bool scan_ifdef_open(TSLexer *lexer) {
    DEBUG_LOG("scan_ifdef_open: checking at column %d, char='%c'", lexer->get_column(lexer), lexer->lookahead);
    if (!at_line_start(lexer)) {
        DEBUG_LOG("scan_ifdef_open: not at line start, skipping");
        return false;
    }
    
    // Save lexer state so we can backtrack if validation fails
    TSLexer temp = *lexer;
    
    // Match "ifdef::" literally
    if (temp.lookahead == 'i') {
        temp.advance(&temp, false);
        if (temp.lookahead == 'f') {
            temp.advance(&temp, false);
            if (temp.lookahead == 'd') {
                temp.advance(&temp, false);
                if (temp.lookahead == 'e') {
                    temp.advance(&temp, false);
                    if (temp.lookahead == 'f') {
                        temp.advance(&temp, false);
                        if (temp.lookahead == ':') {
                            temp.advance(&temp, false);
                            if (temp.lookahead == ':') {
                                temp.advance(&temp, false);
                                
                                // Now validate the rest of the line has proper bracket syntax
                                // Pattern: optional_attributes '[' optional_content ']' optional_whitespace end_of_line
                                
                                // Skip optional attributes before the bracket (should be valid identifiers)
                                while (temp.lookahead && temp.lookahead != '[' && temp.lookahead != '\n' && temp.lookahead != '\r') {
                                    // Validate that pre-bracket content contains only valid attribute name characters
                                    if (temp.lookahead != ' ' && temp.lookahead != '\t' && 
                                        !((temp.lookahead >= 'a' && temp.lookahead <= 'z') ||
                                          (temp.lookahead >= 'A' && temp.lookahead <= 'Z') ||
                                          (temp.lookahead >= '0' && temp.lookahead <= '9') ||
                                          temp.lookahead == '_' || temp.lookahead == '-' || temp.lookahead == ',')) {
                                        return false;  // Invalid character in attribute section
                                    }
                                    temp.advance(&temp, false);
                                }
                                
                                // Must have opening bracket
                                if (temp.lookahead != '[') return false;
                                temp.advance(&temp, false);
                                
                                // Validate content inside brackets - should be empty or contain only comma-separated attribute names
                                // Track if we're currently in an attribute name or between attributes
                                bool in_attribute_name = false;
                                while (temp.lookahead && temp.lookahead != ']' && temp.lookahead != '\n' && temp.lookahead != '\r') {
                                    if ((temp.lookahead >= 'a' && temp.lookahead <= 'z') ||
                                        (temp.lookahead >= 'A' && temp.lookahead <= 'Z') ||
                                        (temp.lookahead >= '0' && temp.lookahead <= '9') ||
                                        temp.lookahead == '_' || temp.lookahead == '-') {
                                        // Valid attribute name character
                                        in_attribute_name = true;
                                    } else if (temp.lookahead == ',') {
                                        // Comma separator between attributes
                                        in_attribute_name = false;
                                    } else if (temp.lookahead == ' ' || temp.lookahead == '\t') {
                                        // Spaces are only allowed between attribute names (after comma)
                                        if (in_attribute_name) {
                                            return false;  // Space in the middle of an attribute name
                                        }
                                    } else {
                                        return false;  // Invalid character inside brackets
                                    }
                                    temp.advance(&temp, false);
                                }
                                
                                // Must have closing bracket
                                if (temp.lookahead != ']') return false;
                                temp.advance(&temp, false);
                                
                                // Skip trailing whitespace
                                uint32_t space_count = 0;
                                while (temp.lookahead == ' ' || temp.lookahead == '\t') {
                                    if (++space_count > 1000) break; // Prevent infinite loops
                                    temp.advance(&temp, false);
                                }
                                
                                // Must be at end of line
                                if (temp.lookahead != '\n' && temp.lookahead != '\r' && !temp.eof(&temp)) {
                                    return false;
                                }
                                
                                // Validation passed - commit the changes by consuming the entire line
                                uint32_t line_count = 0;
                                while (lexer->lookahead && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                                    if (++line_count > 10000) break; // Prevent infinite loops
                                    advance(lexer);
                                }
                                DEBUG_LOG("scan_ifdef_open: successfully matched ifdef directive");
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

// Scan for ifndef directive: "ifndef::" at start of line with proper brackets
static bool scan_ifndef_open(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    // Save lexer state so we can backtrack if validation fails
    TSLexer temp = *lexer;
    
    // Match "ifndef::" literally
    if (temp.lookahead == 'i') {
        temp.advance(&temp, false);
        if (temp.lookahead == 'f') {
            temp.advance(&temp, false);
            if (temp.lookahead == 'n') {
                temp.advance(&temp, false);
                if (temp.lookahead == 'd') {
                    temp.advance(&temp, false);
                    if (temp.lookahead == 'e') {
                        temp.advance(&temp, false);
                        if (temp.lookahead == 'f') {
                            temp.advance(&temp, false);
                            if (temp.lookahead == ':') {
                                temp.advance(&temp, false);
                                if (temp.lookahead == ':') {
                                    temp.advance(&temp, false);
                                    
                                    // Now validate the rest of the line has proper bracket syntax
                                    // Skip optional attributes before the bracket (should be valid identifiers)
                                    uint32_t pre_bracket_count = 0;
                                    while (temp.lookahead && temp.lookahead != '[' && temp.lookahead != '\n' && temp.lookahead != '\r') {
                                        if (++pre_bracket_count > 1000) break; // Prevent infinite loops
                                        // Validate that pre-bracket content contains only valid attribute name characters
                                        if (temp.lookahead != ' ' && temp.lookahead != '\t' && 
                                            !((temp.lookahead >= 'a' && temp.lookahead <= 'z') ||
                                              (temp.lookahead >= 'A' && temp.lookahead <= 'Z') ||
                                              (temp.lookahead >= '0' && temp.lookahead <= '9') ||
                                              temp.lookahead == '_' || temp.lookahead == '-' || temp.lookahead == ',')) {
                                            return false;  // Invalid character in attribute section
                                        }
                                        temp.advance(&temp, false);
                                    }
                                    
                                    // Must have opening bracket
                                    if (temp.lookahead != '[') return false;
                                    temp.advance(&temp, false);
                                    
                                    // Validate content inside brackets - should be empty or contain only comma-separated attribute names
                                    // Track if we're currently in an attribute name or between attributes
                                    bool in_attribute_name = false;
                                    uint32_t bracket_count = 0;
                                    while (temp.lookahead && temp.lookahead != ']' && temp.lookahead != '\n' && temp.lookahead != '\r') {
                                        if (++bracket_count > 1000) break; // Prevent infinite loops
                                        if ((temp.lookahead >= 'a' && temp.lookahead <= 'z') ||
                                            (temp.lookahead >= 'A' && temp.lookahead <= 'Z') ||
                                            (temp.lookahead >= '0' && temp.lookahead <= '9') ||
                                            temp.lookahead == '_' || temp.lookahead == '-') {
                                            // Valid attribute name character
                                            in_attribute_name = true;
                                        } else if (temp.lookahead == ',') {
                                            // Comma separator between attributes
                                            in_attribute_name = false;
                                        } else if (temp.lookahead == ' ' || temp.lookahead == '\t') {
                                            // Spaces are only allowed between attribute names (after comma)
                                            if (in_attribute_name) {
                                                return false;  // Space in the middle of an attribute name
                                            }
                                        } else {
                                            return false;  // Invalid character inside brackets
                                        }
                                        temp.advance(&temp, false);
                                    }
                                    
                                    // Must have closing bracket
                                    if (temp.lookahead != ']') return false;
                                    temp.advance(&temp, false);
                                    
                                    // Skip trailing whitespace
                                    uint32_t space_count = 0;
                                    while (temp.lookahead == ' ' || temp.lookahead == '\t') {
                                        if (++space_count > 1000) break; // Prevent infinite loops
                                        temp.advance(&temp, false);
                                    }
                                    
                                    // Must be at end of line
                                    if (temp.lookahead != '\n' && temp.lookahead != '\r' && !temp.eof(&temp)) {
                                        return false;
                                    }
                                    
                                    // Validation passed - commit the changes by consuming the entire line
                                    uint32_t line_count = 0;
                                    while (lexer->lookahead && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                                        if (++line_count > 10000) break; // Prevent infinite loops
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
    }
    return false;
}

// Scan for ifeval directive: "ifeval::" at start of line with proper brackets
static bool scan_ifeval_open(TSLexer *lexer) {
    if (!at_line_start(lexer)) return false;
    
    // Save lexer state so we can backtrack if validation fails
    TSLexer temp = *lexer;
    
    // Match "ifeval::" literally
    if (temp.lookahead == 'i') {
        temp.advance(&temp, false);
        if (temp.lookahead == 'f') {
            temp.advance(&temp, false);
            if (temp.lookahead == 'e') {
                temp.advance(&temp, false);
                if (temp.lookahead == 'v') {
                    temp.advance(&temp, false);
                    if (temp.lookahead == 'a') {
                        temp.advance(&temp, false);
                        if (temp.lookahead == 'l') {
                            temp.advance(&temp, false);
                            if (temp.lookahead == ':') {
                                temp.advance(&temp, false);
                                if (temp.lookahead == ':') {
                                    temp.advance(&temp, false);
                                    
                                    // Now validate the rest of the line has proper bracket syntax
                                    // Skip any whitespace before the bracket
                                    uint32_t ws_count = 0;
                                    while (temp.lookahead == ' ' || temp.lookahead == '\t') {
                                        if (++ws_count > 1000) break; // Prevent infinite loops
                                        temp.advance(&temp, false);
                                    }
                                    
                                    // Must have opening bracket
                                    if (temp.lookahead != '[') return false;
                                    temp.advance(&temp, false);
                                    
                                    // Validate content inside brackets - ifeval can contain expressions
                                    // Allow most characters for expressions, but still require proper closing
                                    uint32_t expr_count = 0;
                                    while (temp.lookahead && temp.lookahead != ']' && temp.lookahead != '\n' && temp.lookahead != '\r') {
                                        if (++expr_count > 1000) break; // Prevent infinite loops
                                        temp.advance(&temp, false);
                                    }
                                    
                                    // Must have closing bracket
                                    if (temp.lookahead != ']') return false;
                                    temp.advance(&temp, false);
                                    
                                    // Skip trailing whitespace
                                    uint32_t space_count = 0;
                                    while (temp.lookahead == ' ' || temp.lookahead == '\t') {
                                        if (++space_count > 1000) break; // Prevent infinite loops
                                        temp.advance(&temp, false);
                                    }
                                    
                                    // Must be at end of line
                                    if (temp.lookahead != '\n' && temp.lookahead != '\r' && !temp.eof(&temp)) {
                                        return false;
                                    }
                                    
                                    // Validation passed - commit the changes by consuming the entire line
                                    uint32_t line_count = 0;
                                    while (lexer->lookahead && lexer->lookahead != '\r' && lexer->lookahead != '\n') {
                                        if (++line_count > 10000) break; // Prevent infinite loops
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
    }
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
    
    
    // LIST_CONTINUATION has highest priority - check first before other tokens consume input
    if (valid_symbols[LIST_CONTINUATION] && scan_list_continuation(lexer)) {
        lexer->result_symbol = LIST_CONTINUATION;
        return true;
    }
    
    // Stateful delimited block fence handling (high priority)
    // Check for fence end first when we have an open fence
    if (scanner->fence_length > 0) {
        int end_token = get_fence_end_token(scanner->fence_chars[0], scanner->fence_count);
        if (scanner->fence_chars[0] == '-' && scanner->fence_count >= 4) {
            DEBUG_LOG("LISTING_MAIN: fence_chars[0]='%c', fence_count=%d, looking for end_token=%d, valid=%s, at col=%d", 
                     scanner->fence_chars[0], scanner->fence_count, end_token, 
                     (end_token != -1 && valid_symbols[end_token]) ? "YES" : "NO",
                     lexer->get_column(lexer));
        }
        if (end_token != -1 && valid_symbols[end_token]) {
            if (scan_block_fence_end(scanner, lexer)) {
                if (scanner->fence_chars[0] == '-' && end_token == LISTING_FENCE_END) {
                    DEBUG_LOG("LISTING_MAIN: SUCCESS - returning LISTING_FENCE_END token");
                }
                lexer->result_symbol = end_token;
                return true;
            }
        }
        
        // When fence is open, check for delimited block content lines
        // This must come after fence end check to ensure fence ends take priority
        if (valid_symbols[DELIMITED_BLOCK_CONTENT_LINE] && scan_delimited_block_content_line(scanner, lexer)) {
            lexer->result_symbol = DELIMITED_BLOCK_CONTENT_LINE;
            return true;
        }
    }
    
    // Check for fence start when no fence is open
    if (scanner->fence_length == 0) {
        // Try each fence type if valid
        if ((valid_symbols[EXAMPLE_FENCE_START] || valid_symbols[LISTING_FENCE_START] || 
             valid_symbols[LITERAL_FENCE_START] || valid_symbols[QUOTE_FENCE_START] ||
             valid_symbols[SIDEBAR_FENCE_START] || valid_symbols[PASSTHROUGH_FENCE_START] ||
             valid_symbols[OPENBLOCK_FENCE_START]) && scan_block_fence_start(scanner, lexer)) {
            int start_token = scanner->fence_type;
            if (start_token != -1 && valid_symbols[start_token]) {
                if (scanner->fence_chars[0] == '-' && start_token == LISTING_FENCE_START) {
                    DEBUG_LOG("LISTING_MAIN: SUCCESS - returning LISTING_FENCE_START token, fence_count=%d", scanner->fence_count);
                }
                lexer->result_symbol = start_token;
                return true;
            }
        }
    }
    
    // Table fence handling - needs high priority to prevent conflicts
    if (valid_symbols[TABLE_FENCE_START] && scan_table_fence(lexer, true)) {
        lexer->result_symbol = TABLE_FENCE_START;
        return true;
    }
    
    if (valid_symbols[TABLE_FENCE_END] && scan_table_fence(lexer, false)) {
        lexer->result_symbol = TABLE_FENCE_END;
        return true;
    }
    
    // Conditional directives (high priority) - check longer patterns first
    if (valid_symbols[_ifndef_open_token] && scan_ifndef_open(lexer)) {
        lexer->result_symbol = _ifndef_open_token;
        return true;
    }
    
    if (valid_symbols[_ifdef_open_token] && scan_ifdef_open(lexer)) {
        lexer->result_symbol = _ifdef_open_token;
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
    
    if (valid_symbols[_LIST_ORDERED_MARKER] && scan_ordered_list_marker(lexer)) {
        lexer->result_symbol = _LIST_ORDERED_MARKER;
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
    
    if (valid_symbols[_DESCRIPTION_LIST_ITEM] && scan_description_list_item(lexer)) {
        lexer->result_symbol = _DESCRIPTION_LIST_ITEM;
        return true;
    }
    
    
    // Temporarily disable AUTOLINK_BOUNDARY to reduce ERROR nodes
    // if (valid_symbols[AUTOLINK_BOUNDARY] && scan_autolink_boundary(lexer)) {
    //     lexer->result_symbol = AUTOLINK_BOUNDARY;
    //     return true;
    // }
    
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
    buffer[6] = scanner->fence_type;
    buffer[7] = scanner->at_line_start ? 1 : 0;
    // Serialize list state fields
    buffer[8] = scanner->in_unordered_list ? 1 : 0;
    buffer[9] = scanner->in_ordered_list ? 1 : 0;
    buffer[10] = scanner->last_unordered_marker;
    buffer[11] = scanner->list_block_consumed ? 1 : 0;
    
    return 12;
}

void tree_sitter_asciidoc_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    Scanner *scanner = (Scanner *)payload;
    
    // Initialize all fields to default values
    scanner->fence_length = 0;
    scanner->fence_count = 0;
    scanner->fence_type = 0;
    scanner->at_line_start = false;
    scanner->in_unordered_list = false;
    scanner->in_ordered_list = false;
    scanner->last_unordered_marker = 0;
    scanner->list_block_consumed = false;
    
    if (length >= 8) {
        scanner->fence_length = buffer[0];
        if (scanner->fence_length <= 4) {
            for (uint8_t i = 0; i < scanner->fence_length; i++) {
                scanner->fence_chars[i] = buffer[i + 1];
            }
            scanner->fence_count = buffer[5];
            scanner->fence_type = buffer[6];
            scanner->at_line_start = buffer[7] != 0;
            
            // Deserialize list state fields if available
            if (length >= 12) {
                scanner->in_unordered_list = buffer[8] != 0;
                scanner->in_ordered_list = buffer[9] != 0;
                scanner->last_unordered_marker = buffer[10];
                scanner->list_block_consumed = buffer[11] != 0;
            }
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
