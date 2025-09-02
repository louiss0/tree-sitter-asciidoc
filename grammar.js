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

    // Section node: title only for now (revert to simple approach)
    // Full section body scoping is complex and requires level-aware parsing
    section: $ => $.section_title,

    // Paragraph text: any line that doesn't match other patterns
    // Lower precedence allows section markers and attributes to win  
    text: $ => token(prec(-1, /[^\r\n][^\r\n]*/)),

    // Paragraph: single text token (multiline handled by extras whitespace)
    paragraph: $ => $.text,

    // Attribute name: must be valid identifier
    name: $ => /[A-Za-z_][A-Za-z0-9_-]*/,
    
    // Attribute value: any content to end of line, including empty/whitespace
    value: $ => /[^\r\n]*/,
    
    // Attribute entry: always has value (even if empty)
    attribute_entry: $ => prec.dynamic(5, seq(
      ":",
      $.name,
      ":",
      $.value
    )),
  },
});
