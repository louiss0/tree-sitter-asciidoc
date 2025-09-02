/**
 * @file AsciiDoc parser for tree-sitter
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  extras: $ => [/[ \t]/],

  // Remove conflicts to let precedence handle disambiguation

  supertypes: $ => [$.block],

  rules: {
    document: $ => repeat($.block),

    block: $ => choice(
      $.section,
      $.attribute_entry,
      $.blank_line,
      $.paragraph
    ),

    // Basic structural elements
    newline: $ => /\r?\n/,
    blank_line: $ => prec.right(seq(repeat(/[ \t]/), $.newline)),

    // Attribute entries :name: value  
    attr_name: $ => /[A-Za-z0-9_][A-Za-z0-9_-]*/,
    attr_value: $ => /[^\n]*/,
    attribute_entry: $ => seq(
      ":",
      field("name", $.attr_name),
      ":",
      optional(/[ \t]+/),
      field("value", $.attr_value),
      $.newline
    ),

    // Paragraphs - text that doesn't start with = or :
    text: $ => token(prec(-1, /[^=:\n][^\n]*/)),
    paragraph: $ => prec.left(seq(
      repeat1(seq($.text, $.newline))
    )),

    // Section titles and hierarchical nesting - use token to ensure lexical priority
    title: $ => /[^\n]+/,
    
    section_title: $ => choice(
      seq(token("="), /[ \t]+/, field("title", $.title), $.newline),
      seq(token("=="), /[ \t]+/, field("title", $.title), $.newline),
      seq(token("==="), /[ \t]+/, field("title", $.title), $.newline),
      seq(token("===="), /[ \t]+/, field("title", $.title), $.newline),
      seq(token("====="), /[ \t]+/, field("title", $.title), $.newline),
      seq(token("======"), /[ \t]+/, field("title", $.title), $.newline)
    ),

    section: $ => prec.right(seq(
      field("title", $.section_title),
      repeat(choice(
        $.blank_line,
        $.attribute_entry,
        $.paragraph,
        $.section // Recursive nesting
      ))
    )),
  },
});
