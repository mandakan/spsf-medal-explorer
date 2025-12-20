# Medal Skill-Tree Explorer App
## Medal Database Structure & SHB Rules Mapping

---

## Overview

This document maps the Swedish Shooting Association (SHB) medal system from Bilaga 1 into the app's data structures. Use this as reference during data model implementation.

---

## Main Medal Types (From Bilaga 1)

### 1. Pistolskyttemärket (Pistol Mark)

**Tiers**: Bronze → Silver → Gold → Gold + Stars (1, 2, 3)

**Basic Requirements**:
- Bronze: First year achievement - prove competency
- Silver: Year after Bronze + new gold series results
- Gold: Year after Silver + continued achievement
- Stars: Each requires 3 years holding previous tier + annual gold-level achievement

**Weapon Groups**: A, B, C (different point thresholds)

**Key Rules**:
- Only one medal tier per calendar year
- Must achieve in sequence (Bronze → Silver → Gold)
- Cannot skip tiers

**Data Structure Example**:
```javascript
{
  id: "pistol-mark-bronze",
  type: "pistol_mark",
  tier: "bronze",
  name: "Pistolskyttemärket - Brons",
  displayName: "Pistol Mark - Bronze",
  
  prerequisites: [],  // None, this is entry point
  
  requirements: [
    {
      type: "gold_series",
      description: "3 precision series vs Pistol target 25m",
      minAchievements: 3,
      timeWindowYears: 1,  // Same calendar year
      seriesType: "precision",
      pointThresholds: {
        A: { min: 32 },
        B: { min: 33 },
        C: { min: 34 }
      }
    }
  ],
  
  unlocksFollowingMedals: [
    "pistol-mark-silver",
    "elite-mark-bronze",
    "field-mark-bronze",
    "skis-mark-bronze",
    "spring-mark-bronze"
  ]
}
```

---

### 2. Elitmärket (Elite Mark)

**Tiers**: Bronze → Silver → Gold → Gold + Ornament → Ornament + Stars

**Basic Requirements**:
- Bronze: Gold Pistol Mark + 5 precision series + 5 speed-shooting series
- Silver: Bronze + sustained performance
- Gold: Silver + sustained performance

**Key Rules**:
- Requires Gold Pistol Mark first
- Speed-shooting component (different from other marks)
- Faster progression than Championship Mark

**Data Structure Example**:
```javascript
{
  id: "elite-mark-bronze",
  type: "elite_mark",
  tier: "bronze",
  
  prerequisites: [
    {
      type: "medal",
      medalId: "pistol-mark-gold",
      description: "Must achieve Gold Pistol Mark first"
    }
  ],
  
  requirements: [
    {
      type: "precision_series",
      minAchievements: 5,
      description: "5 precision series"
    },
    {
      type: "speed_shooting_series",
      minAchievements: 5,
      description: "5 speed-shooting series (3 sec per shot at 25m)"
    }
  ]
}
```

---

### 3. Fältskyttemärket (Field Mark)

**Tiers**: Bronze → Silver → Gold → Gold + Ornament → Ornament + Stars

**Basic Requirements**:
- Entry: Bronze Pistol Mark required + Age ≥15
- Bronze: 3 different competitions with min point % per tier
- Silver: Gold Mark achievement or sustained performance
- Gold: Sustained performance

**Key Rules**:
- Age restriction: Only those 15+ can attempt
- Competition-based (not training)
- Different from precision marks (field targets)

**Data Structure Example**:
```javascript
{
  id: "field-mark-bronze",
  type: "field_mark",
  tier: "bronze",
  
  prerequisites: [
    {
      type: "medal",
      medalId: "pistol-mark-bronze",
      description: "Bronze Pistol Mark required"
    },
    {
      type: "age_requirement",
      minAge: 15,
      description: "Must be at least 15 years old"
    }
  ],
  
  requirements: [
    {
      type: "competition_performance",
      minAchievements: 3,  // 3 different competitions
      timeWindowYears: 1,  // Same calendar year
      competitionTypes: ["national", "regional/landsdels", "crewmate/krets"],
      pointThresholdPercent: {
        A: { min: 52 },  // 52% of max points
        B: { min: 60 },
        C: { min: 60 }
      }
    }
  ]
}
```

