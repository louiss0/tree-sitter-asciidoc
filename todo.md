## Tests that are failing
- Not run in this iteration; please execute `npx tree-sitter test` to ensure grammar/query updates pass.

## What bugs are present
- None observed during highlight query verification, but editor-specific highlighting still needs human validation.

## What to do next
- Run the full tree-sitter test suite and fix any regressions.
- Manually inspect highlighting in target editors to confirm anchors, macros, and brackets look correct with real themes.
- Trim or reorganize the new example fixtures if they need to be split for automated tests.