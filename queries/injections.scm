; AsciiDoc language injections for embedded syntax highlighting

; Language-specific code blocks - Now supported!
; Extract language from [source,language] attributes
; TODO: Fix this query - source_block_attributes structure changed
;(listing_block
;  (metadata
;    (block_attributes
;      (source_block_attributes
;        language: (language_identifier) @injection.language)))
;  content: (block_content) @injection.content)

; Fallback: Generic source blocks with language detection from content
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,python")))
  content: (block_content) @injection.content)
 (#set! injection.language "python"))

((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,javascript")))
  content: (block_content) @injection.content)
 (#set! injection.language "javascript"))

((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,rust")))
  content: (block_content) @injection.content)
 (#set! injection.language "rust"))

((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,json")))
  content: (block_content) @injection.content)
 (#set! injection.language "json"))

((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,yaml")))
  content: (block_content) @injection.content)
 (#set! injection.language "yaml"))

((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,html")))
  content: (block_content) @injection.content)
 (#set! injection.language "html"))

((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,css")))
  content: (block_content) @injection.content)
 (#set! injection.language "css"))

((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,go")))
  content: (block_content) @injection.content)
 (#set! injection.language "go"))

((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,bash")))
  content: (block_content) @injection.content)
 (#set! injection.language "bash"))

; Math content injection - specific language detection
; Stem inline macro - default to asciimath
(stem_inline) @injection.content
(#set! injection.language "text")  ; fallback to text since asciimath isn't widely supported

; LaTeX math inline macro
(latexmath_inline) @injection.content
(#set! injection.language "latex")

; AsciiMath inline macro  
(asciimath_inline) @injection.content
(#set! injection.language "text")  ; fallback to text since asciimath isn't widely supported

; Math block detection via attributes and passthrough content
; Stem blocks (default to asciimath but use text fallback)
((passthrough_block
  (metadata
    (block_attributes
      content: (attribute_content) @_attr))
  content: (block_content) @injection.content)
 (#match? @_attr "stem")
 (#set! injection.language "text"))

; LaTeX math blocks
((passthrough_block
  (metadata
    (block_attributes
      content: (attribute_content) @_attr))
  content: (block_content) @injection.content)
 (#match? @_attr "latexmath")
 (#set! injection.language "latex"))

; AsciiMath blocks
((passthrough_block
  (metadata
    (block_attributes
      content: (attribute_content) @_attr))
  content: (block_content) @injection.content)
 (#match? @_attr "asciimath")
 (#set! injection.language "text"))

; Generic code blocks without language specification
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