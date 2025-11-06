# Test Failure Analysis (Updated)

This document outlines the reasons for the failing tests in the `tree-sitter-asciidoc` grammar and provides up to three potential solutions for each failure, based on a review of `grammar.js`.

---

### 56. ✗ Listing block with content & 58. ✗ AsciiDoc blockquote with content

-   **Why it's failing (from grammar):** Both `listing_block` (lines 302-307) and `asciidoc_blockquote` (lines 314-319) use `optional(field('content', $.block_content))`. The `block_content` rule (line 514) is defined as `repeat1(choice($.content_line, $._blank_line))`, and `content_line` relies on an external scanner (`$.DELIMITED_BLOCK_CONTENT_LINE`). The failure is almost certainly in the external scanner's logic, which is not correctly identifying the content lines for these specific block types.

-   **Possible Solutions:**
    1.  **Debug the External Scanner (`scanner.c`):** The primary solution is to investigate `src/scanner.c`. The logic for `DELIMITED_BLOCK_CONTENT_LINE` needs to correctly handle the delimiters `----` and `____` and recognize the lines between them as content.
    2.  **Use a Simpler Inline Rule:** As a temporary workaround for debugging, replace `$.block_content` with a simple repeating token like `repeat(/[^\\r\\n]+/)` to confirm the block delimiters are being recognized correctly. This will help isolate the issue to the external scanner.
    3.  **Check Delimiter Definitions:** Ensure the fence start/end definitions (`LISTING_FENCE_START`, `QUOTE_FENCE_START`, etc.) in the external scanner are not conflicting and are being matched correctly.

---

### 86. ✗ Malformed cross-references should be plain text & 87. ✗ Malformed footnotes should be plain text

-   **Why it's failing (from grammar):**
    -   The `internal_xref` rule (lines 823-832) has a fallback (`seq('<<', /[^>]+/)`), but it's too greedy and likely still creates a partial `internal_xref` node instead of allowing the text to be parsed as a simple paragraph.
    -   The footnote rules (`footnote_inline`, `footnote_ref`, `footnoteref` on lines 847-867) are defined with specific sequences and have no fallback mechanism. When they fail to match, the parser doesn't know to treat the text as plain.

-   **Possible Solutions:**
    1.  **Remove In-Rule Fallbacks:** Remove the fallback attempts from within the `internal_xref` rule. A better approach is to make the primary rule stricter and rely on the parser's broader fallback mechanisms.
    2.  **Strengthen `_text_element` Fallbacks:** Add `prec(1, '<<')`, `prec(1, '>>')`, and `prec(1, 'footnote:')` to the `_text_element` choice (lines 647-663). This explicitly tells the parser that if these tokens don't form a valid structure, they should be treated as plain text.
    3.  **Refine Token Precedence:** The malformed tokens are likely being captured before the `paragraph` rule's `text_segment`. Lowering the precedence of the `internal_xref` rule or increasing the precedence of the `text_segment` might help, but the `_text_element` solution is more robust.

---

### 110. ✗ WARNING block with listing delimiters

-   **Why it's failing (from grammar):** This test fails because there is no rule that connects an admonition type with a delimited block. The grammar defines `paragraph_admonition` (line 618) which is for inline content, but there is no equivalent `block_admonition`. The parser sees a `paragraph` with an admonition label, followed by an unrelated `listing_block`.

-   **Possible Solutions:**
    1.  **Create a `block_admonition` Rule:** The best solution is to create a new rule, e.g., `block_admonition: $ => seq(optional($.metadata), field('type', $.admonition_type), ':', $._line_ending, choice($.listing_block, $.example_block, ...))`. This would formally define the relationship.
    2.  **Add Blocks to `paragraph` Content:** A less clean solution would be to modify the `paragraph` rule to allow delimited blocks to follow a `paragraph_admonition`. This is not recommended as it's semantically incorrect.
    3.  **Combine with Metadata:** A common AsciiDoc pattern is `[WARNING] ---- ... ----`. The grammar's `metadata` rule (line 487) and `block_attributes` rule (line 494) could be modified to recognize `[WARNING]` as a special kind of attribute that modifies the subsequent block.

