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
  LIST: 130,                 // Lists (highest precedence to allow grouping)
  CONDITIONAL: 75,           // Conditional blocks (higher than paragraphs)
  ATTRIBUTE_ENTRY: 95,       // Attribute entries (higher than lists and paragraphs)
  PARAGRAPH: 70,             // Paragraphs
  // Inline element precedences (highest to lowest)
  PASSTHROUGH: 60,           // +++literal text+++
  STRONG: 20,                // *text* - lowered to give lists priority
  EMPHASIS: 18,              // _text_ - lowered to give lists priority
  MONOSPACE: 16,             // `code` - lowered to give lists priority
  SUPERSCRIPT: 14,           // ^text^ - lowered to give lists priority
  SUBSCRIPT: 12,             // ~text~ - lowered to give lists priority
  TEXT: 1,                   // plain text (lowest)
};

module.exports = grammar({
  name: "asciidoc",

  externals: $ => [
    // Order must match scanner.c enum exactly!
    $.TABLE_FENCE_START,                // 0
    $.TABLE_FENCE_END,                  // 1
    $.EXAMPLE_FENCE_START,              // 2
    $.EXAMPLE_FENCE_END,                // 3
    $.LISTING_FENCE_START,              // 4
    $.LISTING_FENCE_END,                // 5
    $.LITERAL_FENCE_START,              // 6
    $.LITERAL_FENCE_END,                // 7
    $.QUOTE_FENCE_START,                // 8
    $.QUOTE_FENCE_END,                  // 9
    $.SIDEBAR_FENCE_START,              // 10
    $.SIDEBAR_FENCE_END,                // 11
    $.PASSTHROUGH_FENCE_START,          // 12
    $.PASSTHROUGH_FENCE_END,            // 13
    $.OPENBLOCK_FENCE_START,            // 14
    $.OPENBLOCK_FENCE_END,              // 15
    $.LIST_CONTINUATION,                // 16
    $.AUTOLINK_BOUNDARY,                // 17
    $.ATTRIBUTE_LIST_START,             // 18
    $.DELIMITED_BLOCK_CONTENT_LINE,     // 19 - Content line within delimited blocks (not fence end)
    $._BLOCK_ANCHOR,                    // 20 - Block anchor at start of line (hidden from AST)
    $._LIST_UNORDERED_MARKER,           // 21 - "* " or "- " at start of line (hidden from AST)
    $._LIST_ORDERED_MARKER,             // 22 - "N. " at start of line (hidden from AST)
    $.DESCRIPTION_LIST_SEP,             // 23 - "::"
    $._DESCRIPTION_LIST_ITEM,           // 24 - "term:: description" pattern (hidden from AST)
    $.CALLOUT_MARKER,                   // 25 - "<N> " at start of line
    $._ifdef_open_token,                // 26 - "ifdef::" at start of line
    $._ifndef_open_token,               // 27 - "ifndef::" at start of line
    $._ifeval_open_token,               // 28 - "ifeval::" at start of line
    $._endif_directive_token,           // 29 - "endif::" at start of line
    $.UNORDERED_LIST_LINE_CONT,         // 30 - unordered list item line when another follows
    $.UNORDERED_LIST_LINE_LAST,         // 31 - unordered list item line when it is the last
    $.ORDERED_LIST_LINE_CONT,           // 32 - ordered list item line when another follows
    $.ORDERED_LIST_LINE_LAST,           // 33 - ordered list item line when it is the last
    $.LIST_ITEM_EOL,                     // 34 - newline that precedes another list item line
    $.UNORDERED_ITEM_EOL,                // 35 - EOL for unordered list items (no lookahead)
    $.UNORDERED_ITEM_NEXT,               // 36 - separator between unordered items (consumes marker + ws)
    $.UNORDERED_LIST_BLOCK               // 37 - entire unordered list block
  ],

  extras: $ => [
    /[ \t\f]+/,                // Horizontal whitespace only
    // Note: line comments removed from extras to allow block-level parsing
  ],

  // supertypes: $ => [
  //   $._block,
  //   $._inline,
  // ],
  
  // Inline tokens that should not appear as separate nodes in the AST
  inline: $ => [
    // Note: External tokens cannot be inlined, removed UNORDERED_ITEM_EOL and UNORDERED_ITEM_NEXT
  ],
  
  // Conflicts for overlapping constructs  
  conflicts: $ => [
    [$._section1, $.metadata],
    [$._section2, $.metadata],
    [$._section3, $.metadata],
    [$._section4, $.metadata],
    [$._section5, $.metadata],
    [$._section6, $.metadata],
    // Resolve SOL ambiguity between list items and paragraphs with inline strong
    [$.unordered_list, $.paragraph],
    // Encourage single-list grouping over multiple sibling lists
    [$.unordered_list, $.ordered_list],
    [$.unordered_list, $.open_block],
    [$.ordered_list, $.open_block],
    // Resolve internal repetition ambiguity for list tails
    [$.unordered_list],
    [$.ordered_list],
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
    block_comment: $ => prec.right(seq(
      token(prec(PREC.DELIMITED_BLOCK + 10, '////')),
      $._newline,
      repeat($.comment_line),
      token(prec(PREC.DELIMITED_BLOCK + 10, '////')),
      optional($._newline)
    )),
    
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
    )),
    
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
      prec(PREC.ATTRIBUTE_ENTRY + 20, $.attribute_entry),
      prec(PREC.ATTRIBUTE_ENTRY + 5, $.include_directive),
      prec(PREC.ATTRIBUTE_ENTRY + 3, $.bibliography_entry),
      prec(PREC.LIST, $.unordered_list),
      prec(PREC.LIST, $.ordered_list),
      prec(PREC.LIST, $.description_list),
      prec(PREC.LIST, $.callout_list),
      prec.right(PREC.CONDITIONAL + 50, $.conditional_block),
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

    // Variant block rules when inside conditional bodies: de-prioritize unordered lists
    _block_in_conditional: $ => choice(
      // Allow sections inside conditionals
      $.section,
      // Allow nested conditionals
      prec.right(PREC.CONDITIONAL + 10, $.conditional_block),
      prec(PREC.ATTRIBUTE_ENTRY + 20, $.attribute_entry),
      prec(PREC.ATTRIBUTE_ENTRY + 5, $.include_directive),
      prec(PREC.ATTRIBUTE_ENTRY + 3, $.bibliography_entry),
      // Keep ordered/description/callout lists recognized normally
      prec(PREC.LIST, $.ordered_list),
      prec(PREC.LIST, $.description_list),
      prec(PREC.LIST, $.callout_list),
      // Do not recognize unordered lists inside conditionals; treat hyphen bullets as paragraphs
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
      // Paragraphs
      prec(PREC.PARAGRAPH + 1, $.paragraph)
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

    // Each section follows AsciiDoc specification:
    // - Consumes attributes immediately following the heading (no blank line)
    // - Optionally consumes one paragraph immediately following (no blank line) 
    // - Content after blank lines remains at root level for proper document structure
    _section1: $ => prec.right(seq(
      optional(alias($.block_anchor, $.anchor)),
      alias($._heading1, $.section_title),
      repeat(prec(PREC.ATTRIBUTE_ENTRY + 10, $.attribute_entry)),
      optional(alias($.section_immediate_paragraph, $.paragraph))
    )),

    _section2: $ => prec.right(seq(
      optional(alias($.block_anchor, $.anchor)),
      alias($._heading2, $.section_title),
      repeat(prec(PREC.ATTRIBUTE_ENTRY + 10, $.attribute_entry)),
      optional(alias($.section_immediate_paragraph, $.paragraph))
    )),

    _section3: $ => prec.right(seq(
      optional(alias($.block_anchor, $.anchor)),
      alias($._heading3, $.section_title),
      repeat(prec(PREC.ATTRIBUTE_ENTRY + 10, $.attribute_entry)),
      optional(alias($.section_immediate_paragraph, $.paragraph))
    )),

    _section4: $ => prec.right(seq(
      optional(alias($.block_anchor, $.anchor)),
      alias($._heading4, $.section_title),
      repeat(prec(PREC.ATTRIBUTE_ENTRY + 10, $.attribute_entry)),
      optional(alias($.section_immediate_paragraph, $.paragraph))
    )),

    _section5: $ => prec.right(seq(
      optional(alias($.block_anchor, $.anchor)),
      alias($._heading5, $.section_title),
      repeat(prec(PREC.ATTRIBUTE_ENTRY + 10, $.attribute_entry)),
      optional(alias($.section_immediate_paragraph, $.paragraph))
    )),

    _section6: $ => prec.right(seq(
      optional(alias($.block_anchor, $.anchor)),
      alias($._heading6, $.section_title),
      repeat(prec(PREC.ATTRIBUTE_ENTRY + 10, $.attribute_entry)),
      optional(alias($.section_immediate_paragraph, $.paragraph))
    )),

    // Section headings with marker tokens that include required whitespace
    _heading1: $ => seq(
      $._section_marker_1,
      $.title,
      $._newline
    ),
    _heading2: $ => seq(
      $._section_marker_2,
      $.title,
      $._newline
    ),
    _heading3: $ => seq(
      $._section_marker_3,
      $.title,
      $._newline
    ),
    _heading4: $ => seq(
      $._section_marker_4,
      $.title,
      $._newline
    ),
    _heading5: $ => seq(
      $._section_marker_5,
      $.title,
      $._newline
    ),
    _heading6: $ => seq(
      $._section_marker_6,
      $.title,
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
    
    // Default paragraph - standard precedence; lists and blocks win when applicable
    paragraph: $ => prec.right(PREC.PARAGRAPH, choice(
      $.paragraph_admonition,
      seq(
        optional($.metadata),
        field('content', $.text_with_inlines),
        optional($._newline)
      )
    )),

    // Paragraph admonitions - NOTE: content format
    paragraph_admonition: $ => prec.right(PREC.PARAGRAPH + 1, seq(
      optional($.metadata),
      field('label', $.admonition_label),
      field('content', $.text_with_inlines),
      optional($._newline)
    )),
    
    admonition_label: $ => token(prec(20, seq(
      choice('NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'),
      ': '
    ))),
    
    // Text with inline elements - accumulate multiple inline elements before reducing
    // Handles decimal lines, regular text, and inline formatting consistently
    text_with_inlines: $ => prec.right(repeat1(choice(
      alias($.decimal_line, $.text_segment),  // Handle decimal lines as text segments
      $._inline
    ))),
    
    // Special text parsing for list items that creates fewer segments
    list_text_with_inlines: $ => prec.right(repeat1(choice(
      alias($.list_text_segment, $.text_segment),
      prec(PREC.STRONG, $.inline_element),  // Higher precedence for inline formatting
      $.text_colon,
      $.text_angle_bracket,
      $.text_bracket,
      $.text_asterisk,
      $.text_underscore,
      $.text_backtick,
      $.text_caret,
      $.text_tilde
    ))),

    // Immediate paragraph inside a section: single-segment content (no blank line)
    section_immediate_paragraph: $ => seq(
      field('content', $.text_with_inlines),
      $._newline
    ),
    
    // Inline types - prefer inline elements first so formatting like *strong* is recognized
    _inline: $ => choice(
      $.inline_element,
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
    
    // Strong formatting (bold) - use constrained variant for proper inline parsing
    strong: $ => $.strong_constrained,
    
    // Emphasis formatting (italic) - use constrained variant for proper inline parsing
    emphasis: $ => $.emphasis_constrained,
    
    // Monospace formatting (code) - use constrained variant for proper inline parsing
    monospace: $ => $.monospace_constrained,
    
    // Superscript - ^text^
    superscript: $ => prec(PREC.SUPERSCRIPT + 1, seq(
      field('open', $.superscript_open),
      field('content', alias(token.immediate(/(?:[^\^\r\n\\]|\\.)+/), $.superscript_text)),
      field('close', $.superscript_close)
    )),
    
    // Subscript - ~text~
    subscript: $ => prec(PREC.SUBSCRIPT + 1, seq(
      field('open', $.subscript_open),
      field('content', alias(token.immediate(/(?:[^~\r\n\\]|\\.)+/), $.subscript_text)),
      field('close', $.subscript_close)
    )),

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
      field('content', token.immediate(/(?:[^+]|\+[^+]|\+\+[^+])+/)),
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
      $.text_segment,  // Includes hyphens when not list markers
      $.text_colon,
      $.text_angle_bracket,
      $.text_bracket,
      // Fallback formatting tokens to handle isolated delimiters safely
      // (text_asterisk and text_hyphen excluded to prevent consuming at BOL)
      $.text_underscore,
      $.text_backtick,
      $.text_caret,
      $.text_tilde
    ),

    
    // Match text content - include spaces and hyphens for single text segments as expected by tests
    // Exclude asterisk to prevent bullet consumption at BOL
    text_segment: $ => token(prec(PREC.TEXT, /[^*_`^~\[{+<>\r\n:|\t]+/)),

    // Decimal-aware line matching: simplified to avoid attribute entry conflicts
    // Only matches decimal numbers preceded by whitespace to prevent interference
    // with attribute entries like ":version: 1.0" (fixed critical parsing issue)
    decimal_line: $ => token(prec(PREC.TEXT - 5, /[ \t][0-9]+\.[0-9]+[^\r\n]*/)),

    // List text segment that includes spaces for single-segment list content
    // Exclude asterisks to allow strong formatting within lists
    list_text_segment: $ => token(prec(PREC.TEXT, /[^*_`^~\[{+<>\r\n:|]+/)),
    
    // Paragraph text segment - excludes asterisk and hyphen entirely to force external scanner priority  
    paragraph_text_segment: $ => token(prec(PREC.TEXT - 10, /[^*_`^~\[{+<>\r\n:| \t-]+/)),
    
    // Allow standalone colons in text (but not double colons which are handled by external scanner)
    text_colon: $ => prec(PREC.TEXT - 1, token(/:/)),
    
    // Fallback for single angle brackets when not part of cross-references
    text_angle_bracket: $ => prec(PREC.TEXT - 2, token(choice('<', '>', '<<'))),
    
    // Fallback for single brackets when not part of role spans or attributes
    text_bracket: $ => prec(PREC.TEXT - 3, token(choice('[', ']'))),
    
    // Fallback for single equals when not part of section headers
    text_equals: $ => prec(PREC.TEXT - 2, token('=')),


    // Simple list content text (single segment), excluding inline markers
    simple_list_text: $ => token.immediate(/[^\r\n*_`^~\[{+<:|]+/),
    
    // Fallback tokens for single formatting delimiters when not used for formatting
    // Lower precedence so strong formatting is preferred when applicable
    text_asterisk: $ => prec(PREC.TEXT - 30, token('*')),
    text_hyphen: $ => prec(PREC.TEXT - 30, token('-')),
    text_underscore: $ => prec(PREC.TEXT - 15, token('_')),  // Lower than emphasis_open
    text_backtick: $ => prec(PREC.TEXT - 15, token('`')),     // Lower than monospace_open
    text_caret: $ => prec(PREC.TEXT - 10, token('^')),
    text_tilde: $ => prec(PREC.TEXT - 10, token('~')),
    

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
    
    attribute_entry: $ => prec(PREC.ATTRIBUTE_ENTRY + 20, seq(
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
    
    // List markers using external scanner for line-start detection
    
    // Unordered list - collect consecutive items with dynamic precedence  
    unordered_list: $ => prec.dynamic(PREC.LIST + 50, prec.right(repeat1($.unordered_list_item))),

    // Unordered list item: marker + content + newline 
    unordered_list_item: $ => prec.right(seq(
      $._LIST_UNORDERED_MARKER,
      field('content', alias($.list_text_with_inlines, $.text_with_inlines)),
      $._newline,
      repeat($.list_item_continuation)
    )),
    list_item_continuation: $ => prec.right(PREC.LIST + 5, seq(
      $.LIST_CONTINUATION,  // The '+' line
      repeat1($._block_not_section)  // Any blocks that follow the continuation
    )),
    
    // Ordered list - collect consecutive items with dynamic precedence
    ordered_list: $ => prec.dynamic(PREC.LIST + 50, prec.right(repeat1($.ordered_list_item))),

    // Ordered list item using marker external (content line must end with newline)
    ordered_list_item: $ => prec.right(PREC.LIST, seq(
      $._LIST_ORDERED_MARKER,
      field('content', alias($.list_text_with_inlines, $.text_with_inlines)),
      $._newline,
      repeat($.list_item_continuation)
    )),
    
    // Description list
    description_list: $ => prec(PREC.LIST, repeat1($.description_item)),
    
    description_item: $ => prec(PREC.LIST, seq(
      $._DESCRIPTION_LIST_ITEM
    )),
    
    // Callout list - group consecutive callout items using right associativity
    callout_list: $ => prec.right(repeat1($.callout_item)),
    
    callout_item: $ => prec.left(PREC.LIST, seq(
      field('marker', $.CALLOUT_MARKER), // e.g., "<1>"
      token.immediate(prec(1, /[ \t]+/)), // Consume required whitespace after marker
      field('content', $.text_with_inlines),
      $._newline
    )),
    
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
      repeat(choice($._block_in_conditional, $._blank_line)),
      field('close', $.endif_directive)
    )),
    
    ifndef_block: $ => prec.right(seq(
      field('open', $.ifndef_open),
      repeat(choice($._block_in_conditional, $._blank_line)),
      field('close', $.endif_directive)
    )),
    
    ifeval_block: $ => prec.right(seq(
      field('open', $.ifeval_open),
      repeat(choice($._block_in_conditional, $._blank_line)),
      field('close', $.endif_directive)
    )),
    
    // Strict regex-based conditional directives (avoid permissive matches)
    // Do not consume trailing newlines; let line endings be handled by _blank_line/_newline
    // ifdef/ifndef require empty brackets [] and optional attribute list before '[']
    ifdef_open: $ => token(prec(PREC.CONDITIONAL + 20, /ifdef::[A-Za-z0-9_,\-]*\[\][ \t]*/)),
    ifndef_open: $ => token(prec(PREC.CONDITIONAL + 20, /ifndef::[A-Za-z0-9_,\-]*\[\][ \t]*/)),
    // ifeval allows an expression inside brackets
    ifeval_open: $ => token(prec(PREC.CONDITIONAL + 20, /ifeval::\[[^\]\r\n]+\][ \t]*/)),
    // endif requires empty brackets []
    endif_directive: $ => token(prec(PREC.CONDITIONAL + 20, /endif::\[\][ \t]*/)),
    
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
    // Only used in table cells, lower precedence to avoid conflicts with text
    format_spec: $ => choice('a', 'l', 'e', 'm', 's', 'h', 'v'),
    
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
    
    // Constrained formatting variants - very high precedence to beat text_segment
    strong_constrained: $ => prec(PREC.STRONG + 25, seq(
      field('open', $.strong_open),
      // Disallow leading whitespace after opening '*'
      field('content', alias(token.immediate(/[^ \t\r\n*][^*\r\n]*/), $.strong_text)),
      field('close', $.strong_close)
    )),
    
    emphasis_constrained: $ => prec(PREC.EMPHASIS + 10, seq(
      field('open', $.emphasis_open),
      // Disallow leading whitespace after opening '_'
      field('content', alias(token.immediate(/[^ \t\r\n_][^_\r\n]*/), $.emphasis_text)),
      field('close', $.emphasis_close)
    )),
    
    monospace_constrained: $ => prec(PREC.MONOSPACE + 10, seq(
      field('open', $.monospace_open),
      // Disallow leading whitespace after opening '`'
      field('content', alias(token.immediate(/[^ \t\r\n`][^`\r\n]*/), $.monospace_text)),
      field('close', $.monospace_close)
    )),
    
    // ========================================================================
    // DELIMITER TOKENS
    // ========================================================================
    
    // Delimiter tokens for inline formatting - higher precedence to beat fallback tokens
    strong_open: $ => token(prec(PREC.TEXT + 5, '*')),
    strong_close: $ => token.immediate('*'),
    
    emphasis_open: $ => token(prec(PREC.TEXT + 5, '_')),
    emphasis_close: $ => token.immediate('_'),
    
    monospace_open: $ => token(prec(PREC.TEXT + 5, '`')),
    monospace_close: $ => token.immediate('`'),
    
    superscript_open: $ => token(prec(PREC.TEXT + 10, '^')),
    superscript_close: $ => token.immediate('^'),
    
    subscript_open: $ => token(prec(PREC.TEXT + 10, '~')),
    subscript_close: $ => token.immediate('~'),
    
    // Section marker tokens for syntax highlighting - include required whitespace
    _section_marker_1: $ => token(prec(PREC.SECTION + 5, /=[ \t]+/)),
    _section_marker_2: $ => token(prec(PREC.SECTION + 5, /==[ \t]+/)),
    _section_marker_3: $ => token(prec(PREC.SECTION + 5, /===[ \t]+/)),
    _section_marker_4: $ => token(prec(PREC.SECTION + 5, /====[ \t]+/)),
    _section_marker_5: $ => token(prec(PREC.SECTION + 5, /=====[ \t]+/)),
    _section_marker_6: $ => token(prec(PREC.SECTION + 5, /======[ \t]+/)),
    
    // ========================================================================
    // EXTERNAL TOKEN RULES
    // ========================================================================
    
    // External token rules are overridden by high-precedence tokens above
    
    // (no-op placeholder removed: marker externals disabled in favor of list-line variants)
    
  }
});
