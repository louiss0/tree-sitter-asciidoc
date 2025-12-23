#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>

enum TokenType {
  LIST_CONTINUATION,
  UNORDERED_LIST_MARKER,
  ORDERED_LIST_MARKER,
  INDENTED_UNORDERED_LIST_MARKER,
  INDENTED_ORDERED_LIST_MARKER,
  THEMATIC_BREAK,
  BLOCK_QUOTE_MARKER,
  BLOCK_TITLE,
  PLAIN_DOT,
  FENCED_CODE_BLOCK_START_BACKTICK,
  FENCED_CODE_BLOCK_END_BACKTICK,
  FENCED_CODE_BLOCK_START_TILDE,
  FENCED_CODE_BLOCK_END_TILDE,
};

typedef struct {
  uint8_t fenced_code_block_delimiter_length;
  int32_t fenced_code_block_delimiter;
} ScannerState;

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static inline bool is_digit(int32_t c) { return c >= '0' && c <= '9'; }

static bool scan_unordered_or_thematic(TSLexer *lexer, const bool *valid_symbols, unsigned indent) {
  bool wants_list =
    valid_symbols[UNORDERED_LIST_MARKER] || valid_symbols[INDENTED_UNORDERED_LIST_MARKER];

  if (!valid_symbols[THEMATIC_BREAK] && !wants_list) {
    return false;
  }

  int32_t marker = lexer->lookahead;
  if (marker != '*' && marker != '-' && marker != '_' && marker != '\'') {
    return false;
  }

  bool thematic_marker = marker == '*' || marker == '_' || marker == '\'';

  unsigned marker_count = 0;
  while (lexer->lookahead == marker) {
    advance(lexer);
    marker_count++;
  }

  if (marker_count == 0) {
    return false;
  }

  bool has_space = false;
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    advance(lexer);
    has_space = true;
  }

  if (has_space) {
    lexer->mark_end(lexer);
  }

  unsigned break_count = marker_count;
  while (lexer->lookahead == marker || lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    if (lexer->lookahead == marker) {
      break_count++;
    }
    advance(lexer);
  }

  if (thematic_marker &&
      (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer)) &&
      break_count == 3 && valid_symbols[THEMATIC_BREAK] && indent < 4) {
    if (lexer->lookahead == '\r') {
      advance(lexer);
      if (lexer->lookahead == '\n') {
        advance(lexer);
      }
    } else if (lexer->lookahead == '\n') {
      advance(lexer);
    }

    lexer->result_symbol = THEMATIC_BREAK;
    lexer->mark_end(lexer);
    return true;
  }

  if (!has_space || (marker != '*' && marker != '-')) {
    return false;
  }

  if (marker == '-' && marker_count > 1) {
    return false;
  }

  bool is_indented = indent > 0 || (marker == '*' && marker_count > 1);
  if (is_indented) {
    if (!valid_symbols[INDENTED_UNORDERED_LIST_MARKER]) {
      return false;
    }
    lexer->result_symbol = INDENTED_UNORDERED_LIST_MARKER;
  } else {
    if (!valid_symbols[UNORDERED_LIST_MARKER]) {
      return false;
    }
    lexer->result_symbol = UNORDERED_LIST_MARKER;
  }

  return true;
}

static bool scan_ordered_list_marker(TSLexer *lexer, const bool *valid_symbols, unsigned indent) {
  bool wants_list = valid_symbols[ORDERED_LIST_MARKER] || valid_symbols[INDENTED_ORDERED_LIST_MARKER];
  if (!wants_list) {
    return false;
  }

  unsigned digits = 0;
  while (is_digit(lexer->lookahead)) {
    advance(lexer);
    digits++;
  }

  if (lexer->lookahead != '.') {
    return false;
  }
  advance(lexer);

  if (lexer->lookahead != ' ' && lexer->lookahead != '\t') {
    return false;
  }

  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    advance(lexer);
  }

  if (indent == 0) {
    if (!valid_symbols[ORDERED_LIST_MARKER]) {
      return false;
    }
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

static bool scan_block_quote_marker(TSLexer *lexer, const bool *valid_symbols, unsigned indent) {
  if (!valid_symbols[BLOCK_QUOTE_MARKER] || indent >= 4 || lexer->lookahead != '>') {
    return false;
  }

  while (lexer->lookahead == '>') {
    advance(lexer);
  }

  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    advance(lexer);
  }

  lexer->result_symbol = BLOCK_QUOTE_MARKER;
  lexer->mark_end(lexer);
  return true;
}

