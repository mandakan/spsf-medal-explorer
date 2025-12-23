# Medal Skill-Tree Explorer

[![Lint](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/lint.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/lint.yml)
[![Test](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/test.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/test.yml)
[![Build](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/build.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/build.yml)
[![Deploy](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/deploy.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/deploy.yml)

A mobile-first web app that helps Swedish shooting enthusiasts explore and track their progression through the SHB (Svenska Pistolskytteförbundet) medal system using an interactive skill-tree visualization inspired by games like Civilization.

## 🎯 What is This?

The SHB medal system is complex with 10+ medal types, multiple tiers (Bronze → Silver → Gold → Stars), and intricate prerequisite chains. This app makes it intuitive by:

- **Visualizing medals as an interactive skill-tree** (like Civilization tech tree)
- **Showing which medals are achievable now** based on user's current achievements
- **Tracking progress over multiple years** with a clean, game-inspired UI
- **Providing detailed requirements** for each medal with visual progress indicators

### Key Features

✨ **Skill-Tree Canvas View** - Pan and zoom through interconnected medals
📋 **List View** - Filter and sort medals by type, tier, status
🎯 **Medal Details** - Complete requirements, prerequisites, and next-medal hints
📝 **Achievement Input** - Log competition results and gold-series scores
💾 **Local Storage** - All data stored in browser, no account needed
📤 **Import/Export** - Backup and share your progress as JSON

## 🚀 Quick Start

### For Users
1. Open `index.html` in a modern browser
2. Click "New Profile" to start
3. Enter your name and weapon group preference
4. Add your competition achievements (gold series, competition results)
5. Watch medals unlock as you progress!

### For Developers

**Prerequisites:**
- Node.js 14+ (optional, for development server)
- Modern browser (Chrome, Firefox, Safari, Edge from 2020+)
- Git

**Setup:**
```bash
# Clone the repository
git clone https://github.com/yourusername/medal-app.git
cd medal-app

# No build step needed for POC!
# Just open index.html or run a local server:
python -m http.server 8000
# Visit http://localhost:8000
```

**Project Structure:**
```
medal-app/
├── index.html              # Single-page app entry
├── css/
│   ├── style.css          # Main stylesheet
│   ├── components.css     # Component styles
│   └── responsive.css     # Mobile/responsive styles
├── js/
│   ├── main.js            # App initialization
│   ├── data/              # Data layer
│   ├── logic/             # Business logic
│   ├── ui/                # Views and components
│   └── utils/             # Helpers
├── data/
│   └── medals.json        # Medal database
├── docs/                  # Design documents
└── tests/                 # Test files
```

## 📚 Documentation

Complete design documentation is in the `/docs` folder:

- **[00-README.md](docs/00-README.md)** - Overview and how to use the docs
- **[01-Product-Vision.md](docs/01-Product-Vision.md)** - Problem statement and vision
- **[02-Data-Model.md](docs/02-Data-Model.md)** - Data structures and architecture
- **[03-Interaction-Design.md](docs/03-Interaction-Design.md)** - User flows and interactions
- **[04-Visual-Design.md](docs/04-Visual-Design.md)** - Color system, typography, components
- **[05-Technical-Architecture.md](docs/05-Technical-Architecture.md)** - Implementation guide
- **[06-Summary-NextSteps.md](docs/06-Summary-NextSteps.md)** - Roadmap and decisions
- **[07-Medal-Database-Reference.md](docs/07-Medal-Database-Reference.md)** - SHB medal mapping
- **[QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md)** - Quick lookup guide

**Start with [docs/00-README.md](docs/00-README.md) if you're new to the project.**

## 💻 Development

### Architecture

The app follows a clean layered architecture:

```
UI Layer (Views, Components, Interactions)
   ↓
Logic Layer (Calculator, Validator, Controllers)
   ↓
Data Layer (DataManager, Storage, Models)
```

**Key Principle**: Storage is abstracted, so you can swap localStorage for a backend API without changing the UI.

### Core Modules

- **MedalCalculator** - Evaluates which medals are unlocked/achievable
- **DataManager** - Abstract storage interface
- **LocalStorageManager** - POC implementation using browser storage
- **InputValidator** - Validates user inputs against rules
- **Router** - Simple SPA routing
- **EventBus** - Component communication

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Code Style

- ES6+ JavaScript (no transpilation needed in POC)
- JSDoc comments on public methods
- Descriptive variable and function names
- Follow existing code patterns

## 🎨 Design System

### Colors
- **Unlocked**: Gold (#FFD700)
- **Achievable**: Teal (#20C997)
- **Locked**: Gray (#6C757D)
- **Primary Action**: Deep Teal (#0D6E6E)
- Medal Tiers: Bronze (#CD7F32), Silver (#C0C0C0), Gold (#FFD700)

### Typography
- **Headers**: Segoe UI, Roboto (weight: 600-700)
- **Body**: System font stack (weight: 400)
- **Monospace**: Monaco, Menlo (for data)

### Responsive Breakpoints
- **Mobile**: <768px
- **Tablet**: 768px - 1024px
- **Desktop**: >1024px

See [04-Visual-Design.md](docs/04-Visual-Design.md) for complete specifications.

## 📦 Data

### Local Storage
All user data is stored in the browser's localStorage under the key `medal-app-data`. No data is sent to external servers in the POC phase.

**Structure:**
```javascript
{
  version: "1.0",
  profiles: [
    {
      userId: string,
      displayName: string,
      unlockedMedals: [],
      prerequisites: [],
      // ... more fields
    }
  ],
  medals: [/* Medal database */],
  lastBackup: ISO date string
}
```

### Import/Export
Users can export their data as JSON:
- Full backup (profile + achievements + medals)
- Achievements only
- CSV format for spreadsheets

## 🗂️ SHB Medal System

This app covers all medal types from the SHB Bilaga 1 (Swedish Shooting Association medal regulations):

- **Pistolskyttemärket** (Pistol Mark) - Base progression
- **Elitmärket** (Elite Mark) - For competitive shooters
- **Fältskyttemärket** (Field Mark) - Field target shooting
- **Mästarmärket** (Championship Mark) - Championship level
- **Precisionsskyttemärket** (Precision Mark) - Score-based
- **Skidskyttemärket** (Skis Mark) - Skiing + shooting
- **Springskyttemärket** (Spring Running Mark) - Running + shooting
- Plus several others

Each medal has tiers: Bronze → Silver → Gold → Gold + Stars (1, 2, 3)

See [07-Medal-Database-Reference.md](docs/07-Medal-Database-Reference.md) for complete mapping.

## 🔄 User Workflows

### New User Journey
1. Open app → New Profile
2. Enter name and weapon group
3. View Skill-Tree (shows locked medals)
4. Add Achievement (gold series, competition result)
5. See medals unlock
6. Explore requirements for next medals

### Returning User
1. Load saved profile
2. Add new achievements from past year
3. See newly achievable medals
4. Plan training based on gaps

### Explorer Mode
1. Browse skill-tree, pan and zoom
2. Click medals to see details
3. Understand progression paths
4. No input required

## 🧪 Testing

### What to Test

**User Flows** (from [03-Interaction-Design.md](docs/03-Interaction-Design.md)):
- [ ] Add achievement flow
- [ ] Medal unlock flow
- [ ] List view filtering
- [ ] Mobile responsiveness

**Medal Calculations** (from [07-Medal-Database-Reference.md](docs/07-Medal-Database-Reference.md)):
- [ ] Bronze → Silver progression works
- [ ] Time-window requirements enforced
- [ ] Weapon group thresholds correct
- [ ] Star progression rules applied

**Data Integrity**:
- [ ] Data persists after page reload
- [ ] Import/export maintains fidelity
- [ ] No data loss on browser restart

**Performance**:
- [ ] Skill-tree loads in <2s
- [ ] Canvas renders at 60fps
- [ ] Mobile interactions <100ms latency

See [06-Summary-NextSteps.md](docs/06-Summary-NextSteps.md) for complete success criteria.

## 🚀 Roadmap

### Phase 1: Foundation (Weeks 1-3)
- Project setup
- Data model implementation
- Basic UI shell

### Phase 2: Visualization (Weeks 4-6)
- Skill-tree canvas
- Layout algorithm
- Interactive nodes

### Phase 3: Achievement Tracking (Weeks 7-9)
- Input forms
- Medal calculator
- Auto-unlock system

### Phase 4: Polish (Weeks 10-12)
- List view & filtering
- Import/export
- Testing & optimization

See [06-Summary-NextSteps.md](docs/06-Summary-NextSteps.md) for detailed roadmap.

## 🔮 Future Enhancements

**Phase 2 (Backend Integration)**
- User accounts & cloud sync
- Real-time competition data from SHB
- Social leaderboards

**Phase 3 (Advanced Features)**
- Mobile app (React Native/Flutter)
- Achievement notifications
- PDF/image export of skill-tree
- Multi-language support

**Phase 4 (Community)**
- Community leaderboards
- Achievement badges
- Social sharing

See [06-Summary-NextSteps.md](docs/06-Summary-NextSteps.md) for more details.

## 🤝 Contributing

### For Team Members

1. **Before coding**: Read relevant design documents
2. **Follow the architecture**: Respect layer separation
3. **Write testable code**: Unit testable logic, integrated UI
4. **Document decisions**: Comment why, not what
5. **Update docs**: Keep design documents current

### Guidelines

- **Code Style**: Follow existing patterns (see `/js` folder)
- **Naming**: Descriptive names (no cryptic abbreviations)
- **Comments**: JSDoc on public methods, explain non-obvious logic
- **Testing**: Write tests for business logic
- **Performance**: Lazy load, debounce, cache appropriately

### Pull Request Process

1. Create feature branch from `main`
2. Implement feature with tests
3. Update relevant documentation
4. Create PR with description
5. Review and iterate
6. Merge when approved

## 🐛 Known Issues & Limitations

### POC Phase
- ✅ No external API (uses localStorage only)
- ✅ Single browser/device (no sync)
- ✅ No user authentication
- ✅ Limited to modern browsers (no IE11 support)

### Planned for Production
- [ ] Backend API integration
- [ ] User accounts & cloud sync
- [ ] Mobile app versions
- [ ] Offline-first PWA

## 📱 Browser Support

**Required:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Not Supported:**
- Internet Explorer 11 and below

**Mobile:**
- iOS Safari 14+
- Android Chrome 90+

## ⚖️ License

[Choose your license - MIT, Apache 2.0, GPL, etc.]

## 📞 Contact & Support

**Questions about:**
- **Product Vision** → See [01-Product-Vision.md](docs/01-Product-Vision.md)
- **Data Structures** → See [02-Data-Model.md](docs/02-Data-Model.md)
- **User Interactions** → See [03-Interaction-Design.md](docs/03-Interaction-Design.md)
- **Visual Design** → See [04-Visual-Design.md](docs/04-Visual-Design.md)
- **Implementation** → See [05-Technical-Architecture.md](docs/05-Technical-Architecture.md)
- **Medal System** → See [07-Medal-Database-Reference.md](docs/07-Medal-Database-Reference.md)

**For Swedish Shooting Association (SHB) rules:**
- Official handbook: SHB Skjuthandbok (latest edition)
- Check Bilaga 1 for medal specifications

## 🎓 Learning Resources

**Understanding the Domain**
1. Read SHB Bilaga 1 (medal regulations)
2. Review [07-Medal-Database-Reference.md](docs/07-Medal-Database-Reference.md)
3. Create test cases for different medal types

**Understanding the Code**
1. Start with [05-Technical-Architecture.md](docs/05-Technical-Architecture.md)
2. Review module structure in `/js` folder
3. Follow a user flow end-to-end

**Understanding the Design**
1. Read [01-Product-Vision.md](docs/01-Product-Vision.md) (why?)
2. Read [03-Interaction-Design.md](docs/03-Interaction-Design.md) (what?)
3. Read [04-Visual-Design.md](docs/04-Visual-Design.md) (how?)

## 🙏 Acknowledgments

- SHB (Svenska Pistolskytteförbundet) for medal system specifications
- Game design inspiration from Civilization, Age of Empires
- UX inspiration from modern web applications

## 📊 Project Status

| Phase | Status | Timeline |
|-------|--------|----------|
| Design Documentation | ✅ Complete | Dec 2025 |
| Data Model | 🔄 In Progress | Dec 2025 - Jan 2026 |
| Foundation Code | ⏳ Planned | Jan 2026 |
| Core Features | ⏳ Planned | Feb - Mar 2026 |
| Testing & Polish | ⏳ Planned | Apr 2026 |
| POC Release | ⏳ Planned | May 2026 |

---

**Last Updated:** December 20, 2025

**Ready to contribute?** Start by reading the design documents, then check out the `/js` folder structure and pick a feature to implement!

**Have questions?** Check the [QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md) for quick answers, or dive into the full documentation.

**Let's build something awesome!** 🚀
