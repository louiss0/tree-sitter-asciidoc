/**
 * @file Ultra-minimal AsciiDoc parser for debugging paragraph parsing
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  word: ($) => $._word,

  externals: ($) => [
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
    $.BLOCK_COMMENT_START,
    $.BLOCK_COMMENT_END,
    $.LIST_CONTINUATION,
    $.AUTOLINK_BOUNDARY,
    $.ATTRIBUTE_LIST_START,
    $.PLAIN_COLON,
    $.INLINE_MACRO_MARKER,
    $.BLOCK_MACRO_MARKER,
    $.DELIMITED_BLOCK_CONTENT_LINE,
  ],

  extras: ($) => [
    /[ \t]+/, // Allow spaces and tabs but not newlines
  ],

  conflicts: ($) => [
    [$.unordered_list_item],
    [$.ordered_list_item],
    [$.description_item],
    [$.callout_item],
    [$.inline_element, $.explicit_link],
    [$.attribute_content, $.role_list],
  ],

  rules: {
    source_file: ($) => repeat(choice($._blank_line, $._block_element)),

    _block_element: ($) =>
      choice(
        $.section,
        $.unordered_list,
        $.ordered_list,
        $.description_list,
        $.callout_list,
        $.attribute_entry,
        $.block_admonition,
        $.example_block,
        $.listing_block,
        $.asciidoc_blockquote,
        $.literal_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.conditional_block,
        $.block_macro,
        $.block_comment,
        $.table_block,
        $.paragraph,
      ),

    // SECTIONS - level-based hierarchy for proper sibling relationships
    section: ($) =>
      choice(
        $.section_level_1,
        $.section_level_2,
        $.section_level_3,
        $.section_level_4,
        $.section_level_5,
        $.section_level_6,
      ),

    section_level_1: ($) =>
      prec.right(
        seq(
          optional($.anchor),
          field("marker", $.section_marker_1),
          field("title", $.title),
          $._line_ending,
          field(
            "content",
            repeat(
              choice(
                $.attribute_entry,
                $.paragraph,
                $.unordered_list,
                $.ordered_list,
                $.description_list,
                $.callout_list,
                $.block_admonition,
                $.example_block,
                $.listing_block,
                $.asciidoc_blockquote,
                $.literal_block,
                $.sidebar_block,
                $.passthrough_block,
                $.open_block,
                $.conditional_block,
                $.block_macro,
                $.block_comment,
                $.table_block,
                $.section_level_2, // Only nested sections can be level_2+
                $._blank_line,
              ),
            ),
          ),
        ),
      ),

    section_level_2: ($) =>
      prec.right(
        seq(
          optional($.anchor),
          field("marker", $.section_marker_2),
          field("title", $.title),
          $._line_ending,
          field(
            "content",
            repeat(
              choice(
                $.attribute_entry,
                $.paragraph,
                $.unordered_list,
                $.ordered_list,
                $.description_list,
                $.callout_list,
                $.block_admonition,
                $.example_block,
                $.listing_block,
                $.asciidoc_blockquote,
                $.literal_block,
                $.sidebar_block,
                $.passthrough_block,
                $.open_block,
                $.conditional_block,
                $.block_macro,
                $.block_comment,
                $.table_block,
                $.section_level_3,
                $._blank_line,
              ),
            ),
          ),
        ),
      ),

    section_level_3: ($) =>
      prec.right(
        seq(
          optional($.anchor),
          field("marker", $.section_marker_3),
          field("title", $.title),
          $._line_ending,
          field(
            "content",
            repeat(
              choice(
                $.attribute_entry,
                $.paragraph,
                $.unordered_list,
                $.ordered_list,
                $.description_list,
                $.callout_list,
                $.block_admonition,
                $.example_block,
                $.listing_block,
                $.asciidoc_blockquote,
                $.literal_block,
                $.sidebar_block,
                $.passthrough_block,
                $.open_block,
                $.conditional_block,
                $.block_macro,
                $.block_comment,
                $.table_block,
                $.section_level_4,
                $._blank_line,
              ),
            ),
          ),
        ),
      ),

    section_level_4: ($) =>
      prec.right(
        seq(
          optional($.anchor),
          field("marker", $.section_marker_4),
          field("title", $.title),
          $._line_ending,
          field(
            "content",
            repeat(
              choice(
                $.attribute_entry,
                $.paragraph,
                $.unordered_list,
                $.ordered_list,
                $.description_list,
                $.callout_list,
                $.block_admonition,
                $.example_block,
                $.listing_block,
                $.asciidoc_blockquote,
                $.literal_block,
                $.sidebar_block,
                $.passthrough_block,
                $.open_block,
                $.conditional_block,
                $.block_macro,
                $.block_comment,
                $.table_block,
                $.section_level_5,
                $._blank_line,
              ),
            ),
          ),
        ),
      ),

    section_level_5: ($) =>
      prec.right(
        seq(
          optional($.anchor),
          field("marker", $.section_marker_5),
          field("title", $.title),
          $._line_ending,
          field(
            "content",
            repeat(
              choice(
                $.attribute_entry,
                $.paragraph,
                $.unordered_list,
                $.ordered_list,
                $.description_list,
                $.callout_list,
                $.block_admonition,
                $.example_block,
                $.listing_block,
                $.asciidoc_blockquote,
                $.literal_block,
                $.sidebar_block,
                $.passthrough_block,
                $.open_block,
                $.conditional_block,
                $.block_macro,
                $.block_comment,
                $.table_block,
                $.section_level_6,
                $._blank_line,
              ),
            ),
          ),
        ),
      ),

    section_level_6: ($) =>
      prec.right(
        seq(
          optional($.anchor),
          field("marker", $.section_marker_6),
          field("title", $.title),
          $._line_ending,
          field(
            "content",
            repeat(
              choice(
                $.attribute_entry,
                $.paragraph,
                $.unordered_list,
                $.ordered_list,
                $.description_list,
                $.callout_list,
                $.block_admonition,
                $.example_block,
                $.listing_block,
                $.asciidoc_blockquote,
                $.literal_block,
                $.sidebar_block,
                $.passthrough_block,
                $.open_block,
                $.conditional_block,
                $.block_macro,
                $.block_comment,
                $.table_block,
                $._blank_line,
              ),
            ),
          ),
        ),
      ),

    title: ($) => token.immediate(/[^\r\n]+/),

    section_marker_1: ($) => token(prec(50, seq("=", /[ \t]+/))),
    section_marker_2: ($) => token(prec(45, seq("==", /[ \t]+/))),
    section_marker_3: ($) => token(prec(40, seq("===", /[ \t]+/))),
    section_marker_4: ($) => token(prec(35, seq("====", /[ \t]+/))),
    section_marker_5: ($) => token(prec(30, seq("=====", /[ \t]+/))),
    section_marker_6: ($) => token(prec(25, seq("======", /[ \t]+/))),

    // ATTRIBUTE ENTRIES - Support both :name: and :name: value forms
    // Using token to make it atomic and prevent partial matches that cause segfaults
    attribute_entry: ($) =>
      choice(
        // Standard form: :name: value or :name:
        seq(
          field(
            "name",
            alias(
              seq(
                $.plain_colon,
                alias($._attribute_name_text, $.attribute_identifier),
                $.plain_colon,
              ),
              $.attribute_name,
            ),
          ),
          field("value", optional(seq(token.immediate(/[ \t]+/), $.attribute_value))),
          $._line_ending,
        ),
        // Unset form: :!name: or :name!:
        seq(
          field(
            "name",
            alias(
              choice(
                seq(
                  $.plain_colon,
                  "!",
                  alias($._attribute_name_text, $.attribute_identifier),
                  $.plain_colon,
                ),
                seq(
                  $.plain_colon,
                  alias($._attribute_name_text, $.attribute_identifier),
                  "!",
                  $.plain_colon,
                ),
              ),
              $.attribute_name,
            ),
          ),
          optional(token.immediate(/[ \t]+/)),
          $._line_ending,
        ),
      ),

    attribute_value: ($) => /[^\r\n]+/,

    _attribute_name_text: ($) => token(prec(25, /[a-zA-Z0-9_-]+/)),

    // DELIMITED BLOCKS
    example_block: ($) =>
      seq(
        optional(field("metadata", $.metadata)),
        field("open", $.example_open),
        optional(field("content", $.block_content)),
        field("close", $.example_close),
      ),

    example_open: ($) => $.EXAMPLE_FENCE_START,

    example_close: ($) => $.EXAMPLE_FENCE_END,

    // Listing blocks
    listing_block: ($) =>
      seq(
        optional(field("metadata", $.metadata)),
        field("open", $.listing_open),
        optional(field("content", $.block_content)),
        field("close", $.listing_close),
      ),

    listing_open: ($) => $.LISTING_FENCE_START,

    listing_close: ($) => $.LISTING_FENCE_END,

    // AsciiDoc quote blocks (fenced with ____)
    asciidoc_blockquote: ($) =>
      seq(
        optional(field("metadata", $.metadata)),
        field("open", $.asciidoc_blockquote_open),
        optional(field("content", $.block_content)),
        field("close", $.asciidoc_blockquote_close),
      ),

    asciidoc_blockquote_open: ($) => $.QUOTE_FENCE_START,

    asciidoc_blockquote_close: ($) => $.QUOTE_FENCE_END,

    // Literal blocks
    literal_block: ($) =>
      seq(
        optional(field("metadata", $.metadata)),
        field("open", $.literal_open),
        optional(field("content", $.block_content)),
        field("close", $.literal_close),
      ),

    literal_open: ($) => $.LITERAL_FENCE_START,

    literal_close: ($) => $.LITERAL_FENCE_END,

    // Sidebar blocks
    sidebar_block: ($) =>
      seq(
        optional(field("metadata", $.metadata)),
        field("open", $.sidebar_open),
        optional(field("content", $.block_content)),
        field("close", $.sidebar_close),
      ),

    sidebar_open: ($) => $.SIDEBAR_FENCE_START,

    sidebar_close: ($) => $.SIDEBAR_FENCE_END,

    // Passthrough blocks
    passthrough_block: ($) =>
      seq(
        optional(field("metadata", $.metadata)),
        field("open", $.passthrough_open),
        optional(field("content", $.block_content)),
        field("close", $.passthrough_close),
      ),

    passthrough_open: ($) => $.PASSTHROUGH_FENCE_START,

    passthrough_close: ($) => $.PASSTHROUGH_FENCE_END,

    // Open blocks
    open_block: ($) =>
      seq(
        optional(field("metadata", $.metadata)),
        field("open", $.openblock_open),
        optional(field("content", $.block_content)),
        field("close", $.openblock_close),
      ),

    openblock_open: ($) => $.OPENBLOCK_FENCE_START,

    openblock_close: ($) => $.OPENBLOCK_FENCE_END,

    // BLOCK ADMONITIONS - Handle [ADMONITION] followed by supported delimited blocks
    block_admonition: ($) =>
      prec(
        20,
        seq(
          field("type", alias($.block_attributes, $.admonition_attribute)),
          repeat($._blank_line),
          field(
            "block",
            choice(
              $.example_block,
              $.listing_block,
              $.asciidoc_blockquote,
              $.literal_block,
              $.sidebar_block,
              $.passthrough_block,
              $.open_block,
            ),
          ),
        ),
      ),

    // CONDITIONAL BLOCKS - with higher precedence to resolve conflicts with description lists
    conditional_block: ($) => prec(10, choice($.ifdef_block, $.ifndef_block, $.ifeval_block)),

    ifdef_block: ($) =>
      prec.right(
        seq(
          field("directive", $.ifdef_open),
          field("content", repeat(choice($._block_element, $._blank_line))),
          field("end", optional($.endif_directive)),
        ),
      ),

    ifndef_block: ($) =>
      prec.right(
        seq(
          field("directive", $.ifndef_open),
          field("content", repeat(choice($._block_element, $._blank_line))),
          field("end", optional($.endif_directive)),
        ),
      ),

    ifeval_block: ($) =>
      prec.right(
        seq(
          field("directive", $.ifeval_open),
          field("content", repeat(choice($._block_element, $._blank_line))),
          field("end", optional($.endif_directive)),
        ),
      ),

    ifdef_open: ($) => token(prec(75, /ifdef::[^\[\r\n]*\[[^\]\r\n]*\][ \t]*\r?\n/)),

    ifndef_open: ($) => token(prec(75, /ifndef::[^\[\r\n]*\[[^\]\r\n]*\][ \t]*\r?\n/)),

    ifeval_open: ($) => token(prec(75, /ifeval::\[[^\]\r\n]+\][ \t]*\r?\n/)),

    // EXPRESSIONS - for ifeval conditions (fixed to eliminate recursion)
    // Use prec.left/right with explicit precedence levels to avoid recursion
    expression: ($) => $.logical_expression,

    // Precedence level 1: Logical operators (&&, ||, and, or) - lowest precedence, left-associative
    logical_expression: ($) =>
      choice(
        prec.left(
          1,
          seq($.logical_expression, choice("&&", "||", "and", "or"), $.comparison_expression),
        ),
        $.comparison_expression,
      ),

    // Precedence level 2: Comparison operators (==, !=, <, >, <=, >=), left-associative
    comparison_expression: ($) =>
      choice(
        prec.left(
          2,
          seq(
            $.comparison_expression,
            choice("==", "!=", "<", ">", "<=", ">="),
            $.additive_expression,
          ),
        ),
        $.additive_expression,
      ),

    // Precedence level 3: Additive operators (+, -), left-associative
    additive_expression: ($) =>
      choice(
        prec.left(3, seq($.additive_expression, choice("+", "-"), $.multiplicative_expression)),
        $.multiplicative_expression,
      ),

    // Precedence level 4: Multiplicative operators (*, /, %), left-associative
    multiplicative_expression: ($) =>
      choice(
        prec.left(
          4,
          seq($.multiplicative_expression, choice("*", "/", "%"), $.unary_expression),
        ),
        $.unary_expression,
      ),

    // Precedence level 5: Unary operators (!, -), right-associative
    unary_expression: ($) =>
      choice(prec.right(5, seq(choice("!", "-"), $.unary_expression)), $.primary_expression),

    // Highest precedence: Primary and grouped expressions
    primary_expression: ($) =>
      choice(
        $.grouped_expression,
        $.string_literal,
        $.numeric_literal,
        $.boolean_literal,
        $.attribute_reference,
      ),

    grouped_expression: ($) => seq("(", $.expression, ")"),

    string_literal: ($) => choice(seq('"', /[^"\r\n]*/, '"'), seq("'", /[^'\r\n]*/, "'")),

    numeric_literal: ($) =>
      token(
        choice(
          /\d+\.\d+/, // float
          /\d+/, // integer
        ),
      ),

    boolean_literal: ($) => choice("true", "false"),

    endif_directive: ($) => token(prec(75, /endif::\[[^\]\r\n]*\][ \t]*\r?\n?/)),

    // METADATA
    metadata: ($) => prec.right(field("entries", repeat1($._metadata_entry))),

    _metadata_entry: ($) =>
      choice(
        field("attributes", seq($.block_attributes, optional($._line_ending))),
        field("idRoles", $.id_and_roles),
        field("title", $.block_title),
      ),

    table_title: ($) => seq(field("text", $.table_title_text), $._line_ending),

    table_title_text: ($) => token(prec(15, /\.[\w\d_]+(?:[ \t]+[\w\d_]+)*/)),

    // Treat block attributes as a single external token to avoid misparsing inline role spans.
    block_attributes: ($) => $.ATTRIBUTE_LIST_START,

    attribute_content: ($) => /[^\]\r\n]+/,

    id_and_roles: ($) =>
      seq(
        "[",
        /#[^\]\r\n]+/, // content starting with # for ID
        "]",
        $._line_ending,
      ),

    block_title: ($) =>
      prec(
        10,
        seq(
          ".",
          /[^\r\n]+/, // title text
          $._line_ending,
        ),
      ),

    block_content: ($) => repeat1(choice($.content_line, $._blank_line)),

    content_line: ($) => $.DELIMITED_BLOCK_CONTENT_LINE,

    // LISTS
    unordered_list: ($) => prec.right(field("items", repeat1($.unordered_list_item))),

    unordered_list_item: ($) =>
      seq(
        field("marker", alias($._unordered_list_marker, $.unordered_list_marker)),
        field("content", $._inline_text),
        repeat($.list_item_continuation),
      ),

    _unordered_list_marker: ($) => token(prec(10, /[ \t]*[*-][ \t]+/)),

    ordered_list: ($) => prec.right(field("items", repeat1($.ordered_list_item))),

    ordered_list_item: ($) =>
      seq(
        field("marker", alias($._ordered_list_marker, $.ordered_list_marker)),
        field("content", $._inline_text),
        repeat($.list_item_continuation),
      ),

    _ordered_list_marker: ($) => token(prec(15, seq(/[0-9]+/, ".", /[ \t]+/))),

    // DESCRIPTION LISTS
    description_list: ($) => prec.right(2, field("items", repeat1($.description_item))),

    description_item: ($) =>
      seq(
        field("term", alias($._description_marker, $.description_term)),
        field("details", $.description_content),
        repeat($.list_item_continuation),
      ),

    _description_marker: ($) => token(prec(20, /[^\s\r\n:]+::[ \t]+/)),
    description_content: ($) => $._inline_text,

    // CALLOUT LISTS
    callout_list: ($) => prec.right(field("items", repeat1($.callout_item))),

    callout_item: ($) =>
      seq(
        field("marker", alias($.CALLOUT_MARKER, $.callout_marker)),
        field("content", $._inline_text),
        repeat($.list_item_continuation),
      ),

    CALLOUT_MARKER: ($) => token(prec(5, /<[0-9]+>[ \t]+/)),

    // LIST CONTINUATIONS
    list_item_continuation: ($) =>
      seq(
        $.LIST_CONTINUATION,
        field(
          "block",
          choice(
            $.paragraph,
            $.open_block,
            $.example_block,
            $.listing_block,
            $.asciidoc_blockquote,
            $.literal_block,
            $.sidebar_block,
            $.passthrough_block,
            $.block_admonition,
            $.table_block,
            $.block_comment,
            $.conditional_block,
            // Allow nested lists in continuations
            $.unordered_list,
            $.ordered_list,
            $.description_list,
          ),
        ),
      ),

    // LIST_CONTINUATION handled by external scanner
    // LIST_CONTINUATION: $ => token(seq('+', /[ \t]*/, /\r?\n/)),

    // PARAGRAPHS
    paragraph: ($) =>
      prec.right(
        1,
        seq(
          optional(field("metadata", $.metadata)),
          choice($.paragraph_admonition, field("content", $._inline_text)),
        ),
      ),

    admonition_type: ($) => choice("NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"),

    paragraph_admonition: ($) =>
      seq(field("label", $.admonition_label), field("content", $._inline_text)),

    // Legacy token-based admonition_label for backward compatibility
    admonition_label: ($) =>
      token(
        prec(
          1,
          choice(
            seq("NOTE", ":", /[ \t]+/),
            seq("TIP", ":", /[ \t]+/),
            seq("IMPORTANT", ":", /[ \t]+/),
            seq("WARNING", ":", /[ \t]+/),
            seq("CAUTION", ":", /[ \t]+/),
          ),
        ),
      ),

    error_recovery: ($) => prec(-1000, /./),

    // INLINE FORMATTING
    inline_element: ($) =>
      choice(
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
        $.index_term,
        $.ui_menu,
        $.hard_break,
      ),

    _inline_text: ($) =>
      prec.right(
        choice(
          $.inline_seq_nonempty,
          seq($.inline_seq_nonempty, $._line_ending, $._inline_text),
          seq($.inline_seq_nonempty, $._line_ending),
        ),
      ),

    inline_seq_nonempty: ($) =>
      prec.right(seq($._inline_core_unit, repeat($._inline_core_unit))),

    _inline_core_unit: ($) =>
      choice($.inline_macro, $.inline_element, $.escaped_char, $.plain_colon, $.plain_text),

    plain_text: ($) => prec.left(-50, $._plain_text_segment),

    plain_colon: ($) => $.PLAIN_COLON,

    _plain_text_segment: ($) => token(prec(1, /[A-Za-z0-9_!$.,'"()+\-\/=^%?#<>]+/)),

    _word: ($) => token(prec(1, /[A-Za-z0-9_]+/)),

    escaped_char: ($) => token(seq("\\", /[^\r\n]/)),

    // Strong formatting (*bold* or **bold**)
    strong: ($) =>
      prec(
        51,
        choice(
          seq(
            field("open", alias(token(prec(2, "**")), $.strong_open)),
            field("content", $.strong_content),
            field("close", alias(token(prec(2, "**")), $.strong_close)),
          ),
          seq(
            field("open", alias(token("*"), $.strong_open)),
            field("content", $.strong_content),
            field("close", alias(token("*"), $.strong_close)),
          ),
        ),
      ),

    strong_content: ($) =>
      repeat1(
        choice(
          $.emphasis,
          $.monospace,
          $.superscript,
          $.subscript,
          token.immediate(/\\[*_`^~]/), // escaped formatting chars
          token.immediate(/[^*\r\n]+/), // other text
        ),
      ),

    // Emphasis formatting (_italic_ or __italic__)
    emphasis: ($) =>
      prec(
        50,
        choice(
          seq(
            field("open", alias(token(prec(2, "__")), $.emphasis_open)),
            field("content", $.emphasis_content),
            field("close", alias(token(prec(2, "__")), $.emphasis_close)),
          ),
          seq(
            field("open", alias(token("_"), $.emphasis_open)),
            field("content", $.emphasis_content),
            field("close", alias(token("_"), $.emphasis_close)),
          ),
        ),
      ),

    emphasis_content: ($) =>
      repeat1(
        choice(
          $.strong,
          $.monospace,
          $.superscript,
          $.subscript,
          token.immediate(/\\[*_`^~]/), // escaped formatting chars
          token.immediate(/[^_\r\n]+/), // other text
        ),
      ),

    // Monospace formatting (`code` and ``intraword``)
    monospace: ($) =>
      prec(
        50,
        choice(
          seq(
            field("open", alias(token(prec(2, /``/)), $.monospace_open)),
            field("content", $.monospace_content),
            field("close", alias(token(prec(2, /``/)), $.monospace_close)),
          ),
          seq(
            field("open", alias(token("`"), $.monospace_open)),
            field("content", $.monospace_content),
            field("close", alias(token("`"), $.monospace_close)),
          ),
        ),
      ),

    monospace_open: ($) => "`",
    monospace_close: ($) => "`",
    monospace_content: ($) => token.immediate(/(?:\\.|[^`\r\n])+/),

    // Superscript (^super^)
    superscript: ($) =>
      prec(
        100,
        seq(
          field("open", $.superscript_open),
          field("content", $.superscript_text),
          field("close", $.superscript_close),
        ),
      ),

    superscript_open: ($) => "^",
    superscript_close: ($) => "^",
    superscript_text: ($) => token.immediate(/(?:\\.|[^\^\r\n])+/),

    // Subscript (~sub~)
    subscript: ($) =>
      prec(
        100,
        seq(
          field("open", $.subscript_open),
          field("content", $.subscript_text),
          field("close", $.subscript_close),
        ),
      ),

    subscript_open: ($) => "~",
    subscript_close: ($) => "~",
    subscript_text: ($) => token.immediate(/(?:\\.|[^~\r\n])+/),

    // ANCHORS & CROSS-REFERENCES
    inline_anchor: ($) =>
      token(
        prec(
          10,
          choice(
            /\[\[[^\],\r\n]+\]\]/, // [[id]]
            /\[\[[^\],\r\n]+,[^\]\r\n]+\]\]/, // [[id,text]]
          ),
        ),
      ),

    // Bibliography entries [[[ref]]]
    bibliography_entry: ($) =>
      seq(
        "[[[",
        field("id", $.bibliography_id),
        optional(seq(",", field("description", $.bibliography_text))),
        "]]]",
      ),

    bibliography_id: ($) => /[^,\]\r\n]+/,
    bibliography_text: ($) => /[^\]\r\n]+/,

    // Block anchors (stand-alone) - must be atomic to prevent partial matches
    anchor: ($) =>
      token(
        prec(
          2,
          choice(
            /\[\[[^\],\r\n]+\]\][ \t]*\r?\n/, // [[id]]
            /\[\[[^\],\r\n]+,[^\]\r\n]+\]\][ \t]*\r?\n/, // [[id,text]]
          ),
        ),
      ),

    internal_xref: ($) =>
      token(
        prec(
          5,
          seq("<<", /[^>,\r\n]+/, optional(seq(",", /[^>\r\n]+/)), ">>", optional(/[.!?]/)),
        ),
      ),

    external_xref: ($) => token(seq("xref:", /[^\[\r\n]+/, "[", /[^\]\r\n]*/, "]")),

    footnote_inline: ($) => token(seq("footnote:[", /[^\]\r\n]+/, "]")),

    footnote_ref: ($) => token(seq("footnote:", /[^\[\r\n]+/, "[", /[^\]\r\n]*/, "]")),

    footnoteref: ($) => token(seq("footnoteref:", /[^\[\r\n]+/, "[", /[^\]\r\n]*/, "]")),

    // EXPLICIT LINKS - URL followed by [text] (uses auto_link, higher precedence)
    explicit_link: ($) =>
      prec.dynamic(
        2000,
        seq(
          field("url", $.auto_link),
          token("["),
          field("text", optional($.link_text)),
          token("]"),
        ),
      ),

    // LINK MACRO - link:URL[text]
    link_macro: ($) => prec(10, seq("link:", /[^\[\r\n]+/, "[", optional($.link_text), "]")),

    // AUTO LINKS - standalone URLs as simple tokens
    auto_link: ($) =>
      token(
        prec(
          5,
          choice(
            /https?:\/\/[^\s\[\]<>"']+/,
            /ftp:\/\/[^\s\[\]<>"']+/,
            /mailto:[^\s\[\]<>"']+/,
          ),
        ),
      ),

    link_text: ($) => /[^\]\r\n]+/,

    bracketed_text: ($) => /[^\]\r\n]+/,

    // IMAGES
    image: ($) =>
      choice(
        seq("image:", /[^\[\r\n]+/, "[", optional(/[^\]\r\n]+/), "]"),
        seq("image::", /[^\[\r\n]+/, "[", optional(/[^\]\r\n]+/), "]"),
      ),

    // PASSTHROUGH
    passthrough_triple_plus: ($) =>
      choice(
        seq(
          "+++",
          token.immediate(/[^+]+/), // content without + characters (simplified)
          "+++",
        ),
        seq("++", token.immediate(/[^+]+/), "++"),
      ),

    pass_macro: ($) =>
      choice(
        // With substitutions
        seq(
          token(prec(15, seq("pass:", /[a-zA-Z,]+/))),
          "[",
          /[^\]\r\n]*/, // content
          "]",
        ),
        // Without substitutions
        seq(
          "pass:[",
          /[^\]\r\n]*/, // content
          "]",
        ),
      ),

    // ATTRIBUTE REFERENCES
    attribute_reference: ($) => token(prec(10, seq("{", /[^}\r\n]+/, "}"))),

    // ROLE SPANS
    role_span: ($) =>
      prec(
        2,
        seq(
          "[",
          field("roles", $.role_list), // Support multiple roles and IDs
          "]",
          "#",
          field("content", $.role_content),
          "#",
        ),
      ),

    // Must start with . or # to be valid role/ID syntax
    role_list: ($) => /[.#][^\]\r\n]+/,

    role_content: ($) =>
      repeat1(
        choice(
          prec(100, $.strong),
          prec(100, $.emphasis),
          prec(100, $.monospace),
          prec(100, $.superscript),
          prec(100, $.subscript),
          prec(100, $.explicit_link),
          prec(100, $.attribute_reference),
          token.immediate(/[^#\r\n*_`^~\[\{]+/), // Plain text, avoiding formatting chars
          token.immediate(/[*_`^~\[\{]/), // Individual formatting chars when not part of patterns
        ),
      ),

    // INLINE MACROS
    inline_macro: ($) =>
      prec.right(
        seq(
          field("name", alias($._plain_text_segment, $.macro_name)),
          field("open", $.INLINE_MACRO_MARKER),
          field("body", optional($.macro_body)),
          "]",
        ),
      ),

    block_macro: ($) =>
      prec.right(
        seq(
          optional(field("metadata", $.metadata)),
          field("name", alias($._plain_text_segment, $.macro_name)),
          field("open", $.BLOCK_MACRO_MARKER),
          field("body", optional($.macro_body)),
          "]",
          optional($._line_ending),
        ),
      ),

    macro_body: ($) => token.immediate(/[^\]\r\n]+/),

    // UI MACROS
    ui_menu: ($) => seq("menu:", /[^\[\r\n]+/, "[", /[^\]\r\n]+/, "]"),

    // BLOCK COMMENTS
    block_comment: ($) =>
      seq(
        field("open", $.BLOCK_COMMENT_START),
        repeat(field("content", $.comment_line)),
        field("close", $.BLOCK_COMMENT_END),
      ),

    comment_line: ($) => token(prec(-10, /[^\r\n]*\r?\n/)),

    // INDEX TERMS - with fallback for malformed constructs
    index_term: ($) => choice($.index_term_macro, $.index_term2_macro, $.concealed_index_term),

    index_term_macro: ($) =>
      choice(
        seq(token(prec(100, "indexterm:[")), field("terms", $.index_text), "]"),
        // Fallback for malformed (missing bracket)
        seq("indexterm:", /[^\[\r\n]+/),
      ),

    index_term2_macro: ($) =>
      choice(
        seq(token(prec(100, "indexterm2:[")), field("terms", $.index_text), "]"),
        // Fallback for malformed
        seq("indexterm2:", /[^\[\r\n]+/),
      ),

    concealed_index_term: ($) =>
      choice(
        seq(token(prec(50, "(((")), field("terms", $.index_text), token(prec(50, ")))"))),
        // Fallback for incomplete concealed term
        seq("(((", /[^\)]+/),
      ),

    index_text: ($) =>
      choice(
        seq(
          field("primary", $.index_term_text),
          ",",
          field("secondary", $.index_term_text),
          ",",
          field("tertiary", $.index_term_text),
        ),
        seq(field("primary", $.index_term_text), ",", field("secondary", $.index_term_text)),
        field("primary", $.index_term_text),
      ),

    index_term_text: ($) => /[^,\]\)\r\n]+/,

    // TABLES
    table_block: ($) =>
      prec.right(10, seq(optional(field("title", $.table_title)), $._table_block_body)),

    _table_block_body: ($) =>
      seq(
        optional(field("metadata", $.metadata)),
        field("open", $.table_open),
        optional(field("content", $.table_content)),
        field("close", $.table_close),
      ),

    // Recognize table fences in grammar (one or two pipes followed by === and optional spaces, then newline)
    table_open: ($) => alias(token(prec(200, /\|{1,2}={3}[ \t]*\r?\n/)), $.TABLE_FENCE_START),

    table_close: ($) => alias(token(prec(200, /\|{1,2}={3}[ \t]*\r?\n/)), $.TABLE_FENCE_END),

    // Table content does not admit metadata - only rows or blank lines;
    // allow non-pipe lines as content lines for stability
    table_free_line: ($) => token(prec(1, /[^|\r\n].*\r?\n/)),

    table_content: ($) =>
      repeat1(
        choice(
          field("row", $.table_row),
          alias($.table_free_line, $.content_line),
          alias($._blank_line, $.content_line),
        ),
      ),

    table_row: ($) => prec(4, seq(field("cells", repeat1($.table_cell)), $._line_ending)),

    // Table cells - distinguish cells with specs from regular cells
    table_cell: ($) =>
      choice(
        // Cell with spec: | followed by cell_spec (which includes closing |) then content
        prec.left(
          200,
          prec.dynamic(
            200,
            seq("|", field("spec", $.cell_spec), field("content", $.cell_content)),
          ),
        ),
        // Header cell: || followed by content (not =)
        prec(90, seq(token(prec(65, /\|\|[^=\r\n]/)), field("content", $.cell_content))),
        // Regular cell: | followed by optional content
        prec(-100, seq(token(prec(60, "|")), field("content", $.cell_content))),
      ),

    // Cell specifications for table cells - includes closing pipe
    cell_spec: ($) =>
      token(
        choice(
          // Span + format + closing pipe
          seq(
            choice(
              seq(/\d+/, ".", /\d+/, "+"), // 2.3+
              seq(/\d+/, "+"), // 2+
              seq(".", /\d+/, "+"), // .3+
            ),
            /[halmrs]/,
            "|",
          ),
          // Span only + closing pipe
          seq(choice(seq(/\d+/, ".", /\d+/, "+"), seq(/\d+/, "+"), seq(".", /\d+/, "+")), "|"),
          // Format only + closing pipe
          seq(/[halmrs]/, "|"),
        ),
      ),

    // Keep these for backward compatibility or future use
    span_spec: ($) =>
      choice(
        token(seq(/\d+/, ".", /\d+/, "+")),
        token(seq(/\d+/, "+")),
        token(seq(".", /\d+/, "+")),
      ),

    format_spec: ($) => /[halmrs]/,

    // Disallow metadata inside table content by keeping cell_content strictly literal
    cell_content: ($) => $.cell_literal_text,

    cell_literal_text: ($) => /[^|\r\n]*/,

    // LINE BREAKS - hard line break: space-or-tab + "+" before newline
    hard_break: ($) => token(prec(2, seq(/[ \t]+/, "+", /\r?\n/))),
    line_break: ($) => alias($.hard_break, $.line_break),

    // BASIC TOKENS
    _line_ending: ($) => token(prec(-1, /\r?\n/)),
    _blank_line: ($) => token(prec(-2, /[ \t]*\r?\n/)),
  },
});
