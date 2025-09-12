# AsciiDoc Node/Capture Inventory

This document maps grammar nodes from `grammar.js` to proposed highlight captures, following modern nvim-treesitter conventions.

## Current Highlighting Status
- ✅ Already highlighted
- ⭐ Enhanced/improved highlighting needed  
- 🆕 New highlighting to add

## 1. Section Headings

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `section_title` | `title` field | `@markup.heading` | `@markup.heading.1` through `@markup.heading.6` | 115 | ⭐ |
| `_heading1` to `_heading6` | token markers | *none* | `@markup.heading.marker` | 115 | 🆕 |

**Notes**: Current grammar uses token-based heading markers (e.g., `/=[ \t]+/`, `/==[ \t]+/`). These tokens should be captured as `@markup.heading.marker`.

## 2. Delimited Block Fences

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `example_block` | `example_open`, `example_close` | *none* | `@punctuation.special` | 110 | 🆕 |
| `listing_block` | `listing_open`, `listing_close` | *none* | `@punctuation.special` | 110 | 🆕 |
| `literal_block` | `literal_open`, `literal_close` | *none* | `@punctuation.special` | 110 | 🆕 |
| `quote_block` | `quote_open`, `quote_close` | *none* | `@punctuation.special` | 110 | 🆕 |
| `sidebar_block` | `sidebar_open`, `sidebar_close` | *none* | `@punctuation.special` | 110 | 🆕 |
| `passthrough_block` | `passthrough_open`, `passthrough_close` | *none* | `@punctuation.special` | 110 | 🆕 |
| `open_block` | `openblock_open`, `openblock_close` | *none* | `@punctuation.special` | 110 | 🆕 |
| `table_block` | `table_open`, `table_close` | *none* | `@punctuation.special` | 110 | 🆕 |

**Implementation**: Use external scanner tokens: `EXAMPLE_FENCE_START`, `LISTING_FENCE_START`, etc.

## 3. Block Content

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `block_content` | *all* | `@markup.raw.block` | `@markup.raw.block` (listing/literal), `@markup.quote` (quote) | default | ⭐ |

**Notes**: Content highlighting needs to be context-aware based on block type.

## 4. Tables

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `table_cell` | `content` field | `@string` | `@string` | default | ✅ |
| `cell_spec` | *all* | `@property` | `@property` | default | ✅ |
| `span_spec` | *all* | `@number` | `@number` | default | ✅ |
| `format_spec` | *all* | `@type` | `@type` | default | ✅ |
| Table fences | `table_open`, `table_close` | *none* | `@punctuation.special` | 110 | 🆕 |

## 5. Lists

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `unordered_list_item` | *all* | `@markup.list` | `@markup.list` | default | ✅ |
| `ordered_list_item` | *all* | `@markup.list` | `@markup.list` | default | ✅ |
| `description_item` | *all* | `@markup.list` | `@markup.list` | default | ✅ |
| `callout_item` | *all* | `@markup.list` | `@markup.list` | default | ✅ |
| `callout_item` | `marker` field | `@number` | `@markup.list.marker` | 105 | ⭐ |
| External list markers | `_LIST_UNORDERED_MARKER`, `_LIST_ORDERED_MARKER` | *none* | `@markup.list.marker` | 105 | 🆕 |
| `LIST_CONTINUATION` | *all* | *none* | `@punctuation.special` | 105 | 🆕 |

## 6. Conditional Directives

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `ifdef_open` | directive token | `@keyword.directive` | `@keyword.directive` | 120 | ✅ |
| `ifndef_open` | directive token | `@keyword.directive` | `@keyword.directive` | 120 | ✅ |
| `ifeval_open` | directive token | `@keyword.directive` | `@keyword.directive` | 120 | ✅ |
| `endif_directive` | directive token | `@keyword.directive` | `@keyword.directive` | 120 | ✅ |

**Notes**: These are currently captured but may need improved token-level parsing for attribute names within directives.

## 7. Attributes

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `attribute_entry` | `name` field | `@property` | `@attribute` | default | ⭐ |
| `attribute_entry` | `value` field | `@string` | `@string` | default | ✅ |
| `attribute_reference` | *all* | `@variable` | `@attribute` with `@punctuation.bracket` for braces | default | ⭐ |
| `block_attributes` | *all* | `@property` | Parse into keys `@attribute`, values `@string`, brackets `@punctuation.bracket` | default | ⭐ |
| `id_and_roles` | *all* | `@property` | Parse IDs `@label`, roles `@type`, punctuation `@punctuation.delimiter` | default | ⭐ |
| `block_title` | *all* | `@property` | `@markup.heading.marker` for dot, `@string` for title | default | ⭐ |

