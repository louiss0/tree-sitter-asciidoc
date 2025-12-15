## Tests that are failing
- Not run yet; execute `npx tree-sitter test` before handing off to catch regressions.

## What bugs are present
- None observed so far. Highlights 1–125 render correctly, but the remaining highlight outputs still need human review and may hide issues.

## What to do next
- Continue inspecting `test/highlight/highlight-126.html` through `highlight-300.html` for mislabelled spans or empty files.
- Re-run `npx tree-sitter highlight -n <n> --html --css-classes` for any failing cases and adjust queries if captures are wrong.
- After manual review, run `npx tree-sitter test` to ensure grammar/query updates pass before shipping.
