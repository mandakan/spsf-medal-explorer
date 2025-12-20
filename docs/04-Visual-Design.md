# Medal Skill-Tree Explorer App
## Visual Design & UI Specification

---

## Design Philosophy

**Core Principles**:
1. **Game-Inspired**: Borrow visual language from strategy games (Civilization, Age of Empires)
2. **Clear Hierarchy**: Medal progression paths immediately obvious
3. **Mobile-First**: Responsive, touch-friendly, minimal scrolling
4. **Minimal Decoration**: Function over form, but beautiful
5. **Accessibility**: High contrast, clear labels, keyboard accessible

---

## Color System

### Primary Colors

| Usage | Color | Hex | RGB |
|-------|-------|-----|-----|
| **Achievement Unlocked** | Bright Gold | #FFD700 | 255,215,0 |
| **Achievable** | Bright Teal | #20C997 | 32,201,151 |
| **Locked** | Cool Gray | #6C757D | 108,117,125 |
| **Primary Action** | Deep Teal | #0D6E6E | 13,110,110 |
| **Accent** | Warm Orange | #FF9500 | 255,149,0 |
| **Error** | Alert Red | #DC3545 | 220,53,69 |
| **Success** | Confirmation Green | #28A745 | 40,167,69 |

### Medal Tier Colors

| Tier | Primary | Secondary | Text |
|------|---------|-----------|------|
| **Bronze** | #CD7F32 | #D4A574 | White |
| **Silver** | #C0C0C0 | #E8E8E8 | Dark |
| **Gold** | #FFD700 | #FFF8DC | Dark |
| **Star 1** | #87CEEB | #B0E0E6 | Dark |
| **Star 2** | #4169E1 | #6A5ACD | White |
| **Star 3** | #9370DB | #DDA0DD | White |

### Weapon Group Colors

| Group | Color | Usage |
|-------|-------|-------|
| **A** | #3498DB | Blue badge/label |
| **B** | #E74C3C | Red badge/label |
| **C** | #F39C12 | Orange badge/label |
| **R** | #9B59B6 | Purple badge/label |

### Background & Surfaces

| Element | Light Mode | Dark Mode |
|---------|-----------|----------|
| **App Background** | #FFFFFF | #1A1A1A |
| **Card/Surface** | #F8F9FA | #2D2D2D |
| **Border** | #E9ECEF | #404040 |
| **Text Primary** | #212529 | #FFFFFF |
| **Text Secondary** | #6C757D | #B0B0B0 |

---

## Typography

### Font Families

```css
/* Header/Display */
font-family: 'Segoe UI', 'Roboto', sans-serif;
font-weight: 600-700;

/* Body/UI */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
font-weight: 400-500;

/* Monospace (data display) */
font-family: 'Monaco', 'Menlo', monospace;
```

### Font Sizes & Styles

| Element | Size | Weight | Line Height | Use Case |
|---------|------|--------|-------------|----------|
| **H1** | 32px | 700 | 1.2 | App title, page headers |
| **H2** | 24px | 600 | 1.3 | Section titles |
| **H3** | 18px | 600 | 1.4 | Subsection titles |
| **Body** | 14px | 400 | 1.5 | Main content text |
| **Small** | 12px | 400 | 1.4 | Labels, captions |
| **XSmall** | 11px | 400 | 1.3 | Footnotes, hints |
| **Medal Name** | 16px | 600 | 1.3 | Medal nodes, cards |
| **Status** | 13px | 500 | 1.4 | Achievement status |

---

## Component Specifications

### Medal Node (Skill-Tree)

**Sizes**:
- **Desktop**: 60px diameter
- **Tablet**: 50px diameter
- **Mobile**: 45px diameter

**States**:

```
1. UNLOCKED (Achieved)
   ╔═══════╗
   ║  ✓    ║ Bright Gold background
   ║ BRNZ  ║ White text
   ║PISTOL ║ Small check mark
   ╚═══════╝

2. ACHIEVABLE (Can achieve now)
   ╔═══════╗
   ║  ◆    ║ Bright Teal background
   ║ SILV  ║ White text
   ║PISTOL ║ Diamond icon
   ╚═══════╝

3. LOCKED (Blocked)
   ╔═══════╗
   ║  ⊘    ║ Gray background, 60% opacity
   ║ GOLD  ║ Lighter gray text
   ║PISTOL ║ Lock or X icon
   ╚═══════╝

4. HOVER/FOCUS (Interactive)
   ╔═══════╗
   ║  ◆    ║ Enhanced shadow
   ║ SILV  ║ Scale: 1.1x
   ║PISTOL ║ Glow effect
   ╚═══════╝
```

