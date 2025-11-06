# Test Failure Analysis v2

This document outlines the reasons for the failing tests in the `tree-sitter-asciidoc` grammar and provides up to three potential solutions for each failure, based on a review of `grammar.js`.

## Version 2 Improvements

- **Enhanced root cause analysis** with deeper investigation into parser precedence issues
- **Implementation priority ratings** for each solution (High/Medium/Low)
- **Risk assessment** for each proposed change
- **Cross-reference analysis** between related failing tests
- **Performance impact considerations** for proposed solutions

---

### 56. ✗ Listing block with content & 58. ✗ AsciiDoc blockquote with content

-   **Why it's failing (from grammar):** Both `listing_block` (lines 302-307) and `asciidoc_blockquote` (lines 314-319) use `optional(field('content', $.block_content))`. The `block_content` rule (line 514) is defined as `repeat1(choice($.content_line, $._blank_line))`, and `content_line` relies on an external scanner (`$.DELIMITED_BLOCK_CONTENT_LINE`). The failure is almost certainly in the external scanner's logic, which is not correctly identifying the content lines for these specific block types.

-   **Cross-reference Analysis:** These failures are related - both use identical `block_content` logic, suggesting a systemic issue rather than block-specific problems.

-   **Possible Solutions:**
    1.  **Debug the External Scanner (`scanner.c`) [Priority: HIGH, Risk: LOW]:** The primary solution is to investigate `src/scanner.c`. The logic for `DELIMITED_BLOCK_CONTENT_LINE` needs to correctly handle the delimiters `----` and `____` and recognize the lines between them as content. *Performance Impact: None - fixes existing functionality.*
    2.  **Use a Simpler Inline Rule [Priority: MEDIUM, Risk: MEDIUM]:** As a temporary workaround for debugging, replace `$.block_content` with a simple repeating token like `repeat(/[^\\r\\n]+/)` to confirm the block delimiters are being recognized correctly. This will help isolate the issue to the external scanner. *Risk: May break other block types that rely on block_content.*
    3.  **Check Delimiter Definitions [Priority: HIGH, Risk: LOW]:** Ensure the fence start/end definitions (`LISTING_FENCE_START`, `QUOTE_FENCE_START`, etc.) in the external scanner are not conflicting and are being matched correctly. *Root Cause Insight: Scanner state machine may not be transitioning correctly between delimiter recognition and content parsing.*

---

### 86. ✗ Malformed cross-references should be plain text & 87. ✗ Malformed footnotes should be plain text

-   **Why it's failing (from grammar):**
    -   The `internal_xref` rule (lines 823-832) has a fallback (`seq('<<', /[^>]+/)`), but it's too greedy and likely still creates a partial `internal_xref` node instead of allowing the text to be parsed as a simple paragraph.
    -   The footnote rules (`footnote_inline`, `footnote_ref`, `footnoteref` on lines 847-867) are defined with specific sequences and have no fallback mechanism. When they fail to match, the parser doesn't know to treat the text as plain.

-   **Parser Precedence Analysis:** The issue stems from greedy matching - structural rules (xref/footnote) have implicit higher precedence than text fallbacks, causing malformed syntax to create partial nodes rather than falling back to plain text.

-   **Cross-reference Analysis:** Both failures share the same underlying issue: lack of proper fallback mechanism when structural parsing fails.

-   **Possible Solutions:**
    1.  **Remove In-Rule Fallbacks [Priority: HIGH, Risk: LOW]:** Remove the fallback attempts from within the `internal_xref` rule. A better approach is to make the primary rule stricter and rely on the parser's broader fallback mechanisms. *Performance Impact: Slight improvement due to less backtracking.*
    2.  **Strengthen `_text_element` Fallbacks [Priority: HIGH, Risk: LOW]:** Add `prec(1, '<<')`, `prec(1, '>>')`, and `prec(1, 'footnote:')` to the `_text_element` choice (lines 647-663). This explicitly tells the parser that if these tokens don't form a valid structure, they should be treated as plain text. *Root Cause Fix: Establishes proper precedence hierarchy.*
    3.  **Refine Token Precedence [Priority: MEDIUM, Risk: MEDIUM]:** The malformed tokens are likely being captured before the `paragraph` rule's `text_segment`. Lowering the precedence of the `internal_xref` rule or increasing the precedence of the `text_segment` might help, but the `_text_element` solution is more robust. *Risk: May affect valid xref/footnote parsing.*

