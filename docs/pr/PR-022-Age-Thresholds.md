# PR #022: Add Age-Based Precision Series Requirements

**Title:** `feat: add age-based thresholds for precision series requirements`

**Description:**
Add age category support to precision series requirements. Different age groups have different point requirements and time limits. App automatically applies correct threshold based on shooter's age.

---

## CONTEXT

Swedish shooting federation sets different precision series requirements by age:
- Under 55: one threshold
- 55-64: reduced threshold
- 65+: further reduced threshold (especially generous for 70+)

Requirements also vary by whether shooter previously earned gold mark. The app must know shooter's age (from dateOfBirth) and determine applicable threshold.

---

## CHANGES REQUIRED

### 1. Medal/Achievement Data Structure

Add age-based thresholds to precision_series requirements in medals.json:

```
"precision_series": {
  "type": "precision_series",
  "ageCategories": [
    {
      "name": "under_55",
      "ageMin": 0,
      "ageMax": 54,
      "description": "Under 55 years",
      "pointRequirement": 43,
      "timeSeconds": 17,
      "hitsRequired": 6
    },
    {
      "name": "age_55_64",
      "ageMin": 55,
      "ageMax": 64,
      "description": "55 to 64 years",
      "pointRequirement": 42,
      "timeSeconds": 17,
      "hitsRequired": 6
    },
    {
      "name": "age_65_plus",
      "ageMin": 65,
      "ageMax": 999,
      "description": "65 years and older",
      "pointRequirement": 41,
      "timeSeconds": 17,
      "hitsRequired": 6
    }
  ]
}
```

Note: This is one example. Actual requirements may vary by weapon group and gold mark status - adjust structure as needed per your medals.json design.

### 2. Age Calculation Utility

Create or update age calculation function:
```
calculateAge(dateOfBirth: string): number
  Returns: shooter's current age (considers today's date)
  Throws: error if dateOfBirth invalid
```

### 3. Threshold Selection Logic

When displaying achievement or evaluating requirements:
1. Get shooter's dateOfBirth from profile
2. Calculate current age
3. Find matching ageCategory (ageMin <= age <= ageMax)
4. Use that category's pointRequirement, timeSeconds, etc.

If no matching category → error (shouldn't happen with proper data)

### 4. UI Display

When showing precision series requirements:
- Display: "You (age 62) need 42 points in 17 seconds, 6 hits"
- Or similar user-friendly format
- Show age-specific requirement, not generic one

### 5. Achievement Validation

When evaluating if achievement meets requirements:
- Compare against age-specific threshold, not generic
- Example: If 62-year-old scored 42 points, that's a PASS (not fail)

---

## FUNCTIONAL REQUIREMENTS

✅ Precision series displays correct age-specific threshold
✅ Threshold updates if user's birthday passes (year changes)
✅ Achievement validation uses age-appropriate threshold
✅ UI shows shooter's current age
✅ No errors if age doesn't match expected categories
✅ Works with multiple weapon groups if applicable

---

## TESTING SCENARIOS

1. Create profile with DOB making them age 50 → verify "under 55" threshold shows
2. Create profile with DOB making them age 60 → verify "55-64" threshold shows
3. Create profile with DOB making them age 70 → verify "65+" threshold shows
4. Change system date to after person's birthday → verify age increments and threshold updates if crossing boundary
5. Evaluate achievement: 60-year-old with 42 points should PASS (not fail to generic 43-point requirement)

---

## NOTES

- Age calculated at display time (not cached), so always current
- This is the foundation for age-sensitive medal requirements
- Different medals may have different ageCategories (some may not have age-based rules)
- Next PRs will handle weapon-group specific thresholds and gold-mark status variations