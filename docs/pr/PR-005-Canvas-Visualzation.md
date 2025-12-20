# PR-005: Canvas Skill-Tree Visualization (React + Tailwind + Vite)

## DESCRIPTION
Implement an interactive canvas-based visualization of the medal skill-tree. Users can view medals as nodes, see prerequisite relationships as connections, pan/zoom the canvas, and click medals for details. This transforms the flat list view into an intuitive visual representation of medal progression paths.

## DEPENDENCIES
- PR-001: Project Setup & Medal Database
- PR-002: Data Layer & Storage System
- PR-003: Medal Achievement Calculator
- PR-004: UI Shell with React Router

## ACCEPTANCE CRITERIA
- [ ] Canvas element renders medal nodes as circles/badges
- [ ] Prerequisite relationships shown as connecting lines
- [ ] Nodes color-coded by status (unlocked/achievable/locked)
- [ ] Pan functionality with mouse drag
- [ ] Zoom functionality with mouse wheel
- [ ] Click medal node to show details modal
- [ ] Double-click to open achievement form
- [ ] Real-time updates as medals are unlocked
- [ ] Mobile touch gestures (pinch zoom, drag)
- [ ] Performance optimized (60 FPS at 50+ medals)
- [ ] Responsive canvas sizing
- [ ] Keyboard shortcuts (arrow keys to navigate)
- [ ] Export visualization as PNG

## FILES TO CREATE
- src/components/SkillTreeCanvas.jsx (main canvas component)
- src/hooks/useCanvasRenderer.js (canvas rendering logic)
- src/hooks/usePanZoom.js (pan/zoom state management)
- src/logic/canvasLayout.js (medal positioning algorithm)
- src/logic/canvasRenderer.js (drawing utilities)
- src/components/MedalDetailModal.jsx (medal detail popup)
- src/utils/canvasExport.js (PNG export functionality)
- src/pages/SkillTree.jsx (updated with canvas)
- tests/canvasLayout.test.js (positioning tests)
- tests/canvasRenderer.test.js (rendering tests)

## CODE STRUCTURE

### src/components/SkillTreeCanvas.jsx

```jsx
import React, { useRef, useEffect, useState } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { usePanZoom } from '../hooks/usePanZoom'
import { useCanvasRenderer } from '../hooks/useCanvasRenderer'
import { generateMedalLayout } from '../logic/canvasLayout'
import MedalDetailModal from './MedalDetailModal'

export default function SkillTreeCanvas() {
  const canvasRef = useRef(null)
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const { panX, panY, scale, handleWheel, handleMouseDown, resetView } = usePanZoom()
  const { render } = useCanvasRenderer()
  
  const [selectedMedal, setSelectedMedal] = useState(null)
  const [layout, setLayout] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Generate layout on first render
  useEffect(() => {
    if (medalDatabase && canvasRef.current) {
      const medals = medalDatabase.getAllMedals()
      const newLayout = generateMedalLayout(medals)
      setLayout(newLayout)
    }
  }, [medalDatabase])

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !layout || !medalDatabase) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Clear canvas
    ctx.fillStyle = '#fcfcf9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Render skill tree
    render(
      ctx,
      medalDatabase.getAllMedals(),
      layout,
      statuses,
      panX,
      panY,
      scale,
      selectedMedal
    )
  }, [layout, medalDatabase, statuses, panX, panY, scale, selectedMedal, render])

  // Handle mouse events
  const handleCanvasMouseDown = (e) => {
    setIsDragging(true)
    handleMouseDown(e)
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !canvasRef.current || !layout) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if hovering over a medal
    const medals = layout.medals
    for (const medal of medals) {
      const nodeX = (medal.x - panX) * scale
      const nodeY = (medal.y - panY) * scale
      const radius = (medal.radius || 20) * scale

      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2)
      if (distance < radius) {
        canvasRef.current.style.cursor = 'pointer'
        return
      }
    }

    canvasRef.current.style.cursor = 'grab'
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !layout) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check which medal was clicked
    const medals = layout.medals
    for (const medal of medals) {
      const nodeX = (medal.x - panX) * scale
      const nodeY = (medal.y - panY) * scale
      const radius = (medal.radius || 20) * scale

      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2)
      if (distance < radius) {
        setSelectedMedal(medal.medalId)
        return
      }
    }

    setSelectedMedal(null)
  }

  const handleExportPNG = () => {
    if (!canvasRef.current) return

    const link = document.createElement('a')
    link.href = canvasRef.current.toDataURL('image/png')
    link.download = `skill-tree-${new Date().toISOString().split('T')[0]}.png`
    link.click()
  }

  if (!layout || !medalDatabase) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-text-secondary">Loading skill tree...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Interactive Skill Tree</h2>
        <div className="space-x-2">
          <button
            onClick={resetView}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Reset View
          </button>
          <button
            onClick={handleExportPNG}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover"
          >
            📥 Export as PNG
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full bg-bg-primary cursor-grab active:cursor-grabbing"
          style={{ height: '600px' }}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onClick={handleCanvasClick}
        />
      </div>

      <div className="text-sm text-text-secondary">
        <p>💡 Drag to pan • Scroll to zoom • Click medals for details</p>
      </div>

      {selectedMedal && (
        <MedalDetailModal
          medalId={selectedMedal}
          onClose={() => setSelectedMedal(null)}
        />
      )}
    </div>
  )
}
```

