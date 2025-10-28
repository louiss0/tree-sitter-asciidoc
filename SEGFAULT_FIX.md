# Segmentation Fault Fix - 2025-01-27

## Summary

Fixed a critical segmentation fault caused by left recursion in the expression grammar rules.

## Issues Identified

### 1. CRITICAL: Direct Left Recursion in Expression Rules (Lines 437-477)

**Problem:** The original expression grammar had both direct and indirect left recursion patterns that caused tree-sitter to crash during test execution.

**Original problematic code:**
```javascript
expression: $ => prec.right(choice(
  $.binary_expression,
  $.unary_expression,
  $.grouped_expression,
  $.primary_expression
)),

binary_expression: $ => choice(
  prec.left(1, seq($.expression, choice('&&', '||', 'and', 'or'), $.expression)),
  prec.left(2, seq($.expression, choice('==', '!=', '<', '>', '<=', '>='), $.expression)),
  prec.left(3, seq($.expression, choice('+', '-'), $.expression)),
  prec.left(4, seq($.expression, choice('*', '/', '%'), $.expression))
),
```

**Issue:** This creates a recursion chain: `expression` → `binary_expression` → `expression` (infinite loop)

### 2. REVIEWED: Circular Dependency in Conditional Blocks (Lines 51, 66, 393-408)

**Status:** Acceptable - No fix required

The circular dependency `_element` → `conditional_block` → `ifdef_block` → `repeat($_element)` is acceptable because:
- `repeat()` can match zero items (provides base case)
- Terminal tokens (`ifdef_open`, `ifndef_open`, etc.) break recursion
- `endif_directive` is optional, providing another exit point

## Solution Applied

### Restructured Expression Grammar

Replaced the left-recursive grammar with a properly structured precedence-climbing approach using tree-sitter's `prec.left()`:

```javascript
// EXPRESSIONS - for ifeval conditions (fixed to eliminate recursion)
// Use prec.left/right with explicit precedence levels to avoid recursion
expression: $ => $.logical_expression,

// Precedence level 1: Logical operators (&&, ||, and, or) - lowest precedence, left-associative
logical_expression: $ => choice(
  prec.left(1, seq($.logical_expression, choice('&&', '||', 'and', 'or'), $.comparison_expression)),
  $.comparison_expression
),

// Precedence level 2: Comparison operators (==, !=, <, >, <=, >=), left-associative
comparison_expression: $ => choice(
  prec.left(2, seq($.comparison_expression, choice('==', '!=', '<', '>', '<=', '>='), $.additive_expression)),
  $.additive_expression
),

// Precedence level 3: Additive operators (+, -), left-associative
additive_expression: $ => choice(
  prec.left(3, seq($.additive_expression, choice('+', '-'), $.multiplicative_expression)),
  $.multiplicative_expression
),

// Precedence level 4: Multiplicative operators (*, /, %), left-associative
multiplicative_expression: $ => choice(
  prec.left(4, seq($.multiplicative_expression, choice('*', '/', '%'), $.unary_expression)),
  $.unary_expression
),

// Precedence level 5: Unary operators (!, -), right-associative
unary_expression: $ => choice(
  prec.right(5, seq(choice('!', '-'), $.unary_expression)),
  $.primary_expression
),

// Highest precedence: Primary and grouped expressions
primary_expression: $ => choice(
  $.grouped_expression,
  $.string_literal,
  $.numeric_literal,
  $.boolean_literal,
  $.attribute_reference
),

grouped_expression: $ => seq('(', $.expression, ')'),
```

## Key Changes

1. **Eliminated indirect recursion**: Each precedence level now references the next higher level directly, not back to `expression`
2. **Proper left-associativity**: Used `prec.left()` with explicit precedence values to ensure correct operator associativity
3. **Maintained operator precedence**: Logical (1) < Comparison (2) < Additive (3) < Multiplicative (4) < Unary (5)
4. **Simplified primary expressions**: Grouped and primary expressions are now at the same precedence level

## Testing Results

### Verification Steps

1. ✅ **Backup created**: `grammar.js.backup`
2. ✅ **Grammar regenerated**: `tree-sitter generate` succeeded
3. ✅ **Parser built**: `tree-sitter build` succeeded
4. ✅ **Segfault eliminated**: `tree-sitter test` runs without crashing
5. ✅ **Expression precedence verified**: `1 + 2 * 3` correctly parses as `1 + (2 * 3)`
6. ✅ **Basic parsing works**: Simple documents parse correctly

### Parse Tree Validation

Test: `ifeval::[1 + 2 * 3]`

Parse tree shows correct precedence (multiplication before addition):
```
expression
└── logical_expression
    └── comparison_expression
        └── additive_expression
            ├── additive_expression (1)
            │   └── multiplicative_expression
            │       └── unary_expression
            │           └── primary_expression (numeric: 1)
            └── multiplicative_expression (2 * 3)
                ├── multiplicative_expression
                │   └── unary_expression
                │       └── primary_expression (numeric: 2)
                └── unary_expression
                    └── primary_expression (numeric: 3)
```

## Impact

### Breaking Changes

- **Parse tree structure**: The structure of expression parse trees has changed
  - Old: `expression` → `binary_expression` → nested `expression`s
  - New: `expression` → `logical_expression` → `comparison_expression` → `additive_expression` → `multiplicative_expression` → `unary_expression` → `primary_expression`

### Benefits

- ✅ No more segmentation faults
- ✅ Correct operator precedence maintained
- ✅ Proper left-to-right associativity for binary operators
- ✅ Parser generation succeeds consistently
- ✅ Test framework runs successfully

## Files Modified

- `grammar.js` - Lines 437-477 (expression rules)

## Files Created

- `grammar.js.backup` - Backup of original grammar
- `SEGFAULT_FIX.md` - This documentation file
