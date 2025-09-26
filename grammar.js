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
    $.DELIMITED_BLOCK_CONTENT_LINE
  ],

  extras: $ => [
    /[ \t]/  // Allow spaces and tabs but not newlines
  ],

  conflicts: $ => [
    [$.paragraph, $.unordered_list],
    [$.paragraph, $.ordered_list],
    [$.paragraph, $.description_list],
    [$.attribute_entry, $.description_list],
    [$.conditional_block, $.description_list],
    [$.section, $.paragraph]
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
      $.quote_block,
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

    // SECTIONS - simple nested approach
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
        $.quote_block,
        $.literal_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.conditional_block,
        $.include_directive,
        $.block_comment,
        $.table_block,
        $.section,
        $._blank_line
      ))
    )),
    
    section_title: $ => seq(
      choice(
        $._section_marker_1,
        $._section_marker_2,
        $._section_marker_3,
        $._section_marker_4,
        $._section_marker_5,
        $._section_marker_6
      ),
      $.title,
      $._line_ending
    ),


    title: $ => token.immediate(/[^\r\n]+/),

    _section_marker_1: $ => token(prec(10, seq('=', /[ \t]+/))),
    _section_marker_2: $ => token(prec(9, seq('==', /[ \t]+/))),
    _section_marker_3: $ => token(prec(8, seq('===', /[ \t]+/))),
    _section_marker_4: $ => token(prec(7, seq('====', /[ \t]+/))),
    _section_marker_5: $ => token(prec(6, seq('=====', /[ \t]+/))),
    _section_marker_6: $ => token(prec(5, seq('======', /[ \t]+/))),

    // ATTRIBUTE ENTRIES  
    attribute_entry: $ => choice(
      prec(3, seq(
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
      prec(3, seq(
        field('name', alias(
          choice(
            token(seq(':!', /([a-zA-Z0-9_-]+)/, ':')),
            token(seq(':', /([a-zA-Z0-9_-]+)/, '!:'))
          ),
          $.name
        )),
        optional(seq(/[ \t]+/)), // Allow trailing spaces
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
    
    // Quote blocks
    quote_block: $ => seq(
      optional($.metadata),
      $.quote_open,
      $.block_content,
      $.quote_close
    ),
    
    quote_open: $ => $.QUOTE_FENCE_START,
    
    quote_close: $ => $.QUOTE_FENCE_END,
    
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
    
    // CONDITIONAL BLOCKS
    conditional_block: $ => choice(
      $.ifdef_block,
      $.ifndef_block,
      $.ifeval_block
    ),
    
    ifdef_block: $ => seq(
      field('open', $.ifdef_open),
      repeat($._element),
      field('close', $.endif_directive)
    ),
    
    ifndef_block: $ => seq(
      field('open', $.ifndef_open),
      repeat($._element),
      field('close', $.endif_directive)
    ),
    
    ifeval_block: $ => seq(
      field('open', $.ifeval_open),
      repeat($._element),
      field('close', $.endif_directive)
    ),
    
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
      /[^\]\r\n]+/,  // expression
      ']',
      $._line_ending
    ),
    
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
      /[^\]\r\n]+/,  // attribute content
      ']',
      $._line_ending
    )),
    
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
    include_directive: $ => seq(
      'include::',
      field('path', $.include_path),
      '[',
      field('options', $.include_options),
      ']',
      $._line_ending
    ),
    
    include_path: $ => /[^\[\r\n]+/,
    include_options: $ => /[^\]\r\n]*/,
    
    block_content: $ => repeat1(choice(
      $.DELIMITED_BLOCK_CONTENT_LINE,
      $._blank_line
    )),

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
    
    _unordered_list_marker: $ => token(prec(5, /[ \t]*[*-]+[ \t]+/)),
    
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
    
    _ordered_list_marker: $ => token(prec(5, /[ \t]*[0-9]+\.[ \t]+/)),

    // DESCRIPTION LISTS
    description_list: $ => prec.right(10, seq(
      $.description_item,
      repeat($.description_item)
    )),
    
    description_item: $ => prec(5, seq(
      field('term', $.description_term),
      token.immediate('::'),
      /[ \t]+/,
      field('content', $.description_content),
      $._line_ending
    )),
    
    description_term: $ => /[^\s\r\n:]+/,
    description_content: $ => $.text_with_inlines,

    // CALLOUT LISTS
    callout_list: $ => prec.right(seq(
      $.callout_item,
      repeat($.callout_item)
    )),
    
    callout_item: $ => seq(
      $.CALLOUT_MARKER,
      field('content', $.text_with_inlines),
      $._line_ending
    ),
    
    CALLOUT_MARKER: $ => token(prec(5, /<[0-9]+>[ \t]+/)),

    // LIST CONTINUATIONS
    list_item_continuation: $ => seq(
      $.LIST_CONTINUATION,
      choice(
        $.open_block,
        $.example_block,
        $.listing_block,
        $.quote_block,
        $.literal_block,
        $.sidebar_block,
        $.passthrough_block
      )
    ),

    LIST_CONTINUATION: $ => token(seq('+', /[ \t]*/, /\r?\n/)),

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
      field('label', $.admonition_label),
      field('content', $.text_with_inlines)
    ),
    
    admonition_label: $ => token(prec(1, choice(
      seq('NOTE', ':', /[ \t]+/),
      seq('TIP', ':', /[ \t]+/),
      seq('IMPORTANT', ':', /[ \t]+/),
      seq('WARNING', ':', /[ \t]+/),
      seq('CAUTION', ':', /[ \t]+/)
    ))),

    text_with_inlines: $ => prec.dynamic(30, prec.right(seq(
      $._text_element,
      repeat(choice(
        seq(/[ \t\f]+/, $._text_element),    // Spaced elements
        prec.right(1, $._text_element)       // Adjacent elements with right associativity
      ))
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
      $.text_tilde
    ),
    
    text_segment: $ => token(/[^\s\r\n:*_\`^~\[\]<>{}#()]+/),
    
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
      $.internal_xref,
      $.external_xref,
      $.footnote_inline,
      $.footnote_ref,
      $.footnoteref,
      $.auto_link,
      $.link,
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
    strong: $ => choice(
      $.strong_constrained
    ),

    strong_constrained: $ => seq(
      field('open', $.strong_open),
      optional(field('content', $.strong_text)),
      field('close', $.strong_close)
    ),

    strong_open: $ => '*',
    strong_close: $ => '*',
    strong_text: $ => token.immediate(prec(1, /(?:\\.|[^*\r\n])+/)),

    // Emphasis formatting (_italic_)
    emphasis: $ => choice(
      $.emphasis_constrained
    ),

    emphasis_constrained: $ => seq(
      field('open', $.emphasis_open),
      optional(field('content', $.emphasis_text)),
      field('close', $.emphasis_close)
    ),

    emphasis_open: $ => '_',
    emphasis_close: $ => '_',
    emphasis_text: $ => token.immediate(prec(1, /(?:\\.|[^_\r\n])+/)),

    // Monospace formatting (`code`)
    monospace: $ => choice(
      $.monospace_constrained
    ),

    monospace_constrained: $ => seq(
      field('open', $.monospace_open),
      optional(field('content', $.monospace_text)),
      field('close', $.monospace_close)
    ),

    monospace_open: $ => '`',
    monospace_close: $ => '`',
    monospace_text: $ => token.immediate(prec(1, /(?:\\.|[^`\r\n])+/)),

    // Superscript (^super^)
    superscript: $ => prec.dynamic(100, seq(
      field('open', $.superscript_open),
      field('content', $.superscript_text),
      field('close', $.superscript_close)
    )),
    
    superscript_open: $ => '^',
    superscript_close: $ => '^',
    superscript_text: $ => token.immediate(/(?:\\.|[^\^\r\n])+/),

    // Subscript (~sub~)
    subscript: $ => prec.dynamic(100, seq(
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

    // AUTO LINKS & LINKS
    auto_link: $ => /https?:\/\/[^\s\[\]<>"']+|ftp:\/\/[^\s\[\]<>"']+/,
    
    link: $ => prec(1, seq(
      field('url', $.auto_link),
      '[',
      field('text', $.bracketed_text),
      ']'
    )),
    
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
    role_span: $ => prec(1, seq(
      '[',
      /[^\]\r\n]+/,  // role name
      ']',
      '#',
      /[^#\r\n]+/,  // content
      '#'
    )),

    // MATH MACROS
    math_macro: $ => choice(
      token(seq('stem:[', /[^\]\r\n]+/, ']')),
      token(seq('latexmath:[', /[^\]\r\n]+/, ']')),
      token(seq('asciimath:[', /[^\]\r\n]+/, ']'))
    ),

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
      field('close', $.table_close),
    ),

    table_open: $ => seq(
      alias('|===', $.TABLE_FENCE_START),
      $._line_ending,
    ),

    table_close: $ => seq(
      alias('|===', $.TABLE_FENCE_END),
      $._line_ending,
    ),

    table_content: $ => repeat1(
      choice(
        $.table_row,
        alias($._blank_line, $.content_line),
      )
    ),

    table_row: $ => prec(4, seq(
      repeat1($.table_cell),
      $._line_ending
    )),

    table_cell: $ => seq(
      '|',
      optional(seq($.cell_spec, '|')),
      field('content', $.cell_content),
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

    cell_literal_text: $ => /[^|\r\n]*/,

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