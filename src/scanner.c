#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>

<<<<<<< HEAD
// Debug logging completely disabled
// For debugging, use tree-sitter's parse --debug flag instead
#define DEBUG_LOG(fmt, ...) ((void)0)

// External token types (must match grammar.js externals)
enum {
    EXAMPLE_FENCE_START,    // ====
    EXAMPLE_FENCE_END,
    LISTING_FENCE_START,    // ----
    LISTING_FENCE_END,
    BACKTICK_FENCE_START,    // ```
    BACKTICK_FENCE_END,
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
    _BLOCK_ANCHOR,         // Block anchor at start of line (hidden from AST)
    _LIST_UNORDERED_MARKER, // "* " or "- " at start of line (hidden from AST)
    _LIST_ORDERED_MARKER,   // "N. " at start of line (hidden from AST)
    DESCRIPTION_LIST_SEP,   // "::"
    _DESCRIPTION_LIST_ITEM, // "term:: description" pattern (hidden from AST)
    CALLOUT_MARKER,        // "<N> " at start of line
    _ifdef_open_token,     // "ifdef::" at start of line
    _ifndef_open_token,    // "ifndef::" at start of line
    _ifeval_open_token,    // "ifeval::" at start of line
    _endif_directive_token // "endif::" at start of line
=======
enum TokenType {
  LIST_CONTINUATION,
  UNORDERED_LIST_MARKER,
  ORDERED_LIST_MARKER,
  INDENTED_UNORDERED_LIST_MARKER,
  INDENTED_ORDERED_LIST_MARKER,
>>>>>>> develop
};

typedef struct {
  uint8_t placeholder;
} ScannerState;

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static inline bool is_digit(int32_t c) { return c >= '0' && c <= '9'; }

static bool scan_list_marker(TSLexer *lexer, const bool *valid_symbols) {
  bool wants_unordered =
    valid_symbols[UNORDERED_LIST_MARKER] || valid_symbols[INDENTED_UNORDERED_LIST_MARKER];
  bool wants_ordered =
    valid_symbols[ORDERED_LIST_MARKER] || valid_symbols[INDENTED_ORDERED_LIST_MARKER];

  if ((!wants_unordered && !wants_ordered) || lexer->get_column(lexer) != 0) {
    return false;
  }

  unsigned indent = 0;
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    skip(lexer);
    indent++;
  }

  int32_t first = lexer->lookahead;
  bool is_unordered = first == '*' || first == '-';
  bool is_ordered = is_digit(first);

  if (!is_unordered && !is_ordered) {
    return false;
  }

  lexer->mark_end(lexer);

