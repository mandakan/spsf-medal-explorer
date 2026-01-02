import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

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
// buildNumber and buildTime are resolved inside the Vite config function to avoid requiring BUILD_NUMBER during preview

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProdBuild = command === 'build' && mode === 'production'

  const buildNumber = process.env.BUILD_NUMBER ?? process.env.GITHUB_RUN_NUMBER

  // Only enforce BUILD_NUMBER for actual production builds.
  // Tooling like knip may load this config and should not fail.
  if (isProdBuild && !buildNumber) {
    throw new Error('BUILD_NUMBER is required for production builds')
  }

  const buildTime = new Date().toISOString()

  // Best practice: let CI/tag be the source of truth for release version.
  // Fallback to package.json for local/dev builds.
  const appVersion = (process.env.APP_VERSION && String(process.env.APP_VERSION).trim() !== '')
    ? String(process.env.APP_VERSION).trim()
    : pkg.version

  return {
    base,
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
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
      manifest: 'asset-manifest.json',
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
  }
})
