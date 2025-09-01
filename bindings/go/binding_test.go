package tree_sitter_asciidoc_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_asciidoc "github.com/louiss0/tree-sitter-asciidoc/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_asciidoc.Language())
	if language == nil {
		t.Errorf("Error loading Tree-Sitter-Asciidoc grammar")
	}
}
