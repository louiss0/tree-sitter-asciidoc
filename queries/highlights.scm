; AsciiDoc syntax highlighting

; Section titles
(section_title
  title: (title) @markup.heading)

; Attribute entries
(attribute_entry
  name: (attr_name) @property
  value: (attr_value) @string)

; Paragraph text
(paragraph
  (text) @text)

; Basic structure
(newline) @punctuation.whitespace
