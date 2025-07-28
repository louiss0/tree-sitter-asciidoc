/**
 * @file This is the Zed Compatiable Tree sitter parser for Asciidoc
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Regex constants have been moved into private rules below.

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

    // Rules specific to 'document_title'
    document_title: ($) =>
      seq(
        field("marker", $._document_title_heading_marker),
        field("title", repeat1($._document_title_text_content)),
      ),
    _document_title_heading_marker: () => token(/=|#/),
    _document_title_text_content: () => token(/\w+/),

    // Rules specific to 'document_author_line'
    document_author_line: ($) =>
      seq(
        field(
          "authors",
          seq(
            repeat(
              seq(
                $._document_author_line_name,
                repeat1(seq($._space, $._document_author_line_name)),
                $._document_author_line_semi_colon,
              ),
            ),
            seq(
              $._document_author_line_name,
              repeat1(seq($._space, $._document_author_line_name)),
            ),
          ),
        ),
        optional(
          field(
            "email",
            seq(
              $._space,
              $._document_author_line_email_start_marker,
              $._document_author_line_email_address,
              $._document_author_line_email_end_marker,
            ),
          ),
        ),
      ),
    _document_author_line_semi_colon: () => token(";"),
    _document_author_line_name: () => token(/[A-Z][a-z\.]+/),
    _document_author_line_email_address: () => token(/[\w \.,]+@[\w \.,]+/),
    _document_author_line_email_start_marker: () => token("<"),
    _document_author_line_email_end_marker: () => token(">"),

    // Rules specific to 'document_revision_line'
    document_revision_line: ($) => {
      const messageFieldRule = field(
        "message",
        seq(
          repeat1(
            seq(
              $._word_chars_with_dash,
              repeat(seq($._space, $._word_chars_with_dash)),
            ),
          ),
          $._newline,
        ),
      );
      const dateFieldRule = field("date", $._document_revision_line_date_text);
      const versionFieldRule = field(
        "version",
        $._document_revision_line_version_text,
      );
      const colon = $._document_revision_line_colon;
      const comma = $._document_revision_line_comma;
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
    _word_chars_with_dash: () => token(/[\-\w]+/),
    _document_revision_line_date_text: () => token(/[ \w\-,]+/),
    _document_revision_line_version_text: () => token(/v?\d+\.\d+/),
    _document_revision_line_colon: () => token(":"),
    _document_revision_line_comma: () => token(","),

    // Rules specific to 'document_attribute'
    document_attribute: ($) =>
      seq(
        field("name", $._document_attribute_name_marker),
        field("value", $._document_attribute_value_text),
      ),
    _document_attribute_name_marker: () => token(/:[a-zA-Z0-9_\-]+:/),
    _document_attribute_value_text: () => token(/[^\\]+/),

    // General private token rules
    _newline: () => token(/\n/),
    _space: () => token(/[ \t]+/),
    _block_delimiter: () => token(/(?:={4,}|-{4,}|\.{4,}|\*{4,}|\+{4,}|_{4,})/),
    _inline_formatting_marker: () => token(/(?:\*|_|`|#|\+)/),
    _line_comment_prefix: () => token(/\/\//),
    _attribute_list_start: () => token(/\[/),
    _attribute_list_end: () => token(/\]/),
  },
});
