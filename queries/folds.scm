; AsciiDoc code folding - enhanced patterns

; Fold sections with better precision
(section 
  (section_title)
  (_ (_)*)? @fold)

; Fold delimited blocks - content only
(example_block 
  (block_content) @fold)

(listing_block 
  (block_content) @fold)
  
(literal_block 
  (block_content) @fold)
  
(quote_block 
  (block_content) @fold)
  
(sidebar_block 
  (block_content) @fold)
  
(passthrough_block 
  (block_content) @fold)
  
(open_block 
  (block_content) @fold)

; Fold tables - content only
(table_block 
  (table_content) @fold)

; Fold comments
(block_comment) @fold

; Fold conditional blocks if they exist
(conditional_block) @fold

; Fold lists - only if multiple items
(unordered_list 
  (unordered_list_item)
  (unordered_list_item)+ @fold)
  
(ordered_list 
  (ordered_list_item) 
  (ordered_list_item)+ @fold)
  
(description_list 
  (description_item)
  (description_item)+ @fold)

; Fold list continuations
(list_item_continuation) @fold
