# PR #023: Add Medal Cross-References and Markdown Requirements

**Title:** `feat: add medal cross-references and markdown-formatted requirement descriptions`

**Description:**
Enable achievements to reference other achievements in their requirements. Store original requirement text in markdown with collapsible display in UI. No circular dependency validation needed yet (assume data is clean).

---

## CONTEXT

Some medals reference others in requirements: "Fulfill the requirements for Gold Mark during the year" etc. Store:
1. Markdown-formatted original requirement text (collapsible in UI)
2. Structured requirements that can reference other medals by ID
3. Display referenced medals as clickable links (mobile-friendly)

---

## CHANGES REQUIRED

### 1. Medal Data Structure

Add two fields to medal in medals.json:

```
{
  "id": "guldmarke",
  "name": "Guldmärke",
  
  // NEW: Original text from rulebook
  "requirements_original": "Minst 43 poäng i 3 tillämpningsserier...",
  
  // EXISTING: Structured requirements
  "requirements": {
    "type": "precision_series",
    "ageCategories": [ ... ]
  },
  
  // NEW: List of medals this references
  "references": [
    {
      "medalId": "some-other-medal-id",
      "description": "Alternatively: Fulfill requirements for field shooting gold medal"
    }
  ]
}
```

**Note:** `requirements_original` is markdown-formatted. Can include **bold**, *italic*, etc. for rich text. Keep it to basic formatting.

### 2. UI Display - Collapsible Requirements Section

In medal details view, add a collapsible section:

**Default (collapsed):**
```
▶ View original requirement text
```

**Expanded:**
```
▼ View original requirement text
  [Renders requirements_original as markdown]
  
  Example text might be:
  "Minst 43 poäng i 3 tillämpningsserier, minst 6 träff,
   eller erövrat minst en standardmedalj i brons i fältskjutning."
```

Use standard markdown renderer (most React projects have one). No complex styling needed.

### 3. References Display

If medal has "references" array, show clickable/tappable list:

```
Also fulfills requirements for:
- [other medal name]
- [another medal name]
```

Each reference is clickable:
- **Desktop:** Standard link/pointer
- **Mobile:** Tap-friendly, enough padding

Clicking navigates to that medal's details (or opens modal if in list view).

### 4. No Circular Dependency Checks

For now:
- Assume medals.json has no circular references
- If reference points to non-existent medal: silently skip displaying it
- No validation warnings needed

(Future PR can add validation if needed)

---

## FUNCTIONAL REQUIREMENTS

✅ Medal details shows collapsible "original requirements" section
✅ Collapsible section renders markdown text
✅ References display as clickable links
✅ Clicking reference navigates to that medal
✅ Non-existent references don't break display
✅ Mobile: Links have adequate tap target size
✅ No circular dependency errors (assume data is clean)

---

## TESTING SCENARIOS

1. Open medal details → collapsible section collapsed by default
2. Click/tap collapsible → expands and shows markdown text
3. Medal has references → displays clickable link list
4. Click reference link → navigates to referenced medal details
5. Medal with broken reference ID → reference silently doesn't display
6. Medal with markdown formatting (**bold**, *italic*) → renders correctly
7. Mobile: Tap reference link → works as expected

---

## UX NOTES

- Keep markdown support simple (no tables, nested lists, etc.)
- Collapsible section saves space in details view
- Reference links should look clearly clickable (underline, color, etc.)
- On mobile, ensure touch targets are 44px minimum
- Consider: If medal details in a modal, does clicking reference close modal and open new one? (Design choice)

---

## NOTES

- Markdown can be as simple as supporting **bold**, *italic*, and line breaks
- References are informational, not functionally enforced yet
- Next PRs will add more structured medal validation and requirement logic