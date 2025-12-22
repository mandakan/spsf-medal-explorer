# PR #025: Add About Page with Links and Author Information

**Title:** `feat: add about page with author info, links, and license information`

**Description:**
Create About page accessible as main navigation tab. Include author information, links to GitHub, association info, buy me coffee link, and license details. Swedish language.

---

## CONTEXT

About page should be prominent navigation destination. Include:
- App description (what it does)
- Author/creator information (name, optionally role/affiliation)
- Links: GitHub repo, Swedish shooting association website
- Optional: Buy me coffee / donation link
- License information (MIT, GPL, or whatever applies)
- Rulebook version information (updated yearly - for 2024 it's version 20, 2026 is version 21)

---

## CHANGES REQUIRED

### 1. Navigation Structure

Add About to main navigation (already exists somewhere in app):

**Navigation items should be:**
- List view (or Cards view)
- Tree view (or Categories view)
- About ← **NEW**

Or however your navigation is currently structured. Make About equally prominent.

### 2. About Page Content

Create `/about` route with following sections:

**Section 1: Application Title and Description**
```
Skyttemärken / Medal Tracker

[Brief description in Swedish]
"Spåra dina skyttemedaljer och märken för precision- och fältskjutning
enligt Svenska Skyttesportförbundets regler."
```

**Section 2: Author Information**
```
Skapare / Creator
[Your name]
[Optional: credentials/role, e.g. "SPSF Member #12345"]
```

**Section 3: Related Links**
```
Användbara länkar / Useful Links
- Svenska Skyttesportförbundet (SPSF) [clickable link to SPSF website]
- GitHub-projekt [clickable link to your repo]
```

**Section 4: Support (Optional)**
```
Stöd projektet / Support the Project
[Link to "Buy me a coffee" or similar]
"Gilla dig i arbetet? Häll kaffe åt utvecklaren"
```

**Section 5: Technical Information**
```
Om versionen / Version Information
Skytteboken upplaga / Rulebook version: 20 (gäller från 2024)
[Could mention that 2026 will use version 21, etc.]
```

**Section 6: License**
```
Licens / License
Denna applikation är licensierad under [MIT/GPL/whatever].
[Brief license description and link to LICENSE file]
```

### 3. Page Layout and Styling

**Design approach:**
- Simple, clean layout
- Sections stacked vertically on mobile
- 2-column layout optional on larger screens
- Links are clearly clickable (color, underline, hover effect)
- Adequate padding/spacing between sections

**Accessibility:**
- Headings use proper hierarchy (h1, h2, h3)
- Links have hover/focus states
- Color contrast meets WCAG AA minimum
- Mobile-friendly: tap targets 44px minimum

### 4. Link Configuration

Store link destinations somewhere manageable:
- SPSF website URL
- GitHub repository URL
- Buy me coffee link (optional)
- Could be in a config file or constants

This way URLs can be updated easily without changing code.

### 5. Navigation Wiring

Add About tab/button to main navigation:
- Clicking it navigates to `/about` route
- About page displays
- Rest of app structure (header, possibly footer) remains visible

---

## FUNCTIONAL REQUIREMENTS

✅ About page accessible from main navigation
✅ All required sections display with correct Swedish text
✅ Links clickable and navigate correctly
✅ Layout responsive on mobile and desktop
✅ Author information visible
✅ License information clear
✅ Rulebook version information displayed
✅ Optional: coffee link works if included

---

## TESTING SCENARIOS

1. Click About in navigation → page loads
2. All sections visible (title, author, links, license, version)
3. Click GitHub link → opens correct GitHub repo
4. Click SPSF link → opens SPSF website
5. Click coffee link → opens donation/coffee link (if included)
6. Mobile: Page readable and scrollable
7. Desktop: Layout appropriate
8. Back button or navigation → can leave about page
9. Links have hover/focus states

---

## CONTENT NOTES

- Keep text concise but informative
- All text should be Swedish (unless external links to English sites)
- Consider: Do you want to include versioning of the app itself? (Not required)
- Author info can be minimal (just name) or detailed (with credentials)

---

## NOTES

- This is a mostly static content page
- Good place to add more info later (FAQ, contributing guide, etc.)
- Footer (PR #006) will have quick links but About page is more detailed