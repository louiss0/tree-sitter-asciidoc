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
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
```

**Key Concepts:**

- **Rules**: Define the syntax structure (`section_title: $ => seq('=', /\S+/)`)
- **Precedence**: Resolve ambiguities (`prec(1, rule)`, `prec.left(rule)`)
- **Fields**: Add semantic structure (`title: $.section_title`)
- **Supertypes**: Group related nodes for queries (`supertypes: $ => [$.block, $.inline]`)
- **Extras**: Whitespace and comments (`extras: $ => [/\s/, $.comment]`)

### External Scanners

Use external scanners (C code) only when grammar rules cannot handle:

- **Context-sensitive parsing**: Matching delimited blocks with same markers
- **Indentation-based structure**: Complex whitespace-significant syntax
- **String interpolation**: Variable substitutions within strings

### Performance Guidelines

- **Prefer grammar rules** over external scanners when possible
- **Avoid excessive conflicts** and ambiguous grammar constructs  
- **Use precedence** strategically to resolve conflicts
- **Keep node names stable** once queries depend on them

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

### Node Naming Conventions

```
document
├── section
│   ├── section_title
│   └── section_body
├── paragraph
├── list
│   └── list_item
├── delimited_block
├── attribute_entry
└── attribute_reference
```

**Supertypes:**
- `block`: sections, paragraphs, lists, delimited blocks
- `inline`: emphasis, strong, monospace, links, attribute references

**Fields:**
- `title` for sections and blocks
- `name` and `value` for attributes
- `items` for lists

### Context-Sensitive Features

AsciiDoc has several features requiring careful parsing:

- **Block Delimiters**: Same markers (----) for different block types
- **Attribute Processing**: Inheritance and substitution rules
- **Inline Markup**: Context-dependent recognition of formatting
- **Include Processing**: File inclusion with attribute substitution

## Language Bindings

All bindings consume the same generated C source files in `src/`.

### Node.js Binding

**Location**: `bindings/node/`
**Files**: `index.js`, `binding.cc`, `index.d.ts`

**Usage:**
```javascript path=null start=null
const Parser = require('tree-sitter');
const Asciidoc = require('tree-sitter-asciidoc');

const parser = new Parser();
parser.setLanguage(Asciidoc);

const tree = parser.parse('= Document Title\n\nParagraph content.');
console.log(tree.rootNode.toString());
```

**Build**: `pnpm install` handles compilation via node-gyp

### Rust Binding  

**Location**: `bindings/rust/`
**Files**: `Cargo.toml`, `lib.rs`, `build.rs`

**Usage:**
```rust path=null start=null
use tree_sitter::{Language, Parser};

extern "C" {
    fn tree_sitter_asciidoc() -> Language;
}

fn main() {
    let language = unsafe { tree_sitter_asciidoc() };
    let mut parser = Parser::new();
    parser.set_language(language).unwrap();
    
    let tree = parser.parse("= Title\n\nContent.", None).unwrap();
    println!("{}", tree.root_node().to_sexp());
}
```

**Build**: `cargo build` in bindings directory

### Go Binding

**Location**: `bindings/go/`
**Files**: `binding.go`, `binding_test.go`

**Usage:**
```go path=null start=null
package main

import (
    sitter "github.com/tree-sitter/go-tree-sitter"
    "github.com/louiss0/tree-sitter-asciidoc"
)

func main() {
    language := asciidoc.GetLanguage()
    parser := sitter.NewParser()
    parser.SetLanguage(language)
    
    tree := parser.Parse(nil, []byte("= Title\n\nContent."))
    fmt.Println(tree.RootNode().String())
}
```

**Build**: `go build` in bindings directory

### Python Binding

**Location**: Root directory with `pyproject.toml` and `setup.py`

**Usage:**
```python path=null start=null
import tree_sitter_asciidoc as tsasciidoc
from tree_sitter import Language, Parser

ASCIIDOC_LANGUAGE = Language(tsasciidoc.language(), "asciidoc")
parser = Parser()
parser.set_language(ASCIIDOC_LANGUAGE)

tree = parser.parse(b"= Title\n\nContent.")
print(tree.root_node.sexp())
```

**Build**: `pip install .` builds and installs the package

### Swift Binding

**Location**: `bindings/swift/` or root-level `Package.swift`
**Package**: TreeSitterAsciidoc

**Usage:**
```swift path=null start=null
import TreeSitter
import TreeSitterAsciidoc

let parser = Parser()
try parser.setLanguage(tree_sitter_asciidoc())

let tree = parser.parse("= Title\n\nContent.")
print(tree?.rootNode?.sexp ?? "Parse failed")
```

**Build**: `swift build`

### C Binding

**Usage**: Include parser sources directly in your build

```c path=null start=null
#include "tree_sitter/api.h"

// Declare the language function
TSLanguage *tree_sitter_asciidoc(void);

int main() {
    TSParser *parser = ts_parser_new();
    ts_parser_set_language(parser, tree_sitter_asciidoc());
    
    TSTree *tree = ts_parser_parse_string(parser, NULL, "= Title\n\nContent.", 18);
    TSNode root = ts_tree_root_node(tree);
    
    char *sexp = ts_node_string(root);
    printf("%s\n", sexp);
    
    free(sexp);
    ts_tree_delete(tree);
    ts_parser_delete(parser);
    return 0;
}
```

**Build**: Link against `src/parser.c` and tree-sitter library

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

1. **Write failing test** describing desired behavior
2. **Run tests** to see current failure
3. **Modify grammar** to implement feature
4. **Generate and test** until passing
5. **Update queries** if node structure changed
6. **Commit atomically** with descriptive message

### Grammar Development Patterns

- **Start simple**: Implement basic patterns before complex ones
- **Use precedence**: Resolve conflicts with `prec()` rather than grammar restructuring
- **Stable names**: Avoid renaming nodes once queries depend on them
- **Field usage**: Use semantic fields for important relationships
- **External scanners last**: Prefer grammar rules over external C code

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
- [Grammar DSL](https://tree-sitter.github.io/tree-sitter/creating-parsers#the-grammar-dsl)

### AsciiDoc References
- [AsciiDoc Language Documentation](https://docs.asciidoctor.org/asciidoc/latest/)
- [Asciidoctor User Manual](https://asciidoctor.org/docs/user-manual/)
- [AsciiDoc EBNF Specification](./asciidoc-ebnf.md) (Local)

### Example Grammars
- [tree-sitter-markdown](https://github.com/tree-sitter-grammars/tree-sitter-markdown)
- [tree-sitter-rust](https://github.com/tree-sitter/tree-sitter-rust)
- [tree-sitter-javascript](https://github.com/tree-sitter/tree-sitter-javascript)

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
