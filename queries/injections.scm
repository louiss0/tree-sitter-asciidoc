; queries/injections.scm

(listing_block
  (source_block_attributes
    (source_language) @injection.language)
  (block_content) @injection.content
  (#set! injection.include-children))

(listing_block
  (block_content) @injection.content)

(literal_block
  (block_content) @injection.content)

(passthrough_block
  (block_content) @injection.content)

(example_block
  (block_content) @injection.content)

(asciidoc_blockquote
  (block_content) @injection.content)

(open_block
  (block_content) @injection.content)

(sidebar_block
  (block_content) @injection.content)
