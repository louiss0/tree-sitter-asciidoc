#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Parser = require('tree-sitter');

function loadLanguage() {
  try {
    // Prefer local binding
    const lang = require('..');
    return lang;
  } catch (e) {
    try {
      return require('../bindings/node');
    } catch (e2) {
      console.error('Failed to load language binding:', e2.message);
      process.exit(1);
    }
  }
}

function readInputFiles(args) {
  if (args.length === 0) {
    // Read stdin
    const data = fs.readFileSync(0, 'utf8');
    return [{ filename: '<stdin>', content: data }];
  }
  return args.map((p) => ({ filename: p, content: fs.readFileSync(p, 'utf8') }));
}

function nodeRange(n) {
  return { startIndex: n.startIndex, endIndex: n.endIndex };
}

function isList(node) {
  return node.type === 'unordered_list' || node.type === 'ordered_list';
}

function listType(node) { return node.type; }

function listItems(node) {
  const items = [];
  for (let i = 0; i < node.namedChildCount; i++) {
    const c = node.namedChild(i);
    if (c.type === 'unordered_list_item' || c.type === 'ordered_list_item') {
      items.push({ type: c.type, range: nodeRange(c) });
    }
  }
  return items;
}

function normalizeTopLevel(root) {
  const out = [];
  let group = null;
  for (let i = 0; i < root.namedChildCount; i++) {
    const n = root.namedChild(i);
    if (isList(n)) {
      const t = listType(n);
      if (!group || group.type !== t) {
        if (group) out.push(group);
        group = { type: t, range: { startIndex: n.startIndex, endIndex: n.endIndex }, items: [] };
      }
      const its = listItems(n);
      group.items.push(...its);
      // Expand group end range to include this node
      group.range.endIndex = n.endIndex;
    } else {
      if (group) { out.push(group); group = null; }
      out.push({ type: n.type, range: nodeRange(n) });
    }
  }
  if (group) out.push(group);
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const files = readInputFiles(args);
  const parser = new Parser();
  const lang = loadLanguage();
  parser.setLanguage(lang);

  const results = files.map(({ filename, content }) => {
    const tree = parser.parse(content);
    const root = tree.rootNode;
    const normalized = normalizeTopLevel(root);
    return { filename, normalized };
  });

  process.stdout.write(JSON.stringify(results, null, 2));
}

if (require.main === module) main();