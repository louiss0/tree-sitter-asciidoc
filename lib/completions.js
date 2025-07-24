/**
 * @file Intelligent value completions for AsciiDoc-related options
 * @author Shelton Louis <louisshelton0@gmail.com>
 * @license MIT
 */

/**
 * Intelligent value completion system for AsciiDoc-related options
 */
class AsciidocCompletions {
  constructor() {
    this.completions = {
      // Document type completions
      doctype: [
        'article',
        'book',
        'manpage',
        'inline'
      ],

      // Backend/output format completions
      backend: [
        'html5',
        'xhtml11',
        'docbook',
        'docbook5',
        'pdf',
        'latex',
        'manpage',
        'slidy',
        'revealjs'
      ],

      // Encoding completions
      encoding: [
        'utf-8',
        'iso-8859-1',
        'windows-1252',
        'ascii',
        'utf-16',
        'utf-32'
      ],

      // Source language completions for syntax highlighting
      language: [
        'javascript',
        'typescript',
        'python',
        'java',
        'go',
        'rust',
        'cpp',
        'c',
        'csharp',
        'php',
        'ruby',
        'bash',
        'shell',
        'json',
        'xml',
        'yaml',
        'html',
        'css',
        'sql',
        'dockerfile',
        'markdown',
        'asciidoc'
      ],

      // Shell type completions
      shell: [
        'bash',
        'sh',
        'zsh',
        'fish',
        'csh',
        'tcsh',
        'ksh',
        'powershell',
        'cmd',
        'pwsh'
      ],

      // Icon type completions
      icons: [
        'font',
        'image',
        'emoji',
        'none'
      ],

      // Table frame completions
      frame: [
        'all',
        'none',
        'sides',
        'topbot'
      ],

      // Table grid completions
      grid: [
        'all',
        'none',
        'rows',
        'cols'
      ],

      // Source highlighter completions
      'source-highlighter': [
        'highlight.js',
        'coderay',
        'pygments',
        'rouge',
        'prettify'
      ],

      // PDF theme completions
      'pdf-theme': [
        'default',
        'basic',
        'dark',
        'custom'
      ],

      // Sectnum levels
      sectnumlevels: [
        '0',
        '1',
        '2',
        '3',
        '4',
        '5'
      ],

      // TOC placement
      toc: [
        'auto',
        'left',
        'right',
        'macro',
        'preamble'
      ],

      // TOC levels
      toclevels: [
        '1',
        '2',
        '3',
        '4',
        '5'
      ],

      // Image formats
      format: [
        'png',
        'jpg',
        'jpeg',
        'gif',
        'svg',
        'webp',
        'pdf'
      ],

      // Text align options
      align: [
        'left',
        'center',
        'right',
        'justify'
      ],

      // Float options
      float: [
        'left',
        'right',
        'none'
      ],

      // Role/CSS class common values
      role: [
        'lead',
        'small',
        'big',
        'underline',
        'overline',
        'line-through',
        'nobreak',
        'nowrap',
        'pre-wrap'
      ]
    };
  }

  /**
   * Get completions for a specific option
   * @param {string} option - The option name
   * @param {string} [prefix=''] - Optional prefix to filter completions
   * @returns {string[]} Array of completion values
   */
  getCompletions(option, prefix = '') {
    const values = this.completions[option] || [];
    
    if (!prefix) {
      return values;
    }

    const lowerPrefix = prefix.toLowerCase();
    return values.filter(value => 
      value.toLowerCase().startsWith(lowerPrefix)
    );
  }

  /**
   * Get all available options
   * @returns {string[]} Array of option names
   */
  getAvailableOptions() {
    return Object.keys(this.completions);
  }

  /**
   * Add custom completions for an option
   * @param {string} option - The option name
   * @param {string[]} values - Array of completion values
   */
  addCompletions(option, values) {
    if (!this.completions[option]) {
      this.completions[option] = [];
    }
    this.completions[option] = [...new Set([...this.completions[option], ...values])];
  }

  /**
   * Smart completion that suggests based on context
   * @param {string} option - The option name
   * @param {string} context - Additional context (file extension, document type, etc.)
   * @param {string} [prefix=''] - Optional prefix to filter completions
   * @returns {string[]} Array of contextually relevant completion values
   */
  getSmartCompletions(option, context, prefix = '') {
    let baseCompletions = this.getCompletions(option, prefix);

    // Context-aware filtering and prioritization
    if (option === 'language' && context) {
      // Prioritize based on file context
      const contextMap = {
        '.js': ['javascript'],
        '.ts': ['typescript'],
        '.py': ['python'],
        '.java': ['java'],
        '.go': ['go'],
        '.rs': ['rust'],
        '.cpp': ['cpp'],
        '.c': ['c'],
        '.cs': ['csharp'],
        '.php': ['php'],
        '.rb': ['ruby'],
        '.sh': ['bash', 'shell'],
        '.json': ['json'],
        '.xml': ['xml'],
        '.yml': ['yaml'],
        '.yaml': ['yaml'],
        '.html': ['html'],
        '.css': ['css'],
        '.sql': ['sql'],
        '.md': ['markdown'],
        '.adoc': ['asciidoc']
      };

      const prioritized = contextMap[context] || [];
      const remaining = baseCompletions.filter(comp => !prioritized.includes(comp));
      baseCompletions = [...prioritized, ...remaining];
    }

    if (option === 'backend' && context === 'web') {
      // Prioritize web-friendly backends
      const webBackends = ['html5', 'xhtml11', 'slidy', 'revealjs'];
      const remaining = baseCompletions.filter(comp => !webBackends.includes(comp));
      baseCompletions = [...webBackends, ...remaining];
    }

    return baseCompletions;
  }

  /**
   * Validate if a value is a valid completion for an option
   * @param {string} option - The option name
   * @param {string} value - The value to validate
   * @returns {boolean} True if the value is valid
   */
  isValidValue(option, value) {
    const validValues = this.completions[option] || [];
    return validValues.includes(value);
  }

  /**
   * Get suggestions for similar options when an option is not found
   * @param {string} option - The option name
   * @returns {string[]} Array of similar option names
   */
  getSimilarOptions(option) {
    const availableOptions = this.getAvailableOptions();
    const lowerOption = option.toLowerCase();
    
    return availableOptions.filter(availableOption => {
      const lowerAvailable = availableOption.toLowerCase();
      // Simple similarity check based on common substrings
      return lowerAvailable.includes(lowerOption) || 
             lowerOption.includes(lowerAvailable) ||
             this.levenshteinDistance(lowerOption, lowerAvailable) <= 2;
    });
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} The Levenshtein distance
   */
  levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }
}

module.exports = AsciidocCompletions;
