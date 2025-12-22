# PR #019: Add Husky Pre-commit Hooks - DETAILED SPECIFICATION

**Title:** `build: add husky pre-commit hooks for local linting`

**Description:**
Local pre-commit hooks to validate code quality before pushing to GitHub.

---

## CRITICAL SPECIFICATIONS

### Packages to Install
- `husky` - git hooks manager
- `lint-staged` - runs linting on staged files only

### Supported Packages Versions
- `husky@9.x` (current stable as of 2025)
- `lint-staged@15.x` (current stable as of 2025)

### Hooks to Setup
- `.husky/pre-commit` - runs lint-staged before commit
- Optional: `.husky/commit-msg` - validates commit messages

---

## DETAILED AIDER PROMPT

Execute these commands in order to set up Husky:

### Step 1: Install Packages

```bash
npm install --save-dev husky lint-staged
```

Verify installation:
```bash
npm list husky lint-staged
# Should show versions like husky@9.x.x and lint-staged@15.x.x
```

### Step 2: Initialize Husky

```bash
npx husky install
```

Expected output:
```
husky - Git hooks installed
```

This creates `.husky/` directory with hook templates.

### Step 3: Update package.json

Add this section to package.json (at root level, alongside "scripts"):

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "lint": "eslint .",
    "lint-fix": "eslint . --fix",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "eslint"
    ],
    "*.json": [
      "prettier --write"
    ]
  }
}
```

Key requirements:
- "lint-staged" is a top-level key (not nested in scripts)
- Glob patterns for file types
- Arrays of commands to run per file type
- Order: fix first, then validate

### Step 4: Create Pre-commit Hook

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

Expected output:
```
husky - created .husky/pre-commit
```

This creates file: `.husky/pre-commit`

### Step 5: Verify Hook File

Check `.husky/pre-commit` exists and contains:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

Make executable (usually automatic, but verify):
```bash
chmod +x .husky/pre-commit
```

### Step 6: Test Locally

Test the hook works:

```bash
# Create a test file with eslint error
echo "const x = 1" > test.js

# Stage it
git add test.js

# Try to commit (will fail due to eslint)
git commit -m "test"

# Should see eslint error and commit blocked

# Fix it
npm run lint-fix

# Stage fixed version
git add test.js

# Commit again (should work)
git commit -m "test: fix eslint"

# Remove test file
rm test.js
git add -A
```

### Optional: Commit Message Hook

For commit message validation (semantic commits):

```bash
npx husky add .husky/commit-msg "echo 'Validating commit message...'"
```

### What Lint-Staged Does

1. Gets all staged files from git
2. Runs eslint --fix on *.js and *.jsx files
3. Runs eslint (no --fix) to validate
4. Runs prettier on *.json files
5. Blocks commit if ANY command fails
6. Only lints changed files (faster than full lint)

### File Pattern Matching

```json
"*.{js,jsx}": [...] 
// Matches: file.js, file.jsx, nested/file.js

"*.json": [...]
// Matches: package.json, config.json, nested/file.json

"*.{ts,tsx}": [...]
// Would match TypeScript files (not in this project)
```

### .gitignore Addition

MUST add `.husky/` to .gitignore (or verify already there):

```
# Git hooks
.husky/

# Dependencies
node_modules/

# Build output
dist/
```

Hooks are NOT committed to git - they're local setup.

### Post-Install Steps

When cloning this repo or after merging:

```bash
npm install
npx husky install
```

This installs hooks on developer machines. Add to README or CONTRIBUTING.md.

### How It Works Flow

```
Developer makes changes
    ↓
git add file.js
    ↓
git commit -m "message"
    ↓
.husky/pre-commit runs automatically
    ↓
lint-staged checks modified files
    ↓
npm run lint-fix on *.js files
    ↓
npm run lint to validate
    ↓
If errors: commit BLOCKED
If clean: commit proceeds
```

### Bypassing Hooks (Emergency Only)

If absolutely necessary:

```bash
git commit --no-verify -m "message"
```

NOT recommended - defeats purpose of pre-commit checks.

### Configuration Notes

- Runs on staged files ONLY (partial changes)
- Can fix with --fix flag automatically
- Blocks commit on errors (enforced quality)
- Can be configured per project
- Works with any eslint/prettier setup

### Common Mistakes to Prevent

❌ Do NOT commit .husky/ directory
❌ Do NOT use versions older than husky@9.x
❌ Do NOT forget `npx husky install` on clone
❌ Do NOT use `--no-verify` regularly
❌ Do NOT configure hooks in package.json scripts
❌ Do NOT forget lint-staged configuration

### Troubleshooting

**"husky: No such file or directory"**
- Run: `npx husky install`
- Check .husky/ directory exists

**Pre-commit doesn't run**
- Verify .husky/pre-commit has execute permission
- Run: `chmod +x .husky/pre-commit`
- Check PATH includes npx

**"lint-staged command not found"**
- Install: `npm install --save-dev lint-staged`
- Check package.json has it in devDependencies

**All files lint even though only one changed**
- Check eslint.config.js is being used
- lint-staged should only lint staged files

**Commit slows down significantly**
- lint-staged linting takes time
- Normal for large codebases
- First time caches, gets faster

### Notes

- Optional but highly recommended
- Improves code quality at source
- Prevents bad commits from reaching CI
- Can be disabled with --no-verify
- Developers must run `npx husky install` locally
- Hook files NOT committed (local only)