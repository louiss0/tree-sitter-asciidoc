; AsciiDoc language injections for embedded syntax highlighting

; Code blocks with language specified in metadata
; TODO: This would require parsing block attributes to detect language
; For now, we'll use simpler patterns

; Math content injection (math_macro is a simple token)
(math_macro) @injection.content
(#set! injection.language "latex")

; Generic code blocks (listing blocks often contain code)
(listing_block
  (block_content) @injection.content
  (#set! injection.language "text"))

; Literal blocks for configuration or data
(literal_block
  (block_content) @injection.content  
  (#set! injection.language "text"))

; Passthrough blocks may contain HTML or other markup
(passthrough_block
  (block_content) @injection.content
  (#set! injection.language "html"))

; Inline code spans - generic
(monospace_content) @injection.content
(#set! injection.language "text")

; Attribute values that might contain code or paths
(value) @injection.content
(#match? @injection.content "^[a-zA-Z]+:")
(#set! injection.language "text")

; Include directive paths
(include_path) @injection.content
(#set! injection.language "text")