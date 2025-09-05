# Tree-sitter AsciiDoc Parser Status

## Current State
- **Total Tests:** 170
- **Passing Tests:** ~85 (50% pass rate)
- **Core functionality working:** Sections, basic formatting, inline elements, macros, attributes, links, images, lists, conditionals

## Major Completed Features ✅
1. **Inline Elements:** Anchors, cross-references, footnotes working correctly
2. **Macros:** Pass macros, math macros, UI macros, role spans
3. **Formatting:** Basic strong, emphasis, monospace, superscript, subscript
4. **Links & Images:** Auto links, manual links, images 
5. **Passthrough:** Triple-plus and pass macro variants
6. **Attributes:** Basic attribute parsing and references
7. **Sections:** Multi-level section hierarchy
8. **Lists:** Basic unordered, ordered, description, callout lists

## Major Remaining Issues ❌

### 1. Paragraph Boundary Detection
**Problem:** Paragraphs are not properly separated by blank lines.
- Expected: Multiple paragraphs separated by blank lines
- Current: All content parsed as single paragraph spanning entire document
- **Impact:** Affects ~10-15 tests

**Root Cause:** The text_with_inlines rule consumes all available text without stopping at paragraph boundaries. Tree-sitter's parsing approach makes it difficult to create natural paragraph breaks.

**Solution Required:** Major architectural changes to either:
- Modify the tokenizer to recognize paragraph boundaries
- Restructure paragraph parsing to limit scope
- Add explicit blank line handling in the grammar

### 2. Conditional Block Parsing
**Problem:** Block-level conditionals (ifdef, ifndef, ifeval) are not parsing correctly.
- Expected: Proper conditional blocks with nested content
- Current: ERROR nodes or incorrect structure
- **Impact:** Affects ~15-20 tests

**Root Cause:** Recent text_segment changes have broken the conditional parsing logic. The grammar conflicts need better resolution.

**Solution Required:**
- Revert problematic text_segment changes
- Fix conditional block precedence and structure
- Ensure proper endif directive matching

### 3. Text Segmentation Granularity
**Problem:** Inconsistent text_segment granularity across different contexts.
- Some tests expect word-level segments
- Others expect line-level or paragraph-level segments  
- Current implementation is inconsistent
- **Impact:** Affects ~20-30 tests

**Root Cause:** Test expectations are inconsistent, and the text_segment rule tries to handle too many different cases.

**Solution Required:**
- Analyze test patterns more systematically
- Create consistent text_segment behavior
- Possibly different segmentation for different contexts

### 4. Delimited Block Content
**Problem:** Some delimited blocks missing content or have structural issues.
- **Impact:** Affects ~10-15 tests

**Solution Required:**
- Review block content parsing
- Ensure proper delimiter matching
- Fix metadata handling in blocks

### 5. Table Parsing
**Problem:** Table structure is mostly wrong with ERROR nodes.
- **Impact:** Affects ~5 tests

**Solution Required:**
- Complete rewrite of table grammar
- Proper cell parsing and row structure
- Handle table metadata and specifications

## Architectural Limitations

### Tree-sitter Constraints
1. **No Lookahead/Lookbehind:** Cannot use regex lookahead/lookbehind for complex tokenization
2. **Greedy Parsing:** Text segments consume as much as possible, making boundaries difficult
3. **Conflict Resolution:** Current conflict resolution is inadequate for complex grammar

### AsciiDoc Complexity
1. **Context-Sensitive:** Same syntax means different things in different contexts
2. **Whitespace Significance:** Blank lines are semantically meaningful for paragraph separation
3. **Precedence Complexity:** Many overlapping syntax patterns need careful precedence

## Recommended Next Steps

### Immediate Fixes (High Priority)
1. **Revert Recent Changes:** Restore previous text_segment behavior that had better pass rate
2. **Fix Conditional Blocks:** Address the conditional parsing regressions
3. **Stabilize Core Functionality:** Ensure basic features continue working

### Medium-term Improvements
1. **Paragraph Boundaries:** Implement proper paragraph separation logic
2. **Text Segmentation:** Create consistent and predictable text_segment behavior
3. **Improve Test Coverage:** Focus on getting above 50% pass rate

### Long-term Enhancements  
1. **Table Support:** Implement complete table parsing
2. **Advanced Features:** Complex nesting, edge cases, specialized contexts
3. **Performance Optimization:** Review grammar for parsing efficiency

## Architecture Suggestions

### Alternative Approaches
1. **Two-Pass Parsing:** First pass identifies paragraph boundaries, second pass handles content
2. **Custom Scanner:** Implement C-based scanner for complex tokenization
3. **Preprocessor:** Handle paragraph separation before Tree-sitter parsing
4. **Context-Aware Rules:** Different text_segment rules for different contexts

### Grammar Restructuring
1. **Simplify Conflicts:** Reduce grammar conflicts through better rule organization
2. **Explicit Boundaries:** Add explicit tokens for important boundaries (paragraph, block)
3. **Modular Grammar:** Split into smaller, focused grammar modules

The parser has made significant progress but requires focused architectural work to handle the remaining parsing challenges, particularly around paragraph boundaries and text segmentation consistency.