## 8. Inline Formatting

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `strong` | *all* | `@markup.strong` | `@markup.strong` (content) + `@punctuation.special` (delimiters) | default | ⭐ |
| `strong_constrained` | `content` field | `@markup.strong` | `@markup.strong` | default | ✅ |
| `emphasis` | *all* | `@markup.italic` | `@markup.italic` (content) + `@punctuation.special` (delimiters) | default | ⭐ |
| `emphasis_constrained` | `content` field | `@markup.italic` | `@markup.italic` | default | ✅ |
| `monospace` | *all* | `@markup.raw` | `@markup.raw.inline` (content) + `@punctuation.special` (delimiters) | default | ⭐ |
| `monospace_constrained` | `content` field | `@markup.raw` | `@markup.raw.inline` | default | ⭐ |
| `superscript` | `content` field | `@markup.underline` | `@string.special` | default | ⭐ |
| `subscript` | `content` field | `@markup.underline` | `@string.special` | default | ⭐ |

## 9. Links and References

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `auto_link` | *all* | `@markup.link.url` | `@markup.link.url` | default | ✅ |
| `internal_xref` | *all* | `@markup.link` | Parse into target `@markup.link.url`, text `@markup.link.label`, brackets `@punctuation.bracket` | default | ⭐ |
| `external_xref` | *all* | `@function.macro` | `@function.macro` + parse target/text components | default | ⭐ |
| `link_macro` | *all* | `@function.macro` | `@function.macro` | default | ✅ |
| `link` | *all* | `@function.macro` | `@function.macro` | default | ✅ |

## 10. Anchors

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `anchor` | `id` field | `@label` | `@label` | default | ✅ |
| `anchor` | `text` field | `@markup.link.label` | `@markup.link.label` | default | ✅ |
| `inline_anchor` | *all* | `@label` | Parse into ID `@label`, text `@markup.link.label`, brackets `@punctuation.bracket` | default | ⭐ |

## 11. Images and Media

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `image` | *all* | `@function.macro` | `@function.macro` | default | ✅ |
| `block_image` | *all* | `@function.macro` | `@function.macro` | default | ✅ |

## 12. Math

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `math_macro` | *all* | `@function.macro` | `@function.macro` | 108 | ✅ |
| `math_content` | *all* | `@markup.raw.block` | `@markup.math` (fallback to `@markup.raw.block`) | default | ⭐ |
| `stem_block_label` | *all* | *none* | `@attribute` for label name, `@punctuation.bracket` for brackets | 108 | 🆕 |
| `latexmath_block_label` | *all* | *none* | `@attribute` for label name, `@punctuation.bracket` for brackets | 108 | 🆕 |
| `asciimath_block_label` | *all* | *none* | `@attribute` for label name, `@punctuation.bracket` for brackets | 108 | 🆕 |

## 13. Footnotes

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `footnote_inline` | *all* | `@function.macro` | `@function.macro` | default | ✅ |
| `footnote_ref` | *all* | `@function.macro` | `@function.macro` | default | ✅ |
| `footnoteref` | *all* | `@function.macro` | `@function.macro` | default | ✅ |

**Notes**: These are token-based captures. Need to parse into macro name, ID, and text components.

## 14. Index Terms

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `index_term_macro` | *all* | `@function.macro` | `@function.macro` | default | ✅ |
| `index_term2_macro` | *all* | `@function.macro` | `@function.macro` | default | ✅ |
| `concealed_index_term` | *all* | `@function.macro` | `@function.macro` | default | ✅ |
| `index_text` | `primary`, `secondary`, `tertiary` fields | `@label` | `@label` | default | ✅ |

## 15. Bibliography

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `bibliography_entry` | `id` field | `@label` | `@label` | default | ✅ |
| `bibliography_entry` | `citation` field | `@string` | `@string` | default | ✅ |
| `bibliography_entry` | `description` field | `@string` | `@string` | default | ✅ |
| `bibliography_reference` | `id` field | `@label` | `@label` | default | ✅ |

