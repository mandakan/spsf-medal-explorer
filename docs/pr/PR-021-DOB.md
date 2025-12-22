# PR #021: Update Profile Schema - Replace Weapon Group with Date of Birth

**Title:** `refactor: update profile schema to use date of birth instead of weapon group`

**Description:**
Replace the `weaponGroup` field in the profile schema with `dateOfBirth` to track shooter age. This is foundational for age-based achievement thresholds. Breaking change: weaponGroup removed completely (will be tracked per achievement instead).

---

## CONTEXT

Weapon groups are better tracked at the achievement level (each shot has a weapon), not at the profile level. Age-based requirements vary significantly (especially for precision series), so date of birth must be stored on the profile to calculate applicable thresholds.

---

## CHANGES REQUIRED

### 1. Profile Data Structure

**Remove:**
- `weaponGroup` field from profile object

**Add:**
- `dateOfBirth` field (ISO 8601 format: YYYY-MM-DD)

Example profile after change:
```
{
  "id": "profile-001",
  "name": "Anders Andersson",
  "dateOfBirth": "1965-03-15"  // NEW
  // weaponGroup removed
}
```

### 2. Database/Storage Updates

Update however profiles are currently persisted:
- Migration: Convert existing profiles, discard weaponGroup
- Initialize new profiles with dateOfBirth
- Add validation: dateOfBirth must be valid ISO date and reasonable age (e.g., 8-100 years old)

### 3. Profile Management UI

**Update profile creation/editing form:**
- Replace "Weapon Group" field with "Date of Birth" input
- Input type: date picker or text input accepting YYYY-MM-DD
- Add helper text: "Used to determine age-based requirements (e.g., precision series thresholds)"

**Update profile display:**
- Show calculated age instead of weapon group: "Anders Andersson, age 59"
- Age calculation: `new Date().getFullYear() - new Date(dateOfBirth).getFullYear()`
- (Refined calculation considers month/day for precise age if needed)

### 4. Any References to weaponGroup

Search codebase for:
- Variables, constants, functions, imports referencing `weaponGroup`
- Comments or documentation mentioning it
- Remove or update completely

### 5. Component/Feature Dependent Checks

Check if any of these depend on weaponGroup existing:
- Achievement display/filtering
- Medal threshold logic
- Reports or statistics

All should work without weaponGroup since:
- Weapon group is now on each achievement
- Age is calculated from profile's dateOfBirth
- No backward compatibility - clean break

---

## FUNCTIONAL REQUIREMENTS

✅ Can create new profiles with dateOfBirth
✅ Can edit existing profile's dateOfBirth
✅ Age calculated and displayed correctly (as of today)
✅ Validation prevents invalid dates
✅ No reference to weaponGroup anywhere in codebase
✅ App functions normally without weaponGroup

---

## TESTING

- Create profile with DOB → verify age displays
- Edit profile DOB → verify age updates
- Search/filter profiles → should still work
- Load existing achievements → should still display (weapons are on them)
- No console errors about missing weaponGroup

---

## NOTES

- This is a clean breaking change
- No migration complexity (old weaponGroup data is discarded)
- Achievements already track weapon separately
- Next PR will use dateOfBirth for age-based thresholds