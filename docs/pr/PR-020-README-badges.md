# PR #020: Add CI/CD Status Badges - DETAILED SPECIFICATION

**Title:** `docs: add CI/CD status badges to README`

**Description:**
Add visual status badges showing workflow health and deployment status.

---

## CRITICAL SPECIFICATIONS

### Badge Format
- Official GitHub Actions badge format
- Dynamic: updates in real-time as workflows run
- Links to workflow details when clicked
- Shows: Success (green), Failure (red), Running (yellow)

### URLs Required
- Replace `YOUR_USERNAME` with actual GitHub username
- Replace `YOUR_REPO` with actual repository name
- Must be exactly 4 badges (Lint, Test, Build, Deploy)

---

## DETAILED AIDER PROMPT

Update README.md file by adding these badges to the top of the file.

### Current README State

Your README likely starts with:
```markdown
# Project Name

Some description...
```

### Required Update

Add badges right after the title, before the description:

```markdown
# Your Project Name

[![Lint](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/lint.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/lint.yml)
[![Test](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/test.yml)
[![Build](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/build.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/build.yml)
[![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy.yml)

Your description starts here...
```

### Badge Components Breakdown

Each badge has two parts:

**Image URL**: `![Alt](https://github.com/.../badge.svg)`
- Shows the visual badge
- Updates automatically
- Color indicates status

**Link URL**: `[...](https://github.com/.../actions/workflows/...)`
- Click takes to workflow details
- Shows recent runs and logs
- Useful for debugging failures

### Replacing Placeholders

Example with actual values:

If you are:
- Username: `john-doe`
- Repository: `medals-app`

Then replace:
```markdown
YOUR_USERNAME → john-doe
YOUR_REPO → medals-app
```

Result:
```markdown
[![Lint](https://github.com/john-doe/medals-app/actions/workflows/lint.yml/badge.svg)](https://github.com/john-doe/medals-app/actions/workflows/lint.yml)
[![Test](https://github.com/john-doe/medals-app/actions/workflows/test.yml/badge.svg)](https://github.com/john-doe/medals-app/actions/workflows/test.yml)
[![Build](https://github.com/john-doe/medals-app/actions/workflows/build.yml/badge.svg)](https://github.com/john-doe/medals-app/actions/workflows/build.yml)
[![Deploy](https://github.com/john-doe/medals-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/john-doe/medals-app/actions/workflows/deploy.yml)
```

### Complete Example README

```markdown
# Medals App

[![Lint](https://github.com/john-doe/medals-app/actions/workflows/lint.yml/badge.svg)](https://github.com/john-doe/medals-app/actions/workflows/lint.yml)
[![Test](https://github.com/john-doe/medals-app/actions/workflows/test.yml/badge.svg)](https://github.com/john-doe/medals-app/actions/workflows/test.yml)
[![Build](https://github.com/john-doe/medals-app/actions/workflows/build.yml/badge.svg)](https://github.com/john-doe/medals-app/actions/workflows/build.yml)
[![Deploy](https://github.com/john-doe/medals-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/john-doe/medals-app/actions/workflows/deploy.yml)

A Swedish pistol shooting medals tracking application built with React and Vite.

## Features

- ...
```

### Badge Behavior

**Green Badge** (✓ Success)
- Workflow passed
- Last run completed successfully
- Clicking shows green checkmark

**Red Badge** (✗ Failure)
- Workflow failed
- Last run had errors
- Click to see error logs
- Common: lint errors, test failures, build errors

**Yellow Badge** (⚙ Running)
- Workflow currently executing
- Real-time progress
- Appears during push/PR event

**Gray Badge** (⊘ Not Run)
- Workflow never executed
- No git events triggered it yet
- Should not appear after initial setup

### Placement Guidelines

**MUST be:**
- Right after main title (#)
- Before description paragraph
- All 4 badges together
- In same order: Lint, Test, Build, Deploy

**MUST NOT be:**
- In header comments
- Mixed with other content
- In a code block
- Only partial set (all 4 required)

### Testing Badges

After merging, verify badges work:

1. Go to your README on GitHub
2. Look for 4 colored badges below title
3. Click each badge:
   - Should navigate to workflow details
   - Should show recent run history
4. After pushing code, badges should update

### GitHub Actions Workflow Reference

The badge URLs expect these exact workflow files:
- `.github/workflows/lint.yml` (from PR #012)
- `.github/workflows/test.yml` (from PR #014)
- `.github/workflows/build.yml` (from PR #015)
- `.github/workflows/deploy.yml` (from PR #017)

If workflow files are missing, badges show gray (not run).

### Badge Customization (Optional)

GitHub now supports branch-specific badges:

```markdown
# For specific branch (e.g., develop):
[![Lint](https://github.com/.../badge.svg?branch=develop)](...)
```

For main setup, omit branch (defaults to default branch).

### Real-Time Updates

Badges update:
- Every workflow run
- Within seconds of completion
- Automatically (no manual refresh needed)
- Cache busted by GitHub

### Common Badge Issues

**Gray badges persist**
- Workflows haven't run yet
- Wait for first push to main
- Check workflow files are in correct directory

**Wrong workflow shown**
- URL typo in badge link
- Verify exact workflow filename
- Check branch name in URL

**Badge shows old status**
- GitHub cache (wait 5 minutes)
- Refresh page with Ctrl+F5
- Verify workflow actually ran

### Markdown Rendering

Badges render as:
- Images on GitHub.com
- Clickable links
- Text in markdown editors
- Alt text: workflow name

The markdown:
```markdown
[![Name](image-url)](link-url)
```

- `Name` = alt text (shows if image fails)
- `image-url` = svg badge image
- `link-url` = destination when clicked

### Integration with GitHub

Badges work with:
- Public and private repos
- GitHub Pages sites
- Other markdown viewers
- GitHub Enterprise

### Notes

- Badges are cosmetic - don't affect CI/CD
- Useful for contributors (shows repo health)
- Recommended best practice
- Add in same PR as final workflows
- Update if workflow names change

### Troubleshooting

**Badges not showing on GitHub**
- Check URL formatting
- Verify workflows exist
- Refresh browser cache
- Wait for workflows to run

**One badge always gray**
- Check corresponding workflow file exists
- Verify file path exactly matches URL
- Run workflow manually if needed

**Badges link to wrong place**
- Check URL path is correct
- Verify YOUR_USERNAME and YOUR_REPO replaced
- Ensure workflow filename matches