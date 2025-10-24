; ============================================================================
; AsciiDoc Code Folding Queries
; ============================================================================
; Comprehensive folding patterns for all block types and structures

; ============================================================================
; SECTIONS - Fold section content
; ============================================================================

; Fold section bodies (content after title)
(section 
  (section_title)
  (_)+ @fold) @fold

; ============================================================================
; DELIMITED BLOCKS - Fold block content between delimiters
; ============================================================================

; Example blocks (====)
(example_block 
  open: (_)
  content: (block_content)? @fold
  close: (_))

; Listing blocks (----)
(listing_block 
  open: (_)
  content: (block_content)? @fold
  close: (_))

; Fenced code blocks (```)
(fenced_code_block
  open: (_)
  content: (code)? @fold
  close: (_))

; Literal blocks (....)
(literal_block 
  open: (_)
  content: (block_content) @fold
  close: (_))

; Quote blocks (____)
(quote_block 
  open: (_)
  content: (block_content) @fold
  close: (_))

; Sidebar blocks (****)
(sidebar_block 
  open: (_)
  content: (block_content) @fold
  close: (_))

; Passthrough blocks (++++)
(passthrough_block 
  open: (_)
  content: (block_content) @fold
  close: (_))

; Open blocks (--)
(open_block 
  open: (_)
  content: (block_content) @fold
  close: (_))

; ============================================================================
; CONDITIONAL BLOCKS - Fold ifdef/ifndef/ifeval blocks
; ============================================================================

(ifdef_block
  open: (_)
  (_)* @fold
  close: (_)?)

(ifndef_block
  open: (_)
  (_)* @fold
  close: (_)?)

(ifeval_block
  open: (_)
  (_)* @fold
  close: (_)?)

; ============================================================================
; TABLES - Fold table content
; ============================================================================

(table_block 
  open: (_)
  content: (table_content)? @fold
  close: (_))

; ============================================================================
; LISTS - Fold when multiple items exist
; ============================================================================

; AsciiDoc unordered lists
(asciidoc_unordered_list 
  (asciidoc_unordered_list_item)+
  (asciidoc_unordered_list_item)+ @fold)

; Markdown unordered lists
(markdown_unordered_list 
  (markdown_unordered_list_item)+
  (markdown_unordered_list_item)+ @fold)

; Ordered lists
(ordered_list 
  (ordered_list_item)
  (ordered_list_item)+ @fold)

; AsciiDoc checklists
(asciidoc_checklist 
  (asciidoc_checklist_item)+
  (asciidoc_checklist_item)+ @fold)

; Markdown checklists
(markdown_checklist 
  (markdown_checklist_item)+
  (markdown_checklist_item)+ @fold)

; Description lists
(description_list 
  (description_item)
  (description_item)+ @fold)

; List item continuations (attached blocks)
(list_item_continuation) @fold

; ============================================================================
; COMMENTS - Fold comment blocks
; ============================================================================

(block_comment) @fold
