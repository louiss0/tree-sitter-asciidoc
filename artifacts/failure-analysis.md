# Tree-sitter AsciiDoc Parser: Baseline Failure Analysis

**Date:** 2025-09-26  
**Total Tests:** 215  
**Passing:** 173  
**Failing:** 42  

## Failure Categories

### 1. Section Hierarchy Issues (4 failures)
- Test #9: Attribute entries without values
- Test #14: Multiple sections at same level (sections nesting incorrectly)
- Test #15: Deep nesting with all levels
- Test #16: Sections with attributes

**Root Cause:** Section parsing doesn't properly separate same-level sections as siblings.

### 2. Attribute Parsing (3 failures)  
- Test #8: Basic attribute entries
- Test #9: Attribute entries without values  
- Test #12: Mixed attributes and other content

**Root Cause:** Grammar doesn't handle empty attribute values properly.

### 3. Conditional Block Issues (6 failures)
- Test #41: Mixed conditional and description list
- Test #43: Conditional with lists and sections  
- Test #46: Description lists should not become conditionals
- Test #48: Malformed conditionals should be paragraphs
- Test #51: No targets in ifdef should still work
- Test #52: Conditionals with attributes inside sections

**Root Cause:** Conditional parsing conflicts with description lists and malformed conditionals don't fall back to paragraphs.

### 4. Delimited Block Issues (4 failures)
- Test #56: Listing block with content
- Test #65: Block with trailing spaces on delimiters  
- Test #89: Admonition Blocks with Example
- Test #90: Admonition Blocks with Different Delimited Block Types

**Root Cause:** Delimiter matching issues and content capture problems.

### 5. Inline Formatting Edge Cases (8 failures)
- Test #128: Delimiter adjacency and escape handling
- Test #129: Complex autolink boundary detection
- Test #131: Nested formatting edge cases
- Test #133: Cross-reference and anchor combinations
- Test #134: Passthrough and raw content edge cases
- Test #158: Crossing styles (should fallback gracefully)
- Test #159: Trailing plus without EOL
- Test #160-165: Escaped delimiters in various constructs

**Root Cause:** Inline formatting doesn't handle escapes, adjacency rules, or crossing styles properly.

### 6. Anchor/Reference Issues (6 failures)
- Test #70: Block anchor without text
- Test #71: Block anchor with text
- Test #74: External cross-reference without text
- Test #75: External cross-reference with text
- Test #84: Malformed anchors should be plain text
- Test #85: Malformed cross-references should be plain text
- Test #86: Malformed footnotes should be plain text

**Root Cause:** Malformed inline constructs don't fall back to plain text properly.

### 7. Admonition Issues (4 failures)
- Test #100: Empty NOTE paragraph
- Test #105: Admonition paragraph in section
- Test #109: WARNING block with listing delimiters
- Test #111: TIP block with metadata

**Root Cause:** Admonition parsing edge cases and metadata handling.

### 8. Table Complex Structures (2 failures)
- Test #141: Complex table structures
- Test #216: Table with metadata and complex specifications

**Root Cause:** Advanced table cell specifications and metadata not parsed correctly.

### 9. List Interaction Issues (2 failures)  
- Test #35: Lists mixed with paragraphs
- Test #142: Example block as continuation

**Root Cause:** List continuations and mixed content not handled properly.

### 10. Include/Index Directive Issues (3 failures)
- Test #190: Not an include - missing colon
- Test #191: Not an include - malformed brackets  
- Test #201: Not an index term - malformed brackets
- Test #202: Not an index term - incomplete concealed

**Root Cause:** Malformed directives don't fall back to paragraph text.

### 11. Complex Nested Issues (2 failures)
- Test #143: Conditional blocks with nesting
- Test #145: Section nesting with anchors

**Root Cause:** Complex nesting scenarios not handled properly.

## Priority Order for Fixes

1. **Section Hierarchy** - Foundational issue affecting document structure
2. **Attribute Parsing** - Basic functionality that affects many other constructs  
3. **Delimited Blocks** - Core block-level constructs
4. **Conditional Blocks** - Important for conditional content
5. **Inline Formatting** - User-facing formatting features
6. **Anchor/Reference** - Cross-referencing functionality
7. **Tables** - Complex but isolated issues
8. **Lists** - Interaction issues
9. **Admonitions** - Specialized content blocks
10. **Include/Index** - Directive edge cases
11. **Complex Nested** - Advanced scenarios

## Next Steps

Follow the systematic todo list to address each category, ensuring atomic commits and test stability at each step.