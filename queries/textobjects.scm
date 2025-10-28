; ============================================================================
; AsciiDoc Text Objects Queries
; ============================================================================
; Enables vim-style text object operations for selection and navigation
; Examples: `dib` (delete inner block), `vaf` (select around function/section)

; ============================================================================
; SECTIONS - Treat as functions for navigation
; ============================================================================

; Sections as functions (outer includes title, inner is content only)
[
  (section_level_1)
  (section_level_2)
  (section_level_3)
  (section_level_4)
  (section_level_5)
  (section_level_6)
] @function.outer

[
  (section_level_1 content: (_) @function.inner)
  (section_level_2 content: (_) @function.inner)
  (section_level_3 content: (_) @function.inner)
  (section_level_4 content: (_) @function.inner)
  (section_level_5 content: (_) @function.inner)
  (section_level_6 content: (_) @function.inner)
]

; Top-level sections (levels 1-2) as classes
[(section_level_1) (section_level_2)] @class.outer

[
  (section_level_1 content: (_) @class.inner)
  (section_level_2 content: (_) @class.inner)
]

; ============================================================================
; DELIMITED BLOCKS - Block text objects
; ============================================================================

; Example blocks
(example_block) @block.outer
(example_block
  (block_content) @block.inner)

; Listing blocks
(listing_block) @block.outer
(listing_block
  (block_content) @block.inner)

; Fenced code blocks
(fenced_code_block) @block.outer
(fenced_code_block
  (block_content) @block.inner)

; Literal blocks
(literal_block) @block.outer
(literal_block
  (block_content) @block.inner)

; Quote blocks
(asciidoc_blockquote) @block.outer
(asciidoc_blockquote
  (block_content) @block.inner)

; Sidebar blocks
(sidebar_block) @block.outer
(sidebar_block
  (block_content) @block.inner)

; Passthrough blocks
(passthrough_block) @block.outer
(passthrough_block
  (block_content) @block.inner)

; Open blocks
(open_block) @block.outer
(open_block
  (block_content) @block.inner)

; Conditional blocks
(ifdef_block) @block.outer
(ifndef_block) @block.outer
(ifeval_block) @block.outer

; ============================================================================
; COMMENTS - Comment text objects
; ============================================================================

(block_comment) @comment.outer
(block_comment
  (comment_line)+ @comment.inner)

; ============================================================================
; LISTS - Treat list items as parameters
; ============================================================================

; Unordered list items
(unordered_list_item) @parameter.outer
(unordered_list_item
  content: (_) @parameter.inner)

; Ordered list items
(ordered_list_item) @parameter.outer
(ordered_list_item
  content: (_) @parameter.inner)

; Description list items
(description_item) @parameter.outer
(description_item
  (_) @parameter.inner)

; List continuations
(list_item_continuation) @parameter.outer

; ============================================================================
; TABLES - Table text objects
; ============================================================================

(table_block) @table.outer
(table_block
  content: (table_content) @table.inner)

; Table rows
(table_row) @parameter.outer

; Table cells
(table_cell) @parameter.inner

; ============================================================================
; LINKS & REFERENCES - Link text objects
; ============================================================================

; Auto links
(auto_link) @link.outer

; Explicit links
(explicit_link) @link.outer
(explicit_link
  text: (link_text) @link.inner)

; Internal cross-references
(internal_xref) @link.outer

; External cross-references
(external_xref) @link.outer

; Anchors
(anchor) @link.outer
(inline_anchor) @link.outer

; Bibliography entries
(bibliography_entry) @link.outer

; Footnotes
(footnote_inline) @link.outer
(footnote_ref) @link.outer
(footnoteref) @link.outer

; ============================================================================
; ATTRIBUTES - Attribute text objects
; ============================================================================

(attribute_entry) @attribute.outer
(attribute_entry
  value: (attribute_value) @attribute.inner)

; Attribute references
(attribute_reference) @attribute.outer

; Block attributes
(block_attributes) @attribute.outer

; ============================================================================
; MACROS - Treat as calls
; ============================================================================

; Include directives
(include_directive) @call.outer

; Images
(image) @call.outer

; Math macros
(math_macro) @call.outer

; UI macros
(ui_kbd) @call.outer
(ui_btn) @call.outer
(ui_menu) @call.outer

; Passthrough macros
(pass_macro) @call.outer
(passthrough_triple_plus) @call.outer

; Index terms
(index_term_macro) @call.outer
(index_term2_macro) @call.outer
(concealed_index_term) @call.outer

; ============================================================================
; INLINE FORMATTING - Format text objects
; ============================================================================

; Strong (bold)
(strong) @text.outer
(strong
  content: (strong_content) @text.inner)

; Emphasis (italic)
(emphasis) @text.outer
(emphasis
  content: (emphasis_content) @text.inner)

; Monospace (code)
(monospace) @text.outer
(monospace
  content: (monospace_content) @text.inner)

; Superscript
(superscript) @text.outer
(superscript
  content: (superscript_text) @text.inner)

; Subscript
(subscript) @text.outer
(subscript
  content: (subscript_text) @text.inner)

; Role spans
(role_span) @text.outer
(role_span
  content: (role_content) @text.inner)

; ============================================================================
; PARAGRAPHS - Paragraph text objects
; ============================================================================

(paragraph) @text.outer
(paragraph
  content: (_) @text.inner)

; Paragraph admonitions
(paragraph_admonition) @text.outer
