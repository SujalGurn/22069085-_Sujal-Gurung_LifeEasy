import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <-- import 'path' module

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer' // <-- this makes 'buffer' point to the 'buffer' module
    },
  },
  define: {
    global: {}, // Ensure global context is available if needed
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
});
