#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { readFile, writeFile, cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const root = resolve(process.cwd())
const distDir = resolve(root, 'dist')
const swPath = resolve(distDir, 'service-worker.js')
const indexHtmlPath = resolve(distDir, 'index.html')
const notFoundPath = resolve(distDir, '404.html')
const nojekyllPath = resolve(distDir, '.nojekyll')

// Use root base locally so vite preview serves at http://localhost:4173/
const base = process.env.VITE_BASE || '/'
let shortCommit = 'local'
try {
  shortCommit = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  // ignore if git not available
}
const builtAt = new Date().toISOString().replace(/[:.]/g, '-')
const buildNumber = process.env.BUILD_NUMBER || `local-${builtAt}`

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        VITE_BASE: base,
        BUILD_NUMBER: buildNumber,
        ...extraEnv,
      },
    })
    child.on('close', (code) => {
      if (code === 0) resolveP()
      else rejectP(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

async function postBuild() {
  // Stamp service worker version like CI does
  try {
    const swSrc = await readFile(swPath, 'utf8')
    const stamped = swSrc.replace(/^const VERSION = .*/m, `const VERSION = 'build-${buildNumber}'`)
    if (stamped !== swSrc) {
      await writeFile(swPath, stamped)
    }
  } catch (err) {
    console.warn('[build-local] Warning: could not stamp service worker:', err.message)
  }

  // Add SPA fallback and .nojekyll to mirror Pages deploy shape
  try {
    await cp(indexHtmlPath, notFoundPath)
  } catch (err) {
    console.warn('[build-local] Warning: could not create 404.html:', err.message)
  }
  try {
    await writeFile(nojekyllPath, '')
  } catch (err) {
    console.warn('[build-local] Warning: could not create .nojekyll:', err.message)
  }

  console.log(`[build-local] Build complete. BUILD_NUMBER=${buildNumber} BASE=${base}`)
}

async function main() {
  await run('npx', ['vite', 'build'])
  await postBuild()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
