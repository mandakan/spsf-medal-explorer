# PR #014: Setup Test Workflow - DETAILED SPECIFICATION

**Title:** `ci: add test workflow`

**Description:**
Add GitHub Actions workflow for running tests with proper caching and configuration.

---

## CRITICAL SPECIFICATIONS

### Action Versions (PINNED)
- `actions/checkout@v4` - stable, required
- `actions/setup-node@v4` - latest stable with cache support
- Node.js: `20.x` (explicit version, NOT "latest")
- Runner: `ubuntu-22.04` (NOT ubuntu-latest)

### Test Runner
- Framework: Vitest (modern, Vite-native test runner)
- Command: `npm run test` which runs `vitest run`
- Coverage: Optional but recommended

---

## DETAILED AIDER PROMPT

Create `.github/workflows/test.yml` with EXACT specification:

```yaml
name: Test

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
  test:
    name: Unit Tests
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    
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

      - name: Run tests
        run: npm run test
        continue-on-error: false

      - name: Upload coverage (optional)
        if: always()
        uses: codecov/codecov-action@v4
        with:
          flags: unittests
          fail_ci_if_error: false
```

### Key Requirements

1. **Event Triggers**
   - MUST trigger on push to main and develop
   - MUST trigger on PR to main and develop
   - Same as lint workflow for consistency

2. **Runner Configuration**
   - MUST use `ubuntu-22.04` (stable, not latest)
   - MUST set `timeout-minutes: 15`
   - Tests may need more time than linting

3. **Node.js Setup**
   - MUST use Node.js `20.x`
   - MUST include npm cache
   - Cache significantly speeds up runs

4. **Dependencies Installation**
   - MUST use `npm ci --prefer-offline --no-audit`
   - Same flags as lint workflow for consistency

5. **Test Execution**
   - MUST run: `npm run test`
   - Script MUST call Vitest: `vitest run`
   - NO watch mode (--watch) in CI
   - `continue-on-error: false` ensures failure blocks merge

6. **Coverage Upload (Optional)**
   - Uses `codecov/codecov-action@v4`
   - Requires free Codecov account
   - Can be removed if not needed
   - `if: always()` ensures upload even if tests fail

### Package.json Test Script

Verify package.json has:
```json
"test": "vitest run"
```

If not, this workflow will fail. Add it first if missing.

### Test File Organization

Tests should follow Vitest conventions:
- Files: `**/*.test.js` or `**/*.spec.js`
- Location: Same directory as code or `src/__tests__/`
- Configuration: `vite.config.js` or `vitest.config.js`

### Vitest Dependencies

Must already be installed:
- `vitest` - test framework
- `@vitest/ui` - optional, for UI
- `@vitest/coverage-v8` - optional, for coverage

If missing, install: `npm install --save-dev vitest`

### Coverage Configuration

If coverage upload enabled, vitest.config.js should have:
```javascript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      exclude: ['node_modules/', 'dist/']
    }
  }
})
```

### Post-Merge Verification

Run locally to verify setup:
```bash
npm run test
# Should pass without errors
# Check output for test count and duration
```

### Integration

- Depends on: PR #013 (test script in package.json)
- Used by: PR #017 (deploy workflow runs tests)
- Optional: PR #020 (badge shows test status)

### Common Mistakes to Prevent

❌ Do NOT use `vitest` command directly - use `npm run test`
❌ Do NOT use watch mode in CI - tests must exit
❌ Do NOT skip setup-node - caching speeds up runs
❌ Do NOT forget `continue-on-error: false` - ensures failures block merge
❌ Do NOT use `ubuntu-latest` - use ubuntu-22.04
❌ Do NOT commit node_modules - rely on npm ci

### Troubleshooting

**"No tests found"**
- Verify test files exist: `src/**/*.test.js`
- Check vitest.config.js test.include pattern
- Ensure files match naming convention

**"vitest: command not found"**
- Run `npm install --save-dev vitest`
- Clear node_modules: `rm -rf node_modules && npm ci`

**Tests pass locally but fail in CI**
- Node version mismatch (verify 20.x)
- Timezone issues (use UTC in tests)
- Environment variables not set

**Timeout exceeded**
- Tests taking too long - optimize or increase timeout-minutes
- Increase to 20-30 if needed

### Notes

- Test workflow is independent, can merge anytime
- Coverage upload is optional - can remove codecov step
- Vitest configuration in vite.config.js or vitest.config.js
- Tests should be deterministic (no flakiness)