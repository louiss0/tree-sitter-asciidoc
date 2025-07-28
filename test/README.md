# Tree-sitter AsciiDoc Test Suite

This directory contains comprehensive test cases for the tree-sitter-asciidoc parser, following Test-Driven Development (TDD) principles.

## Test Structure

Tests are organized in the `corpus/` directory, with each file focusing on specific AsciiDoc features:

### Core Features
- `section-headings.txt` - Section hierarchy, discrete headings, anchors, cross-references
- `text-formatting.txt` - Basic text formatting (bold, italic, monospace, etc.)
- `text-formatting-advanced.txt` - Combined formatting, underlines, smart quotes, escapes
- `lists.txt` - All list types (unordered, ordered, description, Q&A, checklists)
- `links-and-references.txt` - URLs, links, email links, cross-references, anchors
- `images-and-media.txt` - Images, videos, audio files with various attributes
- `tables.txt` - Table structures, alignment, spanning, CSV format, nested tables
- `block-elements.txt` - Source, listing, literal, quote, example, sidebar blocks
- `admonitions.txt` - NOTE, TIP, IMPORTANT, WARNING, CAUTION blocks
- `attributes.txt` - Attribute definitions, references, counters, substitutions
- `conditionals.txt` - ifdef, ifndef, ifeval directives with nested conditions
- `includes.txt` - Include directives with various options
- `comments.txt` - Single-line and multi-line comment blocks
- `macros.txt` - Keyboard, button, menu, icon, footnote, math macros

## Running Tests

### Run All Tests
```bash
./test/run-all-tests.sh
```

### Run Specific Test File
```bash
tree-sitter test -f test/corpus/section-headings.txt
```

### Run All Corpus Tests
```bash
tree-sitter test
```

## Test Format

Tests follow the tree-sitter corpus test format:

```
====
TEST_CATEGORY: Test description
====
AsciiDoc input content
----
(expected_parse_tree
  (structure))
```

Each test case includes:
1. A descriptive header between `====` markers
2. The AsciiDoc input to parse
3. The expected parse tree between `----` markers

## Adding New Tests

1. Choose the appropriate test file or create a new one for new features
2. Add test cases following the format above
3. Start with simple cases and progress to complex edge cases
4. Include both positive tests (valid syntax) and negative tests (error cases)
5. Run tests to ensure they pass

## Test Categories

When adding tests, use consistent category prefixes:
- `SECTION_HEADINGS:` for section-related tests
- `TEXT_FORMATTING:` for inline formatting
- `LISTS:` for list structures
- `TABLES:` for table features
- `BLOCK_ELEMENTS:` for block-level elements
- etc.

## Best Practices

1. **Isolated Tests**: Each test should focus on a single feature
2. **Edge Cases**: Include boundary conditions and error scenarios
3. **Real-World Examples**: Use practical AsciiDoc patterns
4. **Comprehensive Coverage**: Test all variations of each feature
5. **Clear Descriptions**: Use descriptive test names
6. **Incremental Complexity**: Start simple, build up to complex cases

## Debugging Failed Tests

When a test fails:
1. Check the actual output vs expected output
2. Verify the grammar rules in `grammar.js`
3. Use `tree-sitter parse` to debug specific inputs
4. Update either the test or grammar as appropriate

## Test Coverage Goals

The test suite aims to cover:
- ✅ All AsciiDoc syntax elements
- ✅ Common usage patterns
- ✅ Edge cases and error conditions
- ✅ Nested and combined features
- ✅ Performance with large documents
- ✅ Compatibility with AsciiDoc specification

## Contributing

When contributing new features:
1. Write tests FIRST (TDD approach)
2. Ensure all existing tests still pass
3. Add tests for any new syntax elements
4. Document any new test categories
5. Update this README if needed
