; Sections and Structure
(section) @markup.heading

; Section level markers and titles
(section_level_1
  (section_marker_1) @markup.heading.1.marker
  (title) @markup.heading.1)

(section_level_2
  (section_marker_2) @markup.heading.2.marker
  (title) @markup.heading.2)

(section_level_3
  (section_marker_3) @markup.heading.3.marker
  (title) @markup.heading.3)

(section_level_4
  (section_marker_4) @markup.heading.4.marker
  (title) @markup.heading.4)

(section_level_5
  (section_marker_5) @markup.heading.5.marker
  (title) @markup.heading.5)

(section_level_6
  (section_marker_6) @markup.heading.6.marker
  (title) @markup.heading.6)

; Generic title
(title) @markup.heading

; Inline Formatting
(strong) @markup.bold
(strong_open) @markup.bold
(strong_close) @markup.bold
(strong_content) @markup.bold

(emphasis) @markup.italic
(emphasis_open) @markup.italic
(emphasis_close) @markup.italic
(emphasis_content) @markup.italic

(monospace) @markup.raw
(monospace_open) @markup.raw
(monospace_close) @markup.raw
(monospace_content) @markup.raw

(superscript) @markup.underline
(superscript_open) @markup.underline
(superscript_close) @markup.underline
(superscript_text) @markup.underline

(subscript) @markup.underline
(subscript_open) @markup.underline
(subscript_close) @markup.underline
(subscript_text) @markup.underline

; Links and References
(auto_link) @markup.link.url
(explicit_link) @markup.link
(link_macro) @markup.link
(link_text) @markup.link.text
(internal_xref) @markup.link
(external_xref) @markup.link

; Anchors
(inline_anchor) @markup.link.label
(anchor) @markup.link.label

; Attributes
(attribute_entry) @attribute
(attribute_value) @string
(attribute_reference) @variable.builtin

; Lists
(callout_list) @markup.list
(description_list) @markup.list
(description_content) @markup.list
(ordered_list) @markup.list
(unordered_list) @markup.list
(unordered_list_item) @markup.list
(ordered_list_item) @markup.list
(description_item) @markup.list
(callout_item) @markup.list
(list_item_continuation) @punctuation.special

; Delimited Blocks
(example_block) @markup.quote
(listing_block) @markup.raw.block
(literal_block) @markup.raw.block
(asciidoc_blockquote) @markup.quote
(sidebar_block) @markup.quote
(passthrough_block) @markup.raw.block
(open_block) @markup.quote
(table_block) @markup.list.unnumbered

; Block fences and external tokens
(EXAMPLE_FENCE_START) @punctuation.delimiter
(EXAMPLE_FENCE_END) @punctuation.delimiter
(LISTING_FENCE_START) @punctuation.delimiter
(LISTING_FENCE_END) @punctuation.delimiter
(LITERAL_FENCE_START) @punctuation.delimiter
(LITERAL_FENCE_END) @punctuation.delimiter
(QUOTE_FENCE_START) @punctuation.delimiter
(QUOTE_FENCE_END) @punctuation.delimiter
(SIDEBAR_FENCE_START) @punctuation.delimiter
(SIDEBAR_FENCE_END) @punctuation.delimiter
(PASSTHROUGH_FENCE_START) @punctuation.delimiter
(PASSTHROUGH_FENCE_END) @punctuation.delimiter
(OPENBLOCK_FENCE_START) @punctuation.delimiter
(OPENBLOCK_FENCE_END) @punctuation.delimiter

(example_open) @punctuation.delimiter
(example_close) @punctuation.delimiter
(listing_open) @punctuation.delimiter
(listing_close) @punctuation.delimiter
(literal_open) @punctuation.delimiter
(literal_close) @punctuation.delimiter
(asciidoc_blockquote_open) @punctuation.delimiter
(asciidoc_blockquote_close) @punctuation.delimiter
(sidebar_open) @punctuation.delimiter
(sidebar_close) @punctuation.delimiter
(passthrough_open) @punctuation.delimiter
(passthrough_close) @punctuation.delimiter
(openblock_open) @punctuation.delimiter
(openblock_close) @punctuation.delimiter

; External tokens
(TABLE_FENCE_START) @punctuation.delimiter
(TABLE_FENCE_END) @punctuation.delimiter
(DELIMITED_BLOCK_CONTENT_LINE) @text
(LIST_CONTINUATION) @punctuation.special
(CALLOUT_MARKER) @markup.strong
(AUTOLINK_BOUNDARY) @punctuation

; Tables
(table_open) @punctuation.delimiter
(table_close) @punctuation.delimiter
(table_cell) @markup.list
(cell_spec) @variable.parameter

; Comments
(block_comment) @comment.block
(comment_line) @comment

; Conditionals
(conditional_block) @none
(ifdef_block
  (ifdef_open) @keyword.conditional
  (endif_directive)? @keyword.conditional)
(ifndef_block
  (ifndef_open) @keyword.conditional
  (endif_directive)? @keyword.conditional)
(ifeval_block
  (ifeval_open) @keyword.conditional
  (endif_directive)? @keyword.conditional)

; Macros and Functions
(include_directive) @keyword.import
(footnote_inline) @markup.link
(footnote_ref) @markup.link
(footnoteref) @markup.link
(image) @markup.link
(passthrough_triple_plus) @markup.raw.inline
(pass_macro) @function.macro
(math_macro) @function.macro
(ui_macro) @function.macro
(index_term) @markup.link.label

; Specific math macro types
(stem_inline) @function.macro
(latexmath_inline) @function.macro
(asciimath_inline) @function.macro

; Admonitions
(block_admonition) @markup.quote
(admonition_attribute) @keyword.directive
(paragraph_admonition
  (admonition_type) @keyword.directive
  (text_with_inlines)? @markup.quote)

; Metadata
(metadata) @attribute
(block_attributes) @attribute
(id_and_roles) @attribute
(block_title) @attribute

; Basic text
(source_file) @none
(block_content) @text
(paragraph) @text
(inline_element) @text
(text_segment) @text
(content_line) @text

; Punctuation
(text_period) @punctuation
(text_colon) @punctuation
(text_caret) @punctuation.special
(text_hash) @punctuation.special
(text_tilde) @punctuation.special
(text_angle_bracket) @punctuation.bracket
(text_brace) @punctuation.bracket
(text_bracket) @punctuation.bracket
(text_paren) @punctuation.bracket

; Advanced Features
(bibliography_entry) @markup.link.label
(bibliography_id) @variable.builtin
(bibliography_text) @string

(role_span) @markup.quote
(role_list) @attribute
(role_content) @markup.quote

; Table content
(table_content) @markup.list
(table_row) @markup.list
(cell_literal_text) @text
(cell_content) @markup.list

; UI Macros
(ui_kbd) @function.builtin
(ui_btn) @function.builtin
(ui_menu) @function.builtin

; Index terms
(index_term_macro) @markup.link.label
(index_term2_macro) @markup.link.label
(concealed_index_term) @markup.link.label
(index_text) @variable.builtin
(index_term_text) @string

; Error recovery - handled by ERROR nodes automatically

; Line breaks
(line_break) @punctuation.special
