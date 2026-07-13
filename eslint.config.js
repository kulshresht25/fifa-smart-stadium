import globals from 'globals';
import pluginImport from 'eslint-plugin-import';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.firebase/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        ...globals.browser,
        // Node.js globals (for config files + test runner)
        ...globals.node,
      },
    },
    plugins: {
      import: pluginImport,
    },
    rules: {
      // Errors
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-duplicate-imports': 'error',

      // Warnings
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',

      // Import hygiene
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',

      // Code style (non-formatting — Prettier handles formatting)
      'prefer-template': 'warn',
      'object-shorthand': ['warn', 'always'],
      'arrow-body-style': ['warn', 'as-needed'],
    },
  },
  {
    // Relax rules for test files
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
