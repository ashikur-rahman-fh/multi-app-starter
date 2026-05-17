import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

/** Shared ESLint rules (flat config fragment). */
export const sharedRules = {
  plugins: {
    '@typescript-eslint': tseslint.plugin,
    'unused-imports': unusedImports,
  },
  rules: {
    'no-debugger': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};

/** Type-aware rules — apply only with parserOptions.projectService (see frontend eslint.config.mjs). */
export const sharedTypeCheckedRules = {
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
  },
};
