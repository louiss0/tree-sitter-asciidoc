; ============================================================================
; AsciiDoc Syntax Highlighting Queries
; ============================================================================
; Aligned with grammar.js node names and field definitions

; ============================================================================
; SECTIONS & DOCUMENT STRUCTURE
; ============================================================================

; Section titles with level-specific markers
(section_title
  (section_marker_1) @markup.heading.1.marker
  (title) @markup.heading.1.asciidoc) @markup.heading.1

(section_title
  (section_marker_2) @markup.heading.2.marker
  (title) @markup.heading.2.asciidoc) @markup.heading.2

(section_title
  (section_marker_3) @markup.heading.3.marker
  (title) @markup.heading.3.asciidoc) @markup.heading.3

(section_title
  (section_marker_4) @markup.heading.4.marker
  (title) @markup.heading.4.asciidoc) @markup.heading.4

(section_title
  (section_marker_5) @markup.heading.5.marker
  (title) @markup.heading.5.asciidoc) @markup.heading.5

(section_title
  (section_marker_6) @markup.heading.6.marker
  (title) @markup.heading.6.asciidoc) @markup.heading.6

; Fallback for title nodes
(title) @markup.heading

; ============================================================================
; INLINE FORMATTING
; ============================================================================

; Strong (bold) - **text** or *text*
(strong) @markup.strong
(strong_open) @punctuation.delimiter.bold
(strong_close) @punctuation.delimiter.bold
(strong_text) @markup.strong

; Emphasis (italic) - __text__ or _text_
(emphasis) @markup.italic
(emphasis_open) @punctuation.delimiter.italic
(emphasis_close) @punctuation.delimiter.italic
(emphasis_text) @markup.italic

; Monospace (code) - ``text`` or `text`
(monospace) @markup.raw.inline
(monospace_open) @punctuation.delimiter.code
(monospace_close) @punctuation.delimiter.code
(monospace_text) @markup.raw.inline

; Superscript - ^text^
(superscript) @markup.superscript
(superscript_open) @punctuation.delimiter
(superscript_close) @punctuation.delimiter
(superscript_text) @markup.superscript

; Subscript - ~text~
(subscript) @markup.subscript
(subscript_open) @punctuation.delimiter
(subscript_close) @punctuation.delimiter
(subscript_text) @markup.subscript

; ============================================================================
; LINKS & CROSS-REFERENCES
; ============================================================================

; Auto-detected URLs
(auto_link) @markup.link.url

; Explicit links with text - https://url[text]
(explicit_link) @markup.link
(explicit_link
  url: (auto_link) @markup.link.url
  text: (link_text) @markup.link.label)

(link_text) @markup.link.label

; Internal cross-references - <<anchor,text>>
(internal_xref) @markup.link

; External cross-references - xref:file[text]
(external_xref) @markup.link

; ============================================================================
; ANCHORS & BIBLIOGRAPHY
; ============================================================================

; Inline anchors - [[id,text]]
(inline_anchor) @markup.link.label
(inline_anchor_id) @constant
(inline_anchor_text) @string

; Block-level anchors
(anchor) @markup.link.label
(anchor
  id: (inline_anchor_id) @constant
  text: (inline_anchor_text)? @string)

; Bibliography entries - [[[id,description]]]
(bibliography_entry) @markup.link.label
(bibliography_id) @constant
(bibliography_text) @string

; ============================================================================
; FOOTNOTES
; ============================================================================

(footnote_inline) @markup.link
(footnote_ref) @markup.link
(footnoteref) @markup.link

; ============================================================================
; ATTRIBUTES
; ============================================================================

; Attribute definitions - :name: value
(attribute_entry) @keyword.directive
(attribute_entry
  name: (name) @variable.builtin
  value: (value)? @string)

; Attribute references - {name}
(attribute_reference) @variable.builtin

; ============================================================================
; LISTS
; ============================================================================

; List markers
(asciidoc_list_marker) @markup.list.unnumbered
(markdown_list_marker) @markup.list.unnumbered
(asciidoc_checklist_marker) @markup.list.unnumbered
(markdown_checklist_marker) @markup.list.unnumbered
(ordered_list_marker) @markup.list.numbered
(description_marker) @markup.list.description

; List items
(asciidoc_unordered_list_item) @markup.list.unnumbered
(markdown_unordered_list_item) @markup.list.unnumbered
(asciidoc_checklist_item) @markup.list.unnumbered
(markdown_checklist_item) @markup.list.unnumbered
(ordered_list_item) @markup.list.numbered
(description_item) @markup.list

; List continuations
(continuation_marker) @punctuation.special

; ============================================================================
; DELIMITED BLOCKS
; ============================================================================

; Example blocks
(example_block) @markup.quote
(example_open) @punctuation.delimiter
(example_close) @punctuation.delimiter
(EXAMPLE_FENCE_START) @punctuation.delimiter
(EXAMPLE_FENCE_END) @punctuation.delimiter

; Listing blocks
(listing_block) @markup.raw.block
(listing_open) @punctuation.delimiter
(listing_close) @punctuation.delimiter
(LISTING_FENCE_START) @punctuation.delimiter
(LISTING_FENCE_END) @punctuation.delimiter

