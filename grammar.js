/**
 * @file This is the Zed Compatiable Tree sitter parser for Asciidoc
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const NEWLINE = /\n/;
const HEADING_MARKER = /=|#/;
const BLOCK_DELIMITER = /(?:={4,}|-{4,}|\.{4,}|\*{4,}|\+{4,}|_{4,})/;
const INLINE_FORMATTING_MARKER = /(?:\*|_|`|#|\+)/;
const LINE_COMMENT_PREFIX = /\/\//;
const ATTRIBUTE_LIST_START = /\[/;
const ATTRIBUTE_LIST_END = /\]/;
const DOC_ATTRIBUTE_DECLARATION_START = /:[a-zA-Z0-9_\-]+:/;
const NAME = /[A-Z][a-z\.]+/;
const EMAIL_ADDRESS = /[\w \.,]+@[\w \.,]+/;

module.exports = grammar({
  name: "asciidoc",

  rules: {
    // TODO: add the actual grammar rules
    source_file: ($) =>
      seq(
        choice(
          $.document_author_line,
          $.document_revision_line,
          $.document_attribute,
          $.document_title,
        ),
      ),
    _semi_colon: () => token(";"),
    document_title: ($) =>
      seq(field("marker", HEADING_MARKER), field("title", seq(repeat1(/\w+/)))),

    document_author_line: ($) =>
      seq(
        field(
          "authors",
          seq(repeat(seq(repeat1(NAME), $._semi_colon)), repeat1(NAME)),
        ),
        optional(field("email", seq("<", EMAIL_ADDRESS, ">"))),
      ),

    document_revision_line: ($) => {
      const messageFieldRule = field(
        "message",
        seq(repeat1(/[ \-\w]+/), NEWLINE),
      );
      const dateFieldRule = field("date", /[ \w\-,]+/);
      const versionFieldRule = field("version", /v?\d+\.\d+/);
      const colon = token(":");
      const comma = token(",");
      return choice(
        seq(
          versionFieldRule,
          comma,
          dateFieldRule,
          optional(seq(colon, messageFieldRule)),
        ),
        seq(versionFieldRule, colon, messageFieldRule),
        versionFieldRule,
      );
    },
    document_attribute: ($) =>
      seq(field("name", /:[a-zA-Z0-9_\-]+:/), field("value", /[^\\]+/)),
  },
});