### src/hooks/usePanZoom.js

```javascript
import { useState, useCallback } from 'react'

export function usePanZoom(initialScale = 1, minScale = 0.5, maxScale = 3) {
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [scale, setScale] = useState(initialScale)
  const [dragStart, setDragStart] = useState(null)

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(minScale, Math.min(maxScale, scale * delta))
    
    setScale(newScale)
  }, [scale, minScale, maxScale])

  const handleMouseDown = useCallback((e) => {
    setDragStart({ x: e.clientX, y: e.clientY, panX, panY })
  }, [panX, panY])

  const handleMouseMove = useCallback((e) => {
    if (dragStart) {
      const deltaX = (e.clientX - dragStart.x) / scale
      const deltaY = (e.clientY - dragStart.y) / scale
      setPanX(dragStart.panX + deltaX)
      setPanY(dragStart.panY + deltaY)
    }
  }, [dragStart, scale])

  const resetView = useCallback(() => {
    setPanX(0)
    setPanY(0)
    setScale(initialScale)
  }, [initialScale])

  return {
    panX,
    panY,
    scale,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    resetView
  }
}
```

### src/logic/canvasLayout.js

```javascript
/**
 * Force-directed layout algorithm for skill tree visualization
 * Positions medals to minimize edge crossings and spread nodes
 */
export function generateMedalLayout(medals) {
  // Group medals by type
  const medalsByType = {}
  medals.forEach(medal => {
    if (!medalsByType[medal.type]) {
      medalsByType[medal.type] = []
    }
    medalsByType[medal.type].push(medal)
  })

  // Arrange by type columns
  const types = Object.keys(medalsByType)
  const columnWidth = 200
  const rowHeight = 150

  const layout = {
    medals: [],
    connections: []
  }

  let x = 0
  types.forEach((type, typeIndex) => {
    const typeMedals = medalsByType[type]
    
    let y = 0
    typeMedals.forEach((medal, medalIndex) => {
      layout.medals.push({
        medalId: medal.id,
        displayName: medal.displayName,
        tier: medal.tier,
        type: medal.type,
        x: x + columnWidth * typeIndex,
        y: y + rowHeight * medalIndex,
        radius: 25
      })

      // Add prerequisites as connections
      medal.prerequisites?.forEach(prereq => {
        if (prereq.type === 'medal') {
          layout.connections.push({
            from: prereq.medalId,
            to: medal.id,
            type: 'prerequisite'
          })
        }
      })
    })
  })

  // Apply force-directed refinement (optional, expensive)
  return refineLayout(layout, medals)
}

function refineLayout(layout, medals) {
  // Simple repulsion: spread nodes apart
  const iterations = 5
  const repulsion = 100
  const attraction = 20

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < layout.medals.length; i++) {
      for (let j = i + 1; j < layout.medals.length; j++) {
        const m1 = layout.medals[i]
        const m2 = layout.medals[j]

        const dx = m2.x - m1.x
        const dy = m2.y - m1.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        const force = repulsion / (dist * dist)
        
        const moveX = (dx / dist) * force * 0.1
        const moveY = (dy / dist) * force * 0.1

        m1.x -= moveX
        m1.y -= moveY
        m2.x += moveX
        m2.y += moveY
      }
    }
  }

  return layout
}
```

### src/logic/canvasRenderer.js

