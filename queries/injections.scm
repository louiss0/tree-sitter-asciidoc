; queries/injections.scm

<<<<<<< HEAD
; Markdown-style fenced code blocks with ` ``` `
; Capture language from the fence open line
((fenced_code_block
  (backtick_fence_open) @_fence
  (block_content) @injection.content)
 (#match? @_fence "```\\s*(\\w+)")
 (#set! injection.language "\\1"))

; AsciiDoc-style listing blocks with [source,language]
((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
 (#match? @_attr "\\[source,\\s*(\\w+)")
 (#set! injection.language "\\1"))

; Fallback: any fenced_code_block without language gets "text"
((fenced_code_block
  (block_content) @injection.content)
 (#set! injection.language "text"))

; Fallback: any listing_block without metadata gets "text"
((listing_block
  (block_content) @injection.content)
 (#set! injection.language "text"))
=======
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
>>>>>>> develop
