# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Comprehensive list system** with distinct node types for each list variant:
  - `asciidoc_unordered_list` - AsciiDoc unordered lists with asterisk markers (1-10 depth)
  - `markdown_unordered_list` - Markdown unordered lists with hyphen markers (indentation-based depth)
  - `ordered_list` - Ordered lists with sequential numbering 1-10 and period-based depth
  - `asciidoc_checklist` - AsciiDoc task checklists with `* [ ]` / `* [x]` syntax
  - `markdown_checklist` - Markdown task checklists with `- [ ]` / `- [x]` syntax
  - `description_list` - Definition lists with `term::` marker syntax
  - `list_item_continuation` - Block continuations via `+` marker
- Full support for nested lists up to 10 levels deep
- List item continuation blocks (+ marker) as child nodes
- Comprehensive test coverage for all list types including:
  - Basic single-level lists
  - Multi-level nesting
  - Empty items
  - Checkbox variations (empty, lowercase x, uppercase X)
  - List termination rules (two empty lines)
  - List continuations with various block types
- **Markdown-style fenced code blocks** with full language injection support
  - New grammar rules: `fenced_code_block`, `code_fence_open`, `info_string`, `language`, `code`, `code_line`, `code_fence_close`
  - External scanner support for backtick fence detection (` ``` `)
  - Language injection queries for syntax highlighting in editors
  - Support for 3+ backticks with nesting capability (` ```` ` contains ` ``` `)
  - Works seamlessly alongside traditional AsciiDoc `[source,language]` blocks
- Comprehensive test suite for Markdown fenced blocks
- Example file demonstrating both AsciiDoc and Markdown code block syntaxes

### Changed
- **BREAKING**: Old generic list node types (`unordered_list`, generic `ordered_list` structure) replaced with semantic variants
- Updated syntax highlighting queries to support Markdown fence delimiters
- Enhanced injection queries for both AsciiDoc and Markdown code blocks
- List grammar rules restructured for better AST semantic meaning

### Removed
- **BREAKING**: Deprecated `unordered_list` node type - use `asciidoc_unordered_list` or `markdown_unordered_list`
- **BREAKING**: Deprecated `callout_list` node type (separate implementation pending)
- Old mixed list item structures in favor of type-specific items

### Technical Details
- Added `MARKDOWN_FENCE_START`, `MARKDOWN_FENCE_END`, and `MARKDOWN_FENCE_CONTENT_LINE` external tokens
- Implemented scanner functions: `scan_markdown_fence_start()`, `scan_markdown_fence_end()`, `scan_markdown_fence_content_line()`
- Extended scanner state to track Markdown fence context independently from AsciiDoc fences
- List system uses precedence-based conflict resolution for proper nesting
- Continuation markers (`+`) are tokenized with `prec(5)` priority
- Each list type has dedicated node types to preserve semantic information in AST
