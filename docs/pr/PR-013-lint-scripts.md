# PR #013: Add Lint Scripts - DETAILED SPECIFICATION

**Title:** `build: add lint and lint-fix scripts to package.json`

**Description:**
Add npm scripts for linting that are consumed by CI workflows and used by developers locally.

---

## CRITICAL SPECIFICATIONS

### Scripts to Add
- Script name: `lint` - for CI validation
- Script name: `lint-fix` - for local development
- Command: Both MUST reference `eslint .` (not other linters)

### Configuration Dependencies
- MUST use existing `eslint.config.js` (flat config format)
- MUST NOT reference old `.eslintrc` files
- NO configuration flags in scripts - all config in eslint.config.js

---

## DETAILED AIDER PROMPT

Update `package.json` to add these scripts in the "scripts" section with EXACT format:

### Required JSON Changes

Locate the "scripts" section in package.json and add these entries (maintain alphabetical order within scripts):

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "lint": "eslint .",
    "lint-fix": "eslint . --fix",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

### Key Requirements

1. **Script Naming**
   - MUST be lowercase
   - MUST use hyphens not underscores (npm convention)
   - `lint` - for CI/checking violations
   - `lint-fix` - for auto-fixing issues

2. **ESLint Commands**
   - MUST use `eslint .` (target current directory)
   - MUST NOT use `eslint src/` or other paths
   - Rationale: eslint.config.js defines ignore patterns

3. **Lint Script** (`lint`)
   - Purpose: Validation in CI (fails on errors)
   - Used by: lint.yml workflow, pre-commit hooks
   - NO --fix flag (don't auto-fix in CI)
   - Exit code 1 on errors (workflow fails)

4. **Lint-Fix Script** (`lint-fix`)
   - Purpose: Development tool for developers
   - Used by: Local development, Husky hooks
   - MUST include `--fix` flag
   - Auto-corrects issues developers can fix

5. **JSON Format Requirements**
   - MUST maintain valid JSON
   - All strings in double quotes
   - Proper comma placement
   - Consistent indentation (2 spaces standard for npm)

### Expected File State

After editing package.json:

```json
{
  "name": "medals-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "lint": "eslint .",
    "lint-fix": "eslint . --fix",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    ...
  },
  "devDependencies": {
    ...
  }
}
```

### Dependencies Already Present

These MUST already exist in devDependencies:
- `eslint` - linter engine
- `@eslint/js` - shared config
- `eslint-plugin-react-hooks` - React plugin
- `eslint-plugin-react-refresh` - Vite plugin
- `globals` - browser globals

If ANY missing, this PR FAILS - they're prerequisites from initial setup.

### Post-Merge Verification

After merging, verify locally:

```bash
# Should pass without errors
npm run lint

# Should exit with code 0 (success)
echo $?

# Should auto-fix formatting
npm run lint-fix

# Should now pass again
npm run lint
```

### Integration with Other PRs

- Used by: PR #012 (lint workflow)
- Used by: PR #019 (Husky pre-commit hooks)
- Prerequisite: MUST merge BEFORE PR #012

### Common Mistakes to Prevent

❌ Do NOT use `eslint src/` - too restrictive
❌ Do NOT add configuration flags to scripts - use eslint.config.js
❌ Do NOT use `eslint-fix` as script name - npm convention is hyphenated
❌ Do NOT forget `--fix` flag on lint-fix script
❌ Do NOT add quotes around paths: `eslint .` NOT `"eslint ."`
❌ Do NOT break JSON format with trailing commas

### Troubleshooting

**"npm: command not found"**
- Node.js not installed
- Check `npm --version`

**"eslint: command not found"**
- ESLint not installed as dev dependency
- Run `npm install` first
- Check package.json devDependencies has eslint entry

**"lint-fix modified unexpected files"**
- .gitignore might be excluding files that should be linted
- ESLint config might target wrong directories

**JSON parsing error in package.json**
- Verify JSON syntax (no trailing commas, proper quotes)
- Use JSON formatter to validate

### Notes

- These scripts are pure npm convention - no magic
- Scripts execute shell commands in node_modules/.bin
- Developers can run locally: `npm run lint`
- CI workflows will call these scripts: `npm run lint`
- Script order doesn't matter in package.json