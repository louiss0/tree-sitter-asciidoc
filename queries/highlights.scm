; Sections and Structure
(section) @markup.heading

; Section level markers and titles
(section_level_2
  marker: (section_marker_2) @markup.heading.2.marker
  title: (title) @markup.heading.2)

(section_level_3
  marker: (section_marker_3) @markup.heading.3.marker
  title: (title) @markup.heading.3)

(section_level_4
  marker: (section_marker_4) @markup.heading.4.marker
  title: (title) @markup.heading.4)

(section_level_5
  marker: (section_marker_5) @markup.heading.5.marker
  title: (title) @markup.heading.5)

(section_level_6
  marker: (section_marker_6) @markup.heading.6.marker
  title: (title) @markup.heading.6)

(document_header) @markup.heading

(document_title
  marker: (document_title_marker) @markup.heading.1.marker
  text: (document_title_text) @markup.heading.1)

(author_line
  authors: (author_list
    author: (author_name) @string)
  email: (author_email) @markup.link)

(revision_line
  version: (revision_version) @number
  date: (revision_date) @number
  remark: (revision_remark) @string
  separator: (header_break) @punctuation.special)

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
(attribute_name) @attribute
(attribute_name
  (plain_text) @attribute)
(attribute_substitution) @variable.builtin

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
(thematic_break) @markup.quote
(page_break) @markup.quote

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
(callout_marker) @markup.strong

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
((block_macro
   name: (macro_name) @keyword.import)
 (#match? @keyword.import "^include$"))
(footnote_inline) @markup.link
(footnote_ref) @markup.link
(footnoteref) @markup.link
(image) @markup.link
(passthrough_triple_plus) @markup.raw.inline
(inline_macro) @function.macro
(block_macro) @function.macro
(index_term) @markup.link.label

; Admonitions
(block_admonition) @markup.quote
(admonition_attribute) @keyword.directive
((paragraph_admonition
   label: (admonition_label) @keyword.directive) @markup.quote)

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
(plain_text) @text
(plain_colon) @text
(plain_asterisk) @text
(plain_underscore) @text
(plain_dash) @text
(plain_quote) @text
(plain_double_quote) @text
(plain_caret) @text
(plain_less_than) @text
(plain_greater_than) @text
(content_line) @text

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
(ui_menu) @function.builtin

((inline_macro
   name: (macro_name) @macro_ui_name) @function.builtin
 (#match? @macro_ui_name "^(kbd|btn)$"))

; Index terms
(index_term_macro) @markup.link.label
(index_term2_macro) @markup.link.label
(concealed_index_term) @markup.link.label
(index_text) @variable.builtin
(index_term_text) @string

; Error recovery - handled by ERROR nodes automatically

; Line breaks
(hard_break) @punctuation.special