---

### 110. ✗ WARNING block with listing delimiters

-   **Why it's failing (from grammar):** This test fails because there is no rule that connects an admonition type with a delimited block. The grammar defines `paragraph_admonition` (line 618) which is for inline content, but there is no equivalent `block_admonition`. The parser sees a `paragraph` with an admonition label, followed by an unrelated `listing_block`.

-   **Root Cause Analysis:** The grammar treats admonitions as paragraph-level constructs only, missing the AsciiDoc specification's support for admonition blocks (admonition label followed by any block type).

-   **Cross-reference Analysis:** Related to test 112 (TIP block with metadata) - both indicate missing admonition-block relationships.

-   **Possible Solutions:**
    1.  **Create a `block_admonition` Rule [Priority: HIGH, Risk: LOW]:** The best solution is to create a new rule, e.g., `block_admonition: $ => seq(optional($.metadata), field('type', $.admonition_type), ':', $._line_ending, choice($.listing_block, $.example_block, ...))`. This would formally define the relationship. *Performance Impact: Minimal - adds one new rule type. Aligns with AsciiDoc specification.*
    2.  **Add Blocks to `paragraph` Content [Priority: LOW, Risk: HIGH]:** A less clean solution would be to modify the `paragraph` rule to allow delimited blocks to follow a `paragraph_admonition`. This is not recommended as it's semantically incorrect. *Risk: Breaks semantic model of paragraphs vs blocks.*
    3.  **Combine with Metadata [Priority: MEDIUM, Risk: MEDIUM]:** A common AsciiDoc pattern is `[WARNING] ---- ... ----`. The grammar's `metadata` rule (line 487) and `block_attributes` rule (line 494) could be modified to recognize `[WARNING]` as a special kind of attribute that modifies the subsequent block. *Risk: May conflict with existing attribute parsing.*

---

### 112. ✗ TIP block with metadata

-   **Why it's failing (from grammar):** The `paragraph_admonition` rule (line 618) does not account for a preceding `metadata` node. The `paragraph` rule (line 608) *does* allow optional metadata (`optional($.metadata)`), but it applies to the paragraph as a whole. The parser likely sees the metadata and then a line starting with "TIP:", but the `paragraph_admonition` rule itself doesn't expect the metadata.

-   **Root Cause Analysis:** The `block_attributes` regex is overly greedy, consuming newlines that the `paragraph_admonition` rule expects to be available. This creates a parsing conflict where metadata "steals" the line ending needed by the admonition.

-   **Cross-reference Analysis:** Directly related to test 110 (WARNING block) - both highlight the need for proper admonition-block integration. This is likely a precedence issue in the grammar hierarchy.

-   **Possible Solutions:**
    1.  **Refine Metadata Token [Priority: HIGH, Risk: LOW]:** Adjust the regex for `block_attributes` to not consume the trailing newline, or make the `_line_ending` optional after it in the `metadata` rule. *Root Cause Fix: Prevents metadata from consuming tokens needed by subsequent rules.*
    2.  **The current structure should work [Priority: MEDIUM, Risk: LOW]:** The issue is likely subtle. The `paragraph` rule *does* allow `metadata` before a `paragraph_admonition`. The conflict might be in how the metadata is parsed. The `block_attributes` token on line 494 is very greedy (`/\\[[^\\]\\r\\n]+\\][ \\t]*\\r?\\n/`). It might be consuming the line ending, preventing the `paragraph_admonition` from matching correctly on the next line. *Diagnostic approach first.*
    3.  **Explicitly Add Metadata to Admonition Rule [Priority: MEDIUM, Risk: MEDIUM]:** Move the `optional($.metadata)` from the `paragraph` rule directly into the `paragraph_admonition` rule to make the relationship explicit, e.g., `paragraph_admonition: $ => seq(optional($.metadata), field('type', $.admonition_type), ...)` and remove it from the parent paragraph. *Risk: May require broader grammar restructuring.*

---

### 132. ✗ Nested formatting edge cases

