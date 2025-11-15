# Plain Text Conflict Report

This document captures every place where the current `plain_text` rule (see `grammar.js:731-745`) still wins over richer inline constructs, as well as the corpus tests that fail as a result. All observations are based on `npx tree-sitter test --overview-only` and focused re-runs of the individual failing suites executed on 2025-11-15.

---

## 1. Current Test Failures

The following corpus suites are red. Numbers reference the case indexes inside `test/corpus/*.txt`.

| Suite | Cases | Dominant Failure Mode |
| --- | --- | --- |
| `12_conditional_conflicts.txt` | 46–52 | directive-looking paragraphs parsed as `plain_text` instead of conditional nodes |
| `13_inline_conditionals.txt` | 53 | inline directive swallowed by `plain_text` |
| `15_anchors_footnotes_xrefs.txt` | 67–86 | anchors, cross-references, and footnotes start with `plain_text` + `ERROR` before the inline node |
| `16_admonitions.txt` | 87–92 | paragraph admonition labels captured as `plain_text` |
| `16_paragraph_admonitions.txt` | 93–104 | same as above; inline formatting after the label is never reached |
| `17_block_admonitions.txt` | 106–112 | block metadata consumed as `plain_text`, preventing the block wrapper from seeing the delimited content |
| `18_basic_formatting.txt` | 113–118 | strong/emphasis/monospace/superscript/subscript tokens suppressed by greedy text runs |
| `19_inline_formatting.txt` | 119–125 | inline formatting, attribute references, auto links, explicit links, and passthroughs parsed as raw text |
| `20_inline_edge_cases.txt` | 126–133 | macro prefixes (`xref:`, `footnote:`, `pass:`, etc.) and role spans hidden by `plain_text`; precedence tests fail for the same reason |
| `20_links_images.txt` | 134–138 | URLs and `image:` macros reduced to plain text |
| `21_block_edge_cases.txt` | 139–145 | inline subsections (anchors, attribute references) still appear as bare `plain_text`; list continuations lose their `LIST_CONTINUATION` token |
| `21_passthrough.txt` | 146–149 | passthrough macros/matched `+++` never surface because consecutive `+` characters are read as text |
| `22_macros_roles.txt` | 150–154 | role spans, math macros, UI macros reduced to text and `ERROR` nodes |
| `23_inline_edge_cases.txt` | 155–173 | all precedence, escape, and role-span variants fail (same root cause) |
| `25_include_directives.txt` | 180–190 | include lines parse correctly, but adjacent paragraphs still use the old inline shape and show `plain_text` + `ERROR` diffs |
| `26_index_terms.txt` | 191–200 | `indexterm:`, `indexterm2:`, and `(((...)))` patterns are consumed as text; the parser never emits `index_term` nodes |
| `30_math_macros.txt` | 223–227 | `stem:`, `latexmath:`, and `asciimath:` macros remain as `plain_text` + `formatting_fallback` |

_(Suites 24, 27, 28, and 29 are green.)_

---

## 2. Collision Inventory

Below are the concrete contexts where `_plain_text_segment` wins when it should yield to a richer inline token. For each category, the referenced test file demonstrates the failure and should be inspected while adjusting the grammar or scanner.

### 2.1 Conditional Shims

- `test/corpus/12_conditional_conflicts.txt:46-52` — words like `ifdef::TARGET[]` at the start of a paragraph match the `[A-Za-z0-9_]…` clause of `_plain_text_segment`, so the parser never recognizes the conditional directive.
- `test/corpus/13_inline_conditionals.txt:53` — inline directives embedded in text are tokenized as whole `plain_text` chunks; the conditional rule never triggers.

### 2.2 Anchors, Cross References, and Footnotes

- `test/corpus/15_anchors_footnotes_xrefs.txt:67-86` — each `[[id]]`, `<<id>>`, `xref:`, `footnote:`, and `footnoteref:` token sits behind a lead-in `plain_text` token and a placeholder `ERROR` node. The new `inline_seq_nonempty` wrapper is correct, but the inline element itself is delayed until after the scanner thinks it saw “word characters.”
- `test/corpus/21_block_edge_cases.txt:144` — anchors that appear immediately in section titles or paragraphs are still reported as `plain_text` in the outer section, preventing downstream consumers from seeing the anchor fields.

