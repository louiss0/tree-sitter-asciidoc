#!/usr/bin/env node
/**
 * @file CLI helper for intelligent value completions
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

const AsciidocCompletions = require('./completions');

class CompletionCLI {
  constructor() {
    this.completions = new AsciidocCompletions();
  }

  /**
   * Main CLI entry point
   * @param {string[]} args - Command line arguments
   */
  run(args) {
    const command = args[0];
    
    switch (command) {
      case 'complete':
        this.handleComplete(args.slice(1));
        break;
      case 'validate':
        this.handleValidate(args.slice(1));
        break;
      case 'options':
        this.handleOptions();
        break;
      case 'help':
      case '--help':
      case '-h':
        this.showHelp();
        break;
      default:
        this.showHelp();
        process.exit(1);
    }
  }

  /**
   * Handle completion requests
   * @param {string[]} args - Arguments for completion
   */
  handleComplete(args) {
    const option = args[0];
    const prefix = args[1] || '';
    const context = args[2] || '';

    if (!option) {
      console.error('Error: Option name is required for completion');
      process.exit(1);
    }

    let completions;
    if (context) {
      completions = this.completions.getSmartCompletions(option, context, prefix);
    } else {
      completions = this.completions.getCompletions(option, prefix);
    }

    if (completions.length === 0) {
      // Try to suggest similar options
      const similarOptions = this.completions.getSimilarOptions(option);
      if (similarOptions.length > 0) {
        console.error(`No completions found for '${option}'. Did you mean one of these?`);
        similarOptions.forEach(opt => console.error(`  ${opt}`));
        process.exit(1);
      } else {
        console.error(`No completions found for '${option}'`);
        process.exit(1);
      }
    }

    // Output completions (one per line for shell completion)
    completions.forEach(completion => console.log(completion));
  }

  /**
   * Handle validation requests
   * @param {string[]} args - Arguments for validation
   */
  handleValidate(args) {
    const option = args[0];
    const value = args[1];

    if (!option || !value) {
      console.error('Error: Both option and value are required for validation');
      process.exit(1);
    }

    const isValid = this.completions.isValidValue(option, value);
    
    if (isValid) {
      console.log('valid');
      process.exit(0);
    } else {
      console.log('invalid');
      // Show available options
      const validValues = this.completions.getCompletions(option);
      if (validValues.length > 0) {
        console.error(`Valid values for '${option}': ${validValues.join(', ')}`);\n      }\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Handle options listing\n   */\n  handleOptions() {\n    const options = this.completions.getAvailableOptions();\n    options.forEach(option => console.log(option));\n  }\n\n  /**\n   * Show help information\n   */\n  showHelp() {\n    console.log(`\nAsciidoc Completions CLI\n\nUsage:\n  completion-cli <command> [args...]\n\nCommands:\n  complete <option> [prefix] [context]  Get completions for an option\n  validate <option> <value>             Validate a value for an option\n  options                               List all available options\n  help                                  Show this help message\n\nExamples:\n  # Get all language completions\n  completion-cli complete language\n\n  # Get language completions starting with 'java'\n  completion-cli complete language java\n\n  # Get smart language completions for JavaScript files\n  completion-cli complete language '' .js\n\n  # Validate a backend value\n  completion-cli validate backend html5\n\n  # List all available options\n  completion-cli options\n`);\n  }\n}\n\n// Bash completion script generator\nfunction generateBashCompletion() {\n  return `# Bash completion for asciidoc-completions\n_asciidoc_completions() {\n    local cur prev opts\n    COMPREPLY=()\n    cur=\"\\${COMP_WORDS[COMP_CWORD]}\"\n    prev=\"\\${COMP_WORDS[COMP_CWORD-1]}\"\n    \n    case \\${COMP_CWORD} in\n        1)\n            opts=\"complete validate options help\"\n            COMPREPLY=( $(compgen -W \"\\${opts}\" -- \\${cur}) )\n            return 0\n            ;;\n        2)\n            case \"\\${prev}\" in\n                complete|validate)\n                    local options=$(completion-cli options)\n                    COMPREPLY=( $(compgen -W \"\\${options}\" -- \\${cur}) )\n                    return 0\n                    ;;\n            esac\n            ;;\n        3)\n            case \"\\${COMP_WORDS[1]}\" in\n                complete)\n                    local option=\"\\${COMP_WORDS[2]}\"\n                    local completions=$(completion-cli complete \"\\${option}\" \"\\${cur}\" 2>/dev/null)\n                    COMPREPLY=( $(compgen -W \"\\${completions}\" -- \\${cur}) )\n                    return 0\n                    ;;\n                validate)\n                    local option=\"\\${COMP_WORDS[2]}\"\n                    local completions=$(completion-cli complete \"\\${option}\" \"\\${cur}\" 2>/dev/null)\n                    COMPREPLY=( $(compgen -W \"\\${completions}\" -- \\${cur}) )\n                    return 0\n                    ;;\n            esac\n            ;;\n    esac\n}\n\ncomplete -F _asciidoc_completions completion-cli\n`;\n}\n\n// Main execution\nif (require.main === module) {\n  const args = process.argv.slice(2);\n  \n  // Special case for generating bash completion\n  if (args[0] === '--bash-completion') {\n    console.log(generateBashCompletion());\n    process.exit(0);\n  }\n  \n  const cli = new CompletionCLI();\n  cli.run(args);\n}\n\nmodule.exports = { CompletionCLI, generateBashCompletion };\n"}
