# CLAUDE.md - Development Guidelines for SPSF Medal Explorer

This document provides conventions, patterns, and quality checks that should be followed when working on this codebase.

## Pre-Commit Quality Checks

**ALWAYS run these commands before each commit:**

```bash
npm test          # Run Jest unit tests
npm run lint      # Run ESLint
npm run build     # Verify production build works
```

If any of these fail, fix the issues before committing. The pre-commit hooks (husky + lint-staged) will enforce some of these checks automatically.

## Code Conventions

### Language and Localization

- **All user-facing text must be in Swedish**
- Use descriptive Swedish terms consistently:
  - "Säkerhetskopia" (backup) not "export"
  - "Återställ" (restore) not "import"
  - "Märke" (medal), "Aktivitet" (activity/achievement)

### File Organization

```
src/
├── components/      # React UI components
├── contexts/        # React contexts (ProfileContext, etc.)
├── hooks/           # Custom React hooks (useProfile, etc.)
├── logic/           # Business logic layer
├── data/            # Data access layer
├── utils/           # Utility functions and helpers
└── pages/           # Page components
```

### Naming Conventions

- **Components**: PascalCase with descriptive names (e.g., `BackupButton.jsx`, `RestorePreviewDialog.jsx`)
- **Utilities**: camelCase with descriptive names (e.g., `backupValidator.js`, `importManager.js`)
- **Hooks**: Prefix with `use` (e.g., `useProfile`)
- **Test files**: Same name as source with `.test.js` suffix (e.g., `backupValidator.test.js`)

## Architecture Principles

### Layered Architecture

Follow the established three-layer pattern:

1. **UI Layer** (components, pages)
   - React components for presentation
   - Use hooks for state management
   - No direct data access

2. **Logic Layer** (logic/)
   - Business logic and validation
   - Coordinates between UI and data layers
   - Pure functions where possible

3. **Data Layer** (data/)
   - Storage operations (IndexedDB via Dexie)
   - Data transformation
   - No UI dependencies

### Component Patterns

#### Dialog Components

- Use React Portals (`createPortal`) for overlay dialogs to escape parent DOM constraints
- Use inline styles for critical positioning properties (position, top, left, transform, zIndex)
- Prefer Tailwind for non-critical styling
- Example pattern:
```jsx
const dialogContent = (
  <>
    <div className="fixed inset-0 bg-black/50 z-[2000]" onClick={onClose} />
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 2001
      }}
      className="bg-bg-primary rounded-xl p-6"
    >
      {/* Dialog content */}
    </div>
  </>
)
return createPortal(dialogContent, document.body)
```

#### Validation Pattern

- Separate validation logic into utility modules (`utils/backupValidator.js`)
- Provide both full validation and quick validation functions
- Return structured objects with status and messages:
```javascript
{
  status: 'valid' | 'warning' | 'error',
  warnings: string[],
  canImport: boolean
}
```

#### Real-Time Feedback

Use `useEffect` for real-time validation:
```jsx
const [validationStatus, setValidationStatus] = useState(null)

useEffect(() => {
  if (!inputText.trim()) {
    setValidationStatus(null)
    return
  }
  const result = quickValidate(inputText)
  setValidationStatus(result)
}, [inputText])
```

## WCAG 2.1 AA Compliance Requirements

### Essential Patterns

1. **Multi-Sensory Feedback**: Never rely on color alone
   - ✅ Icon + Color + Text
   - ❌ Color only

2. **ARIA Attributes**:
   - `role="dialog"` with `aria-modal="true"` for dialogs
   - `aria-labelledby` for dialog titles
   - `aria-describedby` for error messages and hints
   - `aria-live="polite"` for status updates
   - `aria-live="assertive"` for critical errors

3. **Semantic HTML**:
   - Use `<button>` for actions (not `<div>` with click handlers)
   - Use `<label>` with `htmlFor` for form inputs
   - Use `<fieldset>` and `<legend>` for radio button groups

4. **Keyboard Navigation**:
   - All interactive elements must be keyboard accessible
   - Visible focus indicators (use `focus-visible:` classes)
   - Escape key to close dialogs

5. **Touch Targets**:
   - Minimum 44x44 pixels (use `min-h-[44px]` for buttons)

### Example: Validation Status Badge

```jsx
{validationStatus && (
  <div
    role="status"
    aria-live="polite"
    className={`flex items-start gap-2 p-3 rounded-lg ${statusColors}`}
  >
    <Icon
      name={statusIcon}
      className={iconColors}
      aria-hidden="true"  // Icon is decorative
    />
    <span className={textColors}>
      {validationStatus.message}
    </span>
  </div>
)}
```

