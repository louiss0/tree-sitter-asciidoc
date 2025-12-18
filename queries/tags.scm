<<<<<<< HEAD
; ============================================================================
; AsciiDoc Tags Queries
; ============================================================================
; Enables symbol navigation, outline views, and tags-based search
; Used by editors for document structure navigation and symbol lists

; ============================================================================
; SECTIONS - Hierarchical document structure
; ============================================================================

; Level 1 sections (= Title) - Top-level classes
(section_level_1
  marker: (section_marker_1)
  title: (title) @name) @definition.class

; Level 2 sections (== Title) - Major sections
(section_level_2
  marker: (section_marker_2)
  title: (title) @name) @definition.class

; Level 3 sections (=== Title) - Subsections
(section_level_3
  marker: (section_marker_3)
  title: (title) @name) @definition.method

; Level 4 sections (==== Title) - Minor subsections
(section_level_4
  marker: (section_marker_4)
  title: (title) @name) @definition.method

; Level 5 sections (===== Title) - Deep subsections
(section_level_5
  marker: (section_marker_5)
  title: (title) @name) @definition.function

; Level 6 sections (====== Title) - Deepest subsections
(section_level_6
  marker: (section_marker_6)
  title: (title) @name) @definition.function

; ============================================================================
; ANCHORS - Labeled reference points
; ============================================================================

; Block-level anchors - [[id]]
(anchor) @definition.label

; Inline anchors - [[id,text]]
(inline_anchor) @definition.label

; Bibliography entries - [[[id]]]
(bibliography_entry
  id: (bibliography_id) @name) @definition.label

; ============================================================================
; ATTRIBUTES - Document-wide variables
; ============================================================================

; Attribute definitions - :name: value
(attribute_entry) @definition.constant

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
(include_directive) @definition.import

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
(fenced_code_block) @definition.struct

; Quote blocks with titles
(asciidoc_blockquote
  (metadata
    (block_title) @name) @definition.struct)

; Sidebar blocks with titles
(sidebar_block
  (metadata
    (block_title) @name) @definition.struct)
=======
; queries/tags.scm
(document_title_text) @name
(title)               @name

(attribute_name)  @name
(anchor)          @name
(bibliography_id) @name
>>>>>>> develop
