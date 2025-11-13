#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

#define SCANNER_DEBUG 0

#if SCANNER_DEBUG
#include <stdio.h>
#define DEBUG_LOG(...) fprintf(stderr, __VA_ARGS__)
#else
#define DEBUG_LOG(...)
#endif

enum TokenType {
  EXAMPLE_FENCE_START,
  EXAMPLE_FENCE_END,
  LISTING_FENCE_START,
  LISTING_FENCE_END,
  LITERAL_FENCE_START,
  LITERAL_FENCE_END,
  QUOTE_FENCE_START,
  QUOTE_FENCE_END,
  SIDEBAR_FENCE_START,
  SIDEBAR_FENCE_END,
  PASSTHROUGH_FENCE_START,
  PASSTHROUGH_FENCE_END,
  OPENBLOCK_FENCE_START,
  OPENBLOCK_FENCE_END,
  BLOCK_COMMENT_START,
  BLOCK_COMMENT_END,
  LIST_CONTINUATION,
  AUTOLINK_BOUNDARY,
  ATTRIBUTE_LIST_START,
  DELIMITED_BLOCK_CONTENT_LINE,
};

typedef struct {
  uint8_t block_depth;
} ScannerState;

static inline bool is_newline(int32_t c) { return c == '\n' || c == '\r'; }

static inline bool is_space(int32_t c) { return c == ' ' || c == '\t'; }

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static inline void push_block(ScannerState *state) {
  if (state && state->block_depth < UINT8_MAX) {
    state->block_depth++;
  }
}

static inline void pop_block(ScannerState *state) {
  if (state && state->block_depth > 0) {
    state->block_depth--;
  }
}

static inline void note_block_transition(ScannerState *state, enum TokenType token) {
  switch (token) {
    case EXAMPLE_FENCE_START:
    case LISTING_FENCE_START:
    case LITERAL_FENCE_START:
    case QUOTE_FENCE_START:
    case SIDEBAR_FENCE_START:
    case PASSTHROUGH_FENCE_START:
    case OPENBLOCK_FENCE_START:
      push_block(state);
      break;
    case EXAMPLE_FENCE_END:
    case LISTING_FENCE_END:
    case LITERAL_FENCE_END:
    case QUOTE_FENCE_END:
    case SIDEBAR_FENCE_END:
    case PASSTHROUGH_FENCE_END:
    case OPENBLOCK_FENCE_END:
      pop_block(state);
      break;
    default:
      break;
  }
}

static bool consume_line_break(TSLexer *lexer) {
  if (lexer->lookahead == '\r') {
    advance(lexer);
    if (lexer->lookahead == '\n') {
      advance(lexer);
    }
    return true;
  }
  if (lexer->lookahead == '\n') {
    advance(lexer);
    return true;
  }
  if (lexer->eof(lexer)) {
    return true;
  }
  return false;
}

static bool scan_repeated_fence(TSLexer *lexer, char marker, unsigned min_count) {
  if (lexer->get_column(lexer) != 0 || lexer->lookahead != marker) {
    return false;
  }

  unsigned count = 0;
  while (lexer->lookahead == marker) {
    advance(lexer);
    count++;
  }

  if (count < min_count) {
    return false;
  }

  while (is_space(lexer->lookahead)) {
    advance(lexer);
  }

  return consume_line_break(lexer);
}

static bool scan_list_continuation(TSLexer *lexer) {
  if (lexer->get_column(lexer) != 0) {
    return false;
  }

  while (is_space(lexer->lookahead)) {
    advance(lexer);
  }

  if (lexer->lookahead != '+') {
    return false;
  }
  advance(lexer);

  while (is_space(lexer->lookahead)) {
    advance(lexer);
  }

  return consume_line_break(lexer);
}

