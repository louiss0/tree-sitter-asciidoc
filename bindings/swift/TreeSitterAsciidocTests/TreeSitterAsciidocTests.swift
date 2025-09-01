import XCTest
import SwiftTreeSitter
import TreeSitterAsciidoc

final class TreeSitterAsciidocTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_asciidoc())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Tree-Sitter-Asciidoc grammar")
    }
}
