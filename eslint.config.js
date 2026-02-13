import baseConfig from './packages/config/eslint/base.js';
import nodeConfig from './packages/config/eslint/node.js';
import reactConfig from './packages/config/eslint/react.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // React config for web app
  ...reactConfig.map((config) => ({
    ...config,
    files: ['apps/web/**/*.{ts,tsx}'],
  })),
  // Node config for API and packages
  ...nodeConfig.map((config) => ({
    ...config,
    files: ['apps/api/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
  })),
  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/tests/**',
    ],
  },
];
