# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Table of Contents

1. [Quickstart and Essential Commands](#quickstart-and-essential-commands)
2. [Prerequisites and Installation](#prerequisites-and-installation)
3. [Tree-sitter Grammar Architecture](#tree-sitter-grammar-architecture)
4. [AsciiDoc Grammar Specifics](#asciidoc-grammar-specifics)
5. [Language Bindings](#language-bindings)
6. [Tests, Queries, and Fixtures](#tests-queries-and-fixtures)
7. [Development Workflow](#development-workflow)
8. [Git Flow and Commit Conventions](#git-flow-and-commit-conventions)
9. [Troubleshooting and Debugging](#troubleshooting-and-debugging)
10. [Release and Versioning](#release-and-versioning)
11. [References and Resources](#references-and-resources)

## Quickstart and Essential Commands

### Core Development Loop

```bash
# Install dependencies
pnpm install

# Generate parser from grammar.js
npx tree-sitter generate

# Build C artifacts for testing
npx tree-sitter build

# Run tests
npx tree-sitter test

# Parse files and inspect
npx tree-sitter parse examples/sample.adoc
npx tree-sitter parse --quiet --stat examples/sample.adoc

# Highlight files for visual verification
npx tree-sitter highlight examples/sample.adoc
```

### Debugging Commands

```bash
# Check tree-sitter installation and project health
npx tree-sitter doctor

# Debug grammar and parse table conflicts
npx tree-sitter debug-grammar

# Update test snapshots (use carefully)
npx tree-sitter test -u

# Run specific tests
npx tree-sitter test -f "test_name"

# Parse with JSON output for analysis
npx tree-sitter parse file.adoc --quiet --json
```

### Important Notes

- **Always run `npx tree-sitter generate`** after modifying `grammar.js`
- **Run tests frequently** during grammar development
- **Use local CLI** via `npx` to ensure consistent versions across team
- **Generate before building** - the C parser is generated from `grammar.js`

> **Version Note:** Advanced features like `token.immediate()`, `prec.dynamic()`, and `precedences` require Tree-sitter v0.20.0+. Check your version with `npx tree-sitter --version`.

## Prerequisites and Installation

### Core Requirements

- **C Toolchain**: GCC or Clang with make
- **Node.js**: LTS version (18+)
- **Package Manager**: pnpm (preferred) or npm
- **Git Flow CLI**: For branch management workflow

### Language-Specific (Optional)

Only required if developing specific language bindings:

- **Rust**: Stable toolchain with Cargo
- **Go**: 1.21+ with CGO enabled
- **Python**: 3.10+ with development headers
- **Swift**: 5.7+ with SwiftPM
- **C**: tree-sitter headers for direct consumers

### Installation Commands

```bash
# Install package manager (if needed)
# On Linux with Flatpak preference:
flatpak install --user flathub org.freedesktop.Platform.FFMPEG-full//22.08

# Install pnpm if JPD is not available
curl -fsSL https://get.pnpm.io/install.sh | sh

# Verify installations
npx tree-sitter --version
pnpm --version

# Install project dependencies
pnpm install

# Install Git Flow (if using Release-centric workflow)
# Ubuntu/Debian:
sudo apt install git-flow
# macOS:
brew install git-flow-avh
```

## Tree-sitter Grammar Architecture

### Development Workflow Loop

The tree-sitter development follows a test-driven approach:

1. **Write/Update Tests**: Add corpus tests describing desired behavior
2. **Modify Grammar**: Edit `grammar.js` to implement the feature
3. **Generate**: Run `npx tree-sitter generate`
4. **Test**: Run `npx tree-sitter test` until passing
5. **Update Queries**: Modify highlight/fold queries if node structure changes

### Grammar Building Blocks

```javascript path=/home/shelton-louis/tree-sitter-asciidoc/grammar.js start=10
module.exports = grammar({
  name: "asciidoc",

  rules: {
    // Root node follows tree-sitter convention
    source_file: $ => repeat($.block),
    
    block: $ => choice(
      $.section,
      $.attribute_entry,
      $.paragraph,
      $.blank_line
    ),
    
    // Additional grammar rules...
  }
});
```

**Core DSL Functions:**

- **Symbols (`$`)** — Reference other grammar rules with `$.rule_name`. Avoid names starting with `$.MISSING` or `$.UNEXPECTED`.
- **Sequences `seq(rule1, rule2, ...)`** — Match rules consecutively (equivalent to EBNF concatenation).
- **Alternatives `choice(rule1, rule2, ...)`** — Match one of several rules (equivalent to EBNF `|`).
- **Repetitions `repeat(rule)`** — Match zero-or-more occurrences (EBNF `{x}`).
- **Repetitions `repeat1(rule)`** — Match one-or-more occurrences (EBNF `x+`).
- **Options `optional(rule)`** — Match zero or one occurrence (EBNF `[x]`).
- **String/Regex literals** — Terminal symbols using JavaScript strings and regex patterns.

**Precedence and Associativity:**

- **Precedence `prec(number, rule)`** — Resolve LR(1) conflicts with numerical precedence.
- **Left Associativity `prec.left([number], rule)`** — Prefer earlier-ending matches.
- **Right Associativity `prec.right([number], rule)`** — Prefer later-ending matches.
- **Dynamic Precedence `prec.dynamic(number, rule)`** — Runtime conflict resolution for ambiguous parsing.

**Token Control:**

- **Tokens `token(rule)`** — Force complex rules into single tokens.
- **Immediate Tokens `token.immediate(rule)`** — Match without allowing whitespace before.

**Node Shaping:**

- **Aliases `alias(rule, name)`** — Change how nodes appear in syntax tree.
- **Fields `field(name, rule)`** — Assign named access to child nodes.

**Example with proper field usage:**
```javascript
section: $ => seq(
  field("title", $.section_title),
  field("body", $.section_body)
)
```

### Grammar Fields and Properties

**Grammar-level properties control parser behavior:**

```javascript
module.exports = grammar({
  name: "asciidoc",

  // Optional properties that modify parser behavior:
  extras: $ => [/\s/, $.comment],           // Skip these tokens anywhere
  inline: $ => [$.helper_rule],             // Remove from syntax tree
  conflicts: $ => [[$.array, $.pattern]],   // Declare intentional ambiguities
  externals: $ => [$.indent, $.dedent],     // External scanner tokens
  word: $ => $.identifier,                  // Keyword extraction optimization
  supertypes: $ => [$.statement],           // Group nodes for queries
  precedences: $ => [                       // Named precedence levels
    ['assignment', 'conditional', 'logical']
  ],

  rules: {
    // Grammar rules...
  }
});
```

**Property Details:**

- **`extras`** — Tokens that can appear anywhere (typically whitespace, comments). Default: `[/\s/]`.
- **`inline`** — Rules to remove from AST by inlining their definitions.
- **`conflicts`** — Arrays of rule sets with intentional LR(1) conflicts for GLR parsing.
- **`externals`** — Tokens provided by external scanner (C code).
- **`word`** — Single token for keyword extraction optimization (improves performance).
- **`supertypes`** — Hidden rules grouped as supertypes in generated node types file.
- **`precedences`** — Named precedence arrays for relative precedence (parse-time only).

> **Performance Note:** Using `word` for keyword extraction significantly improves parser generation time and reduces lexer complexity.

### Precedence and Associativity

**Understanding Precedence Types:**

1. **Lexical Precedence** — Which token to choose at a position: `token(prec(N, ...))`
2. **Parse Precedence** — Which rule to reduce: `prec(N, rule)`, `prec.left(rule)`, `prec.right(rule)`

**Parse Precedence Examples:**

```javascript
// Expression grammar with proper precedence
binary_expression: $ => choice(
  prec.left(2, seq($._expression, '*', $._expression)),  // Higher precedence
  prec.left(1, seq($._expression, '+', $._expression)),  // Lower precedence
),

unary_expression: $ => prec(3, seq('-', $._expression)), // Highest precedence
```

**Dynamic Precedence for Runtime Resolution:**

```javascript
// Handle dangling-else ambiguity
if_statement: $ => choice(
  prec.dynamic(1, seq('if', $.condition, $.statement, 'else', $.statement)),
  seq('if', $.condition, $.statement)
),
```

**When to Use Each:**

- **`prec.*`** functions: Resolve parse conflicts between rules
- **`token(prec(...))`**: Resolve lexical conflicts between tokens
- **Dynamic precedence**: Handle genuine ambiguities at runtime

### Lexical Analysis

**Context-Aware Lexing:**

Tree-sitter performs lexing on-demand during parsing, only recognizing tokens valid at the current position.

**Token Conflict Resolution (5-step precedence):**

1. **Context-aware Lexing** — Only try tokens valid at current parse state
2. **Lexical Precedence** — `token(prec(N, ...))` with higher N wins
3. **Match Length** — Longer matches win (maximal munch)
4. **Match Specificity** — String literals beat regex patterns
5. **Rule Order** — Earlier grammar rules win

**Token Functions:**

```javascript
// Force complex pattern into single token
string_literal: $ => token(seq(
  '"',
  repeat(choice(/[^"\\]/, seq('\\', /./)))),
  '"'
)),

// No whitespace allowed before token
inline_code: $ => seq(
  '`',
  token.immediate(repeat1(choice(/[^`]/, '\\`'))),
  '`'
),
```

**Keyword Extraction:**

Using `word` property enables automatic keyword optimization:

```javascript
module.exports = grammar({
  word: $ => $.identifier,  // Enables keyword extraction
  
  rules: {
    _expression: $ => choice(
      $.identifier,
      $.instanceof_expression,  // 'instanceof' becomes extracted keyword
    ),
    
    instanceof_expression: $ => seq($._expression, 'instanceof', $._expression),
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
  }
});
```

**Benefits:** Smaller lexer, better error detection, faster compilation.

### External Scanners

Use external scanners (C code) only when grammar rules cannot handle:

- **Context-sensitive parsing**: Matching delimited blocks with same markers
- **Indentation-based structure**: Complex whitespace-significant syntax
- **String interpolation**: Variable substitutions within strings

### Best Practices and Guidelines

**Two Key Properties for Good Tree-sitter Grammars:**

1. **Intuitive Structure** — Nodes correspond to recognizable language constructs
2. **LR(1) Adherence** — Minimize conflicts, prefer unambiguous rules

#### Whitespace Handling Best Practices

**Core Principle:**
- **Whitespace must NEVER appear as explicit AST nodes**
- Use `extras` to handle spaces, tabs, and newlines invisibly
- Tree-sitter automatically skips whitespace between tokens when defined in `extras`

**Correct Configuration:**
```javascript
module.exports = grammar({
  name: "asciidoc",
  extras: $ => [/\s/],  // Handles all whitespace (spaces, tabs, newlines)
  // OR if comments exist:
  extras: $ => [/\s/, $.comment],
  
  rules: {
    // Grammar rules without explicit whitespace handling
  }
});
```

**❌ INCORRECT Examples (Never Do This):**
```javascript
// DON'T create whitespace nodes
newline: $ => /\r?\n/,
blank_line: $ => prec.right(seq(repeat(/[ \t]/), $.newline)),

// DON'T reference whitespace in rules
paragraph: $ => seq($.text, $.newline),
section_title: $ => seq('=', $.title, $.newline),

// DON'T include whitespace in block choices
block: $ => choice($.section, $.paragraph, $.blank_line),
```

**✅ CORRECT Examples:**
```javascript
// Let paragraphs span multiple lines naturally
paragraph: $ => repeat1($.text),

// Section titles end naturally at line boundaries
section_title: $ => seq('=', /[ \t]+/, field('title', $.title)),

// Attribute entries end naturally
attribute_entry: $ => seq(':', field('name', $.name), ':', optional(field('value', $.value))),

// Only meaningful constructs in block choices
block: $ => choice($.section, $.attribute_entry, $.paragraph),
```

**Debugging Tips:**
- Use `npx tree-sitter parse file.adoc --quiet --json` to verify AST contains no whitespace nodes
- Use `npx tree-sitter debug-grammar` to analyze parsing conflicts
- Check that `extras` field correctly handles your whitespace patterns

**Important Notes:**
- Ensure block-level tokens have sufficient precedence (e.g., `token(prec(2, '='))`) so paragraphs don't absorb them
- Use `token()` strategically to create atomic tokens that can't be broken by whitespace
- Test with documents containing various whitespace patterns (tabs, spaces, blank lines)

**Performance Guidelines:**

- **Prefer grammar rules** over external scanners when possible
- **Use `word` token** for keyword extraction (major performance boost)
- **Avoid excessive conflicts** and ambiguous grammar constructs
- **Use precedence** strategically to resolve conflicts
- **Keep node names stable** once queries depend on them

**Error Recovery Design:**

- **Avoid overly-greedy tokens** that consume too much on errors
- **Prefer smaller constructs** over large monolithic rules
- **Use `conflicts`** only for genuine ambiguities, not grammar shortcuts
- **Test error cases** to ensure graceful degradation

**When to Use Conflicts:**

```javascript
// Genuine ambiguity: [x, y] as array vs destructuring pattern
conflicts: $ => [
  [$.array_literal, $.array_pattern],  // Both valid interpretations
],
```

**Cross-reference with debugging commands:**
- Use `npx tree-sitter debug-grammar` for conflict analysis
- Use `npx tree-sitter parse --json --stat` for error investigation

## AsciiDoc Grammar Specifics

### Target Scope and Dialect

- **Primary Target**: AsciiDoc as implemented by Asciidoctor
- **File Extensions**: `.adoc`, `.asciidoc`, `.asc`
- **Reference**: The comprehensive EBNF specification in `asciidoc-ebnf.md`

### Development Roadmap

**Stage 1: Foundation (Current)**
- Document structure and section titles (= to ======)
- Paragraphs and blank lines
- Basic attribute entries (`:attr: value`)
- Attribute references (`{attr}`)

**Stage 2: Lists and Blocks**
- Unordered lists (`*`, `-`) and ordered lists (`1.`, `2.`)
- Description lists (`term:: definition`)
- Delimited blocks (listing `----`, literal `....`, etc.)
- Block attributes and metadata

**Stage 3: Inline Content**
- Strong (`*bold*`), emphasis (`_italic_`), monospace (`` `code` ``)
- Links and cross-references
- Image macros (`image::path[]`)
- Basic macros

**Stage 4: Advanced Features**
- Tables with complex cell formatting
- Admonitions (NOTE, TIP, WARNING, etc.)
- Include directives (`include::file.adoc[]`)
- Conditional processing (`ifdef::`, `ifndef::`)


**Supertypes:**
- `block`: sections, paragraphs, lists, delimited blocks
- `inline`: emphasis, strong, monospace, links, attribute references

**Fields (using `field()` function):**
- `title` for sections and blocks: `field("title", $.section_title)`
- `name` and `value` for attributes: `field("name", $.attr_name), field("value", $.attr_value)`
- `items` for lists: `field("items", repeat($.list_item))`

### Context-Sensitive Features

AsciiDoc has several features requiring careful parsing:

- **Block Delimiters**: Same markers (----) for different block types
- **Attribute Processing**: Inheritance and substitution rules
- **Inline Markup**: Context-dependent recognition of formatting
- **Include Processing**: File inclusion with attribute substitution


## Tests, Queries, and Fixtures

### Corpus Tests

**Location**: `test/corpus/` directory (to be created)
**Structure**: Each test file contains multiple test cases

**Example Test:**
```
================================================================================
Section titles with different levels
================================================================================

= Document Title
== Level 2 Section
=== Level 3 Section

--------------------------------------------------------------------------------

(document
  (section
    (section_title (title))
  (section
    (section_title (title))
  (section
    (section_title (title))))
```

**Test Commands:**
```bash
# Run all tests
npx tree-sitter test

# Update snapshots after intentional grammar changes
npx tree-sitter test -u

# Run specific test file
npx tree-sitter test test/corpus/sections.txt
```

### Syntax Highlighting Queries

**Location**: `queries/highlights.scm`

**Example:**
```scheme
; Section titles
(section_title) @markup.heading

; Attributes
(attribute_entry
  (name) @property
  (value) @string)

; Inline formatting
(inline_strong) @markup.strong
(inline_emphasis) @markup.italic
(inline_monospace) @markup.raw

; Lists
(list_marker) @punctuation.delimiter
```

**Testing Highlights:**
```bash
npx tree-sitter highlight examples/sample.adoc
```

### Folding Queries

**Location**: `queries/folds.scm`

```scheme
; Fold section bodies
(section
  (section_title) @fold
  (section_body) @fold)

; Fold delimited blocks
(delimited_block) @fold
```

### Language Injections

**Location**: `queries/injections.scm`

```scheme
; Inject language highlighting in source blocks
((delimited_block
   (block_attributes) @injection.language
   (block_content) @injection.content)
 (#match? @injection.language "source"))
```

## Development Workflow

### Test-Driven Development

1. **Write test file** write the test files, but let me write the actual implementation, don't allow a test file to be empty.
2. **Run tests** to see current failure
3. **Modify grammar** to implement feature
4. **Generate and test** until passing
5. **Update queries** if node structure changed
6. **Commit atomically** with descriptive message

### Grammar Development Patterns

**Breadth-First Development Approach:**

1. **Create skeleton structure** covering major language constructs
2. **Implement breadth-first** — touch all major areas before diving deep
3. **Iterate incrementally** — add features one construct at a time

**Standard Rule Naming Conventions:**

**IMPORTANT: Tree-sitter Conventions (MUST FOLLOW):**
- `source_file` — **REQUIRED** root node representing entire file (never use `document` or other names)
- `_statement`/`_expression` — Core language constructs (hidden with `_` prefix if not in AST)
- `block` — Scoped content containers 
- `identifier` — Variable/function names (often used as `word` token)
- `string` — String literals
- `comment` — Comments (typically in `extras`)

**AsciiDoc-Specific Naming:**
- `section` — Document sections with titles
- `attribute_entry` — `:name: value` pairs
- `paragraph` — Text content blocks
- `title` — Section and block titles

**Structural Guidelines:**

- **Hidden rules**: Prefix with `_` for helpers that shouldn't appear in AST
- **Field usage**: Use `field()` for named child access in important relationships
- **Stable names**: Avoid renaming nodes once queries depend on them
- **Unique patterns**: Don't reuse identical regex patterns for different nodes

**Development Priorities:**

1. **Grammar rules first**: Prefer grammar solutions over external scanners
2. **Precedence for conflicts**: Use `prec()` rather than grammar restructuring
3. **Conflicts for true ambiguity**: Use `conflicts` only for genuine ambiguous cases
4. **External scanners last**: Only for context-sensitive features impossible in grammar

### Regular Validation

```bash
# Parse sample files to catch regressions
npx tree-sitter parse examples/*.adoc --quiet --stat

# Check highlighting on real content
npx tree-sitter highlight README.md

# Validate against corpus regularly
npx tree-sitter test
```

### Code Organization

- **Single grammar file**: Keep `grammar.js` focused and well-commented
- **Logical grouping**: Group related rules together
- **External scanner**: Add only when grammar rules cannot suffice
- **Documentation**: Comment complex rules and precedence decisions

## Git Flow and Commit Conventions

### Workflow Selection

**Release-Centric Workflow** (Default):
- Use `main` for production releases
- Use `develop` for integration
- Feature branches: `feature/branch-name`
- Release branches: `release/v1.0.0`
- Hotfix branches: `hotfix/critical-bug`

**CI-Centric Workflow** (If CI files detected):
- Use `main` as always-deployable
- Use `develop` for integration
- Frequent merges from `develop` to `main`
- No dedicated release branches

### Git Flow Setup

```bash
# Install Git Flow
sudo apt install git-flow  # Ubuntu/Debian
brew install git-flow-avh  # macOS

# Initialize in repository
git flow init

# Start feature branch
git flow feature start grammar-sections

# Finish feature (merges and deletes branch)
git flow feature finish grammar-sections
```

### Commit Message Format

```
<type>(<scope>): <subject line (≤ 64 chars)>

# <subtitle line (optional, ≤ 72 chars)>

<body>

<footer>
```

**Types:**
- `feat(grammar)`: New grammar features or rules
- `fix(grammar)`: Bug fixes in parsing behavior
- `docs(warp)`: Documentation updates
- `test(corpus)`: Test additions or modifications
- `refactor(grammar)`: Internal restructuring without behavior change
- `chore(deps)`: Dependency updates or maintenance

**Examples:**
```
feat(grammar): implement section titles level 1 to 6

# Add support for all AsciiDoc section heading levels

Implement section_title rule with proper precedence handling
for nested sections. Includes corpus tests for all six levels.

feat(bindings): add Python binding with wheel distribution

fix(grammar): resolve inline markup precedence conflicts

docs(warp): add development commands and grammar workflow
```

**Rules:**
- **One logical change** per commit (atomicity)
- **Imperative mood** in subject line
- **No trailing period** in subject
- **Commit files chronologically** when multiple files change

## Troubleshooting and Debugging

### Common Issues

**Cannot find tree-sitter**:
```bash
# Ensure local CLI is installed
pnpm list tree-sitter-cli
# If missing:
pnpm add -D tree-sitter-cli
# Always use via npx
npx tree-sitter --version
```

**Parser conflicts**:
```bash
# Debug parse table and conflicts
npx tree-sitter debug-grammar

# Reduce failing test to minimal case
# Comment out grammar rules to isolate issue
```

**External scanner build errors**:
```bash
# Validate C definitions match grammar expectations
# Check header includes in scanner.c
# Ensure scanner functions are properly exported
```

### Debugging Commands

```bash
# Inspect parse table conflicts
npx tree-sitter debug-grammar

# Parse with detailed statistics
npx tree-sitter parse --quiet --stat file.adoc

# Filter tests for specific failures
npx tree-sitter test -f "section"

# Get JSON AST for programmatic analysis
npx tree-sitter parse file.adoc --quiet --json > ast.json
```

### Performance Debugging

```bash
# Check parse time statistics
npx tree-sitter parse large-file.adoc --time

# Profile grammar generation
npx tree-sitter generate --log-graphs

# Benchmark against corpus
time npx tree-sitter test
```

## Release and Versioning

### Semantic Versioning

- **Major (1.0.0)**: Breaking changes to node names, structure, or API
- **Minor (0.1.0)**: New grammar features, backward-compatible
- **Patch (0.0.1)**: Bug fixes, no new features

### Release Process

**Release-Centric:**
```bash
# Start release branch
git flow release start v0.2.0

# Update version in package.json, Cargo.toml, etc.
# Test and finalize changes

# Finish release (merges to main and develop, creates tag)
git flow release finish v0.2.0
```

**CI-Centric:**
```bash
# Merge develop to main when ready
git checkout main
git merge develop

# Tag release
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main --tags
```

### Publishing Bindings

```bash
# Node.js package
npm publish

# Rust crate
cargo publish

# Python package
python -m build
python -m twine upload dist/*
```

## References and Resources

### Tree-sitter Documentation
- [Tree-sitter Guide](https://tree-sitter.github.io/tree-sitter/)
- [Creating Parsers](https://tree-sitter.github.io/tree-sitter/creating-parsers)
- [Grammar DSL Reference](https://tree-sitter.github.io/tree-sitter/creating-parsers/2-the-grammar-dsl.html)
- [Writing the Grammar](https://tree-sitter.github.io/tree-sitter/creating-parsers/3-writing-the-grammar.html)
- [Using Precedence](https://tree-sitter.github.io/tree-sitter/creating-parsers/3-writing-the-grammar.html#using-precedence)
- [Lexical Analysis](https://tree-sitter.github.io/tree-sitter/creating-parsers/3-writing-the-grammar.html#lexical-analysis)
- [Keyword Extraction](https://tree-sitter.github.io/tree-sitter/creating-parsers/3-writing-the-grammar.html#keyword-extraction)

### AsciiDoc References
- [AsciiDoc Language Documentation](https://docs.asciidoctor.org/asciidoc/latest/)
- [Asciidoctor User Manual](https://asciidoctor.org/docs/user-manual/)
- [AsciiDoc EBNF Specification](./asciidoc-ebnf.md) (Local)

### Example Grammars
- [tree-sitter-markdown](https://github.com/tree-sitter-grammars/tree-sitter-markdown) — Whitespace-sensitive inline constructs
- [tree-sitter-javascript](https://github.com/tree-sitter/tree-sitter-javascript) — Complex precedence patterns and conflicts
- [tree-sitter-rust](https://github.com/tree-sitter/tree-sitter-rust) — Comprehensive grammar with word token usage
- [tree-sitter-python](https://github.com/tree-sitter/tree-sitter-python) — External scanner for indentation

### Repository Structure
- [Tree-sitter.json Configuration](./tree-sitter.json)
- [Node.js Binding Tests](./bindings/node/binding_test.js)
- [Comprehensive EBNF Grammar](./asciidoc-ebnf.md)

---

## Maintenance Checklist

When making changes to this repository, update the following sections as needed:

- [ ] **Essential Commands**: If scripts or build process changes
- [ ] **Grammar Architecture**: When adding new grammar patterns or external scanners
- [ ] **AsciiDoc Specifics**: When roadmap phases are completed or priorities shift
- [ ] **Language Bindings**: When new bindings are added or APIs change
- [ ] **Queries**: When node names, structure, or semantic relationships change
- [ ] **Git Flow**: When CI/CD is added (switch to CI-centric workflow)

This WARP.md file should be reviewed and updated with each major grammar milestone to ensure accuracy for future development work.
