import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**', // Exclude node_modules
      '**/dist/**', // Exclude built files
      '**/__tests__/util.ts', // Replace with testPathIgnorePatterns equivalent
    ],
    coverage: {
      provider: 'v8',
    },
  },
  resolve: {
    extensions: ['.ts'],
  },
});
