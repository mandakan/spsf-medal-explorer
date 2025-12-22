# PR #015: Setup Build Workflow - DETAILED SPECIFICATION

**Title:** `ci: add build workflow`

**Description:**
Add GitHub Actions workflow that validates the production build process succeeds.

---

## CRITICAL SPECIFICATIONS

### Action Versions (PINNED)
- `actions/checkout@v4` - required
- `actions/setup-node@v4` - with npm cache
- Node.js: `20.x` (explicit, matching other workflows)
- Runner: `ubuntu-22.04` (stable)

### Build Tool
- Tool: Vite (must be in package.json devDependencies)
- Command: `npm run build` → `vite build`
- Output: `dist/` directory

---

## DETAILED AIDER PROMPT

Create `.github/workflows/build.yml` with EXACT specification:

```yaml
name: Build

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

permissions:
  contents: read

jobs:
  build:
    name: Build Production Bundle
    runs-on: ubuntu-22.04
    timeout-minutes: 20
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
          cache-dependency-path: 'package-lock.json'

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      - name: Build application
        run: npm run build
        continue-on-error: false

      - name: Verify dist directory
        run: |
          if [ ! -d "dist" ]; then
            echo "ERROR: dist directory not created after build"
            exit 1
          fi
          echo "Build successful. Dist contents:"
          ls -la dist/

      - name: Check build size
        run: du -sh dist/
        continue-on-error: true
```

### Key Requirements

1. **Event Triggers**
   - Push to main and develop
   - PR to main and develop
   - Consistent with lint and test workflows

2. **Runner Configuration**
   - MUST use `ubuntu-22.04`
   - MUST set `timeout-minutes: 20`
   - Build may take longer than lint/test

3. **Node.js Setup**
   - MUST use Node.js `20.x`
   - MUST enable npm cache

4. **Install Step**
   - MUST use `npm ci --prefer-offline --no-audit`
   - Matches lint and test workflows

5. **Build Step**
   - MUST run: `npm run build`
   - Script MUST call: `vite build`
   - NO development builds or preview mode
   - `continue-on-error: false` ensures failure blocks merge

6. **Build Verification**
   - MUST verify dist/ directory exists
   - MUST check for empty builds
   - Exit code 1 if dist not created

7. **Build Size Check**
   - Optional information step
   - Shows final artifact size
   - `continue-on-error: true` prevents failure

### Package.json Build Script

Verify exists:
```json
"build": "vite build"
```

### Vite Configuration

File: `vite.config.js` MUST have:

```javascript
export default defineConfig({
  plugins: [react(), reactRefresh()],
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false
  }
})
```

Key requirements:
- `outDir: 'dist'` (workflow checks for this)
- `minify: 'terser'` (production optimization)
- `sourcemap: false` (don't include in deployed artifact)

### .gitignore

MUST exclude dist:
```
dist/
node_modules/
```

Build files should NOT be committed.

### Post-Merge Verification

Run locally:
```bash
npm run build
ls -la dist/
# Should see HTML, JS, CSS files
```

### Output Artifacts

Build produces:
- `dist/index.html` - main HTML file
- `dist/assets/*.js` - bundled JavaScript
- `dist/assets/*.css` - compiled styles
- `dist/assets/*.woff2` - fonts (if any)

### Integration

- Depends on: PR #013 (build script)
- Depends on: vite.config.js (build config)
- Used by: PR #017 (deploy uses built dist/)
- Related: PR #016 (vite base path config)

### Common Mistakes to Prevent

❌ Do NOT use `vite build` directly - use `npm run build`
❌ Do NOT commit dist/ to git - add to .gitignore
❌ Do NOT build in development mode
❌ Do NOT forget to verify dist/ exists
❌ Do NOT use ubuntu-latest - use ubuntu-22.04
❌ Do NOT disable minification in production

### Troubleshooting

**"dist directory not found"**
- Build failed silently - check npm output
- Verify vite.config.js has `outDir: 'dist'`
- Check for build errors in full log

**"npm: command not found"**
- Node.js setup issue - check setup-node step
- Verify Node version in logs shows 20.x

**Build takes too long**
- Check for large dependencies
- Consider webpack or esbuild instead
- Increase timeout-minutes if needed

**Asset paths wrong in dist/index.html**
- Check vite.config.js `base` setting (from PR #016)
- Should be `base: process.env.CI ? '/repo-name/' : '/'`

### Notes

- Build validation happens before every merge
- dist/ is not committed to git
- GitHub Pages deployment uses this dist/
- Build artifacts can be cached if needed (optional)
- Production builds should be optimized (minified, etc.)