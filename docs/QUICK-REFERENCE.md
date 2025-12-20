# Medal Skill-Tree Explorer App
## Quick Reference Guide

---

## 📱 App Features at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                   MEDAL EXPLORER APP                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✨ SKILL-TREE VIEW (Like Civilization!)              │
│  ├─ Interactive canvas with medal nodes                │
│  ├─ Pan & zoom to explore                              │
│  ├─ Click medal for details                            │
│  └─ Color-coded by status (Gold/Teal/Gray)            │
│                                                         │
│  📋 LIST VIEW (Traditional)                            │
│  ├─ Filter by type, tier, status                       │
│  ├─ Sort by difficulty, progress                       │
│  └─ Quick access to medals                             │
│                                                         │
│  🎯 MEDAL DETAILS                                      │
│  ├─ Full description & rules                           │
│  ├─ Prerequisites checklist                            │
│  ├─ Requirements with progress                         │
│  └─ Next medals in chain                               │
│                                                         │
│  📝 ACHIEVEMENT INPUT                                  │
│  ├─ Log competition results                            │
│  ├─ Add gold series scores                             │
│  ├─ Track multi-year progress                          │
│  └─ Auto-unlock achievable medals                      │
│                                                         │
│  ⚙️  SETTINGS & DATA                                   │
│  ├─ Profile management                                 │
│  ├─ Import/Export data                                 │
│  ├─ Local backup                                       │
│  └─ Achievement history                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Design Elements

### Color System

