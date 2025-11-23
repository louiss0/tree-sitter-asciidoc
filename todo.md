# TODO

## Tests that are failing

- Not re-run this session; prior 
px tree-sitter test runs still fail broadly because _plain_text_segment greedily consumes inline construct markers (macros, formatting, includes, etc.).

## What bugs are present

- Plain text lexing still swallows inline construct openers, so inline nodes fail to form and many corpus expectations break.
- Attribute/role lists are inconsistent across blocks, paragraphs, and lists; %collapsible flags and combined id/role syntax are not modeled yet.
- Description lists cannot yet nest other lists (depth-limited to zero) and still disallow the required structure.

## What to do next

1. **Add Breaks** – Implement grammar for page breaks (<<<) and thematic breaks (''', ---, ***) restricted to section contexts; update queries/tests.
2. **Normalize Attribute Lists** – Unify attribute/role list parsing across blocks, lists, and paragraphs (merge id_roles + attribute list logic) and support %collapsible metadata.
3. **Empower Description Lists** – Allow description list items to nest other lists (up to five levels) without list continuations, adapting the grammar and corpus tests.
