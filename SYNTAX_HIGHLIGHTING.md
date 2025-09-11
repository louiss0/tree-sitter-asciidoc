# AsciiDoc Syntax Highlighting

This document describes the syntax highlighting capabilities of the Tree Sitter AsciiDoc parser.

## Highlighting Coverage

The following AsciiDoc constructs are highlighted by this parser:

### ✅ Fully Supported

#### Document Structure
- **Section Headings**: `= Title`, `== Section`, etc. - Title text highlighted as `@markup.heading`
- **Attribute Entries**: `:name: value` - Name as `@property`, value as `@string`
- **Attribute References**: `{name}` - Highlighted as `@variable`

#### Inline Formatting
- **Strong/Bold**: `*text*` - Content highlighted as `@markup.strong`
- **Emphasis/Italic**: `_text_` - Content highlighted as `@markup.italic`
- **Monospace/Code**: `` `text` `` - Content highlighted as `@markup.raw`
- **Superscript**: `^text^` - Content highlighted as `@markup.underline`
- **Subscript**: `~text~` - Content highlighted as `@markup.underline`
- **Passthroughs**: `+++text+++` - Content highlighted as `@markup.raw`

#### Links and References
- **Auto Links**: `https://example.com` - Highlighted as `@markup.link.url`
- **Internal Cross-References**: `<<target,text>>` - Highlighted as `@markup.link`
- **External Cross-References**: `xref:target[text]` - Macro highlighted as `@function.macro`
- **Link Macros**: `link:url[text]` - Macro highlighted as `@function.macro`

#### Anchors
- **Inline Anchors**: `[[id,text]]` - ID highlighted as `@label`
- **Block Anchors**: `[[id]]` at start of line - ID highlighted as `@label`

#### Lists
- **Unordered Lists**: `*`, `-` markers - Items highlighted as `@markup.list`
- **Ordered Lists**: `1.`, `a.` markers - Items highlighted as `@markup.list`
- **Description Lists**: `term::` - Items highlighted as `@markup.list`
- **Callout Lists**: `<1>` markers - Numbers highlighted as `@number`, items as `@markup.list`

#### Admonitions
- **Inline Admonitions**: `NOTE: text` - Labels highlighted as `@keyword`
- **Block Admonitions**: `[NOTE]` - Labels highlighted as `@keyword`

#### Blocks
- **Listing/Source Blocks**: `----` - Content highlighted as `@markup.raw.block`
- **Literal Blocks**: `....` - Content highlighted as `@markup.raw.block`
- **Quote Blocks**: `____` - Content highlighted as `@markup.quote`
- **Example Blocks**: `====` - Default text highlighting
- **Sidebar Blocks**: `****` - Default text highlighting
- **Passthrough Blocks**: `++++` - Content highlighted as `@markup.raw.block`

#### Tables
- **Table Cells**: `|cell content|` - Cell content highlighted as `@string`
- **Cell Specifications**: `2+`, `3*`, `a` - Highlighted as `@property`, `@number`, `@type`

#### Comments
- **Line Comments**: `// comment` - Highlighted as `@comment`
- **Block Comments**: `////` - Content highlighted as `@comment`

#### Conditionals
- **Ifdef/Ifndef/Ifeval**: `ifdef::attr[]` - Directives highlighted as `@keyword.directive`
- **Endif**: `endif::attr[]` - Directives highlighted as `@keyword.directive`

#### Macros
- **UI Macros**: `kbd:[key]`, `btn:[button]`, `menu:[]` - Highlighted as `@function.macro`
- **Math Macros**: `latexmath:[]`, `stem:[]` - Highlighted as `@function.macro`
- **Footnotes**: `footnote:[text]` - Highlighted as `@function.macro`
- **Index Terms**: `indexterm:[text]` - Highlighted as `@function.macro`

### 🔄 Partially Supported

#### Images
- **Image Macros**: `image::path[alt]` - Macro highlighted as `@function.macro`
- **Inline Images**: `image:path[alt]` - Macro highlighted as `@function.macro`
- Note: Path and alt text highlighting could be improved with grammar enhancements

#### Include Directives
- **Include**: `include::path[]` - Path highlighted as `@string.special.path`
- Options highlighted as `@property`

### ❌ Not Yet Supported

#### Advanced Features
- **Custom Roles**: `[.role]#text#` - Limited grammar support
- **Language-Specific Source Block Injection**: Planned for future grammar enhancement
- **Complex Attribute Lists**: `[key=value,role]` - Partial support
- **Bibliography**: Limited grammar nodes available

## Capture Naming Strategy

This parser follows the [nvim-treesitter capture naming conventions](https://github.com/nvim-treesitter/nvim-treesitter/blob/master/CONTRIBUTING.md#captures):

### Markup Categories
- `@markup.heading` - Section titles and headings
- `@markup.strong` - Bold/strong text
- `@markup.italic` - Italic/emphasis text  
- `@markup.raw` - Inline code/monospace text
- `@markup.raw.block` - Code blocks and literal content
- `@markup.link` - Cross-references and internal links
- `@markup.link.url` - Auto-detected URLs
- `@markup.link.label` - Link text/labels
- `@markup.quote` - Quote block content
- `@markup.list` - List items
- `@markup.underline` - Superscript/subscript (best fit)

### Semantic Categories
- `@comment` - All comment types
- `@keyword` - Admonition labels
- `@keyword.directive` - Conditional directives
- `@function.macro` - All macro constructs
- `@property` - Attribute names and metadata
- `@variable` - Attribute references
- `@string` - Attribute values and cell content
- `@string.special.url` - URLs in link macros
- `@string.special.path` - File paths in includes
- `@label` - Anchor IDs and reference targets
- `@number` - Callout numbers
- `@type` - Table format specifications
- `@none` - Regular text (explicit non-highlighting)

## Language Injections

The parser includes basic language injection support via `queries/injections.scm`:

- **Generic Source Blocks**: Injected as `text` by default
- **Math Blocks**: LaTeX/AsciiMath content injected as `latex`
- **Future Enhancement**: Language-specific injection based on `[source,lang]` attributes

## Testing

Syntax highlighting is tested using the test suite in `test/highlight/`:

- **Test Files**: `cases/*.adoc` contain sample AsciiDoc content
- **Expected Results**: `expected/*.captures` contain expected highlighting output
- **Test Runner**: `tools/run.ps1` runs queries and compares results
- **Commands**: 
  - `jpd run test:highlights` - Run highlighting tests
  - `jpd run test:highlights:update` - Update expected results

## Contributing

When adding new highlighting features:

1. **Follow Capture Conventions**: Use standardized `@markup.*`, `@keyword.*`, etc. names
2. **Add Tests**: Include test cases in `test/highlight/cases/`
3. **Document Coverage**: Update this file with new supported constructs
4. **Consider Grammar**: Some features may require grammar enhancements first

## Limitations

Current limitations are primarily due to grammar design choices:

1. **Token-Based Delimiters**: Many delimiters (like `*`, `_`, `=`) are handled as tokens and not exposed as separate AST nodes, limiting delimiter-specific highlighting
2. **Attribute Parsing**: Complex attribute lists need enhanced grammar support
3. **Language Detection**: Source block language detection requires grammar improvements
4. **Role Spans**: Limited support for custom role syntax

Future grammar enhancements could address these limitations while maintaining parsing performance.
