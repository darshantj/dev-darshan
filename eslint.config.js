import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // Unused things are usually mistakes; a leading _ marks "unused on purpose".
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // `import type { X }` makes it obvious X disappears at runtime.
      '@typescript-eslint/consistent-type-imports': 'error',
      // Use the logger (Step 9), not console.log.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
);
