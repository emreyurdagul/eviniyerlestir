import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Three.js modülleri node'da WebGL yoksa patlar → canvas render testleri
    // unit testlerde kapsam dışı. Sadece saf JS/TS util'ler + React bileşenler.
    exclude: ['node_modules', 'dist', '.git'],
  },
})
