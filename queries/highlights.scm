; Sections and Structure
(section) @markup.heading
(section_title) @markup.heading
(title) @markup.heading

; Section markers based on level
((_section_marker_1) @markup.heading.1.marker)
((_section_marker_2) @markup.heading.2.marker)
((_section_marker_3) @markup.heading.3.marker)
((_section_marker_4) @markup.heading.4.marker)
((_section_marker_5) @markup.heading.5.marker)
((_section_marker_6) @markup.heading.6.marker)

; Inline Formatting
(strong_open) @markup.bold
(strong_close) @markup.bold
(strong_content) @markup.bold

(emphasis_open) @markup.italic
(emphasis_close) @markup.italic
(emphasis_content) @markup.italic

(monospace_open) @markup.raw
(monospace_close) @markup.raw
(monospace_content) @markup.raw

(superscript_open) @markup.underline
(superscript_close) @markup.underline
(superscript_text) @markup.underline

(subscript_open) @markup.underline
(subscript_close) @markup.underline
(subscript_text) @markup.underline

; Links and References
(auto_link) @markup.link.url
(link) @markup.link
(bracketed_text) @markup.link.text
(internal_xref) @markup.link
(external_xref) @markup.link

; Anchors
(inline_anchor) @markup.link.label
(inline_anchor_id) @markup.link.label
(anchor) @markup.link.label

; Attributes
(attribute_entry) @variable
(name) @variable.builtin
(value) @string
(attribute_reference) @variable.builtin

; Lists
(unordered_list_item) @markup.list
(ordered_list_item) @markup.list
(description_item) @markup.list
(callout_item) @markup.list

; Delimited Blocks
(example_block) @markup.quote
(listing_block) @markup.raw.block
(literal_block) @markup.raw.block
(quote_block) @markup.quote
(sidebar_block) @markup.quote
(passthrough_block) @markup.raw.block
(open_block) @markup.quote
(table_block) @markup.list.unnumbered

; Block fences
(example_open) @punctuation.delimiter
(example_close) @punctuation.delimiter
(listing_open) @punctuation.delimiter
(listing_close) @punctuation.delimiter
(literal_open) @punctuation.delimiter
(literal_close) @punctuation.delimiter
(quote_open) @punctuation.delimiter
(quote_close) @punctuation.delimiter
(sidebar_open) @punctuation.delimiter
(sidebar_close) @punctuation.delimiter
(passthrough_open) @punctuation.delimiter
(passthrough_close) @punctuation.delimiter
(openblock_open) @punctuation.delimiter
(openblock_close) @punctuation.delimiter

; Tables
(table_open) @punctuation.delimiter
(table_close) @punctuation.delimiter
(table_cell) @markup.list
(cell_spec) @variable.parameter

; Comments
(block_comment) @comment.block
(comment_line) @comment

; Conditionals
(ifdef_open) @keyword.conditional
(ifndef_open) @keyword.conditional
(ifeval_open) @keyword.conditional
(endif_directive) @keyword.conditional

; Macros and Functions
(include_directive) @keyword.import
(include_path) @string.special.path
(footnote_inline) @markup.link
(footnote_ref) @markup.link
(footnoteref) @markup.link
(image) @markup.link
(passthrough_triple_plus) @markup.raw.inline
(pass_macro) @function.macro
(math_macro) @function.macro
(ui_macro) @function.macro
(index_term) @markup.link.label

; Admonitions
(paragraph_admonition) @markup.strong
(admonition_label) @markup.strong

; Metadata
(metadata) @attribute
(block_attributes) @attribute
(id_and_roles) @attribute
(block_title) @attribute

; Basic text
(text_segment) @text
(content_line) @text

; Punctuation
(text_period) @punctuation
(text_colon) @punctuation
(text_angle_bracket) @punctuation.bracket
(text_brace) @punctuation.bracket
(text_bracket) @punctuation.bracket
(text_paren) @punctuation.bracket

; Advanced Features
(bibliography_entry) @markup.link.label
(bibliography_id) @variable.builtin
(bibliography_text) @string

(role_list) @attribute
(role_content) @markup.quote

(cell_formatted_content) @markup.list

; Line breaks
(line_break) @punctuation.special
