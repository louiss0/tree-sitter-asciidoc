#!/bin/bash

# Array of feature branch names
features=(
    "lists"
    "links-and-references"
    "images-and-media"
    "tables"
    "block-elements"
    "admonitions"
    "attributes"
    "conditional-content"
    "include-directives"
    "macros-and-extensions"
    "roles-and-styling"
    "comments"
    "test-suite"
    "language-bindings"
    "editor-integration"
    "documentation"
    "build-system"
    "performance-optimization"
    "error-handling"
    "compliance-testing"
)

# Ensure we're on develop branch
git checkout develop

# Create feature branches
for feature in "${features[@]}"; do
    echo "Creating feature branch: feature/$feature"
    git checkout -b "feature/$feature"
    git checkout develop
done

# List all branches to confirm
echo -e "\nAll feature branches created:"
git branch | grep "feature/"
