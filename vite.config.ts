import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Vite's default host is "localhost", which Node resolves verbatim — on
    // Windows that can bind ::1 only, while the browser tries 127.0.0.1 and gets
    // connection refused. Binding IPv4 explicitly makes http://localhost work.
    host: '127.0.0.1',
  },
})
