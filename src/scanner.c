#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>


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
  LIST_CONTINUATION,
  AUTOLINK_BOUNDARY,
  DELIMITED_BLOCK_CONTENT_LINE,
  INTERNAL_XREF_OPEN,
  INTERNAL_XREF_CLOSE,
};


typedef struct {
  uint8_t block_depth;
} ScannerState;

static inline bool is_newline(int32_t c) { return c == '\n' || c == '\r'; }

static inline bool is_space(int32_t c) { return c == ' ' || c == '\t'; }

static inline bool is_word_char(int32_t c) {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_';
}

static inline bool is_at_bol(TSLexer *lexer) {
  return lexer->get_column(lexer) == 0;
}

static inline void skip_spaces(TSLexer *lexer) {
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    lexer->advance(lexer, true);
  }
}

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

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



static bool scan_star_prefix(TSLexer *lexer, const bool *valid_symbols, ScannerState *state) {
  if (lexer->lookahead != '*') {
    return false;
  }
  if (lexer->get_column(lexer) != 0) {
    // Only treat stars at BOL as block markers (sidebars)
    return false;
  }

  bool wants_sidebar =
    valid_symbols[SIDEBAR_FENCE_START] || valid_symbols[SIDEBAR_FENCE_END];

  if (!wants_sidebar) {
    return false;
  }

  unsigned count = 0;
  while (lexer->lookahead == '*') {
    advance(lexer);
    count++;
  }

  unsigned spaces = 0;
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    advance(lexer);
    spaces++;
  }

  bool at_line_end = is_newline(lexer->lookahead) || lexer->eof(lexer);

  // 4+ stars at BOL and nothing else -> sidebar fence
  if (count >= 4 && at_line_end && wants_sidebar) {
    consume_line_break(lexer);
    lexer->result_symbol =
      valid_symbols[SIDEBAR_FENCE_END] ? SIDEBAR_FENCE_END : SIDEBAR_FENCE_START;
    note_block_transition(state, lexer->result_symbol);
    return true;
  }

  return false;
}



static bool scan_dash_prefix(TSLexer *lexer, const bool *valid_symbols, ScannerState *state) {
  if (lexer->lookahead != '-') {
    return false;
  }

  bool wants_listing =
    valid_symbols[LISTING_FENCE_START] || valid_symbols[LISTING_FENCE_END];
  bool wants_open_block =
    valid_symbols[OPENBLOCK_FENCE_START] || valid_symbols[OPENBLOCK_FENCE_END];

  if (!wants_listing && !wants_open_block) {
    return false;
  }

  advance(lexer);
  lexer->mark_end(lexer);

  unsigned count = 1;
  while (lexer->lookahead == '-') {
    advance(lexer);
    count++;
  }

  unsigned spaces = 0;
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    advance(lexer);
    spaces++;
  }

  bool at_line_end = is_newline(lexer->lookahead) || lexer->lookahead == 0;

  if (at_line_end && count >= 4 && (valid_symbols[LISTING_FENCE_START] || valid_symbols[LISTING_FENCE_END])) {
    consume_line_break(lexer);
    lexer->result_symbol = valid_symbols[LISTING_FENCE_END] ? LISTING_FENCE_END : LISTING_FENCE_START;
    note_block_transition(state, lexer->result_symbol);
    return true;
  }

  if (at_line_end && count == 2 && (valid_symbols[OPENBLOCK_FENCE_START] || valid_symbols[OPENBLOCK_FENCE_END])) {
    consume_line_break(lexer);
    lexer->result_symbol = valid_symbols[OPENBLOCK_FENCE_END] ? OPENBLOCK_FENCE_END : OPENBLOCK_FENCE_START;
    note_block_transition(state, lexer->result_symbol);
    return true;
  }

  return false;
}

static bool scan_plus_prefix(TSLexer *lexer, const bool *valid_symbols, ScannerState *state) {
  if (lexer->lookahead != '+') {
    return false;
  }

  unsigned count = 0;
  while (lexer->lookahead == '+') {
    advance(lexer);
    count++;
  }

  unsigned spaces = 0;
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    advance(lexer);
    spaces++;
  }

  bool at_line_end = is_newline(lexer->lookahead) || lexer->lookahead == 0;

  if (count >= 4 && at_line_end &&
      (valid_symbols[PASSTHROUGH_FENCE_START] || valid_symbols[PASSTHROUGH_FENCE_END])) {
    consume_line_break(lexer);
    lexer->result_symbol = valid_symbols[PASSTHROUGH_FENCE_END] ? PASSTHROUGH_FENCE_END : PASSTHROUGH_FENCE_START;
    note_block_transition(state, lexer->result_symbol);
    return true;
  }

  if (count == 1 && at_line_end && valid_symbols[LIST_CONTINUATION]) {
    consume_line_break(lexer);
    lexer->result_symbol = LIST_CONTINUATION;
    return true;
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

bool tree_sitter_asciidoc_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  ScannerState *state = (ScannerState *)payload;

  if (lexer->eof(lexer)) {
    return false;
  }

  if (lexer->get_column(lexer) == 0) {
    if (lexer->lookahead == '*' && scan_star_prefix(lexer, valid_symbols, state)) {
      return true;
    }

    if (lexer->lookahead == '-' && scan_dash_prefix(lexer, valid_symbols, state)) {
      return true;
    }

    if (lexer->lookahead == '+' && scan_plus_prefix(lexer, valid_symbols, state)) {
      return true;
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


  }

  if (state && state->block_depth > 0 && valid_symbols[DELIMITED_BLOCK_CONTENT_LINE] &&
      lexer->lookahead != 0 &&
      !is_newline(lexer->lookahead) &&
      scan_block_content_line(lexer)) {
    lexer->result_symbol = DELIMITED_BLOCK_CONTENT_LINE;
    return true;
  }

  // if (scan_internal_xref_open(lexer, valid_symbols)) {
  //   return true;
  // }

  // if (scan_internal_xref_close(lexer, valid_symbols)) {
  //   return true;
  // }

  return false;
}
