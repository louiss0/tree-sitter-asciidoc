/**
 * @file This is the Zed Compatiable Tree sitter parser for Asciidoc
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const UNLIMITED_SPACE = /\s+/;
const NEWLINE = /\n/;
const HEADING_MARKER = /[\=#]/;
const BLOCK_DELIMITER = /(?:={4,}|-{4,}|\.{4,}|\*{4,}|\+{4,}|_{4,})/;
const INLINE_FORMATTING_MARKER = /(?:\*|_|`|#|\+)/;
const LINE_COMMENT_PREFIX = /\/\//;
const ATTRIBUTE_LIST_START = /\[/;
const ATTRIBUTE_LIST_END = /\]/;
const DOC_ATTRIBUTE_DECLARATION_START = /:[a-zA-Z0-9_\-]+:/;

module.exports = grammar({
  name: "asciidoc",

  rules: {
    // TODO: add the actual grammar rules
    source_file: ($) => choice($.document_title),
    document_title: ($) =>
      seq(
        field("marker", token(HEADING_MARKER)),
        UNLIMITED_SPACE,
        choice(
          field("title", /[\w\s]+/),
          seq(field("title", /[\w\s]+:/), field("subtitle", /[\w\s]+/)),
        ),
      ),
  },
});
