; Highlights using standard tree-sitter capture names

; Sections
(section_marker_1) @keyword
(section_marker_2) @keyword
(section_marker_3) @keyword
(section_marker_4) @keyword
(section_marker_5) @keyword
(section_marker_6) @keyword
(title) @module

; Inline Formatting
(strong_open) @operator
(strong_close) @operator
(strong_content) @string.special
(emphasis_open) @operator
(emphasis_close) @operator
(emphasis_content) @string
(monospace_open) @operator
(monospace_close) @operator
(monospace_content) @constant
(superscript) @string.special
(subscript) @string.special

; Links and URLs
(auto_link) @tag
(explicit_link) @tag
(link_macro) @tag
(external_xref) @tag

; Cross References
(internal_xref) @function
(inline_anchor) @function

; Macros
(image) @function.builtin
(footnote_inline) @function.builtin
(footnote_ref) @function.builtin
(footnoteref) @function.builtin
(pass_macro) @function.builtin
(math_macro) @function.builtin
(ui_macro) @function.builtin
(index_term) @function.builtin

; Attributes and Expressions
(attribute_reference) @variable
(attribute_entry) @variable.builtin

; Conditional Blocks
(ifdef_open) @keyword
(ifndef_open) @keyword
(ifeval_open) @keyword
(endif_directive) @keyword

; Admonitions
(admonition_type) @type
(paragraph_admonition) @comment

; Lists
(unordered_list_item) @punctuation.special
(ordered_list_item) @punctuation.special
(description_item) @punctuation.special
(callout_item) @punctuation.special

; Directives
(include_directive) @keyword

; Delimited Blocks
(listing_block) @constant
(fenced_code_block) @constant
(literal_block) @constant
(example_block) @constant
(sidebar_block) @constant
(asciidoc_blockquote) @constant
(markdown_blockquote) @constant
(passthrough_block) @constant
(open_block) @constant

; Block fences
(LISTING_FENCE_START) @punctuation.delimiter
(LISTING_FENCE_END) @punctuation.delimiter
(BACKTICK_FENCE_START) @punctuation.delimiter
(BACKTICK_FENCE_END) @punctuation.delimiter
(EXAMPLE_FENCE_START) @punctuation.delimiter
(EXAMPLE_FENCE_END) @punctuation.delimiter
(SIDEBAR_FENCE_START) @punctuation.delimiter
(SIDEBAR_FENCE_END) @punctuation.delimiter
(QUOTE_FENCE_START) @punctuation.delimiter
(QUOTE_FENCE_END) @punctuation.delimiter
(listing_open) @punctuation.delimiter
(listing_close) @punctuation.delimiter
(backtick_fence_open) @punctuation.delimiter
(backtick_fence_close) @punctuation.delimiter

; Metadata
(block_attributes) @attribute
(block_title) @property

; Roles
(role_span) @attribute

; Basic text - commented out to avoid overriding other highlights
; (text_segment) @text
; (content_line) @text
; (block_content) @text
