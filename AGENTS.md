# Agents Notes

## Limitations

- Tree Sitter doesn't support look ahead regex
- Regex must be JS compatible
- You can't use group regex
- You can't use the same regex twice for nodes
- Don't touch the bindings folder
- Tree-sitter does not support syntactic rules that match the empty string
unless they are used only as the grammar's start rule.
- Grammar rules must not be left recursive; rewrite such productions so they consume a token before recurring.
- Follow the guide's pattern: capture the language-bearing node and attach metadata with directives such as `(#set! injection.language language)`, `(#set! injection.include-children)`, or `(#set! injection.combined)` when the embedded region spans multiple children.

### Additional limitations from "Writing the Grammar"

- Keep the grammar's start rule (typically `source_file`) as the very first property in `rules` whenever you reorder content, because Tree-sitter treats that entry as the parser root.
- Token conflicts resolve strictly at the lexing stage: `token(prec(n, ...))` beats lower-precedence tokens, equally ranked tokens favor the longer match, literal string tokens beat regex tokens of the same length, and only then does rule order apply; parse precedence cannot override these decisions.
- Distinguish lexical precedence from parse precedence: `token(prec(...))` only affects token selection, while `prec(...)`, `prec.left(...)`, and `prec.right(...)` outside of `token()` only affect how existing tokens are grouped.
- Remember that Tree-sitter's lexer is context-aware; it only considers tokens that could follow from the current parse state, so ambiguous tokens must be made distinguishable by the grammar instead of relying on lookahead.
- When tokens still collide after setting precedence, factor their shared prefixes into separate rules or tighten them with `token.immediate`/external scanners per the "Conflicting Tokens" guidance instead of expecting the parser to guess.
- Declare a single `word` token and avoid reusing it directly in other rules; alias it when you need a public name so keyword extraction and lexer generation remain correct.

## Naming conventions from the Tree-sitter grammar guide

- Name visible grammar rules with descriptive `snake_case` identifiers so the generated node types stay predictable and easy to query.
- Prefix helper-only rules with `_` (for example `_list` or `_continuation`) to keep them private; expose their important children via `field(...)` on the parent node instead.
- Keep literal tokens obvious by using quoted punctuation and unique identifiers for keyword-like constructs; avoid reusing a rule name for different syntactic ideas.
- Give `field` names lowerCamelCase that mirrors the semantic role (such as `title`, `target`, or `attributeList`) so highlight queries and injections can reference them consistently.
- Reach for `alias(rule, desired_name)` when the published node type should differ from the helper rule name instead of duplicating the production.


## How Tree-sitter works (grammar guide recap)

- The exported `grammar` call describes tokens, extras, precedences, conflicts, externals, and rules; the Tree-sitter generator compiles it into an incremental LR parser.
- Visible rules expand via `seq`, `choice`, `repeat`, `repeat1`, and `optional`, and each successful rule creates a syntax node with the rule's name.
- Tokens defined as JS regexes or string literals are recognized automatically; wrap multi-character tokens in `token()` (or `token.immediate`) when they must stay intact or adjacency-sensitive.
- Rules listed in `extras` (typically whitespace and comments) are accepted automatically between tokens, so you never need to sprinkle them through every production.
- Declare context-sensitive tokens under `externals` and implement them in `scanner.c` whenever the parser must enforce a very specific character sequence.
- Use `prec`, `prec.left`, `prec.right`, or `prec.dynamic` plus the `conflicts` array to resolve ambiguities so the generated parse remains deterministic for queries.


## Rules from the Tree-sitter grammar guide

- Build productions with `seq`, `choice`, `optional`, `repeat`, and `repeat1` exactly as described in the guide.
- Describe tokens with string literals or JS regexes, and wrap multi-character tokens in `token()` when they need to stay a single unit.
- List whitespace and comment tokens in `extras` so they are skipped globally instead of repeated in every rule.
- Use `prec()`, `prec.left()`, `prec.right()`, or `prec.dynamic()` to encode precedence/associativity whenever the guide calls for it.
- Label important children with `field(name, rule)` and keep structural helpers hidden via `_helper` rules or the `inline` property.
- Reach for `alias()` when you need descriptive node names and declare unavoidable ambiguities with the `conflicts` array.

### Additional rules from "Writing the Grammar"

- Shape the grammar from the spec outward: start with a `source_file` rule that references each major construct, then implement and test each construct incrementally with `tree-sitter parse`.
- Try parsing real `.adoc` snippets with `tree-sitter parse --quiet` while iterating so you can see ambiguous states and adjust conflicts or precedence immediately, just like the guide demonstrates.
- Reuse the canonical rule names the guide lists (`source_file`, `expression`, `identifier`, `comment`, etc.) so downstream queries and tooling can rely on familiar structures.
- Solve precedence with `prec`, `prec.left`, and `prec.right` directly on the recursive parts instead of mirroring every intermediate expression level from the language spec.
- Declare `conflicts` explicitly for intentional ambiguities (like array literals vs. patterns) so Tree-sitter explores each interpretation deterministically.
- Hide structural helpers as described: prefix throwaway nodes with `_`, mark one-child wrappers as `inline`, and promote broad categories to `supertypes` to keep parse trees shallow.
- Reference reusable rules (such as `$.comment`) inside `extras` instead of raw regexes so the lexer doesn't inline large patterns everywhere.
- Set the grammar's `word` helper (often `$.identifier`) to enable keyword extraction, improving both diagnostics and parser generation speed.
- Follow the "Using Extras" advice: track syntactically significant blank lines or indentation outside of `extras`, but let general whitespace/comments live there so every rule stays clean.
- Apply the "Using Fields" guidance: label meaningful children with `field()` so queries can match `(field: (node))` patterns directly, and rely on `supertypes` for broad categories instead of duplicating structures.
- Restructure ambiguous productions to share their prefixes (e.g., wrap the shared `seq` around the diverging tail) before leaning on precedence or conflicts, matching the refactor-first approach the guide emphasizes.
- Add targeted tests for every new construct as you implement it so `tree-sitter test` can lock in the expected parse tree—this mirrors the iterative workflow outlined in the guide.

