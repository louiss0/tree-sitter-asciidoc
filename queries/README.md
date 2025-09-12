# AsciiDoc Tree-sitter Highlighting

This directory contains enhanced tree-sitter query files for comprehensive AsciiDoc syntax highlighting.

## Supported Highlight Categories

### Block-Level Elements

#### Delimited Blocks
- **Block fences**: `====`, `----`, `....`, `____`, `****`, `++++`, `--`, `|===`
  - Captured as: `@punctuation.special` (priority 110)
- **Block content**: Context-aware highlighting
  - Listing/Literal blocks: `@markup.raw.block`
  - Quote blocks: `@markup.quote`
  - Example blocks: Default content highlighting

#### Conditional Directives  
- **Directive keywords**: `ifdef`, `ifndef`, `ifeval`, `endif`
  - Captured as: `@keyword.directive` (priority 120)
- **High priority** ensures visibility over block content

#### Tables
- **Table fences**: `|===` open/close markers
  - Captured as: `@punctuation.special` (priority 110) 
- **Cell specifications**: colspan, rowspan, format specs
  - Cell/format specs: `@operator`
  - Span numbers: `@number`
- **Cell content**: `@string`

### Lists and Callouts

#### List Markers
- **Unordered markers**: `*`, `-` (external tokens)
  - Captured as: `@markup.list.marker` (priority 105)
- **Ordered markers**: `1.`, `2.`, etc. (external tokens)  
  - Captured as: `@markup.list.marker` (priority 105)
- **Description markers**: `::`
  - Captured as: `@markup.list.marker` (priority 105)
- **List continuations**: `+` on separate line
  - Captured as: `@punctuation.special` (priority 105)

#### Callouts
- **Callout markers**: `<1>`, `<2>`, etc.
  - Captured as: `@markup.list.marker`
- **List items**: All list content as `@markup.list`

### Headings and Sections

#### Section Titles
- **Basic heading capture**: `@markup.heading`
- **Enhanced level-specific**: Requires grammar token analysis
  - Level 1: `@markup.heading.1`
  - Level 2: `@markup.heading.2` 
  - etc.
- **Future enhancement**: Heading marker tokens (`=`, `==`, etc.) as `@markup.heading.marker`

### Inline Formatting

#### Text Formatting
- **Strong/Bold**: Content as `@markup.strong`
- **Emphasis/Italic**: Content as `@markup.italic`
- **Monospace/Code**: Content as `@markup.raw.inline`
- **Superscript**: Content as `@string.special`
- **Subscript**: Content as `@string.special`

