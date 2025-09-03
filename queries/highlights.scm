; AsciiDoc syntax highlighting

; Section titles
(section_title (title) @markup.heading)

; Attribute entries
(attribute_entry
  (name) @property
  (value) @string)

; Paragraph text
(paragraph (text) @markup.text)

; List highlighting
(unordered_list_item) @markup.list
(ordered_list_item) @markup.list
(description_item) @markup.list
(callout_item) @markup.list
