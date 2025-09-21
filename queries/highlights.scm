;; Highlights for tree-sitter-asciidoc aligned with current AST

;; Sections and titles
(section (section_title (title) @markup.heading))
(block_title) @markup.heading

;; Paragraphs and plain text
(paragraph (text_with_inlines (text_segment) @markup))

;; Lists
(unordered_list) @markup.list
(ordered_list) @markup.list
(description_list) @markup.list
(callout_list) @markup.list

;; Inline formatting
(strong_text) @markup.bold
(emphasis_text) @markup.italic
(monospace_text) @markup.raw

;; Links, anchors, references
(inline_anchor) @markup.link
(internal_xref) @markup.link
(external_xref) @markup.link
(link_macro) @markup.link
(auto_link) @markup.link
(image) @markup.link
(block_image) @markup.link

;; Attributes and roles
(attribute_entry (name) @attribute)
(attribute_entry (value) @string)
(attribute_reference) @variable
(role_span) @attribute

;; Admonitions
(admonition_block_label) @label
(paragraph_admonition (admonition_label) @label)

;; Anchors
(anchor (id) @symbol)

;; Tables
(table_block) @markup
(table_row) @markup
(table_cell) @markup
(cell_spec) @attribute
(format_spec) @constant

;; Delimited blocks
(example_block) @markup.raw
(listing_block) @markup.raw
(literal_block) @markup.raw
(quote_block) @markup
(sidebar_block) @markup
(passthrough_block) @markup.raw
(open_block) @markup

;; Conditionals
(conditional_block) @keyword

;; Misc
(block_attributes) @attribute
(id_and_roles) @attribute

;; AsciiDoc syntax highlighting - Enhanced version
;; Following nvim-treesitter capture naming conventions
;; https://github.com/nvim-treesitter/nvim-treesitter/blob/master/CONTRIBUTING.md#captures

;; =============================================================================
;; SECTION HEADINGS
;; =============================================================================

;; Section titles with enhanced level differentiation
(section_title (title) @markup.heading)

;; Level-specific heading captures based on the section hierarchy
;; Note: The current grammar uses generic 'section' nodes
;; Level differentiation would require grammar enhancement or depth-based matching
;; (_section1 (section_title (title) @markup.heading.1))
;; (_section2 (section_title (title) @markup.heading.2)) 
;; (_section3 (section_title (title) @markup.heading.3))
;; (_section4 (section_title (title) @markup.heading.4))
;; (_section5 (section_title (title) @markup.heading.5))
;; (_section6 (section_title (title) @markup.heading.6))

;; Heading marker tokens (when available as separate nodes)
;; Note: Currently integrated in heading tokens. Future grammar enhancement could expose:
;; (_heading1_marker) @markup.heading.marker
;; (_heading2_marker) @markup.heading.marker  
;; etc.

;; =============================================================================
;; DELIMITED BLOCKS
;; =============================================================================

;; Block fences - highlighting the open/close delimiters
(example_block 
  (example_open) @punctuation.special
  (example_close) @punctuation.special)
