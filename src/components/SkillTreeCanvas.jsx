import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
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
  const { panX, panY, scale, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, resetView } = usePanZoom()
  const { render } = useCanvasRenderer()
  
  const [selectedMedal, setSelectedMedal] = useState(null)
  const layout = useMemo(() => {
    if (!medalDatabase) return null
    const medals = medalDatabase.getAllMedals()
    return generateMedalLayout(medals)
  }, [medalDatabase])
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const closeBtnRef = useRef(null)
  const prevFocusRef = useRef(null)

  // Determine which medals are visible in the current viewport for culling
  const getVisibleMedalsForCanvas = useCallback((canvas, margin = 120) => {
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
  }, [layout, panX, panY, scale])


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
  }, [getVisibleMedalsForCanvas, layout, medalDatabase, statuses, panX, panY, scale, selectedMedal, render])

  // Ensure first frame renders whenever a canvas node is attached
  const setCanvasRef = useCallback((node) => {
    canvasRef.current = node
    if (node) {
      requestAnimationFrame(draw)
    }
  }, [draw])

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

  // Fullscreen: lock page scroll, focus close, restore on exit, allow Esc to close
  useEffect(() => {
    if (!isFullscreen) return
    prevFocusRef.current = document.activeElement
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'

    closeBtnRef.current?.focus?.()

    const onEsc = (e) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('keydown', onEsc)
      root.style.overflow = previousOverflow
      const el = prevFocusRef.current
      if (el && typeof el.focus === 'function') {
        el.focus()
      }
    }
  }, [isFullscreen])

  // Redraw on fullscreen toggle to ensure immediate render after mount
  useEffect(() => {
    if (canvasRef.current) {
      requestAnimationFrame(draw)
    }
  }, [isFullscreen, draw])

  // Keyboard pan shortcuts (scope to focused canvas for WCAG 2.1/2.2)
  const handleCanvasKeyDown = useCallback((e) => {
    const step = 50 / Math.max(scale, 0.001)
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
    }
    if (e.key === 'ArrowLeft') {
      handlePointerMove({ syntheticPan: { dx: -step, dy: 0 } })
    } else if (e.key === 'ArrowRight') {
      handlePointerMove({ syntheticPan: { dx: step, dy: 0 } })
    } else if (e.key === 'ArrowUp') {
      handlePointerMove({ syntheticPan: { dx: 0, dy: -step } })
    } else if (e.key === 'ArrowDown') {
      handlePointerMove({ syntheticPan: { dx: 0, dy: step } })
    }
  }, [handlePointerMove, scale])

  // Pointer events
  const handleCanvasPointerDown = (e) => {
    setIsDragging(true)
    handlePointerDown(e)
  }

  const handleCanvasPointerMove = (e) => {
    if (isDragging) {
      handlePointerMove(e)
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
      const effectiveRadius = Math.max(radius, 24)
      const dx = mouseX - nodeX
      const dy = mouseY - nodeY
      if (dx * dx + dy * dy < effectiveRadius * effectiveRadius) {
        canvasRef.current.style.cursor = 'pointer'
        return
      }
    }
    canvasRef.current.style.cursor = 'grab'
  }

  const handleCanvasPointerUp = (e) => {
    setIsDragging(false)
    handlePointerUp(e)
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
      const effectiveRadius = Math.max(radius, 24)
      const dx = mouseX - nodeX
      const dy = mouseY - nodeY
      if (dx * dx + dy * dy < effectiveRadius * effectiveRadius) {
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
      const effectiveRadius = Math.max(radius, 24)
      const dx = mouseX - nodeX
      const dy = mouseY - nodeY
      if (dx * dx + dy * dy < effectiveRadius * effectiveRadius) {
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
        <p className="text-text-secondary">Laddar medalj-träd...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Interaktiv träd-vy</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetView}
            className="px-4 py-3 rounded bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
          >
            Återställ
          </button>
          <button
            type="button"
            onClick={handleExportPNG}
            className="px-4 py-3 rounded bg-primary text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
          >
            <span aria-hidden="true" className="mr-2">📥</span>
            Exportera som PNG
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="px-4 py-3 rounded bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
            aria-haspopup="dialog"
            aria-controls="skilltree-fullscreen"
          >
            Helskärm
          </button>
        </div>
      </div>

      <div className="card overflow-hidden overscroll-contain" role="region" aria-label="Medaljträd canvas" aria-describedby="skilltree-help">
        {!isFullscreen && (
          <canvas
            ref={setCanvasRef}
            role="img"
            aria-label="Interaktiv träd-vy-canvas"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            tabIndex={0}
            onKeyDown={handleCanvasKeyDown}
            className="w-full h-[60vh] sm:h-[600px] bg-background cursor-grab active:cursor-grabbing touch-none select-none"
            onContextMenu={(e) => e.preventDefault()}
            onWheel={handleWheel}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
          />
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <p id="skilltree-help">💡 Dra för att panorera • Nyp för att zooma • Klicka på medaljer för detaljer • ⌨️ Piltangenter för att panorera</p>
      </div>

      {isFullscreen && (
        <div
          id="skilltree-fullscreen"
          className="fixed inset-0 z-50 bg-background overscroll-contain flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Helskärms träd-vy"
        >
          <div
            className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-300 dark:border-slate-700 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}
          >
            <h2 className="text-lg font-semibold text-text-primary">Medaljträd</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetView}
                className="px-3 py-2 rounded bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              >
                Återställ
              </button>
              <button
                type="button"
                onClick={handleExportPNG}
                className="px-3 py-2 rounded bg-primary text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
              >
                Exportera
              </button>
              <button
                type="button"
                ref={closeBtnRef}
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-2 rounded bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                aria-label="Close fullscreen"
              >
                Stäng
              </button>
            </div>
          </div>

          <div className="flex-1">
            <canvas
              ref={setCanvasRef}
              role="img"
              aria-label="Interaktiv träd-vy-canvas"
              aria-describedby="skilltree-help-fs"
              aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
              tabIndex={0}
              onKeyDown={handleCanvasKeyDown}
              className="w-full h-full bg-background cursor-grab active:cursor-grabbing touch-none select-none"
              onContextMenu={(e) => e.preventDefault()}
              onWheel={handleWheel}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
            />
          </div>

          <p id="skilltree-help-fs" className="sr-only">
            💡 Dra för att panorera • Nyp för att zooma • Klicka på medaljer för detaljer • ⌨️ Piltangenter för att panorera
          </p>

          {selectedMedal && (
            <MedalDetailModal
              medalId={selectedMedal}
              onClose={() => setSelectedMedal(null)}
              onNavigateMedal={setSelectedMedal}
            />
          )}
        </div>
      )}

      {selectedMedal && !isFullscreen && (
        <MedalDetailModal
          medalId={selectedMedal}
          onClose={() => setSelectedMedal(null)}
          onNavigateMedal={setSelectedMedal}
        />
      )}
    </div>
  )
}