  if (is_unordered) {
    advance(lexer);

    if (lexer->lookahead != ' ' && lexer->lookahead != '\t') {
      return false;
    }

    bool has_space = false;
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
      skip(lexer);
      has_space = true;
    }

<<<<<<< HEAD
// Check if at start of line (only whitespace before)
static bool at_line_start(TSLexer *lexer) {
    // Some hosts may not implement get_column; assume line start in that case
    if (!lexer->get_column) return true;
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
        case '`': return BACKTICK_FENCE_START;
        default: return -1;
=======
    if (!has_space) {
      return false;
>>>>>>> develop
    }

<<<<<<< HEAD
static int get_fence_end_token(char fence_char, uint8_t count) {
    switch (fence_char) {
        case '=': return EXAMPLE_FENCE_END;
        case '-': 
            if (count == 2) return OPENBLOCK_FENCE_END;
            else if (count >= 4) return LISTING_FENCE_END;
            else return -1; // Invalid fence count
        case '.': return LITERAL_FENCE_END;
        case '_': return QUOTE_FENCE_END;
        case '*': return SIDEBAR_FENCE_END;
        case '+': return PASSTHROUGH_FENCE_END;
        case '`': return BACKTICK_FENCE_END;
        default: return -1;
    }
}

// Scan for delimited block fences (====, ----, ...., ____, ****, --, ++++, ```)
static bool scan_block_fence_start(Scanner *scanner, TSLexer *lexer) {
    DEBUG_LOG("scan_block_fence_start: checking at column %d, char='%c'", lexer->get_column ? lexer->get_column(lexer) : -1, lexer->lookahead);
    if (!at_line_start(lexer)) {
        DEBUG_LOG("scan_block_fence_start: not at line start, skipping");
        return false;
    }
    
    char fence_char = lexer->lookahead;
    if (fence_char != '=' && fence_char != '-' && fence_char != '.' && 
        fence_char != '_' && fence_char != '*' && fence_char != '+' && fence_char != '`') {
=======
    if (indent == 0) {
      if (!valid_symbols[UNORDERED_LIST_MARKER]) {
        return false;
      }
      lexer->result_symbol = UNORDERED_LIST_MARKER;
    } else {
      if (!valid_symbols[INDENTED_UNORDERED_LIST_MARKER]) {
>>>>>>> develop
        return false;
      }
      lexer->result_symbol = INDENTED_UNORDERED_LIST_MARKER;
    }

    lexer->mark_end(lexer);
    return true;
  }

  unsigned digits = 0;
  while (is_digit(lexer->lookahead)) {
    advance(lexer);
    digits++;
  }

  if (digits == 0 || lexer->lookahead != '.') {
    return false;
  }
  advance(lexer);

  if (lexer->lookahead != ' ' && lexer->lookahead != '\t') {
    return false;
  }

  bool has_space = false;
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    skip(lexer);
    has_space = true;
  }

  if (!has_space) {
    return false;
  }

  if (indent == 0) {
    if (!valid_symbols[ORDERED_LIST_MARKER]) {
      return false;
    }
<<<<<<< HEAD
    
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
    } else if (fence_char == '`') {
        // Backtick fences use 3+ chars (markdown style)
        min_count = 3;
    }
    
    if (count < min_count || count > max_count) return false;
    
    // Must be followed by end of line or attributes (only spaces allowed)
    // For backtick fences, allow language identifier
    if (fence_char == '`') {
        // Skip optional language identifier (e.g., javascript, python, etc.)
        while (lexer->lookahead != '\n' && lexer->lookahead != '\r' && !lexer->eof(lexer)) {
            advance(lexer);
        }
    } else {
        skip_spaces(lexer);
        if (!(lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer))) {
            return false;
        }
    }
    
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
    
    // Include the newline
=======
    lexer->result_symbol = ORDERED_LIST_MARKER;
  } else {
    if (!valid_symbols[INDENTED_ORDERED_LIST_MARKER]) {
      return false;
    }
    lexer->result_symbol = INDENTED_ORDERED_LIST_MARKER;
  }

  lexer->mark_end(lexer);
  return true;
}

static bool scan_list_continuation(TSLexer *lexer, const bool *valid_symbols) {
  if (!valid_symbols[LIST_CONTINUATION] || lexer->lookahead != '+') {
    return false;
  }

  unsigned count = 0;
  while (lexer->lookahead == '+') {
    advance(lexer);
    count++;
  }

  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    skip(lexer);
  }

  if (count == 1 && (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer))) {
>>>>>>> develop
    if (lexer->lookahead == '\r') {
      advance(lexer);
      if (lexer->lookahead == '\n') {
        advance(lexer);
      }
    } else if (lexer->lookahead == '\n') {
      advance(lexer);
    }
    lexer->result_symbol = LIST_CONTINUATION;
    return true;
  }

  return false;
}

void *tree_sitter_asciidoc_external_scanner_create(void) {
  return calloc(1, sizeof(ScannerState));
}

unsigned tree_sitter_asciidoc_external_scanner_serialize(void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}

void tree_sitter_asciidoc_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

void tree_sitter_asciidoc_external_scanner_destroy(void *payload) {
  if (payload) {
    free(payload);
  }
}

bool tree_sitter_asciidoc_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;

  if (lexer->eof(lexer)) {
    return false;
  }

  if (lexer->get_column(lexer) == 0) {
    if (scan_list_marker(lexer, valid_symbols)) {
      return true;
    }

    if (scan_list_continuation(lexer, valid_symbols)) {
      return true;
    }
  }

  return false;
}
