import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { usePanZoom } from '../hooks/usePanZoom'
import { useCanvasRenderer } from '../hooks/useCanvasRenderer'
import { generateMedalLayout } from '../logic/canvasLayout'
import MedalDetailModal from './MedalDetailModal'
import { exportCanvasToPNG } from '../utils/canvasExport'

export default function SkillTreeCanvas() {
  const canvasRef = useRef(null)
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const { panX, panY, scale, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd, resetView } = usePanZoom()
  const { render } = useCanvasRenderer()
  
  const [selectedMedal, setSelectedMedal] = useState(null)
  const [layout, setLayout] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Determine which medals are visible in the current viewport for culling
  const getVisibleMedalsForCanvas = (canvas, margin = 120) => {
    if (!layout || !canvas) return []
    const width = canvas.width
    const height = canvas.height
    const medals = layout.medals || []
    const result = []
    for (let i = 0; i < medals.length; i++) {
      const m = medals[i]
      const nodeX = (m.x + panX) * scale + width / 2
      const nodeY = (m.y + panY) * scale + height / 2
      const r = (m.radius || 20) * scale
      if (
        nodeX + r >= -margin &&
        nodeX - r <= width + margin &&
        nodeY + r >= -margin &&
        nodeY - r <= height + margin
      ) {
        result.push(m)
      }
    }
    return result
  }

  // Generate layout on first render or when database changes
  useEffect(() => {
    if (medalDatabase) {
      const medals = medalDatabase.getAllMedals()
      const newLayout = generateMedalLayout(medals)
      setLayout(newLayout)
    }
  }, [medalDatabase])

  const draw = useCallback(() => {
    if (!canvasRef.current || !layout || !medalDatabase) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Resize canvas to match container size
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
      canvas.width = Math.floor(rect.width)
      canvas.height = Math.floor(rect.height)
    }

    // Clear canvas with computed background color to respect light/dark themes
    const bgColor = getComputedStyle(canvas).backgroundColor || '#fcfcf9'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Render skill tree with view culling for performance
    const allMedals = medalDatabase.getAllMedals()
    const visibleMedals = getVisibleMedalsForCanvas(canvas)
    const visibleIds = new Set(visibleMedals.map(m => m.medalId))
    const filteredLayout = { ...layout, medals: visibleMedals }
    const filteredMedals = allMedals.filter(m => visibleIds.has(m.id))

    render(
      ctx,
      filteredMedals,
      filteredLayout,
      statuses,
      panX,
      panY,
      scale,
      selectedMedal
    )
  }, [layout, medalDatabase, statuses, panX, panY, scale, selectedMedal, render])

  // Draw with requestAnimationFrame for smoothness
  useEffect(() => {
    let raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [draw])

  // Redraw on window resize
  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) draw()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  // Keyboard pan shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      const step = 50 / Math.max(scale, 0.001)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
      }
      if (e.key === 'ArrowLeft') {
        handleMouseMove({ clientX: 0, clientY: 0, syntheticPan: { dx: -step, dy: 0 } })
      } else if (e.key === 'ArrowRight') {
        handleMouseMove({ clientX: 0, clientY: 0, syntheticPan: { dx: step, dy: 0 } })
      } else if (e.key === 'ArrowUp') {
        handleMouseMove({ clientX: 0, clientY: 0, syntheticPan: { dx: 0, dy: -step } })
      } else if (e.key === 'ArrowDown') {
        handleMouseMove({ clientX: 0, clientY: 0, syntheticPan: { dx: 0, dy: step } })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleMouseMove, scale])

  // Mouse events
  const handleCanvasMouseDown = (e) => {
    setIsDragging(true)
    handleMouseDown(e)
  }

  const handleCanvasMouseMove = (e) => {
    if (isDragging) {
      handleMouseMove(e)
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
      return
    }

    if (!canvasRef.current || !layout) return

    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Hover hit test uses same transform as renderer (centered origin)
    const visibleMedals = getVisibleMedalsForCanvas(canvasRef.current)
    for (const medal of visibleMedals) {
      const nodeX = (medal.x + panX) * scale + canvasRef.current.width / 2
      const nodeY = (medal.y + panY) * scale + canvasRef.current.height / 2
      const radius = (medal.radius || 20) * scale
      const dx = mouseX - nodeX
      const dy = mouseY - nodeY
      if (dx * dx + dy * dy < radius * radius) {
        canvasRef.current.style.cursor = 'pointer'
        return
      }
    }
    canvasRef.current.style.cursor = 'grab'
  }

  const handleCanvasMouseUp = (e) => {
    setIsDragging(false)
    handleMouseUp(e)
  }

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !layout) return

    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Determine clicked medal node (use culled set)
    const visibleMedals = getVisibleMedalsForCanvas(canvasRef.current)
    for (const medal of visibleMedals) {
      const nodeX = (medal.x + panX) * scale + canvasRef.current.width / 2
      const nodeY = (medal.y + panY) * scale + canvasRef.current.height / 2
      const radius = (medal.radius || 20) * scale
      const dx = mouseX - nodeX
      const dy = mouseY - nodeY
      if (dx * dx + dy * dy < radius * radius) {
        setSelectedMedal(medal.medalId)
        return
      }
    }
    setSelectedMedal(null)
  }

  const handleCanvasDoubleClick = (e) => {
    if (!canvasRef.current || !layout) return

    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const visibleMedals = getVisibleMedalsForCanvas(canvasRef.current)
    for (const medal of visibleMedals) {
      const nodeX = (medal.x + panX) * scale + canvasRef.current.width / 2
      const nodeY = (medal.y + panY) * scale + canvasRef.current.height / 2
      const radius = (medal.radius || 20) * scale
      const dx = mouseX - nodeX
      const dy = mouseY - nodeY
      if (dx * dx + dy * dy < radius * radius) {
        // Dispatch a custom event that can be handled by an achievement form
        window.dispatchEvent(new CustomEvent('openAchievementForm', { detail: { medalId: medal.medalId } }))
        setSelectedMedal(medal.medalId)
        return
      }
    }
  }

  const handleExportPNG = () => {
    if (!canvasRef.current) return
    exportCanvasToPNG(canvasRef.current, `skill-tree-${new Date().toISOString().split('T')[0]}.png`)
  }

  if (!medalDatabase) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-live="polite" aria-busy="true">
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
            aria-label="Reset view"
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Reset View
          </button>
          <button
            onClick={handleExportPNG}
            aria-label="Export skill tree as PNG"
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            📥 Export as PNG
          </button>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900" role="region" aria-label="Skill tree canvas">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Interactive skill tree canvas"
          className="w-full h-[60vh] sm:h-[600px] bg-bg-primary cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      <div className="text-sm text-text-secondary">
        <p>💡 Drag to pan • Scroll to zoom • Click medals for details • ⌨️ Arrow keys to pan</p>
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
