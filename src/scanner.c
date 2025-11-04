#include <tree_sitter/parser.h>
#include <stdlib.h>

// Keep enum entries so the generated parser links against the expected symbols.
enum {
    TABLE_FENCE_START,
    TABLE_FENCE_END,
    EXAMPLE_FENCE_START,
    EXAMPLE_FENCE_END,
    LISTING_FENCE_START,
    LISTING_FENCE_END,
    LITERAL_FENCE_START,
    LITERAL_FENCE_END,
    QUOTE_FENCE_START,
    QUOTE_FENCE_END,
    SIDEBAR_FENCE_START,
    SIDEBAR_FENCE_END,
    PASSTHROUGH_FENCE_START,
    PASSTHROUGH_FENCE_END,
    OPENBLOCK_FENCE_START,
    OPENBLOCK_FENCE_END,
    LIST_CONTINUATION,
    AUTOLINK_BOUNDARY,
    ATTRIBUTE_LIST_START,
    DELIMITED_BLOCK_CONTENT_LINE,
    _BLOCK_ANCHOR,
    _LIST_UNORDERED_MARKER,
    _LIST_ORDERED_MARKER,
    DESCRIPTION_LIST_SEP,
    _DESCRIPTION_LIST_ITEM,
    CALLOUT_MARKER,
    _ifdef_open_token,
    _ifndef_open_token,
    _ifeval_open_token,
    _endif_directive_token
};

typedef struct {
    char padding;
} Scanner;

void *tree_sitter_asciidoc_external_scanner_create(void) {
    return calloc(1, sizeof(Scanner));
}

void tree_sitter_asciidoc_external_scanner_destroy(void *payload) {
    free(payload);
}

unsigned tree_sitter_asciidoc_external_scanner_serialize(void *payload, char *buffer) {
    (void)payload;
    (void)buffer;
    return 0;
}

void tree_sitter_asciidoc_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    (void)payload;
    (void)buffer;
    (void)length;
}

bool tree_sitter_asciidoc_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    (void)payload;
    (void)lexer;
    (void)valid_symbols;
    return false;
}
