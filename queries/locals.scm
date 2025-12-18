<<<<<<< HEAD
; ============================================================================
; AsciiDoc Locals Queries
; ============================================================================
; Defines scopes for LSP features
; Simplified to only include valid node types

; ============================================================================
; SCOPES - Define hierarchical scope boundaries
; ============================================================================

; Document root is the top-level scope
(source_file) @local.scope

; Sections create nested scopes
(section) @local.scope

; Delimited blocks create local scopes
(example_block) @local.scope
(listing_block) @local.scope
(fenced_code_block) @local.scope
(literal_block) @local.scope
(asciidoc_blockquote) @local.scope
(markdown_blockquote) @local.scope
(sidebar_block) @local.scope
(passthrough_block) @local.scope
(open_block) @local.scope

; Conditional blocks create scopes
(ifdef_block) @local.scope
(ifndef_block) @local.scope
(ifeval_block) @local.scope

; Tables create scopes
(table_block) @local.scope
=======
; queries/locals.scm

(attribute_entry
  (attribute_name) @definition.constant)

(attribute_substitution
  (plain_text) @reference.constant)

(anchor)        @definition.label
(inline_anchor) @definition.label

(internal_xref
  (xref_target) @reference.label)

(bibliography_entry
  (bibliography_id) @definition.label)
>>>>>>> develop
