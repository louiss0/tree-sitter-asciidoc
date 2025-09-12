# Tree Sitter AsciiDoc Highlighting Tests

This directory contains syntax highlighting tests for the Tree Sitter AsciiDoc parser. These tests ensure that AsciiDoc constructs are correctly highlighted with appropriate capture names.

## Current Coverage Matrix

Based on our enhanced `queries/highlights.scm`, here are the constructs we now support:

### Core Structure
| Construct | Expected Capture | Test File | Sample |
|-----------|------------------|-----------|--------|
| Section Titles | `@markup.heading`, `@markup.heading.1-6` | `headings.adoc` | `= Title`, `== Section`, `=== Subsection` |
| Attribute Entries | `@attribute`, `@string` | `attributes-enhanced.adoc` | `:name: value`, `:author: John Doe` |
| Attribute References | `@attribute` | `attributes-enhanced.adoc` | `{name}`, `{author}` |
| Paragraph Text | `@markup.text` | `paragraphs.adoc` | Regular paragraph content |

### Conditional Directives  
| Construct | Expected Capture | Test File | Sample |
|-----------|------------------|-----------|--------|
| Conditional Directives | `@keyword.directive` | `conditional-directives.adoc` | `ifdef::`, `ifndef::`, `ifeval::`, `endif::` |

### Lists and Markers
| Construct | Expected Capture | Test File | Sample |
|-----------|------------------|-----------|--------|
| List Markers | `@markup.list.marker` | `lists-enhanced.adoc` | `*`, `1.`, `a.`, `i.` |
| List Items | `@markup.list` | `lists-enhanced.adoc` | `* Item`, `** Sub-item` |
| List Continuations | `@punctuation.special` | `lists-enhanced.adoc` | `+` (continuation marker) |
| Callout Markers | `@markup.list.marker` | `lists-enhanced.adoc` | `<1>`, `<2>`, `<3>` |

### Block Elements
| Construct | Expected Capture | Test File | Sample |
|-----------|------------------|-----------|--------|
| Block Fences | `@punctuation.special` | `delimited-blocks.adoc` | `====`, `----`, `....`, `____` |
| Block Content | `@markup.raw.block`, `@markup.quote` | `delimited-blocks.adoc` | Content within blocks |
| Table Fences | `@punctuation.special` | `tables-advanced.adoc` | `\|===` |
| Table Specs | `@operator`, `@number` | `tables-advanced.adoc` | `2+`, `^`, `s\|`, `3*` |

### Inline Elements
| Construct | Expected Capture | Test File | Sample |
|-----------|------------------|-----------|--------|
| Strong Text | `@markup.strong` | `inline-formatting.adoc` | `*bold*` |
| Emphasis Text | `@markup.italic` | `inline-formatting.adoc` | `_italic_` |
| Monospace Text | `@markup.raw.inline` | `inline-formatting.adoc` | `` `code` `` |
| Superscript/Subscript | `@string.special` | `inline-formatting.adoc` | `^super^`, `~sub~` |
| Passthrough Text | `@markup.raw.inline` | `inline-formatting.adoc` | `+++raw+++` |
| Role Spans | `@punctuation.special` | `inline-formatting.adoc` | `[.role]#text#` |

### Links and References
| Construct | Expected Capture | Test File | Sample |
|-----------|------------------|-----------|--------|
| Auto Links | `@markup.link.url` | `links-anchors.adoc` | `https://example.com` |
| Link Macros | `@function.macro` | `links-anchors.adoc` | `link:url[text]` |
| Anchors | `@label` | `links-anchors.adoc` | `[[id]]`, `[[id,text]]` |
| Cross References | `@markup.link`, `@function.macro` | `links-anchors.adoc` | `<<target>>`, `xref:target[]` |
| Bibliography | `@label`, `@string` | `links-anchors.adoc` | `[[[ref]]]`, `<<ref>>` |

### Macros
| Construct | Expected Capture | Test File | Sample |
|-----------|------------------|-----------|--------|
| UI Macros | `@function.macro` | `macros.adoc` | `kbd:[Ctrl+C]`, `btn:[Save]`, `menu:File[Save]` |
| Image Macros | `@function.macro` | `macros.adoc` | `image::path[alt]` |
| Footnotes | `@function.macro` | `macros.adoc` | `footnote:[text]`, `footnoteref:id[]` |
| Index Terms | `@function.macro`, `@label` | `macros.adoc` | `((term))`, `indexterm:[term]` |
| Pass Macros | `@function.macro` | `macros.adoc` | `pass:[content]` |
| Include Directives | `@string.special.path`, `@attribute` | `macros.adoc` | `include::path[options]` |

### Math
| Construct | Expected Capture | Test File | Sample |
|-----------|------------------|-----------|--------|
| Math Macros | `@function.macro` | `math.adoc` | `stem:[formula]`, `latexmath:[equation]` |
| Math Content | `@markup.math` | `math.adoc` | Math expressions and equations |
| Math Block Labels | `@attribute` | `math.adoc` | `[stem]`, `[latexmath]`, `[asciimath]` |

## Completed Enhanced Coverage

✅ **All major AsciiDoc constructs now have comprehensive highlighting support!**

Our enhanced highlighting system provides:
- **87.5% modern capture adoption** (28 modern vs 4 legacy captures)
- **21 strategic priority settings** for optimal rendering
- **Component-level highlighting** for complex constructs
- **Future-ready documentation** for grammar improvements

## Remaining Future Enhancements

While we have excellent coverage, these areas could benefit from even more granular highlighting:

| Enhancement | Expected Benefit | Priority |
|-------------|------------------|----------|
| Delimiter token separation | Individual `*`, `_`, `` ` `` highlighting | Low |
| Structured macro parsing | URL/path/attribute component highlighting | Medium |
| Role component parsing | Separate role names from brackets | Low |
| Advanced table cell parsing | Structured cell content highlighting | Low |
| Comment syntax highlighting | Line vs block comment distinction | Medium |

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

### Core Structure
- `headings.adoc` - Document title and section headings (levels 1-6)
- `attributes.adoc` - Basic attribute entries and references  
- `attributes-enhanced.adoc` - ✅ **NEW** Advanced attribute handling, unsets, counters
- `paragraphs.adoc` - Regular paragraph text

### Lists and Structure  
- `lists.adoc` - Basic list types (unordered, ordered, description, callout)
- `lists-enhanced.adoc` - ✅ **NEW** Enhanced lists with markers, continuations, nesting

### Blocks and Fences
- `delimited-blocks.adoc` - ✅ **NEW** All block types with fence highlighting
- `tables-advanced.adoc` - ✅ **NEW** Tables with specs, options, complex formatting

### Conditional Logic
- `conditionals.adoc` - Basic conditional inclusion directives  
- `conditional-directives.adoc` - ✅ **NEW** Enhanced directive highlighting with nesting

### Inline Content
- `inline-formatting.adoc` - ✅ **NEW** Bold, italic, monospace, super/subscript, roles
- `links-anchors.adoc` - ✅ **NEW** URLs, links, anchors, cross-references, bibliography

### Advanced Features
- `macros.adoc` - ✅ **NEW** UI macros, footnotes, images, includes, index terms
- `math.adoc` - ✅ **NEW** Inline and block math with stem/latex/asciimath

### Future Additions
- `comments.adoc` - Line and block comments (planned)
- `admonitions.adoc` - NOTE, TIP, WARNING blocks (planned)

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
