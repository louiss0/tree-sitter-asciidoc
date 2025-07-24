# Tree-sitter CLI Global Flags and Options

Based on analysis of the current tree-sitter CLI structure, the following global parameters are applicable across multiple subcommands and should be defined at the top level.

## High-Priority Global Options

### Configuration
- `--config-path <PATH>` - Path to an alternative config.json file
  - **Used by:** Parse, Test, Query, Highlight, Tags, DumpLanguages
  - **Description:** Allows users to specify custom configuration files instead of using the default
  - **Type:** Optional PathBuf
  - **Environment Variable:** Could add `TREE_SITTER_CONFIG_PATH`

### Build Configuration
- `--debug-build` / `-0` - Compile a parser in debug mode
  - **Used by:** Generate, Parse, Test
  - **Description:** Enables debug symbols and optimizations for parser compilation
  - **Type:** Boolean flag
  - **Environment Variable:** `TREE_SITTER_DEBUG_BUILD`

- `--rebuild` / `-r` - Force rebuild the parser
  - **Used by:** Parse, Test, Fuzz
  - **Description:** Forces recompilation of parsers even if they're up to date
  - **Type:** Boolean flag

### Language Selection
- `--scope <SCOPE>` - Select a language by scope instead of file extension
  - **Used by:** Parse, Query, Highlight, Tags
  - **Description:** Allows explicit language selection using TextMate-style scopes
  - **Type:** Optional String
  - **Example:** `source.javascript`, `text.html`

### Output Control
- `--quiet` / `-q` - Suppress main output
  - **Used by:** Parse, Query, Highlight, Tags, Playground
  - **Description:** Minimal output mode for scripting and automation
  - **Type:** Boolean flag

- `--time` / `-t` - Measure execution time
  - **Used by:** Parse, Query, Highlight, Tags
  - **Description:** Display timing information for performance analysis
  - **Type:** Boolean flag

### Input Sources
- `--paths-file <FILE>` - Path to a file with paths to source files
  - **Used by:** Parse, Query, Highlight, Tags
  - **Description:** Read input file paths from a file (one per line)
  - **Type:** Optional PathBuf

- `--test-number <N>` / `-n <N>` - Use contents of a specific test
  - **Used by:** Parse, Query, Highlight, Tags
  - **Description:** Process a specific test case instead of files
  - **Type:** Optional u32
  - **Conflicts with:** paths, paths-file

## Medium-Priority Global Options

### WASM Support
- `--wasm` - Use WASM parsers instead of native dynamic libraries
  - **Used by:** Build, Parse, Test
  - **Description:** Enable WebAssembly parser support for portability
  - **Type:** Boolean flag

### Debug and Logging
- `--log` / `-l` - Enable logging output
  - **Used by:** Generate, Fuzz (as parser logging)
  - **Description:** Enable verbose logging for debugging
  - **Type:** Boolean flag
  - **Environment Variable:** `TREE_SITTER_LOG`

- `--debug-graph` / `-D` - Produce log.html file with debug graphs
  - **Used by:** Parse, Test
  - **Description:** Generate visual debugging information
  - **Type:** Boolean flag

- `--open-log` - Open log.html in default browser (when debug-graph is enabled)
  - **Used by:** Parse, Test
  - **Description:** Automatically open debug output in browser
  - **Type:** Boolean flag

### File Processing
- `--encoding <ENCODING>` - Input file encoding
  - **Used by:** Parse
  - **Description:** Specify character encoding for input files
  - **Type:** Enum (Utf8, Utf16LE, Utf16BE)
  - **Default:** Utf8

## Implementation Strategy

### Phase 1: Core Global Options
Implement the high-priority options first as they provide the most value:
1. `--config-path` - Most universally useful
2. `--quiet` and `--time` - Essential for scripting
3. `--scope` - Important for language selection
4. `--debug-build` and `--rebuild` - Critical for development

### Phase 2: Extended Global Options
Add medium-priority options:
1. WASM support flags
2. Debug and logging options
3. Input encoding support

### Phase 3: Validation and Conflicts
- Ensure proper conflict resolution (e.g., test-number vs paths)
- Add environment variable support
- Implement proper help text and documentation

## Global Option Structure

```rust
#[derive(Args)]
pub struct GlobalOptions {
    /// Path to an alternative config.json file
    #[arg(long, global = true)]
    pub config_path: Option<PathBuf>,
    
    /// Compile parsers in debug mode
    #[arg(long, short = '0', global = true)]
    pub debug_build: bool,
    
    /// Force rebuild parsers
    #[arg(short = 'r', long, global = true)]
    pub rebuild: bool,
    
    /// Select language by scope instead of file extension
    #[arg(long, global = true)]
    pub scope: Option<String>,
    
    /// Suppress main output
    #[arg(long, short = 'q', global = true)]
    pub quiet: bool,
    
    /// Measure execution time
    #[arg(long, short = 't', global = true)]
    pub time: bool,
    
    /// Path to file containing source file paths
    #[arg(long = "paths", global = true)]
    pub paths_file: Option<PathBuf>,
    
    /// Use WASM parsers instead of native libraries
    #[arg(long, global = true)]
    pub wasm: bool,
    
    /// Enable logging output
    #[arg(long, short = 'l', global = true)]
    pub log: bool,
}
```

## Benefits of Global Options

1. **Consistency** - Same flags work across all relevant commands
2. **User Experience** - Reduced cognitive load, predictable behavior
3. **Scripting** - Easier automation with consistent flag names
4. **Maintenance** - Centralized option definitions reduce duplication
5. **Documentation** - Single source of truth for common options

## Migration Considerations

- Existing command-specific flags should remain functional for backward compatibility
- Global flags should take precedence over command-specific equivalents
- Clear deprecation warnings for duplicate functionality
- Update documentation to emphasize global options where appropriate
