; ============================================================================
; AsciiDoc Tags Queries
; ============================================================================
; Enables symbol navigation, outline views, and tags-based search
; Used by editors for document structure navigation and symbol lists

; ============================================================================
; SECTIONS - Hierarchical document structure
; ============================================================================

; Level 1 sections (= Title) - Top-level classes
(section
  (section_title
    (section_marker_1)
    (title) @name) @definition.class)

; Level 2 sections (== Title) - Major sections
(section
  (section_title
    (section_marker_2)
    (title) @name) @definition.class)

; Level 3 sections (=== Title) - Subsections
(section
  (section_title
    (section_marker_3)
    (title) @name) @definition.method)

; Level 4 sections (==== Title) - Minor subsections
(section
  (section_title
    (section_marker_4)
    (title) @name) @definition.method)

; Level 5 sections (===== Title) - Deep subsections
(section
  (section_title
    (section_marker_5)
    (title) @name) @definition.function)

; Level 6 sections (====== Title) - Deepest subsections
(section
  (section_title
    (section_marker_6)
    (title) @name) @definition.function)

; ============================================================================
; ANCHORS - Labeled reference points
; ============================================================================

; Block-level anchors - [[id]]
(anchor
  id: (inline_anchor_id) @name) @definition.label

; Inline anchors - [[id,text]]
(inline_anchor
  (inline_anchor_id) @name) @definition.label

; Bibliography entries - [[[id]]]
(bibliography_entry
  id: (bibliography_id) @name) @definition.label

; ============================================================================
; ATTRIBUTES - Document-wide variables
; ============================================================================

; Attribute definitions - :name: value
(attribute_entry
  name: (name) @name) @definition.constant

; ============================================================================
; CROSS-REFERENCES - Symbol references
; ============================================================================

; Internal cross-references - <<anchor>>
(internal_xref) @reference

; External cross-references - xref:file[text]
(external_xref) @reference

; Attribute references - {name}
(attribute_reference) @reference

; ============================================================================
; INCLUDES - External file imports
; ============================================================================

; Include directives - include::path[]
(include_directive
  path: (include_path) @name) @definition.import

; ============================================================================
; TABLES - Table definitions (for outline)
; ============================================================================

; Tables with titles
(table_block
  (metadata
    (block_title) @name) @definition.struct)

; ============================================================================
; DELIMITED BLOCKS WITH TITLES - Named blocks
; ============================================================================

; Example blocks with titles
(example_block
  (metadata
    (block_title) @name) @definition.struct)

; Listing blocks with titles
(listing_block
  (metadata
    (block_title) @name) @definition.struct)

; Fenced code blocks with titles
(fenced_code_block
  (code_fence_open
    (info_string
      language: (language) @name)) @definition.struct)

; Quote blocks with titles
(quote_block
  (metadata
    (block_title) @name) @definition.struct)

; Sidebar blocks with titles
(sidebar_block
  (metadata
    (block_title) @name) @definition.struct)
