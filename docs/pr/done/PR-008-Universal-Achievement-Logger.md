# PR-008: Universal Achievement Logger

## Overview

**Status**: Phase 3 - CRITICAL (80% of app currently broken)  
**Priority**: HIGHEST  
**Effort**: 4-5 days  
**Impact**: All 250+ medals become functional  

Currently only Gold Series achievements can be logged. This PR adds complete support for ALL achievement types across the entire medal database.

## Problem Statement

```
Current State (POC - BROKEN):
├─ Gold Series: ✅ Works
├─ Silver/Bronze: ❌ Can't log
├─ Qualifications: ❌ Can't log
├─ Team Events: ❌ Can't log
├─ Historical: ❌ Can't log
├─ Special Events: ❌ Can't log
└─ Custom Goals: ❌ Can't log

Result: Users can only track ~20% of achievements
```

## Solution: Universal Achievement Logger

```
New System:
├─ Dynamic form generator (medal-type driven)
├─ Type-specific validation
├─ Batch entry support
├─ Real-time calculator integration
├─ Mobile-first 44px touch targets
└─ WCAG 2.1 AA compliant
```

## DESCRIPTION

### What This PR Does

Creates a universal achievement logging system that works with ANY medal type. Instead of hardcoding forms for each medal type, the system reads the medal's `requirements` field and generates appropriate form fields dynamically.

### Key Components

1. **UniversalAchievementLogger** (Main Component)
   - Detects medal type from `medal.type`
   - Renders appropriate form variant
   - Handles submission
   - Real-time calculator integration

2. **useAchievementForm** (Custom Hook)
   - Form state management
   - Type-specific validation
   - Error handling
   - Mobile gesture support

3. **Form Variants** (Type-Specific)
   - `CompetitionForm` (Gold/Silver/Bronze)
   - `QualificationForm` (Exact scores)
   - `TeamEventForm` (Multiple participants)
   - `EventForm` (Time-based)
   - `CustomForm` (Free text)

4. **AchievementTypes** (TypeScript)
   - Type definitions
   - Validation schemas
   - Error messages

## Files to Create

### React Components
```
src/components/UniversalAchievementLogger.jsx
├─ Main component that detects medal type
├─ Routes to appropriate form variant
└─ Handles submission & calculator update

src/components/form/CompetitionForm.jsx
├─ For Gold/Silver/Bronze series
├─ Date + Score fields
├─ Mobile optimized

src/components/form/QualificationForm.jsx
├─ For qualification badges
├─ Weapon field + exact score
├─ Mobile optimized

src/components/form/TeamEventForm.jsx
├─ For team competitions
├─ Team name + position fields
├─ Batch entry (multiple participants)

src/components/form/EventForm.jsx
├─ For time-based events
├─ Event name + date fields

src/components/form/CustomForm.jsx
├─ For custom achievements
├─ Free text + date
```

### Hooks & Utilities
```
src/hooks/useAchievementForm.js
├─ Form state management
├─ Type-specific validation
├─ Error handling
└─ Mobile gesture support

src/types/AchievementTypes.ts
├─ TypeScript interfaces
├─ Type definitions
├─ Validation schemas

src/validators/universalValidator.js
├─ Validation logic per type
├─ Error messages
└─ Type coercion

src/utils/achievementMapper.js
├─ Map form values to achievement
├─ Type-specific transformations
```

### Tests
```
src/components/__tests__/UniversalAchievementLogger.test.js
├─ Component rendering
├─ Type detection
├─ Form variant selection

src/components/form/__tests__/CompetitionForm.test.js
├─ Form submission
├─ Validation
├─ Mobile touch targets

src/components/form/__tests__/QualificationForm.test.js
src/components/form/__tests__/TeamEventForm.test.js
src/components/form/__tests__/EventForm.test.js
src/components/form/__tests__/CustomForm.test.js

src/hooks/__tests__/useAchievementForm.test.js
├─ State management
├─ Error handling
└─ Mobile gestures

src/validators/__tests__/universalValidator.test.js
├─ All validation rules
├─ Error messages
└─ Type coercion
```

## Data Models

### Achievement Types

