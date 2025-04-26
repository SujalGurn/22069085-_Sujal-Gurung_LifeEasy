import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // <-- import 'path' module

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // <-- this makes '@' point to 'src' folder
    },
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