static bool scan_attribute_list(TSLexer *lexer) {
  if (lexer->get_column(lexer) != 0 || lexer->lookahead != '[') {
    return false;
  }

  advance(lexer);
  bool saw_content = false;

  while (lexer->lookahead && !is_newline(lexer->lookahead)) {
    if (lexer->lookahead == ']') {
      advance(lexer);
      while (is_space(lexer->lookahead)) {
        advance(lexer);
      }
      if (lexer->lookahead == '#' || lexer->lookahead == '+') {
        return false;
      }
      return consume_line_break(lexer);
    }
    saw_content = true;
    advance(lexer);
  }

  return false;
}

static bool scan_block_content_line(TSLexer *lexer) {
  bool saw_non_ws = false;

  while (lexer->lookahead && !is_newline(lexer->lookahead)) {
    if (!is_space(lexer->lookahead)) {
      saw_non_ws = true;
    }
    advance(lexer);
  }

  if (!saw_non_ws) {
    return false;
  }

  consume_line_break(lexer);
  return true;
}

void *tree_sitter_asciidoc_external_scanner_create(void) {
  ScannerState *state = (ScannerState *)calloc(1, sizeof(ScannerState));
  return state;
}

unsigned tree_sitter_asciidoc_external_scanner_serialize(void *payload, char *buffer) {
  ScannerState *state = (ScannerState *)payload;
  if (!state) {
    return 0;
  }
  buffer[0] = (char)state->block_depth;
  return 1;
}

void tree_sitter_asciidoc_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  ScannerState *state = (ScannerState *)payload;
  if (!state) {
    return;
  }
  state->block_depth = length > 0 ? (uint8_t)buffer[0] : 0;
}

void tree_sitter_asciidoc_external_scanner_destroy(void *payload) {
  if (payload) {
    free(payload);
  }
}

static bool scan_hyphen_fence(TSLexer *lexer, unsigned *count_out) {
  if (lexer->lookahead != '-') {
    return false;
  }

  unsigned count = 0;
  while (lexer->lookahead == '-') {
    advance(lexer);
    count++;
  }

  while (is_space(lexer->lookahead)) {
    advance(lexer);
  }

  if (!consume_line_break(lexer)) {
    return false;
  }

  *count_out = count;
  return true;
}