---

### 4. Mästarmerket (Championship Mark)

**Tiers**: Bronze → Silver → Gold → Gold + Stars

**Basic Requirements**:
- Requires Gold Pistol Mark
- Based on competition results at specific levels
- Faster progression path (3 years vs 6 years for lower tiers)

**Key Rules**:
- National/Championship level competitions only
- Shorter timeframe than other advanced marks
- Merits-based from Championship competitions

**Data Structure Example**:
```javascript
{
  id: "championship-mark-bronze",
  type: "championship_mark",
  tier: "bronze",
  
  prerequisites: [
    {
      type: "medal",
      medalId: "pistol-mark-gold"
    }
  ],
  
  requirements: [
    {
      type: "championship_competition",
      minAchievements: 1,
      timeWindowYears: 1,
      competitionType: "championship",  // SM-nivå
      medalTier: "bronze",
      description: "At least one bronze-level result at championship"
    }
  ]
}
```

---

### 5. Precisionsskyttemärket (Precision Mark)

**Tiers**: Bronze → Silver → Gold → Gold + Stars

**Basic Requirements**:
- Entry: Bronze Pistol Mark required (previous calendar year)
- Based on cumulative score from multiple competitions
- Score-based system with minimum points per tier

**Key Rules**:
- Calendar year limited (can only earn one tier per year)
- Requires multiple competitions (3 minimum)
- Points accumulate across competitions

**Data Structure Example**:
```javascript
{
  id: "precision-mark-bronze",
  type: "precision_mark",
  tier: "bronze",
  
  prerequisites: [
    {
      type: "medal",
      medalId: "pistol-mark-bronze",
      description: "Must achieve in previous calendar year"
    }
  ],
  
  requirements: [
    {
      type: "cumulative_competition_score",
      minCompetitions: 3,
      timeWindowYears: 1,
      pointThresholds: {
        A: { min: 194 },
        B: { min: 200 },
        C: { min: 206 }
      }
    }
  ]
}
```

---

### 6. Skidskyttemärket (Skis Shooting Mark)

**Tiers**: Bronze → Silver → Gold → Gold + Ornament → Ornament + Stars

**Basic Requirements**:
- Entry: Bronze Pistol Mark required
- Combined skiing + shooting event
- Time-based scoring (skiing time + shooting penalties)

**Key Rules**:
- Requires both skiing and shooting skills
- Specific ski course requirement
- Different point system (time-based, not target-based)

**Data Structure Example**:
```javascript
{
  id: "skis-mark-bronze",
  type: "skis_mark",
  tier: "bronze",
  
  prerequisites: [
    {
      type: "medal",
      medalId: "pistol-mark-bronze"
    }
  ],
  
  requirements: [
    {
      type: "skis_shooting_course",
      description: "3x2km ski course with shooting stations",
      minAchievements: 1,
      timeWindowYears: 1,
      pointThresholds: {
        male: { max: 40 },    // Max points (lower is better due to time)
        female: { max: 46 }
      }
    }
  ]
}
```

---

### 7. Springskyttemärket (Spring Running Mark)

**Tiers**: Bronze → Silver → Gold → Gold + Ornament → Ornament + Stars

**Basic Requirements**:
- Entry: Bronze Pistol Mark required
- Combined running + shooting
- Similar to Skis Mark but running instead of skiing

**Key Rules**:
- 3x1km running course with shooting
- Time-based scoring
- Gender-based point thresholds

---

### 8. Märke i Nationell Helmatch (National Full Match Mark)

**Tiers**: Bronze → Silver → Gold → Gold + Stars

**Basic Requirements**:
- Entry: Bronze Pistol Mark (previous year)
- 3 different shooting types in same match:
  - Precision shooting
  - Speed shooting
  - Field target shooting