**Styling**:
```css
.medal-node {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  position: relative;
}

.medal-node.unlocked {
  background: linear-gradient(135deg, #FFD700 0%, #FFC700 100%);
  color: #333;
}

.medal-node.achievable {
  background: linear-gradient(135deg, #20C997 0%, #17A2B8 100%);
  color: white;
  animation: pulse-glow 2s infinite;
}

.medal-node.locked {
  background: #6C757D;
  color: #999;
  opacity: 0.6;
}

.medal-node:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(32,201,151,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(32,201,151,0); }
}
```

**Icon Styling**:
- **Check (✓)**: 20px, weight 3px
- **Diamond (◆)**: 16px
- **Lock (⊘)**: 20px, weight 2px

---

### Medal Card (List View)

**Layout**:
```
╭─────────────────────────────────────────╮
│ [Icon] Medal Name          [Status ◆]   │
├─────────────────────────────────────────┤
│ Type: Pistol Mark | Tier: Silver        │
│ Achievement: 1 of 1 gold series         │
│                                         │
│ Status Details:                         │
│ ✓ Prerequisite: Bronze Mark (achieved)  │
│ ✓ Requirement: 38+ pts Group A (42 pts) │
│                                         │
│                         [See Details →] │
╰─────────────────────────────────────────╯
```

**Styling**:
```css
.medal-card {
  border: 1px solid #E9ECEF;
  border-radius: 8px;
  padding: 16px;
  background: #F8F9FA;
  margin-bottom: 12px;
  transition: all 200ms ease;
  cursor: pointer;
}

.medal-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
  border-color: #0D6E6E;
}

.medal-card.unlocked {
  background: rgba(255,215,0,0.1);
  border-left: 4px solid #FFD700;
}

.medal-card.achievable {
  background: rgba(32,201,151,0.1);
  border-left: 4px solid #20C997;
}

.medal-card.locked {
  opacity: 0.7;
}

.medal-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.medal-card__title {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

.medal-card__status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(0,0,0,0.05);
}

.medal-card__meta {
  font-size: 12px;
  color: #6C757D;
  margin-bottom: 8px;
}
```

---

### Badges & Status Indicators

**Status Badge**:
```
Unlocked:   [✓ Unlocked] Gold background, white text
Achievable: [◆ Achievable] Teal background, white text
Locked:     [⊘ Locked] Gray background, dark text
```

**Weapon Group Badges**:
```
[A]  [B]  [C]  [R]
Blue Red  Orange Purple
```

**Tier Badges**:
```
[Bronze]  [Silver]  [Gold]  [★]  [★★]  [★★★]
```

---

### Forms & Input Fields

**Text Input**:
```css
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E9ECEF;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 200ms ease;
}

.form-input:focus {
  outline: none;
  border-color: #0D6E6E;
  box-shadow: 0 0 0 3px rgba(13,110,110,0.1);
}

.form-input.error {
  border-color: #DC3545;
  background-color: rgba(220,53,69,0.05);
}

.form-input.success {
  border-color: #28A745;
  background-color: rgba(40,167,69,0.05);
}
```

**Select Dropdown**:
```css
.form-select {
  padding: 10px 12px;
  border: 1px solid #E9ECEF;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
}

.form-select:focus {
  border-color: #0D6E6E;
  box-shadow: 0 0 0 3px rgba(13,110,110,0.1);
}
```

**Checkbox**:
```css
.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #0D6E6E;
}

.form-checkbox:focus {
  outline: 2px solid #0D6E6E;
  outline-offset: 2px;
}
```

---

### Buttons

