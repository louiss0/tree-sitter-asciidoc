# TODO

## Tests that are failing

- `npx tree-sitter test --file-name 20_inline_edge_cases.txt --debug` (per request) still fails cases 168/171/172/173 because inline punctuation tokens split emphasis/strong/macro/xref sequences and introduce `ERROR` nodes.
- `npx tree-sitter test --file-name 15_anchors_footnotes_xrefs.txt` fails cases 115/116/122/125: external xrefs over-consume the closing `>>`, and malformed xrefs now bubble up as `ERROR` instead of plain text.
- `npx tree-sitter test --file-name 21_block_edge_cases.txt` case 184 fails where attribute substitutions inside paragraphs now need explicit tokens for the surrounding colons/dashes.
- `npx tree-sitter test --file-name 23_inline_edge_cases.txt` fails cases 198/199/201/205/213/215 because escaped delimiters and precedence tests still parse as literal `PLAIN_*` tokens (or drop into passthrough) rather than the intended inline nodes.
- `npx tree-sitter test --file-name 26_index_terms.txt` fails cases 240/241/244: concealed multi-level index terms and malformed bracket examples now pick up `PLAIN_DASH`/`plain_text` tokens that leave stray `ERROR` nodes.

## What bugs are present

- Plain punctuation tokens from the external scanner currently fire even when formatting/xref delimiters should win, so the parser sees fragmented inline sequences and leaves `ERROR` nodes whenever constructs sit adjacent to plain text.
- External cross-reference logic does not stop consuming before the trailing `>>` when no link text is present, so the scanner hands control back late and the parser reports errors for cases 115/116/122/125.
- Attribute substitution fallback in block-edge tests still expects the old `_plain_text_segment` token, so the new inline punctuation split causes unmatched colons/dashes inside attribute entries.
- Index-term macros rely on plain-text tokens for the dash separators; now that `PLAIN_DASH` exists they no longer match the grammar, which cascades into `ERROR` nodes for multiple-term cases.

## What to do next

1. Tighten the scanner so `PLAIN_*` tokens only emit when the following characters cannot complete an inline construct (mirror `scan_for_closing_delimiter` logic for *, _, -, angle brackets, etc.) and ensure macros/xrefs/emphasis reclaim precedence.
2. Adjust inline grammar/tests for external xrefs, footnotes, macros, and passthrough precedence so the updated tokens no longer yield `ERROR` nodes; rerun `npx tree-sitter test --file-name` for 15/20/23/26 and confirm they pass.
3. Once the non-paragraph corpora are green, refresh the remaining suites (including paragraphs) via `npx tree-sitter test --update`, regenerate parser artifacts, and run the full `npx tree-sitter test` for verification.
