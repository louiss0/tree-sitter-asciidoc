# Contributing to tree-sitter-asciidoc

## Development Workflow

### Building the Parser

#### Standard Build
```bash
tree-sitter generate
tree-sitter build
```

#### Debug Build
To enable debug instrumentation in the external scanner:
```bash
# Use the convenience script (Windows)
./scripts/build-debug.ps1

# Or manually set CFLAGS
export CFLAGS="-DDEBUG"  # Linux/Mac
$env:CFLAGS = "-DDEBUG"  # Windows PowerShell
tree-sitter generate && tree-sitter build
```

### Testing

#### Parse Individual Files
```bash
# Standard parsing
tree-sitter parse <file.adoc>

# Using convenience script with better formatting (Windows)
./scripts/parse-file.ps1 <file.adoc>
```

#### Run Test Suite
```bash
tree-sitter test
```

### Debug Instrumentation

The external scanner includes optional debug logging that can be enabled by compiling with `-DDEBUG`. Debug output includes:

- **Fence detection**: Table fences (`|===`), delimited block fences (`====`, `----`, etc.)
- **Preprocessor directives**: `ifdef`, `ifndef`, `ifeval`, `endif` recognition
- **Scanner state**: Line position, character lookahead, validation steps

Example debug output:
```
[SCANNER] scan_block_fence_start: checking at column 0, char='='
[SCANNER] scan_table_fence: checking start fence at column 0, char='|'
[SCANNER] scan_ifdef_open: successfully matched ifdef directive
```

### Recent Major Fixes

The parser has undergone significant improvements to fix key parsing issues:

1. **Malformed Conditionals**: Conditionals that don't follow proper syntax (missing `::`, `[]`, etc.) now parse as paragraphs instead of broken conditional nodes
2. **Role Spans**: Fixed precedence for inline role spans like `[.role]#content#`
3. **Table Parsing**: Table fences `|===` and cell specifications are now correctly parsed
4. **Macro Precedence**: Macros like `stem:[formula]` and `kbd:[key]` now have correct precedence over inline formatting
5. **Delimited Block Fences**: Enhanced stateful scanner for proper fence matching with character type and count validation

### Grammar Development

#### Precedence Rules
The grammar uses precedence constants defined in `grammar.js`:

```javascript
const PREC = {
  BLOCK_MARKER: 100,     // Block delimiters at start of line
  SECTION: 90,           // Section headings  
  ADMONITION: 85,        // Admonition blocks and paragraphs
  DELIMITED_BLOCK: 120,  // Delimited blocks (high precedence to beat paragraphs)
  LIST: 110,             // Lists (highest precedence to allow grouping)
  CONDITIONAL: 75,       // Conditional blocks (higher than paragraphs)
  ATTRIBUTE_ENTRY: 95,   // Attribute entries (higher than lists and paragraphs)
  PARAGRAPH: 70,         // Paragraphs
  // Inline element precedences (highest to lowest)
  PASSTHROUGH: 60,       // +++literal text+++
  STRONG: 50,            // *text*
  EMPHASIS: 45,          // _text_
  MONOSPACE: 40,         // `code`
  SUPERSCRIPT: 35,       // ^text^
  SUBSCRIPT: 30,         // ~text~
  TEXT: 1,               // plain text (lowest)
}
```

#### Key Design Decisions

1. **Malformed conditionals degrade to paragraphs**: Only well-formed `ifdef::attr[]`, `ifndef::attr[]`, `ifeval::[expr]`, and `endif::[]` directives are recognized as conditionals. Malformed variants parse as regular paragraph text.

2. **Stateful fence matching**: Delimited blocks use stateful scanning to ensure opening and closing fences match in character type and minimum count.

3. **Table cell specifications**: Tables support cell specs like `2+|` (colspan), `3.|` (rowspan), `h|` (header), and alignment markers.

4. **Macro precedence**: Macros like `stem:[]`, `kbd:[]`, `btn:[]`, `image:[]` have higher precedence than inline formatting to prevent conflicts.

### Adding New Tests

Test files are located in `test/corpus/`. Each test follows this format:

```
================================================================================
Test Name Here
================================================================================

Input AsciiDoc content goes here.
This can be multiple lines.

--------------------------------------------------------------------------------

(expected_parse_tree
  (with_proper_nesting
    (and_node_types)))
```

### Scanner State Management

The external scanner maintains state for:

- **Fence tracking**: Character type, count, and nesting level for delimited blocks
- **List context**: Whether currently inside ordered/unordered lists
- **Line position**: BOL (beginning of line) detection for block-level constructs

State is preserved between tokens and reset appropriately to handle multi-document parsing.

### Performance Considerations

- Scanner functions return early when not at BOL for block-level constructs
- Token patterns use character classes and specific bounds to avoid backtracking
- Precedence rules minimize conflicts and ambiguous parsing paths

## Troubleshooting

### Common Issues

1. **Test runner crashes**: If `tree-sitter test` crashes, try parsing individual files to isolate the issue
2. **Parsing errors**: Enable debug build to trace scanner behavior
3. **Precedence conflicts**: Check that token precedence values follow the established hierarchy

### Debug Workflow

1. Enable debug build: `./scripts/build-debug.ps1`
2. Parse problematic input: `./scripts/parse-file.ps1 input.adoc`
3. Analyze debug output to identify scanner behavior
4. Adjust grammar rules or scanner logic as needed
5. Verify fix with standard build and full test suite
