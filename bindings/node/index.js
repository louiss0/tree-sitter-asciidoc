const root = require("path").join(__dirname, "..", "..");

const native =
  typeof process.versions.bun === "string"
    // Support `bun build --compile` by being statically analyzable enough to find the .node file at build-time
    ? require(`../../prebuilds/${process.platform}-${process.arch}/tree-sitter-asciidoc.node`)
    : require("node-gyp-build")(root);

// Export the language object directly for compatibility with tree-sitter@0.22 runtime tests
module.exports = native.language || native;

try {
  module.exports.nodeTypeInfo = require("../../src/node-types.json");
} catch (_) {}
