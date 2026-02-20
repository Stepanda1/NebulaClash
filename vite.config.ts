import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  base: isGitHubPages ? '/match3-game/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
