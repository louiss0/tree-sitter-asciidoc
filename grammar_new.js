/**
 * @file Simplified AsciiDoc parser for tree-sitter that matches test expectations
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 * 
 * This grammar is designed to exactly match the expected AST structure in tests.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  extras: $ => [
    /[ \t\f]+/,  // Only horizontal whitespace as extras, NOT newlines
  ],

  rules: {
    // Document root - matches test expectations exactly
    source_file: $ => repeat($._element),

    _element: $ => choice(
      $.section,
      $.paragraph,
      $.unordered_list,
      $.ordered_list,
      $.description_list,
      $.callout_list,
      $.attribute_entry,
      $.conditional_block,
      $.example_block,
      $.listing_block,
      $.literal_block,
      $.quote_block,
      $.sidebar_block,
      $.passthrough_block,
      $.open_block,
      $.table_block,
      $.admonition_block,
      $.include_directive,
      $.line_comment_block,
      $.block_comment,
      $._blank_line,
    ),

    // ================================================================================
    // SECTIONS - Simple hierarchical structure like tests expect
    // ================================================================================
    
    section: $ => seq(
      $.section_title,
      repeat($._element)
    ),

    section_title: $ => choice(
      seq($.section_marker_1, $.title, $._line_ending),
      seq($.section_marker_2, $.title, $._line_ending),
      seq($.section_marker_3, $.title, $._line_ending),
      seq($.section_marker_4, $.title, $._line_ending),
      seq($.section_marker_5, $.title, $._line_ending),
      seq($.section_marker_6, $.title, $._line_ending),
    ),

    section_marker_1: $ => token(prec(10, seq(field('_start_of_line', '='), ' '))),
    section_marker_2: $ => token(prec(10, seq(field('_start_of_line', '=='), ' '))),
    section_marker_3: $ => token(prec(10, seq(field('_start_of_line', '==='), ' '))),
    section_marker_4: $ => token(prec(10, seq(field('_start_of_line', '===='), ' '))),
    section_marker_5: $ => token(prec(10, seq(field('_start_of_line', '====='), ' '))),
    section_marker_6: $ => token(prec(10, seq(field('_start_of_line', '======'), ' '))),

    title: $ => token.immediate(/[^\r\n]+/),

    // ================================================================================
    // PARAGRAPHS - Simple text content, no over-segmentation
    // ================================================================================
    
    paragraph: $ => seq(
      repeat1($._line),
      optional($._blank_line)
    ),

    _line: $ => seq(
      /[^\r\n]+/,
      $._line_ending
    ),

    // ================================================================================
    // BASIC TOKENS
    // ================================================================================
    
    _line_ending: $ => choice('\r\n', '\n'),
    _blank_line: $ => token(prec(-1, /[ \t]*\r?\n/)),

    // ================================================================================
    // LISTS - Simplified for now
    // ================================================================================
    
    unordered_list: $ => repeat1($.unordered_list_item),
    
    unordered_list_item: $ => seq(
      $.unordered_list_marker,
      field('content', repeat1(/[^\r\n]+/)),
      $._line_ending
    ),
    
    unordered_list_marker: $ => token(choice('* ', '- ')),

    ordered_list: $ => repeat1($.ordered_list_item),
    
    ordered_list_item: $ => seq(
      $.ordered_list_marker, 
      repeat1(/[^\r\n]+/),
      $._line_ending
    ),
    
    ordered_list_marker: $ => token(/\d+\. /),

    description_list: $ => repeat1($.description_item),
    description_item: $ => seq(
      /[^\r\n:]+/,
      '::',
      optional(' '),
      optional(/[^\r\n]+/),
      $._line_ending
    ),

    callout_list: $ => repeat1($.callout_item),
    callout_item: $ => seq(
      /\<\d+\> /,
      repeat1(/[^\r\n]+/),
      $._line_ending  
    ),

    // ================================================================================
    // ATTRIBUTES
    // ================================================================================
    
    attribute_entry: $ => seq(
      ':',
      field('name', $.name),
      ':',
      optional(seq(' ', field('value', $.value))),
      $._line_ending
    ),

    name: $ => token.immediate(/[a-zA-Z0-9_-]+/),
    value: $ => token.immediate(/[^\r\n]*/),

    // ================================================================================
    // DELIMITED BLOCKS - Basic structure
    // ================================================================================
    
    example_block: $ => seq(
      token('===='),
      $._line_ending,
      repeat(/[^\r\n]*\r?\n/),
      token('===='),
      optional($._line_ending)
    ),

    listing_block: $ => seq(
      token('----'),
      $._line_ending,
      repeat(/[^\r\n]*\r?\n/),
      token('----'),
      optional($._line_ending)
    ),

    literal_block: $ => seq(
      token('....'),
      $._line_ending,
      repeat(/[^\r\n]*\r?\n/),
      token('....'),
      optional($._line_ending)
    ),

    quote_block: $ => seq(
      token('____'),
      $._line_ending,
      repeat(/[^\r\n]*\r?\n/),
      token('____'),
      optional($._line_ending)
    ),

    sidebar_block: $ => seq(
      token('****'),
      $._line_ending,
      repeat(/[^\r\n]*\r?\n/),
      token('****'),
      optional($._line_ending)
    ),

    passthrough_block: $ => seq(
      token('++++'),
      $._line_ending,
      repeat(/[^\r\n]*\r?\n/),
      token('++++'),
      optional($._line_ending)
    ),

    open_block: $ => seq(
      token('--'),
      $._line_ending,
      repeat(/[^\r\n]*\r?\n/),
      token('--'),
      optional($._line_ending)
    ),

    // ================================================================================
    // STUB IMPLEMENTATIONS - Will implement fully later
    // ================================================================================
    
    conditional_block: $ => seq('ifdef::', /[^\r\n]*/, $._line_ending),
    table_block: $ => seq('|===', $._line_ending, repeat(/[^\r\n]*\r?\n/), '|===', optional($._line_ending)),
    admonition_block: $ => seq('[NOTE]', $._line_ending),
    include_directive: $ => seq('include::', /[^\r\n]*/, $._line_ending),
    line_comment_block: $ => seq('//', /[^\r\n]*/, $._line_ending),
    block_comment: $ => seq('////', $._line_ending, repeat(/[^\r\n]*\r?\n/), '////', optional($._line_ending)),
  }
});