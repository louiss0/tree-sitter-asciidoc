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
    ATTRIBUTE_LIST_START
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

bool tree_sitter_asciidoc_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner *)payload;
    
    if (valid_symbols[BLOCK_FENCE_START]) {
        return scan_block_fence_start(scanner, lexer);
    }
    
    if (valid_symbols[BLOCK_FENCE_END]) {
        return scan_block_fence_end(scanner, lexer);
    }
    
    if (valid_symbols[TABLE_FENCE_START] || valid_symbols[TABLE_FENCE_END]) {
        return scan_table_fence(lexer, valid_symbols[TABLE_FENCE_START]);
    }
    
    if (valid_symbols[LIST_CONTINUATION]) {
        return scan_list_continuation(lexer);
    }
    
    if (valid_symbols[AUTOLINK_BOUNDARY]) {
        return scan_autolink_boundary(lexer);
    }
    
    if (valid_symbols[ATTRIBUTE_LIST_START]) {
        return scan_attribute_list_start(lexer);
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