**Primary Button**:
```css
.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #0D6E6E 0%, #095555 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(13,110,110,0.3);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(13,110,110,0.2);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Secondary Button**:
```css
.btn-secondary {
  padding: 10px 20px;
  background: #E9ECEF;
  color: #212529;
  border: 1px solid #DEE2E6;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-secondary:hover {
  background: #DEE2E6;
}
```

**Ghost Button** (for less important actions):
```css
.btn-ghost {
  padding: 10px 20px;
  background: transparent;
  color: #0D6E6E;
  border: 1px solid #0D6E6E;
  border-radius: 6px;
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-ghost:hover {
  background: rgba(13,110,110,0.05);
}
```

---

### Modals & Overlays

**Modal Dialog**:
```css
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  animation: slide-up 300ms ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile: Full-width bottom sheet */
@media (max-width: 768px) {
  .modal-content {
    border-radius: 16px 16px 0 0;
    max-width: 100%;
    max-height: 80vh;
    animation: slide-up-mobile 300ms ease;
  }
  
  @keyframes slide-up-mobile {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
}
```

---

### Cards & Panels

**Info Card**:
```css
.card {
  border: 1px solid #E9ECEF;
  border-radius: 8px;
  padding: 16px;
  background: #F8F9FA;
  margin-bottom: 16px;
}

.card.success {
  border-left: 4px solid #28A745;
  background: rgba(40,167,69,0.05);
}

.card.warning {
  border-left: 4px solid #FF9500;
  background: rgba(255,149,0,0.05);
}

.card.error {
  border-left: 4px solid #DC3545;
  background: rgba(220,53,69,0.05);
}
```

---

## Canvas/Skill-Tree Styling

**Connection Lines**:
```css
.medal-connection {
  stroke: #CCC;
  stroke-width: 2px;
  fill: none;
  marker-end: url(#arrowhead);
}

.medal-connection.active {
  stroke: #0D6E6E;
  stroke-width: 3px;
  animation: dash 20s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -20px;
  }
}

.medal-connection.disabled {
  stroke: #E9ECEF;
  stroke-width: 1px;
}
```

**Canvas Background**:
```css
.canvas-container {
  background: linear-gradient(135deg, #FAFBFC 0%, #F0F2F5 100%);
  position: relative;
  overflow: hidden;
}

/* Subtle grid pattern (optional) */
.canvas-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}
```

---

## Responsive Breakpoints

| Device | Width | Changes |
|--------|-------|---------|
| **Mobile** | <768px | Single column, full-width cards, large touch targets |
| **Tablet** | 768-1024px | Two-column layout, detail panel below |
| **Desktop** | >1024px | Split layout, detail panel beside |

**Canvas Adjustments by Screen Size**:
- **Mobile**: 45px nodes, 1x zoom default
- **Tablet**: 50px nodes, 0.8x zoom default
- **Desktop**: 60px nodes, 1x zoom default

---

## Dark Mode

**Color Overrides**:
```css
@media (prefers-color-scheme: dark) {
  body {
    background: #1A1A1A;
    color: #FFFFFF;
  }
  
  .card {
    background: #2D2D2D;
    border-color: #404040;
  }
  
  .form-input {
    background: #383838;
    border-color: #404040;
    color: #FFFFFF;
  }
  
  .medal-card {
    background: #2D2D2D;
    border-color: #404040;
  }
  
  /* Medal nodes stay same colors (self-illuminating) */
}
```

---

## Animation Guidelines

**Duration Standards**:
- **Micro-interactions**: 100-200ms
- **View transitions**: 300-400ms
- **Modal animations**: 300ms
- **Loops**: 2-3 seconds

**Easing Functions**:
- **Standard**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-in-out)
- **Entrance**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (ease-out-back)
- **Emphasis**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` (elastic)

**Reduced Motion**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Spacing System

**Standard Spacing**:
- **4px**: Micro spacing (between icons, tight groups)
- **8px**: Base unit (between form fields)
- **12px**: Compact spacing
- **16px**: Standard spacing (card padding, margin between elements)
- **24px**: Generous spacing (section padding)
- **32px**: Large spacing (between major sections)

---

## Icon Specifications

**Icon Library**: Material Design Icons or similar

**Common Icons**:
- ✓ Check (unlocked)
- ◆ Diamond (achievable)
- ⊘ Lock (locked)
- ⚙ Settings
- 📊 Chart/Stats
- 💾 Save/Export
- 📥 Import
- ? Help
- × Close

**Size Standards**:
- **16px**: Inline icons in text
- **20px**: Button icons
- **24px**: Nav icons
- **32px**: Large icons in modals

---

## Print Styles

```css
@media print {
  .btn, .modal, .sticky-header {
    display: none;
  }
  
  .medal-card {
    page-break-inside: avoid;
  }
  
  body {
    background: white;
    color: black;
  }
}
```

---

## Performance Optimizations

- **Icon fonts**: Use SVG + CSS instead of image files
- **Shadows**: Use box-shadow (GPU accelerated) vs drop-shadow filter
- **Transforms**: Use `transform` and `opacity` for animations (GPU accelerated)
- **Images**: Lazy load medal images, use WebP with fallback
- **Canvas**: Use requestAnimationFrame for smooth 60fps animations
