# PR #018: Setup Release Workflow - DETAILED SPECIFICATION

**Title:** `ci: add release workflow with semantic versioning`

**Description:**
Automated release creation with semantic versioning and auto-generated changelogs.

---

## CRITICAL SPECIFICATIONS

### Versions (PINNED)
- `actions/checkout@v4` - required
- `actions/setup-node@v4` - with npm cache
- `softprops/action-gh-release@v2` - GitHub release creation (CURRENT)
- Node.js: `20.x`
- Runner: `ubuntu-22.04`

### Trigger Mechanism
- Git tags ONLY: `v*.*.* ` format (e.g., v1.0.0, v1.2.3)
- MUST follow semantic versioning: `vMAJOR.MINOR.PATCH`
- NO automatic releases - manual tag push triggers

### Permissions Required
```yaml
permissions:
  contents: write
  pull-requests: read
```

---

## DETAILED AIDER PROMPT

Create `.github/workflows/release.yml` with EXACT specification:

```yaml
name: Release

on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'

permissions:
  contents: write
  pull-requests: read

jobs:
  validate-and-build:
    name: Validate and Build Release
    runs-on: ubuntu-22.04
    timeout-minutes: 20
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for changelog generation

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

  create-release:
    name: Create GitHub Release
    needs: validate-and-build
    runs-on: ubuntu-22.04
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for release notes

      - name: Create Release with Auto-generated Notes
        uses: softprops/action-gh-release@v2
        with:
          # Tag from git push (automatic)
          tag_name: ${{ github.ref_name }}
          
          # Release name extracted from tag
          name: Release ${{ github.ref_name }}
          
          # Auto-generate release notes from commits and PRs
          generate_release_notes: true
          
          # Mark as prerelease if contains alpha/beta/rc
          prerelease: ${{ contains(github.ref_name, 'alpha') || contains(github.ref_name, 'beta') || contains(github.ref_name, 'rc') }}
          
          # Draft release for review before publishing (false = publish immediately)
          draft: false
        env:
          GITHUB_TOKEN: ${{ github.token }}
```

### Key Requirements

1. **Trigger Configuration**
   - Tag pattern: `v[0-9]+.[0-9]+.[0-9]+`
   - Examples: v1.0.0, v2.1.3, v0.5.0
   - Must follow semantic versioning

2. **Validate Job** (runs first)
   - MUST run lint, test, build
   - Ensures only quality code releases
   - Fails if ANY check fails
   - Uses `fetch-depth: 0` for full commit history

3. **Release Job** (runs after validation)
   - Depends on: `needs: validate-and-build`
   - Uses `softprops/action-gh-release@v2` (CURRENT VERSION)
   - Auto-generates release notes from commits
   - Extracts version from git tag

4. **Auto-Generated Release Notes**
   - GitHub parses commit messages and PR titles
   - Categories: Features, Bug Fixes, etc.
   - Requires semantic commit messages:
     - `feat: ` → Features
     - `fix: ` → Bug Fixes
     - `docs: ` → Documentation
     - `ci: ` → CI/CD changes

5. **Release Naming**
   - Automatic: Uses tag name (v1.0.0)
   - Creates entry: "Release v1.0.0"

6. **Pre-release Detection**
   - Automatic for alpha/beta/rc tags
   - Examples:
     - v1.0.0-alpha → marked prerelease
     - v1.0.0-beta.1 → marked prerelease
     - v1.0.0 → marked release

### Creating a Release

To trigger this workflow:

```bash
# 1. Ensure all commits are on main and pushed
git push origin main

# 2. Create an annotated tag (preferred)
git tag -a v1.0.0 -m "Release version 1.0.0"

# 3. Push the tag to GitHub
git push origin v1.0.0

# Workflow automatically triggers
# Watch: Repo → Actions → Release workflow
# GitHub Release created automatically
```

### Semantic Commit Messages

Format commits for better changelogs:

```
feat: add new feature
  - Shows in "Features" section of release notes

fix: resolve bug
  - Shows in "Bug Fixes" section

docs: update README
  - Shows in "Documentation" section

ci: update workflows
  - Shows in "CI/CD" section

perf: optimize bundle size
  - Shows in "Performance" section

BREAKING CHANGE: description
  - Marks as major version
```

### Version Numbers Explained

Semantic Versioning: `vMAJOR.MINOR.PATCH`

- **MAJOR** (v2.0.0): Breaking changes
  - Incompatible API changes
  - Examples: v1.0.0 → v2.0.0

- **MINOR** (v1.1.0): New features
  - Backward compatible additions
  - Examples: v1.0.0 → v1.1.0

- **PATCH** (v1.0.1): Bug fixes
  - Backward compatible fixes
  - Examples: v1.0.0 → v1.0.1

### Release Checklist

Before creating release tag:

- [ ] All PRs merged to main
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Changelog reviewed
- [ ] Version number decided (MAJOR.MINOR.PATCH)

### After Release Created

1. GitHub automatically:
   - Creates release entry
   - Generates changelog from commits
   - Lists all merged PRs since last release
   - Creates downloadable assets

2. You can:
   - Edit release notes if needed
   - Attach build artifacts
   - Mark as "Latest release"

### Testing Release Workflow

Test with prerelease tag:

```bash
git tag -a v0.1.0-alpha -m "Alpha release"
git push origin v0.1.0-alpha
```

This:
- Triggers validation
- Creates release marked as prerelease
- Allows testing before major release

### Common Mistakes to Prevent

❌ Do NOT push version tags from branches other than main
❌ Do NOT use wrong tag format (must be vX.Y.Z)
❌ Do NOT skip validation (tests must pass)
❌ Do NOT use old action versions
❌ Do NOT forget semantic commit messages
❌ Do NOT create draft releases (set draft: false)

### Troubleshooting

**Tag doesn't trigger workflow**
- Check tag format: must be vX.Y.Z
- Ensure tag pushed: `git push origin v1.0.0`
- Check workflow syntax

**Release has incomplete notes**
- Check commit messages (must have feat:, fix:, etc.)
- Ensure commits on main branch
- Some commits might not generate notes

**Release marked as prerelease unintentionally**
- Tag name contains alpha/beta/rc
- Use clean versions: v1.0.0 not v1.0.0-rc

### Notes

- Requires semantic commit messages for best results
- Auto-generated notes from commits and PRs
- Full commit history available (fetch-depth: 0)
- Release published immediately (draft: false)
- Can be edited post-creation on GitHub UI