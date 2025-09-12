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
  DELIMITED_BLOCK: 120,      // Delimited blocks (high precedence to beat paragraphs)
  LIST: 110,                 // Lists (highest precedence to allow grouping)
  CONDITIONAL: 75,           // Conditional blocks (higher than paragraphs)
  ATTRIBUTE_ENTRY: 95,       // Attribute entries (higher than lists and paragraphs)
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
    $.TABLE_FENCE_START,
    $.TABLE_FENCE_END,
    $.EXAMPLE_FENCE_START,
    $.EXAMPLE_FENCE_END,
    $.LISTING_FENCE_START,
    $.LISTING_FENCE_END,
    $.LITERAL_FENCE_START,
    $.LITERAL_FENCE_END,
    $.QUOTE_FENCE_START,
    $.QUOTE_FENCE_END,
    $.SIDEBAR_FENCE_START,
    $.SIDEBAR_FENCE_END,
    $.PASSTHROUGH_FENCE_START,
    $.PASSTHROUGH_FENCE_END,
    $.OPENBLOCK_FENCE_START,
    $.OPENBLOCK_FENCE_END,
    $.LIST_CONTINUATION,
    $.AUTOLINK_BOUNDARY,
    $.ATTRIBUTE_LIST_START,
    $.DELIMITED_BLOCK_CONTENT_LINE, // Content line within delimited blocks (not fence end)
    $._BLOCK_ANCHOR,         // Block anchor at start of line (hidden from AST)
    // Line-anchored block markers (non-section)
    $._LIST_UNORDERED_MARKER, // "* " or "- " at start of line (hidden from AST)
    $._LIST_ORDERED_MARKER,   // "N. " at start of line (hidden from AST)
    $.DESCRIPTION_LIST_SEP,   // "::"
    $._DESCRIPTION_LIST_ITEM, // "term:: description" pattern (hidden from AST)
    $.CALLOUT_MARKER,        // "<N> " at start of line
    // Conditional directives
    $._ifdef_open_token,     // "ifdef::" at start of line
    $._ifndef_open_token,    // "ifndef::" at start of line
    $._ifeval_open_token,    // "ifeval::" at start of line
    $._endif_directive_token // "endif::" at start of line
  ],

  extras: $ => [
    /[ \t\f]+/,                // Horizontal whitespace only
    // Note: line comments removed from extras to allow block-level parsing
  ],

  // supertypes: $ => [
  //   $._block,
  //   $._inline,
  // ],
  
  // Conflicts for overlapping constructs  
  conflicts: $ => [
    // No conflicts needed
  ],
  
  rules: {
    // Document root - allow all types of blocks at root level
    source_file: $ => repeat(choice(
      $._block,               // Any block type
      $._blank_line          // Blank lines at root
    )),

    // Newline handling - more flexible to avoid ERROR nodes
    _newline: $ => token(prec(-1, choice('\r\n', '\n'))),
    _blank_line: $ => token(prec(-1, /[ \t\f]*\r?\n/)),
    
    // Line comment token for extras (inline usage)
    line_comment: $ => token(seq('//', /[^\n]*/)),
    
    // Block-level line comment (standalone comment lines)
    line_comment_block: $ => seq(
      token(prec(10, seq('//', /[^\n]*/))),
      $._newline
    ),
    
    // Block comment - opaque content prevents internal syntax highlighting
    block_comment: $ => seq(
      token(prec(PREC.DELIMITED_BLOCK + 10, '////')),
      $._newline,
      repeat($.comment_line),
      token(prec(PREC.DELIMITED_BLOCK + 10, '////')),
      optional($._newline)
    ),
    
    // Comment line - raw text content, no internal parsing
    comment_line: $ => token(/[^\r\n]*\r?\n/),

    // ========================================================================
    // INCLUDE DIRECTIVES
    // ========================================================================
    
    include_directive: $ => prec(PREC.ATTRIBUTE_ENTRY + 5, seq(
      token(prec(PREC.ATTRIBUTE_ENTRY + 10, 'include::')),
      field('path', $.include_path),
      '[',
      optional(field('options', $.include_options)),
      ']',
      $._newline
    )),
    
    include_path: $ => token(/[^\[\r\n]+/),
    include_options: $ => token(/[^\]\r\n]*/),

    // ========================================================================
    // INDEX TERMS
    // ========================================================================
    
    index_term: $ => choice(
      $.index_term_macro,
      $.index_term2_macro,
      $.concealed_index_term
    ),
    
    // indexterm:[primary] and indexterm:[primary,secondary,tertiary]
    index_term_macro: $ => seq(
      token(prec(PREC.PASSTHROUGH + 5, 'indexterm:[')),
      field('terms', $.index_text),
      ']'
    ),
    
    // indexterm2:[primary] - visible in text
    index_term2_macro: $ => seq(
      token(prec(PREC.PASSTHROUGH + 5, 'indexterm2:[')),
      field('terms', $.index_text),
      ']'
    ),
    
    // (((primary))) and (((primary,secondary,tertiary)))
    concealed_index_term: $ => seq(
      token(prec(PREC.PASSTHROUGH + 5, '(((')),
      field('terms', $.index_text),
      token.immediate(')))'
    ),
    ),
    
    // Primary term with optional secondary and tertiary terms
    index_text: $ => seq(
      field('primary', $.index_term_text),
      optional(seq(
        ',',
        field('secondary', $.index_term_text),
        optional(seq(
          ',',
          field('tertiary', $.index_term_text)
        ))
      ))
    ),
    
    index_term_text: $ => token(/[^,\)\]\r\n]+/),

    // ========================================================================
    // BIBLIOGRAPHY ENTRIES
    // ========================================================================
    
    bibliography_entry: $ => prec(PREC.ATTRIBUTE_ENTRY + 10, seq(
      token('[[['),
      field('id', $.bibliography_id),
      optional(seq(',', field('citation', $.bibliography_citation))),
      ']]]',
      optional(seq(' ', field('description', $.bibliography_description))),
      $._newline
    )),
    
    bibliography_id: $ => token(/[^,\]\r\n]+/),
    bibliography_citation: $ => token(/[^\]\r\n]+/),
    bibliography_description: $ => token(/[^\r\n]+/),
    
    // Bibliography reference in text (using existing cross-reference)
    bibliography_reference: $ => seq(
      '<<',
      field('id', $.bibliography_ref_id),
      '>>'
    ),
    
    bibliography_ref_id: $ => token(/[^>\r\n]+/),

    // ========================================================================
    // MATH BLOCK FORMS
    // ========================================================================
    
    math_block: $ => choice(
      $.stem_block,
      $.latexmath_block,
      $.asciimath_block
    ),
    
    // STEM block with [stem] attribute and ++++ delimiters
    stem_block: $ => seq(
      optional($.metadata),
      $.stem_block_label,
      $._newline,
      field('open', $.passthrough_open),
      optional(field('content', $.math_content)),
      field('close', $.passthrough_close)
    ),
    
    // LaTeX math block with [latexmath] attribute and ++++ delimiters
    latexmath_block: $ => seq(
      optional($.metadata),
      $.latexmath_block_label,
      $._newline,
      field('open', $.passthrough_open),
      optional(field('content', $.math_content)),
      field('close', $.passthrough_close)
    ),
    
    // AsciiMath block with [asciimath] attribute and ++++ delimiters
    asciimath_block: $ => seq(
      optional($.metadata),
      $.asciimath_block_label,
      $._newline,
      field('open', $.passthrough_open),
      optional(field('content', $.math_content)),
      field('close', $.passthrough_close)
    ),
    
    stem_block_label: $ => token('[stem]'),
    latexmath_block_label: $ => token('[latexmath]'),
    asciimath_block_label: $ => token('[asciimath]'),
    
    math_content: $ => repeat1(alias($.DELIMITED_BLOCK_CONTENT_LINE, $.math_line)),
    math_line: $ => token(/[^\r\n]*\r?\n/),


  // All blocks - every block contains a trailing newline (like markdown)
  _block: $ => choice(
    $._block_not_section,
    $.section,
  ),
  
  _block_not_section: $ => choice(
    // High precedence blocks that should be matched before paragraphs
    prec(PREC.ATTRIBUTE_ENTRY, $.attribute_entry),
    prec(PREC.ATTRIBUTE_ENTRY + 5, $.include_directive),
    prec(PREC.ATTRIBUTE_ENTRY + 3, $.bibliography_entry),
    prec(PREC.LIST, $.unordered_list),
    prec(PREC.LIST, $.ordered_list), 
    prec(PREC.LIST, $.description_list),
    prec(PREC.LIST, $.callout_list),
    prec.right(PREC.CONDITIONAL, $.conditional_block),
    prec(PREC.DELIMITED_BLOCK + 5, $.block_comment),
    prec(PREC.ATTRIBUTE_ENTRY + 1, $.line_comment_block),
    prec(PREC.DELIMITED_BLOCK, $.example_block),
    prec(PREC.DELIMITED_BLOCK, $.listing_block),
    prec(PREC.DELIMITED_BLOCK, $.literal_block),
    prec(PREC.DELIMITED_BLOCK, $.quote_block),
    prec(PREC.DELIMITED_BLOCK, $.sidebar_block),
    prec(PREC.DELIMITED_BLOCK, $.passthrough_block),
    prec(PREC.DELIMITED_BLOCK, $.open_block),
    prec(PREC.DELIMITED_BLOCK, $.table_block),
    prec(PREC.DELIMITED_BLOCK, $.math_block),
    prec(PREC.ADMONITION, $.admonition_block),
    // Paragraphs have lowest precedence - fallback when nothing else matches
    prec(PREC.PARAGRAPH, $.paragraph)
  ),

    // ========================================================================
    // HEADINGS (Following EBNF: heading = [ anchor ], heading_level, ' ', line_content, newline)
    // ========================================================================
    
  // Allow any section level at root - AsciiDoc supports starting with any level
  section: $ => choice(
    $._section1,
    $._section2,
    $._section3,
    $._section4,
    $._section5,
    $._section6
  ),
  
  _section1: $ => prec.right(seq(
    optional(alias($.block_anchor, $.anchor)),
    alias($._heading1, $.section_title),
    repeat(choice(
      alias(choice($._section6, $._section5, $._section4, $._section3, $._section2), $.section),
      $._block_not_section
    ))
  )),
  
  _section2: $ => prec.right(seq(
    optional(alias($.block_anchor, $.anchor)),
    alias($._heading2, $.section_title),
    repeat(choice(
      alias(choice($._section6, $._section5, $._section4, $._section3), $.section),
      $._block_not_section
    ))
  )),
  
  _section3: $ => prec.right(seq(
    optional(alias($.block_anchor, $.anchor)),
    alias($._heading3, $.section_title),
    repeat(choice(
      alias(choice($._section6, $._section5, $._section4), $.section),
      $._block_not_section
    ))
  )),
  
  _section4: $ => prec.right(seq(
    optional(alias($.block_anchor, $.anchor)),
    alias($._heading4, $.section_title),
    repeat(choice(
      alias(choice($._section6, $._section5), $.section),
      $._block_not_section
    ))
  )),
  
  _section5: $ => prec.right(seq(
    optional(alias($.block_anchor, $.anchor)),
    alias($._heading5, $.section_title),
    repeat(choice(
      alias($._section6, $.section),
      $._block_not_section
    ))
  )),
  
  _section6: $ => prec.right(seq(
    optional(alias($.block_anchor, $.anchor)),
    alias($._heading6, $.section_title),
    repeat($._block_not_section)
  )),
    
    // Simple heading tokens like markdown - no external scanner needed
    _heading1: $ => seq(
      token(prec(PREC.SECTION + 20, /=[ \t]+/)),
      field('title', $.title),
      $._newline
    ),
    _heading2: $ => seq(
      token(prec(PREC.SECTION + 20, /==[ \t]+/)),
      field('title', $.title),
      $._newline
    ),
    _heading3: $ => seq(
      token(prec(PREC.SECTION + 20, /===[ \t]+/)),
      field('title', $.title),
      $._newline
    ),
    _heading4: $ => seq(
      token(prec(PREC.SECTION + 20, /====[ \t]+/)),
      field('title', $.title),
      $._newline
    ),
    _heading5: $ => seq(
      token(prec(PREC.SECTION + 20, /=====[ \t]+/)),
      field('title', $.title),
      $._newline
    ),
    _heading6: $ => seq(
      token(prec(PREC.SECTION + 20, /======[ \t]+/)),
      field('title', $.title),
      $._newline
    ),
    
    title: $ => token.immediate(/[^\r\n]+/),
    
    
    // Block anchor using external token to ensure block context
    block_anchor: $ => seq(
      $._BLOCK_ANCHOR,
      field('id', $.id),
      optional(seq(',', field('text', $.anchor_text))),
      ']]',
      $._newline
    ),
    
    // Inline anchor - for inline contexts
    anchor: $ => seq(
      '[[',
      field('id', $.id),
      optional(seq(',', field('text', $.anchor_text))),
      ']]'
    ),
    
    id: $ => token(/[A-Za-z_][A-Za-z0-9_-]*/),
    anchor_text: $ => token(/[^,\]\r\n]+/),

    // ========================================================================
    // PARAGRAPHS
    // ========================================================================
    
    paragraph: $ => prec(PREC.PARAGRAPH + 10, choice(
      $.paragraph_admonition,
      seq(
        optional($.metadata),
        field('content', $.text_with_inlines),
        optional($._newline)
      )
    )),
    
    // Paragraph admonitions - NOTE: content format
    paragraph_admonition: $ => prec(PREC.PARAGRAPH + 1, seq(
      optional($.metadata),
      field('label', $.admonition_label),
      field('content', $.text_with_inlines),
      optional($._newline)
    )),
    
    admonition_label: $ => token(prec(20, seq(
      choice('NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'),
      ': '
    ))),
    
    // Text with inline elements - single line only
    text_with_inlines: $ => prec.right(repeat1($._inline)),
    
    // Inline types
    _inline: $ => prec.right(choice(
      $.inline_element,
      $._text
    )),
    
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
      $.math_macro,
      $.pass_macro,
      $.block_image,
      $.line_break,
      $.index_term,
      $.bibliography_reference
    ),

    // ========================================================================
    // INLINE FORMATTING
    // ========================================================================
    
    // Strong formatting (bold) - wrapper for constrained/unconstrained
    strong: $ => choice(
      $.strong_constrained,
      prec.left(token(/\*[^*\r\n]*\*/))  // Fallback for unclosed
    ),
    
    // Emphasis formatting (italic) - wrapper for constrained/unconstrained
    emphasis: $ => choice(
      $.emphasis_constrained,
      prec.left(token(/_[^_\r\n]*_/))  // Fallback for unclosed
    ),
    
    // Monospace formatting (code) - wrapper for constrained/unconstrained
    monospace: $ => choice(
      $.monospace_constrained,
      prec.left(token(/`[^`\r\n]*`/))  // Fallback for unclosed
    ),
    
    // Superscript - ^text^
    superscript: $ => choice(
      prec(PREC.SUPERSCRIPT, seq(
        token('^'),
        field('content', alias(token.immediate(/[^\^\r\n]+/), $.superscript_text)),
        token.immediate('^')
      )),
      prec.left(token(/\^[^\^\r\n]*\^/))  // Fallback
    ),
    
    // Subscript - ~text~
    subscript: $ => choice(
      prec(PREC.SUBSCRIPT, seq(
        token('~'),
        field('content', alias(token.immediate(/[^~\r\n]+/), $.subscript_text)),
        token.immediate('~')
      )),
      prec.left(token(/~[^~\r\n]*~/))  // Fallback
    ),

    // ========================================================================
    // INLINE ELEMENTS - Anchors, Cross-references, Footnotes
    // ========================================================================
    
    
    
    // External cross-reference - xref:target[] or xref:target[text] (simple token for now)
    external_xref: $ => token(prec(50, /xref:[^\[\r\n]+\[[^\]]*\]/)),
    
    xref_target: $ => token(/[^\[\r\n]+/),
    bracketed_text: $ => token(/[^\]]+/),
    
    // Footnote inline - footnote:[text] (simple token for now)
    footnote_inline: $ => token(prec(50, /footnote:\[[^\]]*\]/)),
    
    // Footnote reference - footnote:id[] or footnote:id[text] (simple token for now)
    footnote_ref: $ => token(prec(50, /footnote:[A-Za-z0-9_-]+\[[^\]]*\]/)),
    
    // Footnote reference - footnoteref:id[] (simple token for now)
    footnoteref: $ => token(prec(50, /footnoteref:[A-Za-z0-9_-]+\[[^\]]*\]/)),
    
    // Attribute reference - {name}
    attribute_reference: $ => token(/\{[A-Za-z0-9_][A-Za-z0-9_-]*\}/),
    
    // Passthrough - +++literal text+++
    passthrough_triple_plus: $ => prec(PREC.PASSTHROUGH, seq(
      token('+++'),
      field('content', token.immediate(/(?:[^+]|\+[^+]|\+\+[^+])*/)),
      token.immediate('+++')
    )),
    
    // Line break - trailing + at end of line
    line_break: $ => prec.right(seq(
      token(' +'),
      $._newline
    )),

    // ========================================================================
    // TEXT
    // ========================================================================
    
    // Plain text - match everything that's not a special inline marker  
    _text: $ => choice(
      $.text_segment,
      $.text_colon,
      $.text_angle_bracket,
      $.text_bracket,
      $.unconstrained_strong,
      $.unconstrained_emphasis,
      $.unconstrained_monospace,
      $.unconstrained_passthrough
    ),
    
    // Match individual words/tokens for inline parsing - exclude colons to preserve attribute entries
    // Also exclude pipe character to allow table fence recognition  
    // Exclude angle brackets to allow cross-references and other constructs
    text_segment: $ => token(prec(PREC.TEXT, /[^\s*_`^~\[{+<>\r\n:|]+/)),
    
    // Allow standalone colons in text (but not double colons which are handled by external scanner)
    text_colon: $ => prec(PREC.TEXT - 1, token(/:/)),
    
    // Fallback for single angle brackets when not part of cross-references
    text_angle_bracket: $ => prec(PREC.TEXT - 2, token(choice('<', '>', '<<'))),
    
    // Fallback for single brackets when not part of role spans or attributes
    text_bracket: $ => prec(PREC.TEXT - 3, token(choice('[', ']'))),
    
    // Unconstrained formatting (fallback when constrained fails)
    unconstrained_strong: $ => prec.left(token(/\*[^\s*].*?\*/)),
    unconstrained_emphasis: $ => prec.left(token(/_[^\s_].*?_/)),
    unconstrained_monospace: $ => prec.left(token(/`[^\s`].*?`/)),
    unconstrained_passthrough: $ => prec.left(token(/\+[^\s+].*?\+/)),

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
    
    // Listing block - ----
    listing_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.listing_open),
      optional(field('content', $.block_content)),
      field('close', $.listing_close)
    )),
    
    // Literal block - ....
    literal_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.literal_open),
      optional(field('content', $.block_content)),
      field('close', $.literal_close)
    )),
    
    // Quote block - ____
    quote_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.quote_open),
      optional(field('content', $.block_content)),
      field('close', $.quote_close)
    )),
    
    // Sidebar block - ****
    sidebar_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.sidebar_open),
      optional(field('content', $.block_content)),
      field('close', $.sidebar_close)
    )),
    
    // Passthrough block - ++++
    passthrough_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.passthrough_open),
      optional(field('content', $.block_content)),
      field('close', $.passthrough_close)
    )),
    
    // Open block - --
    open_block: $ => prec(PREC.DELIMITED_BLOCK, seq(
      optional($.metadata),
      field('open', $.openblock_open),
      optional(field('content', $.block_content)),
      field('close', $.openblock_close)
    )),
    
    // Block content - raw lines using external scanner to avoid fence conflicts
    block_content: $ => repeat1(alias($.DELIMITED_BLOCK_CONTENT_LINE, $.content_line)),
    // Keep content_line for non-delimited block contexts (like paragraphs)
    content_line: $ => token(prec(-1, /[^\r\n]*\r?\n/)),
    
    // Specific stateful delimited block fence tokens using external scanner
    // Each block type uses its own specific fence tokens for proper disambiguation
    example_open: $ => $.EXAMPLE_FENCE_START,
    example_close: $ => $.EXAMPLE_FENCE_END,
    
    listing_open: $ => $.LISTING_FENCE_START,
    listing_close: $ => $.LISTING_FENCE_END,
    
    literal_open: $ => $.LITERAL_FENCE_START,
    literal_close: $ => $.LITERAL_FENCE_END,
    
    quote_open: $ => $.QUOTE_FENCE_START,
    quote_close: $ => $.QUOTE_FENCE_END,
    
    sidebar_open: $ => $.SIDEBAR_FENCE_START,
    sidebar_close: $ => $.SIDEBAR_FENCE_END,
    
    passthrough_open: $ => $.PASSTHROUGH_FENCE_START,
    passthrough_close: $ => $.PASSTHROUGH_FENCE_END,
    
    openblock_open: $ => $.OPENBLOCK_FENCE_START,
    openblock_close: $ => $.OPENBLOCK_FENCE_END,
    
    // Block metadata
    metadata: $ => prec.right(repeat1(choice(
      alias($.block_anchor, $.anchor),
      $.block_title,
      $.id_and_roles,
      $.block_attributes
    ))),
    
    block_title: $ => token(/\.[^\r\n]+\r?\n/),
    id_and_roles: $ => prec.right(token(/\[\s*(?:#[A-Za-z][\w:-]*)?(?:\s*\.[A-Za-z0-9_-]+)*\s*\]\s*\r?\n/)),
    block_attributes: $ => prec.right(token(/\[[^\]\r\n]+\]\s*\r?\n/)),
    
    // ========================================================================
    // ATTRIBUTE ENTRIES
    // ========================================================================
    
    attribute_entry: $ => prec(PREC.ATTRIBUTE_ENTRY, seq(
      field('name', alias(token(/:[A-Za-z][A-Za-z0-9_-]*:/), $.name)),
      optional(seq(
        optional(token.immediate(/[ \t]+/)),
        field('value', alias(token.immediate(/[^\r\n]+/), $.value))
      )),
      $._newline
    )),
    
    
    // ========================================================================
    // ADMONITION BLOCKS
    // ========================================================================
    
    admonition_block: $ => prec(PREC.ADMONITION, seq(
      field('label', $.admonition_block_label),
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
    )),
    
    admonition_block_label: $ => alias(token(seq(
      '[',
      choice('NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'),
      ']'
    )), $.admonition_label),
    
    // ========================================================================
    // LISTS
    // ========================================================================
    
    // Unordered list - group consecutive list items using right associativity
    unordered_list: $ => prec.right(repeat1($.unordered_list_item)),
    
    // Each list item consumes its own line ending
    unordered_list_item: $ => prec.left(PREC.LIST, seq(
      $._LIST_UNORDERED_MARKER,  // Hidden from AST (e.g., "*" or "-")
      token.immediate(prec(1, /[ \t]+/)), // Consume required whitespace after marker
      field('content', $._list_item_content),
      $._newline,
      repeat($.list_item_continuation)
    )),
    
    // List item content - just the inline text without newlines
    _list_item_content: $ => $.text_with_inlines,
    
    // List item continuation - supports attaching blocks to list items
    list_item_continuation: $ => prec.right(PREC.LIST + 5, seq(
      $.LIST_CONTINUATION,  // The '+' line
      repeat1($._block_not_section)  // Any blocks that follow the continuation
    )),
    
    // Ordered list - group consecutive list items using right associativity
    ordered_list: $ => prec.right(repeat1($.ordered_list_item)),
    
    ordered_list_item: $ => prec.left(PREC.LIST, seq(
      $._LIST_ORDERED_MARKER,    // Hidden from AST (e.g., "1.")
      token.immediate(prec(1, /[ \t]+/)), // Consume required whitespace after marker
      field('content', $._list_item_content),
      $._newline,
      repeat($.list_item_continuation)
    )),
    
    // Description list
    description_list: $ => prec(PREC.LIST, repeat1($.description_item)),
    
    description_item: $ => prec(PREC.LIST, seq(
      $._DESCRIPTION_LIST_ITEM   // Hidden scanner token that captures entire line
    )),
    
    // Callout list
    callout_list: $ => prec(PREC.LIST, repeat1($.callout_item)),
    
    callout_item: $ => seq(
      field('marker', $.CALLOUT_MARKER), // e.g., "<1>"
      token.immediate(prec(1, /[ \t]+/)), // Consume required whitespace after marker
      field('content', $.text_with_inlines),
      $._newline
    ),
    
    // ========================================================================
    // CONDITIONAL BLOCKS
    // ========================================================================
    
    conditional_block: $ => prec(PREC.CONDITIONAL + 10, choice(
      $.ifdef_block,
      $.ifndef_block,
      $.ifeval_block
    )),
    
    ifdef_block: $ => prec.right(seq(
      field('open', $.ifdef_open),
      repeat(choice($._block, $._blank_line)),
      field('close', $.endif_directive)
    )),
    
    ifndef_block: $ => prec.right(seq(
      field('open', $.ifndef_open),
      repeat(choice($._block, $._blank_line)),
      field('close', $.endif_directive)
    )),
    
    ifeval_block: $ => prec.right(seq(
      field('open', $.ifeval_open),
      repeat(choice($._block, $._blank_line)),
      field('close', $.endif_directive)
    )),
    
    // Strict regex-based conditional directives (avoid permissive matches)
    // ifdef/ifndef require empty brackets [] and attribute list before '['
    ifdef_open: $ => token(prec(PREC.CONDITIONAL + 20, /ifdef::[A-Za-z0-9_,\-]*\[\][ \t]*\r?\n/)),
    ifndef_open: $ => token(prec(PREC.CONDITIONAL + 20, /ifndef::[A-Za-z0-9_,\-]*\[\][ \t]*\r?\n/)),
    // ifeval allows an expression inside brackets
    ifeval_open: $ => token(prec(PREC.CONDITIONAL + 20, /ifeval::\[[^\]\r\n]*\][ \t]*\r?\n/)),
    // endif requires empty brackets []
    endif_directive: $ => token(prec(PREC.CONDITIONAL + 20, /endif::\[\][ \t]*\r?\n/)),
    
    // ========================================================================
    // TABLE BLOCKS (ENHANCED)
    // ========================================================================
    
    table_block: $ => prec(PREC.PARAGRAPH + 10, seq(
      optional($.metadata),
      field('open', $.table_open),
      optional(field('content', $.table_content)),
      field('close', $.table_close)
    )),
    
    table_open: $ => $.TABLE_FENCE_START,
    table_close: $ => $.TABLE_FENCE_END,
    
    // Table content supports both simple and advanced table parsing
    table_content: $ => repeat1(choice(
      $.table_row,
      $.content_line
    )),
    
    // Cell specifications: colspan.rowspan+format
    cell_spec: $ => choice(
      $.span_spec,
      $.format_spec,
      seq($.span_spec, $.format_spec)
    ),
    
    // Span specifications: 2+ (colspan), .3+ (rowspan), 2.3+ (both)
    span_spec: $ => token(prec(10, /[0-9]+\+|\.[0-9]+\+|[0-9]+\.[0-9]+\+/)),
    
    // Format specifications: a=asciidoc, l=literal, m=monospace, s=strong, e=emphasis, h=header, v=verse
    format_spec: $ => token(prec(10, /[aelmshv]/)),
    
    // Cell content defaults to literal text
    cell_content: $ => $.cell_literal_text,
    
    // Literal cell text for simple content
    cell_literal_text: $ => token(/[^|\r\n]*/),
    
    // Enhanced table parsing that supports advanced cell specifications
    table_row: $ => seq(
      repeat1($.table_cell),
      $._newline
    ),
    
    table_cell: $ => seq(
      '|',
      optional($.cell_spec),
      optional(field('content', $.cell_content))
    ),
    
    // ========================================================================
    // MISSING INLINE CONSTRUCTS
    // ========================================================================
    
    // Auto links - improved pattern to handle boundaries properly
    auto_link: $ => token(prec(20, /(?:https?|ftp):\/\/[^\s\[\]<>\),;!?]+/)),
    
    // Links with text - supports both auto-links and link macros
    link: $ => choice(
      // Auto-link format: https://example.com[text]
      seq(
        field('url', $.auto_link),
        token.immediate('['),
        optional(field('text', $.bracketed_text)),
        token.immediate(']')
      ),
      // Link macro format: link:https://example.com[text]
      $.link_macro
    ),
    
    // Link macro - link:target[text]
    link_macro: $ => token(prec(25, /link:[^\[\r\n]+\[[^\]]*\]/)),
    
    // Images
    image: $ => token(prec(20, /image:[^\[\r\n]+\[[^\]]*\]/)),
    
    // Role spans - simplified token to avoid ERROR nodes
    role_span: $ => token(prec(15, /\[[A-Za-z][A-Za-z0-9_.-]*\]#[^#\r\n]+#/)),
    
    
    // Internal cross-reference - simple token for well-formed cross-references
    internal_xref: $ => token(prec(10, choice(
      /<<[A-Za-z_][A-Za-z0-9_-]*,[^>\r\n]+>>/,  // Cross-reference with text
      /<<[A-Za-z_][A-Za-z0-9_-]*>>/              // Cross-reference without text
    ))),
    
    
    // Inline anchor shortcuts - simplified token to avoid ERROR nodes
    inline_anchor: $ => token(prec(10, choice(
      /\[\[[A-Za-z_][A-Za-z0-9_-]*,[^\]\r\n]+\]\]/,  // Anchor with text
      /\[\[[A-Za-z_][A-Za-z0-9_-]*\]\]/              // Anchor without text
    ))),
    
    
    // UI Macros
    ui_macro: $ => choice(
      $.ui_kbd,
      $.ui_btn,
      $.ui_menu
    ),
    
    // Individual UI elements for better AST
    ui_kbd: $ => token(prec(PREC.PASSTHROUGH + 10, /kbd:\[[^\]]*\]/)),
    ui_btn: $ => token(prec(PREC.PASSTHROUGH + 10, /btn:\[[^\]]*\]/)),
    ui_menu: $ => token(prec(PREC.PASSTHROUGH + 10, /menu:[^\[\r\n]+\[[^\]]*\]/)),
    
    // Math macros
    math_macro: $ => choice(
      token(prec(PREC.PASSTHROUGH + 10, /latexmath:\[[^\]]*\]/)),
      token(prec(PREC.PASSTHROUGH + 10, /asciimath:\[[^\]]*\]/)),
      token(prec(PREC.PASSTHROUGH + 10, /stem:\[[^\]]*\]/))
    ),
    
    // Pass macro
    pass_macro: $ => choice(
      token(prec(20, /pass:\[[^\]]*\]/)),
      token(prec(20, /pass:[a-z,]*\[[^\]]*\]/))
    ),
    
    // Block image
    block_image: $ => token(prec(20, /image::[^\[\r\n]+\[[^\]]*\]\r?\n/)),
    
    // Note: Inline conditionals are disabled to prioritize block conditionals
    // They can be re-added later with proper precedence handling
    
    macro_target: $ => prec(-1, token.immediate(/[^\[\r\n]+/)),
    attribute_list: $ => seq(
      '[',
      optional($.bracketed_text),
      ']'
    ),
    
    // Constrained formatting variants - improved to avoid MISSING tokens
    strong_constrained: $ => prec(PREC.STRONG, seq(
      token('*'),
      field('content', alias(token.immediate(/[^*\r\n]+/), $.strong_text)),
      optional(token.immediate('*'))
    )),
    
    emphasis_constrained: $ => prec(PREC.EMPHASIS, seq(
      token('_'),
      field('content', alias(token.immediate(/[^_\r\n]+/), $.emphasis_text)),
      optional(token.immediate('_'))
    )),
    
    monospace_constrained: $ => prec(PREC.MONOSPACE, seq(
      token('`'),
      field('content', alias(token.immediate(/[^`\r\n]+/), $.monospace_text)),
      token.immediate('`')
    )),
    
    // ========================================================================
    // EXTERNAL TOKEN RULES
    // ========================================================================
    
    // External token rules are overridden by high-precedence tokens above
    
    
  }
});