static bool scan_dot_marker(TSLexer *lexer, const bool *valid_symbols, unsigned indent) {
  if (lexer->lookahead != '.') {
    return false;
  }

  bool wants_list =
    valid_symbols[ORDERED_LIST_MARKER] || valid_symbols[INDENTED_ORDERED_LIST_MARKER];
  bool wants_block_title = valid_symbols[BLOCK_TITLE];
  bool wants_plain_dot = valid_symbols[PLAIN_DOT];

  if (!wants_list && !wants_block_title && !wants_plain_dot) {
    return false;
  }

  advance(lexer);

  if (wants_list && (lexer->lookahead == ' ' || lexer->lookahead == '\t')) {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
      advance(lexer);
    }

    if (indent == 0) {
      if (!valid_symbols[ORDERED_LIST_MARKER]) {
        return false;
      }
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

  if (wants_block_title && indent == 0 && lexer->lookahead != '.' && lexer->lookahead != '\r' &&
      lexer->lookahead != '\n' && !lexer->eof(lexer)) {
    while (lexer->lookahead != '\n' && lexer->lookahead != '\r' && !lexer->eof(lexer)) {
      advance(lexer);
    }

    if (lexer->lookahead == '\r') {
      advance(lexer);
      if (lexer->lookahead == '\n') {
        advance(lexer);
      }
    } else if (lexer->lookahead == '\n') {
      advance(lexer);
    } else {
      return false;
    }

    lexer->result_symbol = BLOCK_TITLE;
    lexer->mark_end(lexer);
    return true;
  }

  if (wants_plain_dot) {
    lexer->result_symbol = PLAIN_DOT;
    lexer->mark_end(lexer);
    return true;
  }

  return false;
}

static bool scan_fenced_code_block(
  TSLexer *lexer,
  ScannerState *state,
  const bool *valid_symbols,
  unsigned indent
) {
  bool wants_start_backtick = valid_symbols[FENCED_CODE_BLOCK_START_BACKTICK];
  bool wants_end_backtick = valid_symbols[FENCED_CODE_BLOCK_END_BACKTICK];
  bool wants_start_tilde = valid_symbols[FENCED_CODE_BLOCK_START_TILDE];
  bool wants_end_tilde = valid_symbols[FENCED_CODE_BLOCK_END_TILDE];

  if (!wants_start_backtick && !wants_end_backtick && !wants_start_tilde && !wants_end_tilde) {
    return false;
  }

  if (indent >= 4) {
    return false;
  }

  int32_t marker = lexer->lookahead;
  if (marker != '`' && marker != '~') {
    return false;
  }

  unsigned count = 0;
  while (lexer->lookahead == marker) {
    advance(lexer);
    count++;
  }

  if (count < 3) {
    return false;
  }

  bool can_close = state->fenced_code_block_delimiter_length > 0 &&
    marker == state->fenced_code_block_delimiter &&
    count >= state->fenced_code_block_delimiter_length &&
    ((marker == '`' && wants_end_backtick) || (marker == '~' && wants_end_tilde));

  if (can_close) {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
      skip(lexer);
    }

    if (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer)) {
      if (lexer->lookahead == '\r') {
        advance(lexer);
        if (lexer->lookahead == '\n') {
          advance(lexer);
        }
      } else if (lexer->lookahead == '\n') {
        advance(lexer);
      }

      lexer->result_symbol =
        marker == '`' ? FENCED_CODE_BLOCK_END_BACKTICK : FENCED_CODE_BLOCK_END_TILDE;
      lexer->mark_end(lexer);
      state->fenced_code_block_delimiter_length = 0;
      state->fenced_code_block_delimiter = 0;
      return true;
    }
  }

  if (state->fenced_code_block_delimiter_length == 0) {
    bool can_start =
      (marker == '`' && wants_start_backtick) || (marker == '~' && wants_start_tilde);
    if (can_start) {
      while (lexer->lookahead != '\n' && lexer->lookahead != '\r' && !lexer->eof(lexer)) {
        advance(lexer);
      }

      if (lexer->lookahead == '\r') {
        advance(lexer);
        if (lexer->lookahead == '\n') {
          advance(lexer);
        }
      } else if (lexer->lookahead == '\n') {
        advance(lexer);
      }

      lexer->result_symbol =
        marker == '`' ? FENCED_CODE_BLOCK_START_BACKTICK : FENCED_CODE_BLOCK_START_TILDE;
      lexer->mark_end(lexer);
      state->fenced_code_block_delimiter_length = (uint8_t)count;
      state->fenced_code_block_delimiter = marker;
      return true;
    }
  }

  return false;
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
  ScannerState *state = (ScannerState *)payload;
  if (!state) {
    return 0;
  }

  buffer[0] = (char)state->fenced_code_block_delimiter_length;
  buffer[1] = (char)state->fenced_code_block_delimiter;
  return 2;
}

void tree_sitter_asciidoc_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  ScannerState *state = (ScannerState *)payload;
  if (!state) {
    return;
  }

  state->fenced_code_block_delimiter_length = 0;
  state->fenced_code_block_delimiter = 0;

  if (length > 0) {
    state->fenced_code_block_delimiter_length = (uint8_t)buffer[0];
  }
  if (length > 1) {
    state->fenced_code_block_delimiter = buffer[1];
  }
}

void tree_sitter_asciidoc_external_scanner_destroy(void *payload) {
  if (payload) {
    free(payload);
  }
}

bool tree_sitter_asciidoc_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  ScannerState *state = (ScannerState *)payload;

  if (!state) {
    return false;
  }

  if (lexer->eof(lexer)) {
    return false;
  }

  if (valid_symbols[PLAIN_DOT] && lexer->lookahead == '.' && lexer->get_column(lexer) != 0) {
    advance(lexer);
    lexer->result_symbol = PLAIN_DOT;
    lexer->mark_end(lexer);
    return true;
  }

  if (lexer->get_column(lexer) == 0) {
    unsigned indent = 0;
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
      skip(lexer);
      indent++;
    }

    int32_t marker = lexer->lookahead;
    if (marker == '`' || marker == '~') {
      return scan_fenced_code_block(lexer, state, valid_symbols, indent);
    }

    if (marker == '*' || marker == '-' || marker == '_' || marker == '\'') {
      return scan_unordered_or_thematic(lexer, valid_symbols, indent);
    }

    if (marker == '>') {
      return scan_block_quote_marker(lexer, valid_symbols, indent);
    }

    if (marker == '.') {
      return scan_dot_marker(lexer, valid_symbols, indent);
    }

    if (marker == '+') {
      return scan_list_continuation(lexer, valid_symbols);
    }

    if (is_digit(marker)) {
      return scan_ordered_list_marker(lexer, valid_symbols, indent);
    }
  }

  return false;
}
