import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore build output and coverage reports
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // ── Correctness ───────────────────────────────────────────────────────
      'no-unused-vars': ['error', {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '^_',     // allow _prefixed unused params
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      'no-undef': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }], // allow console.warn/error, not .log
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',

      // ── Code Style ────────────────────────────────────────────────────────
      'prefer-const': 'error',              // use const where possible
      'no-var': 'error',                    // disallow var
      'eqeqeq': ['error', 'always'],        // always use === not ==
      'curly': ['warn', 'multi-line'],      // braces for multi-line only
      'object-shorthand': ['warn', 'always'],

      // ── Best Practices ────────────────────────────────────────────────────
      'no-eval': 'error',                   // block eval() for security
      'no-implied-eval': 'error',
      'no-new-func': 'error',              // block new Function()
      'no-param-reassign': ['warn', { props: false }], // avoid mutating params
      'no-shadow': 'warn',                 // no variable shadowing
      'default-case': 'warn',              // require default in switch
      'no-fallthrough': 'error',           // explicit break/return in switch

      // ── React-specific ────────────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
