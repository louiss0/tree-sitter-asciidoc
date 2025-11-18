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

### Add Header Line

The header line is a series of lines that must be written before section 2.
The first line is the author line! It must:
- Allow the user to write multiple names 
- An email address must exist at the end of the line
- A full name must be separated by a comma

Fulfill these requirements: 
1. The header must contain a document title.
2. The author information must be entered on the line directly beneath the document title.
3. The author line must start with an author name.

The content in the author line must be placed in a specific order and separated with the correct syntax.

```adoc
= Document Title
firstname middlename lastname <email>
```

The second line is called the revision line. It must be written under the folowing examples:

- v7.5 When the revision line only contains a revision number, prefix the number with a v.

- 7.5, 1-29-2020 When the revision line contains a version and a date, separate the version number from the date with a comma (,). A v prefix before the version number is optional.

- 7.5: A new analysis When the revision line contains a version and a remark, separate the version number from the remark with a colon (:). A v prefix before the version number is optional.

- 7.5, 1-29-2020: A new analysis When the revision line contains a version, date, and a remark, separate the version number from the date with a comma (,) and separate the date from the remark with a colon (:). A v prefix before the version number is optional.

The revision line must be followed by a blank line. It

```adoc
= Document Title
author <email>
revision number, revision date: revision remark
```

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
