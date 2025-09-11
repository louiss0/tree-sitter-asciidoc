# Tree-sitter AsciiDoc Enhancement Issues

This document tracks potential enhancements and improvements for the Tree-sitter AsciiDoc parser and syntax highlighting implementation.

## Grammar Extensions

### 1. Enhanced Inline Macro Support
**Priority**: Medium  
**Description**: The current grammar handles some inline macros as simple tokens. Consider expanding the grammar to provide better AST structure for macros like `kbd:[]`, `btn:[]`, `menu:[]`, `icon:[]`.

**Current State**: These are captured as single tokens (e.g., `ui_kbd: $ => token(prec(PREC.PASSTHROUGH + 10, /kbd:\\[[^\\]]*\\]/))`).

**Enhancement**: Break down into components:
- Macro name (`kbd`, `btn`, `menu`, `icon`) 
- Delimiter tokens (`[`, `]`)
- Macro content with proper parsing

**Benefits**: Better syntax highlighting granularity, improved AST navigation for tooling.

---

### 2. Advanced Table Cell Specifications
**Priority**: Low  
**Description**: Current table parsing supports basic cell specifications but could be enhanced for complex AsciiDoc table features.

**Current State**: Basic `table_cell` with optional `cell_spec` field.

**Enhancement**: Add support for:
- Column/row span specifications (`2+`, `3.2+`)
- Cell alignment specifications (`<`, `^`, `>`)  
- Cell style specifications (`a`, `e`, `h`, `l`, `m`, `s`, `v`)
- Complex cell formatting combinations

**Benefits**: Complete table specification support, better tooling for table editing.

---

### 3. Document Header Attributes
**Priority**: Medium  
**Description**: Enhanced parsing of document header attributes beyond simple attribute entries.

**Current State**: Document attributes are parsed as individual `attribute_entry` nodes.

**Enhancement**: Add structured document header parsing:
- Title and subtitle recognition
- Author information parsing
- Revision information parsing
- Grouped document attributes

**Benefits**: Better document metadata extraction, improved document analysis tools.

---

### 4. Include Directive Content Injection
**Priority**: Low  
**Description**: Currently include directives are parsed but don't inject actual content.

**Current State**: `include_directive` with path and options.

**Enhancement**: For static analysis and preview tools, consider content injection capabilities:
- Resolution of include paths
- Conditional include processing
- Tag/line range filtering

**Benefits**: Better preview capabilities, static analysis of complete documents.

---

## Syntax Highlighting Enhancements

### 5. Additional Language Injections
**Priority**: Medium  
**Description**: Extend language injection support beyond the current 12+ languages.

**Current Implementation**: Supports JavaScript, Python, Go, Rust, HTML, CSS, JSON, YAML, XML, Bash, PowerShell, SQL.

**Enhancement**: Add support for:
- TypeScript (`.ts`, `.tsx`)
- C/C++ (`.c`, `.cpp`, `.cc`, `.cxx`) 
- Java (`.java`)
- Kotlin (`.kt`, `.kts`)
- Scala (`.scala`)
- Ruby (`.rb`)
- PHP (`.php`)  
- Swift (`.swift`)
- Dart (`.dart`)
- R (`.r`)
- MATLAB (`.m`)
- Dockerfile
- More shell variants (`fish`, `zsh`)

**Benefits**: Broader language support for diverse technical documentation.

---

### 6. Conditional Directive Highlighting
**Priority**: Low  
**Description**: Enhanced highlighting for conditional content within ifdef/ifndef/ifeval blocks.

**Current Implementation**: Basic `@keyword.directive` for directive names.

**Enhancement**: 
- Highlight condition expressions in `ifeval` blocks
- Different styling for content inside conditional blocks
- Visual indicators for nested conditionals

**Benefits**: Better visual distinction of conditional content, easier debugging of complex conditionals.

---

### 7. Advanced Attribute Reference Highlighting
**Priority**: Low  
**Description**: Context-aware highlighting of attribute references.

**Current Implementation**: All `{attribute}` references use `@variable`.

**Enhancement**:
- Different highlighting for built-in vs. user-defined attributes
- Special highlighting for counter attributes (`{counter:name}`)
- Validation highlighting for undefined attribute references

**Benefits**: Better attribute management, easier identification of attribute issues.

---

### 8. Nested Inline Format Highlighting
**Priority**: Medium  
**Description**: Improve highlighting of nested inline formatting constructs.

**Current Implementation**: Basic highlighting for individual formatting elements.

**Enhancement**:
- Better handling of nested formatting (e.g., `*bold _and italic_*`)
- Proper precedence for overlapping formats
- Special handling for constrained vs. unconstrained formatting

**Benefits**: More accurate representation of complex inline formatting.

---

## Testing and Quality Improvements

### 9. Cross-Platform Line Ending Handling
**Priority**: Medium  
**Description**: Ensure consistent handling of different line ending styles.

**Current State**: Basic CRLF to LF normalization via `.gitattributes`.

**Enhancement**:
- Runtime line ending detection and normalization
- Test coverage for mixed line ending scenarios
- Better compatibility with Windows, macOS, and Linux workflows

**Benefits**: Improved cross-platform reliability, reduced test fragility.

---

### 10. Performance Optimization
**Priority**: Low  
**Description**: Optimize parsing performance for large AsciiDoc documents.

**Current State**: Functional parser with good test coverage.

**Enhancement**:
- Profile and optimize external scanner performance
- Reduce regex complexity where possible
- Implement incremental parsing optimizations
- Memory usage optimization for large documents

**Benefits**: Better performance for large documents, improved editor responsiveness.

---

## Implementation Priority

**High Priority**: Core functionality, critical bug fixes  
**Medium Priority**: User-facing improvements, enhanced compatibility  
**Low Priority**: Advanced features, performance optimizations

## Contributing

To work on any of these enhancements:

1. Check existing issues and PRs to avoid duplication
2. Create a feature branch: `git flow feature start enhancement-name`
3. Implement changes with comprehensive tests
4. Update documentation and examples
5. Submit PR with clear description of changes

## Related Resources

- [AsciiDoc Language Specification](https://docs.asciidoctor.org/asciidoc/latest/)
- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [nvim-treesitter Capture Guidelines](https://github.com/nvim-treesitter/nvim-treesitter/blob/master/CONTRIBUTING.md#parser-configurations)
