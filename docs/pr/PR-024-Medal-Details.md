# PR #024: Add Medal Details Modal for List View

**Title:** `feat: show medal details in modal from list view (mobile-first UX)`

**Description:**
Add modal/dialog for viewing medal details when clicking medals in the list view. Same component used for tree view, ensuring consistent behavior. Mobile-first design with accessible dismissal.

---

## CONTEXT

Currently medal details only show in tree view. Users in list view should be able to click/tap a medal and see details without navigating to tree. Modal provides non-disruptive way to show details while keeping list context visible (on larger screens).

---

## CHANGES REQUIRED

### 1. List View Interaction

Each medal in list should be interactive:

**Click/Tap behavior:**
- Tap medal item → opens modal with that medal's details
- Modal overlays list (list still visible underneath on desktop)
- Scrollable list visible on mobile alongside modal (or fullscreen modal)

**Visual affordance:**
- Medal items look clickable: pointer cursor, slight hover effect on desktop
- Small icon or indicator showing details can be opened (e.g., "ⓘ" or chevron)
- Touch targets 44px minimum for mobile accessibility

### 2. Modal Component

**Requirements:**
- Reuse existing medal details component (same one used in tree view)
- Display in modal/dialog container
- Title: Medal name
- Content: All medal details (requirements, references, etc.)
- Dismiss options:
  - Close button (X) at top right
  - Click outside modal (backdrop click) to close
  - Escape key to close

**Mobile considerations:**
- Fullscreen or near-fullscreen on mobile (leave small close button visible)
- Scrollable content area if details are long
- Bottom margin/padding so content doesn't hide behind system UI

**Desktop considerations:**
- Modal width: 600-800px or sensible max-width
- Centered on screen
- Backdrop slightly darkens (opacity: 0.5 or similar)

### 3. State Management

Track which medal's modal is open (if any):
- Open state: `{ isOpen: true, medalId: "guldmarke" }`
- Closed state: `{ isOpen: false }`
- Closing modal resets state

No state persistence needed (closing browser closes modal).

### 4. Navigation (Optional Enhancement)

If user opens multiple medals in succession:
- Previous modal closes, new one opens
- OR: Allow "next/previous" buttons to cycle through medals (nice-to-have, not required)

### 5. Accessibility

- Modal has role="dialog" and proper ARIA attributes
- Focus trapped within modal (doesn't cycle to list while modal open)
- Escape key closes modal
- Close button is keyboard accessible (Tab + Enter)
- Screen readers announce medal name and details

---

## FUNCTIONAL REQUIREMENTS

✅ Clicking medal in list opens modal
✅ Modal displays all medal details
✅ Modal has close button
✅ Clicking backdrop dismisses modal
✅ Escape key dismisses modal
✅ Modal displays correctly on mobile (fullscreen or large)
✅ Modal displays correctly on desktop (centered, sized appropriately)
✅ Scrolling works inside modal on mobile
✅ Reuses existing medal details component
✅ No data loss when modal opens/closes

---

## TESTING SCENARIOS

1. List view → click medal → modal opens showing that medal
2. Modal open → click close button → modal closes
3. Modal open → click outside modal (backdrop) → modal closes
4. Modal open → press Escape → modal closes
5. Modal open → scroll list behind modal → list scrolls (on desktop)
6. Mobile: Modal fullscreen or large enough to read
7. Mobile: Can close modal, list still visible underneath
8. Desktop: Modal centered and appropriately sized
9. Multiple medals: Click different medals → previous modal closes, new opens
10. Medal with markdown requirements → renders correctly in modal

---

## UX NOTES

**Best practices for mobile-first:**
- Prefer fullscreen modal on mobile (easier to interact with)
- Desktop: Floating modal, 60-70% viewport width, centered
- Ensure close button is always visible (top right, not scrolled away)
- Don't require outside click to close on mobile (might be accidental)
- Escape key available on all platforms (keyboard users)

**List view considerations:**
- List should still be scrollable while modal open (on desktop)
- Scroll position preserved if modal closes
- Opening/closing modal shouldn't reset list scroll position

**Component reuse:**
- Existing medal details component should work in both tree and modal
- If adjustments needed (sizing, padding), make them responsive

---

## NOTES

- This is UI-focused, minimal data structure changes
- Improves discoverability of medal details in list view
- Next PR will improve about page and footer