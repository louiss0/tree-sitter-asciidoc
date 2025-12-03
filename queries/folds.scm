; AsciiDoc code folding - enhanced patterns

; Fold sections (all heading levels)
(section
  (section_level_2
    content: (_)+ @fold))
(section
  (section_level_3
    content: (_)+ @fold))
(section
  (section_level_4
    content: (_)+ @fold))
(section
  (section_level_5
    content: (_)+ @fold))
(section
  (section_level_6
    content: (_)+ @fold))

; Fold delimited blocks - content only
(example_block
  (block_content) @fold)

(listing_block
  (block_content) @fold)

(literal_block
  (block_content) @fold)

(asciidoc_blockquote
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


; Fold list continuations
(list_item_continuation) @fold
