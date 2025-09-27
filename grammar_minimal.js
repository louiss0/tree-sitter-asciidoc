/**
 * @file Ultra-minimal AsciiDoc parser for debugging paragraph parsing
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  extras: $ => [
    /[ \t\f]+/,  // Only horizontal whitespace as extras
  ],

  rules: {
    source_file: $ => repeat($._element),

    _element: $ => choice(
      $.paragraph,
      $._blank_line,
    ),

    // PARAGRAPHS - Ultra simple
    paragraph: $ => seq(
      $.text_with_inlines,
      optional($._line_ending)
    ),

    text_with_inlines: $ => repeat1($.text_segment),
    
    text_segment: $ => token(/[^\s\r\n]+/),

    // BASIC TOKENS
    _line_ending: $ => choice('\r\n', '\n'),
    _blank_line: $ => token(prec(-1, /[ \t]*\r?\n/)),
  }
});