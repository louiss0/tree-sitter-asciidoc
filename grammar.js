/**
 * @file AsciiDoc parser for tree-sitter
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 * 
 * Redesigned Implementation: Clean AST without ERROR nodes
 * 
 * Key Design Decisions:
 * - Proper newline handling to eliminate start/end ERROR nodes
 * - Unified inline formatting without wrapper duplication
 * - Clear block/inline separation with supertypes
 * - Robust text segmentation and escape handling
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Precedence constants for clear conflict resolution
const PREC = {
  BLOCK_MARKER: 100,         // Block delimiters at start of line
  SECTION: 90,               // Section headings
  DELIMITED_BLOCK: 80,       // Delimited blocks
  PARAGRAPH: 70,             // Paragraphs
  // Inline element precedences (highest to lowest)
  PASSTHROUGH: 60,           // +++literal text+++
  STRONG: 50,                // *text*
  EMPHASIS: 45,              // _text_
  MONOSPACE: 40,             // `code`
  SUPERSCRIPT: 35,           // ^text^
  SUBSCRIPT: 30,             // ~text~
  TEXT: 1,                   // plain text (lowest)
};

module.exports = grammar({
  name: "asciidoc",

  externals: $ => [
    // No external scanner for now - keep it simple
  ],

  extras: $ => [
    /[ \t\f]+/,                // Horizontal whitespace only
    $.line_comment,            // Line comments
  ],

  // supertypes: $ => [
  //   $._block,
  //   $._inline,
  // ],
  
  // Conflicts for overlapping constructs
  conflicts: $ => [
    // No conflicts needed - precedence handles them
  ],
  
  rules: {
    // Document root - consumes entire input cleanly
    source_file: $ => repeat($._block),

    // Newline handling - explicit to avoid ERROR nodes
    _newline: $ => token(choice('\r\n', '\n')),
    _blank_line: $ => token(/[ \t\f]*\r?\n/),
    
    // Line comment
    line_comment: $ => token(seq('//', /[^\n]*/)),

    // Block types - simplified initial set
    _block: $ => choice(
      $.section,
      $.paragraph,
      $.example_block,
      $.listing_block,
      $.literal_block,
      $.quote_block,
      $.sidebar_block,
      $.passthrough_block,
      $.open_block,
      $._blank_line
    ),

    // ========================================================================
    // SECTIONS
    // ========================================================================
    
    section: $ => prec.right(PREC.SECTION, seq(
      optional($.anchor),
      $.section_title,
      repeat($._block)
    )),
    
    section_title: $ => prec(PREC.SECTION + 5, seq(
      field('marker', token(/={1,6}[ \t]+/)),
      field('title', $.title)
    )),
    
    title: $ => token.immediate(/[^\r\n]+/),
    
    // Block anchor
    anchor: $ => seq(
      token('[['),
      field('id', $.id),
      optional(seq(
        token.immediate(','),
        field('text', $.anchor_text)
      )),
      token.immediate(']]'),
      token.immediate(/[ \t]*\r?\n/)
    ),
    
    id: $ => token(/[A-Za-z_][A-Za-z0-9_-]*/),
    anchor_text: $ => token(/[^,\]\r\n]+/),

    // ========================================================================
    // PARAGRAPHS
    // ========================================================================
    
    paragraph: $ => prec(PREC.PARAGRAPH, seq(
      field('content', $.text_with_inlines)
    )),
    
    // Text with inline elements
    text_with_inlines: $ => prec.right(repeat1(choice(
      $._inline
    ))),
    
    // Inline types
    _inline: $ => choice(
      $.strong,
      $.emphasis,
      $.monospace,
      $.superscript,
      $.subscript,
      $.inline_anchor,
      $.internal_xref,
      $.external_xref,
      $.footnote_inline,
      $.footnote_ref,
      $.footnoteref,
      $.attribute_reference,
      $.passthrough_triple_plus,
      $._text
    ),

    // ========================================================================
    // INLINE FORMATTING
    // ========================================================================
    
    // Strong formatting (bold) - *text*
    strong: $ => prec(PREC.STRONG, seq(
      token('*'),
      field('content', alias(token.immediate(/[^*\r\n]+/), $.strong_text)),
      token.immediate('*')
    )),
    
    // Emphasis formatting (italic) - _text_
    emphasis: $ => prec(PREC.EMPHASIS, seq(
      token('_'),
      field('content', alias(token.immediate(/[^_\r\n]+/), $.emphasis_text)),
      token.immediate('_')
    )),
    
    // Monospace formatting (code) - `text`
    monospace: $ => prec(PREC.MONOSPACE, seq(
      token('`'),
      field('content', alias(token.immediate(/[^`\r\n]+/), $.monospace_text)),
      token.immediate('`')
    )),
    
    // Superscript - ^text^
    superscript: $ => prec(PREC.SUPERSCRIPT, seq(
      token('^'),
      field('content', alias(token.immediate(/[^\^\r\n]+/), $.superscript_text)),
      token.immediate('^')
    )),
    
    // Subscript - ~text~
    subscript: $ => prec(PREC.SUBSCRIPT, seq(
      token('~'),
      field('content', alias(token.immediate(/[^~\r\n]+/), $.subscript_text)),
      token.immediate('~')
    )),

    // ========================================================================
    // INLINE ELEMENTS - Anchors, Cross-references, Footnotes
    // ========================================================================
    
    // Inline anchor - [[id]] or [[id,text]]
    inline_anchor: $ => seq(
      token('[['),
      field('id', $.id),
      optional(seq(
        token.immediate(','),
        field('text', $.anchor_text)
      )),
      token.immediate(']]')
    ),
    
    // Internal cross-reference - <<target>> or <<target,text>>
    internal_xref: $ => seq(
      token('<<'),
      field('target', $.id),
      optional(seq(
        token.immediate(','),
        field('text', alias($.xref_text, $.bracketed_text))
      )),
      token.immediate('>>')
    ),
    
    xref_text: $ => token(/[^>\r\n]+/),
    
    // External cross-reference - xref:target[] or xref:target[text]
    external_xref: $ => seq(
      token('xref:'),
      field('target', $.xref_target),
      token.immediate('['),
      optional(field('text', $.bracketed_text)),
      token.immediate(']')
    ),
    
    xref_target: $ => token(/[^\[\r\n]+/),
    bracketed_text: $ => token(/[^\]]+/),
    
    // Footnote inline - footnote:[text]
    footnote_inline: $ => seq(
      token('footnote:['),
      field('text', $.bracketed_text),
      token.immediate(']')
    ),
    
    // Footnote reference - footnote:id[] or footnote:id[text]
    footnote_ref: $ => seq(
      token('footnote:'),
      field('id', $.id),
      token.immediate('['),
      optional(field('text', $.bracketed_text)),
      token.immediate(']')
    ),
    
    // Footnote reference - footnoteref:id[]
    footnoteref: $ => seq(
      token('footnoteref:'),
      field('id', $.id),
      token.immediate('['),
      optional(field('text', $.bracketed_text)),
      token.immediate(']')
    ),
    
    // Attribute reference - {name}
    attribute_reference: $ => token(/\{[A-Za-z0-9_][A-Za-z0-9_-]*\}/),
    
    // Passthrough - +++literal text+++
    passthrough_triple_plus: $ => prec(PREC.PASSTHROUGH, seq(
      token('+++'),
      field('content', token.immediate(/(?:[^+]|\+[^+]|\+\+[^+])*/)),
      token.immediate('+++')
    )),

    // ========================================================================
    // TEXT
    // ========================================================================
    
    // Plain text - match everything that's not a special inline marker
    // Exclude '=' to avoid conflicts with section titles
    _text: $ => alias($.text_segment, $.text_segment),
    text_segment: $ => token(prec(PREC.TEXT, /[^*_`^~\[{+<>=\r\n\|\\]+/)),

    // ========================================================================
    // DELIMITED BLOCKS
    // ========================================================================
    
    // Example block - ====
    example_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.example_open),
      optional(field('content', $.block_content)),
      field('close', $.example_close)
    )),
    
    example_open: $ => token(/====[ \t]*\r?\n/),
    example_close: $ => token(/====[ \t]*\r?\n/),
    
    // Listing block - ----
    listing_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.listing_open),
      optional(field('content', $.block_content)),
      field('close', $.listing_close)
    )),
    
    listing_open: $ => token(/----[ \t]*\r?\n/),
    listing_close: $ => token(/----[ \t]*\r?\n/),
    
    // Literal block - ....
    literal_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.literal_open),
      optional(field('content', $.block_content)),
      field('close', $.literal_close)
    )),
    
    literal_open: $ => token(/\.\.\.\.[ \t]*\r?\n/),
    literal_close: $ => token(/\.\.\.\.[ \t]*\r?\n/),
    
    // Quote block - ____
    quote_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.quote_open),
      optional(field('content', $.block_content)),
      field('close', $.quote_close)
    )),
    
    quote_open: $ => token(/____[ \t]*\r?\n/),
    quote_close: $ => token(/____[ \t]*\r?\n/),
    
    // Sidebar block - ****
    sidebar_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.sidebar_open),
      optional(field('content', $.block_content)),
      field('close', $.sidebar_close)
    )),
    
    sidebar_open: $ => token(/\*\*\*\*[ \t]*\r?\n/),
    sidebar_close: $ => token(/\*\*\*\*[ \t]*\r?\n/),
    
    // Passthrough block - ++++
    passthrough_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.passthrough_open),
      optional(field('content', $.block_content)),
      field('close', $.passthrough_close)
    )),
    
    passthrough_open: $ => token(/\+\+\+\+[ \t]*\r?\n/),
    passthrough_close: $ => token(/\+\+\+\+[ \t]*\r?\n/),
    
    // Open block - --
    open_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.openblock_open),
      optional(field('content', $.block_content)),
      field('close', $.openblock_close)
    )),
    
    openblock_open: $ => token(/--[ \t]*\r?\n/),
    openblock_close: $ => token(/--[ \t]*\r?\n/),
    
    // Block content - raw lines
    block_content: $ => repeat1($._content_line),
    _content_line: $ => token(/[^\r\n]*\r?\n/),
    
    // Block metadata
    metadata: $ => repeat1(choice(
      $.anchor,
      $.block_title,
      $.id_and_roles,
      $.block_attributes
    )),
    
    block_title: $ => token(/\.[^\r\n]+\r?\n/),
    id_and_roles: $ => token(/\[\s*(?:#[A-Za-z][\w:-]*)?(?:\s*\.[A-Za-z0-9_-]+)*\s*\]\s*\r?\n/),
    block_attributes: $ => token(/\[[^\]\r\n]*=[^\]\r\n]*\]\s*\r?\n/),
  }
});