| Element | Color | Use |
|---------|-------|-----|
| **Unlocked Medal** | Gold (#FFD700) | ✓ Achieved |
| **Achievable Medal** | Teal (#20C997) | ◆ Can earn now |
| **Locked Medal** | Gray (#6C757D) | ⊘ Not ready |
| **Primary Action** | Deep Teal (#0D6E6E) | Buttons |
| **Bronze Tier** | #CD7F32 | Medal type |
| **Silver Tier** | #C0C0C0 | Medal type |
| **Gold Tier** | #FFD700 | Medal type |

### Medal Node Sizes

- **Mobile**: 45px
- **Tablet**: 50px
- **Desktop**: 60px

### Responsive Breakpoints

- **Mobile**: <768px (full-width, single column)
- **Tablet**: 768-1024px (two-column, flexible)
- **Desktop**: >1024px (split layout, detail sidebar)

---

## 📊 Data Structure Summary

### Medal Object
```
Medal {
  id: string
  type: string (pistol_mark, elite_mark, etc.)
  tier: string (bronze, silver, gold, star_1, star_2, star_3)
  name: string
  prerequisites: [{type, medalId, ...}]
  requirements: [{type, points, timeWindow, ...}]
  unlocksFollowingMedals: [string]
}
```

### User Profile
```
Profile {
  userId: string
  displayName: string
  weaponGroupPreference: string
  unlockedMedals: [{medalId, unlockedDate, year}]
  prerequisites: [{type, year, weaponGroup, points, ...}]
}
```

### Achievement
```
Achievement {
  id: string
  type: string (gold_series, competition_result, etc.)
  year: number
  weaponGroup: string
  points/score: number
  date: string
  competitionName: string
}
```

---

## 🔄 User Flows

### Flow 1: New User → First Achievement

```
1. Open app
2. Click "New Profile"
3. Enter name & weapon group
4. Navigate to Skill-Tree
5. Click "Add Achievement"
6. Enter gold series: Year 2025, Group A, 42 points
7. System shows "Bronze Pistol Mark Unlocked!"
8. Click medal to see what's next
9. Save profile (auto-saved)
```

### Flow 2: Track Progress Over Years

```
1. Load saved profile
2. Click "Add Achievement"
3. Enter Year 2026 competition result
4. System recalculates all medals
5. See new achievable medals highlighted
6. Click to see requirements for next tier
7. Plan year's training based on gaps
```

### Flow 3: Explore the Tree

```
1. Open Skill-Tree view
2. Scroll/pan to find medal of interest
3. Click medal node
4. See details in side panel:
   - Prerequisites (all checked ✓)
   - Requirements (progress bar)
   - Next medals it unlocks
5. Click "Track This" to set goal
6. Close panel, explore more
```

---

## 💾 Storage & Export

### What's Stored (Local)

```
LocalStorage {
  version: "1.0"
  profiles: [Profile]
  medals: [Medal]
  lastBackup: date
}
```

Max size: ~5-10 MB (easily supports 1000+ entries per user)

### Export Format (JSON)

```json
{
  "exportVersion": "1.0",
  "exportDate": "2025-12-20T07:32:00Z",
  "userProfile": {...},
  "achievements": [...],
  "unlockedMedals": [...]
}
```

**Uses**: Backup, sharing, importing to another device

---

## 🎯 Medal Progression Chart

```
Entry Point
    ↓
Bronze Pistol Mark (Year 1)
    ↓
Silver Pistol Mark (Year 2) ← Also unlocks:
    ↓                           - Elite Mark Bronze
Gold Pistol Mark (Year 3)     - Field Mark Bronze
    ↓                           - Championship Mark Bronze
    ├─ Gold + Star 1 (3 yrs)
    ├─ Gold + Star 2 (6 yrs)
    └─ Gold + Star 3 (9 yrs)

Parallel Paths (all require Bronze Pistol):
├─ Elite Mark (for competitive shooters)
├─ Field Mark (for field shooting)
├─ Precision Mark (for accurate shooting)
├─ Skis Shooting Mark
├─ Spring Running Mark
└─ Championship Mark (for top competitors)
```

---

## 📱 Mobile vs Desktop

### Desktop Experience
```
┌──────────────────────────────────┐
│ Header with Nav                  │
├──────────────────────────────────┤
│         │                        │
│  Canvas │  Medal Details Panel   │
│  (70%)  │  (30%)                 │
│         │  - Name                │
│         │  - Status              │
│         │  - Requirements        │
│         │  - Next medals         │
│         │                        │
└──────────────────────────────────┘
```

### Mobile Experience
```
┌──────────────────────┐
│ Header with Nav      │
├──────────────────────┤
│  Canvas (Full width) │
│  (Swipeable)         │
│                      │
│  [Tap medal]         │
│     ↓                │
│  Modal slides up     │
│  Details overlay     │
│  [X] to close        │
└──────────────────────┘
```

---

## 🔐 Security & Privacy

**POC Phase**:
- ✅ Data stored locally (no servers)
- ✅ User controls export/backup
- ✅ No external API calls
- ✅ No tracking/analytics
- ✅ No account required
- ⚠️ Data lost if browser storage cleared

**Production**:
- [ ] Optional cloud sync (encrypted)
- [ ] User authentication
- [ ] HTTPS required
- [ ] Privacy policy & terms
- [ ] GDPR compliance

---

## 🚀 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **Load Time** | <2s | - |
| **First Paint** | <1s | - |
| **Canvas Render** | 60fps | - |
| **Input Latency** | <100ms | - |
| **Storage Usage** | <1MB | - |
| **Memory Usage** | <50MB | - |

### Optimization Strategies

1. **Lazy Rendering**: Don't render off-screen medals
2. **Debouncing**: Pan/zoom events
3. **Caching**: Medal calculations
4. **Code Splitting**: Load views on demand
5. **Compression**: Minify CSS/JS

---

## ✅ Success Metrics

### User Experience
- [ ] Users understand system in <2 minutes
- [ ] Finding medals takes <30 seconds
- [ ] Adding achievement takes <3 minutes
- [ ] 90% rate UI as clear/intuitive
- [ ] 70%+ prefer skill-tree view

### Technical
- [ ] Works offline
- [ ] Data persists across sessions
- [ ] Import/export works perfectly
- [ ] All medal data accurate
- [ ] No bugs found by QA

### Engagement
- [ ] 30%+ return rate
- [ ] Users input ≥2 achievements
- [ ] 20%+ use export feature
- [ ] Net Promoter Score >50

---

## 🔍 Key Decisions Summary

| Decision | Why | Alternative |
|----------|-----|-------------|
| Game-inspired visualization | Intuitive & motivating | Boring spreadsheet |
| Dual views (canvas + list) | Different user preferences | Single view only |
| Manual input | No API dependency | Auto-scraping |
| Local storage | POC simplicity | Backend immediately |
| Vanilla JS | Zero dependencies | React/Vue/Svelte |
| Mobile-first | Majority use mobile | Desktop-first |

---

## 📚 Where to Find Things

| Question | Document |
|----------|----------|
| What's the app for? | 01-Product-Vision |
| How's data structured? | 02-Data-Model |
| What do users see? | 03-Interaction-Design |
| How do I make it beautiful? | 04-Visual-Design |
| How do I build this? | 05-Technical-Architecture |
| What's the plan? | 06-Summary-NextSteps |
| What medals are there? | 07-Medal-Database-Reference |

---

## 🎓 10-Minute Primer

### For Designers
1. Read 03-Interaction-Design (views)
2. Read 04-Visual-Design (components)
3. Create mockups based on specs

### For Developers
1. Read 05-Technical-Architecture (structure)
2. Read 02-Data-Model (data)
3. Set up modules following pattern

### For Product Managers
1. Read 01-Product-Vision (problem/solution)
2. Read 06-Summary-NextSteps (roadmap)
3. Share with team, get feedback

### For QA
1. Read 06-Summary-NextSteps (success criteria)
2. Read 03-Interaction-Design (user flows)
3. Create test cases

---

## 🆘 Quick Troubleshooting

**"I don't understand the medal system"**
→ Read 07-Medal-Database-Reference, consult SHB handbook

**"Where's the prototype?"**
→ Not built yet - these documents ARE the design, iterate then build

**"How long will this take?"**
→ See 06-Summary-NextSteps roadmap (~12 weeks for POC)

**"Can we add [feature]?"**
→ Document it first! Update design docs before coding

**"Why not use [framework]?"**
→ Architecture is framework-agnostic, just swap the UI layer

**"Should we build backend now?"**
→ No - POC uses localStorage. Backend integration path designed in docs.

---

## 📞 Getting Help

1. **Design questions** → Re-read relevant doc, check examples
2. **Data structure questions** → Check 02-Data-Model.md & 07-Medal-Database-Reference.md
3. **Implementation questions** → Check 05-Technical-Architecture.md
4. **User flow questions** → Check 03-Interaction-Design.md
5. **Medal system questions** → Check 07-Medal-Database-Reference.md + SHB handbook

---

## ✨ Pro Tips

1. **Print these documents** - Easier to annotate and discuss
2. **Create a shared Figma** - For design iteration
3. **Setup GitHub** - Version control for documents
4. **Schedule reviews** - Weekly design reviews before building
5. **Test early** - Prototype and user test ASAP
6. **Update docs** - Keep them current during implementation
7. **Document decisions** - Add rationale in decision log
8. **Build in sprints** - Small increments, frequent feedback

---

## 🎊 Next Steps

- [ ] Read 00-README.md (start here)
- [ ] Read 01-Product-Vision.md (understand the problem)
- [ ] Read 03-Interaction-Design.md (visualize the app)
- [ ] Review all docs with team
- [ ] Validate medal data
- [ ] Create clickable prototype
- [ ] Get user feedback
- [ ] Begin implementation

**Estimated time to readiness: 1-2 weeks**

---

**Remember**: These documents are a foundation, not a prison. Adapt as you learn. Ship fast, iterate often. User feedback beats theoretical design.

**Ready to build something awesome? Let's go! 🚀**
