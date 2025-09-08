const Parser = require('tree-sitter');
const Asciidoc = require('.');

const parser = new Parser();
parser.setLanguage(Asciidoc);

const fs = require('fs');

if (process.argv.length !== 3) {
    console.error('Usage: node parse_test.js <file>');
    process.exit(1);
}

const filename = process.argv[2];
const sourceCode = fs.readFileSync(filename, 'utf8');

const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
