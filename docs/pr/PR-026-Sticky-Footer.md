# PR #026: Add Sticky Footer with Links and Copyright

**Title:** `feat: add sticky footer with github link, coffee link, and copyright information`

**Description:**
Add footer visible when user scrolls to bottom of any page. Responsive design. Includes GitHub link, optional buy me coffee link, copyright, and license attribution. Swedish language.

---

## CONTEXT

Footer appears when user scrolls to bottom (not sticky to viewport). Provides:
- Quick access to GitHub repository
- Optional donation/coffee link
- Copyright and license information
- Author attribution

Mobile-first responsive design. Only appears when user actively scrolls (saves vertical space).

---

## CHANGES REQUIRED

### 1. Footer Component

Create footer component with sections:

**Left/Top (on mobile) Section:**
```
© 2024 [Your Name]
Licensierad under MIT
```

**Right/Bottom (on mobile) Section:**
```
[GitHub Link Icon + Text] [Coffee Link Icon + Text]
```

Or similar layout - adjust based on your design system.

**Actual structure (example):**
```
Footer
├── Left side:
│   └── "© 2024 [Author Name] | Licensierad under MIT"
└── Right side:
    ├── GitHub link (icon + text)
    └── Buy me coffee link (icon + text, optional)
```

### 2. Placement and Visibility

**Not sticky to viewport** (important for mobile UX on SPA):
- Footer is at bottom of page content
- When user scrolls down, footer comes into view
- When scrolled back up, footer scrolls out of view
- Does NOT stay fixed at bottom always

**Why:** Fixed footers consume vertical space on mobile and interfere with PWA/mobile app UX.

### 3. Responsive Design

**Mobile (< 768px):**
- Full width
- Centered text or stacked layout
- All items visible without wrapping
- Touch targets 44px minimum
- Padding: adequate spacing all around

**Tablet/Desktop (≥ 768px):**
- Full width
- Flex layout: left content on left, right links on right
- Icons can be included (optional)
- Hover effects on links

### 4. Link Configuration

Store links in config or constants:
```
github: "https://github.com/your-username/your-repo"
coffee: "https://www.buymeacoffee.com/your-username" (optional)
author: "Your Name"
license: "MIT"
year: 2024 (or current year)
```

### 5. Styling and Accessibility

**Styling:**
- Border-top to separate from content
- Subtle background color (slightly different from page background)
- Text color readable and accessible
- Links have clear hover/focus states

**Accessibility:**
- Links have underline or clear visual indication
- Hover/focus states visible
- Color contrast meets WCAG AA
- Touch targets minimum 44px
- Semantic HTML: `<footer>` element, proper link structure

### 6. Content Details

**GitHub link:**
- Text: "GitHub" (or "Se källkod" / "View source" in Swedish)
- Icon optional but recommended (GitHub icon from icon library)
- Link to your repository

**Coffee link:**
- Text: "Köp mig en kaffe" ("Buy me a coffee")
- Icon optional (coffee cup icon)
- Link to buymeacoffee.com or similar
- OPTIONAL - include only if you want it

**Copyright:**
- Format: "© 2024 [Author Name]"
- Year can be hardcoded or calculated: `new Date().getFullYear()`

**License:**
- Text: "Licensierad under MIT" (or actual license)
- Can be link to LICENSE file in repo (optional)

---

## FUNCTIONAL REQUIREMENTS

✅ Footer appears at bottom of page content (not fixed/sticky to viewport)
✅ Footer visible on all pages (list, tree, about, etc.)
✅ All links clickable and navigate correctly
✅ Mobile: Footer readable and touch-friendly
✅ Desktop: Footer properly laid out
✅ No fixed positioning (scrolls naturally with page)
✅ Links have hover/focus states
✅ Copyright year displays correctly

---

## TESTING SCENARIOS

1. Scroll to bottom of any page → footer visible
2. Scroll back up → footer scrolls out of view
3. Click GitHub link → opens GitHub repo
4. Click coffee link → opens donation link (if included)
5. Mobile: All footer content visible, no horizontal scroll
6. Mobile: Links have adequate touch targets
7. Desktop: Footer layout with left/right sections
8. Desktop: Link hover states visible
9. Keyboard navigation: Tab through footer links → work correctly
10. Different pages: Footer visible on list, tree, about pages

---

## UX NOTES

**Best practices for footers on mobile:**
- Not sticky/fixed (interferes with PWA experience)
- Natural scroll position at end of page
- Clear visual separation from content
- All info essential (no "nice to haves")
- Links work well on touch screens

**Design considerations:**
- Keep footer height reasonable (doesn't need to be tall)
- Avoid over-designing - simple is better
- Use icon + text for links (icons help scannability)
- Consider: Dark footer on light page, or complementary color?

**Link prioritization:**
- GitHub most important (source code)
- Coffee link optional but nice (shows appreciation)
- Copyright/license information required

---

## NOTES

- Footer is bottom-of-page, not sticky viewport footer
- Appears on all main pages (list, tree, about)
- Good place to add more links later if needed
- Simple implementation, mostly styling/layout work