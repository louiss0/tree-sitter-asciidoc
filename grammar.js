/**
 * @file Fixed Tree sitter parser for Asciidoc - properly handling admonitions
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  conflicts: $ => [
    [$.unordered_list, $.ordered_list],
  ],

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $.admonition,
          $.admonition_block,
          $.paragraph,
          $.unordered_list,
          $.ordered_list,
          $.listing_block,
          $.cross_reference,
          $.image_block,
          $._newline,
        ),
      ),

    // Inline admonition - expects simple text content
    admonition: ($) =>
      prec(2, seq(
        $.admonition_type,
        token(":"),
        optional($._space),
        $._inline_admonition_content,
      )),

    // Map inline content to expected name for tests
    _inline_admonition_content: ($) => alias(token(/[^\n]+/), $.admonition_content),

    // Block admonition - expects complex content
    admonition_block: ($) =>
      seq(
        $.attribute,
        optional($.block_title),
        $.delimiter,
        $._block_admonition_content,
        $.delimiter,
      ),

    // Map block content to expected name for tests
    _block_admonition_content: ($) => 
      alias(
        repeat1(
          choice(
            $.paragraph,
            $.unordered_list,
            $.ordered_list,
            $.listing_block,
            $.image_block,
            $.admonition,
            $.cross_reference,
            $._newline,
          ),
        ),
        $.admonition_content
      ),

    admonition_type: () =>
      token(choice("NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION")),

    // Attribute rules
    attribute: ($) =>
      seq(
        "[",
        choice(
          seq(
            $.admonition_type,
            optional(seq(",", $.attribute_name, "=", $.attribute_value)),
            optional(seq(".", $.role_name)),
          ),
          seq(
            $.attribute_name,
            optional(seq("=", $.attribute_value)),
          ),
        ),
        "]",
      ),

    attribute_name: () => token(/[a-zA-Z][a-zA-Z0-9_-]*/),
    attribute_value: () => token(/[^\]]+/),
    role_name: () => token(/[a-zA-Z][a-zA-Z0-9_-]*/),

    // Block structure rules
    delimiter: () => token(/={4,}/),

    block_title: ($) =>
      seq(
        ".",
        repeat1(choice($._text, $._space)),
        $._newline,
      ),

    // Paragraph and text rules
    paragraph: ($) =>
      seq(
        repeat1(
          choice(
            $.text_formatting,
            $._text,
            $._space,
          ),
        ),
        $._newline,
      ),

    text_formatting: ($) =>
      choice(
        $.bold_text,
        $.monospace_text,
      ),

    bold_text: ($) =>
      seq(
        token("*"),
        token(/[^*\n\r]+/),
        token("*"),
      ),

    monospace_text: ($) =>
      seq(
        token("`"),
        token(/[^`\n\r]+/),
        token("`"),
      ),

    _text: () => token(prec(-1, /[^\n\r\[\]\*_`#^~\s<>]+/)),

    // List rules
    unordered_list: ($) =>
      repeat1($.list_item),

    ordered_list: ($) =>
      prec.left(seq(
        optional($.block_title),
        repeat1($.list_item),
      )),

    list_item: ($) =>
      seq(
        choice(
          token(/\*[ \t]+/),
          token(/\.[ \t]+/),
          token(/-[ \t]+/),
        ),
        repeat1(
          choice(
            $.text_formatting,
            $._text,
            $._space,
          ),
        ),
        $._newline,
      ),

    // Basic block rules
    listing_block: ($) =>
      seq(
        optional($.block_title),
        alias(token(/----/), $.delimiter),
        alias(repeat($._listing_line), $.listing_content),
        alias(token(/----/), $.delimiter),
      ),

    _listing_line: () => token(/[^\n]*\n/),

    // Cross-reference rules
    cross_reference: ($) =>
      seq(
        "<<",
        alias(token(/[^<>,]+/), $.reference_id),
        optional(seq(",", token(/[^<>,]+/))),
        ">>",
      ),

    // Image rules
    image_block: ($) =>
      seq(
        "image::",
        alias(token(/[^\[]+/), $.image_path),
        "[",
        optional(alias(token(/[^\]]+/), $.image_alt)),
        "]",
        $._newline,
      ),

    // General private token rules
    _newline: () => token(/\n/),
    _space: () => token(/[ \t]+/),
  },
});
