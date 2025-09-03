const Parser = require('tree-sitter');
const AsciiDoc = require('.');

const parser = new Parser();
parser.setLanguage(AsciiDoc);

// Test simple unordered list
const code = `* First item
* Second item
* Third item`;

try {
  const tree = parser.parse(code);
  console.log('Parsed successfully!');
  console.log(tree.rootNode.toString());
} catch (error) {
  console.error('Parse failed:', error);
}

// Test ordered list
const orderedCode = `1. First item
2. Second item
3. Third item`;

try {
  const tree2 = parser.parse(orderedCode);
  console.log('\\nOrdered list parsed successfully!');
  console.log(tree2.rootNode.toString());
} catch (error) {
  console.error('Ordered list parse failed:', error);
}

// Test description list
const descCode = `Term 1:: Description 1
Term 2:: Description 2`;

try {
  const tree3 = parser.parse(descCode);
  console.log('\\nDescription list parsed successfully!');
  console.log(tree3.rootNode.toString());
} catch (error) {
  console.error('Description list parse failed:', error);
}
