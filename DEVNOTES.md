# Development Notes - Admonitions Implementation

## Current Grammar Structure

### Block-level Organization (_block)
Current _block choice includes:
- `attribute_entry` (PREC.ATTRIBUTE_ENTRY = 30)
- `conditional_block` (PREC.CONDITIONAL = 50) 
- 6 levels of sections (PREC.SECTION = 25)
- 7 types of delimited blocks (PREC.DELIMITED_BLOCK = 22)
- Lists: description (15), unordered/ordered/callout (10)
- Paragraphs: invalid patterns (5), normal (1)

### Delimited Block Current AST Structure
From test failures, current grammar produces:
```
(example_block
  (example_delimiter)  // opening
  (block_content)      // content lines
  (example_delimiter)) // closing  
```

But tests expect:
```
(example_block
  (example_open)    // different naming
  (block_content)
  (example_close))
```

### Block Metadata Rules
Current block_metadata supports:
- `anchor`: `[[id,text]]` 
- `block_title`: `.title`
- `id_and_roles`: `[#id.role1.role2]`
- `block_attributes`: `[key=value]`

### Inline Content for Paragraphs
Paragraphs use:
- `text_with_inlines` (contains `text_segment` and `inline_conditional`)
- No dedicated single-line inline rule exists

## Issues to Address

### 1. Delimited Block AST Mismatch
Tests expect `*_open` and `*_close` nodes but grammar produces `*_delimiter` tokens.
Need to decide: update tests or update grammar to match expected AST.

### 2. Missing Inline Line Rule
For admonition paragraphs, need a rule that captures inline content for a single line.
Can either:
- Create new `inline_line` rule
- Reuse `text_with_inlines` 
- Create specialized admonition content rule

### 3. Precedence Planning
New precedence needed:
- `ADMONITION_PARAGRAPH`: 60 (higher than sections/lists)
- `ADMONITION_BLOCK`: 35 (between attributes and sections)

## Implementation Strategy

1. Fix delimited block AST structure first
2. Add admonition tokens and precedence
3. Implement paragraph admonitions  
4. Implement block admonitions
5. Add comprehensive tests
6. Update queries

## Test Coverage Needed
- All 5 admonition types (NOTE, TIP, IMPORTANT, WARNING, CAUTION)
- Paragraph form with various inline content
- Block form with different delimited block types
- Block form with metadata (title, attributes, roles)
- Negative cases (lowercase, malformed syntax)
- Integration with existing constructs (in sections, etc.)
