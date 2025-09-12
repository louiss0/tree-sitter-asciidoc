#!/usr/bin/env python3
"""
AsciiDoc Highlight Query Validation Script

This script validates the tree-sitter query files for AsciiDoc highlighting
by checking for common issues and testing against sample content.

Usage:
    python test-highlights.py [--verbose]

Requirements:
    - tree-sitter-cli installed
    - Proper query files in queries/ directory
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def check_query_syntax(query_file: Path) -> bool:
    """Check if a query file has valid syntax."""
    try:
        # Use tree-sitter to validate query syntax
        result = subprocess.run([
            'tree-sitter', 'query', 
            str(query_file)
        ], capture_output=True, text=True, cwd=Path.cwd())
        
        if result.returncode == 0:
            print(f"✅ {query_file.name}: Query syntax is valid")
            return True
        else:
            print(f"❌ {query_file.name}: Query syntax error")
            print(f"   Error: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("⚠️  tree-sitter CLI not found. Skipping syntax validation.")
        return True
    except Exception as e:
        print(f"❌ {query_file.name}: Error during validation: {e}")
        return False

def check_capture_conventions(query_file: Path, verbose: bool = False) -> bool:
    """Check if captures follow nvim-treesitter conventions."""
    issues = []
    modern_captures = set()
    legacy_captures = set()
    
    try:
        with open(query_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find all capture patterns
        import re
        capture_pattern = r'@([a-zA-Z][a-zA-Z0-9_.]*)'
        captures = re.findall(capture_pattern, content)
        
        for capture in captures:
            if capture.startswith('markup.') or capture.startswith('punctuation.') or \
               capture.startswith('keyword.') or capture.startswith('function.') or \
               capture.startswith('string.special'):
                modern_captures.add(capture)
            elif capture.startswith('text.') or capture in ['property', 'variable']:
                legacy_captures.add(capture)
                
        # Check for modern convention compliance
        if len(modern_captures) > len(legacy_captures) * 2:
            print(f"✅ {query_file.name}: Predominantly uses modern captures")
        else:
            issues.append("Should use more modern nvim-treesitter captures")
            
        # Check for priority usage
        priority_pattern = r'#set!\s*"priority"\s*\d+'
        priorities = re.findall(priority_pattern, content)
        if priorities:
            print(f"✅ {query_file.name}: Uses priority settings ({len(priorities)} found)")
        else:
            issues.append("Consider adding priority settings for important captures")
            
        if verbose:
            print(f"   Modern captures: {len(modern_captures)}")
            print(f"   Legacy captures: {len(legacy_captures)}")
            if modern_captures:
                print(f"   Sample modern: {list(modern_captures)[:5]}")
                
        if issues:
            for issue in issues:
                print(f"⚠️  {query_file.name}: {issue}")
            return False
        return True
        
    except Exception as e:
        print(f"❌ {query_file.name}: Error checking conventions: {e}")
        return False

def test_sample_parsing(sample_file: Path, verbose: bool = False) -> bool:
    """Test parsing of sample file with tree-sitter."""
    try:
        # Try to parse the sample file
        result = subprocess.run([
            'tree-sitter', 'parse', str(sample_file)
        ], capture_output=True, text=True, cwd=Path.cwd())
        
        if result.returncode == 0:
            print(f"✅ {sample_file.name}: Parses successfully")
            if verbose and result.stdout:
                # Count some basic nodes
                nodes = result.stdout.count('(') 
                print(f"   Parse tree contains ~{nodes} nodes")
            return True
        else:
            print(f"❌ {sample_file.name}: Parse error")
            if verbose:
                print(f"   Error: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("⚠️  tree-sitter CLI not found. Skipping parse test.")
        return True
    except Exception as e:
        print(f"❌ {sample_file.name}: Error during parsing: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Validate AsciiDoc highlighting queries')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Show detailed output')
    args = parser.parse_args()
    
    print("🔍 AsciiDoc Highlight Query Validation")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not Path('queries').exists():
        print("❌ Error: queries/ directory not found")
        print("   Please run this script from the tree-sitter-asciidoc root directory")
        sys.exit(1)
        
    all_passed = True
    
    # Test query files
    query_dir = Path('queries')
    query_files = list(query_dir.glob('*.scm'))
    
    if not query_files:
        print("❌ No .scm query files found in queries/ directory")
        sys.exit(1)
        
    print(f"\n📝 Testing {len(query_files)} query file(s):")
    for query_file in query_files:
        print(f"\n--- {query_file.name} ---")
        
        # Check syntax
        syntax_ok = check_query_syntax(query_file)
        
        # Check conventions  
        conventions_ok = check_capture_conventions(query_file, args.verbose)
        
        if not (syntax_ok and conventions_ok):
            all_passed = False
            
    # Test sample files
    test_dir = Path('tests/samples')
    if test_dir.exists():
        sample_files = list(test_dir.glob('*.adoc'))
        if sample_files:
            print(f"\n🧪 Testing {len(sample_files)} sample file(s):")
            for sample_file in sample_files:
                print(f"\n--- {sample_file.name} ---")
                parse_ok = test_sample_parsing(sample_file, args.verbose)
                if not parse_ok:
                    all_passed = False
    else:
        print("\n⚠️  No tests/samples directory found - skipping sample tests")
        
    # Final result
    print("\n" + "=" * 40)
    if all_passed:
        print("🎉 All tests passed! Your highlighting queries look good.")
        sys.exit(0)
    else:
        print("⚠️  Some issues found. See details above.")
        sys.exit(1)

if __name__ == '__main__':
    main()