```javascript
/**
 * Canvas rendering utilities
 */
export const COLORS = {
  unlocked: '#FFD700',
  achievable: '#32b8c6',
  locked: '#cccccc',
  text: '#133452',
  connection: '#98a0a3',
  border: '#5e5240'
}

export function drawMedalNode(ctx, x, y, radius, medal, status, scale) {
  const statusColor = COLORS[status?.status || 'locked']
  
  // Draw circle
  ctx.fillStyle = statusColor
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Draw border
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 2 / scale
  ctx.stroke()

  // Draw text
  ctx.fillStyle = COLORS.text
  ctx.font = `${12 / scale}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const displayText = medal.displayName.split(' ')[0]
  ctx.fillText(displayText, x, y - 5 / scale)
  
  ctx.font = `${10 / scale}px sans-serif`
  ctx.fillText(medal.tier, x, y + 5 / scale)
}

export function drawConnection(ctx, x1, y1, x2, y2, type = 'prerequisite', scale) {
  ctx.strokeStyle = COLORS.connection
  ctx.lineWidth = 2 / scale
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  // Draw arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const arrowSize = 10 / scale
  
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI / 6), y2 - arrowSize * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI / 6), y2 - arrowSize * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fillStyle = COLORS.connection
  ctx.fill()
}
```

### src/hooks/useCanvasRenderer.js

```javascript
import { useCallback } from 'react'
import { drawMedalNode, drawConnection } from '../logic/canvasRenderer'

export function useCanvasRenderer() {
  const render = useCallback((
    ctx,
    medals,
    layout,
    statuses,
    panX,
    panY,
    scale,
    selectedMedal
  ) => {
    if (!layout || !medals) return

    // Create medal map for quick lookup
    const medalMap = {}
    medals.forEach(m => medalMap[m.id] = m)

    // Draw connections first (so they appear behind nodes)
    layout.connections?.forEach(conn => {
      const fromMedal = layout.medals.find(m => m.medalId === conn.from)
      const toMedal = layout.medals.find(m => m.medalId === conn.to)

      if (fromMedal && toMedal) {
        const x1 = (fromMedal.x - panX) * scale + ctx.canvas.width / 2
        const y1 = (fromMedal.y - panY) * scale + ctx.canvas.height / 2
        const x2 = (toMedal.x - panX) * scale + ctx.canvas.width / 2
        const y2 = (toMedal.y - panY) * scale + ctx.canvas.height / 2

        drawConnection(ctx, x1, y1, x2, y2, conn.type, scale)
      }
    })

    // Draw medal nodes
    layout.medals?.forEach(medalNode => {
      const medal = medalMap[medalNode.medalId]
      if (!medal) return

      const x = (medalNode.x - panX) * scale + ctx.canvas.width / 2
      const y = (medalNode.y - panY) * scale + ctx.canvas.height / 2
      const radius = medalNode.radius * scale

      // Find status for this medal
      const status = statuses.unlocked.find(s => s.medalId === medal.id) ||
                     statuses.achievable.find(s => s.medalId === medal.id) ||
                     statuses.locked.find(s => s.medalId === medal.id)

      // Highlight selected medal
      if (selectedMedal === medal.id) {
        ctx.strokeStyle = '#ff6b6b'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2)
        ctx.stroke()
      }

      drawMedalNode(ctx, x, y, radius, medalNode, status, scale)
    })
  }, [])

  return { render }
}
```

### src/components/MedalDetailModal.jsx

```jsx
import React from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useMedalStatus } from '../hooks/useMedalCalculator'
import { useProfile } from '../hooks/useProfile'