*Note*: Formatting delimiters (`*`, `_`, `` ` ``, `^`, `~`) are handled at the token level and not currently captured separately.

### Links and References

#### Auto Links
- **Bare URLs**: `@markup.link.url`

#### Cross-References
- **Internal references**: `<<target>>` or `<<target,text>>`
  - Captured as: `@markup.link`
- **External references**: `xref:target[text]`
  - Captured as: `@function.macro`

#### Link Macros
- **All link macros**: `@function.macro`
  - `link:url[text]`
  - `link_macro`

### Anchors
- **Anchor IDs**: `@label` 
- **Anchor text**: `@markup.link.label`
- **Inline anchors**: `@label`

### Attributes

#### Attribute Entries
- **Attribute names**: `@attribute` (modern capture)
- **Attribute values**: `@string`
- **Attribute references**: `{name}` as `@attribute`

#### Block Metadata
- **Block titles**: `.Title` as `@markup.heading.marker`
- **Block attributes**: `[source,python]` as `@attribute`
- **ID and roles**: `[#id.role]` as `@attribute`

### Macros and Special Constructs

#### UI Macros
- **Keyboard shortcuts**: `kbd:[Ctrl+C]` as `@function.macro`
- **Button references**: `btn:[Save]` as `@function.macro`
- **Menu navigation**: `menu:File[Save As]` as `@function.macro`

#### Math Content  
- **Math macros**: `stem:[]`, `latexmath:[]`, `asciimath:[]`
  - Captured as: `@function.macro` (priority 108)
- **Math content**: `@markup.math`
- **Math block labels**: `[stem]`, `[latexmath]`, `[asciimath]`
  - Captured as: `@attribute` (priority 108)

#### Footnotes
- **All footnote macros**: `@function.macro`
  - `footnote:[text]`
  - `footnote:id[text]` 
  - `footnoteref:id[]`

#### Index Terms
- **Index macros**: `@function.macro`
  - `indexterm:[primary]`
  - `indexterm2:[visible]`
  - `(((hidden)))`
- **Index text components**: `@label`

#### Bibliography
- **Bibliography entries**: 
  - IDs: `@label`
  - Citations: `@string`
  - Descriptions: `@string`
- **Bibliography references**: `@label`

#### Images and Media
- **All image macros**: `@function.macro`
  - `image:file.png[alt]`
  - `image::file.png[alt]`

#### Include Directives
- **Include paths**: `@string.special.path` (priority 118)
- **Include options**: `@attribute` (priority 118)

#### Passthrough
- **Passthrough content**: `+++text+++` as `@markup.raw`
- **Pass macros**: `pass:[text]` as `@function.macro` (priority 108)

### Role Spans and Styling

#### Role Applications
- **Role spans**: `[.role]#text#`
  - Currently: `@punctuation.special` (token-based)
  - *Future enhancement*: Parse role name vs content separately

### Comments

#### Comment Types  
- **Line comments**: `//` as `@comment`
- **Block comments**: `////` blocks as `@comment`
- **Comment lines**: Individual lines within block comments as `@comment`

### Admonitions

#### Admonition Labels
- **Inline admonitions**: `NOTE:`, `TIP:`, etc. as `@keyword`
- **Block admonitions**: `[NOTE]`, `[TIP]`, etc. as `@keyword`

## Priority System

The highlighting uses a priority system to ensure important structural elements remain visible:

- **120**: Conditional directives (highest priority)
- **118**: Include directives
- **115**: Section heading markers (planned)
- **110**: Block fences and table fences  
- **108**: Math block labels and macro names
- **105**: List markers and continuations
- **50**: Legacy compatibility captures (lowest)
- **Default**: All content and most inline elements

## Modern nvim-treesitter Conventions

This query file follows modern nvim-treesitter capture naming conventions:

### Punctuation
- `@punctuation.delimiter` - Commas, semicolons, colons
- `@punctuation.bracket` - Brackets, braces, parentheses  
- `@punctuation.special` - Special delimiters (fences, markers)

### Semantic Markup
- `@markup.heading.*` - Headings and titles
- `@markup.list.*` - Lists and list components
- `@markup.link.*` - Links and references
- `@markup.raw.*` - Code and literal content
- `@markup.strong` - Bold text
- `@markup.italic` - Italic text
- `@markup.quote` - Quoted content
- `@markup.math` - Mathematical expressions

### Attributes and Metadata
- `@attribute` - Attribute names and metadata
- `@type` - Type specifications and roles  
- `@label` - IDs, anchors, references

### Functions and Macros
- `@function.macro` - All AsciiDoc macros

### Strings and Paths
- `@string` - Regular string content
- `@string.special.url` - URLs and web addresses
- `@string.special.path` - File paths

## Legacy Compatibility

For themes that don't support modern `@markup.*` captures, minimal fallback captures are provided with lower priority (50):

- `@text.strong` - Bold text fallback
- `@text.emphasis` - Italic text fallback  
- `@text.literal` - Code text fallback
- `@text.title` - Heading fallback

## Testing

Use the comprehensive test sample:
```bash
# View with nvim-treesitter
nvim tests/samples/all_features.adoc

# Inspect captures with TreeSitter Playground
:TSPlaygroundToggle
```

## Grammar Dependencies

This query file is designed for the tree-sitter-asciidoc grammar and relies on:

- **External scanner tokens** for list markers, block fences, and continuations
- **Field-based node access** for structured content (title, content, etc.)
- **Token-based captures** for some complex inline elements (currently)

## Future Enhancements

Planned improvements include:

1. **Structured role span parsing** - Separate role names from content
2. **Formatting delimiter capture** - Highlight `*`, `_`, `` ` `` markers
3. **Enhanced heading markers** - Capture `=`, `==` tokens separately
4. **Macro component parsing** - Separate macro names from targets/options
5. **Attribute list parsing** - Structure `[key=value, key2=value2]` syntax

## Contributing

When adding new captures:

1. Follow nvim-treesitter conventions
2. Use appropriate priorities to prevent conflicts
3. Add comprehensive test cases to `tests/samples/all_features.adoc`
4. Update this documentation
5. Test with multiple themes for compatibility