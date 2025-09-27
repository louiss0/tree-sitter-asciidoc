# Grammar Architecture Audit

## Current Grammar Structure

### Basic Configuration
- **Name:** `asciidoc`
- **Extras:** `[]` (no automatic whitespace handling)
- **External Scanner:** Present (`src/scanner.c`) but NOT declared in `externals`
- **Conflicts:** Not declared
- **Supertypes:** Not declared  
- **Inline:** Not declared

### Major Issues Identified

#### 1. Missing Externals Declaration
The grammar uses an external scanner (`src/scanner.c`) with many tokens, but doesn't declare `externals: $ => [...]` in grammar.js. This is likely causing issues with fence recognition and BOL parsing.

**External tokens defined in scanner.c:**
- TABLE_FENCE_START/END
- EXAMPLE_FENCE_START/END  
- LISTING_FENCE_START/END
- LITERAL_FENCE_START/END
- QUOTE_FENCE_START/END
- SIDEBAR_FENCE_START/END
- PASSTHROUGH_FENCE_START/END
- OPENBLOCK_FENCE_START/END
- LIST_CONTINUATION
- AUTOLINK_BOUNDARY
- ATTRIBUTE_LIST_START
- DELIMITED_BLOCK_CONTENT_LINE
- And more...

#### 2. Inconsistent BOL Anchoring
- Section markers allow optional leading whitespace: `optional(/[ \t]+/)`
- This conflicts with AsciiDoc spec which requires headings at column 0
- External scanner has BOL detection but it's not consistently used

#### 3. Section Hierarchy Problem  
- Uses `prec.right` on sections causing incorrect nesting
- Same-level sections become nested instead of siblings
- No conflicts declared to guide section parsing

#### 4. Whitespace Policy Issues
- `extras: []` means no automatic whitespace
- But many rules use explicit `/[ \t]+/` patterns
- Inconsistent newline handling between `_line_ending` and scanner

#### 5. Attribute Entry Parsing
- Current grammar only handles `:name: value` form
- Missing support for `:name:` (empty values)
- Conflicts with description lists (both use colons)

#### 6. Inline Element Precedence
- Uses `prec(2000, $.inline_element)` - very high precedence
- No conflicts declared for competing inline constructs
- No proper escape handling for malformed constructs

## Current Architecture Assessment

### Strengths
1. External scanner handles complex BOL detection
2. Comprehensive inline formatting support
3. Good table parsing foundation
4. Block metadata handling

### Critical Weaknesses  
1. **Missing externals declaration** - scanner tokens not properly integrated
2. **No conflict resolution** - ambiguous parsing situations not handled
3. **Inconsistent BOL policy** - some rules anchored, others not
4. **Section hierarchy broken** - precedence causes incorrect nesting
5. **No fallback mechanisms** - malformed constructs don't degrade gracefully

## Recommended Architecture Changes

### Phase 1: Foundation Fixes
1. **Add externals declaration** matching scanner tokens
2. **Fix section hierarchy** using level-specific rules
3. **Harmonize whitespace policy** - either use extras or be consistent
4. **Add conflicts** for known ambiguities

### Phase 2: Parser Robustness  
1. **Implement fallback patterns** for malformed constructs
2. **Improve attribute parsing** with empty value support
3. **Fix inline formatting edge cases** with proper escape handling
4. **Resolve delimiter conflicts** between different constructs

### Phase 3: Advanced Features
1. **Complex table specifications** with spans and formats  
2. **List continuation blocks** properly attached
3. **Nested conditional blocks** with proper scoping
4. **Performance optimization** reducing conflicts and precedence complexity

## Node Shape Stability Plan

To maintain existing tests while fixing architecture:

1. **Preserve existing node names** - use aliases where needed
2. **Maintain field names** - especially `content`, `open`, `close`, `title`
3. **Keep inline element structure** - `text_with_inlines` containing `inline_element`
4. **Preserve block structure** - metadata + content pattern

## BOL Anchoring Strategy

Rules that MUST be anchored at BOL:
- Section markers (headings)
- Attribute entries (`:name:`)
- Block delimiters (====, ----, etc.)
- List markers (*, -, 1.)  
- Conditional directives (ifdef::, endif::)
- Include directives (include::)
- Block comments (////)

Rules that must NOT consume newlines:
- Section titles (title content only)
- Attribute values (value content only)
- Inline elements (spans within paragraphs)
- Cell content (within table cells)

## Implementation Priority

1. **Declare externals** - critical for scanner integration
2. **Fix section hierarchy** - foundational for document structure  
3. **Add essential conflicts** - resolve parsing ambiguities
4. **Harmonize whitespace** - consistent BOL handling
5. **Implement fallback patterns** - graceful degradation for malformed input