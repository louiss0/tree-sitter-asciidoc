; AsciiDoc language injections
; Inject appropriate languages into source blocks based on language attributes

; Note: This grammar doesn't currently expose language attributes in a way
; that's easy to capture with queries, so these injections may need updates
; when the grammar is enhanced to better support language-specific source blocks

; Generic source blocks (listing_block) - inject as text by default
((listing_block 
  content: (block_content) @injection.content)
 (#set! injection.language "text"))

; Generic literal blocks - inject as text
((literal_block
  content: (block_content) @injection.content)
 (#set! injection.language "text"))

; Math blocks - inject appropriate math languages
((math_content) @injection.content
 (#set! injection.language "latex"))

; TODO: When grammar is enhanced to expose language attributes:
; - Capture [source,javascript] as @injection.language "javascript"  
; - Capture [source,python] as @injection.language "python"
; - Capture [source,go] as @injection.language "go"
; - Capture [source,rust] as @injection.language "rust"
; - Capture [source,html] as @injection.language "html"
; - Capture [source,css] as @injection.language "css"
; - Capture [source,json] as @injection.language "json"
; - Capture [source,yaml] as @injection.language "yaml"
; - Capture [source,bash] as @injection.language "bash"
; - etc.
