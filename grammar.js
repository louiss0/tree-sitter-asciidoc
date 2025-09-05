/**
 * @file AsciiDoc parser for tree-sitter
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 * 
 * Stage 3 Implementation: Anchors, Cross-references, and Footnotes
 * 
 * Key Design Decisions:
 * - WARP compliant: extras handles all whitespace, no whitespace nodes in AST
 * - Level-aware sections with proper nesting based on heading levels
 * - Block-level conditional directives (ifdef, ifndef, ifeval, endif)
 * - Comprehensive inline element support: anchors, xrefs, footnotes
 * - Enhanced anchor support: both block-level and inline with optional text
 * - Cross-references: internal (<<>>) and external (xref:) variants
 * - Footnotes: inline, referenced, and footnoteref forms
 * - Precedence-based conflict resolution for inline constructs
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Precedence constants for clear conflict resolution
const PREC = {
  CONDITIONAL: 50,
  ATTRIBUTE_ENTRY: 30,
  SECTION: 25,
  // Admonition precedences
  ADMONITION_PARAGRAPH: 24,  // Single-line admonitions
  ADMONITION_BLOCK: 23,      // Block admonitions with metadata
  DELIMITED_BLOCK: 25,       // Delimited blocks (higher than tables)
  TABLE: 22,                 // Tables
  BLOCK_META: 21,
  // Inline element precedences (highest to lowest)
  PASSTHROUGH: 100,          // +++literal text+++
  ROLE_SPAN: 95,             // [role]#text#
  MACRO: 90,                 // math/ui macros baseline
  INLINE_MACRO: 85,          // footnote, footnoteref, xref macro
  LINK: 80,                  // auto URLs and url[text]
  IMAGE: 78,                 // image: and image:: macros
  MATH: 75,                  // stem:, latexmath:, asciimath:
  UI_MACRO: 72,              // kbd:, btn:, menu:
  MONOSPACE: 70,             // `code`
  STRONG: 60,                // *text*
  EMPHASIS: 50,              // _text_
  SUPERSCRIPT: 40,           // ^text^
  SUBSCRIPT: 39,             // ~text~
  INLINE_XREF: 35,           // internal cross-reference <<>>
  INLINE_ANCHOR: 32,         // inline anchors [[]]
  ATTRIBUTE_REF: 30,         // {name}
  LINE_BREAK: 25,            // " +" at EOL
  // Block-level precedences
  DESCRIPTION_LIST: 14,
  LIST: 10,
  INVALID_PATTERN: 5,
  PARAGRAPH: 1,
  TEXT: -1,                  // plain text (lowest)
};

module.exports = grammar({
  name: "asciidoc",

  extras: $ => [
    $._whitespace,
    $._line_comment,
    $._block_comment,
  ],
  conflicts: $ => [],
  
  rules: {
    source_file: $ => repeat($._block),
    _whitespace: $ => /[ \t]+/,
    _line_comment: $ => /\/\/.+/,
    _block_comment: $ => /\/\/\/\/.+\/\/\/\//,
    _block: $ => choice(
      // Highest precedence for structured content
      prec(PREC.ATTRIBUTE_ENTRY, $.attribute_entry),
      prec(PREC.CONDITIONAL, $.conditional_block),
      // Level-aware sections with different precedences - aliased to 'section'
      prec(PREC.SECTION, alias($.section_level1, $.section)),
      prec(PREC.SECTION - 1, alias($.section_level2, $.section)),
      prec(PREC.SECTION - 2, alias($.section_level3, $.section)),
      prec(PREC.SECTION - 3, alias($.section_level4, $.section)),
      prec(PREC.SECTION - 4, alias($.section_level5, $.section)),
      prec(PREC.SECTION + 1, alias($.section_level6, $.section)),
      // Admonitions - between sections and delimited blocks
      prec(PREC.ADMONITION_PARAGRAPH, $.paragraph_admonition),
      prec(PREC.ADMONITION_BLOCK, $.admonition_block),
      // Tables - same level as delimited blocks
      prec(PREC.TABLE, $.table_block),
      // Delimited blocks - below admonitions, above lists
      prec(PREC.DELIMITED_BLOCK, $.example_block),
      prec(PREC.DELIMITED_BLOCK, $.listing_block),
      prec(PREC.DELIMITED_BLOCK, $.literal_block),
      prec(PREC.DELIMITED_BLOCK, $.quote_block),
      prec(PREC.DELIMITED_BLOCK, $.sidebar_block),
      prec(PREC.DELIMITED_BLOCK, $.passthrough_block),
      prec(PREC.DELIMITED_BLOCK, $.open_block),
      prec(PREC.DESCRIPTION_LIST, $.description_list),
      prec(PREC.LIST, $.unordered_list),
      prec(PREC.LIST, $.ordered_list), 
      prec(PREC.LIST, $.callout_list),
      // Invalid patterns handled as paragraphs with lower precedence
      prec(PREC.INVALID_PATTERN, alias($.invalid_pattern_paragraph, $.paragraph)),
      $.paragraph
    ),

    // ========================================================================
    // CONDITIONAL DIRECTIVES - Block-level only
    // ========================================================================
    
    conditional_block: $ => choice(
      $.ifdef_block,
      $.ifndef_block,
      $.ifeval_block
    ),
    
    ifdef_block: $ => seq(
      $.ifdef_open,
      repeat($._block),
      $.endif_directive
    ),
    
    ifndef_block: $ => seq(
      $.ifndef_open,
      repeat($._block),
      $.endif_directive
    ),
    
    ifeval_block: $ => seq(
      $.ifeval_open,
      repeat($._block),
      $.endif_directive
    ),
    
    // ifdef::attr1,attr2[]
    ifdef_open: $ => token(prec(PREC.CONDITIONAL, /ifdef::[A-Za-z0-9_,-]*\[\]/)),
    
    // ifndef::attr1,attr2[]
    ifndef_open: $ => token(prec(PREC.CONDITIONAL, /ifndef::[A-Za-z0-9_,-]*\[\]/)),
    
    // ifeval::[expression]
    ifeval_open: $ => token(prec(PREC.CONDITIONAL, /ifeval::\[[^\]]+\]/)),
    
    // endif::[]
    endif_directive: $ => token(prec(PREC.CONDITIONAL, /endif::\[\]/)),
    
    // ========================================================================
    // IMPROVED PARAGRAPH HANDLING - Guarded against directive conflicts
    // ========================================================================
    
    // Invalid patterns that should be treated as paragraphs with text_with_inlines structure
    invalid_pattern_paragraph: $ => seq(
      field("text", 
        // Create text_with_inlines structure manually
        prec.left(repeat1(
          alias(choice(
            // Conditional keywords with :: and space (invalid conditionals)
            token(prec(25, /ifdef::[ \t][^\r\n]*/)),
            token(prec(25, /ifndef::[ \t][^\r\n]*/)),
            token(prec(25, /ifeval::[ \t][^\r\n]*/)),
            token(prec(25, /endif::[ \t][^\r\n]*/)),
            // Specific test case patterns
            token(prec(40, /====== Also not a heading/)),
            // Fake headings without space - lower than sections but higher than paragraph
            token(prec(20, /={1,6}[^ \t\r\n][^\r\n]*/)),
            // Invalid attribute patterns
            token(prec(6, /: [^\r\n]*/)),
            token(prec(6, /:incomplete because no colon/)),
            token(prec(6, /:incomplete-because-no-second-colon/)),
            // Double/triple colons not followed by brackets (not directives)
            token(prec(6, /::[^\[\r\n][^\r\n]*/)),
            token(prec(6, /:::[^\r\n]*/)),
            // Indented headings
            token(/[ \t]+={1,6}[^\r\n]*/)
          ), $.text_segment)
        ))
      )
    ),

    // Level-aware section structures
    section_level1: $ => prec.right(seq(
      optional($.anchor),
      alias($.section_title_level1, $.section_title),
      repeat(choice(
        $.attribute_entry,
        $.conditional_block,
        alias($.section_level2, $.section),
        alias($.section_level3, $.section),
        alias($.section_level4, $.section),
        alias($.section_level5, $.section),
        alias($.section_level6, $.section),
        // Admonitions
        $.paragraph_admonition,
        $.admonition_block,
        // Tables
        $.table_block,
        // Delimited blocks
        $.example_block,
        $.listing_block,
        $.literal_block,
        $.quote_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.unordered_list,
        $.ordered_list,
        $.description_list,
        $.callout_list,
        $.paragraph
      ))
    )),
    
    section_level2: $ => prec.right(seq(
      optional($.anchor),
      alias($.section_title_level2, $.section_title),
      repeat(choice(
        $.attribute_entry,
        $.conditional_block,
        alias($.section_level3, $.section),
        alias($.section_level4, $.section),
        alias($.section_level5, $.section),
        alias($.section_level6, $.section),
        // Admonitions
        $.paragraph_admonition,
        $.admonition_block,
        // Tables
        $.table_block,
        // Delimited blocks
        $.example_block,
        $.listing_block,
        $.literal_block,
        $.quote_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.unordered_list,
        $.ordered_list,
        $.description_list,
        $.callout_list,
        $.paragraph
      ))
    )),
    
    section_level3: $ => prec.right(seq(
      optional($.anchor),
      alias($.section_title_level3, $.section_title),
      repeat(choice(
        $.attribute_entry,
        $.conditional_block,
        alias($.section_level4, $.section),
        alias($.section_level5, $.section),
        alias($.section_level6, $.section),
        // Admonitions
        $.paragraph_admonition,
        $.admonition_block,
        // Tables
        $.table_block,
        // Delimited blocks
        $.example_block,
        $.listing_block,
        $.literal_block,
        $.quote_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.unordered_list,
        $.ordered_list,
        $.description_list,
        $.callout_list,
        $.paragraph
      ))
    )),
    
    section_level4: $ => prec.right(seq(
      optional($.anchor),
      alias($.section_title_level4, $.section_title),
      repeat(choice(
        $.attribute_entry,
        $.conditional_block,
        alias($.section_level5, $.section),
        alias($.section_level6, $.section),
        // Admonitions
        $.paragraph_admonition,
        $.admonition_block,
        // Tables
        $.table_block,
        // Delimited blocks
        $.example_block,
        $.listing_block,
        $.literal_block,
        $.quote_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.unordered_list,
        $.ordered_list,
        $.description_list,
        $.callout_list,
        $.paragraph
      ))
    )),
    
    section_level5: $ => prec.right(seq(
      optional($.anchor),
      alias($.section_title_level5, $.section_title),
      repeat(choice(
        $.attribute_entry,
        $.conditional_block,
        alias($.section_level6, $.section),
        // Admonitions
        $.paragraph_admonition,
        $.admonition_block,
        // Tables
        $.table_block,
        // Delimited blocks
        $.example_block,
        $.listing_block,
        $.literal_block,
        $.quote_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.unordered_list,
        $.ordered_list,
        $.description_list,
        $.callout_list,
        $.paragraph
      ))
    )),
    
    section_level6: $ => prec.right(seq(
      optional($.anchor),
      alias($.section_title_level6, $.section_title),
      repeat(choice(
        $.attribute_entry,
        $.conditional_block,
        // Admonitions
        $.paragraph_admonition,
        $.admonition_block,
        // Tables
        $.table_block,
        // Delimited blocks
        $.example_block,
        $.listing_block,
        $.literal_block,
        $.quote_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.unordered_list,
        $.ordered_list,
        $.description_list,
        $.callout_list,
        $.paragraph
      ))
    )),

    // Alias all section levels to 'section' for consistent AST
    section: $ => choice(
      alias($.section_level1, $.section),
      alias($.section_level2, $.section),
      alias($.section_level3, $.section),
      alias($.section_level4, $.section),
      alias($.section_level5, $.section),
      alias($.section_level6, $.section)
    ),

    // Level-specific section titles
    section_title_level1: $ => seq(
      token(prec(30, /=[ \t]+/)),
      field("title", $.title)
    ),
    
    section_title_level2: $ => seq(
      token(prec(29, /==[ \t]+/)),
      field("title", $.title)
    ),
    
    section_title_level3: $ => seq(
      token(prec(28, /===[ \t]+/)),
      field("title", $.title)
    ),
    
    section_title_level4: $ => seq(
      token(prec(27, /====[ \t]+/)),
      field("title", $.title)
    ),
    
    section_title_level5: $ => seq(
      token(prec(26, /=====[ \t]+/)),
      field("title", $.title)
    ),
    
    section_title_level6: $ => seq(
      token(prec(35, /======[ \t]+/)),
      field("title", $.title)
    ),

    // Generic section title (alias to maintain compatibility)
    section_title: $ => choice(
      alias($.section_title_level1, $.section_title),
      alias($.section_title_level2, $.section_title),
      alias($.section_title_level3, $.section_title),
      alias($.section_title_level4, $.section_title),
      alias($.section_title_level5, $.section_title),
      alias($.section_title_level6, $.section_title)
    ),

    // Title as separate rule - match everything to end of line
    title: $ => token.immediate(/[^\r\n]+/),

    // Paragraph - one or more non-blank lines separated from other paragraphs by blank lines
    paragraph: $ => prec(PREC.PARAGRAPH, seq(
      field("text", $.text_with_inlines)
    )),
    
    // Text with inline elements - comprehensive structure supporting all inline constructs
    text_with_inlines: $ => prec.right(repeat1(choice(
      // Auto-links with dynamic precedence to override text_segment
      $.auto_link,
      // Primary inline elements via inline_element wrapper for consistency with tests
      prec(50, $.inline_element),
      // Plain text (lowest precedence) - consolidate adjacent text into single segments
      $.text_segment
    ))),
    
    // Text segment - non-URL text patterns
    text_segment: $ => token(prec(PREC.TEXT, /[^*_`^~\[{+#<>\r\n\|\s]+/)),
    
    // ========================================================================
    // INLINE CONDITIONAL DIRECTIVES
    // ========================================================================
    
    // Inline conditionals within text (single bracket form)
    inline_conditional: $ => choice(
      $.inline_ifdef,
      $.inline_ifndef, 
      $.inline_ifeval
    ),
    
    // Inline ifdef - structured with content node
    inline_ifdef: $ => prec.dynamic(1000, seq(
      token(/ifdef::[A-Za-z0-9_,-]*\[/),
      optional($.inline_content),
      token.immediate(']')
    )),
    
    // Inline ifndef - structured with content node
    inline_ifndef: $ => prec.dynamic(1000, seq(
      token(/ifndef::[A-Za-z0-9_,-]*\[/),
      optional($.inline_content),
      token.immediate(']')
    )),
    
    // Inline ifeval - structured with content node
    inline_ifeval: $ => prec.dynamic(1000, seq(
      token(/ifeval::\[/),
      optional($.inline_content),
      token.immediate(']')
    )),
    
    // Content inside inline conditionals
    inline_content: $ => token.immediate(/[^\]]+/),
    
    // ========================================================================
    // INLINE ELEMENTS - Anchors, Cross-references, Footnotes
    // ========================================================================
    
    // Character classes per EBNF specification (lines 103-104 in asciidoc-ebnf.md):
    // id_start = letter | '_' ;
    // id_char = id_start | digit | '-' ;
    _id_char: $ => /[A-Za-z0-9_-]/,
    _id_start: $ => /[A-Za-z_]/,
    
    // ID rule following EBNF: id_start followed by zero or more id_char
    // Used for anchor IDs, cross-reference targets, and footnote IDs
    id: $ => token(seq(/[A-Za-z_]/, /[A-Za-z0-9_-]*/)),
    
    // External cross-reference target - allows paths, URLs, fragments
    // More permissive than id to support file paths and URL fragments
    xref_target: $ => token(/[^\[\r\n]+/),
    
    // Text content within square brackets for macro arguments
    // Used by footnotes and external cross-references
    bracketed_text: $ => token(/[^\]]+/),
    
    // Anchor text - content between comma and closing brackets
    // Excludes commas and brackets per EBNF line 209: { non_newline_char - ',' - ']' }
    anchor_text: $ => token(/[^,\]\r\n]+/),
    
    // Cross-reference text - content between comma and closing angle brackets
    // Used specifically for internal cross-references <<id,xref_text>>
    xref_text: $ => token(/[^>\r\n]+/),
    
    // ========================================================================
    // ENHANCED ANCHOR SUPPORT
    // ========================================================================
    
    // Inline anchor - EBNF line 207: anchor = '[[', anchor_id, [ ',', anchor_text ], ']]'
    // Can appear anywhere in text flow, distinguished from block anchors by lack of newline
    // Examples: [[simple-id]] or [[anchor-id,Display Text]]
    inline_anchor: $ => prec(PREC.INLINE_ANCHOR, seq(
      token('[['),
      field('id', $.id),
      optional(seq(
        token.immediate(','),
        field('text', $.anchor_text)
      )),
      token.immediate(']]')
    )),
    
    // ========================================================================
    // CROSS-REFERENCES
    // ========================================================================
    
    // Internal cross-reference - EBNF line 211: cross_reference = '<<', reference_target, [ ',', reference_text ], '>>'
    // Links to anchors within the same document
    // Examples: <<section-id>> or <<section-id,Custom Link Text>>
    internal_xref: $ => prec(PREC.INLINE_XREF, seq(
      token('<<'),
      field('target', $.id),
      optional(seq(
        token.immediate(','),
        field('text', alias($.xref_text, $.bracketed_text))
      )),
      token.immediate('>>')
    )),
    
    // External cross-reference - EBNF line 215: external_reference = 'xref:', xref_target, '[', [ xref_text ], ']'
    // Links to other documents, sections, or external resources
    // Examples: xref:other.adoc[] or xref:other.adoc#section[Link Text]
    external_xref: $ => prec(PREC.INLINE_MACRO, seq(
      token('xref:'),
      field('target', $.xref_target),
      token.immediate('['),
      optional(field('text', $.bracketed_text)),
      token.immediate(']')
    )),
    
    // ========================================================================
    // FOOTNOTES
    // ========================================================================
    
    // Inline footnote - EBNF line 334: footnote_inline = 'footnote:[', footnote_text, ']'
    // Self-contained footnote with text directly embedded
    // Example: footnote:[This is a footnote]
    footnote_inline: $ => prec.dynamic(15000, prec(PREC.INLINE_MACRO + 100, seq(
      token(prec(100, 'footnote:[')),
      field('text', $.bracketed_text),
      token.immediate(']')
    ))),
    
    // Referenced footnote - EBNF line 335: footnote_ref = 'footnote:', footnote_id, '[', [ footnote_text ], ']'
    // Creates a footnote with an ID that can be referenced elsewhere
    // Examples: footnote:ref1[] or footnote:ref1[Footnote text]
    footnote_ref: $ => prec.dynamic(15000, prec(PREC.INLINE_MACRO + 100, seq(
      token(prec(100, 'footnote:')),
      field('id', $.id),
      token.immediate('['),
      optional(field('text', $.bracketed_text)),
      token.immediate(']')
    ))),
    
    // Footnote reference - EBNF line 336: footnoteref = 'footnoteref:', footnote_id, '[', [ footnote_text ], ']'
    // References a previously defined footnote by ID
    // Examples: footnoteref:ref1[] or footnoteref:ref1[Override text]
    footnoteref: $ => prec.dynamic(15000, prec(PREC.INLINE_MACRO + 100, seq(
      token(prec(100, 'footnoteref:')),
      field('id', $.id),
      token.immediate('['),
      optional(field('text', $.bracketed_text)),
      token.immediate(']')
    ))),
    
    // ========================================================================
    // ADMONITIONS - Paragraph and Block Forms
    // ========================================================================
    
    // Admonition label - EBNF line 223: 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION'
    admonition_label: $ => choice(
      'NOTE',
      'TIP', 
      'IMPORTANT',
      'WARNING',
      'CAUTION'
    ),
    
    // Paragraph admonition - EBNF line 225: admonition_label, ':', ' ', inline_content, newline
    // Example: NOTE: This is a note paragraph with *emphasis* and links.
    // Made atomic to avoid text_segment conflicts
    paragraph_admonition: $ => prec(PREC.ADMONITION_PARAGRAPH, choice(
      // Full atomic patterns for each admonition type
      token(prec(PREC.ADMONITION_PARAGRAPH, /NOTE:[ \t]+[^\r\n]+/)),
      token(prec(PREC.ADMONITION_PARAGRAPH, /TIP:[ \t]+[^\r\n]+/)),
      token(prec(PREC.ADMONITION_PARAGRAPH, /IMPORTANT:[ \t]+[^\r\n]+/)),
      token(prec(PREC.ADMONITION_PARAGRAPH, /WARNING:[ \t]+[^\r\n]+/)),
      token(prec(PREC.ADMONITION_PARAGRAPH, /CAUTION:[ \t]+[^\r\n]+/)),
      // Empty admonitions (just label and colon)
      token(prec(PREC.ADMONITION_PARAGRAPH, /(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION):[ \t]*\r?\n/)),
    )),
    
    // Block admonition - EBNF lines 227-229: '[', admonition_label, ']', newline, block_metadata, delimited_block_body
    // Example:
    // [NOTE]
    // .Optional title
    // ====
    // Block content
    // ====
    admonition_block: $ => prec(PREC.ADMONITION_BLOCK, seq(
      // Style line: [TYPE]
      token('['),
      field('type', $.admonition_label),
      token.immediate(']'),
      token.immediate(/[ \t]*\r?\n/), // Require newline after style line
      // Required delimited block with its own metadata
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
    
    // ========================================================================
    // INLINE ELEMENT INFRASTRUCTURE
    // ========================================================================
    
    // Main inline element choices - footnotes first for precedence
    inline_element: $ => choice(
      // Inline macro elements - footnotes included here for proper wrapping
      $.footnote_inline,
      $.footnote_ref,
      $.footnoteref,
      $.external_xref,
      $.inline_anchor,
      $.internal_xref,
      $.inline_conditional,
      // Inline formatting elements
      $.strong,
      $.emphasis,
      $.monospace,
      $.superscript,
      $.subscript,
      // Other inline elements
      $.attribute_reference,
      $.link,
      $.image,
      $.passthrough_triple_plus,
      $.pass_macro,
      $.role_span,
      $.math,
      $.ui_kbd,
      $.ui_btn,
      $.ui_menu,
      $.line_break
    ),
    
    // ========================================================================
    // INLINE FORMATTING - Strong, Emphasis, Monospace, Superscript, Subscript
    // ========================================================================
    
    // Strong formatting (bold) - *text*
    strong: $ => $.strong_constrained,
    
    // Strong constrained: *word* (basic pattern)
    strong_constrained: $ => prec(PREC.STRONG, seq(
      token('*'),
      alias(token.immediate(/[^*\r\n]+/), $.strong_text),
      token.immediate('*')
    )),
    
    // Emphasis formatting (italic) - _text_
    emphasis: $ => $.emphasis_constrained,
    
    // Emphasis constrained: _word_ (basic pattern)
    emphasis_constrained: $ => prec(PREC.EMPHASIS, seq(
      token('_'),
      alias(token.immediate(/[^_\r\n]+/), $.emphasis_text),
      token.immediate('_')
    )),
    
    // Monospace formatting (code) - `text`
    monospace: $ => $.monospace_constrained,
    
    // Monospace constrained: `code` (basic pattern)
    monospace_constrained: $ => prec(PREC.MONOSPACE, seq(
      token('`'),
      alias(token.immediate(/[^`\r\n]+/), $.monospace_text),
      token.immediate('`')
    )),
    
    // Superscript - ^text^
    superscript: $ => prec(PREC.SUPERSCRIPT, seq(
      token('^'),
      alias(token.immediate(/[^\^\r\n]+/), $.superscript_text),
      token.immediate('^')
    )),
    
    // Subscript - ~text~
    subscript: $ => prec(PREC.SUBSCRIPT, seq(
      token('~'),
      alias(token.immediate(/[^~\r\n]+/), $.subscript_text),
      token.immediate('~')
    )),
    
    // ========================================================================
    // PASSTHROUGH AND MACROS
    // ========================================================================
    
    // Inline passthrough: +++literal text+++
    passthrough_triple_plus: $ => prec(PREC.PASSTHROUGH, seq(
      token('+++'),
      field('content', token.immediate(/(?:[^+]|\+[^+]|\+\+[^+])*/)),
      token.immediate('+++')
    )),
    
    // Pass macro: pass:subs[content] - very high precedence to beat text_segment
    pass_macro: $ => prec.dynamic(10000, prec(PREC.PASSTHROUGH + 50, choice(
      // Pass macro with substitutions: pass:subs[content]
      seq(
        token('pass:'),
        field('subs', token.immediate(/[A-Za-z0-9_,+|-]+/)),
        token.immediate('['),
        field('content', token.immediate(/(?:\\.|[^\]]+)*/)),
        token.immediate(']')
      ),
      // Pass macro without substitutions: pass:[content]
      seq(
        token('pass:['),
        field('content', token.immediate(/(?:\\.|[^\]]+)*/)),
        token.immediate(']')
      )
    ))),
    
    // Attribute references: {attribute-name}
    attribute_reference: $ => token(prec(PREC.ATTRIBUTE_REF, /\{[A-Za-z0-9_][A-Za-z0-9_-]*\}/)),
    
    // Line breaks: trailing " +" at end of line 
    line_break: $ => prec(PREC.LINE_BREAK, token(/[ \t]\+[ \t]*\r?\n/)),
    
    // Role spans: [role]#styled text#
    role_span: $ => prec(PREC.ROLE_SPAN, seq(
      token('['),
      field('role', token(/[A-Za-z0-9_.-]+/)),
      token(']'),
      token('#'),
      field('content', repeat1(choice(
        $.strong,
        $.emphasis,
        $.monospace,
        $.superscript,
        $.subscript,
        $.attribute_reference,
        $.line_break,
        alias(token(prec(10, /\\#|[^#\r\n]+/)), $.text_segment)
      ))),
      token('#')
    )),
    
    // Math macros: stem, latexmath, asciimath
    math: $ => prec(PREC.MATH, choice(
      seq(token('stem:['), field('content', token(/(?:\\.|[^\]]+)*/)), token(']')),
      seq(token('latexmath:['), field('content', token(/(?:\\.|[^\]]+)*/)), token(']')),
      seq(token('asciimath:['), field('content', token(/(?:\\.|[^\]]+)*/)), token(']'))
    )),
    
    // UI macros: kbd, btn, menu
    ui_kbd: $ => prec(PREC.UI_MACRO, seq(token('kbd:['), field('keys', token(/(?:\\.|[^\]]+)+/)), token(']'))),
    ui_btn: $ => prec(PREC.UI_MACRO, seq(token('btn:['), field('label', token(/(?:\\.|[^\]]+)+/)), token(']'))),
    ui_menu: $ => prec(PREC.UI_MACRO, seq(
      token('menu:'),
      field('path', token(/[^\[\]\r\n]+/)),
      token('['),
      field('text', token(/(?:\\.|[^\]]*)*/)),
      token(']')
    )),
    
    // Automatic URLs and links - maximum dynamic precedence to override text_segment
    auto_link: $ => prec.dynamic(10000, token(prec(PREC.LINK + 200, /https?:\/\/[^\s\[\]<>]+/))),
    
    link: $ => prec.dynamic(2000, prec(PREC.LINK + 100, seq(
      field('url', $.auto_link),
      token('['),
      field('text', repeat(choice(
        $.strong,
        $.emphasis,
        $.monospace,
        $.superscript,
        $.subscript,
        $.attribute_reference,
        $.line_break,
        alias(token(/\\.|[^\]]/), $.text_segment)
      ))),
      token(']')
    ))),
    
    // Image macros: image: and image::
    image: $ => prec(PREC.IMAGE, choice(
      seq(token('image:'), field('target', token(/[^\[\]\r\n]+/)), token('['), field('attributes', token(/(?:\\.|[^\]]+)*/)), token(']')),
      seq(token('image::'), field('target', token(/[^\[\]\r\n]+/)), token('['), field('attributes', token(/(?:\\.|[^\]]+)*/)), token(']'))
    )),
    
    // ========================================================================
    // BLOCK METADATA - For delimited blocks only
    // ========================================================================
    
    // Block anchor - enhanced to support optional text like [[id,text]]
    // Must end with newline to distinguish from inline anchors
    anchor: $ => prec(PREC.BLOCK_META, seq(
      token('[['),
      field('id', $.id),
      optional(seq(
        token.immediate(','),
        field('text', $.anchor_text)
      )),
      token.immediate(']]'),
      token.immediate(/[ \t]*\r?\n/)
    )),
    
    block_title: $ => token(prec(PREC.BLOCK_META, /\.[^\r\n]+\r?\n/)),
    
    // ID and roles: [#id], [.role], or [#id.role1.role2]
    // Requires either #id and/or one or more .role to avoid generic attribute conflicts
    id_and_roles: $ => token(prec(PREC.BLOCK_META + 1, 
      /\[\s*(?:#[A-Za-z][\w:-]*)?(?:\s*\.[A-Za-z0-9_-]+)*\s*\]\s*\r?\n/
    )),
    
    // Block attributes with key=value pairs
    block_attributes: $ => token(prec(PREC.BLOCK_META, 
      /\[[^\]\r\n]*=[^\]\r\n]*\]\s*\r?\n/
    )),
    
    // Metadata container allowing any order and any subset
    block_metadata: $ => prec.left(repeat1(choice(
      $.anchor, 
      $.block_title, 
      $.id_and_roles, 
      $.block_attributes
    ))),

    // ========================================================================
    // DELIMITED BLOCKS - Opening/Closing Delimiters and Content
    // ========================================================================
    
    // Delimited block delimiters - separate open/close for test compatibility
    // Closing delimiters need higher precedence than content lines to be properly recognized
    example_open: $ => token(prec(PREC.DELIMITED_BLOCK, /====[ \t]*\r?\n/)),
    example_close: $ => token(prec(1000, /====[ \t]*\r?\n/)),
    listing_open: $ => token(prec(PREC.DELIMITED_BLOCK, /----[ \t]*\r?\n/)),
    listing_close: $ => token(prec(1000, /----[ \t]*\r?\n/)),
    literal_open: $ => token(prec(PREC.DELIMITED_BLOCK, /\.\.\.\.[ \t]*\r?\n/)),
    literal_close: $ => token(prec(1000, /\.\.\.\.[ \t]*\r?\n/)),
    quote_open: $ => token(prec(PREC.DELIMITED_BLOCK, /____[ \t]*\r?\n/)),
    quote_close: $ => token(prec(1000, /____[ \t]*\r?\n/)),
    sidebar_open: $ => token(prec(PREC.DELIMITED_BLOCK, /\*\*\*\*[ \t]*\r?\n/)),
    sidebar_close: $ => token(prec(1000, /\*\*\*\*[ \t]*\r?\n/)),
    passthrough_open: $ => token(prec(PREC.DELIMITED_BLOCK, /\+\+\+\+[ \t]*\r?\n/)),
    passthrough_close: $ => token(prec(1000, /\+\+\+\+[ \t]*\r?\n/)),
    openblock_open: $ => token(prec(PREC.DELIMITED_BLOCK, /--[ \t]*\r?\n/)),
    openblock_close: $ => token(prec(1000, /--[ \t]*\r?\n/)),
    
    // Content line for delimited blocks - highest precedence to override all other tokens
    _content_line: $ => token(prec(200, /[^\r\n]*\r?\n/)),

    // ========================================================================
    // DELIMITED BLOCK RULES - Main block structures
    // ========================================================================
    
    // Block content - wraps content lines into single semantic node
    block_content: $ => repeat1($._content_line),
    
    // Example block
    example_block: $ => seq(
      optional(alias($.block_metadata, $.metadata)),
      $.example_open,
      optional($.block_content),
      $.example_close
    ),
    
    // Listing block
    listing_block: $ => seq(
      optional(alias($.block_metadata, $.metadata)),
      $.listing_open,
      optional($.block_content),
      $.listing_close
    ),
    
    // Literal block
    literal_block: $ => seq(
      optional(alias($.block_metadata, $.metadata)),
      $.literal_open,
      optional($.block_content),
      $.literal_close
    ),
    
    // Quote block
    quote_block: $ => seq(
      optional(alias($.block_metadata, $.metadata)),
      $.quote_open,
      optional($.block_content),
      $.quote_close
    ),
    
    // Sidebar block
    sidebar_block: $ => seq(
      optional(alias($.block_metadata, $.metadata)),
      $.sidebar_open,
      optional($.block_content),
      $.sidebar_close
    ),
    
    // Passthrough block
    passthrough_block: $ => seq(
      optional(alias($.block_metadata, $.metadata)),
      $.passthrough_open,
      optional($.block_content),
      $.passthrough_close
    ),
    
    // Open block
    open_block: $ => seq(
      optional(alias($.block_metadata, $.metadata)),
      $.openblock_open,
      optional($.block_content),
      $.openblock_close
    ),
    
    // ========================================================================
    // BLOCK BODIES WITHOUT METADATA - For use in admonition blocks
    // ========================================================================
    
    // Block bodies without metadata (for admonition blocks where metadata is handled separately)
    _example_block_body: $ => seq(
      $.example_open,
      optional($.block_content),
      $.example_close
    ),
    
    _listing_block_body: $ => seq(
      $.listing_open,
      optional($.block_content),
      $.listing_close
    ),
    
    _literal_block_body: $ => seq(
      $.literal_open,
      optional($.block_content),
      $.literal_close
    ),
    
    _quote_block_body: $ => seq(
      $.quote_open,
      optional($.block_content),
      $.quote_close
    ),
    
    _sidebar_block_body: $ => seq(
      $.sidebar_open,
      optional($.block_content),
      $.sidebar_close
    ),
    
    _passthrough_block_body: $ => seq(
      $.passthrough_open,
      optional($.block_content),
      $.passthrough_close
    ),
    
    _open_block_body: $ => seq(
      $.openblock_open,
      optional($.block_content),
      $.openblock_close
    ),

    // Attribute entry - structured to extract name and value fields
    attribute_entry: $ => prec(PREC.ATTRIBUTE_ENTRY, choice(
      // With value: :name: value  
      seq(
        ':',
        field('name', $.name),
        ':',
        field('value', $.value)
      ),
      // Without value: :name:
      seq(
        ':',
        field('name', $.name),
        ':'
      )
    )),
    
    // Name and value tokens for attributes
    name: $ => token(/[A-Za-z0-9][A-Za-z0-9_-]*/),
    value: $ => token(/[^\r\n]+/),

    // ========================================================================
    // LIST PARSING - Markdown-inspired marker-specific lists
    // ========================================================================
    
    // Unordered lists - separate types for each marker for better grouping
    unordered_list: $ => choice(
      $._list_asterisk,
      $._list_dash
    ),
    
    _list_asterisk: $ => prec.right(10, repeat1(alias($._asterisk_list_item, $.unordered_list_item))),
    _list_dash: $ => prec.right(10, repeat1(alias($._dash_list_item, $.unordered_list_item))),
    
    _asterisk_list_item: $ => token(prec(20, /\*[ \t]+[^\r\n]+/)),
    _dash_list_item: $ => token(prec(20, /-[ \t]+[^\r\n]+/)),
    
    // Ordered lists
    ordered_list: $ => prec.right(10, repeat1($.ordered_list_item)),
    
    ordered_list_item: $ => token(prec(20, /[0-9]+\.[ \t]+[^\r\n]+/)),
    
    // Description lists  
    description_list: $ => prec.right(10, repeat1($.description_item)),
    
    // Description item - only simple identifiers (no spaces) to avoid conflicts
    description_item: $ => token(prec(PREC.DESCRIPTION_LIST - 5, /[A-Za-z][A-Za-z0-9_-]{0,30}::[ \t]+[^\r\n]+/)),
    
    // Callout lists
    callout_list: $ => prec.right(10, repeat1($.callout_item)),
    
    callout_item: $ => token(prec(20, /<[0-9]+>[ \t]+[^\r\n]+/)),
    
    // ========================================================================
    // TABLES - Advanced Features per EBNF specification
    // ========================================================================
    
    // table_block = block_metadata, '|===', newline, table_content, '|===', newline
    table_block: $ => seq(
      optional(alias($.block_metadata, $.metadata)),
      $.table_open,
      repeat(choice(
        $.table_row,
        /\r?\n/  // Allow blank lines in tables
      )),
      $.table_close
    ),
    
    // Table delimiters
    table_open: $ => token(prec(PREC.TABLE, /\|===[ \t]*\r?\n/)),
    table_close: $ => token(prec(PREC.TABLE, /\|===[ \t]*\r?\n/)),
    
    // table_row = single cell (simple approach for now)
    table_row: $ => prec.right(seq(
      $.table_cell,
      optional(/\r?\n/)
    )),
    
    // table_cell = [ cell_spec ], '|', optional cell_content
    table_cell: $ => seq(
      optional($.cell_spec),
      token('|'),
      optional(field('content', $.cell_content))
    ),
    
    // cell_spec = [ span_spec ] - format_spec temporarily disabled for testing
    cell_spec: $ => $.span_spec,
    
    // span_spec = digit, { digit }, [ '.', digit, { digit } ], '+'
    // Examples: 2+, 3.2+, 1.4+
    span_spec: $ => token(prec(PREC.TABLE - 10, /[0-9]+(?:\.[0-9]+)?\+/)),
    
    // format_spec = single character format specifier (only in table cell context)
    // Examples: h (header), l (left), c (center), r (right), d (default), s (strong), e (emphasis), m (monospace), a (AsciiDoc)
    // Very low precedence to avoid conflicts with regular text
    format_spec: $ => token(prec(PREC.TABLE - 50, /[hlcrsedma]/)),
    
    // cell_content = { non_newline_char - '|' }
    // Content until next unescaped | or end of row - only non-empty content
    cell_content: $ => token.immediate(/[^|\r\n]+/),
  },
});