---

### 112. ✗ TIP block with metadata

-   **Why it's failing (from grammar):** The `paragraph_admonition` rule (line 618) does not account for a preceding `metadata` node. The `paragraph` rule (line 608) *does* allow optional metadata (`optional($.metadata)`), but it applies to the paragraph as a whole. The parser likely sees the metadata and then a line starting with "TIP:", but the `paragraph_admonition` rule itself doesn't expect the metadata.

-   **Possible Solutions:**
    1.  **The current structure should work:** The issue is likely subtle. The `paragraph` rule *does* allow `metadata` before a `paragraph_admonition`. The conflict might be in how the metadata is parsed. The `block_attributes` token on line 494 is very greedy (`/\\[[^\\]\\r\\n]+\\][ \\t]*\\r?\\n/`). It might be consuming the line ending, preventing the `paragraph_admonition` from matching correctly on the next line.
    2.  **Refine Metadata Token:** Adjust the regex for `block_attributes` to not consume the trailing newline, or make the `_line_ending` optional after it in the `metadata` rule.
    3.  **Explicitly Add Metadata to Admonition Rule:** Move the `optional($.metadata)` from the `paragraph` rule directly into the `paragraph_admonition` rule to make the relationship explicit, e.g., `paragraph_admonition: $ => seq(optional($.metadata), field('type', $.admonition_type), ...)` and remove it from the parent paragraph.

---

### 132. ✗ Nested formatting edge cases

-   **Why it's failing (from grammar):** The content rules for `strong` (line 735) and `emphasis` (line 754) allow nesting of other formatting types. However, there are no `precedence` or `conflict` rules defined to resolve ambiguity when delimiters are adjacent (e.g., `*_..._*`). The parser doesn't know whether to parse `*` as the start of a strong block or as content within an emphasis block.

-   **Possible Solutions:**
    1.  **Define Precedence:** Add `prec` to the formatting rules to establish a clear hierarchy. For example, give `strong` a higher precedence than `emphasis`: `strong: $ => prec(51, ...)` and `emphasis: $ => prec(50, ...)`.
    2.  **Add to `conflicts`:** Add `[$.strong, $.emphasis]` to the `conflicts` array at the top of the grammar. This tells tree-sitter to expect and try to resolve shift/reduce conflicts between these rules.
    3.  **Refine Content Rules:** Make the content rules more specific. For example, the `strong_content` could be defined to not start or end with an `_`, which would prevent some ambiguous matches, although this is less flexible.

---

### 163. ✗ Escaped delimiters in monospace

-   **Why it's failing (from grammar):** The `monospace_content` rule on line 773 is `repeat1(choice(token.immediate(/\\\\[*_`^~]/), token.immediate(/[^`\\r\\n]+/)))`. The first part correctly identifies an escaped character. However, the second part, `[^`\\r\\n]+`, will stop at the *next* backtick, regardless of whether it's escaped. The logic is flawed because the `choice` is ambiguous.

-   **Possible Solutions:**
    1.  **Combine into a Single Regex:** The most robust solution is to use a single token for the content that handles escapes internally. Change `monospace_content` to `monospace_text: $ => token.immediate(/(?:\\\\.|[^`\\r\\n])+/),`. This regex means "match either an escaped character OR any character that is not a backtick or newline."
    2.  **Use `seq` instead of `choice`:** The current `choice` is ambiguous. Restructuring the rule to be a `repeat1` of a `seq` that more intelligently handles escaped characters might work, but it's overly complex.
    3.  **External Scanner Logic:** For very complex cases, this could be moved to the external scanner, but it's not necessary here. The single regex solution (1) is standard practice for this problem.
