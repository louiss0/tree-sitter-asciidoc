; ============================================================================
; AsciiDoc Language Injection Queries
; ============================================================================
; Enables syntax highlighting for embedded code in various languages

; ============================================================================
; FENCED CODE BLOCKS - Markdown-style (```language)
; ============================================================================

; Direct language specification via info_string
((fenced_code_block
  (code_fence_open
    (info_string
      language: (language) @injection.language))
  content: (code) @injection.content)
 (#set! injection.combined))

; ============================================================================
; LISTING BLOCKS - AsciiDoc-style with [source,language]
; ============================================================================

; Extract language from source_block_attributes
((listing_block
  (metadata
    (block_attributes
      (source_block_attributes
        language: (language_identifier) @injection.language)))
  content: (block_content) @injection.content)
 (#set! injection.combined))

; ============================================================================
; FALLBACK PATTERNS - For blocks using generic attribute_content
; ============================================================================

; Python
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,python")))
  content: (block_content) @injection.content)
 (#set! injection.language "python")
 (#set! injection.combined))

; JavaScript / TypeScript
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,(javascript|js|typescript|ts)")))
  content: (block_content) @injection.content)
 (#set! injection.language "javascript")
 (#set! injection.combined))

; Rust
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,rust")))
  content: (block_content) @injection.content)
 (#set! injection.language "rust")
 (#set! injection.combined))

; Go
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,go(lang)?")))
  content: (block_content) @injection.content)
 (#set! injection.language "go")
 (#set! injection.combined))

; C / C++
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,c(\\+\\+)?")))
  content: (block_content) @injection.content)
 (#set! injection.language "c")
 (#set! injection.combined))

; Java
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,java")))
  content: (block_content) @injection.content)
 (#set! injection.language "java")
 (#set! injection.combined))

; Ruby
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,ruby")))
  content: (block_content) @injection.content)
 (#set! injection.language "ruby")
 (#set! injection.combined))

; PHP
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,php")))
  content: (block_content) @injection.content)
 (#set! injection.language "php")
 (#set! injection.combined))

; Shell / Bash
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,(bash|sh|shell)")))
  content: (block_content) @injection.content)
 (#set! injection.language "bash")
 (#set! injection.combined))

; JSON
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,json")))
  content: (block_content) @injection.content)
 (#set! injection.language "json")
 (#set! injection.combined))

; YAML
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,ya?ml")))
  content: (block_content) @injection.content)
 (#set! injection.language "yaml")
 (#set! injection.combined))

; TOML
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,toml")))
  content: (block_content) @injection.content)
 (#set! injection.language "toml")
 (#set! injection.combined))

; XML
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,xml")))
  content: (block_content) @injection.content)
 (#set! injection.language "xml")
 (#set! injection.combined))

; HTML
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,html")))
  content: (block_content) @injection.content)
 (#set! injection.language "html")
 (#set! injection.combined))

; CSS
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,css")))
  content: (block_content) @injection.content)
 (#set! injection.language "css")
 (#set! injection.combined))

; SQL
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,sql")))
  content: (block_content) @injection.content)
 (#set! injection.language "sql")
 (#set! injection.combined))

; Markdown
((listing_block
  (metadata 
    (block_attributes
      content: (attribute_content) @_lang
      (#match? @_lang "source,(markdown|md)")))
  content: (block_content) @injection.content)
 (#set! injection.language "markdown")
 (#set! injection.combined))

; ============================================================================
; MATH MACROS - LaTeX/MathML
; ============================================================================

; Math macros inject LaTeX for rendering
((math_macro) @injection.content
 (#set! injection.language "latex"))

; ============================================================================
; PASSTHROUGH BLOCKS - HTML content
; ============================================================================

; Passthrough blocks typically contain raw HTML
((passthrough_block
  content: (block_content) @injection.content)
 (#set! injection.language "html")
 (#set! injection.combined))
