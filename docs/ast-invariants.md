# AsciiDoc Parser AST Invariants

This document defines the expected AST structure that all test cases should produce. Use this as the acceptance contract while refactoring the grammar.

## Core Principles

1. **No ERROR nodes** - The parser should cleanly consume all input without producing ERROR nodes at the start, end, or middle of documents
2. **No wrapper duplication** - Inline elements should not have both `element_constrained` and `inline_element(element(...))` - pick one consistent structure
3. **Clean field structure** - Use consistent field names: `open`, `content`, `close` for delimited blocks; `content` or `text` for inline content
4. **Predictable text segmentation** - Adjacent plain text should consolidate into single `text_segment` nodes, not split arbitrarily

## Document Structure

### Root Node
```
(source_file
  ...blocks...)
```

### Block Types

#### Sections
```
(section
  (section_title (title))
  ...nested_content...)
```

#### Paragraphs
```
(paragraph
  (text_with_inlines
    (text_segment)
    (inline_element (...))
    (text_segment)))
```

#### Delimited Blocks
All follow the pattern:
```
(block_type
  [optional: (metadata ...)]
  (block_type_open)
  [optional: (block_content)]
  (block_type_close))
```

Block types:
- `example_block` with `example_open`/`example_close`
- `listing_block` with `listing_open`/`listing_close`  
- `literal_block` with `literal_open`/`literal_close`
- `quote_block` with `quote_open`/`quote_close`
- `sidebar_block` with `sidebar_open`/`sidebar_close`
- `passthrough_block` with `passthrough_open`/`passthrough_close`
- `open_block` with `openblock_open`/`openblock_close`

### Inline Elements

#### Target Structure (eliminate duplication)
Current problematic pattern:
```
(inline_element
  (strong
    (strong_constrained
      (strong_text))))
```

Expected clean pattern:
```
(strong (strong_text))
```

#### Inline Types
- `strong` - `*bold*`
- `emphasis` - `_italic_`  
- `monospace` - `` `code` ``
- `superscript` - `^super^`
- `subscript` - `~sub~`
- `inline_anchor` - `[[id]]` or `[[id,text]]`
- `internal_xref` - `<<target>>` or `<<target,text>>`
- `external_xref` - `xref:target[]` or `xref:target[text]`
- `footnote_inline` - `footnote:[text]`
- `footnote_ref` - `footnote:id[]` or `footnote:id[text]`
- `footnoteref` - `footnoteref:id[]`

## Common Issues to Fix

1. **Leading/trailing ERROR nodes** - Usually caused by improper newline/whitespace handling
2. **Inline element wrapper duplication** - Remove the `inline_element` wrapper layer
3. **Text segmentation splitting** - Consolidate adjacent plain text
4. **Block delimiter recognition** - Ensure delimiters are properly recognized at line boundaries
5. **Missing field annotations** - Add consistent `field("name", ...)` annotations

## Test Categories by Issue Type

### Start/End ERROR Nodes
- All section tests (01_sections.txt)
- All paragraph tests (02_paragraphs.txt)

### Inline Duplication  
- All formatting tests (18_basic_formatting.txt, 19_inline_formatting.txt)
- Mixed inline tests (20_inline_edge_cases.txt)

### Text Segmentation
- Paragraph tests with mixed content
- Complex inline combination tests

### Block Delimiter Issues
- All delimited block tests (14_delimited_blocks.txt)
- Block metadata tests

### Rule Integration
- Mixed content tests (sections + paragraphs + blocks)
- Conditional blocks (11_conditionals.txt, 12_conditional_conflicts.txt)

This invariants document should be updated as the grammar evolves to reflect the final agreed-upon AST structure.
