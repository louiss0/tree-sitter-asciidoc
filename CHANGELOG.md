# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Markdown-style fenced code blocks** with full language injection support
  - New grammar rules: `fenced_code_block`, `code_fence_open`, `info_string`, `language`, `code`, `code_line`, `code_fence_close`
  - External scanner support for backtick fence detection (` ``` `)
  - Language injection queries for syntax highlighting in editors
  - Support for 3+ backticks with nesting capability (` ```` ` contains ` ``` `)
  - Works seamlessly alongside traditional AsciiDoc `[source,language]` blocks
- Comprehensive test suite for Markdown fenced blocks
- Example file demonstrating both AsciiDoc and Markdown code block syntaxes

### Changed
- Updated syntax highlighting queries to support Markdown fence delimiters
- Enhanced injection queries for both AsciiDoc and Markdown code blocks

### Technical Details
- Added `MARKDOWN_FENCE_START`, `MARKDOWN_FENCE_END`, and `MARKDOWN_FENCE_CONTENT_LINE` external tokens
- Implemented scanner functions: `scan_markdown_fence_start()`, `scan_markdown_fence_end()`, `scan_markdown_fence_content_line()`
- Extended scanner state to track Markdown fence context independently from AsciiDoc fences