**Key Rules**:
- Only 1 medal per year
- All 3 types required in single calendar year
- Must achieve at 2+ events with same results

---

## Medal Progression Chart

```
                    Gold Pistol Mark
                           ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
    Elite Mark        Championship Mark   Precision Mark
        ↓                   ↓                   ↓
   (3 years)           (3 years)          (1 year)
   + Stars              + Stars            + Stars
        ↑                   ↑                   ↑
        └───────────────────┼───────────────────┘
                            ↑
                    Bronze Pistol Mark ← Entry Point
                            ↓
                    Silver Pistol Mark
                            ↓
                    Gold Pistol Mark
                            ↓
                      (+ Stars 1-3)

Parallel Tracks (after Bronze):
├─ Field Mark (requires 15+)
├─ Skis Mark
├─ Spring Running Mark
├─ National Full Match Mark
└─ Elite Mark (after Gold)
```

---

## Special Rules & Edge Cases

### Time Windows

| Mark | Time Window | Notes |
|------|-------------|-------|
| Pistol Mark (Bronze→Silver→Gold) | 1 year | Must achieve in consecutive calendar years minimum |
| Stars (all types) | 3 years | Can skip years, but must span 3-year period |
| Precision Mark | 1 year | All achievements in same calendar year |
| Field Mark | 1 year | Different competitions in same year |
| Championship Mark | 1 year | Shortened path for competitive shooters |

### Age Requirements

| Mark | Min Age |
|------|---------|
| Pistol Mark | None specified |
| Elite Mark | Implied (Gold Pistol Mark required, no age stated) |
| Field Mark | 15 years |
| Championship Mark | None specified |
| National Full Match | None specified |

### Weapon Group Variations

**Most marks have A, B, C variations with different point thresholds**:
- Group A: Lowest points required
- Group B: Medium points
- Group C: Highest points required
- Group R: Sometimes included (rifle-based)

**Point differences typically**:
- Bronze: A=32, B=33, C=34
- Silver: A=38, B=39, C=45+

---

## Stars & Ornaments System

### For Gold Tiers

**Pattern**:
- Gold (base)
- Gold + ★ (Star 1): 3 years sustained achievement at Gold level
- Gold + ★★ (Star 2): 3 more years of achievement
- Gold + ★★★ (Star 3): 3 more years of achievement
- Gold + Ornament (Blue Enamel): 3 more years
- Gold + Ornament + ★: Continue the pattern

### Rules for Stars

- Each requires **3-year commitment** of sustained performance
- Years don't need to be consecutive
- Previous tier must be held before earning next

---

## Data Mapping Example

### Complete Pistol Mark Tree

