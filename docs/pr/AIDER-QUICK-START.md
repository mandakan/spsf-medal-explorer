# Aider Quick Start: React + Tailwind + Vite

## What is Aider?

Aider is an AI code assistant that works with your existing codebase. It helps you write, debug, and refactor code while keeping everything integrated with git.

## Installation

```bash
# Install Aider (requires Python 3.10+)
pip install aider-ai

# Verify installation
aider --version
```

If you don't have Python installed:
- **macOS**: `brew install python`
- **Windows**: Download from python.org
- **Linux**: `apt install python3`

## First Time Setup

### 1. Initialize Vite + React Project
```bash
npm create vite@latest medal-app -- --template react
cd medal-app
npm install
npm install -D tailwindcss @tailwindcss/vite react-router-dom
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @babel/preset-react babel-jest jest-environment-jsdom
```

### 2. Start with Aider

```bash
# Navigate to project root
cd medal-app

# Initialize git (if not already done)
git init

# Start Aider
aider
```

You'll see the Aider prompt:
```
aider>
```

## Workflow for Each PR

### Pattern for PR-001 (and similar)

```bash
# 1. In Aider, paste the entire PR spec
aider> [Copy and paste entire PR-001-React-Tailwind-Vite.md content]

# 2. Ask Aider to create the project structure
aider> Create all the files and directory structure for PR-001 as specified

# 3. Review the generated code
# Aider will create all files and show them

# 4. Test locally
# Exit Aider (Ctrl+D) and test
npm run dev       # Check app loads
npm test          # Run tests
```

### Pattern for PR-002, PR-003, PR-004

Same as above—Aider will integrate new code with existing files automatically.

## Useful Aider Commands

```bash
# While in aider prompt:

# Ask Aider to read a file
/read src/App.jsx

# Ask Aider to see current git status
/git status

# Ask Aider to commit changes
/commit "PR-001: Medal database setup"

# Ask Aider about the codebase
/help

# Summarize what's been done
/files
```

## Step-by-Step: Using Aider for PR-001

### Step 1: Create initial project
```bash
npm create vite@latest medal-app -- --template react
cd medal-app
git init
git add .
git commit -m "Initial Vite setup"
```

### Step 2: Start Aider
```bash
aider
```

### Step 3: Ask Aider to implement PR-001
Inside Aider:
```
aider> I'm building a Medal Skill-Tree Explorer with React, Tailwind CSS v4, and Vite. 

Here's PR-001 spec:
[PASTE THE ENTIRE PR-001-React-Tailwind-Vite.md FILE]

Please implement all files and folder structure.
```

### Step 4: Let Aider work
- Aider will ask clarifying questions
- Answer them or press Enter to proceed
- It will create/modify all files
- Review the code it generates

### Step 5: Test
```bash
# Exit Aider
exit

# Install dependencies if needed
npm install

# Run dev server
npm run dev

# In another terminal, run tests
npm test

# If all pass, commit
git add .
git commit -m "PR-001: Medal database and project setup"
```

### Step 6: Move to PR-002
```bash
aider
aider> Now let's implement PR-002. Here's the spec:
[PASTE PR-002 spec]
```

## Pro Tips

### 1. Paste ENTIRE PR Spec
Aider works best with complete context. Always paste the whole PR file, not just parts.

### 2. Reference Design Docs
If Aider doesn't understand something:
```
aider> Here's the design doc for reference:
[PASTE relevant design doc section]
Now implement PR-003 using this.
```

### 3. Fix Incrementally
If something isn't quite right:
```
aider> The MedalCard component should also show prerequisites.
Can you add that?
```

### 4. Check Git Status
Before each new PR:
```bash
# Exit Aider
exit

# Verify all changes committed
git status  # should be clean

# Then continue
aider
```

### 5. Keep Terminal Logs
```bash
# Save conversation to file
aider > aider-log.txt

# Reference later if something breaks
cat aider-log.txt
```