export default function MedalDetailModal({ medalId, onClose }) {
  const { medalDatabase } = useMedalDatabase()
  const status = useMedalStatus(medalId)
  const { currentProfile, addAchievement } = useProfile()
  const medal = medalDatabase?.getMedalById(medalId)

  if (!medal) return null

  const statusLabel = {
    unlocked: '🏆 Unlocked',
    achievable: '🎯 Achievable',
    locked: '🔒 Locked'
  }[status?.status] || 'Unknown'

  const handleAddAchievement = () => {
    // Will be integrated with AchievementForm
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-text-primary">
              {medal.displayName}
            </h3>
            <p className="text-sm text-text-secondary">
              {medal.type} • {medal.tier}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
            status?.status === 'unlocked' ? 'bg-yellow-100 text-yellow-800' :
            status?.status === 'achievable' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusLabel}
          </span>
        </div>

        {medal.description && (
          <div className="mb-4">
            <p className="text-text-secondary">{medal.description}</p>
          </div>
        )}

        {status?.details?.missingItems?.length > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Missing Prerequisites:
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              {status.details.missingItems.map((item, i) => (
                <li key={i}>• {item.description}</li>
              ))}
            </ul>
          </div>
        )}

        {status?.details?.items?.length > 0 && (
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded p-3">
            <p className="text-sm font-semibold text-text-primary mb-2">
              Requirements:
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              {status.details.items.map((item, i) => (
                <li key={i}>
                  {item.isMet ? '✓' : '○'} {item.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
          {status?.status === 'achievable' && currentProfile && (
            <button
              onClick={handleAddAchievement}
              className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover"
            >
              Add Achievement
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### src/pages/SkillTree.jsx (updated)

```jsx
import React, { useState } from 'react'
import SkillTreeCanvas from '../components/SkillTreeCanvas'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'

export default function SkillTree() {
  const [viewMode, setViewMode] = useState('canvas') // 'canvas' or 'stats'
  const statuses = useAllMedalStatuses()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Skill Tree</h1>
        <div className="space-x-2">
          <button
            onClick={() => setViewMode('canvas')}
            className={`px-4 py-2 rounded ${
              viewMode === 'canvas'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            🎨 Canvas View
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-4 py-2 rounded ${
              viewMode === 'stats'
                ? 'bg-primary text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            📊 Stats View
          </button>
        </div>
      </div>

      {viewMode === 'canvas' ? (
        <SkillTreeCanvas />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <h3 className="font-bold text-yellow-900 mb-2">Unlocked</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {statuses.unlocked.length}
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Medals you've already earned
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="font-bold text-green-900 mb-2">Achievable</h3>
            <p className="text-3xl font-bold text-green-600">
              {statuses.achievable.length}
            </p>
            <p className="text-sm text-green-700 mt-2">
              Next medals you can unlock
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">Locked</h3>
            <p className="text-3xl font-bold text-gray-600">
              {statuses.locked.length}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Future goals to work toward
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
```

### tests/canvasLayout.test.js

```javascript
import { generateMedalLayout } from '../src/logic/canvasLayout'
import { Medal } from '../src/models/Medal'

describe('Canvas Layout Algorithm', () => {
  test('generates layout for medals', () => {
    const medals = [
      new Medal({
        id: 'medal-1',
        type: 'pistol_mark',
        tier: 'bronze',
        displayName: 'Medal 1',
        prerequisites: []
      }),
      new Medal({
        id: 'medal-2',
        type: 'pistol_mark',
        tier: 'silver',
        displayName: 'Medal 2',
        prerequisites: [{ type: 'medal', medalId: 'medal-1' }]
      })
    ]

    const layout = generateMedalLayout(medals)

    expect(layout.medals.length).toBe(2)
    expect(layout.connections.length).toBeGreaterThan(0)
  })

  test('positions medals with coordinates', () => {
    const medals = [
      new Medal({
        id: 'medal-1',
        type: 'type1',
        tier: 'bronze',
        displayName: 'Medal 1',
        prerequisites: []
      })
    ]

    const layout = generateMedalLayout(medals)
    const medal = layout.medals[0]

    expect(medal.x).toBeDefined()
    expect(medal.y).toBeDefined()
    expect(medal.radius).toBeDefined()
  })

  test('creates connections for prerequisites', () => {
    const medals = [
      new Medal({
        id: 'medal-1',
        type: 'type1',
        tier: 'bronze',
        displayName: 'Medal 1',
        prerequisites: []
      }),
      new Medal({
        id: 'medal-2',
        type: 'type2',
        tier: 'silver',
        displayName: 'Medal 2',
        prerequisites: [{ type: 'medal', medalId: 'medal-1' }]
      })
    ]

    const layout = generateMedalLayout(medals)
    const connection = layout.connections.find(c => c.from === 'medal-1')

    expect(connection).toBeDefined()
    expect(connection.to).toBe('medal-2')
  })
})
```

## DESIGN DOCUMENT REFERENCES
- **03-Interaction-Design.md** - Skill-Tree View section
- **04-Visual-Design.md** - Color system, responsive design
- **05-Technical-Architecture.md** - Canvas rendering layer

## PERFORMANCE CONSIDERATIONS
- Canvas rendering optimized with requestAnimationFrame
- useMemo for expensive calculations
- Lazy loading of medal details
- Debounced pan/zoom events
- WebGL fallback for older browsers

## DONE WHEN
- Canvas renders without lag (60 FPS)
- Pan and zoom work smoothly
- Click detection accurate on all medal sizes
- Export to PNG working
- Mobile touch gestures responsive
- All tests pass
- No console errors
