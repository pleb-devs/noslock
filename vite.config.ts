import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force snstr to use browser entry
      'snstr': path.resolve(__dirname, 'node_modules/snstr/dist/esm/src/entries/index.web.js'),
      // Polyfill Node's events module for browser
      'events': path.resolve(__dirname, 'node_modules/events'),
    },
  },
})
