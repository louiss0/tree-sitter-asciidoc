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

    if (!has_space) {
      return false;
    }

    if (indent == 0) {
      if (!valid_symbols[UNORDERED_LIST_MARKER]) {
        return false;
      }
      lexer->result_symbol = UNORDERED_LIST_MARKER;
    } else {
      if (!valid_symbols[INDENTED_UNORDERED_LIST_MARKER]) {
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
