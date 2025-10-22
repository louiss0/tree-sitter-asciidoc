; ============================================================================
; AsciiDoc Locals Queries
; ============================================================================
; Defines scopes, definitions, and references for LSP features
; Enables go-to-definition, find-references, and symbol search

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
(quote_block) @local.scope
(sidebar_block) @local.scope
(passthrough_block) @local.scope
(open_block) @local.scope

; Conditional blocks create scopes
(ifdef_block) @local.scope
(ifndef_block) @local.scope
(ifeval_block) @local.scope

; Tables create scopes
(table_block) @local.scope

; ============================================================================
; DEFINITIONS - Symbols that can be referenced
; ============================================================================

; Anchor definitions - [[id]] or [[id,text]]
(anchor
  id: (inline_anchor_id) @local.definition.label
  (#set! definition.label.scope "parent"))

(inline_anchor
  (inline_anchor_id) @local.definition.label
  (#set! definition.label.scope "parent"))

; Bibliography entries - [[[id]]]
(bibliography_entry
  id: (bibliography_id) @local.definition.label
  (#set! definition.label.scope "parent"))

; Attribute definitions - :name: value
(attribute_entry
  name: (name) @local.definition.constant
  (#set! definition.constant.scope "global"))

; Section titles as definitions (for outline/navigation)
(section_title
  (title) @local.definition.type
  (#set! definition.type.scope "parent"))

; ============================================================================
; REFERENCES - Uses of defined symbols
; ============================================================================

; Internal cross-references - <<anchor>>
(internal_xref) @local.reference

; External cross-references - xref:file[text]
(external_xref) @local.reference

; Attribute references - {name}
(attribute_reference) @local.reference

; ============================================================================
; IMPORTS - Include directives
; ============================================================================

; Include directives import external content
(include_directive
  path: (include_path) @local.import)