### Keyword extraction notes from "Writing the Grammar"

- Set the grammar's `word` property (usually to `$.identifier`) so Tree-sitter performs two-step lexing that first matches the `word` token, then upgrades it to any overlapping keyword; this catches invalid tokens like `instanceofSomething` just like the doc's example.
- Because keyword extraction piggybacks on the `word` token, keeping that token unique (and only reusing it via `alias`) ensures the generated lexer stays small and compilation remains fast.
- Take advantage of keyword extraction to improve diagnostics: when the lexer can distinguish a keyword from a bare identifier, the parser surfaces clearer errors for mis-typed constructs.

### Standard rule names cited by the guide

- `source_file`: represents the entire document and should remain the root rule/tree node.
- `expression` / `statement`: super-rules that collect the concrete expression/statement forms for the language.
- `block`: wraps block scopes so their contents stay grouped; often pairs with `{ ... }` or equivalent fences.
- `identifier`: bare variable/attribute names; also a good candidate for the grammar's `word` helper token.
- `comment`: whitespace-like trivia that usually belongs in `extras`.
- `string`: captures literal text constructs; the doc uses this name consistently across grammars.
## Things to do

- If the grammar has a field use that for the query!
- Remove all generated files after sucessful tests
- Ask me about tests before implementing new features
- When I allow you to write tests wait for me to approve them
- If there are nodes that are only for a specific node make it private and use a field to expose it
- Use the scanner to resolve conflicts related to charaters needing to exist in a specific sequence

## When to do what

- When adding or renaming a rule, update the highlight queries to capture the new node/field names immediately so editor integrations stay accurate.
- When a sequence can repeat, model it with `_list` helpers that use `seq` plus `repeat`/`repeat1` so separators and trailing punctuation stay explicit and easy to maintain.
- When the parser reports conflicts, first refactor the productions (factoring shared prefixes or using fields); only extend the `conflicts` array after exhausting simpler fixes.
- When two tokens must appear with no skipped extras, wrap the follower with `token.immediate` or move the pair into the external scanner per the grammar guide.
- When a feature seems to require lookahead, restructure it so the grammar consumes a distinguishing prefix before recursing, because Tree-sitter cannot rely on lookahead regexes.
- When new behavior might demand tests, pause and ask the user for approval before writing or running them, per the repository workflow rules.

## Highlight test command (no bash required)

Run the snapshot-based highlighting tests directly via PowerShell using this one-liner:

```powershell
pwsh -NoLogo -NoProfile -Command "
$ErrorActionPreference = 'Stop';
$root = Get-Location;
$cases = Join-Path $root 'test/highlight/cases';
$expected = Join-Path $root 'test/highlight/expected';
$actual = Join-Path $root 'test/highlight/.actual';
if (Test-Path $actual) { Remove-Item $actual -Recurse -Force; }
New-Item -ItemType Directory -Path $actual -Force | Out-Null;
$fail = @();
Get-ChildItem -Path $cases -Filter '*.adoc' | Sort-Object Name | ForEach-Object {
  $base = $_.BaseName;
  Write-Host "Processing $($base)...";
  $actPath = Join-Path $actual ($base + '.captures');
  $expPath = Join-Path $expected ($base + '.captures');
  $output = & npx tree-sitter query -c (Join-Path $root 'queries/highlights.scm') $_.FullName 2>$null;
  $normalized = ($output | ForEach-Object {
    $line = $_ -replace '^[\s`u00A0]+', '';
    $line = $line -replace '\s+', ' ';
    $line.TrimEnd()
  }) -join "`n";
  [System.IO.File]::WriteAllText($actPath, $normalized + "`n");
  if (!(Test-Path $expPath)) {
    Copy-Item $actPath $expPath;
  } elseif ((Get-Content -Raw $expPath) -ne (Get-Content -Raw $actPath)) {
    $fail += $base;
    Write-Warning "Mismatch for $base";
  } else {
    Write-Host '  ok';
  }
};
if ($fail.Count -gt 0) {
  throw "Highlight tests failed: $($fail -join ', ')";
} else {
  Write-Host 'All highlight tests passed.';
}"
```

Pass `--%` before the command if your shell needs literal quoting (e.g., `pwsh --% …`). Use the same snippet with the `Copy-Item` line uncommented to refresh expected captures.

## Quick highlight visualization

Generate an HTML preview for any `.adoc` file with the Tree-sitter CLI:

```powershell
pwsh -NoLogo -NoProfile -Command "
$ErrorActionPreference = 'Stop';
$root = Get-Location;
$source = Join-Path $root 'test/highlight/cases/comprehensive.adoc';
$html = Join-Path $root 'test/highlight/.actual/comprehensive.html';
npx tree-sitter highlight --html $source > $html;
Write-Host 'Saved highlight preview to ' + $html;
"
```

Edit `$source`/`$html` to point at any document you want to inspect, then open the generated HTML in a browser to see the captures visually.
