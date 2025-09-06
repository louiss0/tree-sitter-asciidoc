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
  ADMONITION: 85,            // Admonition blocks and paragraphs
  DELIMITED_BLOCK: 80,       // Delimited blocks
  LIST: 95,                  // Lists (higher than section to prioritize)
  CONDITIONAL: 75,           // Conditional blocks (higher than paragraphs)
  ATTRIBUTE_ENTRY: 82,       // Attribute entries (higher than lists and paragraphs)
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
    // Order must match scanner.c enum exactly!
    $.BLOCK_FENCE_START,
    $.BLOCK_FENCE_END,
    $.TABLE_FENCE_START,
    $.TABLE_FENCE_END,
    $.LIST_CONTINUATION,
    $.AUTOLINK_BOUNDARY,
    $.ATTRIBUTE_LIST_START,
    // New line-anchored block markers
    $._LIST_UNORDERED_MARKER, // "* " or "- " at start of line (hidden from AST)
    $._LIST_ORDERED_MARKER,   // "N. " at start of line (hidden from AST)
    $.DESCRIPTION_LIST_SEP,   // "::"
    $._DESCRIPTION_LIST_ITEM, // "term:: description" pattern (hidden from AST)
    $.CALLOUT_MARKER,        // "<N> " at start of line
    $._SECTION_MARKER,       // "={1,6} " at start of line (hidden from AST)
    $._HEADING_LEVEL_1,      // "= " at start of line (hidden from AST)
    $._HEADING_LEVEL_2,      // "== " at start of line (hidden from AST) 
    $._HEADING_LEVEL_3,      // "=== " at start of line (hidden from AST)
    $._HEADING_LEVEL_4,      // "==== " at start of line (hidden from AST)
    $._HEADING_LEVEL_5,      // "===== " at start of line (hidden from AST)
    $._HEADING_LEVEL_6,      // "====== " at start of line (hidden from AST)
    $._ifdef_open_token,     // "ifdef::" at start of line
    $._ifndef_open_token,    // "ifndef::" at start of line
    $._ifeval_open_token,    // "ifeval::" at start of line
    $._endif_directive_token // "endif::" at start of line
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
    source_file: $ => repeat(choice(
      $.section,              // Sections at root level
      $.attribute_entry,      // Top-level attributes allowed
      $._blank_line          // Blank lines at root
    )),

    // Newline handling - explicit to avoid ERROR nodes
    _newline: $ => token(choice('\r\n', '\n')),
    _blank_line: $ => token(/[ \t\f]*\r?\n/),
    
    // Line comment
    line_comment: $ => token(seq('//', /[^\n]*/)),

  // Block types - comprehensive set (following EBNF specification)
  _block: $ => choice(
    $.section,              // All section levels
    $._content_block
  ),

    // ========================================================================
    // HEADINGS (Following EBNF: heading = [ anchor ], heading_level, ' ', line_content, newline)
    // ========================================================================
    
  // Clean section rule with level-aware nesting
  section: $ => prec.right(seq(
    optional($.anchor),
    $.section_title,
    repeat(choice(
      $.section,
      $._content_block
    ))
  )),
    
  // Section title handles all heading levels
  section_title: $ => seq(
    choice(
      $._HEADING_LEVEL_1,
      $._HEADING_LEVEL_2,
      $._HEADING_LEVEL_3,
      $._HEADING_LEVEL_4,
      $._HEADING_LEVEL_5,
      $._HEADING_LEVEL_6,
      $._SECTION_MARKER  // Fallback
    ),
    field('title', $.title)
  ),
    
    title: $ => token.immediate(/[^\r\n]+/),
    
    // Content blocks - everything except sections
    _content_block: $ => choice(
      $.paragraph,
      $.attribute_entry,
      $.paragraph_admonition,
      $.admonition_block,
      $.unordered_list,
      $.ordered_list,
      $.description_list,
      $.callout_list,
      $.conditional_block,
      $.example_block,
      $.listing_block,
      $.literal_block,
      $.quote_block,
      $.sidebar_block,
      $.passthrough_block,
      $.open_block,
      $.table_block,
      $._blank_line
    ),
    
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
    
    // Text with inline elements - single line only
    text_with_inlines: $ => prec.right(repeat1($._inline)),
    
    // Inline types
    _inline: $ => choice(
      prec(10, $.inline_element),
      $._text
    ),
    
    // Inline element wrapper for complex inline constructs  
    inline_element: $ => choice(
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
      $.auto_link,
      $.link,
      $.image,
      $.role_span,
      $.ui_macro,
      $.math_macro
    ),

    // ========================================================================
    // INLINE FORMATTING
    // ========================================================================
    
    // Strong formatting (bold) - wrapper for constrained/unconstrained
    strong: $ => choice(
      $.strong_constrained
    ),
    
    // Emphasis formatting (italic) - wrapper for constrained/unconstrained
    emphasis: $ => choice(
      $.emphasis_constrained
    ),
    
    // Monospace formatting (code) - wrapper for constrained/unconstrained
    monospace: $ => choice(
      $.monospace_constrained
    ),
    
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
    // Exclude '=' to allow heading recognition by external scanner
    _text: $ => alias($.text_segment, $.text_segment),
    text_segment: $ => token(prec(PREC.TEXT, /[^*_`^~\[{+<>\r\n\|\\=:-]+/)),

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
    block_content: $ => repeat1($.content_line),
    content_line: $ => token(prec(-1, /[^\r\n]*\r?\n/)),
    
    // Block metadata
    metadata: $ => repeat1(choice(
      $.anchor,
      $.block_title,
      $.id_and_roles,
      $.block_attributes
    )),
    
    block_title: $ => token(/\.[^\r\n]+\r?\n/),
    id_and_roles: $ => token(/\[\s*(?:#[A-Za-z][\w:-]*)?(?:\s*\.[A-Za-z0-9_-]+)*\s*\]\s*\r?\n/),
    block_attributes: $ => token(/\[[^\]\r\n]+\]\s*\r?\n/),
    
    // ========================================================================
    // ATTRIBUTE ENTRIES
    // ========================================================================
    
    attribute_entry: $ => prec(PREC.ATTRIBUTE_ENTRY, choice(
      // Attribute with value: :name: value
      seq(
        field('name', alias(token(/:[A-Za-z][A-Za-z0-9_-]*:/), $.name)),
        optional(token.immediate(/[ \t]+/)),
        field('value', alias(token.immediate(/[^\r\n]+/), $.value))
      ),
      // Attribute without value: :name:
      seq(
        field('name', alias(token(/:[A-Za-z][A-Za-z0-9_-]*:/), $.name)),
        token.immediate(/[ \t]*\r?\n/)
      )
    )),
    
    // ========================================================================
    // PARAGRAPH ADMONITIONS
    // ========================================================================
    
    paragraph_admonition: $ => prec(PREC.ADMONITION, seq(
      field('label', $.admonition_label),
      token.immediate(':'),
      token.immediate(/[ \t]+/),
      field('content', $.text_with_inlines)
    )),
    
    admonition_label: $ => token(choice('NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION')),
    
    // ========================================================================
    // ADMONITION BLOCKS
    // ========================================================================
    
    admonition_block: $ => seq(
      field('label', $.admonition_label),
      $._newline,
      choice(
        $.example_block,
        $.listing_block,
        $.literal_block,
        $.quote_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block
      )
    ),
    
    // ========================================================================
    // LISTS
    // ========================================================================
    
    // Unordered list
    unordered_list: $ => prec(PREC.LIST, repeat1($.unordered_list_item)),
    
    unordered_list_item: $ => prec(PREC.LIST, seq(
      $._LIST_UNORDERED_MARKER,  // Hidden from AST
      $._list_item_content       // Use hidden content rule
    )),
    
    // Hidden rule for list item content to simplify AST
    _list_item_content: $ => $.text_with_inlines,
    
    // Ordered list
    ordered_list: $ => prec(PREC.LIST, repeat1($.ordered_list_item)),
    
    ordered_list_item: $ => seq(
      $._LIST_ORDERED_MARKER,    // Hidden from AST  
      $._list_item_content       // Use shared content rule
    ),
    
    // Description list
    description_list: $ => prec(PREC.LIST, repeat1($.description_item)),
    
    description_item: $ => prec(PREC.LIST, seq(
      $._DESCRIPTION_LIST_ITEM   // Hidden scanner token that captures entire line
    )),
    
    // Callout list
    callout_list: $ => prec(PREC.LIST, repeat1($.callout_item)),
    
    callout_item: $ => seq(
      field('marker', $.CALLOUT_MARKER),
      field('content', $.text_with_inlines)
    ),
    
    // ========================================================================
    // CONDITIONAL BLOCKS
    // ========================================================================
    
    conditional_block: $ => prec(PREC.CONDITIONAL, choice(
      $.ifdef_block,
      $.ifndef_block,
      $.ifeval_block
    )),
    
    ifdef_block: $ => seq(
      field('open', $.ifdef_open),
      repeat($._block),
      field('close', $.endif_directive)
    ),
    
    ifndef_block: $ => seq(
      field('open', $.ifndef_open),
      repeat($._block),
      field('close', $.endif_directive)
    ),
    
    ifeval_block: $ => seq(
      field('open', $.ifeval_open),
      repeat($._block),
      field('close', $.endif_directive)
    ),
    
    // ========================================================================
    // TABLE BLOCKS
    // ========================================================================
    
    table_block: $ => seq(
      optional($.metadata),
      field('open', $.table_open),
      field('content', $.table_content),
      field('close', $.table_close)
    ),
    
    table_open: $ => token(/\|===[ \t]*\r?\n/),
    table_close: $ => token(/\|===[ \t]*\r?\n/),
    
    table_content: $ => repeat1($.content_line),
    
    // ========================================================================
    // MISSING INLINE CONSTRUCTS
    // ========================================================================
    
    // Auto links
    auto_link: $ => token(/https?:\/\/[^\s\[\]<>]+/),
    
    // Links with text 
    link: $ => seq(
      field('url', $.auto_link),
      token.immediate('['),
      optional(field('text', $.bracketed_text)),
      token.immediate(']')
    ),
    
    // Images
    image: $ => seq(
      token('image:'),
      field('target', $.image_target),
      token.immediate('['),
      optional(field('attributes', $.bracketed_text)),
      token.immediate(']')
    ),
    
    image_target: $ => token(/[^\[\r\n]+/),
    
    // Role spans
    role_span: $ => seq(
      token('['),
      field('roles', $.role_list),
      token.immediate(']'),
      token.immediate('#'),
      field('content', $.bracketed_text),
      token.immediate('#')
    ),
    
    role_list: $ => seq(
      choice($.role, $.id, $.option),
      repeat(seq(token(','), choice($.role, $.id, $.option)))
    ),
    role: $ => token(/\.[A-Za-z][A-Za-z0-9_-]*/),
    option: $ => token(/%[A-Za-z][A-Za-z0-9_-]*/),
    
    // UI Macros
    ui_macro: $ => choice(
      seq(token('kbd:'), field('keys', $.macro_target), $.attribute_list),
      seq(token('btn:'), field('label', $.macro_target), $.attribute_list),
      seq(token('menu:'), field('items', $.macro_target), $.attribute_list)
    ),
    
    // Math macros
    math_macro: $ => choice(
      seq(token('latexmath:'), field('content', $.macro_target), $.attribute_list),
      seq(token('asciimath:'), field('content', $.macro_target), $.attribute_list)
    ),
    
    macro_target: $ => token(/[^\[\r\n]+/),
    attribute_list: $ => seq(
      token('['),
      optional($.bracketed_text),
      token.immediate(']')
    ),
    
    // Constrained formatting variants
    strong_constrained: $ => prec(PREC.STRONG, seq(
      token('*'),
      field('content', alias(token.immediate(/[^*\r\n]+/), $.strong_text)),
      token.immediate('*')
    )),
    
    emphasis_constrained: $ => prec(PREC.EMPHASIS, seq(
      token('_'),
      field('content', alias(token.immediate(/[^_\r\n]+/), $.emphasis_text)),
      token.immediate('_')
    )),
    
    monospace_constrained: $ => prec(PREC.MONOSPACE, seq(
      token('`'),
      field('content', alias(token.immediate(/[^`\r\n]+/), $.monospace_text)),
      token.immediate('`')
    )),
    
    // ========================================================================
    // EXTERNAL TOKEN RULES
    // ========================================================================
    
    // These rules make the external tokens visible in the AST as nodes
    ifdef_open: $ => $._ifdef_open_token,
    ifndef_open: $ => $._ifndef_open_token,
    ifeval_open: $ => $._ifeval_open_token,
    endif_directive: $ => $._endif_directive_token,
    
  }
});
