import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    pool: 'forks',
    // CI環境では3回連続失敗でテストを中断
    bail: process.env.CI ? 3 : 0,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.ts',
        '**/*.config.js',
        'tests/**',
      ],
    },
    include: ['tests/unit/**/*.test.ts'],
  },
});