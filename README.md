# Medal Skill-Tree Explorer

[![Lint](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/lint.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/lint.yml)
[![Test](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/test.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/test.yml)
[![Build](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/build.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/build.yml)
[![Deploy](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/deploy.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/deploy.yml)

A mobile-first web app to explore and track progression through the Swedish Pistol Shooting Federation (SHB) medal system. Visualize prerequisites as an interactive skill tree, log achievements, and see what you can unlock next.

👉 Live demo: https://mandakan.github.io/spsf-medal-explorer/

Note on data and privacy: All data is stored locally in your browser's localStorage. Nothing is uploaded or synced. Clearing site data or switching devices will erase your data — use Export to back up and Import to restore.

## Overview

- Visual skill-tree for medals with pan/zoom and collision-aware layout
- Track achievements (precision/application series, competition results, team events, etc.)
- Calculator determines unlocked/achievable medals based on inputs and prerequisites
- List view with filtering, search, and status indicators
- Local-first: data is stored in the browser; import/export supported
- Designed for mobile with gesture support (bottom sheet, swipe-to-dismiss)

## Features

- Skill-Tree Canvas
  - Canvas layout and rendering engine
  - Light repulsion to reduce overlap
  - Tier/color mapping for medal visualization
- Achievement Management
  - Dialog and form hooks with validation and error handling
  - Duplicate detection and batch entry
  - Undo/Redo support
- Medal Logic
  - MedalCalculator evaluates per-medal status
  - Rulebook version lookup per year
  - Universal input validation utilities
- Search & Filter
  - Fast normalization-based search
  - Filter by tiers, medal types, status, and more
- Import/Export
  - JSON and CSV export
  - Minimal PDF generation (fallback, no external deps)
  - File size helpers and safe date handling

## Tech Stack

- React + Vite
- Jest (unit tests)
- Tailwind (utility classes; dynamic color class helpers)
- Local storage (no backend required in current version)

## Getting Started

Prerequisites
- Node.js 18+ and npm

Install and run
```bash
npm install
npm run dev          # Start dev server (Vite) on http://localhost:5173
npm run build        # Production build
npm run preview      # Preview production build
```

Tests
```bash
npm test
```

Lint (if configured in package.json)
```bash
npm run lint
```

## Project Structure

```
src/
  components/           UI components (dialogs, cards, sheets, header/footer)
  contexts/             App contexts (profile, undo/redo, calculator, medals)
  hooks/                Reusable hooks (forms, search, profile, gestures)
  logic/                Core logic (calculator, validators, canvas layout/render, filters, search)
  models/               Domain models (Medal, UserProfile)
  utils/                Utilities (exporting, mapping, file handling, labels, databases)
  config/               App configuration (rulebook versions, etc.)
  pages/                Route pages (e.g., Home)
tests/                  Jest tests (renderer, validation, routing, etc.)
vite.config.js          Vite configuration
```

Key modules
- logic/calculator.js: MedalCalculator for unlocked/achievable status
- logic/canvasLayout.js: Layout refinement with basic repulsion
- logic/canvasRenderer.js: Canvas drawing helpers and computed styles
- logic/validator.js: Input validation for achievements
- utils/exportManager.js: JSON/CSV export and minimal PDF fallback
- contexts/UndoRedoContext.jsx: History and undo/redo support

## Data & Persistence

- Local-first: user profile, achievements, and unlocked medals are kept in browser storage
- DataManager is an abstraction point for future backend integration
- Import/Export
  - Export as JSON or CSV
  - Minimal PDF generation for a quick summary (no external libraries)

## Development Notes

- Keep business logic in src/logic and models to simplify testing
- Use contexts for shared state (profiles, calculator results, undo/redo)
- Prefer hooks for reusable UI behavior (swipe gestures, form state, search)
- Validation lives in logic/validator.js and validators/universalValidator.js

## Testing

- Jest unit tests (see tests/)
  - Canvas renderer is tested with a stubbed 2D context
  - Router and contexts are mocked where needed
  - Achievement validation and duplicates are covered

Run tests
```bash
npm test
```

## Accessibility & Performance

- Mobile-first components with keyboard escape handling for dialogs/sheets
- Gesture support via useSwipeGesture
- Canvas rendering optimized for clarity; layout refined to reduce overlap
- Keep heavy work off the render path; memoize where appropriate

## Contributing

- Branch from main, add tests for core logic, and follow existing patterns
- Keep logic pure and testable; UI should call into logic and hooks
- Use descriptive names and document non-obvious decisions

Basic workflow
1. Create a feature branch
2. Implement with tests
3. Open a PR with a concise description
4. Iterate based on review

## License

MIT (or update to your preferred license)
