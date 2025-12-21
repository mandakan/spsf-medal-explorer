import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Detect repo from GitHub Actions to compute base for GitHub Pages
const isCI = !!process.env.CI
const repo = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || ''
const isUserOrOrgSite = repo.endsWith('.github.io')

// Base path for GitHub Pages:
// - In CI: '/repo-name/' (or './' for user/org sites like username.github.io)
// - Locally: '/'
const baseFromCI = process.env.VITE_BASE
const base = baseFromCI != null && baseFromCI !== '' ? baseFromCI : (isCI ? (isUserOrOrgSite ? '/' : `/${repo}/`) : '/')

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    // Note: Using 'terser' requires installing it as a dev dependency. Run: npm i -D terser
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
