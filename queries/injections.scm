; AsciiDoc language injections for embedded syntax highlighting

; Language-specific code blocks - Now supported!
; Extract language from [source,language] attributes
; TODO: Fix this query - source_block_attributes structure changed
;(listing_block
;  (metadata
;    (block_attributes
;      (source_block_attributes
;        language: (language_identifier) @injection.language)))
;  (block_content) @injection.content)

; Fallback: Generic source blocks with language detection from content
((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "source,python")
 (#set! injection.language "python"))

((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "source,javascript")
 (#set! injection.language "javascript"))

((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "source,rust")
 (#set! injection.language "rust"))

((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "source,json")
 (#set! injection.language "json"))

((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "source,yaml")
 (#set! injection.language "yaml"))

((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "source,html")
 (#set! injection.language "html"))

((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "source,css")
 (#set! injection.language "css"))

((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "source,go")
 (#set! injection.language "go"))

((listing_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "source,bash")
 (#set! injection.language "bash"))

; Math content injection - specific language detection via inline macros
((inline_macro
   name: (macro_name) @math_macro_name
   body: (macro_body) @injection.content)
 (#match? @math_macro_name "^stem$")
 (#set! injection.language "text"))  ; fallback to text since asciimath isn't widely supported

((inline_macro
   name: (macro_name) @math_macro_name
   body: (macro_body) @injection.content)
 (#match? @math_macro_name "^latexmath$")
 (#set! injection.language "latex"))

((inline_macro
   name: (macro_name) @math_macro_name
   body: (macro_body) @injection.content)
 (#match? @math_macro_name "^asciimath$")
 (#set! injection.language "text"))  ; fallback to text since asciimath isn't widely supported

; Math block detection via attributes and passthrough content
; Stem blocks (default to asciimath but use text fallback)
((passthrough_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "stem")
 (#set! injection.language "text"))

; LaTeX math blocks
((passthrough_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
(#match? @_attr "latexmath")
 (#set! injection.language "latex"))

; AsciiMath blocks
((passthrough_block
  (metadata
    (block_attributes) @_attr)
  (block_content) @injection.content)
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
