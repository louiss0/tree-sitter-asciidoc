/**
 * @file AsciiDoc parser for tree-sitter
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 * 
 * Stage 1 Implementation: Hierarchical sections, multi-line paragraphs, basic attributes
 * 
 * Key Design Decisions:
 * - WARP compliant: extras handles all whitespace, no whitespace nodes in AST
 * - Level-aware sections with proper nesting based on heading levels
 * - Multi-line paragraphs separated by blank lines
 * - Strict attribute parsing to avoid invalid matches
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  extras: $ => [/\s/],

  conflicts: $ => [
    [$.section],
    [$.attribute_entry, $.paragraph],
    [$.name, $.paragraph]
  ],
  
  rules: {
    source_file: $ => repeat($._block),

    _block: $ => choice(
      $.section,
      $.attribute_entry,
      $.paragraph
    ),

    // Smart section structure - title with optional content that doesn't interfere with flat sections
    section: $ => prec.right(seq(
      $.section_title,
      repeat(choice(
        $.attribute_entry,
        $.paragraph
      ))
    )),

    // Section title with field - require space after equals to avoid false positives
    section_title: $ => seq(
      token(prec(10, /={1,6}[ \t]+/)),
      field("title", $.title)
    ),

    // Title as separate rule
    title: $ => token.immediate(/[^\r\n]+/),

    // Multi-line paragraph text
    paragraph: $ => seq(
      field("text", $.text)
    ),

    // Text spans multiple lines until blank line or other construct
    text: $ => token(prec(-1, /[^\r\n][^\r\n]*(?:\r?\n[^\r\n:=][^\r\n]*)*/)),

    // Attribute entry with field-based structure and high precedence
    attribute_entry: $ => prec(10, seq(
      token(':'),
      field('name', $.name),
      token.immediate(':'),
      field('value', optional($.value))
    )),

    // Attribute name - strict immediate pattern
    name: $ => token.immediate(/[A-Za-z0-9][A-Za-z0-9_-]*/),
    
    // Attribute value - immediate pattern
    value: $ => token.immediate(/[^\r\n]*/),
  },
});
