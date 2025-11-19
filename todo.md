# TODO

## Context

Most of the tests are in the `tests` directory. Are passing?
Grammar's that weren't being used are now removed.
Now we need to add new grammars!
This list is a handoff for the next agent—please pick up from here.

## Immediate Next Tasks

### Add Breaks

A page break is a way to separate content into different sections or pages.
It's a grammar that is written like this:

```
<<<
```

A thematic break is supported like this `'''`

Markdown thematic breaks are supported by AsciiDoc:

```
---

*** 

```

They only allowed in sections!

### ~~Add Header Line~~ ✅

Completed: document headers now mirror the old `section_level_1` structure.
- Optional leading blank lines are consumed inside `document_header`.
- Author lines enforce multiple names plus a trailing `<email>` with strict ordering.
- Revision lines support the v-prefixed version/date/remark permutations and require the blank separator afterward.
- Added 15+ corpus tests in `test/corpus/00_document_header.txt` covering titles, author variants, revisions, and leading blank-line edge cases; existing corpora were refreshed to remove residual level-1 sections.
- Highlights and folds capture the new nodes, and `npx tree-sitter test` currently passes.

### Normalize attribute Lists

A attribute list can exist on top of blocks, paragraphs and lists! 
Blocks can have titles and attribute lists but lists can only have attribute lists.
It's best to conbline id_roles and attribute lists. They are the same thing.

If a block has the %collapsible, it can be expanded or collapsed.

```adoc
[%collapsible]
====
This content is only revealed when the user clicks the block title.
====
```

## Empower Description Lists 

A description list can contain other lists.
They can be nested. But we'll only allow 5 levels deep.
They can't use list continuation.
