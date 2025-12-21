# PR #012: Setup Lint Workflow - DETAILED SPECIFICATION

**Title:** `ci: add ESLint validation workflow`

**Description:**
Add a GitHub Actions workflow that runs ESLint on every push and pull request with comprehensive validation and best practices.

---

## CRITICAL SPECIFICATIONS

### Action Versions (DO NOT DEVIATE)
- `actions/checkout`: MUST use `v4` (pinned - handles sparse checkout, fetch-depth optimization)
- `actions/setup-node`: MUST use `v4` (latest stable, includes cache features)
- Node.js version: `20.x` (LTS as of 2025, set explicitly via node-version input)

### Runner Configuration
- MUST use: `ubuntu-22.04` (NOT ubuntu-latest - provides consistency)
- Rationale: ubuntu-latest changes unexpectedly; ubuntu-22.04 is stable

### Permissions
- MUST explicitly set: `permissions: contents: read`
- This follows least-privilege security principle

---

## DETAILED AIDER PROMPT

Create a new GitHub Actions workflow file at `.github/workflows/lint.yml` with the EXACT specification below:

### Workflow File Structure (YAML)

```yaml
name: Lint

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
  lint:
    name: ESLint Validation
    runs-on: ubuntu-22.04
    timeout-minutes: 10
    
    steps:
      # Step 1: Checkout Code
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      # Step 2: Setup Node.js with caching
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
          cache-dependency-path: 'package-lock.json'

      # Step 3: Install Dependencies
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      # Step 4: Run ESLint
      - name: Run ESLint
        run: npm run lint
        continue-on-error: false
```

### Key Requirements

1. **Event Triggers**: MUST specify both push and pull_request with explicit branches
   - Push: triggers on main and develop
   - PR: checks incoming PRs against main and develop
   - Rationale: Catch issues early, allows feature-branch testing

2. **Permissions Block**: MUST be present at workflow level
   - `contents: read` - minimum required for checkout
   - Improves security posture automatically

3. **Runner**: MUST be `ubuntu-22.04` not `ubuntu-latest`
   - Latest changes unexpectedly, breaking CI consistency
   - 22.04 is stable LTS and widely supported

4. **Timeout**: MUST set `timeout-minutes: 10`
   - Prevents hung jobs
   - Lint should complete in seconds; 10min provides safety margin

5. **Checkout Step**:
   - MUST use `v4`
   - MUST include `fetch-depth: 1` (only current commit, faster)
   - No need for full history in lint check

6. **Node.js Setup**:
   - MUST use `v4`
   - MUST specify `node-version: '20.x'` (NOT 18, NOT latest)
   - MUST include cache: 'npm' (speeds up npm install)
   - MUST include cache-dependency-path for explicit lock file

7. **Install Dependencies**:
   - MUST use `npm ci` (not `npm install`)
   - Rationale: `npm ci` is deterministic, uses package-lock.json
   - MUST add flags: `--prefer-offline --no-audit`
     - --prefer-offline: Uses cache first, falls back to network
     - --no-audit: Skips npm audit for speed (security checks separate)

8. **ESLint Execution**:
   - MUST run: `npm run lint` (not `eslint .` directly)
   - Rationale: Uses script from package.json, configurable
   - MUST include `continue-on-error: false`
   - This ensures workflow fails if linting fails

### Expected Behavior

- ✅ Lints all `.js` and `.jsx` files per eslint.config.js
- ✅ Fails workflow if ANY lint errors found
- ✅ Completes in ~30-60 seconds
- ✅ Caches npm modules for subsequent runs
- ✅ Provides clear error output in GitHub UI

### Files Expected to Exist

Verify these files exist BEFORE merging:
- `package.json` - must have "lint" script
- `eslint.config.js` - lint configuration (flat config)
- `package-lock.json` - dependency lock file

### Post-Merge Verification

After merging this PR:
1. Go to Repo → Actions → Lint workflow
2. Verify workflow appears in the list
3. Make a test commit or open a test PR
4. Confirm workflow runs and completes successfully
5. Check that errors cause workflow to fail (test by intentionally breaking a file)

---

## COMMON MISTAKES TO PREVENT

❌ Do NOT use `ubuntu-latest` - it changes without notice
❌ Do NOT use `npm install` - use `npm ci` for CI environments
❌ Do NOT specify Node `latest` - always pin to explicit version
❌ Do NOT use `@v3` or other old versions - update to `@v4`
❌ Do NOT omit `fetch-depth: 1` - wastes time downloading history
❌ Do NOT forget `cache: 'npm'` - slower subsequent runs
❌ Do NOT use `continue-on-error: true` on linting - defeats the purpose

---

## TROUBLESHOOTING

**Workflow doesn't appear in Actions tab**
- Check YAML syntax (use yamllint)
- Ensure file is in `.github/workflows/`
- Commit and push file (workflows not detected from uncommitted files)

**"npm: command not found"**
- Node.js setup failed - check logs for errors
- Verify setup-node step ran successfully

**Lint passes locally but fails in CI**
- Version mismatch: Ensure local Node.js matches workflow (20.x)
- ESLint config difference: Verify eslint.config.js committed
- File permissions: Check file isn't untracked in git

**Timeout after 10 minutes**
- eslint.config.js too complex
- Very large codebase: increase timeout-minutes to 20
- Check for linting performance issues

---

## DEPENDENCIES

- ✅ Requires: `package.json` with "lint" script (from PR #013)
- ✅ Requires: `eslint.config.js` (already exists)
- ✅ Requires: `package-lock.json` (already exists)

---

## NOTES

- This workflow is foundational - all other CI depends on it
- Should be one of first PRs to merge after prep PRs
- ESLint must pass before any other CI checks run
- Developers should run `npm run lint` locally before pushing