; queries/highlights.scm
; Generated to match grammar.js without nested folder structure

; =========================
; Comments
; =========================
(comment) @comment


; =========================
; Headings & titles
; =========================
(document_title_marker) @markup.heading
(document_title_text)   @markup.heading

(section_marker_2) @markup.heading
(section_marker_3) @markup.heading
(section_marker_4) @markup.heading
(section_marker_5) @markup.heading
(section_marker_6) @markup.heading

(title)       @markup.heading
(block_title) @markup.heading

(author_name)         @string
(author_email)        @string
(revision_version)    @number
(revision_date)       @number
(revision_remark)     @string


; =========================
; Attribute entries
; =========================
(attribute_name)  @property
(attribute_value) @string

(source_block_attributes) @attribute
(source_attribute_keyword) @keyword
(source_language) @type


; =========================
; Attribute substitutions
; =========================
(attribute_substitution
  (plain_left_brace)  @punctuation.bracket
  (plain_right_brace) @punctuation.bracket)

; {name}
(attribute_substitution
  (plain_text) @constant)

; {ns:name}
(attribute_substitution
  (plain_text)  @constant
  (plain_colon) @punctuation.delimiter
  (plain_text)  @constant)


; =========================
; Admonitions
; =========================
(admonition_label) @keyword

(inline_admonition
  (admonition_label) @keyword
  (plain_colon)       @punctuation.delimiter)


; =========================
; Lists + continuation
; =========================
(unordered_list_marker) @markup.list
(ordered_list_marker)   @markup.list
(checklist_marker)      @markup.list
(LIST_CONTINUATION)     @markup.list

(callout_marker) @markup.list


; =========================
; Description lists
; =========================
(description_list) @none

(description_item_term)       @markup.list
(description_item_definition) @markup.list


; =========================
; Callouts
; =========================
(callout_marker) @markup.list


; =========================
; Links / xrefs / anchors
; =========================
(auto_link) @markup.link.url

(explicit_link
  (auto_link) @markup.link.url
  (plain_left_bracket)  @punctuation.bracket
  ((link_text) @markup.link.label)?
  (plain_right_bracket) @punctuation.bracket)

(internal_xref
  "<<" @punctuation.special
  (xref_target) @markup.link
  ((plain_comma) @punctuation.delimiter (xref_text) @markup.link.label)?
  ">>" @punctuation.special)

(inline_anchor) @markup.link
(anchor)        @markup.link

(bibliography_entry) @markup.link
(bibliography_entry
  (bibliography_id) @definition.label)
(bibliography_entry
  (bibliography_text) @string)


; =========================
; Inline formatting
; =========================
(strong)       @markup.bold
(emphasis)     @markup.italic
(monospace)    @markup.raw
(superscript)  @markup.superscript
(subscript)    @markup.subscript
(highlight)    @markup.highlight

(passthrough_triple_plus) @markup.raw

(role_attribute_list) @attribute

; =========================
; Punctuation
; =========================
(plain_dot) @punctuation.delimiter


; =========================
; Macros
; =========================
(macro_name)  @function
(macro_body)  @string
(macro_close) @punctuation.bracket

(block_macro (macro_name) @function)
(inline_macro (macro_name) @function)


; =========================
; Index terms
; =========================
(index_term_macro)     @keyword
(index_term2_macro)    @keyword
(concealed_index_term) @keyword

(index_text)      @string
(index_term_text) @string

"indexterm:"  @keyword
"indexterm2:" @keyword
"((("         @punctuation.special
")))"         @punctuation.special


; =========================
; Conditionals / directives
; =========================
(ifdef_open)       @keyword
(ifndef_open)      @keyword
(ifeval_open)      @keyword
(endif_directive)  @keyword

(conditional_block) @keyword
(ifdef_block)       @keyword
(ifndef_block)      @keyword
(ifeval_block)      @keyword


; =========================
; Blocks: fences / markers
; =========================
(EXAMPLE_FENCE_START) @punctuation.special
(EXAMPLE_FENCE_END)   @punctuation.special

(LISTING_FENCE_START) @punctuation.special
(LISTING_FENCE_END)   @punctuation.special

(LITERAL_FENCE_START) @punctuation.special
(LITERAL_FENCE_END)   @punctuation.special

(QUOTE_FENCE_START) @punctuation.special
(QUOTE_FENCE_END)   @punctuation.special

(SIDEBAR_FENCE_START) @punctuation.special
(SIDEBAR_FENCE_END)   @punctuation.special

(PASSTHROUGH_FENCE_START) @punctuation.special
(PASSTHROUGH_FENCE_END)   @punctuation.special

(OPENBLOCK_FENCE_START) @punctuation.special
(OPENBLOCK_FENCE_END)   @punctuation.special

(TABLE_FENCE_START) @punctuation.special
(TABLE_FENCE_END)   @punctuation.special

(fenced_code_block_delimiter) @punctuation.special
(FENCED_CODE_CONTENT_LINE)    @string
(block_quote_marker) @markup.quote

(THEMATIC_BREAK) @punctuation.special
("<<<")          @punctuation.special


; =========================
; Tables
; =========================
(table_attributes) @attribute
(block_attributes) @attribute

(table_cell
  "|" @punctuation.delimiter)

(cell_spec) @attribute


; =========================
; General punctuation
; =========================
(plain_left_brace)    @punctuation.bracket
(plain_right_brace)   @punctuation.bracket
(plain_left_bracket)  @punctuation.bracket
(plain_right_bracket) @punctuation.bracket
(plain_left_paren)    @punctuation.bracket
(plain_right_paren)   @punctuation.bracket
(plain_colon)         @punctuation.delimiter
(plain_less_than)     @punctuation.bracket
(plain_greater_than)  @punctuation.bracket
(plain_caret)         @punctuation.special
(plain_dash)          @punctuation.delimiter
(plain_double_quote)  @punctuation.special
(plain_quote)         @punctuation.special
(plain_underscore)    @punctuation.delimiter
(plain_asterisk)      @punctuation.special

(hard_break) @punctuation.special