```typescript
type AchievementType = 
  | 'competition'      // Gold/Silver/Bronze series
  | 'qualification'    // Rifle 300m, Pistol 25m
  | 'team_event'       // Team rifle, team pistol
  | 'event'            // Championships, cups
  | 'custom'           // Personal goals

interface Achievement {
  id: string;                    // UUID
  medalId: string;               // Link to medal
  type: AchievementType;
  date: string;                  // ISO date
  
  // Type-specific fields:
  score?: number;                // Competition/Qualification
  position?: number;             // Team events (1-10)
  weapon?: string;               // Weapon qualifications
  teamName?: string;             // Team events
  eventName?: string;            // Special events
  notes?: string;                // Any type
  verified?: boolean;            // Official results
  
  // Metadata:
  createdAt: string;
  updatedAt: string;
}
```

### Form Variant Selection Logic

```javascript
// Pseudo-code for form selection
const getMedalType = (medal) => {
  if (medal.medals_type === 'serie') return 'competition'
  if (medal.medals_type === 'kvalificering') return 'qualification'
  if (medal.team_medal) return 'team_event'
  if (medal.event_only) return 'event'
  return 'custom'
}
```

## CODE STRUCTURE

### UniversalAchievementLogger.jsx

```jsx
import { useState, useMemo } from 'react'
import { useCalculator } from '../hooks/useCalculator'
import CompetitionForm from './form/CompetitionForm'
import QualificationForm from './form/QualificationForm'
import TeamEventForm from './form/TeamEventForm'
import EventForm from './form/EventForm'
import CustomForm from './form/CustomForm'

const formComponents = {
  competition: CompetitionForm,
  qualification: QualificationForm,
  team_event: TeamEventForm,
  event: EventForm,
  custom: CustomForm,
}

export default function UniversalAchievementLogger({ medal, onSuccess }) {
  const { addAchievement } = useCalculator()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Detect medal type dynamically
  const medalType = useMemo(() => {
    if (medal.medals_type === 'serie') return 'competition'
    if (medal.medals_type === 'kvalificering') return 'qualification'
    if (medal.team_medal) return 'team_event'
    if (medal.event_only) return 'event'
    return 'custom'
  }, [medal])

  const FormComponent = formComponents[medalType]

  const handleSubmit = async (formData) => {
    try {
      setLoading(true)
      setError(null)

      // Create achievement with type
      const achievement = {
        id: crypto.randomUUID(),
        medalId: medal.medalId,
        type: medalType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...formData,
      }

      // Validate per type
      await validateAchievement(achievement)

      // Add to storage and calculator
      await addAchievement(achievement)

      // Show success feedback
      onSuccess?.(achievement)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="
        p-4 bg-color-bg-secondary dark:bg-color-bg-secondary
        rounded-lg border-2 border-color-border
        max-w-2xl
      "
    >
      <h2 className="
        text-lg font-semibold text-color-text-primary mb-4
      ">
        Log Achievement: {medal.displayName}
      </h2>

      {error && (
        <div
          className="
            mb-4 p-3 rounded-lg
            bg-color-error-bg text-color-error
            border-2 border-color-error
            flex items-center gap-2
          "
          role="alert"
        >
          <span>✕</span>
          <span>{error}</span>
        </div>
      )}

      <FormComponent
        medal={medal}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  )
}
```

### CompetitionForm.jsx

```jsx
import { useState } from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'

export default function CompetitionForm({ medal, onSubmit, loading }) {
  const { values, errors, handleChange, handleSubmit } =
    useAchievementForm({ 
      initialValues: { 
        date: new Date().toISOString().split('T')[0],
        score: '',
        notes: '',
      },
      validate: (vals) => validateCompetition(vals, medal),
      onSubmit,
    })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date Input */}
      <div>
        <label
          htmlFor="achievement-date"
          className="
            block text-sm font-medium
            text-color-text-primary mb-2
          "
        >
          Date of Achievement
        </label>
        <input
          id="achievement-date"
          type="date"
          name="date"
          value={values.date}
          onChange={handleChange}
          className="
            w-full px-3 py-2 rounded-lg text-base
            bg-color-bg-primary dark:bg-color-bg-primary
            border-2 border-color-border
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-offset-2 focus-visible:ring-color-primary
          "
          required
        />
        {errors.date && (
          <p className="mt-1 text-sm text-color-error">
            {errors.date}
          </p>
        )}
      </div>

      {/* Score Input */}
      <div>
        <label
          htmlFor="achievement-score"
          className="
            block text-sm font-medium
            text-color-text-primary mb-2
          "
        >
          Score
        </label>
        <input
          id="achievement-score"
          type="number"
          name="score"
          value={values.score}
          onChange={handleChange}
          className="
            w-full px-3 py-2 rounded-lg text-base
            bg-color-bg-primary dark:bg-color-bg-primary
            border-2 border-color-border
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-offset-2 focus-visible:ring-color-primary
          "
          required
        />
        {errors.score && (
          <p className="mt-1 text-sm text-color-error">
            {errors.score}
          </p>
        )}
      </div>

      {/* Notes Input */}
      <div>
        <label
          htmlFor="achievement-notes"
          className="
            block text-sm font-medium
            text-color-text-primary mb-2
          "
        >
          Notes (optional)
        </label>
        <textarea
          id="achievement-notes"
          name="notes"
          value={values.notes}
          onChange={handleChange}
          className="
            w-full px-3 py-2 rounded-lg text-base
            bg-color-bg-primary dark:bg-color-bg-primary
            border-2 border-color-border
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-offset-2 focus-visible:ring-color-primary
            resize-none
          "
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="
          w-full py-3 px-4 rounded-lg font-medium
          bg-color-primary text-white
          hover:bg-color-primary-hover
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-color-primary
        "
      >
        {loading ? 'Saving...' : 'Log Achievement'}
      </button>
    </form>
  )
}
```

