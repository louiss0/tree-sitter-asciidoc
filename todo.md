# TODO

## Tests that are failing
- None. Only `npx tree-sitter test --file-name 18_basic_formatting.txt` was run per instructions, so broader coverage (including new fenced block corpus cases) is still unverified.

## What bugs are present
- Block quotes were added without accompanying corpus coverage, so regressions around nested content or lazy continuations may still exist until tests are written.
- Fenced code blocks currently accept any info string and rely solely on the scanner; edge cases like EOF without trailing newline were not exercised and could misbehave.

## What to do next
- Add a targeted corpus test (and run it) for block quotes similar to how `33_fenced_code_blocks.txt` covers fences so the behavior is locked in.
- Run `npx tree-sitter test --file-name 33_fenced_code_blocks.txt` (or the broader suite if allowed) to ensure the new fenced block grammar and generated parser stay consistent across platforms.
- Review highlight/injection queries to see if additional captures (e.g., block quote content markers) are needed beyond the delimiter updates, and expand editor tests accordingly.
