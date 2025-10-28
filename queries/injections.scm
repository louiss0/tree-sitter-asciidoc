; AsciiDoc language injections for embedded syntax highlighting

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