### 2.3 Paragraph and Block Admonitions

- `test/corpus/16_admonitions*.txt` (cases 87–104) — the label `NOTE:` (and peers) is matched entirely by `_plain_text_segment`. The `paragraph_admonition` rule expects `admonition_label` followed by `_inline_text`, so it never fires, leaving the paragraph in the default text form.
- `test/corpus/17_block_admonitions.txt:106-112` — block-level admonitions suffer the same issue because the attribute list `[NOTE]` is parsed as plain text before the delimited block begins, and the block wrapper never attaches.

### 2.4 Inline Formatting Tokens

- `test/corpus/18_basic_formatting.txt:113-118` and `19_inline_formatting.txt:119-125` — tokens such as `*`, `_`, `` ` ``, `^`, and `~` are supposed to start specific inline nodes (`strong`, `emphasis`, `monospace`, `superscript`, `subscript`). The current regex `/[A-Za-z0-9_!$.,'"():+\-\/={}^%?#]+/` includes `*`, `_`, `` ` ``, `^`, and `~`, so the scanner consumes the delimiter itself as part of the text segment before the formatting rule can open.
- Escape-handling edge cases in `test/corpus/20_inline_edge_cases.txt:126-133` and `23_inline_edge_cases.txt:155-173` are the same problem amplified: once the opening marker is absorbed by `plain_text`, the parser falls back to `formatting_fallback` or `ERROR`.

### 2.5 Auto Links, Explicit Links, and Images

- `test/corpus/19_inline_formatting.txt:123-124` and `20_links_images.txt:134-138` — URLs such as `https://`, `ftp://`, and `mailto:` match the `_plain_text_segment` regex (letters, digits, punctuation). Consequently, the `auto_link` and `explicit_link` rules never have a chance to capture them, leaving only `plain_text` nodes and occasional trailing `ERROR`s where the `[]` brackets are parsed as `formatting_fallback`.

### 2.6 Passthroughs and Macro-like Prefixes

- `test/corpus/19_inline_formatting.txt:125`, `21_passthrough.txt:146-149`, and `23_inline_edge_cases.txt:168-170` — sequences of `+` characters (“passthrough triple plus”) are treated as part of `_plain_text_segment` because `+` is allowed in the regex. The dedicated inline nodes (`passthrough_triple_plus` and `pass_macro`) never appear and the parser reports `plain_text` plus `formatting_fallback`.
- Macro prefixes such as `pass:`, `footnote:`, `footnoteref:`, `xref:`, `link:`, `stem:`, `latexmath:`, `asciimath:`, `indexterm:`, `indexterm2:`, `kbd:[`, `btn:[`, and `menu:` fall into the same bucket (see cases 130–133 in `test/corpus/20_inline_edge_cases.txt`, `22_macros_roles.txt:150-154`, `26_index_terms.txt:191-200`, and `30_math_macros.txt:223-227`). Each prefix is composed of letters and punctuation allowed by `_plain_text_segment`, so the scanner commits to `plain_text` before the macro rule can run.

### 2.7 Role Spans

- `test/corpus/22_macros_roles.txt:150-151` and `23_inline_edge_cases.txt:156,164,173` — role spans look like `[.role]#content#`. The initial `[` is one of the characters that stops `plain_text`, but `_inline_gap` may introduce immediate whitespace, and the scanner currently hands the `[` to `formatting_fallback` instead of `role_span`, generating `ERROR` nodes.

### 2.8 Attribute References

- `test/corpus/19_inline_formatting.txt:122`, `21_block_edge_cases.txt:145`, and `22_macros_roles.txt:154` — `{attr}` is simple enough that the regex matches the braces and the inner name in one go. That suppresses the `attribute_reference` inline node and any downstream logic (e.g., attribute precedence tests) fails.

### 2.9 Index Terms and Math Macros

- `test/corpus/26_index_terms.txt:191-200` — both macro-based (`indexterm:[primary]`) and concealed (`(((primary)))`) index terms are parsed as `plain_text` followed by `formatting_fallback`. The scanner reads the entire token because commas, parentheses, and brackets are allowed by `_plain_text_segment`.
- `test/corpus/30_math_macros.txt:223-227` — `stem:[…]`, `latexmath:[…]`, and `asciimath:[…]` have the same problem: the identifier plus colon is accepted as raw text, so the math macro rule never opens.

### 2.10 Include Directives and Legacy Inline Shapes

- `test/corpus/25_include_directives.txt:180-190` — the include directives themselves parse correctly, but every paragraph that follows still uses the new `inline_seq_nonempty` + `plain_text` shape while the expected corpus contains bare `plain_text` nodes. These failures are expectation drift rather than parser bugs, but they need to be accounted for before the snapshot can be updated.
- `test/corpus/21_block_edge_cases.txt:139-145` include similar expectation drift: the blocks parse, but the stored trees lack the `inline_seq_nonempty` wrapper and anchor nodes that the current grammar emits.

---

## 3. Summary of Root Cause

1. `_plain_text_segment` is defined as a single token covering `[A-Za-z0-9_!$.,'"():+\-\/={}^%?#]+` and is chained across whitespace to form entire inline runs. Because it is a token, it preempts any later-matching grammar rule unless the rule uses an external scanner with higher precedence.
2. Many inline syntaxes (anchors, macros, links, formatting markers) begin with characters allowed by that regex, so the parser never even attempts the specialized rule—it already accepted the input as text.
3. A few suites (21_block_edge_cases, 25_include_directives) fail solely because their expected trees reflect the pre–`inline_seq_nonempty` structure. Updating the corpus snapshots will be necessary after the grammar stabilizes.

---

## 4. Next Steps

- Introduce scanner-assisted boundary logic (either a lightweight `INLINE_PLAIN_TEXT` token aware of macro prefixes, or a supplemental “stop before macros” token that tells `plain_text` when to yield).
- Keep `_plain_text_segment` for block-level heuristics so that headings/lists continue to parse, but prevent it from consuming characters that open inline constructs (e.g., `[`, `{`, `(` when followed by macro names, `+` when repeated, URL schemes, etc.).
- Once the inline nodes parse correctly, refresh the failing corpus snippets (especially suites 21 and 25) so the stored expectations recognize `inline_seq_nonempty`.

This report can be rerun at any time by executing `npx tree-sitter test --overview-only` and inspecting the cited `test/corpus/*.txt` files.

---

## 5. Per-Test Symbol Report

For completeness, a machine-readable table (`notes/plain-text-conflicts-report.csv`) was generated from the raw `npx tree-sitter test --file-name … --show-fields` logs stored under `notes/logs/`. Each row contains:

- `Suite`: the corpus file.
- `CaseNumber` / `CaseName`: the failing test.
- `UnexpectedSymbols`: the set of node types that appeared with `[31m` (i.e., only in the actual parse). Typical entries are `plain_text`, `inline_seq_nonempty`, and `ERROR`.

Example excerpt:

| Suite | Case | Symbols | Why |
| --- | --- | --- | --- |
| `15_anchors_footnotes_xrefs` | 67 (Inline anchor without text) | `plain_text, ERROR, inline_seq_nonempty, inline_element, inline_anchor` | `_plain_text_segment` consumes `[[` before the anchor rule can fire, so the anchor appears only after an unexpected text run and an `ERROR`. |
| `18_basic_formatting` | 113 (Simple strong formatting) | `plain_text, inline_seq_nonempty, inline_element, strong` | The opening `*` token is pulled into `plain_text`, delaying `strong` and shifting the entire subtree. |
| `26_index_terms` | 191 (Simple index term macro) | `plain_text, formatting_fallback, inline_element, index_term` | Macro prefix `indexterm:[` matches the text regex, causing the macro node to appear with a preceding stray text chunk and fallback token. |

Consult the CSV for the full mapping; those symbol sets come directly from the debug logs and align with the reasoning in Sections 2–3 above.