-   **Why it's failing (from grammar):** The content rules for `strong` (line 735) and `emphasis` (line 754) allow nesting of other formatting types. However, there are no `precedence` or `conflict` rules defined to resolve ambiguity when delimiters are adjacent (e.g., `*_..._*`). The parser doesn't know whether to parse `*` as the start of a strong block or as content within an emphasis block.

-   **Parser Precedence Analysis:** Tree-sitter's default LR parsing strategy creates ambiguity when multiple formatting rules can match the same token sequence. Without explicit precedence, the parser cannot deterministically choose between competing interpretations.

-   **Root Cause Analysis:** The issue is a classic shift/reduce conflict in parsing theory - when the parser encounters overlapping delimiters (`*_text_*`), it doesn't know whether to shift (continue with current rule) or reduce (complete current rule and start another).

-   **Possible Solutions:**
    1.  **Define Precedence [Priority: HIGH, Risk: LOW]:** Add `prec` to the formatting rules to establish a clear hierarchy. For example, give `strong` a higher precedence than `emphasis`: `strong: $ => prec(51, ...)` and `emphasis: $ => prec(50, ...)`. *Performance Impact: Resolves conflicts at parse-time rather than requiring backtracking.*
    2.  **Add to `conflicts` [Priority: HIGH, Risk: LOW]:** Add `[$.strong, $.emphasis]` to the `conflicts` array at the top of the grammar. This tells tree-sitter to expect and try to resolve shift/reduce conflicts between these rules. *Best practice: Explicitly declares expected conflicts.*
    3.  **Refine Content Rules [Priority: MEDIUM, Risk: HIGH]:** Make the content rules more specific. For example, the `strong_content` could be defined to not start or end with an `_`, which would prevent some ambiguous matches, although this is less flexible. *Risk: May prevent valid nested formatting combinations.*

---

### 163. ✗ Escaped delimiters in monospace

-   **Why it's failing (from grammar):** The `monospace_content` rule on line 773 is `repeat1(choice(token.immediate(/\\\\[*_`^~]/), token.immediate(/[^`\\r\\n]+/)))`. The first part correctly identifies an escaped character. However, the second part, `[^`\\r\\n]+`, will stop at the *next* backtick, regardless of whether it's escaped. The logic is flawed because the `choice` is ambiguous.

-   **Root Cause Analysis:** The `choice` between escaped characters and regular content creates an ambiguous grammar where the parser cannot decide which alternative to take when it encounters a backslash. This is a fundamental issue with how escape sequences are modeled.

-   **Parser Theory Insight:** The problem is that `choice(escape_token, content_token)` creates overlapping match possibilities. When the parser sees a backslash, it can't determine whether it's part of an escape sequence or regular content without lookahead.

-   **Possible Solutions:**
    1.  **Combine into a Single Regex [Priority: HIGH, Risk: LOW]:** The most robust solution is to use a single token for the content that handles escapes internally. Change `monospace_content` to `monospace_text: $ => token.immediate(/(?:\\\\.|[^`\\r\\n])+/),`. This regex means "match either an escaped character OR any character that is not a backtick or newline." *Performance Impact: Faster parsing due to single-token matching. Standard practice for escape handling.*
    2.  **Use `seq` instead of `choice` [Priority: LOW, Risk: HIGH]:** The current `choice` is ambiguous. Restructuring the rule to be a `repeat1` of a `seq` that more intelligently handles escaped characters might work, but it's overly complex. *Risk: May introduce new parsing conflicts.*
    3.  **External Scanner Logic [Priority: LOW, Risk: MEDIUM]:** For very complex cases, this could be moved to the external scanner, but it's not necessary here. The single regex solution (1) is standard practice for this problem. *Unnecessary complexity for this use case.*

---

## Implementation Recommendations

**Immediate Priority (High Impact, Low Risk):**
1. Fix escaped delimiters (Test 163) - single regex solution
2. Debug external scanner for listing/blockquote content (Tests 56, 58)
3. Add precedence to formatting rules (Test 132)

**Secondary Priority (Architectural Improvements):**
1. Implement `block_admonition` rule (Tests 110, 112)
2. Fix metadata token greediness (Test 112)
3. Strengthen text element fallbacks (Tests 86, 87)

**Performance Considerations:**
All proposed solutions either maintain or improve parsing performance. The external scanner debugging may reveal performance bottlenecks in the current C implementation.