; Fenced code blocks (```language)
(fenced_code_block) @markup.raw.block
(code_fence_open) @punctuation.delimiter
(code_fence_close) @punctuation.delimiter
(MARKDOWN_FENCE_START) @punctuation.delimiter
(MARKDOWN_FENCE_END) @punctuation.delimiter
(info_string
  language: (language) @label)
(code) @markup.raw.block
(code_line) @none
(MARKDOWN_FENCE_CONTENT_LINE) @none

; Literal blocks
(literal_block) @markup.raw.block
(literal_open) @punctuation.delimiter
(literal_close) @punctuation.delimiter
(LITERAL_FENCE_START) @punctuation.delimiter
(LITERAL_FENCE_END) @punctuation.delimiter

; Quote blocks
(quote_block) @markup.quote
(quote_open) @punctuation.delimiter
(quote_close) @punctuation.delimiter
(QUOTE_FENCE_START) @punctuation.delimiter
(QUOTE_FENCE_END) @punctuation.delimiter

; Sidebar blocks
(sidebar_block) @markup.quote
(sidebar_open) @punctuation.delimiter
(sidebar_close) @punctuation.delimiter
(SIDEBAR_FENCE_START) @punctuation.delimiter
(SIDEBAR_FENCE_END) @punctuation.delimiter

; Passthrough blocks
(passthrough_block) @markup.raw.block
(passthrough_open) @punctuation.delimiter
(passthrough_close) @punctuation.delimiter
(PASSTHROUGH_FENCE_START) @punctuation.delimiter
(PASSTHROUGH_FENCE_END) @punctuation.delimiter

; Open blocks
(open_block) @markup.quote
(openblock_open) @punctuation.delimiter
(openblock_close) @punctuation.delimiter
(OPENBLOCK_FENCE_START) @punctuation.delimiter
(OPENBLOCK_FENCE_END) @punctuation.delimiter

; Block content
(block_content) @none
(content_line) @none
(DELIMITED_BLOCK_CONTENT_LINE) @none

; ============================================================================
; CONDITIONAL BLOCKS
; ============================================================================

(ifdef_block) @keyword.conditional
(ifndef_block) @keyword.conditional
(ifeval_block) @keyword.conditional
(ifdef_open) @keyword.conditional
(ifndef_open) @keyword.conditional
(ifeval_open) @keyword.conditional
(endif_directive) @keyword.conditional

; ============================================================================
; METADATA & BLOCK ATTRIBUTES
; ============================================================================

(metadata) @attribute

; Block attributes - [attribute]
(block_attributes) @attribute
(source_block_attributes) @attribute
(language_identifier) @label
(attribute_content) @string

; ID and roles - [#id.role]
(id_and_roles) @attribute

; Block title - .Title
(block_title) @markup.heading

; ============================================================================
; TABLES
; ============================================================================

(table_block) @markup.list.unnumbered
(table_open) @punctuation.delimiter
(table_close) @punctuation.delimiter
(TABLE_FENCE_START) @punctuation.delimiter
(TABLE_FENCE_END) @punctuation.delimiter
(table_row) @markup.list
(table_cell) @none
(cell_spec) @variable.parameter
(cell_content) @none
(cell_formatted_content) @none
(cell_literal_text) @none

; ============================================================================
; COMMENTS
; ============================================================================

(block_comment) @comment.block
(comment_line) @comment

; ============================================================================
; PARAGRAPHS & ADMONITIONS
; ============================================================================

(paragraph) @none

; Paragraph admonitions - NOTE: text
(paragraph_admonition) @markup.strong
(admonition_label) @keyword.directive

; ============================================================================
; MACROS & SPECIAL CONSTRUCTS
; ============================================================================

; Include directive - include::path[]
(include_directive) @keyword.import
(include_path) @string.special.path
(include_options) @string

; Images - image::path[] or image:path[]
(image) @markup.link

; Passthrough - +++content+++ or pass:[content]
(passthrough_triple_plus) @markup.raw.inline
(pass_macro) @function.macro

; Math macros - stem:[], latexmath:[], asciimath:[]
(math_macro) @function.macro

; UI macros - kbd:[], btn:[], menu:[]
(ui_macro) @function.macro
(ui_kbd) @function.builtin
(ui_btn) @function.builtin
(ui_menu) @function.builtin

; Index terms - indexterm:[] or ((()))
(index_term) @markup.link.label
(index_term_macro) @markup.link.label
(index_term2_macro) @markup.link.label
(concealed_index_term) @markup.link.label
(index_text) @string
(index_term_text) @string

; Role spans - [.role]#text#
(role_span) @attribute
(role_list) @attribute
(role_content) @none

; ============================================================================
; TEXT & BASIC ELEMENTS
; ============================================================================

; Text segments
(text_segment) @none
(text_with_inlines) @none

; Line breaks - +
(line_break) @punctuation.special

; ============================================================================
; EXTERNAL SCANNER TOKENS (AUTOLINK_BOUNDARY not used for highlighting)
; ============================================================================

(AUTOLINK_BOUNDARY) @none
