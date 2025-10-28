; AsciiDoc indentation patterns

; Increase indent for content within blocks
[
  (example_block)
  (listing_block) 
  (literal_block)
  (asciidoc_blockquote)
  (markdown_blockquote)
  (sidebar_block)
  (passthrough_block)
  (open_block)
] @indent

; Increase indent for table content  
(table_block
  (table_content) @indent)

; Increase indent for list items
[
  (unordered_list_item)
  (ordered_list_item)
  (description_item)  
  (callout_item)
] @indent

; Increase indent for list continuations
(list_item_continuation) @indent

; Increase indent for section content
(section 
  (_ (_)*) @indent)

; Increase indent for conditional block content
(conditional_block) @indent

; Dedent at closing fences
[
  (example_close)
  (listing_close)
  (literal_close) 
  (asciidoc_blockquote_close)
  (sidebar_close)
  (passthrough_close)
  (openblock_close)
  (table_close)
] @outdent