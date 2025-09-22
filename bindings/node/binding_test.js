const assert = require("node:assert");
const { test } = require("node:test");

const Parser = require("tree-sitter");

test("can load grammar", () => {
  const parser = new Parser();
  const mod = require(".");
  const lang = mod.language || mod;
  // Make sure nodeTypeInfo is attached where the runtime expects it
  if (!lang.nodeTypeInfo && mod.nodeTypeInfo) {
    try { lang.nodeTypeInfo = mod.nodeTypeInfo; } catch (_) {}
  }
  assert.doesNotThrow(() => parser.setLanguage(lang));
});
