# Medal Skill-Tree Explorer

[![Lint](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/lint.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/lint.yml)
[![Test](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/test.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/test.yml)
[![Build](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/build.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/build.yml)
[![Deploy](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/deploy.yml/badge.svg)](https://github.com/mandakan/spsf-medal-explorer/actions/workflows/deploy.yml)
![react](https://img.shields.io/badge/react-%2320232a?logo=react)
![vite](https://img.shields.io/badge/vite-%23646cff?logo=vite&logoColor=61daf8)
![License](https://img.shields.io/badge/License-MIT-yellow)

A mobile-first web app to explore and track progression through the Swedish Pistol Shooting Federation (SHB) medal system. Visualize prerequisites as an interactive skill tree, log achievements, and see what you can unlock next.

👉 Live demo: https://mandakan.github.io/spsf-medal-explorer/

Note on data and privacy: All data is stored locally in your browser's localStorage. Nothing is uploaded or synced. Clearing site data or switching devices will erase your data — use Export to back up and Import to restore.

<a href="https://buymeacoffee.com/thias" target="_blank" rel="noopener"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40"></a>

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

## Creating a new skill-tree visualisation (layout preset)

The skill tree supports multiple visualisations via a "layout preset" architecture. A preset is a small module that generates a layout (node positions + connections) from the medal database. The canvas renderer and interaction logic are intentionally kept generic: they consume the layout output and do not care which preset produced it.

This section explains how to add a new visualisation step-by-step.

### 1) Understand the layout contract

A layout generator must return an object with this shape:

- `layout.medals`: array of nodes (one per medal)
  - Required fields:
    - `medalId` (string) — must match the medal `id` in the database
    - `x` (number) — world coordinate
    - `y` (number) — world coordinate
    - `radius` (number) — node radius in world units (used for hit testing and bounds)
  - Optional fields:
    - `yearsRequired` (number) — used by the DOM overlay "år"-badges
    - `type` (string) — can be used by renderers/filters (optional)

- `layout.connections`: array of edges
  - Required fields:
    - `from` (string) — source medalId
    - `to` (string) — target medalId
  - Optional fields:
    - `type` (string) — e.g. `'prerequisite'`
    - `label` (string) — optional text label

The canonical JSDoc types live in:
- `src/logic/layouts/layoutTypes.js`

Important constraints:
- Coordinates are in "world space". The canvas applies pan/zoom and an auto-fit base transform.
- The renderer expects stable `medalId` values and uses `radius` for hit testing and bounds.
- Keep generators deterministic for the same input (important for UX stability and caching).

### 2) Create a new preset module

Create a new file in:
- `src/logic/layouts/`

Example filename:
- `src/logic/layouts/radial.js`

A preset module exports a preset definition object with:
- `id` (string) — stable identifier (URL/localStorage friendly)
- `label` (string) — human readable name (used in UI later)
- `description` (string, optional)
- `generator(medals, options)` — returns a layout
- `defaultOptions` (optional)

Minimal template:

```js
// src/logic/layouts/radial.js
export const radialLayout = {
  id: 'radial',
  label: 'Radial',
  description: 'Grupperar märken i en cirkel.',
  generator: (medals) => {
    // medals is an array of medal objects from medalDatabase.getAllMedals()
    // You must return { medals: [...], connections: [...] }

    const nodes = []
    const connections = []

    // Example: place medals evenly on a circle
    const R = 600
    const n = medals.length || 1
    for (let i = 0; i < medals.length; i++) {
      const m = medals[i]
      const a = (i / n) * Math.PI * 2
      nodes.push({
        medalId: m.id,
        x: Math.cos(a) * R,
        y: Math.sin(a) * R,
        radius: 22,
        // yearsRequired: optional
      })

      // Example: if your medal model has prerequisites, you can add edges here.
      // Keep the edge shape: { from, to, type? }
      // connections.push({ from: prereqId, to: m.id, type: 'prerequisite' })
    }

    return { medals: nodes, connections }
  },
}
```

Notes:
- Use `m.id` as `medalId`.
- If you want the existing "år"-badges to work, set `yearsRequired` on the node (same semantics as the current layout).
- If you want prerequisite lines to render, include `connections` that match the medal ids.

### 3) Register the preset in the layouts index

Open:
- `src/logic/layouts/index.js`

Add:
- an import for your new preset
- a `registerLayout(...)` call

Example:

```js
import { radialLayout } from './radial'

registerLayout(radialLayout)
```

Rules:
- `id` must be unique. The registry throws on duplicates.
- The default preset is controlled by `DEFAULT_LAYOUT_ID` in `src/logic/layouts/registry.js`.

### 4) (Optional) Add a minimal test for the new preset

Add a Jest test in `tests/` to ensure the preset is registered and returns a valid shape.

Example:

```js
import { getLayout } from '../src/logic/layouts'

test('radial layout preset exists', () => {
  const def = getLayout('radial')
  expect(def).toBeTruthy()
  expect(typeof def.generator).toBe('function')
})
```

If you want to validate output shape, call the generator with a small medal fixture and assert:
- `layout.medals` is an array
- each node has `medalId`, `x`, `y`, `radius`
- `layout.connections` is an array

### 5) How the canvas picks a preset (no UI required)

The canvas does not import a specific layout generator directly. Instead it uses:

- `useSkillTreeLayoutPreset()` — resolves the active preset id (currently persisted in localStorage)
- `useSkillTreeLayout(presetId)` — resolves the preset from the registry and generates the layout

Key files:
- `src/hooks/useSkillTreeLayoutPreset.js`
- `src/hooks/useSkillTreeLayout.js`
- `src/logic/layouts/registry.js`
- `src/logic/layouts/index.js`

This means:
- Adding a new preset does not require changes to the renderer.
- Once you add a UI selector later, it will call `setPresetId(...)` from `useSkillTreeLayoutPreset()`.

### 6) UX and performance guidelines (mobile-first)

When designing a new visualisation:
- Keep node spacing generous at the default zoom (mobile screens are small).
- Avoid layouts that require precision tapping; keep `radius` reasonable (hit testing uses radius).
- Prefer stable layouts (deterministic output) to avoid "jumping" between renders.
- Keep generator work out of the render path:
  - The app already memoizes layout generation via hooks.
  - If you add heavy computation (e.g. force-directed), keep iterations low and deterministic.
- Ensure the layout fits within reasonable bounds:
  - The canvas auto-fits based on node bounds, but extreme outliers can make everything tiny.

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

MIT
