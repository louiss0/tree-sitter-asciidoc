; AsciiDoc code folding

; Fold sections
(section) @fold

; Fold delimited blocks
(example_block) @fold
(listing_block) @fold
(literal_block) @fold
(quote_block) @fold
(sidebar_block) @fold
(passthrough_block) @fold
(open_block) @fold

; Fold tables
(table_block) @fold

; Fold comments
(block_comment) @fold

; Fold conditional blocks
(ifdef_block) @fold
(ifndef_block) @fold
(ifeval_block) @fold

; Fold lists with continuations
(unordered_list_item
  (list_item_continuation) @fold) @fold

(ordered_list_item
  (list_item_continuation) @fold) @fold

(description_item
  (list_item_continuation) @fold) @fold

; Fold complex lists
(unordered_list) @fold
(ordered_list) @fold
(description_list) @fold
