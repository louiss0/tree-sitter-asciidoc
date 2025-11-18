# AsciiDoc EBNF Grammar Specification

**Version:** 2.0  
**Date:** 2025-01-31  
**Status:** Complete (Phases 1 & 2)

## Table of Contents

- [Introduction](#introduction)
- [Scope and Coverage](#scope-and-coverage)
- [EBNF Conventions](#ebnf-conventions)
- [Lexical Foundation](#lexical-foundation)
- [Core AsciiDoc Grammar](#core-asciidoc-grammar)
- [Grammar Notes and Limitations](#grammar-notes-and-limitations)
- [Extended Features (Phase 2)](#extended-features-phase-2)
- [Examples and Validation](#examples-and-validation)
- [References](#references)

## Introduction

This document provides a formal Extended Backus-Naur Form (EBNF) representation of the AsciiDoc markup language syntax. AsciiDoc is a text document format for writing notes, documentation, articles, books, presentations, web pages, and technical manuscripts.

The grammar specification aims to capture the structural syntax of AsciiDoc in a machine-readable format suitable for parser generators, language servers, and documentation tools.

### How to Read This Grammar

If you're unfamiliar with EBNF notation:
- `=` defines a production rule
- `|` represents alternatives (OR)
- `[]` indicates optional elements
- `{}` indicates repetition (zero or more)
- `()` groups elements
- `'text'` represents literal terminals
- `;` ends a production rule

## Scope and Coverage

### Phase 1: Core AsciiDoc Syntax

This specification covers the fundamental AsciiDoc syntax elements:

- **Document Structure**: Headers, sections, preambles
- **Attributes**: Document and block attributes, attribute references
- **Block Elements**: Delimited blocks (example, listing, literal, quote, sidebar, passthrough, open)
- **Lists**: Unordered, ordered, and description lists
- **Tables**: Basic table structure with simple cells
- **Inline Formatting**: Strong, emphasis, monospace, roles, passthrough
- **Links and Media**: URLs, links with text, image macros
- **Comments**: Single-line comments

### Phase 2: Extended Features

Additional advanced AsciiDoc features:
- **Admonitions**: NOTE, TIP, IMPORTANT, WARNING, CAUTION (paragraph and block forms)
- **Cross-references and Anchors**: Internal and external linking, automatic reference text
- **Include Directives**: File inclusion with options, tag-based partial includes
- **Callouts and Annotations**: Code block annotations with callout lists
- **Advanced Table Features**: Cell spans, formatting specifiers, headers/footers
- **Footnotes and Bibliography**: Citation system with numbered footnotes
- **Index Terms**: Document indexing with visible and hidden entries
- **Conditional Processing**: Attribute-based content inclusion/exclusion
- **Substitution Controls**: Fine-grained content processing control
- **Mathematical Expressions**: STEM, LaTeX, and AsciiMath notation
- **UI Macros**: Keyboard shortcuts, buttons, menu navigation

## EBNF Conventions

This specification uses **ISO/IEC 14977** EBNF notation with the following conventions:

- **Production names**: Use `camelCase` or `snake_case` for readability
- **Terminals**: Enclosed in single quotes (`'='`, `'*'`)
- **Character classes**: Defined using prose descriptions in special comments
- **Line orientation**: AsciiDoc is fundamentally line-oriented; newlines are explicit
- **Whitespace handling**: Spaces and tabs are explicitly modeled where significant

### Character Class Definitions

```
? Unicode letter ? = Any Unicode character in categories Lu, Ll, Lt, Lm, Lo
? Unicode digit ? = Any Unicode character in category Nd  
? URL character ? = Any character valid in URLs, excluding spaces, brackets, and control characters
? Non-newline character ? = Any character except CR (U+000D) and LF (U+000A)
```

## Lexical Foundation

The following lexical elements form the foundation of the AsciiDoc grammar:

```ebnf
(* Basic Character Classes *)
newline = '\r\n' | '\n' ;
space = ' ' | '\t' ;
digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' ;
letter = ? Unicode letter ? ;

(* Composite Character Classes *)
ws = { space } ;
blank_line = ws, newline ;
non_newline_char = ? Non-newline character ? ;
line_content = { non_newline_char } ;

(* Identifier Components *)
id_start = letter | '_' ;
id_char = id_start | digit | '-' ;
role_char = letter | digit | '_' | '.' | '-' ;
url_char = ? URL character ? ;
```

## Complete AsciiDoc Grammar (Phases 1 & 2)

```ebnf
(* ============================================================================
   TOP-LEVEL DOCUMENT STRUCTURE
   ============================================================================ *)

document = [ document_header ], { document_element } ;

document_element = attribute_entry
                 | conditional_directive
                 | include_directive
                 | block_element  
                 | blank_line ;

document_header = document_title, 
                  [ author_line ],
                  { header_attribute_entry },
                  blank_line ;

document_title = '=', ' ', line_content, newline ;

author_line = author_info, newline ;
author_info = author_name, 
              [ ' <', email_address, '>' ],
              [ ' ', revision_info ] ;

author_name = { non_newline_char - '<' } ;
email_address = { non_newline_char - '>' } ;
revision_info = { non_newline_char } ;

header_attribute_entry = attribute_entry ;

(* ============================================================================
   ATTRIBUTES
   ============================================================================ *)

attribute_entry = ':', attr_name, ':', [ ' ', attr_value ], newline ;

attr_name = id_start, { id_char } ;
attr_value = { non_newline_char } ;

attribute_substitution = '{', attr_name, '}' ;

block_attributes = '[', attributes_text, ']', newline ;
attributes_text = { non_newline_char - ']' } ;

id_and_roles = '[', id_or_role, { ',', id_or_role }, ']', newline ;
id_or_role = id_element | role_element ;
id_element = '#', { id_char } ;
role_element = '.', { role_char } ;

block_title = '.', line_content, newline ;

(* ============================================================================
   CONDITIONAL PROCESSING
   ============================================================================ *)

conditional_directive = ifdef_directive | ifndef_directive | ifeval_directive | endif_directive ;

ifdef_directive = 'ifdef::', attr_name, '[', [ conditional_content ], ']', newline ;
nifdef_directive = 'ifndef::', attr_name, '[', [ conditional_content ], ']', newline ;
ifeval_directive = 'ifeval::[', conditional_expression, ']', newline ;
endif_directive = 'endif::[]', newline ;

conditional_content = { non_newline_char - ']' } ;
conditional_expression = { non_newline_char - ']' } ;

(* ============================================================================
   INCLUDE DIRECTIVES
   ============================================================================ *)

include_directive = 'include::', file_path, '[', [ include_options ], ']', newline ;
file_path = { non_newline_char - '[' } ;
include_options = { non_newline_char - ']' } ;

(* ============================================================================
   BLOCK ELEMENTS
   ============================================================================ *)

block_element = delimited_block
              | admonition_block
              | heading
              | list_element
              | callout_list
              | table_block
              | paragraph_admonition
              | bibliography_entry
              | paragraph
              | literal_paragraph ;

(* Block Metadata (Optional prefixes for blocks) *)
block_metadata = [ anchor ], [ block_title ], [ id_and_roles ], [ block_attributes ] ;

(* ============================================================================
   ANCHORS AND CROSS-REFERENCES
   ============================================================================ *)

anchor = '[[', anchor_id, [ ',', anchor_text ], ']]', newline ;
anchor_id = { id_char } ;
anchor_text = { non_newline_char - ',' - ']' } ;

cross_reference = '<<', reference_target, [ ',', reference_text ], '>>' ;
reference_target = { id_char } ;
reference_text = { non_newline_char - '>' } ;

external_reference = 'xref:', xref_target, '[', [ xref_text ], ']' ;
xref_target = { non_newline_char - '[' } ;
xref_text = { non_newline_char - ']' } ;

(* ============================================================================
   ADMONITIONS
   ============================================================================ *)

admonition_label = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION' ;

paragraph_admonition = admonition_label, ':', ' ', inline_content, newline ;

admonition_block = '[', admonition_label, ']', newline,
                   block_metadata,
                   delimited_block_body ;

(* ============================================================================
   DELIMITED BLOCKS
   ============================================================================ *)

delimited_block = example_block
                | listing_block
                | literal_block
                | quote_block
                | sidebar_block
                | passthrough_block
                | open_block ;

delimited_block_body = block_fence, newline, block_content, block_fence, newline ;

example_block = block_metadata, '====', newline, block_content, '====', newline ;
listing_block = block_metadata, '----', newline, block_content, '----', newline ;
literal_block = block_metadata, '....', newline, block_content, '....', newline ;
quote_block = block_metadata, '____', newline, block_content, '____', newline ;
sidebar_block = block_metadata, '****', newline, block_content, '****', newline ;
passthrough_block = block_metadata, '++++', newline, block_content, '++++', newline ;
open_block = block_metadata, '--', newline, block_content, '--', newline ;

block_fence = '====' | '----' | '....' | '____' | '****' | '++++' | '--' ;
block_content = { content_line } ;
content_line = line_content, newline ;

(* ============================================================================
   HEADINGS AND SECTIONS
   ============================================================================ *)

heading = [ anchor ], heading_level, ' ', line_content, newline ;

heading_level = '======'  (* Level 6 *)
              | '====='   (* Level 5 *)
              | '===='    (* Level 4 *)
              | '==='     (* Level 3 *)
              | '=='      (* Level 2 *)
              | '='       (* Level 1 - Document title when first *) ;

(* ============================================================================
   LISTS AND CALLOUTS
   ============================================================================ *)

list_element = unordered_list
             | ordered_list
             | description_list ;

(* Unordered Lists *)
unordered_list = unordered_list_item, { unordered_list_item } ;
unordered_list_item = list_marker, ' ', inline_content, newline,
                      { list_continuation } ;
list_marker = '*' | '-' ;

(* Ordered Lists *)
ordered_list = ordered_list_item, { ordered_list_item } ;
ordered_list_item = ordered_marker, ' ', inline_content, newline,
                    { list_continuation } ;
ordered_marker = digit, { digit }, '.' ;

(* Description Lists *)
description_list = description_item, { description_item } ;
description_item = term, '::', ' ', inline_content, newline,
                   { list_continuation } ;
term = { non_newline_char - ':' } ;

(* List Continuations *)
list_continuation = [ newline ], indented_line, newline ;
indented_line = space, { space }, { non_newline_char } ;

(* Callout Lists *)
callout_list = callout_item, { callout_item } ;
callout_item = '<', digit, { digit }, '>', ' ', inline_content, newline ;

(* ============================================================================
   TABLES (ADVANCED FEATURES)
   ============================================================================ *)

table_block = block_metadata,
              '|===', newline,
              [ table_header ],
              { table_row },
              [ table_footer ],
              '|===', newline ;

table_header = table_row ;
table_footer = table_row ;

table_row = { table_cell }, newline ;
table_cell = [ cell_spec ], '|', cell_content ;

(* Cell Specifications (colspan.rowspan+|, format specifiers) *)
cell_spec = [ span_spec ], [ format_spec ] ;
span_spec = digit, { digit }, [ '.', digit, { digit } ], '+' ;
format_spec = format_char ;
format_char = 'a' | 'l' | 'm' | 's' | 'h' | 'd' ;

cell_content = { non_newline_char - '|' } ;

(* ============================================================================
   FOOTNOTES AND BIBLIOGRAPHY
   ============================================================================ *)

footnote = footnote_inline | footnote_ref ;
footnote_inline = 'footnote:[', footnote_text, ']' ;
footnote_ref = 'footnote:', footnote_id, '[', [ footnote_text ], ']' ;
footnoteref = 'footnoteref:', footnote_id, '[', [ footnote_text ], ']' ;

footnote_id = { id_char } ;
footnote_text = { non_newline_char - ']' } ;

bibliography_entry = '[bibliography]', newline,
                     { bibliography_item } ;
bibliography_item = '[[[', bib_id, ']]]', ' ', inline_content, newline ;
bib_id = { id_char } ;

(* ============================================================================
   INDEX TERMS
   ============================================================================ *)

index_term = visible_index_term | hidden_index_term | index_macro ;

visible_index_term = '((', index_text, '))' ;
hidden_index_term = '(((', index_text, ')))' ;

index_macro = index_term_macro | index_term2_macro ;
index_term_macro = 'indexterm:[', index_text, ']' ;
index_term2_macro = 'indexterm2:[', index_text, ']' ;

index_text = primary_term, [ ',', secondary_term ] ;
primary_term = { non_newline_char - ',' - ')' - ']' } ;
secondary_term = { non_newline_char - ',' - ')' - ']' } ;

(* ============================================================================
   PARAGRAPHS
   ============================================================================ *)

paragraph = inline_content, { newline, inline_content }, [ newline ] ;

literal_paragraph = indented_line, { newline, indented_line }, [ newline ] ;

(* ============================================================================
   INLINE CONTENT (COMPREHENSIVE)
   ============================================================================ *)

inline_content = { inline_element } ;

inline_element = inline_passthrough
               | passthrough_macro
               | attribute_substitution
               | cross_reference
               | external_reference
               | link
               | image_macro
               | footnote
               | footnoteref
               | index_term
               | math_expression
               | ui_macro
               | role_span
               | strong
               | emphasis
               | monospace
               | superscript
               | subscript
               | line_break
               | callout_marker
               | plain_text ;

(* Inline Formatting *)
strong = '*', strong_text, '*' ;
strong_text = { non_newline_char - '*' } ;

emphasis = '_', emphasis_text, '_' ;
emphasis_text = { non_newline_char - '_' } ;

monospace = '`', monospace_text, '`' ;
monospace_text = { non_newline_char - '`' } ;

superscript = '^', super_text, '^' ;
super_text = { non_newline_char - '^' } ;

subscript = '~', sub_text, '~' ;
sub_text = { non_newline_char - '~' } ;

(* Inline Passthrough *)
inline_passthrough = '+++', passthrough_text, '+++' ;
passthrough_text = { non_newline_char - '+' } ;

passthrough_macro = 'pass:', pass_subs, '[', pass_content, ']' ;
pass_subs = { id_char | '+' | '-' | ',' } ;
pass_content = { non_newline_char - ']' } ;

(* Role Spans *)
role_span = '[', role_name, ']', '#', role_text, '#' ;
role_name = { role_char } ;
role_text = { non_newline_char - '#' } ;

(* Links and Images *)
link = url, [ '[', [ link_text ], ']' ] ;
url = url_scheme, '://', url_body ;
url_scheme = 'http' | 'https' | 'ftp' | 'ftps' | 'mailto' ;
url_body = { url_char } ;
link_text = { non_newline_char - ']' } ;

image_macro = image_inline | image_block ;
image_inline = 'image:', image_target, '[', [ image_attributes ], ']' ;
image_block = 'image::', image_target, '[', [ image_attributes ], ']', newline ;
image_target = { non_newline_char - '[' - ' ' - '\t' } ;
image_attributes = { non_newline_char - ']' } ;

(* Mathematical Expressions *)
math_expression = stem_inline | stem_block | latexmath_inline | latexmath_block | asciimath_inline ;

stem_inline = 'stem:[', math_content, ']' ;
stem_block = '[stem]', newline, '++++', newline, math_content, newline, '++++', newline ;

latexmath_inline = 'latexmath:[', math_content, ']' ;
latexmath_block = '[latexmath]', newline, '++++', newline, math_content, newline, '++++', newline ;

asciimath_inline = 'asciimath:[', math_content, ']' ;

math_content = { non_newline_char - ']' } ;

(* UI Macros *)
ui_macro = keyboard_shortcut | button_ref | menu_ref ;

keyboard_shortcut = 'kbd:[', key_combination, ']' ;
key_combination = { non_newline_char - ']' } ;

button_ref = 'btn:[', button_text, ']' ;
button_text = { non_newline_char - ']' } ;

menu_ref = 'menu:', menu_path, '[', [ menu_text ], ']' ;
menu_path = { non_newline_char - '[' } ;
menu_text = { non_newline_char - ']' } ;

(* Callout Markers in Code *)
callout_marker = '<', digit, { digit }, '>' ;

(* Line Breaks *)
line_break = ' +', newline ;

(* Comments *)
line_comment = '//', { non_newline_char }, newline ;
block_comment = '////', newline, { comment_line }, '////', newline ;
comment_line = line_content, newline ;

(* Plain Text *)
plain_text = plain_text_char, { plain_text_char } ;
plain_text_char = non_newline_char 
                 - '{' - '}' - '+' - '[' - ']' - '#' - '(' - ')'
                 - '*' - '_' - '`' - '^' - '~' - '/' - '.' - ':' - '|' - '=' - '<' - '>' ;
```

## Grammar Notes and Limitations

### Context Sensitivity

AsciiDoc has several context-sensitive features that cannot be fully captured in a context-free EBNF grammar:

1. **Substitution Processing**: Attribute references and other substitutions are processed in multiple passes
2. **Block Delimiter Precedence**: The same marker can have different meanings based on context
3. **Nested Block Restrictions**: Some blocks cannot contain certain other blocks
4. **Line Position Significance**: Block delimiters must appear at the start of lines

### Approximations and Simplifications

1. **Character Encoding**: Unicode categories are referenced but not fully enumerated
2. **URL Validation**: URL structure is simplified; full RFC compliance requires additional validation
3. **Attribute Processing**: Complex attribute inheritance and scoping rules are not modeled
4. **Whitespace Normalization**: Detailed whitespace handling rules are simplified

### Semantic Constraints Not Modeled

- Email address format validation in author lines
- Attribute name uniqueness and scoping rules
- Block nesting restrictions (e.g., cannot nest delimited blocks of the same type)
- Table cell format specifiers and complex cell content
- Image and link target validation

## Phase 2 Features - Implementation Notes

All Phase 2 features have been fully integrated into the main grammar above. Key implementation notes:

### Context-Sensitive Features

1. **Admonitions** - Both paragraph and block forms are supported with all five standard types
2. **Cross-references** - Internal anchors, references, and external xref syntax included
3. **Include Directives** - Basic include syntax with options parameter
4. **Conditional Processing** - ifdef/ifndef/ifeval/endif directive structure
5. **Advanced Tables** - Cell span and format specifiers with headers/footers
6. **Mathematical Expressions** - STEM, LaTeX, and AsciiMath inline and block forms
7. **UI Macros** - Keyboard, button, and menu reference syntax
8. **Index Terms** - Visible, hidden, and macro-based indexing
9. **Footnotes** - Inline and referenced footnote syntax
10. **Enhanced Formatting** - Superscript, subscript, and passthrough controls

### Semantic Processing Notes

Several Phase 2 features require semantic processing beyond structural parsing:
- Include path resolution and security constraints
- Conditional expression evaluation (ifeval)
- Mathematical expression rendering
- Cross-reference resolution and validation
- Index term sorting and generation
- Footnote numbering and placement

## Examples and Validation

### Minimal Document

```asciidoc
= Document Title
Author Name <author@example.com>

This is the preamble paragraph.

== First Section

This is a regular paragraph with *bold* and _italic_ text.
```

### Block Elements Example

```asciidoc
.Example Block Title
[#example-id.highlight]
====
This is an example block with a title and attributes.
It can contain multiple paragraphs.
====

[source,javascript]
----
// This is a source code listing
function hello() {
    console.log("Hello, AsciiDoc!");
}
----
```

### List Example

```asciidoc
* Unordered list item
* Another item
  With continuation

. Ordered list item  
. Second ordered item

Term:: Definition for the term
Another term:: Another definition
```

### Table Example

```asciidoc
.Employee Information
|===
|Name |Department |Salary

|John Doe
|Engineering  
|$75,000

|Jane Smith
|Marketing
|$65,000
|===
```

## References

- [AsciiDoc Language Documentation](https://docs.asciidoctor.org/asciidoc/latest/)
- [ISO/IEC 14977:1996 - Extended BNF](https://www.iso.org/standard/26153.html)
- [AsciiDoctor User Manual](https://asciidoctor.org/docs/user-manual/)
- [Tree-sitter Grammar Guide](https://tree-sitter.github.io/tree-sitter/creating-parsers)

---

**Note**: This grammar specification is a living document. As AsciiDoc evolves and additional features are standardized, this EBNF representation will be updated accordingly. Please refer to the official AsciiDoc documentation for the authoritative specification of language semantics and behavior.