## 16. UI Macros

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `ui_kbd` | *all* | `@function.macro` | `@function.macro` | default | ✅ |
| `ui_btn` | *all* | `@function.macro` | `@function.macro` | default | ✅ |
| `ui_menu` | *all* | `@function.macro` | `@function.macro` | default | ✅ |

**Notes**: These are token-based. Could parse into macro name + content for better granularity.

## 17. Include Directives

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `include_directive` | `path` field | `@string.special.path` | `@string.special.path` | default | ✅ |
| `include_directive` | `options` field | `@property` | Parse into keys `@attribute`, values `@string` | default | ⭐ |

## 18. Passthrough

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `passthrough_triple_plus` | *all* | `@markup.raw` | Parse into delimiters `@punctuation.special`, content `@markup.raw.inline` | default | ⭐ |
| `pass_macro` | *all* | `@function.macro` | `@function.macro` | default | ✅ |

## 19. Comments

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `line_comment_block` | *all* | `@comment` | `@comment` | default | ✅ |
| `block_comment` | *all* | `@comment` | `@comment` | default | ✅ |
| `comment_line` | *all* | `@comment` | `@comment` | default | ✅ |

## 20. Role Spans

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `role_span` | *all* | *none* | Parse into role name `@type`, delimiters `@punctuation.special` | default | 🆕 |

**Notes**: Currently token-based: `/\[[A-Za-z][A-Za-z0-9_.-]*\]#[^#\r\n]+#/`

## 21. Text Segments

| Grammar Node | Field/Sub-node | Current Capture | Proposed Capture | Priority | Status |
|-------------|----------------|----------------|------------------|----------|---------|
| `text_segment` | *all* | `@none` | `@none` | default | ✅ |
| `text_colon` | *all* | `@none` | `@none` | default | ✅ |
| `text_angle_bracket` | *all* | `@none` | `@none` | default | ✅ |
| `text_bracket` | *all* | `@none` | `@none` | default | ✅ |

## Priority Guidelines

- **120**: Conditional directives (highest - avoid conflicts)
- **118**: Include directives  
- **115**: Section heading markers
- **110**: Block fences and table fences
- **108**: Math block labels and macro names
- **105**: List markers and continuations
- **Default**: All content and most inline elements

## Modern nvim-treesitter Capture Conventions

### Punctuation
- `@punctuation.delimiter` - Commas, semicolons, colons
- `@punctuation.bracket` - Brackets, braces, parentheses  
- `@punctuation.special` - Special delimiter characters (fence markers, formatting delimiters)

### Keywords & Directives  
- `@keyword.directive` - ifdef, ifndef, ifeval, endif

### Operators & Numbers
- `@operator` - Mathematical and logical operators, cell format specs
- `@number` - Numeric literals, span specifications

### Strings & Paths
- `@string` - Regular string content
- `@string.special.url` - URLs and web addresses
- `@string.special.path` - File paths and includes

### Attributes & Types
- `@attribute` - Attribute names, property keys
- `@type` - Role names, type specifications
- `@label` - IDs, anchors, references

### Functions & Macros
- `@function.macro` - All AsciiDoc macros (link:, image:, etc.)

### Markup (Semantic)
- `@markup.heading.1` through `@markup.heading.6` - Heading levels
- `@markup.heading.marker` - Heading delimiter tokens (=, ==, etc.)
- `@markup.list` - List content
- `@markup.list.marker` - List bullets and numbers
- `@markup.link` - Generic links
- `@markup.link.label` - Link text/labels  
- `@markup.link.url` - Link targets
- `@markup.raw.inline` - Inline code/monospace
- `@markup.raw.block` - Code blocks, literal blocks
- `@markup.strong` - Bold/strong text content
- `@markup.italic` - Italic/emphasis text content  
- `@markup.quote` - Quote block content
- `@markup.math` - Mathematical expressions (fallback to @markup.raw.block if unsupported)

## Implementation Strategy

1. **Phase 1**: Add missing fence and marker highlights (quick wins)
2. **Phase 2**: Enhance existing captures with better granularity  
3. **Phase 3**: Add priority settings to prevent conflicts
4. **Phase 4**: Create comprehensive test samples and verify

## Legacy Compatibility

For older Neovim versions, consider minimal aliases:
- `@text.strong` → `@markup.strong`
- `@text.emphasis` → `@markup.italic` 
- `@text.literal` → `@markup.raw.inline`

Keep aliases minimal to avoid query bloat.