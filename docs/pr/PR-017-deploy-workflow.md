# PR #017: Setup GitHub Pages Deployment - DETAILED SPECIFICATION

**Title:** `ci: add github pages deployment workflow`

**Description:**
Automatic deployment to GitHub Pages on every push to main branch.

---

## CRITICAL SPECIFICATIONS

### Versions (PINNED)
- `actions/checkout@v4` - required
- `actions/setup-node@v4` - with npm cache
- `actions/upload-pages-artifact@v3` - GitHub Pages artifact uploader
- `actions/deploy-pages@v4` - GitHub Pages deployer
- Node.js: `20.x`
- Runner: `ubuntu-22.04`

### Deployment Trigger
- ONLY on push to `main` branch (not develop)
- Manual trigger via `workflow_dispatch` allowed
- NO deployment on pull requests

### Permissions Required
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

---

## DETAILED AIDER PROMPT

Create `.github/workflows/deploy.yml` with EXACT specification:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}

jobs:
  build:
    name: Build and Prepare Deployment
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

      - name: Run linting
        run: npm run lint
        continue-on-error: false

      - name: Run tests
        run: npm run test
        continue-on-error: false

      - name: Build application
        run: npm run build
        continue-on-error: false

      - name: Upload artifact for deployment
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
          name: 'github-pages'

  deploy:
    name: Deploy to GitHub Pages
    needs: build
    runs-on: ubuntu-22.04
    
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
        with:
          artifact-name: 'github-pages'
```

### Key Requirements

1. **Event Triggers**
   - Push to `main` ONLY (not develop, not other branches)
   - Manual trigger: `workflow_dispatch` (allows clicking "Run workflow" button)
   - NO automatic deployment from PRs

2. **Permissions**
   - `contents: read` - read repository code
   - `pages: write` - deploy to GitHub Pages
   - `id-token: write` - OIDC authentication token
   - All required for GitHub Pages deployment

3. **Environment Configuration**
   - MUST set `environment: { name: github-pages }`
   - GitHub Pages knows which environment this is
   - `url:` output from deployment for status badge

4. **Build Job** (runs first)
   - MUST use `ubuntu-22.04`
   - MUST run lint check (fails if issues)
   - MUST run tests (fails if tests fail)
   - MUST run build (fails if build fails)
   - Quality gates before deployment

5. **Build Verification**
   - All checks run before artifact upload
   - Ensures only quality code deploys
   - Lint, tests, build must ALL pass

6. **Artifact Upload**
   - MUST use `actions/upload-pages-artifact@v3`
   - Path: `'./dist'` (must match build output)
   - Name: `'github-pages'` (must match deploy step)

7. **Deploy Job** (runs after build)
   - Depends on: `needs: build`
   - MUST use `actions/deploy-pages@v4`
   - Input artifact-name: `'github-pages'`
   - `id: deployment` allows capturing URL output

### GitHub Pages Configuration

BEFORE merging, configure repository:

1. Go to: Repo Settings → Pages
2. Source: Select "GitHub Actions"
3. Branch: (can be any, workflow handles deployment)
4. Wait 5 minutes for GitHub to initialize

### Pre-Merge Checklist

- [ ] PR #016 merged (vite base path configured)
- [ ] PR #015 merged (build workflow works)
- [ ] PR #014 merged (test workflow works)
- [ ] PR #012 merged (lint workflow works)
- [ ] GitHub Pages settings configured for "GitHub Actions"
- [ ] Repository is PUBLIC (required for free GitHub Pages)

### Deployment Flow

1. Push to main branch
2. GitHub Actions automatically runs this workflow
3. Lint runs - fails if issues
4. Tests run - fails if any fail
5. Build runs - fails if any errors
6. Artifact uploaded to GitHub Pages
7. Deploy job takes artifact and deploys
8. App live at: `https://username.github.io/repo-name/`

### Testing Deployment

After first successful deployment:

```bash
# Create a test file
echo "deployment test" > test.txt

# Commit and push
git add test.txt
git commit -m "test deployment"
git push origin main

# Watch in GitHub Actions
# Visit https://username.github.io/repo-name/
# Should see updated app
```

### Deployment Status Check

After deploy:
- Go to Repo → Pages (in left sidebar)
- Should show: "Your site is live at https://..."
- Recent deployments listed below

### Troubleshooting

**Deployment fails with permission error**
- Check GitHub Pages settings
- Ensure source is "GitHub Actions"
- Verify repository is public

**App loads but assets return 404**
- Base path in vite.config.js wrong (PR #016)
- Verify base path matches repo name
- Clear browser cache

**Deploy job hangs or times out**
- Check build size: `du -sh dist/`
- Artifact might be too large
- Check for infinite loops in build

**Workflow doesn't run on push to main**
- Check workflow syntax (YAML errors)
- Ensure workflow file in `.github/workflows/`
- Branch protection might block?

### Post-Deployment Checklist

- [ ] App loads at GitHub Pages URL
- [ ] All assets load (no 404s)
- [ ] Links work correctly
- [ ] Responsive on mobile

### Notes

- Deploys on EVERY push to main - be careful
- Pull requests do NOT deploy
- Rollback: push old working code to main
- GitHub Pages builds in seconds (uses pre-built artifact)
- Manual workflow_dispatch allows testing without pushing code