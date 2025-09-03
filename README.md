# tree-sitter-asciidoc

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [AsciiDoc](https://asciidoc.org/), a text document format for writing documentation, articles, manuals, books, and other content.

## Features

This parser currently supports the following AsciiDoc elements:

### Document Structure
- **Document headers** with title, author, and revision info
- **Hierarchical sections** (levels 1-6) with automatic nesting
- **Attributes** (document and local scope)

### Block Elements
- **Paragraphs** with multi-line support
- **Lists** (comprehensive support):
  - **Unordered lists** with `*` and `-` markers
  - **Ordered lists** with numeric markers (e.g., `1.`, `10.`)
  - **Description lists** with `term:: description` format
  - **Callout lists** with `<n>` markers

### List Features

#### Unordered Lists
```asciidoc
* First item
* Second item
* Third item

- Alternative marker
- Another item
```

#### Ordered Lists
```asciidoc
1. First numbered item
2. Second numbered item
10. Multi-digit numbers supported
```

#### Description Lists
```asciidoc
Term 1:: Description for the first term
Another Term:: Description for another term
Complex Term:: This can be a longer description
```

#### Callout Lists
```asciidoc
<1> First callout explanation
<2> Second callout explanation
<10> Multi-digit callouts supported
```

### Grammar Compliance

- **WARP Compliant**: All whitespace is handled through `extras`, no whitespace nodes in the AST
- **EBNF Specification**: Follows the formal AsciiDoc EBNF grammar (lines 274-302) for list parsing
- **Precedence Rules**: List markers are properly distinguished from paragraph text
- **Space Requirements**: Enforces space after list markers to avoid false positives

### Current Limitations

- List continuations (multi-paragraph items) not yet implemented
- Nested lists not yet supported
- Advanced list features (complex nesting, blocks within lists) pending

## Installation

### Node.js
```bash
npm install tree-sitter-asciidoc
```

### Language Bindings
This grammar includes bindings for:
- Node.js
- Python
- Rust
- Swift
- Go
- C/C++

## Usage

### Node.js
```javascript
const Parser = require('tree-sitter');
const AsciiDoc = require('tree-sitter-asciidoc');

const parser = new Parser();
parser.setLanguage(AsciiDoc);

const sourceCode = `
= Document Title

This is a paragraph.

* First item
* Second item

1. Numbered item
2. Another numbered item
`;

const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
```

## Development

### Building
```bash
npm install
npx tree-sitter generate
npx tree-sitter build
```

### Testing
```bash
npx tree-sitter test
```

### Editor Integration
This grammar can be used with any editor that supports tree-sitter, including:
- Neovim with nvim-treesitter
- Emacs with tree-sitter support
- Helix editor
- Zed editor

## Contributing

Contributions are welcome! This parser is actively being developed to support more AsciiDoc features.

### Planned Features
- List continuations and nesting
- Delimited blocks (listings, examples, quotes)
- Tables
- Inline formatting (bold, italic, monospace)
- Cross-references and links
- Admonitions

## License

MIT License - see LICENSE file for details.
