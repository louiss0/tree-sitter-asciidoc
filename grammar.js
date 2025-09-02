/**
 * @file AsciiDoc parser for tree-sitter
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  extras: $ => [/\s/],

  supertypes: $ => [$.block],

  rules: {
    source_file: $ => repeat($.block),

    block: $ => choice(
      $.section,
      $.attribute_entry,
      $.paragraph
    ),

    // Attribute entries :name: value  
    name: $ => /[A-Za-z0-9_][A-Za-z0-9_-]*/,
    value: $ => /[^\r\n]*/,
    attribute_entry: $ => prec(1, seq(
      token(":"),
      field("name", $.name),
      token(":"),
      optional(seq(/[ \t]+/, field("value", $.value)))
    )),

    // Paragraphs - text that doesn't start with = (but can start with invalid :)
    text: $ => token(prec(-1, /[^=\r\n][^\r\n]*/)),
    paragraph: $ => prec.left(repeat1($.text)),

    // Section titles and hierarchical nesting - use token to ensure lexical priority
    title: $ => /[^\r\n]+/,
    
    section_title: $ => choice(
      seq(token(prec(2, "=")), /[ \t]+/, field("title", $.title)),
      seq(token(prec(2, "==")), /[ \t]+/, field("title", $.title)),
      seq(token(prec(2, "===")), /[ \t]+/, field("title", $.title)),
      seq(token(prec(2, "====")), /[ \t]+/, field("title", $.title)),
      seq(token(prec(2, "=====")), /[ \t]+/, field("title", $.title)),
      seq(token(prec(2, "======")), /[ \t]+/, field("title", $.title))
    ),

    section: $ => prec.right(seq(
      field("title", $.section_title),
      repeat(choice(
        $.attribute_entry,
        $.paragraph,
        $.section // Recursive nesting
      ))
    )),
  },
});
