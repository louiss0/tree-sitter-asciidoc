#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>

enum TokenType {
  _LIST_CONTINUATION,
  _UNORDERED_LIST_MARKER,
  _ORDERED_LIST_MARKER,
  _INDENTED_UNORDERED_LIST_MARKER,
  _INDENTED_ORDERED_LIST_MARKER,
  _THEMATIC_BREAK,
  _BLOCK_QUOTE_MARKER,
  _BLOCK_TITLE,
  _PLAIN_DOT,
  _PLAIN_HASH,
  _HIGHLIGHT_OPEN,
  _HIGHLIGHT_CLOSE,
};

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static inline bool is_digit(int32_t c) { return c >= '0' && c <= '9'; }

static bool scan_unordered_or_thematic(TSLexer *lexer, const bool *valid_symbols, unsigned indent) {
  bool wants_list =
    valid_symbols[_UNORDERED_LIST_MARKER] || valid_symbols[_INDENTED_UNORDERED_LIST_MARKER];

  if (!valid_symbols[_THEMATIC_BREAK] && !wants_list) {
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
      break_count == 3 && valid_symbols[_THEMATIC_BREAK] && indent < 4) {
    if (lexer->lookahead == '\r') {
      advance(lexer);
      if (lexer->lookahead == '\n') {
        advance(lexer);
      }
    } else if (lexer->lookahead == '\n') {
      advance(lexer);
    }

    lexer->result_symbol = _THEMATIC_BREAK;
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
    if (!valid_symbols[_INDENTED_UNORDERED_LIST_MARKER]) {
      return false;
    }
    lexer->result_symbol = _INDENTED_UNORDERED_LIST_MARKER;
  } else {
    if (!valid_symbols[_UNORDERED_LIST_MARKER]) {
      return false;
    }
    lexer->result_symbol = _UNORDERED_LIST_MARKER;
  }

  return true;
}

static bool scan_ordered_list_marker(TSLexer *lexer, const bool *valid_symbols, unsigned indent) {
  bool wants_list = valid_symbols[_ORDERED_LIST_MARKER] || valid_symbols[_INDENTED_ORDERED_LIST_MARKER];
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
    if (!valid_symbols[_ORDERED_LIST_MARKER]) {
      return false;
    }
    lexer->result_symbol = _ORDERED_LIST_MARKER;
  } else {
    if (!valid_symbols[_INDENTED_ORDERED_LIST_MARKER]) {
      return false;
    }
    lexer->result_symbol = _INDENTED_ORDERED_LIST_MARKER;
  }

  lexer->mark_end(lexer);
  return true;
}

static bool scan_block_quote_marker(TSLexer *lexer, const bool *valid_symbols, unsigned indent) {
  if (!valid_symbols[_BLOCK_QUOTE_MARKER] || indent >= 4 || lexer->lookahead != '>') {
    return false;
  }

  while (lexer->lookahead == '>') {
   advance(lexer);
  }

  while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
    advance(lexer);
  }

  lexer->result_symbol = _BLOCK_QUOTE_MARKER;
  lexer->mark_end(lexer);
  return true;
}

static bool scan_dot_marker(TSLexer *lexer, const bool *valid_symbols, unsigned indent) {
  if (lexer->lookahead != '.') {
    return false;
  }

  bool wants_list =
    valid_symbols[_ORDERED_LIST_MARKER] || valid_symbols[_INDENTED_ORDERED_LIST_MARKER];
  bool wants_block_title = valid_symbols[_BLOCK_TITLE];
  bool wants_plain_dot = valid_symbols[_PLAIN_DOT];

  if (!wants_list && !wants_block_title && !wants_plain_dot) {
    return false;
  }

  advance(lexer);

  if (wants_list && (lexer->lookahead == ' ' || lexer->lookahead == '\t')) {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
      advance(lexer);
    }

    if (indent == 0) {
      if (!valid_symbols[_ORDERED_LIST_MARKER]) {
        return false;
      }
      lexer->result_symbol = _ORDERED_LIST_MARKER;
    } else {
      if (!valid_symbols[_INDENTED_ORDERED_LIST_MARKER]) {
        return false;
      }
      lexer->result_symbol = _INDENTED_ORDERED_LIST_MARKER;
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

    lexer->result_symbol = _BLOCK_TITLE;
    lexer->mark_end(lexer);
    return true;
  }

  if (wants_plain_dot) {
    lexer->result_symbol = _PLAIN_DOT;
    lexer->mark_end(lexer);
    return true;
  }

  return false;
}

static bool scan_list_continuation(TSLexer *lexer, const bool *valid_symbols) {
  if (!valid_symbols[_LIST_CONTINUATION] || lexer->lookahead != '+') {
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
    lexer->result_symbol = _LIST_CONTINUATION;
    return true;
  }

  return false;
}

static bool scan_hash_marker(TSLexer *lexer, const bool *valid_symbols) {
  if (lexer->lookahead != '#') {
    return false;
  }

  bool wants_plain = valid_symbols[_PLAIN_HASH];
  bool wants_highlight_open = valid_symbols[_HIGHLIGHT_OPEN];
  bool wants_highlight_close = valid_symbols[_HIGHLIGHT_CLOSE];

  if (!wants_plain && !wants_highlight_open && !wants_highlight_close) {
    return false;
  }

  if (wants_highlight_close) {
    advance(lexer);
    lexer->result_symbol = _HIGHLIGHT_CLOSE;
    lexer->mark_end(lexer);
    return true;
  }

  advance(lexer);
  lexer->mark_end(lexer);

  if (wants_highlight_open) {
    while (lexer->lookahead != '\n' && lexer->lookahead != '\r' && !lexer->eof(lexer)) {
      if (lexer->lookahead == '\\') {
        advance(lexer);
        if (lexer->lookahead == '\n' || lexer->lookahead == '\r' || lexer->eof(lexer)) {
          break;
        }
        advance(lexer);
        continue;
      }

      if (lexer->lookahead == '#') {
        lexer->result_symbol = _HIGHLIGHT_OPEN;
        return true;
      }

      advance(lexer);
    }
  }

  if (!wants_plain) {
    return false;
  }

  lexer->result_symbol = _PLAIN_HASH;
  return true;
}

void *tree_sitter_asciidoc_external_scanner_create(void) {
  return NULL;
}

unsigned tree_sitter_asciidoc_external_scanner_serialize(void *payload, char *buffer) {
  return 0;
}

void tree_sitter_asciidoc_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

void tree_sitter_asciidoc_external_scanner_destroy(void *payload) {}

bool tree_sitter_asciidoc_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;

  if (lexer->eof(lexer)) {
    return false;
  }

  if (valid_symbols[_PLAIN_DOT] && lexer->lookahead == '.' && lexer->get_column(lexer) != 0) {
    advance(lexer);
    lexer->result_symbol = _PLAIN_DOT;
    lexer->mark_end(lexer);
    return true;
  }

  if (scan_hash_marker(lexer, valid_symbols)) {
    return true;
  }

  if (lexer->get_column(lexer) == 0) {
    unsigned indent = 0;
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
      skip(lexer);
      indent++;
    }

    int32_t marker = lexer->lookahead;
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
