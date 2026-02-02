import { resolve } from 'path'
import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    setupFiles: ['./test/setup-e2e.ts'],
  },
  plugins: [swc.vite()],
  resolve: {
    alias: {
      // Ensure Vitest correctly resolves TypeScript path aliases
      '@/': `${resolve(__dirname, './src')}/`,
      'test/': `${resolve(__dirname, './test')}/`,
      'generated/': `${resolve(__dirname, './generated')}/`,
    },
  },
})