bool tree_sitter_asciidoc_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  ScannerState *state = (ScannerState *)payload;

  if (lexer->eof(lexer)) {
    return false;
  }

  // Fences that share the same marker should check the longer versions first.
  if (lexer->get_column(lexer) == 0) {
    if (valid_symbols[ATTRIBUTE_LIST_START] && scan_attribute_list(lexer)) {
      lexer->result_symbol = ATTRIBUTE_LIST_START;
      return true;
    }

#if SCANNER_DEBUG
    if (lexer->lookahead == '-') {
      DEBUG_LOG(
        "hyphen line: listing_start=%d listing_end=%d open_start=%d open_end=%d\n",
        valid_symbols[LISTING_FENCE_START],
        valid_symbols[LISTING_FENCE_END],
        valid_symbols[OPENBLOCK_FENCE_START],
        valid_symbols[OPENBLOCK_FENCE_END]);
    }
#endif
    if (lexer->lookahead == '-' &&
        (valid_symbols[LISTING_FENCE_START] || valid_symbols[LISTING_FENCE_END] ||
         valid_symbols[OPENBLOCK_FENCE_START] || valid_symbols[OPENBLOCK_FENCE_END])) {
      unsigned dash_count = 0;
      if (!scan_hyphen_fence(lexer, &dash_count)) {
        return false;
      }

      if (dash_count >= 4 && (valid_symbols[LISTING_FENCE_START] || valid_symbols[LISTING_FENCE_END])) {
        lexer->result_symbol =
          valid_symbols[LISTING_FENCE_END] ? LISTING_FENCE_END : LISTING_FENCE_START;
        note_block_transition(state, lexer->result_symbol);
        return true;
      }

      if (dash_count == 2 && (valid_symbols[OPENBLOCK_FENCE_START] || valid_symbols[OPENBLOCK_FENCE_END])) {
        lexer->result_symbol =
          valid_symbols[OPENBLOCK_FENCE_END] ? OPENBLOCK_FENCE_END : OPENBLOCK_FENCE_START;
        note_block_transition(state, lexer->result_symbol);
        return true;
      }

      return false;
    }

    if ((valid_symbols[EXAMPLE_FENCE_START] || valid_symbols[EXAMPLE_FENCE_END]) &&
        lexer->lookahead == '=' &&
        scan_repeated_fence(lexer, '=', 4)) {
      if (valid_symbols[EXAMPLE_FENCE_END]) {
        lexer->result_symbol = EXAMPLE_FENCE_END;
      } else {
        lexer->result_symbol = EXAMPLE_FENCE_START;
      }
      note_block_transition(state, lexer->result_symbol);
      return true;
    }

    if ((valid_symbols[LITERAL_FENCE_START] || valid_symbols[LITERAL_FENCE_END]) &&
        lexer->lookahead == '.' &&
        scan_repeated_fence(lexer, '.', 4)) {
      if (valid_symbols[LITERAL_FENCE_END]) {
        lexer->result_symbol = LITERAL_FENCE_END;
      } else {
        lexer->result_symbol = LITERAL_FENCE_START;
      }
      note_block_transition(state, lexer->result_symbol);
      return true;
    }

    if ((valid_symbols[QUOTE_FENCE_START] || valid_symbols[QUOTE_FENCE_END]) &&
        lexer->lookahead == '_' &&
        scan_repeated_fence(lexer, '_', 4)) {
      if (valid_symbols[QUOTE_FENCE_END]) {
        lexer->result_symbol = QUOTE_FENCE_END;
      } else {
        lexer->result_symbol = QUOTE_FENCE_START;
      }
      note_block_transition(state, lexer->result_symbol);
      return true;
    }

    if ((valid_symbols[SIDEBAR_FENCE_START] || valid_symbols[SIDEBAR_FENCE_END]) &&
        lexer->lookahead == '*' &&
        scan_repeated_fence(lexer, '*', 4)) {
      if (valid_symbols[SIDEBAR_FENCE_END]) {
        lexer->result_symbol = SIDEBAR_FENCE_END;
      } else {
        lexer->result_symbol = SIDEBAR_FENCE_START;
      }
      note_block_transition(state, lexer->result_symbol);
      return true;
    }

    if ((valid_symbols[BLOCK_COMMENT_START] || valid_symbols[BLOCK_COMMENT_END]) &&
        lexer->lookahead == '/' &&
        scan_repeated_fence(lexer, '/', 4)) {
      if (valid_symbols[BLOCK_COMMENT_END]) {
        lexer->result_symbol = BLOCK_COMMENT_END;
      } else {
        lexer->result_symbol = BLOCK_COMMENT_START;
      }
      return true;
    }

    if ((valid_symbols[PASSTHROUGH_FENCE_START] || valid_symbols[PASSTHROUGH_FENCE_END]) &&
        lexer->lookahead == '+' &&
        scan_repeated_fence(lexer, '+', 4)) {
      if (valid_symbols[PASSTHROUGH_FENCE_END]) {
        lexer->result_symbol = PASSTHROUGH_FENCE_END;
      } else {
        lexer->result_symbol = PASSTHROUGH_FENCE_START;
      }
      note_block_transition(state, lexer->result_symbol);
      return true;
    }

    if (valid_symbols[LIST_CONTINUATION] && scan_list_continuation(lexer)) {
      lexer->result_symbol = LIST_CONTINUATION;
      return true;
    }
  }

  if (state && state->block_depth > 0 && valid_symbols[DELIMITED_BLOCK_CONTENT_LINE] &&
      lexer->lookahead != 0 &&
      !is_newline(lexer->lookahead) &&
      scan_block_content_line(lexer)) {
    lexer->result_symbol = DELIMITED_BLOCK_CONTENT_LINE;
    return true;
  }

  return false;
}
