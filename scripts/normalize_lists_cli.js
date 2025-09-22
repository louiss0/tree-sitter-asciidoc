#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function readInputFiles(args) {
  if (args.length === 0) {
    const data = fs.readFileSync(0, 'utf8');
    const tmp = path.join(os.tmpdir(), `asciidoc-norm-${Date.now()}.adoc`);
    fs.writeFileSync(tmp, data, 'utf8');
    return [{ filename: '<stdin>', contentPath: tmp, cleanup: () => fs.unlinkSync(tmp) }];
  }
  return args.map((p) => ({ filename: p, contentPath: p, cleanup: () => {} }));
}

function runTreeSitterParse(filePath) {
  const cmd = `npx tree-sitter parse "${filePath}"`;
  const r = spawnSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: true });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(`tree-sitter parse failed (exit ${r.status}): ${r.stderr}`);
  }
  return r.stdout; // S-expression
}

function splitTopLevelNodesInSourceFile(s) {
  // Expect s like: (source_file ...)
  const start = s.indexOf('(source_file');
  if (start === -1) return [];
  let i = start;
  let depth = 0;
  const nodes = [];
  // Move to first child after "(source_file"
  while (i < s.length && s[i] !== '(') { i++; }
  // We're at the first '(', which is '(source_file'
  // Advance to after its type token
  // Find first space after (source_file
  const firstSpace = s.indexOf(' ', start);
  i = firstSpace === -1 ? s.length : firstSpace + 1;

  // Now iterate tokens at depth 1 (children of source_file)
  let nodeStart = -1;
  for (; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') {
      if (depth === 0) nodeStart = i;
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0 && nodeStart !== -1) {
        const nodeText = s.slice(nodeStart, i + 1);
        nodes.push(nodeText);
        nodeStart = -1;
      }
      if (depth < 0) break;
    }
  }
  return nodes;
}

function nodeTypeFromSExpr(nodeS) {
  // nodeS starts with e.g. (unordered_list ...)
  const m = /^\(\s*([a-zA-Z0-9_]+)/.exec(nodeS);
  return m ? m[1] : '';
}

function mergeAdjacentLists(nodes) {
  const out = [];
  let i = 0;
  while (i < nodes.length) {
    const t = nodeTypeFromSExpr(nodes[i]);
    if (t === 'unordered_list' || t === 'ordered_list') {
      const listType = t;
      // Start new merged list by stripping outer parens and type from first
      const mergedChildren = [];
      let j = i;
      while (j < nodes.length && nodeTypeFromSExpr(nodes[j]) === listType) {
        const s = nodes[j];
        // Extract contents inside the top-level node: remove leading '(type' and trailing ')'
        const firstSpace = s.indexOf(' ');
        if (firstSpace !== -1 && s.endsWith(')')) {
          const inner = s.slice(firstSpace + 1, s.length - 1).trim();
          if (inner.length) mergedChildren.push(inner);
        } else {
          // If cannot split cleanly, just append the whole node sans type
          mergedChildren.push(s);
        }
        j++;
      }
      const merged = `(${listType} ${mergedChildren.join(' ')})`;
      out.push(merged);
      i = j;
    } else {
      out.push(nodes[i]);
      i++;
    }
  }
  return out;
}

function rebuildSourceFileSExpr(original, mergedNodes) {
  const start = original.indexOf('(source_file');
  if (start === -1) return original;
  // Find end matching paren of (source_file ...)
  let depth = 0;
  let end = -1;
  for (let i = start; i < original.length; i++) {
    const ch = original[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return original;
  // Build new content
  const headerEnd = original.indexOf(' ', start);
  const prefix = original.slice(0, headerEnd + 1);
  const suffix = original.slice(end);
  const body = mergedNodes.join(' ');
  return `${prefix}${body}${suffix}`;
}

function main() {
  const args = process.argv.slice(2);
  const files = readInputFiles(args);
  const outputs = [];
  for (const f of files) {
    try {
      const s = runTreeSitterParse(f.contentPath);
      const nodes = splitTopLevelNodesInSourceFile(s);
      const merged = mergeAdjacentLists(nodes);
      const rebuilt = rebuildSourceFileSExpr(s, merged);
      outputs.push({ filename: f.filename, s_expr: rebuilt });
    } finally {
      try { f.cleanup(); } catch (_) {}
    }
  }
  process.stdout.write(JSON.stringify(outputs, null, 2));
}

if (require.main === module) main();