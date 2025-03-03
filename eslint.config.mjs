import globals from "globals";
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
//import pluginJs from "@eslint/js";


/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base JS configuration
  js.configs.recommended,
  
  // Chrome Extensions specific configuration
  {
    files: ['**/*.js', '**/*.ts', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        chrome: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Chrome Extensions specific rules
      'no-undef': 'error',
      'no-unused-vars': 'warn',
      
      // Best practices for extensions
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'prefer-const': 'warn',
      'camelcase': 'warn',
      
      // Security related rules
      //'no-inline-comments': 'warn',
      'no-new-func': 'error',

      "import/no-unresolved": "error", // Ensure imports resolve to a file
      "import/no-absolute-path": "error", // Disallow absolute paths
      "import/no-cycle": "error", // Disallow circular dependencies
      "import/no-useless-path-segments": "error", // Simplify path segments
      "import/no-extraneous-dependencies": "error", // Disallow unused dependencies
      'import/extensions': [
        'error', // Treat missing extensions as errors
        'ignorePackages', // Ignore package imports (e.g., 'react')
        {
          js: 'always', // Always require .js extension
        },
      ],
    },
    settings: {
      "import/resolver": {
        node: true, // Use Node.js resolver for import paths
      },
    }
  },
  
  // Content script specific rules
  {
    files: ['**/content-scripts/**/*.js', '**/content-scripts/**/*.ts', '**/content_scripts/**/*.js', '**/content_scripts/**/*.ts'],
    rules: {
      // Content scripts have access to the DOM but not to Chrome APIs directly
      'no-restricted-globals': ['error', 'chrome'],
    },
  },
  
  // Background script specific rules (service workers in MV3)
  {
    files: ['**/background.js', '**/background.ts', '**/service-worker.js', '**/service-worker.ts'],
    rules: {
      // Add specific rules for background scripts if needed
    },
  },
];

/*export default [
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
];*/