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
    // No automatic whitespace handling
  ],

  rules: {
    source_file: $ => repeat($._element),

    _element: $ => choice(
      $.section,
      $.unordered_list,
      $.ordered_list,
      $.paragraph,
      $._blank_line,
    ),

    // SECTIONS
    section: $ => prec.right(seq(
      $.section_title,
      repeat($._element)
    )),

    section_title: $ => choice(
      seq($._section_marker_1, $.title, $._line_ending),
      seq($._section_marker_2, $.title, $._line_ending),
      seq($._section_marker_3, $.title, $._line_ending),
      seq($._section_marker_4, $.title, $._line_ending),
      seq($._section_marker_5, $.title, $._line_ending),
      seq($._section_marker_6, $.title, $._line_ending),
    ),

    _section_marker_1: $ => token(prec(10, seq('=', ' '))),
    _section_marker_2: $ => token(prec(10, seq('==', ' '))),
    _section_marker_3: $ => token(prec(10, seq('===', ' '))),
    _section_marker_4: $ => token(prec(10, seq('====', ' '))),
    _section_marker_5: $ => token(prec(10, seq('=====', ' '))),
    _section_marker_6: $ => token(prec(10, seq('======', ' '))),

    title: $ => token.immediate(/[^\r\n]+/),

    // LISTS
    unordered_list: $ => prec.left(repeat1($.unordered_list_item)),
    
    unordered_list_item: $ => seq(
      $._unordered_list_marker,
      field('content', $.text_with_inlines),
      optional($._line_ending)
    ),
    
    _unordered_list_marker: $ => token(prec(5, /[ \t]*[*-]+[ \t]+/)),
    
    ordered_list: $ => prec.left(seq(
      $.ordered_list_item,
      repeat(seq($._line_ending, $.ordered_list_item))
    )),
    
    ordered_list_item: $ => seq(
      $._ordered_list_marker,
      $.text_with_inlines
    ),
    
    _ordered_list_marker: $ => token(prec(5, /[ \t]*[0-9]+\.[ \t]+/)),

    // PARAGRAPHS
    paragraph: $ => seq(
      $.text_with_inlines,
      optional($._line_ending)
    ),

    text_with_inlines: $ => prec.left(seq(
      $.text_segment,
      repeat(seq(/[ \t\f]+/, $.text_segment))
    )),
    
    text_segment: $ => token(/[^\s\r\n]+/),

    // BASIC TOKENS
    _line_ending: $ => choice('\r\n', '\n'),
    _blank_line: $ => token(prec(-1, /[ \t]*\r?\n/)),
  }
});