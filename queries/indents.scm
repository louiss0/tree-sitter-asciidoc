; ============================================================================
; AsciiDoc Indentation Queries
; ============================================================================
; Controls automatic indentation behavior in editors

; ============================================================================
; DELIMITED BLOCKS - Indent content between opening and closing delimiters
; ============================================================================

; Example blocks
(example_block
  open: (_) @indent.begin
  close: (_) @indent.end)

; Listing blocks
(listing_block
  open: (_) @indent.begin
  close: (_) @indent.end)

; Fenced code blocks
(fenced_code_block
  open: (_) @indent.begin
  close: (_) @indent.end)

; Literal blocks
(literal_block
  open: (_) @indent.begin
  close: (_) @indent.end)

; Quote blocks
(quote_block
  open: (_) @indent.begin
  close: (_) @indent.end)

; Sidebar blocks
(sidebar_block
  open: (_) @indent.begin
  close: (_) @indent.end)

; Passthrough blocks
(passthrough_block
  open: (_) @indent.begin
  close: (_) @indent.end)

; Open blocks
(open_block
  open: (_) @indent.begin
  close: (_) @indent.end)

; ============================================================================
; CONDITIONAL BLOCKS
; ============================================================================

(ifdef_block
  open: (_) @indent.begin
  close: (_)? @indent.end)

(ifndef_block
  open: (_) @indent.begin
  close: (_)? @indent.end)

(ifeval_block
  open: (_) @indent.begin
  close: (_)? @indent.end)

; ============================================================================
; TABLES
; ============================================================================

(table_block
  open: (_) @indent.begin
  close: (_) @indent.end)

; Indent table rows
(table_row) @indent

; ============================================================================
; LISTS - Indent list item content
; ============================================================================

; AsciiDoc unordered list items
(asciidoc_unordered_list_item
  marker: (_)
  content: (_) @indent)

; Markdown unordered list items
(markdown_unordered_list_item
  marker: (_)
  content: (_) @indent)

; AsciiDoc checklist items
(asciidoc_checklist_item
  marker: (_)
  content: (_) @indent)

; Markdown checklist items
(markdown_checklist_item
  marker: (_)
  content: (_) @indent)

; Ordered list items
(ordered_list_item
  marker: (_)
  content: (_) @indent)

; Description list items
(description_item
  marker: (_)
  (_) @indent)

; List continuations (+ followed by attached block)
(list_item_continuation) @indent

; ============================================================================
; SECTIONS - Indent section content
; ============================================================================

(section
  (section_title)
  (_)+ @indent)

; ============================================================================
; BLOCK METADATA - Maintain indent for metadata lines
; ============================================================================

(metadata) @indent.auto
(block_attributes) @indent.auto
(block_title) @indent.auto
