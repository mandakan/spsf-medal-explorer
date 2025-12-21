# PR #016: Configure Vite for GitHub Pages - DETAILED SPECIFICATION

**Title:** `build: configure vite for GitHub Pages base path`

**Description:**
Update vite.config.js with correct base path configuration for GitHub Pages deployment.

---

## CRITICAL SPECIFICATIONS

### Base Path Configuration
- For project repos: `base: process.env.CI ? '/repo-name/' : '/'`
- For user/org sites: `base: './''`
- Dynamic based on environment (CI vs local)

### Key Configuration Points
- Build output: `outDir: 'dist'`
- Minification: `minify: 'terser'`
- Sourcemaps: `sourcemap: false` (production)

---

## DETAILED AIDER PROMPT

Update `vite.config.js` with EXACT specification below.

### Current State Assessment

Your vite.config.js likely looks like this:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import reactRefresh from '@vitejs/plugin-react-refresh'

export default defineConfig({
  plugins: [react(), reactRefresh()],
})
```

### Required Update

Replace/update to include base path and build settings:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import reactRefresh from '@vitejs/plugin-react-refresh'

export default defineConfig({
  // Base path for GitHub Pages
  // In CI (GitHub Actions): /medals-app/ (replace with your repo name)
  // Locally: / (root path for dev server)
  base: process.env.CI ? '/medals-app/' : '/',

  plugins: [react(), reactRefresh()],

  // Build configuration for production
  build: {
    // Output directory
    outDir: 'dist',
    
    // Minify for production (significantly reduces bundle size)
    minify: 'terser',
    
    // Don't include source maps in production (keeps bundle small)
    sourcemap: false,
    
    // Chunk size warnings (optional)
    chunkSizeWarningLimit: 1000,
    
    // Output format
    rollupOptions: {
      output: {
        // This ensures consistent chunk naming across builds
        manualChunks: (id) => {
          // Optional: split vendor libraries into separate chunk
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  },

  // Development server configuration
  server: {
    port: 5173,
    open: true
  }
})
```

### Key Requirements

1. **Base Path Setting**
   - MUST be conditional: `process.env.CI ? '/repo-name/' : '/'`
   - Replace `medals-app` with actual repository name
   - In CI: path to subdir (GitHub Pages deploys to /username/repo/)
   - Locally: root path (dev server runs at localhost:5173/)

2. **Why Dynamic Base Path?**
   - Local development: URLs like `/styles.css` work
   - GitHub Pages: URLs need `/repo-name/styles.css`
   - GitHub Actions sets `CI=true` automatically
   - Process env lets us detect deployment context

3. **Build Configuration**
   - `outDir: 'dist'` - MUST match .gitignore and workflow expectations
   - `minify: 'terser'` - Production optimization, required
   - `sourcemap: false` - Don't ship source maps to production
   - `chunkSizeWarningLimit: 1000` - Warn if chunk exceeds 1MB

4. **Plugins**
   - MUST keep: `react()` and `reactRefresh()`
   - These enable React and HMR support

5. **Server Configuration (Optional)**
   - `port: 5173` - default Vite dev port
   - `open: true` - automatically open browser on `npm run dev`

### Repository Name Replacement

⚠️ CRITICAL: Replace `medals-app` with YOUR actual repository name:

```bash
# To find your repo name:
git config --get remote.origin.url
# Output: https://github.com/username/your-repo-name.git

# Use: your-repo-name
# Example:
base: process.env.CI ? '/your-repo-name/' : '/'
```

### Testing the Configuration

After merging, test locally:

```bash
# Development - should work with base: /
npm run dev
# Open http://localhost:5173
# Assets should load correctly

# Build - should use /medals-app/ base path
npm run build
# Check dist/index.html:
#   - CSS link: href="/medals-app/assets/..."
#   - JS script: src="/medals-app/assets/..."
```

### Verification Steps

1. **Check development works**
   ```bash
   npm run dev
   # Should start server at http://localhost:5173
   # All assets should load
   ```

2. **Check build includes correct paths**
   ```bash
   npm run build
   # Open dist/index.html in text editor
   # Look for asset paths like: /medals-app/assets/
   ```

3. **Test with serve (optional)**
   ```bash
   npm install -g serve  # if not installed
   cd dist
   serve -s .
   # Open http://localhost:5000
   # Should work correctly
   ```

### Environment Variables

GitHub Actions automatically sets:
- `process.env.CI = true`
- `process.env.GITHUB_REPOSITORY = username/repo-name`
- Other GitHub-specific variables

Vite's `defineConfig` can access these via `process.env.CI`.

### .gitignore Verification

Ensure .gitignore includes:
```
# Build output
dist/
.dist/

# Dependencies
node_modules/
```

The `dist/` directory should NOT be committed.

### Integration Points

- Used by: PR #015 (build workflow expects dist/)
- Used by: PR #017 (deploy workflow uses built dist/)
- Affects: All asset paths in production

### Common Mistakes to Prevent

❌ Do NOT hardcode `/medals-app/` without process.env.CI
❌ Do NOT forget trailing slash: `/medals-app/` NOT `/medals-app`
❌ Do NOT use absolute URLs for assets
❌ Do NOT commit dist/ to git
❌ Do NOT use different base paths locally vs CI
❌ Do NOT forget to update repo name from example
❌ Do NOT set sourcemap: true in production

### Troubleshooting

**Assets return 404 on GitHub Pages**
- Base path is wrong - check it matches repo name
- Missing trailing slash - should be `/repo-name/`
- Check GitHub Pages settings point to GitHub Actions

**Paths work locally but not on GitHub Pages**
- Vite base path not set correctly
- GitHub Pages not configured for Actions deployment
- Check Settings → Pages → Source set to GitHub Actions

**Assets have wrong paths in dist/index.html**
- Regenerate with: `npm run build`
- Verify vite.config.js has correct base path
- Check process.env.CI was actually applied

### Notes

- This configuration is essential for GitHub Pages
- Base path affects every asset reference
- Must be done BEFORE PR #017 (deploy workflow)
- Local dev and production use different base paths
- GitHub Actions automatically sets CI env var