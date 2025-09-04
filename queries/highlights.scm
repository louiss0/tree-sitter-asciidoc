; AsciiDoc syntax highlighting

; Section titles
(section_title (title) @markup.heading)

; Attribute entries
(attribute_entry
  (name) @property
  (value) @string)

; Paragraph text
(paragraph (text_with_inlines) @markup.text)
(text_segment) @markup.text

; Inline conditionals
(inline_ifdef) @keyword
(inline_ifndef) @keyword
(inline_ifeval) @keyword
(inline_content) @string

; Conditional directives
(ifdef_open) @keyword
(ifndef_open) @keyword
(ifeval_open) @keyword
(endif_directive) @keyword

; List highlighting
(unordered_list_item) @markup.list
(ordered_list_item) @markup.list
(description_item) @markup.list
(callout_item) @markup.list
