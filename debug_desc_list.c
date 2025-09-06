#include <stdio.h>
#include <string.h>
#include "src/scanner.c"

// Mock lexer implementation for testing
typedef struct {
    const char* text;
    int position;
    bool at_eof;
} MockLexer;

static void mock_advance(TSLexer *lexer, bool skip) {
    MockLexer *mock = (MockLexer*)lexer;
    if (mock->position < strlen(mock->text)) {
        mock->position++;
    } else {
        mock->at_eof = true;
    }
}

static bool mock_eof(TSLexer *lexer) {
    MockLexer *mock = (MockLexer*)lexer;
    return mock->at_eof || mock->position >= strlen(mock->text);
}

static TSLexer create_mock_lexer(const char* text) {
    MockLexer *mock = malloc(sizeof(MockLexer));
    mock->text = text;
    mock->position = 0;
    mock->at_eof = false;
    
    TSLexer lexer = {
        .lookahead = text[0],
        .advance = mock_advance,
        .eof = mock_eof,
        .result_symbol = 0
    };
    
    return lexer;
}

int main() {
    printf("Testing description list separator scanner...\n");
    
    // Test case 1: Basic "Term:: description"  
    const char* test1 = "Term:: description";
    TSLexer lexer1 = create_mock_lexer(test1);
    
    // Move to the "::" part
    lexer1.lookahead = test1[4]; // First ':'
    MockLexer *mock1 = (MockLexer*)&lexer1;
    mock1->position = 4;
    
    printf("Test 1 - scanning '::' in 'Term:: description':\n");
    printf("Position: %d, Character: '%c'\n", mock1->position, lexer1.lookahead);
    
    bool result1 = scan_description_list_sep(&lexer1);
    printf("Result: %s\n", result1 ? "SUCCESS" : "FAILED");
    printf("Final position: %d\n", mock1->position);
    
    // Test case 2: Just "::" with space
    const char* test2 = ":: ";
    TSLexer lexer2 = create_mock_lexer(test2);
    
    printf("\nTest 2 - scanning ':: ' directly:\n");
    printf("Character: '%c'\n", lexer2.lookahead);
    
    bool result2 = scan_description_list_sep(&lexer2);
    printf("Result: %s\n", result2 ? "SUCCESS" : "FAILED");
    
    return 0;
}
