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
          $.text_formatting,
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

    // Text formatting rules
    text_formatting: ($) =>
      choice(
        $.bold_text,
        $.italic_text,
        $.monospace_text,
        $.highlighted_text,
        $.superscript_text,
        $.subscript_text,
      ),

    bold_text: ($) =>
      seq(
        field("start_marker", $._text_formatting_bold_start),
        field("content", $._text_formatting_bold_content),
        field("end_marker", $._text_formatting_bold_end),
      ),

    italic_text: ($) =>
      seq(
        field("start_marker", $._text_formatting_italic_start),
        field("content", $._text_formatting_italic_content),
        field("end_marker", $._text_formatting_italic_end),
      ),

    monospace_text: ($) =>
      seq(
        field("start_marker", $._text_formatting_monospace_start),
        field("content", $._text_formatting_monospace_content),
        field("end_marker", $._text_formatting_monospace_end),
      ),

    highlighted_text: ($) =>
      seq(
        field("start_marker", $._text_formatting_highlighted_start),
        field("content", $._text_formatting_highlighted_content),
        field("end_marker", $._text_formatting_highlighted_end),
      ),

    superscript_text: ($) =>
      seq(
        field("start_marker", $._text_formatting_superscript_start),
        field("content", $._text_formatting_superscript_content),
        field("end_marker", $._text_formatting_superscript_end),
      ),

    subscript_text: ($) =>
      seq(
        field("start_marker", $._text_formatting_subscript_start),
        field("content", $._text_formatting_subscript_content),
        field("end_marker", $._text_formatting_subscript_end),
      ),

    // Private rules for text formatting - context-specific content
    _text_formatting_bold_content: () => token(/[^*\n\r]+/),
    _text_formatting_italic_content: () => token(/[^_\n\r]+/),
    _text_formatting_monospace_content: () => token(/[^`\n\r]+/),
    _text_formatting_highlighted_content: () => token(/[^#\n\r]+/),
    _text_formatting_superscript_content: () => token(/[^^\n\r]+/),
    _text_formatting_subscript_content: () => token(/[^~\n\r]+/),
    
    // Private rules for text formatting - markers
    _text_formatting_bold_start: () => token("*"),
    _text_formatting_bold_end: () => token("*"),
    _text_formatting_italic_start: () => token("_"),
    _text_formatting_italic_end: () => token("_"),
    _text_formatting_monospace_start: () => token("`"),
    _text_formatting_monospace_end: () => token("`"),
    _text_formatting_highlighted_start: () => token("#"),
    _text_formatting_highlighted_end: () => token("#"),
    _text_formatting_superscript_start: () => token("^"),
    _text_formatting_superscript_end: () => token("^"),
    _text_formatting_subscript_start: () => token("~"),
    _text_formatting_subscript_end: () => token("~"),

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
