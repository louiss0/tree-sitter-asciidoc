/**
 * @file This is my parser for Asciidoc
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
