;; AsciiDoc syntax highlighting - Enhanced version
;; Following nvim-treesitter capture naming conventions
;; https://github.com/nvim-treesitter/nvim-treesitter/blob/master/CONTRIBUTING.md#captures

;; =============================================================================
;; SECTION HEADINGS
;; =============================================================================

;; Section titles with level-specific highlighting
;; The grammar uses _heading1 through _heading6 tokens - these should be captured
(section_title (title) @markup.heading)

;; Enhanced heading captures for different levels (requires grammar token analysis)
(section 
  (section_title (title) @markup.heading.1))
(#match? @markup.heading.1 "^= ")

(section
  (section_title (title) @markup.heading.2))
(#match? @markup.heading.2 "^== ")

(section
  (section_title (title) @markup.heading.3))
(#match? @markup.heading.3 "^=== ")

;; =============================================================================
;; DELIMITED BLOCKS
;; =============================================================================

;; Block fences - highlighting the open/close delimiters
(example_block 
  open: (example_open) @punctuation.special
  close: (example_close) @punctuation.special)
(#set! "priority" 110)

(listing_block 
  open: (listing_open) @punctuation.special
  close: (listing_close) @punctuation.special)
(#set! "priority" 110)

(literal_block 
  open: (literal_open) @punctuation.special
  close: (literal_close) @punctuation.special)
(#set! "priority" 110)

(quote_block 
  open: (quote_open) @punctuation.special
  close: (quote_close) @punctuation.special)
(#set! "priority" 110)

(sidebar_block 
  open: (sidebar_open) @punctuation.special
  close: (sidebar_close) @punctuation.special)
(#set! "priority" 110)

(passthrough_block 
  open: (passthrough_open) @punctuation.special
  close: (passthrough_close) @punctuation.special)
(#set! "priority" 110)

(open_block 
  open: (openblock_open) @punctuation.special
  close: (openblock_close) @punctuation.special)
(#set! "priority" 110)

(table_block 
  open: (table_open) @punctuation.special
  close: (table_close) @punctuation.special)
(#set! "priority" 110)

;; Block content highlighting based on type
(listing_block content: (block_content) @markup.raw.block)
(literal_block content: (block_content) @markup.raw.block)
(quote_block content: (block_content) @markup.quote)
(passthrough_block content: (block_content) @markup.raw.block)

;; =============================================================================
;; ATTRIBUTE ENTRIES AND REFERENCES
;; =============================================================================

;; Attribute declarations (:name: value) - use modern @attribute
(attribute_entry
  name: (name) @attribute
  value: (value) @string)

;; Attribute references ({name}) - highlight braces and name separately  
(attribute_reference) @attribute

;; =============================================================================
;; INLINE FORMATTING
;; =============================================================================

;; Strong/bold text (*text*) - content only, delimiters handled by tokens
(strong) @markup.strong
(strong_constrained content: (strong_text) @markup.strong)

;; Emphasis/italic text (_text_) - content only, delimiters handled by tokens
(emphasis) @markup.italic  
(emphasis_constrained content: (emphasis_text) @markup.italic)

;; Monospace/code text (`text`) - enhance to use raw.inline
(monospace) @markup.raw.inline
(monospace_constrained content: (monospace_text) @markup.raw.inline)

;; Superscript (^text^) and subscript (~text~) - better semantic captures
(superscript content: (superscript_text) @string.special)
(subscript content: (subscript_text) @string.special)

;; =============================================================================
;; LINKS AND CROSS-REFERENCES
;; =============================================================================

;; Auto links (bare URLs)
(auto_link) @markup.link.url

;; Internal cross-references (<<target,text>>)
(internal_xref) @markup.link

;; External cross-references (xref:target[text]) - treated as macros
(external_xref) @function.macro

;; Link macros (link:url[text]) - treated as macros 
(link) @function.macro
(link_macro) @function.macro

;; =============================================================================
;; ANCHORS
;; =============================================================================

;; Block and inline anchors
(anchor id: (id) @label)
(anchor text: (anchor_text) @markup.link.label)
(inline_anchor) @label

;; =============================================================================
;; IMAGES AND MEDIA
;; =============================================================================

;; Image macros (image::target[alt] and image:target[alt])
(image) @function.macro
(block_image) @function.macro

;; =============================================================================
;; PASSTHROUGHS
;; =============================================================================

;; Triple plus passthroughs with delimiter highlighting
(passthrough_triple_plus) @markup.raw
;; Note: Content delimiters are token-based, need structured parsing for +++ markers

;; Pass macro (pass:[content])
(pass_macro) @function.macro
(#set! "priority" 108)

;; =============================================================================
;; LISTS
;; =============================================================================

;; List items
(unordered_list_item) @markup.list
(ordered_list_item) @markup.list 
(description_item) @markup.list

;; List markers (external tokens) - high priority to ensure visibility
(_LIST_UNORDERED_MARKER) @markup.list.marker
(_LIST_ORDERED_MARKER) @markup.list.marker
(DESCRIPTION_LIST_SEP) @markup.list.marker
(#set! "priority" 105)

;; List continuation markers
(LIST_CONTINUATION) @punctuation.special
(#set! "priority" 105)

;; Callout lists
(callout_item) @markup.list
(callout_item marker: (CALLOUT_MARKER) @markup.list.marker)

;; =============================================================================
;; ADMONITIONS
;; =============================================================================

;; Inline admonitions (NOTE: text)
(paragraph_admonition label: (admonition_label) @keyword)

;; Block admonitions ([NOTE])
(admonition_block label: (admonition_block_label) @keyword)
(admonition_label) @keyword

;; =============================================================================
;; CONDITIONAL DIRECTIVES
;; =============================================================================

;; Conditional block directives - higher priority to ensure visibility
(ifdef_open) @keyword.directive
(ifndef_open) @keyword.directive
(ifeval_open) @keyword.directive
(endif_directive) @keyword.directive
(#set! "priority" 120)

;; =============================================================================
;; TABLES
;; =============================================================================

;; Table cells
(table_cell content: (cell_content) @string)

;; Cell specifications (colspan, rowspan, format) - enhanced
(cell_spec) @operator
(span_spec) @number  
(format_spec) @operator

;; Table fences already handled in DELIMITED BLOCKS section

;; =============================================================================
;; MACROS AND SPECIAL CONSTRUCTS
;; =============================================================================

;; UI macros
(ui_kbd) @function.macro
(ui_btn) @function.macro 
(ui_menu) @function.macro

;; Math macros and content - enhanced
(math_macro) @function.macro
(math_content) @markup.math

;; Math block labels
(stem_block_label) @attribute
(latexmath_block_label) @attribute  
(asciimath_block_label) @attribute
(#set! "priority" 108)

;; Footnotes
(footnote_inline) @function.macro
(footnote_ref) @function.macro
(footnoteref) @function.macro

;; Index terms
(index_term_macro) @function.macro
(index_term2_macro) @function.macro
(concealed_index_term) @function.macro
(index_text primary: (index_term_text) @label)
(index_text secondary: (index_term_text) @label)
(index_text tertiary: (index_term_text) @label)

;; Bibliography
(bibliography_entry id: (bibliography_id) @label)
(bibliography_entry citation: (bibliography_citation) @string)
(bibliography_entry description: (bibliography_description) @string)
(bibliography_reference id: (bibliography_ref_id) @label)

;; Include directives - enhanced priority
(include_directive path: (include_path) @string.special.path)
(include_directive options: (include_options) @attribute)
(#set! "priority" 118)

;; =============================================================================
;; COMMENTS
;; =============================================================================

;; Line comments (// comment)
(line_comment_block) @comment

;; Block comments (////)
(block_comment) @comment
(comment_line) @comment

;; =============================================================================
;; METADATA AND ATTRIBUTES  
;; =============================================================================

;; Block metadata - more granular highlighting
(block_title) @markup.heading.marker
(block_attributes) @attribute
(id_and_roles) @attribute

;; =============================================================================
;; TEXT CONTENT
;; =============================================================================

;; Regular text segments - lower priority
(text_segment) @none
(text_colon) @none
(text_angle_bracket) @none  
(text_bracket) @none

;; Text with inlines containers - don't highlight the container itself
;; Let the inline elements be highlighted individually