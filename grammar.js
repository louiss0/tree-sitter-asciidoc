/**
 * @file Ultra-minimal AsciiDoc parser for debugging paragraph parsing
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  externals: $ => [
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
    $.DELIMITED_BLOCK_CONTENT_LINE
  ],

  extras: $ => [
    /[ \t]/  // Allow spaces and tabs but not newlines
  ],

  conflicts: $ => [
    [$.unordered_list_item],
    [$.ordered_list_item], 
    [$.description_item],
    [$.callout_item],
    [$.inline_element, $.explicit_link],
    [$.attribute_content, $.role_list]
  ],

  rules: {
    source_file: $ => repeat($._element),

    _element: $ => choice(
      $.section,
      $.unordered_list,
      $.ordered_list,
      $.description_list,
      $.callout_list,
      $.attribute_entry,
      $.example_block,
      $.listing_block,
      $.asciidoc_blockquote,
      $.markdown_blockquote,
      $.literal_block,
      $.sidebar_block,
      $.passthrough_block,
      $.open_block,
      $.conditional_block,
      $.include_directive,
      $.block_comment,
      $.table_block,
      $.paragraph,
      $._blank_line,
    ),

    // SECTIONS - hierarchical approach for test compatibility
    section: $ => prec.right(seq(
      optional($.anchor),
      $.section_title,
      repeat(choice(
        $.attribute_entry,
        $.paragraph,
        $.unordered_list,
        $.ordered_list,
        $.description_list,
        $.callout_list,
        $.example_block,
        $.listing_block,
        $.asciidoc_blockquote,
        $.markdown_blockquote,
        $.literal_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.conditional_block,
        $.include_directive,
        $.block_comment,
        $.table_block,
        prec.right($.section), // Allow nested sections
        $._blank_line
      ))
    )),
    
    section_title: $ => seq(
      choice(
        $.section_marker_1,
        $.section_marker_2,
        $.section_marker_3,
        $.section_marker_4,
        $.section_marker_5,
        $.section_marker_6
      ),
      $.title,
      $._line_ending
    ),
    
    title: $ => token.immediate(/[^\r\n]+/),

    section_marker_1: $ => token(prec(50, seq('=', /[ \t]+/))),
    section_marker_2: $ => token(prec(45, seq('==', /[ \t]+/))),
    section_marker_3: $ => token(prec(40, seq('===', /[ \t]+/))),
    section_marker_4: $ => token(prec(35, seq('====', /[ \t]+/))),
    section_marker_5: $ => token(prec(30, seq('=====', /[ \t]+/))),
    section_marker_6: $ => token(prec(25, seq('======', /[ \t]+/))),

    // ATTRIBUTE ENTRIES  
    attribute_entry: $ => choice(
      prec(25, seq(
        field('name', alias(
          token(seq(':', /([a-zA-Z0-9_-]+)/, ':')),
          $.name
        )),
        optional(seq(
          /[ \t]+/,
          field('value', $.value)
        )),
        $._line_ending
      )),
      // Attribute unset syntax: :!name: or :name!:
      prec(25, seq(
        field('name', alias(
          choice(
            token(seq(':!', /([a-zA-Z0-9_-]+)/, ':')),
            token(seq(':', /([a-zA-Z0-9_-]+)/, '!:'))
          ),
          $.name
        )),
        optional(/[ \t]+/), // Allow trailing spaces  
        $._line_ending
      ))
    ),
    
    name: $ => token(/[a-zA-Z0-9_-]+/),
    value: $ => /[^\r\n]+/,

    // DELIMITED BLOCKS
    example_block: $ => seq(
      optional($.metadata),
      field('open', $.example_open),
      optional(field('content', $.block_content)),
      field('close', $.example_close)
    ),
    
    example_open: $ => $.EXAMPLE_FENCE_START,
    
    example_close: $ => $.EXAMPLE_FENCE_END,
    
    // Listing blocks
    listing_block: $ => seq(
      optional($.metadata),
      field('open', $.listing_open),
      optional(field('content', $.block_content)),
      field('close', $.listing_close)
    ),
    
    listing_open: $ => $.LISTING_FENCE_START,
    
    listing_close: $ => $.LISTING_FENCE_END,
    
    // AsciiDoc quote blocks (fenced with ____)
    asciidoc_blockquote: $ => seq(
      optional($.metadata),
      field('open', $.asciidoc_blockquote_open),
      field('content', $.block_content),
      field('close', $.asciidoc_blockquote_close)
    ),
    
    asciidoc_blockquote_open: $ => $.QUOTE_FENCE_START,
    
    asciidoc_blockquote_close: $ => $.QUOTE_FENCE_END,
    
    // Markdown-style blockquotes (lines starting with >)
    markdown_blockquote: $ => prec.right(seq(
      optional($.metadata),
      repeat1($.markdown_blockquote_line)
    )),
    
    markdown_blockquote_line: $ => seq(
      field('marker', $.markdown_blockquote_marker),
      optional(field('content', $.text_with_inlines)),
      $._line_ending
    ),
    
    markdown_blockquote_marker: $ => token(prec(15, seq(
      repeat1('>'),
      optional(/[ \t]+/)
    ))),
    
    // Literal blocks
    literal_block: $ => seq(
      optional($.metadata),
      field('open', $.literal_open),
      field('content', $.block_content),
      field('close', $.literal_close)
    ),
    
    literal_open: $ => $.LITERAL_FENCE_START,
    
    literal_close: $ => $.LITERAL_FENCE_END,
    
    // Sidebar blocks
    sidebar_block: $ => seq(
      optional($.metadata),
      $.sidebar_open,
      $.block_content,
      $.sidebar_close
    ),
    
    sidebar_open: $ => $.SIDEBAR_FENCE_START,
    
    sidebar_close: $ => $.SIDEBAR_FENCE_END,
    
    // Passthrough blocks
    passthrough_block: $ => seq(
      optional($.metadata),
      $.passthrough_open,
      $.block_content,
      $.passthrough_close
    ),
    
    passthrough_open: $ => $.PASSTHROUGH_FENCE_START,
    
    passthrough_close: $ => $.PASSTHROUGH_FENCE_END,
    
    // Open blocks
    open_block: $ => seq(
      optional($.metadata),
      field('open', $.openblock_open),
      field('content', $.block_content),
      field('close', $.openblock_close)
    ),
    
    openblock_open: $ => $.OPENBLOCK_FENCE_START,
    
    openblock_close: $ => $.OPENBLOCK_FENCE_END,
    
    // CONDITIONAL BLOCKS - with error recovery
    conditional_block: $ => prec(2, choice(
      $.ifdef_block,
      $.ifndef_block,
      $.ifeval_block
    )),
    
    ifdef_block: $ => prec.right(seq(
      field('open', $.ifdef_open),
      repeat($._element),
      optional(field('close', $.endif_directive))
    )),
    
    ifndef_block: $ => prec.right(seq(
      field('open', $.ifndef_open),
      repeat($._element),
      optional(field('close', $.endif_directive))
    )),
    
    ifeval_block: $ => prec.right(seq(
      field('open', $.ifeval_open),
      repeat($._element),
      optional(field('close', $.endif_directive))
    )),
    
    ifdef_open: $ => seq(
      'ifdef::',
      /[^\[\r\n]+/,  // attribute name(s)
      '[',
      optional(/[^\]\r\n]*/),  // optional content
      ']',
      $._line_ending
    ),
    
    ifndef_open: $ => seq(
      'ifndef::',
      /[^\[\r\n]+/,  // attribute name(s)
      '[',
      optional(/[^\]\r\n]*/),  // optional content
      ']',
      $._line_ending
    ),
    
    ifeval_open: $ => seq(
      'ifeval::',
      '[',
      field('expression', $.expression),  // parsed expression
      ']',
      $._line_ending
    ),
    
    // EXPRESSIONS - for ifeval conditions
    expression: $ => prec.right(choice(
      $.binary_expression,
      $.unary_expression,
      $.grouped_expression,
      $.primary_expression
    )),
    
    binary_expression: $ => choice(
      // Logical operators (lowest precedence)
      prec.left(1, seq($.expression, choice('&&', '||', 'and', 'or'), $.expression)),
      // Comparison operators  
      prec.left(2, seq($.expression, choice('==', '!=', '<', '>', '<=', '>='), $.expression)),
      // Arithmetic operators (highest precedence)
      prec.left(3, seq($.expression, choice('+', '-'), $.expression)),
      prec.left(4, seq($.expression, choice('*', '/', '%'), $.expression))
    ),
    
    unary_expression: $ => prec(5, choice(
      seq('!', $.expression),
      seq('-', $.expression)
    )),
    
    grouped_expression: $ => seq('(', $.expression, ')'),
    
    primary_expression: $ => choice(
      $.string_literal,
      $.numeric_literal,
      $.boolean_literal,
      $.attribute_reference
    ),
    
    string_literal: $ => choice(
      seq('"', /[^"\r\n]*/, '"'),
      seq("'", /[^'\r\n]*/, "'")
    ),
    
    numeric_literal: $ => token(choice(
      /\d+\.\d+/,  // float
      /\d+/        // integer
    )),
    
    boolean_literal: $ => choice('true', 'false'),
    
    endif_directive: $ => seq(
      'endif::',
      '[',
      optional(/[^\]\r\n]*/),  // optional content
      ']',
      optional($._line_ending)
    ),
    
    // METADATA
    metadata: $ => prec.right(repeat1(choice(
      $.block_attributes,
      $.id_and_roles,
      $.block_title
    ))),
    
    block_attributes: $ => prec(3, seq(
      '[',
      field('content', $.attribute_content),
      ']',
      $._line_ending
    )),
    
    attribute_content: $ => /[^\]\r\n]+/,
    
    id_and_roles: $ => seq(
      '[',
      /#[^\]\r\n]+/,  // content starting with # for ID
      ']',
      $._line_ending
    ),
    
    block_title: $ => prec(-1, seq(
      '.',
      /[^\r\n]+/,  // title text
      $._line_ending
    )),
    
    // INCLUDE DIRECTIVES
    include_directive: $ => prec(1, seq(
      'include::',
      field('path', $.include_path),
      optional(seq(
        '[',
        field('options', $.include_options),
        ']'
      )),
      $._line_ending
    )),
    
    include_path: $ => /[^\[\r\n]+/,
    include_options: $ => /[^\]\r\n]*/,
    
    block_content: $ => repeat1(choice(
      $.content_line,
      $._blank_line
    )),
    
    content_line: $ => $.DELIMITED_BLOCK_CONTENT_LINE,

    // LISTS
    unordered_list: $ => prec.right(seq(
      $.unordered_list_item,
      repeat($.unordered_list_item)
    )),
    
    unordered_list_item: $ => seq(
      $._unordered_list_marker,
      field('content', $.text_with_inlines),
      $._line_ending,
      repeat($.list_item_continuation)
    ),
    
    _unordered_list_marker: $ => token(prec(10, /[ \t]*[*-][ \t]+/)),
    
    ordered_list: $ => prec.right(seq(
      $.ordered_list_item,
      repeat($.ordered_list_item)
    )),
    
    ordered_list_item: $ => seq(
      $._ordered_list_marker,
      field('content', $.text_with_inlines),
      $._line_ending,
      repeat($.list_item_continuation)
    ),
    
    _ordered_list_marker: $ => token(prec(15, seq(/[0-9]+/, '.', /[ \t]+/))),

    // DESCRIPTION LISTS
    description_list: $ => prec.right(2, seq(
      $.description_item,
      repeat($.description_item)
    )),
    
    description_item: $ => seq(
      $._description_marker,
      $.description_content,
      $._line_ending,
      repeat($.list_item_continuation)
    ),
    
    _description_marker: $ => token(prec(20, /(?!ifn?def|ifeval)[^\s\r\n:]+::[ \t]+/)),
    description_content: $ => $.text_with_inlines,

    // CALLOUT LISTS
    callout_list: $ => prec.right(seq(
      $.callout_item,
      repeat($.callout_item)
    )),
    
    callout_item: $ => seq(
      $.CALLOUT_MARKER,
      field('content', $.text_with_inlines),
      $._line_ending,
      repeat($.list_item_continuation)
    ),
    
    CALLOUT_MARKER: $ => token(prec(5, /<[0-9]+>[ \t]+/)),

    // LIST CONTINUATIONS
    list_item_continuation: $ => seq(
      $.LIST_CONTINUATION,
      choice(
        $.paragraph,
        $.open_block,
        $.example_block,
        $.listing_block,
        $.asciidoc_blockquote,
        $.markdown_blockquote,
        $.literal_block,
        $.sidebar_block,
        $.passthrough_block,
        $.table_block,
        $.block_comment,
        $.conditional_block,
        // Allow nested lists in continuations
        $.unordered_list,
        $.ordered_list,
        $.description_list
      )
    ),

    // LIST_CONTINUATION handled by external scanner
    // LIST_CONTINUATION: $ => token(seq('+', /[ \t]*/, /\r?\n/)),

    // PARAGRAPHS
    paragraph: $ => prec.right(1, seq(
      optional($.metadata),
      choice(
        $.paragraph_admonition,
        field('content', $.text_with_inlines)
      ),
      optional($._line_ending)
    )),

    // PARAGRAPH ADMONITIONS
    paragraph_admonition: $ => seq(
      $.admonition_label,
      $.text_with_inlines
    ),
    
    admonition_label: $ => token(prec(1, choice(
      seq('NOTE', ':', /[ \t]+/),
      seq('TIP', ':', /[ \t]+/),
      seq('IMPORTANT', ':', /[ \t]+/),
      seq('WARNING', ':', /[ \t]+/),
      seq('CAUTION', ':', /[ \t]+/)
    ))),

    text_with_inlines: $ => prec.right(repeat1(choice(
      seq(/[ \t\f]+/, $._text_element),    // Spaced elements
      $._text_element                      // Direct elements
    ))),
    
    _text_element: $ => choice(
      prec(2000, $.inline_element),
      $.text_segment,
      $.text_period,
      $.text_colon,
      $.text_angle_bracket,
      $.text_brace,
      $.text_hash,
      $.text_bracket,
      $.text_paren,
      $.text_caret,
      $.text_tilde,
      // Error recovery: treat orphaned formatting chars as text
      prec(-100, '*'),
      prec(-100, '_'),
      prec(-100, '`')
    ),
    
    text_segment: $ => token(prec(-1, /[^\s\r\n:*_\`^~\[\]<>\{}#()|]+/)),
    
    // Error recovery: fallback for any remaining characters
    error_recovery: $ => prec(-1000, /./),
    
    // For periods after inline elements
    text_period: $ => '.',
    
    // For colons in invalid attribute patterns
    text_colon: $ => ':',
    
    // For angle brackets in invalid callout patterns
    text_angle_bracket: $ => choice('<', '>'),
    
    // For curly braces in invalid attribute patterns
    text_brace: $ => choice('{', '}'),
    
    // For hash symbols in invalid role span patterns
    text_hash: $ => '#',
    
    // For brackets in invalid patterns
    text_bracket: $ => choice('[', ']'),
    
    // For parentheses in invalid patterns
    text_paren: $ => choice('(', ')'),
    
    // For carets in invalid superscript patterns
    text_caret: $ => '^',
    
    // For tildes in invalid subscript patterns
    text_tilde: $ => '~',
    

    // INLINE FORMATTING
    inline_element: $ => choice(
      $.strong,
      $.emphasis,
      $.monospace,
      $.superscript,
      $.subscript,
      $.inline_anchor,
      $.bibliography_entry,
      $.internal_xref,
      $.external_xref,
      $.link_macro,
      $.footnote_inline,
      $.footnote_ref,
      $.footnoteref,
      $.explicit_link,
      $.auto_link,
      $.image,
      $.passthrough_triple_plus,
      $.pass_macro,
      $.attribute_reference,
      $.role_span,
      $.math_macro,
      $.ui_macro,
      $.index_term,
      $.line_break
    ),

    // Strong formatting (*bold*)
    strong: $ => prec(50, seq(
      field('open', $.strong_open),
      field('content', $.strong_content),
      field('close', $.strong_close)
    )),

    strong_open: $ => '*',
    strong_close: $ => '*',
    strong_content: $ => repeat1(choice(
      $.text_segment,
      $.emphasis,
      $.monospace,
      $.superscript,
      $.subscript,
      token.immediate(/\\[*_`^~]/),  // escaped formatting chars
      token.immediate(/[^*\r\n]+/)   // other text
    )),

    // Emphasis formatting (_italic_)
    emphasis: $ => prec(50, seq(
      field('open', $.emphasis_open),
      field('content', $.emphasis_content),
      field('close', $.emphasis_close)
    )),

    emphasis_open: $ => '_',
    emphasis_close: $ => '_',
    emphasis_content: $ => repeat1(choice(
      $.text_segment,
      $.strong,
      $.monospace,
      $.superscript,
      $.subscript,
      token.immediate(/\\[*_`^~]/),  // escaped formatting chars
      token.immediate(/[^_\r\n]+/)   // other text
    )),

    // Monospace formatting (`code`)
    monospace: $ => prec(50, seq(
      field('open', $.monospace_open),
      field('content', $.monospace_content),
      field('close', $.monospace_close)
    )),

    monospace_open: $ => '`',
    monospace_close: $ => '`',
    monospace_content: $ => repeat1(choice(
      token.immediate(/\\[*_`^~]/),  // escaped formatting chars
      token.immediate(/[^`\r\n]+/)   // plain text (no nesting in monospace)
    )),

    // Superscript (^super^)
    superscript: $ => prec(100, seq(
      field('open', $.superscript_open),
      field('content', $.superscript_text),
      field('close', $.superscript_close)
    )),
    
    superscript_open: $ => '^',
    superscript_close: $ => '^',
    superscript_text: $ => token.immediate(/(?:\\.|[^\^\r\n])+/),

    // Subscript (~sub~)
    subscript: $ => prec(100, seq(
      field('open', $.subscript_open),
      field('content', $.subscript_text),
      field('close', $.subscript_close)
    )),
    
    subscript_open: $ => '~',
    subscript_close: $ => '~',
    subscript_text: $ => token.immediate(/(?:\\.|[^~\r\n])+/),

    // ANCHORS & CROSS-REFERENCES
    inline_anchor: $ => seq(
      '[[',
      $.inline_anchor_id,  // anchor id
      optional(seq(',', $.inline_anchor_text)),  // optional anchor text
      ']]'
    ),
    
    // Bibliography entries [[[ref]]]
    bibliography_entry: $ => seq(
      '[[[',
      field('id', $.bibliography_id),
      optional(seq(',', field('description', $.bibliography_text))),
      ']]]'
    ),
    
    bibliography_id: $ => /[^,\]\r\n]+/,
    bibliography_text: $ => /[^\]\r\n]+/,
    
    inline_anchor_id: $ => /[^\]\r\n,]+/,
    inline_anchor_text: $ => /[^\]\r\n]+/,

    // Block anchors (stand-alone)
    anchor: $ => prec(2, seq(
      '[[',
      field('id', $.inline_anchor_id),
      optional(seq(',', field('text', $.inline_anchor_text))),
      ']]',
      $._line_ending
    )),

    internal_xref: $ => seq(
      '<<',
      /[^>,\r\n]+/,  // target id (don't allow > to prevent partial matches)
      optional(seq(',', /[^>\r\n]+/)),  // optional link text
      '>>'
    ),

    external_xref: $ => seq(
      'xref:',
      /[^\[\r\n]+/,  // file path
      '[',
      optional(/[^\]\r\n]+/),  // optional link text
      ']'
    ),


    footnote_inline: $ => seq(
      'footnote:[',
      /[^\]\r\n]+/,  // footnote text
      ']'
    ),

    footnote_ref: $ => seq(
      'footnote:',
      /[^\[\r\n]+/,  // reference id
      '[',
      optional(/[^\]\r\n]+/),  // optional text
      ']'
    ),

    footnoteref: $ => seq(
      'footnoteref:',
      /[^\[\r\n]+/,  // reference id
      '[',
      optional(/[^\]\r\n]+/),  // optional text
      ']'
    ),

    // EXPLICIT LINKS - URL followed by [text] (uses auto_link, higher precedence)
    explicit_link: $ => prec.dynamic(2000, seq(
      field('url', $.auto_link),
      token('['),
      field('text', optional($.link_text)),
      token(']')
    )),

    // LINK MACRO - link:URL[text]
    link_macro: $ => prec(10, seq(
      'link:',
      /[^\[\r\n]+/,
      '[',
      optional($.link_text),
      ']'
    )),
    
    // AUTO LINKS - standalone URLs as simple tokens
    auto_link: $ => token(prec(5, choice(
      /https?:\/\/[^\s\[\]<>"']+/,
      /ftp:\/\/[^\s\[\]<>"']+/,
      /mailto:[^\s\[\]<>"']+/
    ))),
    
    link_text: $ => /[^\]\r\n]+/,
    
    bracketed_text: $ => /[^\]\r\n]+/,

    // IMAGES
    image: $ => choice(
      seq('image:', /[^\[\r\n]+/, '[', optional(/[^\]\r\n]+/), ']'),
      seq('image::', /[^\[\r\n]+/, '[', optional(/[^\]\r\n]+/), ']')
    ),

    // PASSTHROUGH
    passthrough_triple_plus: $ => seq(
      '+++',
      /[^+]+/,  // content without + characters (simplified)
      '+++'
    ),
    
    pass_macro: $ => seq(
      'pass:',
      optional(/[a-zA-Z,]+/),  // optional substitutions like 'quotes'
      '[',
      /[^\]\r\n]*/,  // content
      ']'
    ),

    // ATTRIBUTE REFERENCES
    attribute_reference: $ => token(prec(10, seq(
      '{',
      /[^}\r\n]+/,
      '}'
    ))),

    // ROLE SPANS
    role_span: $ => prec(2, seq(
      '[',
      field('roles', $.role_list),  // Support multiple roles and IDs
      ']',
      '#',
      field('content', $.role_content),
      '#'
    )),
    
    role_list: $ => /[^\]\r\n]+/,  // Roles like .class1.class2#id
    
    role_content: $ => repeat1(choice(
      prec(100, $.strong),
      prec(100, $.emphasis),
      prec(100, $.monospace),
      prec(100, $.superscript),
      prec(100, $.subscript),
      prec(100, $.explicit_link),
      prec(100, $.attribute_reference),
      token.immediate(/[^#\r\n*_`^~\[\{]+/),  // Plain text, avoiding formatting chars
      token.immediate(/[*_`^~\[\{]/)  // Individual formatting chars when not part of patterns
    )),

    // MATH MACROS
    math_macro: $ => choice(
      $.stem_inline,
      $.latexmath_inline,
      $.asciimath_inline
    ),
    
    // Keep as tokens to avoid parsing conflicts but allow separate node types
    stem_inline: $ => token(seq('stem:[', /[^\]\r\n]+/, ']')),
    latexmath_inline: $ => token(seq('latexmath:[', /[^\]\r\n]+/, ']')),
    asciimath_inline: $ => token(seq('asciimath:[', /[^\]\r\n]+/, ']')),

    // UI MACROS
    ui_macro: $ => choice(
      $.ui_kbd,
      $.ui_btn,
      $.ui_menu
    ),

    ui_kbd: $ => seq('kbd:[', /[^\]\r\n]+/, ']'),
    ui_btn: $ => seq('btn:[', /[^\]\r\n]+/, ']'),
    ui_menu: $ => seq('menu:', /[^\[\r\n]+/, '[', /[^\]\r\n]+/, ']'),

    // BLOCK COMMENTS
    block_comment: $ => seq(
      token(seq('////', /[ \t]*/, /\r?\n/)),  // opening delimiter (hidden)
      repeat1($.comment_line),
      token(seq('////', /[ \t]*/, optional(/\r?\n/)))  // closing delimiter (hidden)
    ),

    comment_line: $ => /[^\r\n]*\r?\n/,

    // INDEX TERMS
    index_term: $ => choice(
      $.index_term_macro,
      $.index_term2_macro,
      $.concealed_index_term
    ),

    index_term_macro: $ => seq(
      'indexterm:[',
      field('terms', $.index_text),
      ']'
    ),

    index_term2_macro: $ => seq(
      'indexterm2:[',
      field('terms', $.index_text),
      ']'
    ),

    concealed_index_term: $ => seq(
      '(((',
      field('terms', $.index_text),
      ')))'
    ),

    index_text: $ => choice(
      seq(
        field('primary', $.index_term_text),
        ',',
        field('secondary', $.index_term_text),
        ',',
        field('tertiary', $.index_term_text)
      ),
      seq(
        field('primary', $.index_term_text),
        ',',
        field('secondary', $.index_term_text)
      ),
      field('primary', $.index_term_text)
    ),

    index_term_text: $ => /[^,\]\)\r\n]+/,

    // TABLES
    table_block: $ => seq(
      optional($.metadata),
      field('open', $.table_open),
      optional(field('content', $.table_content)),
      field('close', $.table_close)
    ),

    table_open: $ => $.TABLE_FENCE_START,

    table_close: $ => $.TABLE_FENCE_END,

    table_content: $ => repeat1(
      choice(
        $.table_row,
        alias($._blank_line, $.content_line)
      )
    ),

    table_row: $ => prec(4, seq(
      repeat1($.table_cell),
      $._line_ending
    )),

    table_cell: $ => seq(
      '|',
      choice(
        // Header-style cell marker: leading '||'
        seq('|', field('content', $.cell_content)),
        // Specified cell: e.g., 'h|', '2+|', '.3+|'
        seq($.cell_spec, '|', field('content', $.cell_content)),
        // Regular cell: single '|' then content
        field('content', $.cell_content)
      ),
    ),

    cell_spec: $ => token(choice(
      // Combined span + format specifications
      seq(
        choice(
          seq(/\d+/, optional(seq('.', /\d+/))),  // column span with optional row span
          seq('.', /\d+/)  // row span only
        ),
        '+',
        choice('h', 'a', 'l', 'm', 'r', 's')  // format spec
      ),
      // Span-only specifications
      seq(
        choice(
          seq(/\d+/, optional(seq('.', /\d+/))),  // column span with optional row span
          seq('.', /\d+/)  // row span only
        ),
        '+'
      ),
      // Format-only specifications  
      choice('h', 'a', 'l', 'm', 'r', 's')
    )),

    cell_content: $ => $.cell_literal_text,

    cell_literal_text: $ => /[^|\r\n]+/,

    // LINE BREAKS
    line_break: $ => token(prec(2, seq(
      '+',
      /\r?\n/
    ))),

    // BASIC TOKENS
    _line_ending: $ => choice('\r\n', '\n'),
    _blank_line: $ => token(prec(-1, /[ \t]*\r?\n/)),
  }
});