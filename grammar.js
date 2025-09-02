/**
 * @file AsciiDoc parser for tree-sitter
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 * 
 * Stage 1 Implementation: Section titles, paragraphs, basic attributes
 * 
 * Key Design Decisions:
 * - WARP compliant: extras handles all whitespace, no whitespace nodes in AST
 * - Section markers require space/tab after equals to avoid false positives
 * - Lexical precedence prevents paragraphs from absorbing section markers
 * - Natural line boundaries via token patterns (no explicit newlines)
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  // WARP: Use /\s/ for all whitespace - no explicit whitespace nodes in AST
  // This handles spaces, tabs, and newlines invisibly between tokens
  extras: $ => [/\s/],

  rules: {
    // Root node: only meaningful constructs (no whitespace blocks)
    source_file: $ => repeat(choice(
      $.section,
      $.attribute_entry, 
      $.paragraph
    )),

    // Section marker: high precedence token requiring space/tab after equals
    // Precedence 10 ensures this wins over paragraph text at line start
    // Pattern /={1,6}[ \t]+/ prevents false positives like "==NoSpace"
    _section_marker: $ => token(prec(10, /={1,6}[ \t]+/)),

    // Title text: immediate token that stops at line boundaries
    // token.immediate ensures no whitespace between marker and title
    title: $ => token.immediate(/[^\r\n]+/),

    // Section title: marker + title (spacing handled by marker token)
    section_title: $ => seq($._section_marker, $.title),

    // Section node - Stage 1: just the title (body scoping comes later)
    section: $ => $.section_title,

    // Paragraph text: any line not starting with section markers or attributes
    // Precedence -1 allows section markers and attributes to win when they match
    // Pattern /[^\r\n:][^\r\n]*/ excludes lines starting with : or newline
    text: $ => token(prec(-1, /[^\r\n:][^\r\n]*/)),

    // Paragraph: single text token (multiline handled by extras whitespace)
    paragraph: $ => $.text,

    // Attribute entries: :name: value pattern
    _attr_name: $ => /[A-Za-z0-9_][A-Za-z0-9_-]*/,
    _attr_value: $ => /[^\r\n]*/,
    attribute_entry: $ => seq(
      ":",
      field("name", $._attr_name),
      ":",
      optional(field("value", $._attr_value))
    ),
  },
});
