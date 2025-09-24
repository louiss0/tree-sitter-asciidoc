/**
 * @file Ultra-minimal AsciiDoc parser for debugging paragraph parsing
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  extras: $ => [
    // No automatic whitespace handling
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
      $.paragraph,
      $._blank_line,
    ),

    // SECTIONS with hierarchical nesting
    section: $ => prec.right(seq(
      optional($.anchor),
      $.section_title,
      repeat(choice(
        $.section,
        $._non_section_content
      ))
    )),

    section_title: $ => choice(
      seq($._section_marker_1, $.title, $._line_ending),
      seq($._section_marker_2, $.title, $._line_ending),
      seq($._section_marker_3, $.title, $._line_ending),
      seq($._section_marker_4, $.title, $._line_ending),
      seq($._section_marker_5, $.title, $._line_ending),
      seq($._section_marker_6, $.title, $._line_ending),
    ),

    _non_section_content: $ => choice(
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
      $.paragraph,
      $._blank_line,
    ),

    title: $ => token.immediate(/[^\r\n]+/),

    _section_marker_1: $ => token(prec(10, seq('=', ' '))),
    _section_marker_2: $ => token(prec(9, seq('==', ' '))),
    _section_marker_3: $ => token(prec(8, seq('===', ' '))),
    _section_marker_4: $ => token(prec(7, seq('====', ' '))),
    _section_marker_5: $ => token(prec(6, seq('=====', ' '))),
    _section_marker_6: $ => token(prec(5, seq('======', ' '))),

    // ATTRIBUTE ENTRIES
    attribute_entry: $ => prec(10, seq(
      ':',
      field('name', $.name),
      ':',
      optional(seq(/[ \t]+/, field('value', $.value))),
      $._line_ending
    )),
    
    name: $ => token.immediate(/[a-zA-Z0-9_-]+/),
    value: $ => /[^\r\n]+/,

    // DELIMITED BLOCKS
    example_block: $ => seq(
      optional($.metadata),
      field('open', $.example_open),
      optional(field('content', $.block_content)),
      field('close', $.example_close)
    ),
    
    example_open: $ => seq(
      $.EXAMPLE_FENCE_START,
      $._line_ending
    ),
    
    example_close: $ => seq(
      $.EXAMPLE_FENCE_END,
      optional($._line_ending)
    ),
    
    EXAMPLE_FENCE_START: $ => token('===='),
    EXAMPLE_FENCE_END: $ => token('===='),
    
    // Listing blocks
    listing_block: $ => seq(
      optional($.metadata),
      field('open', $.listing_open),
      optional(field('content', $.block_content)),
      field('close', $.listing_close)
    ),
    
    listing_open: $ => seq(
      $.LISTING_FENCE_START,
      $._line_ending
    ),
    
    listing_close: $ => seq(
      $.LISTING_FENCE_END,
      optional($._line_ending)
    ),
    
    LISTING_FENCE_START: $ => token('----'),
    LISTING_FENCE_END: $ => token('----'),
    
    // Quote blocks
    quote_block: $ => seq(
      optional($.metadata),
      $.quote_open,
      $.block_content,
      $.quote_close
    ),
    
    quote_open: $ => seq(
      $.QUOTE_FENCE_START,
      $._line_ending
    ),
    
    quote_close: $ => seq(
      $.QUOTE_FENCE_END,
      optional($._line_ending)
    ),
    
    QUOTE_FENCE_START: $ => token('____'),
    QUOTE_FENCE_END: $ => token('____'),
    
    // Literal blocks  
    literal_block: $ => seq(
      optional($.metadata),
      field('open', $.literal_open),
      field('content', $.block_content),
      field('close', $.literal_close)
    ),
    
    literal_open: $ => seq(
      $.LITERAL_FENCE_START,
      $._line_ending
    ),
    
    literal_close: $ => seq(
      $.LITERAL_FENCE_END,
      optional($._line_ending)
    ),
    
    LITERAL_FENCE_START: $ => token('....'),
    LITERAL_FENCE_END: $ => token('....'),
    
    // Sidebar blocks
    sidebar_block: $ => seq(
      optional($.metadata),
      $.sidebar_open,
      $.block_content,
      $.sidebar_close
    ),
    
    sidebar_open: $ => seq(
      $.SIDEBAR_FENCE_START,
      $._line_ending
    ),
    
    sidebar_close: $ => seq(
      $.SIDEBAR_FENCE_END,
      optional($._line_ending)
    ),
    
    SIDEBAR_FENCE_START: $ => token('****'),
    SIDEBAR_FENCE_END: $ => token('****'),
    
    // Passthrough blocks
    passthrough_block: $ => seq(
      optional($.metadata),
      $.passthrough_open,
      $.block_content,
      $.passthrough_close
    ),
    
    passthrough_open: $ => seq(
      $.PASSTHROUGH_FENCE_START,
      $._line_ending
    ),
    
    passthrough_close: $ => seq(
      $.PASSTHROUGH_FENCE_END,
      optional($._line_ending)
    ),
    
    PASSTHROUGH_FENCE_START: $ => token('++++'),
    PASSTHROUGH_FENCE_END: $ => token('++++'),
    
    // Open blocks
    open_block: $ => seq(
      optional($.metadata),
      field('open', $.openblock_open),
      field('content', $.block_content),
      field('close', $.openblock_close)
    ),
    
    openblock_open: $ => seq(
      $.OPENBLOCK_FENCE_START,
      $._line_ending
    ),
    
    openblock_close: $ => seq(
      $.OPENBLOCK_FENCE_END,
      optional($._line_ending)
    ),
    
    OPENBLOCK_FENCE_START: $ => token('--'),
    OPENBLOCK_FENCE_END: $ => token('--'),
    
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
    
    block_attributes: $ => seq(
      '[',
      /[^\]\r\n]+/,  // attribute content
      ']',
      $._line_ending
    ),
    
    id_and_roles: $ => seq(
      '[',
      /#[^\]\r\n]+/,  // content starting with # for ID
      ']',
      $._line_ending
    ),
    
    block_title: $ => seq(
      '.',
      /[^\r\n]+/,  // title text
      $._line_ending
    ),
    
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
    
    block_content: $ => repeat1($.content_line),
    content_line: $ => seq(
      /[^\r\n]*/,
      $._line_ending
    ),

    // LISTS
    unordered_list: $ => prec.right(seq(
      $.unordered_list_item,
      repeat($.unordered_list_item)
    )),
    
    unordered_list_item: $ => seq(
      $._unordered_list_marker,
      $.text_with_inlines,
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
      $.text_with_inlines,
      $._line_ending,
      repeat($.list_item_continuation)
    ),
    
    _ordered_list_marker: $ => token(prec(5, /[ \t]*[0-9]+\.[ \t]+/)),

    // DESCRIPTION LISTS
    description_list: $ => prec.right(seq(
      $.description_item,
      repeat($.description_item)
    )),
    
    description_item: $ => seq(
      $._description_marker,
      $.description_content,
      $._line_ending
    ),
    
    _description_marker: $ => token(prec(5, /[^\s\r\n:]+::[ \t]+/)),
    description_content: $ => $.text_with_inlines,

    // CALLOUT LISTS
    callout_list: $ => prec.right(seq(
      $.callout_item,
      repeat($.callout_item)
    )),
    
    callout_item: $ => seq(
      $.CALLOUT_MARKER,
      $.text_with_inlines,
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
    paragraph: $ => seq(
      optional($.metadata),
      choice(
        $.paragraph_admonition,
        field('content', $.text_with_inlines)
      ),
      optional($._line_ending)
    ),

    // PARAGRAPH ADMONITIONS
    paragraph_admonition: $ => seq(
      field('label', $.admonition_label),
      ':',
      /[ \t]+/,
      field('content', $.text_with_inlines)
    ),
    
    admonition_label: $ => choice('NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'),

    text_with_inlines: $ => prec.left(seq(
      $._text_element,
      repeat(seq(/[ \t\f]+/, $._text_element))
    )),
    
    _text_element: $ => choice(
      $.text_segment,
      $.text_colon,
      $.text_angle_bracket,
      $.text_brace,
      $.text_hash,
      $.text_bracket,
      $.text_paren,
      prec(1, $.inline_element)
    ),
    
    text_segment: $ => token(/[^\s\r\n:*_\`^~\[\]<>+{}#()]+/),
    
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
      field('content', $.strong_text),
      field('close', $.strong_close)
    ),

    strong_open: $ => '*',
    strong_close: $ => '*',
    strong_text: $ => token.immediate(prec(1, /[^*\r\n]+/)),

    // Emphasis formatting (_italic_)
    emphasis: $ => choice(
      $.emphasis_constrained
    ),

    emphasis_constrained: $ => seq(
      field('open', $.emphasis_open),
      field('content', $.emphasis_text),
      field('close', $.emphasis_close)
    ),

    emphasis_open: $ => '_',
    emphasis_close: $ => '_',
    emphasis_text: $ => token.immediate(prec(1, /[^_\r\n]+/)),

    // Monospace formatting (`code`)
    monospace: $ => choice(
      $.monospace_constrained
    ),

    monospace_constrained: $ => seq(
      field('open', $.monospace_open),
      field('content', $.monospace_text),
      field('close', $.monospace_close)
    ),

    monospace_open: $ => '`',
    monospace_close: $ => '`',
    monospace_text: $ => token.immediate(prec(1, /[^`\r\n]+/)),

    // Superscript (^super^)
    superscript: $ => seq(
      field('open', $.superscript_open),
      field('content', $.superscript_text),
      field('close', $.superscript_close)
    ),

    superscript_open: $ => '^',
    superscript_close: $ => '^',
    superscript_text: $ => token.immediate(prec(1, /[^\^\r\n]+/)),

    // Subscript (~sub~)
    subscript: $ => seq(
      field('open', $.subscript_open),
      field('content', $.subscript_text),
      field('close', $.subscript_close)
    ),

    subscript_open: $ => '~',
    subscript_close: $ => '~',
    subscript_text: $ => token.immediate(prec(1, /[^~\r\n]+/)),

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
    attribute_reference: $ => prec(2, seq(
      '{',
      /[^}\r\n]+/,
      '}'
    )),

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
      seq('stem:[', /[^\]\r\n]+/, ']'),
      seq('latexmath:[', /[^\]\r\n]+/, ']'),
      seq('asciimath:[', /[^\]\r\n]+/, ']')
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
      $.comment_open,
      repeat($.comment_line),
      $.comment_close
    ),

    comment_open: $ => token(prec(2, seq('////', /[ \t]*/, /\r?\n/))),
    comment_close: $ => token(prec(2, seq('////', /[ \t]*/, optional(/\r?\n/)))),
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

    // LINE BREAKS
    line_break: $ => seq(
      '+',
      $._line_ending
    ),

    // BASIC TOKENS
    _line_ending: $ => choice('\r\n', '\n'),
    _blank_line: $ => token(prec(-1, /[ \t]*\r?\n/)),
  }
});