## ACCEPTANCE CRITERIA

### Functional Requirements
- [ ] `UniversalAchievementLogger` component works for all medal types
- [ ] Form variants render correctly per medal type
- [ ] Achievements save to storage without errors
- [ ] Real-time calculator updates when achievement is logged
- [ ] All validation rules enforced per type
- [ ] Error messages clear and helpful
- [ ] Success feedback provided to user

### Mobile Requirements
- [ ] All input fields: 44px minimum height
- [ ] Labels visible on mobile
- [ ] No horizontal scrolling
- [ ] Touch keyboard doesn't obscure inputs
- [ ] Bottom sheet modal support
- [ ] Swipe gestures (dismiss form)

### Accessibility Requirements
- [ ] WCAG 2.1 AA contrast (all text)
- [ ] Dark mode support
- [ ] Focus-visible rings on all inputs
- [ ] aria-label on all form fields
- [ ] aria-invalid on error fields
- [ ] aria-describedby for error messages
- [ ] Semantic form elements
- [ ] Screen reader tested

### Testing Requirements
- [ ] 100+ test cases (all medal types)
- [ ] 95%+ code coverage
- [ ] jest-axe: 0 violations
- [ ] Manual keyboard navigation test
- [ ] Manual dark mode test
- [ ] Manual mobile test (iOS + Android)

## DESIGN REFERENCES

**Related Documents:**
- 02-Data-Model.md (achievement structure)
- 03-Interaction-Design.md (form UX)
- 04-Visual-Design.md (styling)
- 07-Medal-Database-Reference.md (all medal types)
- WCAG-ACCESSIBLE-DESIGN-SYSTEM.md (accessibility)

**Key Design Principles:**
```
1. Medal-Driven Forms
   └─ Form matches medal requirements exactly

2. Minimal Input
   └─ Only ask for required information per type

3. Real-Time Feedback
   └─ Instant calculator updates after submission

4. Mobile First
   └─ All inputs 44px minimum, no scrolling

5. Accessible Always
   └─ WCAG 2.1 AA on all components
```

## DONE WHEN

- [ ] All 7 components created and tested
- [ ] All medal types functional (competition, qualification, team, event, custom)
- [ ] 100+ test cases passing
- [ ] 0 jest-axe violations
- [ ] Mobile: 44px targets verified
- [ ] Dark mode: All fields visible
- [ ] Keyboard: Full tab navigation works
- [ ] Real-time calculator integration tested
- [ ] Manual testing complete on iOS & Android
- [ ] Code review passed
- [ ] All PRs merged

## Performance Targets

```
Form rendering:     <100ms
Validation:         <50ms
Submission:         <200ms (with calculator update)
Mobile scroll:      60fps
Touch response:     <100ms
```

## Success Metrics

```
Before PR-008:
├─ 80% of achievements: can't log
├─ Users frustrated
└─ App unusable for most medals

After PR-008:
├─ 100% of achievements: can log
├─ All 250+ medals functional
└─ Users can track complete progress ✨
```

---

**Priority**: HIGHEST - 80% of app broken without this  
**Start Date**: Week 6 Monday  
**Target Completion**: Week 6 Friday (4-5 days)  
**Next PR**: PR-009 (Import/Export)