## Debugging with Aider

If tests fail:
```
aider> The medal database tests are failing. 
Here's the error: [PASTE ERROR]

Can you debug and fix?
```

If styling looks wrong:
```
aider> The header doesn't look right on mobile. 
Can you check the Tailwind classes and fix?
```

If components aren't working:
```
aider> The ProfileSelector isn't saving profiles to localStorage.
Debug this and fix the issue.
```

## When to Use Aider vs Manual Coding

### Use Aider For:
- ✅ Creating new PR code from scratch
- ✅ Fixing failing tests
- ✅ Refactoring existing code
- ✅ Adding new features to existing components
- ✅ Debugging integration issues

### Use Manual Coding For:
- ⚠️ Quick edits you understand completely
- ⚠️ Learning something new (do it yourself first)
- ⚠️ Reviewing Aider's work (always do this)

## Common Aider Mistakes to Avoid

❌ **Don't**: Ask vague questions
```
aider> Make the app work better
```

✅ **Do**: Be specific
```
aider> The MedalCard component should show a gold/silver/bronze badge 
based on medal tier. Add this visual indicator using Tailwind classes.
```

❌ **Don't**: Expect Aider to remember previous PRs
```
aider> Now do PR-003  [This won't work without pasting the spec]
```

✅ **Do**: Always include the full spec
```
aider> Here's PR-003:
[FULL SPEC TEXT]
```

❌ **Don't**: Skip code review
- Always read what Aider generated
- Test before committing
- Ask for changes if needed

✅ **Do**: Review carefully
- `npm test` before each commit
- Check styling in browser
- Verify functionality works

## Workflow Checklist for Each PR

```
Before Aider:
☐ Previous PR fully committed
☐ git status shows clean working directory
☐ npm run dev and npm test both work

During Aider:
☐ Pasted entire PR spec
☐ Let Aider ask questions
☐ Reviewed all generated code
☐ Asked for fixes if needed

After Aider:
☐ npm install (if new dependencies)
☐ npm run dev (check it loads)
☐ npm test (check tests pass)
☐ git add . && git commit -m "PR-XXX: ..."
☐ git log --oneline (verify commit)

Ready for next PR:
☐ Exit Aider
☐ Check git status is clean
☐ Start Aider again
```

## Aider Resources

- **Official Docs**: https://aider.chat
- **Troubleshooting**: https://aider.chat/docs/troubleshooting.html
- **Tips & Tricks**: https://github.com/paul-gauthier/aider/discussions

## Example Aider Session

```
$ aider

> I'm implementing a React + Tailwind skill-tree app with 4 PRs.
> This is PR-001. Here's the complete spec:
> [PASTE PR-001-React-Tailwind-Vite.md]

Aider: I'll implement all the files for PR-001. Let me start by:
1. Creating the project structure
2. Setting up package.json with Vite + React + Tailwind
3. Creating all model classes
4. Loading the medal database
5. Setting up React contexts and hooks

Creating file: package.json
Creating file: vite.config.js
Creating file: tailwind.config.js
... [many more files]

> Great! Now let's add a console.log to verify medals loaded.

Aider: Good idea. I'll add that to the MedalContext useEffect.

Modified file: src/contexts/MedalContext.jsx

> Perfect. Can you also make sure tests run?

Aider: I'll add the Jest configuration.

Creating file: jest.config.js

> Now let's test it

/commit "PR-001: Medal database and setup"
You can now exit Aider and run npm test

> Thanks! See you for PR-002.

exit
```

Then in terminal:
```bash
npm install
npm run dev  # App loads ✓
npm test     # Tests pass ✓
git log --oneline  # Shows PR-001 commit ✓
```

## Support

- If Aider gets confused, exit and restart
- Always paste the full spec, not summary
- Test everything locally before next PR
- When in doubt, ask Aider directly in the chat

**Ready? Open a terminal and type `aider`!** 🚀