## Mobile-First Responsive Design

### Breakpoints

Use Tailwind's responsive prefixes (mobile-first approach):
- **Base**: Mobile (320px+)
- **sm**: 640px+
- **md**: 768px+
- **lg**: 1024px+

### Common Patterns

```jsx
// Stacked on mobile, row on desktop
<div className="flex flex-col sm:flex-row gap-3">

// Full width on mobile, constrained on desktop
<div className="w-full sm:w-auto">

// Responsive padding
<div className="p-4 sm:p-6">

// Responsive text size
<h1 className="text-xl sm:text-2xl">
```

### Testing Viewports

Test at these minimum widths:
- 320px (small mobile)
- 375px (iPhone SE)
- 768px (tablet)
- 1024px (desktop)

## JSDoc Documentation

Document all public functions and components with JSDoc:

```javascript
/**
 * Validate backup data and return status with warnings
 * @param {object} backup - Parsed backup object
 * @returns {{status: 'valid'|'warning'|'error', warnings: string[], canImport: boolean}}
 */
export function validateBackup(backup) {
  // ...
}
```

## Testing Requirements

### Unit Tests (Jest)

- Test utility functions and business logic
- Test validation functions thoroughly
- Mock external dependencies
- Run with `npm test`

### E2E Tests (Playwright)

- Test critical user flows
- Test backup/restore workflows
- Test accessibility with screen readers
- Run with `npm run test:e2e`

### Coverage

- Aim for >80% coverage on new code
- Check with `npm run test:coverage`

## Git Workflow

### Branch Naming

- Feature branches: `claude/implement-pr-NNN-XXXXX`
- Bug fixes: `fix/description`
- Always develop on the designated branch specified in the task

### Commit Messages

- Use clear, descriptive messages
- Prefix with type: `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- Examples:
  - `feat: implement backup validation with real-time feedback`
  - `fix: use inline styles for RestorePreviewDialog dimensions`
  - `refactor: simplify ExportPanel to JSON-only backups`

### Before Pushing

1. Run quality checks: `npm test && npm run lint && npm run build`
2. Verify changes work in browser
3. Test responsive design (mobile + desktop)
4. Check WCAG compliance
5. Push with: `git push -u origin <branch-name>`

## Common Pitfalls

### ❌ Don't

- Use color alone for status indication
- Create clickable `<div>` elements (use `<button>`)
- Forget to test keyboard navigation
- Use CSS classes for critical dialog positioning (use inline styles)
- Add features beyond what was requested (avoid over-engineering)
- Create new files when editing existing ones would work
- Use `catch (e)` if the error variable is unused (triggers ESLint error)

### ✅ Do

- Use Icon + Color + Text for status
- Use semantic HTML elements
- Test with keyboard only
- Use React Portals for overlay dialogs
- Keep solutions simple and focused
- Edit existing files when possible
- Use `catch` without variable if error is unused

## Backup/Restore Data Format

### Backup Structure

```json
{
  "kind": "profile-backup",
  "version": "1.0",
  "exportedAt": "2026-01-07T07:19:24.565Z",
  "profile": {
    "userId": "...",
    "displayName": "...",
    "createdDate": "...",
    "lastModified": "...",
    "dateOfBirth": "...",
    "sex": "...",
    "unlockedMedals": [],
    "prerequisites": [],
    "features": {
      "allowManualUnlock": false,
      "enforceCurrentYearForSustained": true
    },
    "notifications": true
  }
}
```

### File Naming

Use date-based naming for backups:
```javascript
const date = new Date().toISOString().split('T')[0]
const filename = `medal-backup-${date}.json`
```

## Icon Component

Use the existing Icon component for all icons:

```jsx
import Icon from './Icon'

<Icon
  name="CheckCircle"        // Icon name from lucide-react
  className="w-5 h-5"       // Size and color classes
  aria-hidden="true"        // Mark as decorative if text is present
/>
```

Available icon names: CheckCircle, XCircle, AlertTriangle, Download, Upload, etc.

## Iterative Development

This document is a living guide. When you discover new patterns, conventions, or best practices:

1. Discuss with the team
2. Update this document
3. Apply consistently across the codebase

## Questions?

If you're unsure about a pattern or convention:
1. Check CONTRIBUTING.md for additional details
2. Look at similar existing code for patterns
3. Ask for clarification before implementing
