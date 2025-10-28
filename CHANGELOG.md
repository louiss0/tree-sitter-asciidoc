# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - TBD

### Added
- Distinct AsciiDoc and Markdown blockquote nodes for proper language semantics
- Question-and-answer (`quanda`) variant for description lists with `[quanda]` attribute and question terms
- Comprehensive query files for editor integration:
  - `highlights.scm` - Complete syntax highlighting aligned with grammar
  - `folds.scm` - Folding patterns for all structural elements
  - `indents.scm` - Smart indentation logic
  - `injections.scm` - Language injection for code blocks and inline code
  - `locals.scm` - LSP scope tracking for variables and references
  - `tags.scm` - Symbol navigation for sections, anchors, and references
  - `textobjects.scm` - Text object selection for structural editing

### Changed
- Improved description list parsing with colon-based depth requiring list children only
- Enhanced error recovery for conditional blocks and include directives
- Restructured non-table grammar constructs for consistency
- Updated test expectations to match current grammar structure

### Fixed
- **Critical**: Eliminated left recursion in expression rules preventing infinite loops
- **Critical**: Resolved section hierarchy infinite recursion
- **Critical**: Prevented scanner segfaults by removing TSLexer copies and zero-length tokens
- Corrected table cell specification parsing for proper column/row handling
- Fixed table support for `||===` fences and header cells; excluded `|` from text content
- Resolved invalid query node names causing syntax highlighting failures
- Fixed `quanda` term crash in description lists
- Corrected link macro parsing and syntax highlighting
- Improved regex patterns in generated parser

### Removed
- Obsolete test files and disabled highlight tests
- Temporary documentation files (SCANNER_ENHANCEMENTS.md, NESTED_LISTS_STATUS.md, etc.)
- Unused normalization scripts
- Duplicate example files

## [0.2.0] - Previous Work

### Added
- **Comprehensive list system** with distinct node types for each list variant:
  - `asciidoc_unordered_list` - AsciiDoc unordered lists with asterisk markers (1-10 depth)
  - `markdown_unordered_list` - Markdown unordered lists with hyphen markers (indentation-based depth)
  - `ordered_list` - Ordered lists with sequential numbering 1-10 and period-based depth
  - `asciidoc_checklist` - AsciiDoc task checklists with `* [ ]` / `* [x]` syntax
  - `markdown_checklist` - Markdown task checklists with `- [ ]` / `- [x]` syntax
  - `description_list` - Definition lists with `term::` marker syntax
  - `list_item_continuation` - Block continuations via `+` marker
- Full support for nested lists up to 10 levels deep with recursive grammar rules
- Scanner depth tracking infrastructure for managing nested list levels
- List item continuation blocks (`+` marker) as child nodes
- Comprehensive test coverage for all list types including:
  - Basic single-level lists
  - Multi-level nesting
  - Empty items
  - Checkbox variations (empty, lowercase x, uppercase X)
  - List termination rules (two empty lines)
  - List continuations with various block types
- **Markdown-style fenced code blocks** with full language injection support:
  - New grammar rules: `fenced_code_block`, `code_fence_open`, `info_string`, `language`, `code`, `code_line`, `code_fence_close`
  - External scanner support for backtick fence detection (` ``` `)
  - Language injection queries for syntax highlighting in editors
  - Support for 3+ backticks with nesting capability (` ```` ` contains ` ``` `)
  - Works seamlessly alongside traditional AsciiDoc `[source,language]` blocks
- Comprehensive test suite for Markdown fenced blocks
- Example files demonstrating both AsciiDoc and Markdown code block syntaxes

### Changed
- **BREAKING**: Old generic list node types (`unordered_list`, generic `ordered_list` structure) replaced with semantic variants
- Updated syntax highlighting queries to support Markdown fence delimiters
- Enhanced injection queries for both AsciiDoc and Markdown code blocks
- List grammar rules restructured for better AST semantic meaning
- Improved inline formatting with proper nesting and escape sequence support

### Fixed
- Completely removed `stdio.h` dependency from scanner for WASM compatibility
- Resolved table cell content parsing conflicts
- Improved description list parsing and grammar conflict resolution
- Fixed if-directives, callout markers, and list structure inconsistencies
- Resolved critical grammar bugs affecting parser stability

### Removed
- **BREAKING**: Deprecated `unordered_list` node type - use `asciidoc_unordered_list` or `markdown_unordered_list`
- **BREAKING**: Deprecated `callout_list` node type (separate implementation pending)
- Old mixed list item structures in favor of type-specific items
- All `stdio.h` dependencies for WASM target compatibility

### Technical Details
- Added `MARKDOWN_FENCE_START`, `MARKDOWN_FENCE_END`, and `MARKDOWN_FENCE_CONTENT_LINE` external tokens
- Implemented scanner functions: `scan_markdown_fence_start()`, `scan_markdown_fence_end()`, `scan_markdown_fence_content_line()`
- Extended scanner state to track Markdown fence context independently from AsciiDoc fences
- List system uses precedence-based conflict resolution for proper nesting
- Continuation markers (`+`) are tokenized with `prec(5)` priority
- Each list type has dedicated node types to preserve semantic information in AST
- Scanner fully WASM-compatible without C stdio dependencies

## [0.1.0] - Initial Release

### Added
- **Document structure foundation**:
  - Section hierarchy with proper nesting (h1-h6 equivalent)
  - Document title and preamble support
  - `source_file` root node following tree-sitter conventions
- **Block elements**:
  - Delimited blocks with metadata support
  - Paragraph and block admonitions (NOTE, TIP, IMPORTANT, WARNING, CAUTION)
  - Basic list parsing (unordered, ordered, description lists)
  - Block attributes and metadata
  - Table blocks with basic structure
- **Inline formatting**:
  - Bold, italic, monospace, superscript, subscript
  - Inline code and passthrough
  - Links (URL and anchor-based)
  - Image macros
  - Proper nesting and escape sequence handling
- **Advanced features**:
  - Conditional directives (ifdef, ifndef, ifeval) - both block and inline
  - Include directives
  - Anchors and cross-references
  - Footnotes
  - Attributes (document and inline)
- **Query files for editor integration**:
  - Basic syntax highlighting (`highlights.scm`)
  - Code folding patterns (`folds.scm`)
- **Comprehensive test suite**:
  - 100% test coverage for implemented features
  - Document structure tests
  - List parsing tests
  - Inline formatting tests
  - Conditional directive tests
  - Admonition tests

### Technical Details
- External scanner written in C for context-sensitive parsing
- Smart section nesting with hierarchical document structure
- Attribute parsing with proper name/value node separation
- Hidden nodes for whitespace and internal tokens to keep AST clean
- Precedence-based conflict resolution for grammar ambiguities
- Proper handling of empty attribute values and whitespace
