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
      $.attribute_entry,
      $.example_block,
      $.listing_block,
      $.quote_block,
      $.literal_block,
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

    // ATTRIBUTE ENTRIES
    attribute_entry: $ => seq(
      ':',
      field('name', $.name),
      ':',
      optional(seq(/[ \t]+/, field('value', $.value))),
      $._line_ending
    ),
    
    name: $ => token.immediate(/[a-zA-Z0-9_-]+/),
    value: $ => /[^\r\n]+/,

    // DELIMITED BLOCKS
    example_block: $ => seq(
      field('open', $.example_open),
      optional(field('content', $.block_content)),
      field('close', $.example_close)
    ),
    
    example_open: $ => seq(
      $.EXAMPLE_FENCE_START,
      $._line_ending
    ),
    
    example_close: $ => seq(
      $.EXAMPLE_FENCE_END,
      optional($._line_ending)
    ),
    
    EXAMPLE_FENCE_START: $ => token('===='),
    EXAMPLE_FENCE_END: $ => token('===='),
    
    // Listing blocks
    listing_block: $ => seq(
      field('open', $.listing_open),
      optional(field('content', $.block_content)),
      field('close', $.listing_close)
    ),
    
    listing_open: $ => seq(
      $.LISTING_FENCE_START,
      $._line_ending
    ),
    
    listing_close: $ => seq(
      $.LISTING_FENCE_END,
      optional($._line_ending)
    ),
    
    LISTING_FENCE_START: $ => token('----'),
    LISTING_FENCE_END: $ => token('----'),
    
    // Quote blocks
    quote_block: $ => seq(
      $.quote_open,
      $.block_content,
      $.quote_close
    ),
    
    quote_open: $ => seq(
      $.QUOTE_FENCE_START,
      $._line_ending
    ),
    
    quote_close: $ => seq(
      $.QUOTE_FENCE_END,
      optional($._line_ending)
    ),
    
    QUOTE_FENCE_START: $ => token('____'),
    QUOTE_FENCE_END: $ => token('____'),
    
    // Literal blocks  
    literal_block: $ => seq(
      field('open', $.literal_open),
      field('content', $.block_content),
      field('close', $.literal_close)
    ),
    
    literal_open: $ => seq(
      $.LITERAL_FENCE_START,
      $._line_ending
    ),
    
    literal_close: $ => seq(
      $.LITERAL_FENCE_END,
      optional($._line_ending)
    ),
    
    LITERAL_FENCE_START: $ => token('....'),
    LITERAL_FENCE_END: $ => token('....'),
    
    block_content: $ => repeat1($.content_line),
    content_line: $ => seq(
      /[^\r\n]*/,
      $._line_ending
    ),

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
      $._text_element,
      repeat(seq(/[ \t\f]+/, $._text_element))
    )),
    
    _text_element: $ => choice(
      $.text_segment,
      $.text_colon
    ),
    
    text_segment: $ => token(/[^\s\r\n:]+/),
    
    // For colons in invalid attribute patterns
    text_colon: $ => ':',

    // BASIC TOKENS
    _line_ending: $ => choice('\r\n', '\n'),
    _blank_line: $ => token(prec(-1, /[ \t]*\r?\n/)),
  }
});