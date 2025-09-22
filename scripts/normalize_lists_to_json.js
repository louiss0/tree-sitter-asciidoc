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
  return r.stdout; // S-expression with ranges and fields
}

function splitTopLevelNodesInSourceFile(s) {
  const start = s.indexOf('(source_file');
  if (start === -1) return [];
  // Find first space after (source_file
  const headerEnd = s.indexOf(' ', start);
  let i = headerEnd === -1 ? s.length : headerEnd + 1;
  let depth = 0;
  let nodeStart = -1;
  const nodes = [];
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
      const mergedChildren = [];
      let j = i;
      while (j < nodes.length && nodeTypeFromSExpr(nodes[j]) === listType) {
        const s = nodes[j];
        const firstSpace = s.indexOf(' ');
        if (firstSpace !== -1 && s.endsWith(')')) {
          const inner = s.slice(firstSpace + 1, s.length - 1).trim();
          if (inner.length) mergedChildren.push(inner);
        } else {
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

function splitChildNodes(sExpr) {
  // Takes an sExpr like (type child child) and returns array of child sExpr strings
  // Find first space after type
  const firstSpace = sExpr.indexOf(' ');
  if (firstSpace === -1) return [];
  const inner = sExpr.slice(firstSpace + 1, sExpr.endsWith(')') ? sExpr.length - 1 : sExpr.length);
  const res = [];
  let depth = 0, start = -1;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '(') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0 && start !== -1) {
        res.push(inner.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return res;
}

function toJson(nodes) {
  const out = [];
  for (const n of nodes) {
    const t = nodeTypeFromSExpr(n);
    if (t === 'unordered_list' || t === 'ordered_list') {
      const children = splitChildNodes(n);
      const items = [];
      for (const c of children) {
        const ct = nodeTypeFromSExpr(c);
        if (ct === 'unordered_list_item' || ct === 'ordered_list_item') {
          // Keep the item's sExpr as-is; clients can further parse if needed
          items.push({ type: ct, s_expr: c });
        }
      }
      out.push({ type: t, items });
    } else {
      out.push({ type: t, s_expr: n });
    }
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const files = readInputFiles(args);
  const results = [];
  for (const f of files) {
    try {
      const s = runTreeSitterParse(f.contentPath);
      const nodes = splitTopLevelNodesInSourceFile(s);
      const merged = mergeAdjacentLists(nodes);
      const json = toJson(merged);
      results.push({ filename: f.filename, lists_normalized: json });
    } finally {
      try { f.cleanup(); } catch (_) {}
    }
  }
  process.stdout.write(JSON.stringify(results, null, 2));
}

if (require.main === module) main();