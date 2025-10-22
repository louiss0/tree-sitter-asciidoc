# Nested Lists Implementation Status

## Overview
This document tracks the progress of implementing nested list support in the tree-sitter-asciidoc parser.

## Completed ✅

### 1. Test Suite (Commit: feat(test))
- Created comprehensive test file `test/corpus/06b_nested_lists.txt`
- Tests cover depths: 3, 5, 15, and 20 levels
- Includes unordered lists, ordered lists, and mixed nested lists
- Tests edge cases like depth transitions

### 2. Grammar Updates (Commit: feat(grammar))
- Modified `_unordered_list_marker` to match `/\*+|\-+/` (multiple asterisks or hyphens)
- Modified `_ordered_list_marker` to match `/\.+/` (multiple dots)
- Enabled optional nested lists within list items
- Added precedence to `unordered_list` rule
- Restructured list item rules: `optional(nested_list) + repeat(continuation)`

**Result:** Parser successfully recognizes markers at different depths (`*`, `**`, `***`, etc.)

### 3. Scanner Infrastructure (Commit: feat(scanner))
- Added depth tracking fields to Scanner struct:
  - `list_depth_stack[32]`: Tracks up to 31 nesting levels
  - `list_depth_count`: Current number of active levels
  - `current_marker_depth`: Most recently seen marker depth
- Created `count_marker_depth()` helper function
- Updated serialize/deserialize to persist depth state
- Updated scanner initialization

**Result:** Infrastructure is in place to track and compare marker depths

## Current Behavior

### What Works ✓
- Single-depth lists parse correctly
- Simple nesting (e.g., `*` → `**` → `***`) creates proper hierarchy
- No crashes or performance issues with deep nesting (tested up to 20 levels)
- Markers at all depths are recognized

### Known Limitation ⚠️
**Every subsequent line is being parsed as nested within the previous item**, regardless of marker depth.

**Example:**
```asciidoc
* Level 1
** Level 2
** Level 2 again  ← Should be sibling of previous, but parsed as child
```

**Root Cause:** The grammar allows an `optional(nested_list)` after each item, and the parser greedily consumes all subsequent lines with different marker depths as part of that nested list. The depth tracking infrastructure exists but isn't yet being used to make parsing decisions.

## Remaining Work 🚧

### Phase 1: Implement Depth Comparison Logic
The scanner needs to actively use the depth tracking to emit different signals based on whether the current marker represents:
1. A sibling item (same depth as previous)
2. A nested item (greater depth than previous)
3. A parent-level item (lesser depth than previous)

**Approach Options:**
1. **Token-based approach:** Create new external tokens like `LIST_SAME_DEPTH`, `LIST_DEEPER`, `LIST_SHALLOWER`
2. **Grammar constraints:** Use the scanner to set flags that the grammar can check
3. **Hybrid:** Combine depth tracking with better grammar precedence rules

### Phase 2: Integrate with Grammar
Update the grammar to use depth signals from the scanner to:
- Continue adding items to the same list when depth matches
- Start a new nested list when depth increases
- Close nested lists and return to parent when depth decreases

### Phase 3: Testing & Refinement
- Run the test suite (`tree-sitter test --file-name 06b_nested_lists.txt`)
- Fix any parsing issues
- Validate performance with deeply nested lists
- Update test expectations if needed

## Technical Notes

### AsciiDoc List Depth Semantics
- `*` = level 1 (1 asterisk)
- `**` = level 2 (2 asterisks)
- `***` = level 3 (3 asterisks)
- etc.

Similarly for ordered lists:
- `.` = level 1
- `..` = level 2
- `...` = level 3
- etc.

### Grammar Challenge
Tree-sitter grammars alone cannot easily track state like "current nesting depth" to determine whether a marker should start a sibling item or a nested list. This requires the external scanner to:
1. Track the depth of the previous marker
2. Compare it to the current marker's depth
3. Signal to the grammar how to proceed

### Scanner API
The scanner communicates with the grammar through:
- Return value: `true` if a token was recognized, `false` otherwise
- `lexer->result_symbol`: Which external token was matched
- `valid_symbols[]`: Which tokens the grammar is currently expecting

## References
- Grammar: `grammar.js` (lines 357-392 for list rules)
- Scanner: `src/scanner.c` (lines 42-57 for Scanner struct, 72-84 for depth counting)
- Tests: `test/corpus/06b_nested_lists.txt`

## Next Steps
1. Implement depth comparison logic in scanner
2. Create external tokens or use valid_symbols to signal depth relationships
3. Update grammar to respond to depth signals
4. Test and iterate
