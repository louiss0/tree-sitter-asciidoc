# Tree Sitter AsciiDoc Highlighting Tests

This directory contains syntax highlighting tests for the Tree Sitter AsciiDoc parser. These tests ensure that AsciiDoc constructs are correctly highlighted with appropriate capture names.

## Current Coverage Matrix

Based on our current `queries/highlights.scm`, here are the constructs we currently support:

| Construct | Expected Capture | Test File | Sample |
|-----------|------------------|-----------|--------|
| Section Titles | `@markup.heading` | `headings.adoc` | `= Title`, `== Section`, `=== Subsection` |
| Attribute Entries | `@property` | `attributes.adoc` | `:name: value`, `:author: John Doe` |
| Paragraph Text | `@markup.text` | `paragraphs.adoc` | Regular paragraph content |
| Text Segments | `@markup.text` | `paragraphs.adoc` | Individual text pieces within paragraphs |
| Conditional Directives | `@keyword` | `conditionals.adoc` | `ifdef::`, `ifndef::`, `ifeval::`, `endif::` |
| Unordered List Items | `@markup.list` | `lists.adoc` | `* Item`, `** Sub-item` |
| Ordered List Items | `@markup.list` | `lists.adoc` | `1. Item`, `a. Sub-item` |
| Description List Items | `@markup.list` | `lists.adoc` | `Term:: Description` |
| Callout List Items | `@markup.list` | `lists.adoc` | `<1> Callout description` |

## Planned Future Coverage

The following constructs should be added in future iterations:

| Construct | Expected Capture | Priority |
|-----------|------------------|----------|
| Inline Formatting | `@markup.bold`, `@markup.italic`, `@markup.code` | High |
| Links & URLs | `@markup.link.url`, `@markup.link.label` | High |
| Code Blocks | `@markup.code.block`, `@markup.raw` | High |
| Comments | `@comment` | Medium |
| Admonitions | `@markup.quote`, `@markup.strong` | Medium |
| Tables | `@markup.table` | Medium |
| Macros | `@function`, `@function.macro` | Low |

## How to Run Tests

### Quick Test
```bash
# From project root
test/highlight/tools/run.sh
```

### Using Package Manager Scripts
```bash
# Using your preferred package manager (JPD → pnpm → npm)
pnpm test:highlights

# To update snapshots when expected behavior changes
pnpm test:highlights:update
```

### Using Make (if Makefile is available)
```bash
make test-highlights

# To update snapshots
make update-highlights
```

## How to Add a New Test

1. **Create a test case**: Add a new `.adoc` file in `test/highlight/cases/` with minimal samples of the construct you want to test.

2. **Run the test runner**: Execute `test/highlight/tools/run.sh` to generate the initial capture output.

3. **Review captures**: Check the generated file in `test/highlight/.actual/` to see what captures your construct produces.

4. **Update highlights.scm if needed**: If the captures don't match your expectations, update `queries/highlights.scm`.

5. **Bootstrap snapshots**: Re-run the test runner to generate expected snapshots in `test/highlight/expected/`.

6. **Commit**: Commit both the test case and the expected snapshot.

## Test File Naming Convention

- `headings.adoc` - Document title and section headings (levels 1-6)
- `attributes.adoc` - Attribute entries and references  
- `paragraphs.adoc` - Regular paragraph text
- `lists.adoc` - All list types (unordered, ordered, description, callout)
- `conditionals.adoc` - Conditional inclusion directives
- `inline-formatting.adoc` - Bold, italic, monospace, etc. (future)
- `links-xrefs.adoc` - URLs, links, cross-references (future)
- `code-blocks.adoc` - Source code blocks (future)
- `comments.adoc` - Line and block comments (future)
- `admonitions.adoc` - NOTE, TIP, WARNING blocks (future)

## Troubleshooting

### Test Runner Fails
- Ensure you've run `tree-sitter generate && tree-sitter build` before running tests
- Check that your Tree Sitter CLI version is recent (`tree-sitter --version`)
- Verify your `.adoc` files in `cases/` are valid AsciiDoc

### Captures Don't Match Expected  
- Review the actual captures in `test/highlight/.actual/`
- Check if your `queries/highlights.scm` needs updates
- Consider if the grammar itself needs changes to properly parse the construct

### Missing Dependencies
- Ensure Tree Sitter CLI is installed: `npm install -g tree-sitter-cli`
- Verify git-flow is available for proper branching: `git flow version`

## Test Architecture Notes

The test runner uses Tree Sitter's built-in query functionality:
- Tries `tree-sitter parse -q` first (modern CLI)
- Falls back to `tree-sitter query -c` (older CLI)
- Normalizes whitespace for stable diffs
- Uses bash for cross-platform compatibility in Windows environments
