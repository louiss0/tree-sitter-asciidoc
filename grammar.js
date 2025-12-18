/**
 * @file Ultra-minimal AsciiDoc parser for debugging paragraph parsing
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "asciidoc",

  externals: ($) => [
    $.LIST_CONTINUATION,
    $.UNORDERED_LIST_MARKER,
    $.ORDERED_LIST_MARKER,
    $.INDENTED_UNORDERED_LIST_MARKER,
    $.INDENTED_ORDERED_LIST_MARKER,
  ],

  extras: ($) => [
    /[ \t]+/, // Allow spaces and tabs but not newlines
    $.comment,
  ],

  conflicts: ($) => [[$.inline_element, $.explicit_link]],

  word: ($) => $._plain_text_segment,

  rules: {
    source_file: ($) =>
      choice(
        // Case 1: Document with a real header.
        //
        // The header MUST be the very first thing in the file
        // (no leading blank lines). After that, just normal blocks.
        prec(
          1,
          seq(
            field("header", $.document_header),
            repeat(choice($._blank_line, $._block_element)),
          ),
        ),

        // Case 2: Headerless document.
        //
        // Arbitrary mix of blank lines and blocks; any "header-looking"
        // lines here are treated as normal content (paragraphs/sections).
        repeat(choice($._blank_line, $._block_element)),
      ),

    _block_element: ($) =>
      choice(
        $.section,
        $.attribute_entry,
        $.description_list,
        $.callout_list,
        $.unordered_list,
        $.ordered_list,
        $.block_macro,
        $.block_admonition,
        $.inline_admonition,
        $.example_block,
        $.listing_block,
        $.asciidoc_blockquote,
        $.literal_block,
        $.sidebar_block,
        $.passthrough_block,
        $.open_block,
        $.conditional_block,
        $.table_block,
        $.thematic_break,
        $.page_break,
        $.paragraph,
      ),

    document_header: ($) =>
      prec.right(
        seq(
          field("title", $.document_title),
          optional(field("author", $.author_line)),
          optional(field("revision", $.revision_line)),
        ),
      ),

    document_title: ($) =>
      seq(
        field("marker", $.document_title_marker),
        field("text", $.document_title_text),
        $._line_ending,
      ),

    document_title_marker: ($) => token(prec(60, seq("=", /[ \t]+/))),

    document_title_text: ($) => token(prec(55, /[^\r\n]+/)),

    author_line: ($) =>
      seq(
        field("authors", $.author_list),
        optional(field("email", $.author_email)),
        $._line_ending,
      ),

    author_list: ($) =>
      seq(
        field("author", prec(5, $.author_name)),
        repeat(seq($._author_separator, field("author", $.author_name))),
      ),

    _author_separator: ($) => $.plain_comma,

    author_name: ($) =>
      prec.right(seq($.plain_text, repeat(choice($.plain_text, $.plain_dash)))),

    // INLINE “plain” email inside header
    author_email: ($) =>
      prec.right(
        seq(
          field("open", $.plain_less_than),
          field("address", alias($._author_email_address, $.plain_text)),
          field("close", $.plain_greater_than),
        ),
      ),

    _author_email_address: () => token.immediate(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+/),

    revision_line: ($) =>
      seq(
        field("version", $.revision_version),
        optional(seq($.plain_comma, field("date", $.revision_date))),
        optional(seq($.plain_colon, field("remark", $.revision_remark))),
        $._line_ending,
        field("separator", alias($._blank_line, $.header_break)),
      ),

    revision_version: ($) => token(prec(5, seq(optional(token("v")), /[0-9]+(?:\.[0-9]+)*/))),

    revision_date: ($) => token(prec(5, /[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}/)),

    revision_remark: ($) => token(prec(5, /[^\r\n]+/)),

    // SECTIONS - level-based hierarchy for proper sibling relationships
    section: ($) =>
      choice(
        $.section_level_2,
        $.section_level_3,
        $.section_level_4,
        $.section_level_5,
        $.section_level_6,
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
                $.inline_admonition,
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
                $.inline_admonition,
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
                $.inline_admonition,
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
                $.inline_admonition,
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
                $.inline_admonition,
                $.table_block,
                $._blank_line,
              ),
            ),
          ),
        ),
      ),

    title: ($) => token.immediate(/[^\r\n]+/),

    section_marker_2: ($) => token(prec(45, seq("==", /[ \t]+/))),
    section_marker_3: ($) => token(prec(40, seq("===", /[ \t]+/))),
    section_marker_4: ($) => token(prec(35, seq("====", /[ \t]+/))),
    section_marker_5: ($) => token(prec(30, seq("=====", /[ \t]+/))),
    section_marker_6: ($) => token(prec(25, seq("======", /[ \t]+/))),

    // ATTRIBUTE ENTRIES - Support both :name: and :name: value forms
    // Keep the delimiters explicit so highlight queries can capture the identifier directly.
    attribute_entry: ($) =>
      seq(
        field("name", $.attribute_name),
        optional(field("value", seq(token.immediate(/[ \t]+/), $.attribute_value))),
        $._line_ending,
      ),

    attribute_value: ($) => /[^\r\n]+/,

    attribute_name_text: ($) => token(/[A-Za-z_!][A-Za-z0-9_!-]+/), // letter/underscore first

    attribute_name: ($) => token(prec(40, /:[A-Za-z_!][A-Za-z0-9_!-]*:/)),

    // DELIMITED BLOCKS
    example_block: ($) =>
      seq(
        optional(field("title", $.block_title)),
        optional(
          field("attributes", alias($._attribute_list_with_line_ending, $.block_attributes)),
        ),
        field("open", $.example_open),
        optional(field("content", $.block_content)),
        field("close", $.example_close),
      ),

    example_open: ($) => $.EXAMPLE_FENCE_START,

    example_close: ($) => $.EXAMPLE_FENCE_END,

    // Listing blocks
    listing_block: ($) =>
      seq(
        optional(field("title", $.block_title)),
        optional(
          choice(
            seq(field("attributes", $.source_block_attributes), $._line_ending),
            field("attributes", alias($._attribute_list_with_line_ending, $.block_attributes)),
          ),
        ),
        field("open", $.listing_open),
        optional(field("content", $.block_content)),
        field("close", $.listing_close),
      ),

    listing_open: ($) => $.LISTING_FENCE_START,

    listing_close: ($) => $.LISTING_FENCE_END,

    // AsciiDoc quote blocks (fenced with ____)
    asciidoc_blockquote: ($) =>
      seq(
        optional(field("title", $.block_title)),
        optional(
          field("attributes", alias($._attribute_list_with_line_ending, $.block_attributes)),
        ),
        field("open", $.asciidoc_blockquote_open),
        optional(field("content", $.block_content)),
        field("close", $.asciidoc_blockquote_close),
      ),

    asciidoc_blockquote_open: ($) => $.QUOTE_FENCE_START,

    asciidoc_blockquote_close: ($) => $.QUOTE_FENCE_END,

    // Literal blocks
    literal_block: ($) =>
      seq(
        optional(field("title", $.block_title)),
        optional(
          field("attributes", alias($._attribute_list_with_line_ending, $.block_attributes)),
        ),
        field("open", $.literal_open),
        optional(field("content", $.block_content)),
        field("close", $.literal_close),
      ),

    literal_open: ($) => $.LITERAL_FENCE_START,

    literal_close: ($) => $.LITERAL_FENCE_END,

    // Sidebar blocks
    sidebar_block: ($) =>
      seq(
        optional(field("title", $.block_title)),
        optional(
          field("attributes", alias($._attribute_list_with_line_ending, $.block_attributes)),
        ),
        field("open", $.sidebar_open),
        optional(field("content", $.block_content)),
        field("close", $.sidebar_close),
      ),

    sidebar_open: ($) => $.SIDEBAR_FENCE_START,

    sidebar_close: ($) => $.SIDEBAR_FENCE_END,

    // Passthrough blocks
    passthrough_block: ($) =>
      seq(
        optional(field("title", $.block_title)),
        optional(
          field("attributes", alias($._attribute_list_with_line_ending, $.block_attributes)),
        ),
        field("open", $.passthrough_open),
        optional(field("content", $.block_content)),
        field("close", $.passthrough_close),
      ),

    passthrough_open: ($) => $.PASSTHROUGH_FENCE_START,

    passthrough_close: ($) => $.PASSTHROUGH_FENCE_END,

    thematic_break: ($) => field("marker", $.THEMATIC_BREAK),

    page_break: ($) => prec.left(25, seq(token("<<<"), $._blank_line)),

    // Open blocks
    open_block: ($) =>
      seq(
        optional(field("title", $.block_title)),
        optional(
          field("attributes", alias($._attribute_list_with_line_ending, $.block_attributes)),
        ),
        field("open", $.openblock_open),
        optional(field("content", $.block_content)),
        field("close", $.openblock_close),
      ),

    openblock_open: ($) => $.OPENBLOCK_FENCE_START,

    openblock_close: ($) => $.OPENBLOCK_FENCE_END,

    // BLOCK ADMONITIONS - Handle [ADMONITION] followed by supported delimited blocks
    block_admonition: ($) =>
      prec(
        30,
        seq(
          optional(field("title", $.block_title)),
          field("type", $.attribute_admonition_list),
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

    attribute_admonition_list: ($) =>
      prec(
        20, // any positive number > 0; just needs to beat the default
        seq(
          $.plain_left_bracket,
          $.admonition_label,
          repeat($.plain_text),
          $.plain_right_bracket,
          $._line_ending,
        ),
      ),

    inline_admonition: ($) =>
      prec.right(
        seq(
          field("label", seq($.admonition_label, $.plain_colon)),
          field("content", $._inline_text),
        ),
      ),

    // Legacy token-based admonition_label for backward compatibility
    admonition_label: ($) =>
      choice(
        token("NOTE"),
        token("TIP"),
        token("IMPORTANT"),
        token("WARNING"),
        token("CAUTION"),
      ),

    // CONDITIONAL BLOCKS - with higher precedence to resolve conflicts with description lists
    conditional_block: ($) => prec(10, choice($.ifdef_block, $.ifndef_block, $.ifeval_block)),

    ifdef_block: ($) =>
      seq(
        field("directive", $.ifdef_open),
        $._blank_line,
        field("content", repeat(choice($._block_element, $._blank_line))),
        field("end", $.endif_directive),
        $._blank_line,
      ),

    ifndef_block: ($) =>
      seq(
        field("directive", $.ifndef_open),
        $._blank_line,
        field("content", repeat(choice($._block_element, $._blank_line))),
        field("end", $.endif_directive),
        $._blank_line,
      ),

    ifeval_block: ($) =>
      seq(
        field("directive", $.ifeval_open),
        $._blank_line,
        field("content", repeat(choice($._block_element, $._blank_line))),
        field("end", $.endif_directive),
        $._blank_line,
      ),

    ifdef_open: ($) => prec(20, /ifdef::[^\[\]:\r\n]+\[\]/),

    ifeval_open: ($) => prec(20, /ifeval::\[[^\[\]:\r\n]+\]/),

    ifndef_open: ($) => prec(20, /ifndef::[^\[\]:\r\n]+\[\]/),

    endif_directive: ($) => /endif::\[\]/,

    // EXPRESSIONS - for ifeval conditions (fixed to eliminate recursion)
    // Use prec.left/right with explicit precedence levels to avoid recursion
    expression: ($) => $.logical_expression,

    // Precedence level 1: Logical operators (&&, ||, and, or) - lowest precedence, left-associative
    logical_expression: ($) =>
      choice(
        prec.left(
          1,
          seq(
            $.logical_expression,
            choice(token("&&"), token("||"), token("and"), token("or")),
            $.comparison_expression,
          ),
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
            choice(
              token("=="),
              token("!="),
              $.plain_less_than,
              $.plain_greater_than,
              token("<="),
              token(">="),
            ),
            $.additive_expression,
          ),
        ),
        $.additive_expression,
      ),

    // Precedence level 3: Additive operators (+, -), left-associative
    additive_expression: ($) =>
      choice(
        prec.left(
          3,
          seq(
            $.additive_expression,
            choice($.plain_plus, $.plain_dash),
            $.multiplicative_expression,
          ),
        ),
        $.multiplicative_expression,
      ),

    // Precedence level 4: Multiplicative operators (*, /, %), left-associative
    multiplicative_expression: ($) =>
      choice(
        prec.left(
          4,
          seq(
            $.multiplicative_expression,
            choice($.plain_asterisk, $.plain_slash, $.plain_percent),
            $.unary_expression,
          ),
        ),
        $.unary_expression,
      ),

    // Precedence level 5: Unary operators (!, -), right-associative
    unary_expression: ($) =>
      choice(
        prec.right(5, seq(choice($.plain_exclamation, $.plain_dash), $.unary_expression)),
        $.primary_expression,
      ),

    // Highest precedence: Primary and grouped expressions
    primary_expression: ($) =>
      choice(
        $.grouped_expression,
        $.string_literal,
        $.numeric_literal,
        $.boolean_literal,
        $.attribute_substitution,
      ),

    grouped_expression: ($) => seq($.plain_left_paren, $.expression, $.plain_right_paren),

    string_literal: ($) =>
      choice(
        seq($.plain_double_quote, /[^"\r\n]*/, $.plain_double_quote),
        seq($.plain_quote, /[^'\r\n]*/, $.plain_quote),
      ),

    numeric_literal: ($) =>
      token(
        choice(
          /\d+\.\d+/, // float
          /\d+/, // integer
        ),
      ),

    boolean_literal: ($) => choice(token("true"), token("false")),

    block_title: ($) => token(prec(15, /\.[\w\d \t_]+\r?\n/)),

    block_content: ($) => repeat1(choice($.content_line, $._blank_line)),

    content_line: ($) => seq($.DELIMITED_BLOCK_CONTENT_LINE, $._line_ending),

    EXAMPLE_FENCE_START: ($) => token(prec(60, /={4,}[ \t]*\r?\n/)),
    EXAMPLE_FENCE_END: ($) => token(prec(60, /={4,}[ \t]*\r?\n/)),

    LISTING_FENCE_START: ($) => token(prec(55, /-{4,}[ \t]*\r?\n/)),
    LISTING_FENCE_END: ($) => token(prec(55, /-{4,}[ \t]*\r?\n/)),

    LITERAL_FENCE_START: ($) => token(prec(50, /\.{4,}[ \t]*\r?\n/)),
    LITERAL_FENCE_END: ($) => token(prec(50, /\.{4,}[ \t]*\r?\n/)),

    QUOTE_FENCE_START: ($) => token(prec(45, /_{4,}[ \t]*\r?\n/)),
    QUOTE_FENCE_END: ($) => token(prec(45, /_{4,}[ \t]*\r?\n/)),

    SIDEBAR_FENCE_START: ($) => token(prec(40, /\*{4,}[ \t]*\r?\n/)),
    SIDEBAR_FENCE_END: ($) => token(prec(40, /\*{4,}[ \t]*\r?\n/)),

    PASSTHROUGH_FENCE_START: ($) => token(prec(35, /\+{4,}[ \t]*\r?\n/)),
    PASSTHROUGH_FENCE_END: ($) => token(prec(35, /\+{4,}[ \t]*\r?\n/)),

    OPENBLOCK_FENCE_START: ($) => token(prec(30, /--[ \t]*\r?\n/)),
    OPENBLOCK_FENCE_END: ($) => token(prec(30, /--[ \t]*\r?\n/)),

    THEMATIC_BREAK: ($) =>
      token(
        prec(
          25,
          choice(
            /\*[ \t]*\*[ \t]*\*[ \t]*(?:\*[ \t]*)*\r?\n/,
            /-[ \t]*-[ \t]*-[ \t]*(?:-[ \t]*)*\r?\n/,
            /_[ \t]*_[ \t]*_[ \t]*(?:_[ \t]*)*\r?\n/,
            /'[ \t]*'[ \t]*'[ \t]*(?:'[ \t]*)*\r?\n/,
          ),
        ),
      ),

    DELIMITED_BLOCK_CONTENT_LINE: ($) => token(prec(1, /[^\r\n]+/)),

    // LISTS
    unordered_list: ($) => prec.right(field("items", repeat1($.unordered_list_item))),

    unordered_list_item: ($) =>
      prec.right(
        1,
        seq(
          field("marker", alias($.UNORDERED_LIST_MARKER, $.unordered_list_marker)),
          field("content", $._inline_text),
          $._line_ending,
          repeat(
            choice(
              $.list_item_continuation,
              alias($._nested_unordered_list, $.unordered_list),
              alias($._nested_ordered_list, $.ordered_list),
            ),
          ),
        ),
      ),

    ordered_list: ($) => prec.right(field("items", repeat1($.ordered_list_item))),

    ordered_list_item: ($) =>
      prec.right(
        1,
        seq(
          field("marker", alias($.ORDERED_LIST_MARKER, $.ordered_list_marker)),
          field("content", $._inline_text),
          $._line_ending,
          repeat(
            choice(
              $.list_item_continuation,
              alias($._nested_unordered_list, $.unordered_list),
              alias($._nested_ordered_list, $.ordered_list),
            ),
          ),
        ),
      ),

    _nested_unordered_list: ($) =>
      prec.right(field("items", repeat1($._nested_unordered_list_item))),

    _nested_unordered_list_item: ($) =>
      prec.right(
        seq(
          field("marker", alias($.INDENTED_UNORDERED_LIST_MARKER, $.unordered_list_marker)),
          field("content", $._inline_text),
          $._line_ending,
          repeat(
            choice(
              $.list_item_continuation,
              alias($._nested_unordered_list, $.unordered_list),
              alias($._nested_ordered_list, $.ordered_list),
              // $.description_list,
            ),
          ),
        ),
      ),

    _nested_ordered_list: ($) =>
      prec.right(field("items", repeat1($._nested_ordered_list_item))),

    _nested_ordered_list_item: ($) =>
      prec.right(
        seq(
          field("marker", alias($.INDENTED_ORDERED_LIST_MARKER, $.ordered_list_marker)),
          field("content", $._inline_text),
          $._line_ending,
          repeat(
            choice(
              $.list_item_continuation,
              alias($._nested_unordered_list, $.unordered_list),
              alias($._nested_ordered_list, $.ordered_list),
              alias($._nested_description_list, $.description_list),
            ),
          ),
        ),
      ),

    // DESCRIPTION LISTS

    // Modeled like sections: parent level starts with :: and nested children add colons.
    description_list: ($) =>
      prec.right(25, seq($.description_list_item, repeat($.description_list_item))),

    description_list_item: ($) =>
      choice(
        $._description_list_item_level_1,
        $._description_list_item_level_2,
        $._description_list_item_level_3,
        $._description_list_item_level_4,
        $._description_list_item_level_5,
      ),

    _description_list_item_level_1: ($) =>
      prec.right(
        1,
        seq(
          choice(
            seq(
              field("term", alias(token(/[^:\r\n]+(::|;;)([ \t]+)/), $.description_item_term)),
              field("definition", alias($._inline_text, $.description_item_definition)),
              $._line_ending,
            ),
            field("term", alias(token(/[^:\r\n]+(::|;;)\r?\n/), $.description_item_term)),
          ),
          repeat($.list_item_continuation),
        ),
      ),
    _description_list_item_level_2: ($) =>
      prec.right(
        1,
        seq(
          choice(
            seq(
              field(
                "term",
                alias(token(/[^:\r\n]+(:::|;;;)([ \t]+)/), $.description_item_term),
              ),
              field("definition", alias($._inline_text, $.description_item_definition)),
              $._line_ending,
            ),
            field("term", alias(token(/[^:\r\n]+(:::|;;;)\r?\n/), $.description_item_term)),
          ),
          repeat($.list_item_continuation),
        ),
      ),
    _description_list_item_level_3: ($) =>
      prec.right(
        1,
        seq(
          choice(
            seq(
              field(
                "term",
                alias(token(/[^:\r\n]+(::::|;;;;)([ \t]+)/), $.description_item_term),
              ),
              field("definition", alias($._inline_text, $.description_item_definition)),
              $._line_ending,
            ),
            field("term", alias(token(/[^:\r\n]+(::::|;;;;)\r?\n/), $.description_item_term)),
          ),
          repeat($.list_item_continuation),
        ),
      ),
    _description_list_item_level_4: ($) =>
      prec.right(
        1,
        seq(
          choice(
            seq(
              field(
                "term",
                alias(token(/[^:\r\n]+(:::::|;;;;;)([ \t]+)/), $.description_item_term),
              ),
              field("definition", alias($._inline_text, $.description_item_definition)),
              $._line_ending,
            ),
            field("term", alias(token(/[^:\r\n]+(:::::|;;;;;)\r?\n/), $.description_item_term)),
          ),
          repeat($.list_item_continuation),
        ),
      ),
    _description_list_item_level_5: ($) =>
      prec.right(
        1,
        seq(
          choice(
            seq(
              field(
                "term",
                alias(token(/[^:\r\n]+(::::::|;;;;;;)([ \t]+)/), $.description_item_term),
              ),
              field("definition", alias($._inline_text, $.description_item_definition)),
              $._line_ending,
            ),
            field(
              "term",
              alias(token(/[^:\r\n]+(::::::|;;;;;;)\r?\n/), $.description_item_term),
            ),
          ),
          repeat($.list_item_continuation),
        ),
      ),

    // A nested description list must be deeper than the parent level.
    // i.e. it cannot start with level_1 (::)
    _nested_description_list: ($) =>
      prec.right(
        25,
        seq(
          choice(
            $._description_list_item_level_2,
            $._description_list_item_level_3,
            $._description_list_item_level_4,
            $._description_list_item_level_5,
          ),
          repeat(
            choice(
              $._description_list_item_level_2,
              $._description_list_item_level_3,
              $._description_list_item_level_4,
              $._description_list_item_level_5,
            ),
          ),
        ),
      ),

    // CALLOUT LISTS
    callout_list: ($) => prec.right(25, seq($.callout_item, repeat($.callout_item))),

    callout_item: ($) =>
      seq(
        field("marker", alias($.CALLOUT_MARKER, $.callout_marker)),
        field("content", $._inline_text),
        repeat($.list_item_continuation),
        $._line_ending,
      ),

    CALLOUT_MARKER: ($) => token(prec(10, /<[0-9]+>[ \t]+/)),

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
            $.unordered_list,
            $.ordered_list,
            alias($._nested_description_list, $.description_list),
          ),
        ),
      ),

    // PARAGRAPHS
    paragraph: ($) => prec.right(1, field("content", $._inline_text)),

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
        $.explicit_link,
        $.auto_link,
        $.highlight,
        $.passthrough_triple_plus,
        $.attribute_substitution,
        $.index_term,
        $.hard_break,
      ),

    _inline_text: ($) => prec.right(seq($.inline_seq_nonempty, repeat($.inline_seq_nonempty))),

    inline_seq_nonempty: ($) =>
      prec.right(seq($._inline_core_unit, repeat($._inline_core_unit))),

    _inline_core_unit: ($) =>
      choice(
        $.inline_macro,
        $.inline_element,
        $.escaped_char,
        $.plain_colon,
        $.plain_asterisk,
        $.plain_underscore,
        $.plain_dash,
        $.plain_quote,
        $.plain_double_quote,
        $.plain_caret,
        $.plain_less_than,
        $.plain_greater_than,
        $.plain_text,
        $.plain_left_bracket,
        $.plain_right_bracket,
        $.plain_backtick,
        $.plain_left_paren,
        $.plain_right_paren,
      ),

    plain_text: ($) => prec.left(-50, $._plain_text_segment),
    _plain_text_segment: ($) => /[A-Za-z0-9!$&@\.,+\/=%?#]+/,

    plain_colon: ($) => token(":"),
    plain_asterisk: ($) => token("*"),
    plain_underscore: ($) => token("_"), // _
    plain_dash: ($) => token("-"),
    plain_quote: ($) => token("'"),
    plain_double_quote: ($) => token('"'),
    plain_caret: ($) => token("^"),
    plain_less_than: () => token("<"),
    plain_greater_than: () => token(">"),
    plain_left_bracket: () => token("["),
    plain_right_bracket: () => token("]"),
    plain_left_brace: () => token("{"),
    plain_right_brace: () => token("}"),
    plain_backtick: () => token("`"),
    plain_left_paren: () => token("("),
    plain_right_paren: () => token(")"),
    plain_comma: ($) => token(","),
    plain_plus: ($) => token("+"),
    plain_tilde: ($) => token("~"),
    plain_pipe: ($) => token("|"),
    plain_dot: ($) => token("."),
    plain_slash: ($) => token("/"),
    plain_percent: ($) => token("%"),
    plain_exclamation: ($) => token("!"),

    // Any escaped single character: blocks delimiter interpretations
    escaped_char: ($) => token(seq("\\", /[^\r\n]/)),

    // Strong formatting (*bold* or **bold**)
    strong: ($) =>
      prec.left(
        1,
        choice(
          seq(
            field("open", alias($._strong_double_marker, $.strong_open)),
            field("content", $.strong_content),
            field("close", alias($._strong_double_marker, $.strong_close)),
          ),
          seq(
            field("open", alias($._strong_single_marker, $.strong_open)),
            field("content", $.strong_content),
            field("close", alias($._strong_single_marker, $.strong_close)),
          ),
        ),
      ),

    _strong_double_marker: ($) => token(prec(15, "**")),

    _strong_single_marker: ($) => token(prec(5, "*")),

    strong_content: ($) =>
      repeat1(
        choice(
          $.emphasis,
          $.monospace,
          $.superscript,
          $.subscript,
          $.escaped_char,
          token.immediate(/[^*\\\r\n]+/), // other text
        ),
      ),

    // Emphasis formatting (_italic_ or __italic__)
    emphasis: ($) =>
      prec.left(
        5,
        choice(
          seq(
            field("open", alias(token("__"), $.emphasis_open)),
            field("content", $.emphasis_content),
            field("close", alias(token("__"), $.emphasis_close)),
          ),
          seq(
            field("open", alias($.plain_underscore, $.emphasis_open)),
            field("content", $.emphasis_content),
            field("close", alias($.plain_underscore, $.emphasis_close)),
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
          $.escaped_char,
          token.immediate(/[^_\\\r\n]+/), // other text
        ),
      ),

    // Monospace formatting (`code` and ``intraword``)
    monospace: ($) =>
      prec.left(
        5,
        choice(
          seq(
            field("open", alias(token("``"), $.monospace_open)),
            field(
              "content",
              alias(
                repeat1(choice($.escaped_char, token.immediate(/[^`\\\r\n]+/))),
                $.monospace_content,
              ),
            ),
            field("close", alias(token("``"), $.monospace_close)),
          ),
          seq(
            field("open", alias($.plain_backtick, $.monospace_open)),
            field(
              "content",
              alias(
                repeat1(choice($.escaped_char, token.immediate(/[^`\\\r\n]+/))),
                $.monospace_content,
              ),
            ),
            field("close", alias($.plain_backtick, $.monospace_close)),
          ),
        ),
      ),

    // Superscript (^super^)
    superscript: ($) =>
      prec.left(
        5,
        seq(
          field("open", alias($.plain_caret, $.superscript_open)),
          field(
            "content",
            alias(
              repeat1(choice($.escaped_char, token.immediate(/[^\\^\r\n]+/))),
              $.superscript_content,
            ),
          ),
          field("close", alias($.plain_caret, $.superscript_close)),
        ),
      ),
    // Subscript (~sub~)
    subscript: ($) =>
      prec.left(
        5,
        seq(
          field("open", $.subscript_open),
          field("content", $.subscript_text),
          field("close", $.subscript_close),
        ),
      ),

    subscript_open: ($) => $.plain_tilde,
    subscript_close: ($) => $.plain_tilde,
    subscript_text: ($) => repeat1(choice($.escaped_char, token.immediate(/[^~\\\r\n]+/))),

    // Highlight / role spans (#highlight# or [.role]#text#)
    highlight: ($) =>
      prec.left(
        5,
        seq(
          optional(field("roles", alias($._attribute_list, $.role_attribute_list))),
          field("content", $.highlight_text),
        ),
      ),

    highlight_text: ($) => prec(20, seq("#", repeat1(choice(/\\./, /[^#\\\r\n]/)), "#")),

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
        token("[[["),
        field("id", $.bibliography_id),
        optional(seq($.plain_comma, field("description", $.bibliography_text))),
        token("]]]"),
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
      seq(
        field("open", token("<<")),
        field("target", $.xref_target),
        optional(seq($.plain_comma, field("text", $.xref_text))),
        field("close", token(">>")),
      ),

    xref_target: ($) => token.immediate(/[^>,\r\n]+/),

    xref_text: ($) => token.immediate(/[^>\r\n]+/),
    // EXPLICIT LINKS - URL followed by [text] (uses auto_link, higher precedence)
    explicit_link: ($) =>
      prec.dynamic(
        2000,
        seq(
          field("url", $.auto_link),
          $.plain_left_bracket,
          field("text", optional($.link_text)),
          $.plain_right_bracket,
        ),
      ),

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

    // PASSTHROUGH
    passthrough_triple_plus: ($) =>
      choice(
        seq(
          token("+++"),
          token.immediate(/[^+]+/), // content without + characters (simplified)
          token("+++"),
        ),
        seq(token("++"), token.immediate(/[^+]+/), token("++")),
      ),

    attribute_substitution: ($) =>
      seq(
        $.plain_left_brace,
        choice(seq($.plain_text, $.plain_colon, $.plain_text), $.plain_text),
        $.plain_right_brace,
      ),

    _attribute_list: ($) =>
      prec(
        20,
        seq(
          $.plain_left_bracket,
          repeat1(
            choice(
              $.plain_text,
              $.plain_dash,
              $.plain_underscore,
              $.plain_quote,
              $.plain_double_quote,
            ),
          ),
          $.plain_right_bracket,
        ),
      ),

    _attribute_list_with_line_ending: ($) => seq($._attribute_list, $._line_ending),

    source_block_attributes: ($) =>
      prec(
        25,
        seq(
          field(
            "keyword",
            alias(token(prec(60, /\[(?:source)?,/)), $.source_attribute_keyword),
          ),
          field("language", alias($.plain_text, $.source_language)),
          $.plain_right_bracket,
        ),
      ),

    // INLINE MACROS
    inline_macro: ($) =>
      prec.right(
        20,
        seq(
          field("open", alias(token(/[a-zA-Z0-9_-]+:[^:\r\n]*\[/), $.macro_name)),
          optional(field("body", $.macro_body)),
          field("close", alias($.plain_right_bracket, $.macro_close)),
        ),
      ),

    block_macro: ($) =>
      prec.right(
        20,
        seq(
          field("open", alias(token(/[a-zA-Z0-9_-]+::[^:\r\n]*\[/), $.macro_name)),
          optional(field("body", $.macro_body)),
          field("close", alias($.plain_right_bracket, $.macro_close)),
        ),
      ),

    macro_body: ($) => token.immediate(/[^\]\[\r\n]+/),

    comment: ($) => choice($._block_comment, $._line_comment),

    // Block comments (//// ... ////), can span multiple lines
    _block_comment: ($) => token(prec(-10, /\/{4,}[^\r\n]*\/{4,}\r?\n?/)),

    // Line comments (// ...), single line
    _line_comment: ($) => token(prec(100, /\/{2,}[^\r\n]*/)),

    // INDEX TERMS - with fallback for malformed constructs
    index_term: ($) => choice($.index_term_macro, $.index_term2_macro, $.concealed_index_term),

    index_term_macro: ($) =>
      choice(
        seq(
          token(prec(100, "indexterm:")),
          $.plain_left_bracket,
          field("terms", $.index_text),
          $.plain_right_bracket,
        ),
      ),

    index_term2_macro: ($) =>
      choice(
        seq(
          token(prec(100, "indexterm2:")),
          $.plain_left_bracket,
          field("terms", $.index_text),
          $.plain_right_bracket,
        ),
      ),

    concealed_index_term: ($) =>
      choice(seq(token(prec(50, "(((")), field("terms", $.index_text), token(prec(50, ")))")))),

    index_text: ($) =>
      choice(
        seq(
          field("primary", $.index_term_text),
          $.plain_comma,
          field("secondary", $.index_term_text),
          $.plain_comma,
          field("tertiary", $.index_term_text),
        ),
        seq(
          field("primary", $.index_term_text),
          $.plain_comma,
          field("secondary", $.index_term_text),
        ),
        field("primary", $.index_term_text),
      ),

    index_term_text: ($) => /[^,\]\)\r\n]+/,

    // TABLES
    table_block: ($) =>
      prec.right(
        10,
        seq(
          optional(field("title", $.block_title)),
          optional(
            field("attributes", alias($._attribute_list_with_line_ending, $.table_attributes)),
          ),
          $._table_block_body,
        ),
      ),

    _table_block_body: ($) =>
      seq(
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
            seq($.plain_pipe, field("spec", $.cell_spec), field("content", $.cell_content)),
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

    // Disallow metadata inside table content by keeping cell_content strictly literal
    cell_content: ($) => $.cell_literal_text,

    cell_literal_text: ($) => /[^|\r\n]*/,

    // LINE BREAKS - hard line break: space-or-tab + "+" before newline
    hard_break: ($) => token(prec(2, seq("+", /\r?\n/))),
    line_break: ($) => alias($.hard_break, $.line_break),

    // BASIC TOKENS
    _line_ending: ($) => token(prec(-2, /\r?\n/)),
    _blank_line: ($) => token(prec(-1, /[ \t]*\r?\n/)),
  },
});
