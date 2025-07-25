/**
 * @file This is the Zed Compatiable Tree sitter parser for Asciidoc
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  rules: {
    // TODO: add the actual grammar rules
    source_file: ($) => repeat($.document_title),
    // space: ($) => /\s+/,
    document_title: ($) =>
      seq(
        field("marker", /[\=#]/),
        /\s+/,
        choice(
          field("title", /[\w\s]+/),
          seq(field("title", /[\w\s]+:/), field("subtitle", /[\w\s]+/)),
        ),
      ),
  },
});