```javascript
{
  id: "pistol-mark-bronze",
  type: "pistol_mark",
  tier: "bronze",
  name: "Pistolskyttemärket - Brons",
  year_introduced: 2000,
  sortOrder: 1,
  
  color: "#CD7F32",
  iconClass: "medal-bronze",
  
  prerequisites: [],
  unlocksFollowingMedals: [
    "pistol-mark-silver",
    "elite-mark-bronze",
    "field-mark-bronze",
    "skis-mark-bronze",
    "spring-mark-bronze",
    "precision-mark-bronze",
    "national-match-mark-bronze"
  ],
  
  description: "Entry-level award for demonstrating shooting competency",
  
  requirements: [
    {
      type: "gold_series",
      seriesType: "precision",
      venue: "indoor_range_25m",
      format: "3 series of 5 shots each",
      timeWindowYears: 1,
      pointThresholds: {
        A: { min: 32, description: "Weapon Group A" },
        B: { min: 33, description: "Weapon Group B" },
        C: { min: 34, description: "Weapon Group C" }
      }
    }
  ],
  
  timeline: {
    earliestAchieveYear: "Year 1",
    progression: "First tier, entry point"
  }
},

{
  id: "pistol-mark-silver",
  type: "pistol_mark",
  tier: "silver",
  name: "Pistolskyttemärket - Silver",
  sortOrder: 2,
  
  color: "#C0C0C0",
  iconClass: "medal-silver",
  
  prerequisites: [
    {
      type: "medal",
      medalId: "pistol-mark-bronze",
      yearOffset: 1,  // Must be after bronze
      description: "Bronze Pistol Mark (previous year or earlier)"
    }
  ],
  
  unlocksFollowingMedals: [
    "pistol-mark-gold",
    "elite-mark-silver"  // Can progress to Elite Silver
  ],
  
  requirements: [
    {
      type: "gold_series",
      seriesType: "precision",
      timeWindowYears: 1,
      pointThresholds: {
        A: { min: 38 },
        B: { min: 39 },
        C: { min: 45 }
      }
    }
  ],
  
  timeline: {
    earliestAchieveYear: "Year 2 (after Bronze)",
    progression: "Second tier, awarded after Bronze"
  }
},

{
  id: "pistol-mark-gold",
  type: "pistol_mark",
  tier: "gold",
  name: "Pistolskyttemärket - Guld",
  sortOrder: 3,
  
  prerequisites: [
    {
      type: "medal",
      medalId: "pistol-mark-silver",
      yearOffset: 1
    }
  ],
  
  unlocksFollowingMedals: [
    "pistol-mark-gold-star-1",
    "elite-mark-bronze",
    "championship-mark-bronze"
  ],
  
  requirements: [
    {
      type: "gold_series",
      timeWindowYears: 1,
      pointThresholds: {
        A: { min: 43 },
        B: { min: 44 },
        C: { min: 46 }
      }
    }
  ]
},

{
  id: "pistol-mark-gold-star-1",
  type: "pistol_mark",
  tier: "star_1",
  name: "Pistolskyttemärket - Guld med en stjärna",
  sortOrder: 4,
  
  prerequisites: [
    {
      type: "medal",
      medalId: "pistol-mark-gold"
    }
  ],
  
  requirements: [
    {
      type: "sustained_achievement",
      description: "3 years of Gold-level achievement",
      timeWindowYears: 3,
      yearsOfAchievement: 3,
      minPointsPerYear: 43  // Or higher for B/C groups
    }
  ]
}
```

---

## Implementation Checklist

### Data Entry Verification

- [ ] All 10+ medal types included
- [ ] All tiers (Bronze, Silver, Gold, Stars) present
- [ ] Weapon groups (A, B, C, R) have correct point thresholds
- [ ] Prerequisites correctly chain (Bronze → Silver → Gold)
- [ ] Time windows match SHB rules (1 year, 3 years, 5 years)
- [ ] Age requirements noted where applicable
- [ ] Unlock relationships accurate (what each medal leads to)

### Test Cases

Create test cases for each major medal type:

```javascript
// Test case: User gets Gold Pistol Mark
{
  userId: "test-user-1",
  achievements: [
    { type: "gold_series", year: 2023, weaponGroup: "A", points: 35 },
    { type: "gold_series", year: 2024, weaponGroup: "A", points: 38 },
    { type: "gold_series", year: 2025, weaponGroup: "A", points: 43 }
  ],
  expectedUnlockedMedals: [
    "pistol-mark-bronze",
    "pistol-mark-silver",
    "pistol-mark-gold",
    "elite-mark-bronze",
    "championship-mark-bronze"
  ]
}
```

---

## Notes for Data Entry

1. **Bilaga 1 Location**: All base medal requirements found in pages 451-465 of SHB handbook
2. **Point Thresholds**: Different for each weapon group - don't mix them up
3. **Time Windows**: Read carefully (e.g., "under tre år" = during 3 years)
4. **Alternative Paths**: Some marks have multiple ways to achieve (e.g., Fältskyttemärket)
5. **Year Progression**: Minimum 1 year between tiers for Pistol Mark specifically

---

## Future Data Enhancements

When implementing backend:

- [ ] Add competition date ranges
- [ ] Add specific competition names/locations
- [ ] Add medal awarding authorities
- [ ] Add images for each medal
- [ ] Add detailed rules text from official handbook
- [ ] Add historical medal variants (if any)
- [ ] Add changeable point thresholds by year (if applicable)
