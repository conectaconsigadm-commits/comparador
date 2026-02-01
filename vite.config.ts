import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path para GitHub Pages
  base: '/comparador/',
  // Configuração do Vitest
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'testdata/**/*.test.ts'],
  },
})