(#set! "priority" 110)

(listing_block 
  (listing_open) @punctuation.special
  (listing_close) @punctuation.special)
(#set! "priority" 110)

(literal_block 
  (literal_open) @punctuation.special
  (literal_close) @punctuation.special)
(#set! "priority" 110)

(quote_block 
  (quote_open) @punctuation.special
  (quote_close) @punctuation.special)
(#set! "priority" 110)

(sidebar_block 
  (sidebar_open) @punctuation.special
  (sidebar_close) @punctuation.special)
(#set! "priority" 110)

(passthrough_block 
  (passthrough_open) @punctuation.special
  (passthrough_close) @punctuation.special)
(#set! "priority" 110)

(open_block 
  (openblock_open) @punctuation.special
  (openblock_close) @punctuation.special)
(#set! "priority" 110)

(table_block 
  (table_open) @punctuation.special
  (table_close) @punctuation.special)
(#set! "priority" 110)

;; Block content highlighting based on type
(listing_block (block_content) @markup.raw.block)
(literal_block (block_content) @markup.raw.block)
(quote_block (block_content) @markup.quote)
(passthrough_block (block_content) @markup.raw.block)

;; =============================================================================
;; ATTRIBUTE ENTRIES AND REFERENCES
;; =============================================================================

;; Attribute declarations (:name: value) - use modern @attribute
(attribute_entry
  (name) @attribute
  (value) @string)

;; Attribute references ({name}) - highlight braces and name separately  
(attribute_reference) @attribute

;; =============================================================================
;; INLINE FORMATTING
;; =============================================================================

;; Strong/bold text (*text*) - delimiter-separated captures
(strong_constrained
  (strong_open) @punctuation.special
  (strong_text) @markup.strong
  (strong_close) @punctuation.special)
(#set! "priority" 112)

;; Strong fallback for unclosed formatting
(strong) @markup.strong

;; Emphasis/italic text (_text_) - delimiter-separated captures
(emphasis_constrained
  (emphasis_open) @punctuation.special
  (emphasis_text) @markup.italic
  (emphasis_close) @punctuation.special)
(#set! "priority" 112)

;; Emphasis fallback for unclosed formatting
(emphasis) @markup.italic

;; Monospace/code text (`text`) - delimiter-separated captures
(monospace_constrained
  (monospace_open) @punctuation.special
  (monospace_text) @markup.raw.inline
  (monospace_close) @punctuation.special)
(#set! "priority" 112)

;; Monospace fallback for unclosed formatting
(monospace) @markup.raw.inline

;; Superscript (^text^) and subscript (~text~) - delimiter-separated captures
(superscript
  (superscript_open) @punctuation.special
  (superscript_text) @string.special
  (superscript_close) @punctuation.special)

(subscript
  (subscript_open) @punctuation.special
  (subscript_text) @string.special
  (subscript_close) @punctuation.special)

;; =============================================================================
;; LINKS AND CROSS-REFERENCES
;; =============================================================================

;; Auto links (bare URLs)
(auto_link) @markup.link.url

;; Internal cross-references (<<target,text>>) - enhanced for future parsing
(internal_xref) @markup.link
;; Note: Currently token-based. Future enhancement could parse:
;; - Target ID: @markup.link.url or @label
;; - Reference text: @markup.link.label  
;; - Angle brackets: @punctuation.bracket

;; External cross-references (xref:target[text]) - treated as macros with high priority
(external_xref) @function.macro
(#set! "priority" 108)

;; Link macros (link:url[text]) - treated as macros 
(link) @function.macro
(link_macro) @function.macro

;; =============================================================================
;; ANCHORS
;; =============================================================================

;; Block and inline anchors - enhanced with bracket highlighting
(anchor (id) @label)
(anchor (anchor_text) @markup.link.label)

;; Inline anchors - token-based parsing with bracket separation
(inline_anchor) @label

;; Future enhancement: Parse [[id]] and [[id,text]] with separate bracket captures
;; Current: token-based /\[\[[A-Za-z_][A-Za-z0-9_-]*,[^\]\r\n]+\]\]/ and /\[\[[A-Za-z_][A-Za-z0-9_-]*\]\]/

;; =============================================================================
;; IMAGES AND MEDIA
;; =============================================================================

;; Image macros (image::target[alt] and image:target[alt])
(image) @function.macro
(block_image) @function.macro

;; =============================================================================
;; PASSTHROUGHS - Enhanced delimiter and content highlighting
;; =============================================================================

;; Inline passthrough with triple plus (+++content+++)
(passthrough_triple_plus) @markup.raw.inline
(#set! "priority" 108)

;; Pass macro variants (pass:[content] and pass:substitution[content])
(pass_macro) @function.macro
(#set! "priority" 108)

;; Passthrough block content - already handled in DELIMITED BLOCKS section
;; See passthrough_block content highlighting above

;; Note: Current grammar uses token-based passthrough parsing.
;; Inline formatting delimiters (strong, emphasis, monospace, superscript, subscript)
;; now use structured parsing with separate delimiter nodes for enhanced highlighting.

;; =============================================================================
;; LISTS
;; =============================================================================

;; List items
(unordered_list_item) @markup.list
(ordered_list_item) @markup.list 
(description_item) @markup.list

;; List markers (external tokens) - high priority to ensure visibility
;; Note: Current grammar may not expose these as separate nodes
;; (_LIST_UNORDERED_MARKER) @markup.list.marker
;; (_LIST_ORDERED_MARKER) @markup.list.marker
;; (DESCRIPTION_LIST_SEP) @markup.list.marker
;; (#set! "priority" 105)

;; List continuation markers
;; (LIST_CONTINUATION) @punctuation.special
;; (#set! "priority" 105)

;; Callout lists
(callout_item) @markup.list
(callout_item (CALLOUT_MARKER) @markup.list.marker)

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
(table_cell (cell_content) @string)

;; Cell specifications (colspan, rowspan, format) - enhanced
(cell_spec) @operator
(span_spec) @number  
(format_spec) @operator

;; Table fences already handled in DELIMITED BLOCKS section

;; =============================================================================
;; MACROS AND SPECIAL CONSTRUCTS
;; =============================================================================

;; =============================================================================
;; UI MACROS - Enhanced for interactive elements
;; =============================================================================

;; UI interaction macros - prioritized for visibility
(ui_kbd) @function.macro
(ui_btn) @function.macro 
(ui_menu) @function.macro
(#set! "priority" 108)

;; Note: Current grammar uses token-based UI macro parsing:
;; - ui_kbd: /kbd:\[[^\]]*\]/  - keyboard shortcuts (e.g., kbd:[Ctrl+C])
;; - ui_btn: /btn:\[[^\]]*\]/  - UI buttons (e.g., btn:[Save])
;; - ui_menu: /menu:[^\[\r\n]+\[[^\]]*\]/  - menu paths (e.g., menu:File[Save As])
;;
;; Future enhancement: Component-level UI macro highlighting would enable:
;; - Macro names (kbd, btn, menu) → @function.macro
;; - Button/key text → @string.special
;; - Menu path separators (>, +) → @punctuation.delimiter
;; - Brackets → @punctuation.bracket
;;
;; Example structured queries:
;; ((ui_macro (name) @function.macro (text) @string.special))
;; ((ui_menu (path_sep) @punctuation.delimiter))

;; Math macros and content - enhanced
(math_macro) @function.macro
(math_content) @markup.math

;; Math block labels
(stem_block_label) @attribute
(latexmath_block_label) @attribute  
(asciimath_block_label) @attribute
(#set! "priority" 108)

;; =============================================================================
;; FOOTNOTES - Enhanced component-level highlighting
;; =============================================================================

;; Footnote macros - all variants with consistent highlighting
(footnote_inline) @function.macro
(footnote_ref) @function.macro  
(footnoteref) @function.macro
(#set! "priority" 108)

;; Note: Current grammar uses token-based footnote parsing:
;; - footnote_inline: /footnote:\[[^\]]*\]/ 
;; - footnote_ref: /footnote:[A-Za-z0-9_-]+\[[^\]]*\]/
;; - footnoteref: /footnoteref:[A-Za-z0-9_-]+\[[^\]]*\]/
;;
;; For enhanced component highlighting, the grammar would need structured parsing:
;; - Macro names (footnote, footnoteref) → @function.macro
;; - Footnote IDs → @label
;; - Footnote text → @string
;; - Brackets and colons → @punctuation.bracket, @punctuation.delimiter
;; 
;; Future enhancement example:
;; ((footnote (name) @function.macro (id) @label (text) @string))
;; ((footnote_brackets (open) @punctuation.bracket (close) @punctuation.bracket))

;; Index terms
(index_term_macro) @function.macro
(index_term2_macro) @function.macro
(concealed_index_term) @function.macro
(index_text primary: (index_term_text) @label)
(index_text secondary: (index_term_text) @label)
(index_text tertiary: (index_term_text) @label)

;; Bibliography - enhanced with citation types
(bibliography_entry (bibliography_id) @label)
(bibliography_entry (bibliography_citation) @string)
(bibliography_entry (bibliography_description) @string)

;; Bibliography references in text
(bibliography_reference (bibliography_ref_id) @label)

;; Bibliography entry structure highlighting
;; Note: The triple bracket syntax [[[id]]] uses structured parsing
;; Future enhancement: separate bracket highlighting as @punctuation.bracket

;; Include directives - enhanced priority
(include_directive (include_path) @string.special.path)
(include_directive (include_options) @attribute)
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
;; ROLE SPANS AND STYLING  
;; =============================================================================

;; Role spans - token-based, parse into components when possible
(role_span) @punctuation.special
;; Note: This is token-based currently: /\[[A-Za-z][A-Za-z0-9_.-]*\]#[^#\r\n]+#/
;; Would benefit from structured parsing to highlight role name vs content

;; =============================================================================
;; MACROS - Comprehensive macro component highlighting
;; =============================================================================

;; All inline and block macros with consistent priority for visibility
(image) @function.macro
(block_image) @function.macro
(link) @function.macro
(link_macro) @function.macro
(external_xref) @function.macro
(index_term_macro) @function.macro
(index_term2_macro) @function.macro
(concealed_index_term) @function.macro
(pass_macro) @function.macro
(math_macro) @function.macro
(#set! "priority" 108)

;; Note: Current grammar uses token-based macro parsing for most constructs:
;; - link_macro: /link:[^\[\r\n]+\[[^\]]*\]/
;; - image: /image:[^\[\r\n]+\[[^\]]*\]/  
;; - ui_kbd: /kbd:\[[^\]]*\]/
;; - ui_btn: /btn:\[[^\]]*\]/
;; - ui_menu: /menu:[^\[\r\n]+\[[^\]]*\]/
;; - math_macro: /stem:\[[^\]]*\]/, /latexmath:\[[^\]]*\]/, /asciimath:\[[^\]]*\]/
;; - pass_macro: /pass:\[[^\]]*\]/
;;
;; Future enhancement: Structured macro parsing would enable component-level highlighting:
;; - Macro names: @function.macro
;; - Targets (URLs): @string.special.url
;; - Targets (paths): @string.special.path  
;; - IDs/refs: @label
;; - Attribute lists: keys @attribute, values @string/number, separators @punctuation.delimiter
;; - Brackets and colons: @punctuation.bracket, @punctuation.delimiter
;;
;; Example structured queries:
;; ((inline_macro (name) @function.macro (target (url)) @string.special.url))
;; ((inline_macro (name) @function.macro (target (path)) @string.special.path))
;; ((macro_attributes (attribute (name) @attribute (value) @string)))

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

;; =============================================================================
;; OPTIONAL LEGACY COMPATIBILITY
;; =============================================================================

;; For themes that don't support modern @markup.* captures, add minimal fallbacks
;; These are duplicates with lower priority to avoid conflicts

;; Legacy text formatting fallbacks
(strong) @text.strong
(emphasis) @text.emphasis
(monospace) @text.literal
(#set! "priority" 50)

;; Legacy markup fallbacks 
(section_title (title) @text.title)
(block_content) @text.literal
(#set! "priority" 50)
