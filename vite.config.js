import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import pkg from './package.json' assert { type: 'json' }

// Detect repo from GitHub Actions to compute base for GitHub Pages
const isCI = !!process.env.CI
const repo = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || ''
const isUserOrOrgSite = repo.endsWith('.github.io')

// Base path for GitHub Pages:
// - In CI: '/repo-name/' (or './' for user/org sites like username.github.io)
// - Locally: '/'
const baseFromCI = process.env.VITE_BASE
const base = baseFromCI != null && baseFromCI !== '' ? baseFromCI : (isCI ? (isUserOrOrgSite ? '/' : `/${repo}/`) : '/')

const commit = execSync('git rev-parse --short HEAD').toString().trim()
const buildNumber = process.env.BUILD_NUMBER ?? process.env.GITHUB_RUN_NUMBER
if (!buildNumber && process.env.NODE_ENV === 'production') {
  throw new Error('BUILD_NUMBER is required for production builds')
}
const buildTime = new Date().toISOString()

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_NUMBER__: JSON.stringify(buildNumber || 'dev'),
    __BUILD_COMMIT__: JSON.stringify(commit),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
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
