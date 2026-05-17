import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import eslintConfigPrettier from 'eslint-config-prettier';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

import { sharedRules, sharedTypeCheckedRules } from '../../eslint.config.shared.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const eslintConfig = [
  ...nextCoreWebVitals,
  eslintConfigPrettier,
  sharedRules,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    ...sharedTypeCheckedRules,
  },
  {
    ignores: ['eslint.config.mjs', 'next.config.mjs'],
  },
];

export default eslintConfig;
