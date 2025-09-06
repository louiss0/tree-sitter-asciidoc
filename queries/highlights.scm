; AsciiDoc syntax highlighting

; Section titles
(section_title (title) @markup.heading)

; Attribute entries
(attribute_entry) @property

; Paragraph text
(paragraph (text_with_inlines) @markup.text)
(text_segment) @markup.text

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
