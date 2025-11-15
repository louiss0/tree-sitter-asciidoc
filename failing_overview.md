```
  01_sections:
      1. G£ô [32mSection titles with different levels[0m
      2. G£ô [32mSingle section with title[0m
      3. G£ô [32mSection titles with varied spacing[0m
  02_paragraphs:
      4. G£ô [32mParagraphs with blank lines[0m
      5. G£ô [32mFake headings without space should be paragraphs[0m
      6. G£ô [32mMixed paragraphs and blank lines[0m
      7. G£ô [32mSingle paragraph line[0m
  03_attributes:
      8. G£ô [32mBasic attribute entries[0m
      9. G£ô [32mAttribute entries without values[0m
     10. G£ô [32mAttribute entries with spaces in values[0m
     11. G£ô [32mInvalid attribute patterns should be paragraphs[0m
     12. G£ô [32mMixed attributes and other content[0m
  04_hierarchy:
     13. G£ô [32mSection hierarchy nesting[0m
     14. G£ô [32mMultiple sections at same level[0m
     15. G£ô [32mDeep nesting with all levels[0m
     16. G£ô [32mSections with attributes[0m
  05_edge_cases:
     17. G£ô [32mIndented headings are treated as valid headings[0m
     18. G£ô [32mInvalid attribute patterns should be paragraphs[0m
     19. G£ô [32mAttributes with spaces in values and empty values[0m
     20. G£ô [32mMultiple consecutive blank lines[0m
     21. G£ô [32mHeadings with trailing spaces[0m
  06_unordered_lists:
     22. G£ô [32mSimple unordered list with asterisk[0m
     23. G£ô [32mSimple unordered list with hyphen[0m
     24. G£ô [32mMixed unordered list markers[0m
     25. G£ô [32mNot a list - missing space after marker[0m
  07_ordered_lists:
     26. G£ô [32mSimple ordered list[0m
     27. G£ô [32mOrdered list with multiple digits[0m
     28. G£ô [32mNot a list - missing space after period[0m
     29. G£ô [32mNot a list - decimal number in paragraph[0m
  08_description_lists:
     30. G£ô [32mSimple description list[0m
     31. G£ô [32mNot a description list - missing space after double colon[0m
     32. G£ô [32mNot a description list - triple colon[0m
  09_callout_lists:
     33. G£ô [32mSimple callout list[0m
     34. G£ô [32mNot a callout list - missing space after marker[0m
  10_mixed_lists:
     35. G£ô [32mLists mixed with paragraphs[0m
     36. G£ô [32mLists mixed with sections and attributes[0m
  11_conditionals:
     37. G£ô [32mBasic ifdef block[0m
     38. G£ô [32mBasic ifndef block[0m
     39. G£ô [32mBasic ifeval block[0m
     40. G£ô [32mNested conditionals[0m
     41. G£ô [32mMixed conditional and description list[0m
     42. G£ô [32mMultiple attribute targets[0m
     43. G£ô [32mConditional with lists and sections[0m
     44. G£ô [32mEmpty conditional block[0m
     45. G£ô [32mComplex ifeval expression[0m
  12_conditional_conflicts:
     46. G£ù [31mDescription lists should not become conditionals[0m
     47. G£ù [31mParagraphs with directive-like words[0m
     48. G£ù [31mMalformed conditionals should be paragraphs[0m
     49. G£ù [31mMixing attributes and conditionals[0m
     50. G£ù [31mTriple colons are not conditionals[0m
     51. G£ù [31mNo targets in ifdef should still work[0m
     52. G£ù [31mConditionals with attributes inside sections[0m
  13_inline_conditionals:
     53. G£ù [31mBlock conditional with single line content[0m
  14_delimited_blocks:
     54. G£ô [32mEmpty example block[0m
     55. G£ô [32mThis is example content
line 2[0m
     56. G£ô [32mLiteral block with content[0m
     57. G£ô [32mAsciiDoc blockquote with content[0m
     58. G£ô [32mSidebar block with content[0m
     59. G£ô [32mPassthrough block with content[0m
     60. G£ô [32mOpen block with content[0m
     61. G£ô [32mSystem.out.println("Hello");[0m
     62. G£ô [32mExample content in section[0m
     63. G£ô [32mThis is an example block[0m
     64. G£ô [32mBlock with trailing spaces on delimiters[0m
     65. G£ô [32mContent with near-delimiters not at beginning of line[0m
     66. G£ô [32mOpen block with nested-looking delimiters[0m
  15_anchors_footnotes_xrefs:
     67. G£ù [31mInline anchor without text[0m
     68. G£ù [31mInline anchor with text[0m
     69. G£ù [31mBlock anchor without text[0m
     70. G£ù [31mBlock anchor with text[0m
     71. G£ù [31mInternal cross-reference without text[0m
     72. G£ù [31mInternal cross-reference with text[0m
     73. G£ù [31mExternal cross-reference without text[0m
     74. G£ù [31mExternal cross-reference with text[0m
     75. G£ù [31mInline footnote[0m
     76. G£ù [31mReferenced footnote without text[0m
     77. G£ù [31mReferenced footnote with text[0m
     78. G£ù [31mFootnote reference without text[0m
     79. G£ù [31mFootnote reference with text[0m
     80. G£ù [31mMixed inline elements in paragraph[0m
     81. G£ù [31mAdjacent inline elements[0m
     82. G£ô [32mExample block content with anchor[0m
     83. G£ù [31mMalformed anchors should be plain text[0m
     84. G£ù [31mMalformed cross-references should be plain text[0m
     85. G£ù [31mMalformed footnotes should be plain text[0m
     86. G£ù [31mComplex cross-reference targets[0m
  16_admonitions:
     87. G£ù [31mBasic Paragraph Admonitions[0m
     88. G£ù [31mAdmonition Blocks with Example[0m
     89. G£ù [31mAdmonition Blocks with Different Delimited Block Types[0m
     90. G£ù [31mComplex Paragraph Admonitions with Inline Elements[0m
     91. G£ù [31mBlock admonitions work in sections as well.[0m
     92. G£ù [31mThis should not be an admonition block.[0m
  16_paragraph_admonitions:
     93. G£ù [31mNOTE paragraph admonition[0m
     94. G£ù [31mTIP paragraph admonition[0m
     95. G£ù [31mIMPORTANT paragraph admonition[0m
     96. G£ù [31mWARNING paragraph admonition[0m
     97. G£ù [31mCAUTION paragraph admonition[0m
     98. G£ù [31mNOTE paragraph with inline elements[0m
     99. G£ù [31mEmpty NOTE paragraph[0m
    100. G£ù [31mNot an admonition - lowercase label[0m
    101. G£ù [31mNot an admonition - missing space after colon[0m
    102. G£ù [31mNot an admonition - invalid label[0m
    103. G£ù [31mMultiple admonition paragraphs[0m
    104. G£ù [31mAdmonition paragraph in section[0m
  17_block_admonitions:
    105. G£ô [32mThis is a note block with example content.[0m
    106. G£ù [31mTIP block with sidebar delimiters[0m
    107. G£ù [31mIMPORTANT block with quote delimiters[0m
    108. G£ù [31mWARNING block with listing delimiters[0m
    109. G£ù [31mCAUTION block with literal delimiters[0m
    110. G£ù [31mTIP block with metadata[0m
    111. G£ô [32mThis warning block has an anchor.[0m
    112. G£ù [31mNot an admonition block - no delimited block following[0m
  18_basic_formatting:
    113. G£ù [31mSimple strong formatting[0m
    114. G£ù [31mSimple emphasis formatting[0m
    115. G£ù [31mSimple monospace formatting[0m
    116. G£ù [31mUnclosed formatting should be plain text[0m
    117. G£ù [31mMixed formatting elements[0m
    118. G£ù [31mSimple superscript and subscript[0m
  19_inline_formatting:
    119. G£ù [31mBasic inline formatting[0m
    120. G£ù [31mSuperscript and subscript[0m
    121. G£ù [31mNested formatting[0m
    122. G£ù [31mAttribute references[0m
    123. G£ù [31mAuto links[0m
    124. G£ù [31mLinks with text[0m
    125. G£ù [31mPassthrough[0m
  20_inline_edge_cases:
    126. G£ù [31mUnicode word boundaries in formatting[0m
    127. G£ù [31mDelimiter adjacency and escape handling[0m
    128. G£ù [31mComplex autolink boundary detection[0m
    129. G£ù [31mRole spans with complex attributes[0m
    130. G£ù [31mNested formatting edge cases[0m
    131. G£ù [31mMacro and attribute edge cases[0m
    132. G£ù [31mCross-reference and anchor combinations[0m
    133. G£ù [31mPassthrough and raw content edge cases[0m
  20_links_images:
    134. G£ù [31mAuto links[0m
    135. G£ù [31mLinks with text[0m
    136. G£ù [31mLinks with formatted text[0m
    137. G£ù [31mInline images[0m
    138. G£ù [31mBlock images[0m
  21_block_edge_cases:
    139. G£ù [31mNested delimited blocks[0m
    140. G£ù [31mComplex table structures[0m
    141. G£ù [31mExample block as continuation.[0m
    142. G£ù [31mConditional blocks with nesting[0m
    143. G£ù [31mComplex admonition combinations[0m
    144. G£ù [31mSection nesting with anchors[0m
    145. G£ù [31mAttribute edge cases with references[0m
  21_passthrough:
    146. G£ù [31mTriple plus passthrough[0m
    147. G£ù [31mPass macro without substitutions[0m
    148. G£ù [31mPass macro with substitutions[0m
    149. G£ù [31mMultiple passthrough in same line[0m
  22_macros_roles:
    150. G£ù [31mRole spans[0m
    151. G£ù [31mRole spans with nested formatting[0m
    152. G£ù [31mMath macros[0m
    153. G£ù [31mUI macros[0m
    154. G£ù [31mAttribute references[0m
  23_inline_edge_cases:
    155. G£ù [31mURL followed by monospace (precedence test)[0m
    156. G£ù [31mInline inside role span content[0m
    157. G£ù [31mCrossing styles (should fallback gracefully)[0m
    158. G£ù [31mTrailing plus without EOL (should not create line_break)[0m
    159. G£ù [31mEscaped delimiters in strong[0m
    160. G£ù [31mEscaped delimiters in emphasis[0m
    161. G£ù [31mEscaped delimiters in monospace[0m
    162. G£ù [31mEscaped delimiters in superscript[0m
    163. G£ù [31mEscaped delimiters in subscript[0m
    164. G£ù [31mEscaped delimiters in role span[0m
    165. G£ù [31mComplex nesting with multiple styles[0m
    166. G£ù [31mAttribute reference inside various constructs[0m
    167. G£ù [31mLine break with proper EOL[0m
    168. G£ù [31mMacro precedence over formatting[0m
    169. G£ù [31mPassthrough precedence over everything[0m
    170. G£ù [31mImage and link precedence[0m
    171. G£ù [31mMultiple consecutive inline elements[0m
    172. G£ù [31mEmpty inline constructs (edge case)[0m
    173. G£ù [31mRole span with dots in name[0m
  24_tables:
    174. G£ô [32mBasic Table[0m
    175. G£ô [32mTable with Title and Metadata[0m
    176. G£ô [32mTable with Cell Specifications - Spans and Formats[0m
    177. G£ô [32mTable with AsciiDoc Content in Cells[0m
    178. G£ô [32mEmpty Table and Edge Cases[0m
    179. G£ô [32mTable with Empty Cells[0m
  25_include_directives:
    180. G£ô [32mBasic include without options[0m
    181. G£ô [32mInclude with leveloffset option[0m
    182. G£ô [32mInclude with line ranges[0m
    183. G£ô [32mInclude with tags[0m
    184. G£ô [32mInclude with multiple options[0m
    185. G£ô [32mInclude with path containing subdirectories[0m
    186. G£ù [31mInclude in section[0m
    187. G£ô [32mMultiple includes[0m
    188. G£ô [32mInclude with empty options[0m
    189. G£ô [32mNot an include - missing colon[0m
    190. G£ô [32mNot an include - malformed brackets[0m
  26_index_terms:
    191. G£ù [31mSimple index term macro[0m
    192. G£ù [31mHierarchical index term with secondary and tertiary[0m
    193. G£ù [31mIndex term with secondary only[0m
    194. G£ù [31mVisible index term (indexterm2)[0m
    195. G£ù [31mConcealed index term[0m
    196. G£ù [31mConcealed index term with hierarchy[0m
    197. G£ù [31mMultiple index terms in paragraph[0m
    198. G£ù [31mIndex terms with special characters[0m
    199. G£ù [31mMixed index terms with other inline elements[0m
    200. G£ù [31mNot an index term - malformed brackets[0m
    201. G£ô [32mNot an index term - incomplete concealed[0m
  27_block_comments:
    202. G£ô [32mBasic block comment[0m
    203. G£ô [32mMulti-line block comment with special characters[0m
    204. G£ô [32mSingle line block comment[0m
    205. G£ô [32mMultiple block comments[0m
    206. G£ô [32mBlock comments with sections[0m
    207. G£ô [32mBlock comments with nested delimited block markers[0m
  28_advanced_tables:
    208. G£ô [32mTable with column spanning[0m
    209. G£ô [32mTable with row spanning[0m
    210. G£ô [32mTable with both column and row spanning[0m
    211. G£ô [32mTable with format specifications[0m
    212. G£ô [32mTable with header format[0m
    213. G£ô [32mTable with combined span and format specifications[0m
    214. G£ô [32mTable with empty cells and edge cases[0m
    215. G£ô [32mTable with metadata and complex specifications[0m
  29_expressions_operators:
    216. G£ô [32mBasic comparison operators[0m
    217. G£ô [32mNumeric comparison[0m
    218. G£ô [32mLogical operators[0m
    219. G£ô [32mLogical NOT operator[0m
    220. G£ô [32mComplex arithmetic expression[0m
    221. G£ô [32mGrouped expressions with parentheses[0m
    222. G£ô [32mBoolean literals[0m
  30_math_macros:
    223. G£ù [31mBasic stem inline macro[0m
    224. G£ù [31mLaTeX math inline macro[0m
    225. G£ù [31mAsciiMath inline macro[0m
    226. G£ù [31mMultiple math macros in one paragraph[0m
    227. G£ù [31mMath macro with complex content[0m

```
