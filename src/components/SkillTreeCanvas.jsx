import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { usePanZoom } from '../hooks/usePanZoom'
import { useCanvasRenderer } from '../hooks/useCanvasRenderer'
import { generateMedalLayout } from '../logic/canvasLayout'
import { exportCanvasToPNG } from '../utils/canvasExport'
import { useNavigate, useLocation } from 'react-router-dom'

export default function SkillTreeCanvas({ legendDescribedById }) {
  const canvasRef = useRef(null)
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const { panX, panY, scale, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, resetView } = usePanZoom()
  const { render } = useCanvasRenderer()
  
  const [selectedMedal, setSelectedMedal] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const isFullscreen = location.pathname.endsWith('/skill-tree/fullscreen')
  const fullscreenRef = useRef(null)
  const layout = useMemo(() => {
    if (!medalDatabase) return null
    const medals = medalDatabase.getAllMedals()
    return generateMedalLayout(medals)
  }, [medalDatabase])
  const [isDragging, setIsDragging] = useState(false)
  const closeBtnRef = useRef(null)
  const prevFocusRef = useRef(null)

  // Fullscreen floating menu state and refs
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)

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

    menuButtonRef.current?.focus?.()

    const onEsc = (e) => {
      if (e.key !== 'Escape') return
      // If the floating menu is open, it should handle Escape itself.
      if (menuOpen) return
      const active = document.activeElement
      // Only exit fullscreen when focus is inside the fullscreen overlay.
      // If a modal has focus, it will handle Escape itself.
      if (fullscreenRef.current && fullscreenRef.current.contains(active)) {
        navigate(-1)
      }
    }
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('keydown', onEsc)
      root.style.overflow = previousOverflow
      const el = prevFocusRef.current
      if (el && typeof el.focus === 'function') {
        el.focus()
      }
    }
  }, [isFullscreen, navigate, menuOpen])

  // Close floating menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      const m = menuRef.current
      const b = menuButtonRef.current
      if (!m || !b) return
      if (m.contains(e.target) || b.contains(e.target)) return
      setMenuOpen(false)
    }
    window.addEventListener('pointerdown', onDown, { capture: true })
    return () => window.removeEventListener('pointerdown', onDown, { capture: true })
  }, [menuOpen])

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
        navigate(`/medals/${medal.medalId}`, { state: { backgroundLocation: location } })
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
        navigate(`/medals/${medal.medalId}`, { state: { backgroundLocation: location } })
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
        <p className="text-text-secondary">Laddar märken...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-text-primary mb-1 sm:mb-0">Interaktiv träd-vy</h2>
        <div role="toolbar" aria-label="Träd-vy åtgärder" className="flex flex-wrap gap-2 sm:flex-nowrap">
          <button
            type="button"
            onClick={resetView}
            className="px-3 py-2 sm:px-4 sm:py-2 min-h-[44px] rounded bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
          >
            Återställ
          </button>
          <button
            type="button"
            onClick={handleExportPNG}
            className="hidden sm:inline-flex px-3 py-2 sm:px-4 sm:py-2 min-h-[44px] rounded bg-primary text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
          >
            <span aria-hidden="true" className="mr-2">📥</span>
            Exportera som PNG
          </button>
          <button
            type="button"
            onClick={() => navigate('/skill-tree/fullscreen')}
            className="px-3 py-2 sm:px-4 sm:py-2 min-h-[44px] rounded bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
            aria-haspopup="dialog"
            aria-controls="skilltree-fullscreen"
          >
            Helskärm
          </button>
        </div>
      </div>

      <div className="card overflow-hidden overscroll-contain mt-2" role="region" aria-label="Trädvy canvas" aria-describedby={legendDescribedById ? 'skilltree-help ' + legendDescribedById : 'skilltree-help'}>
        {!isFullscreen && (
          <canvas
            ref={setCanvasRef}
            role="img"
            aria-label="Interaktiv träd-vy-canvas"
            aria-describedby={legendDescribedById}
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
        <p id="skilltree-help">💡 Dra för att panorera • Nyp för att zooma • Klicka på märken för detaljer • ⌨️ Piltangenter för att panorera</p>
      </div>
      <div className="sm:hidden">
        <button
          type="button"
          onClick={handleExportPNG}
          className="mt-2 w-full px-3 py-2 min-h-[44px] rounded bg-primary text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
        >
          <span aria-hidden="true" className="mr-2">📥</span>
          Exportera som PNG
        </button>
      </div>

      {isFullscreen && (
        <div
          id="skilltree-fullscreen"
          ref={fullscreenRef}
          className="fixed inset-0 z-50 bg-background overscroll-contain flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Helskärms träd-vy"
        >
          {/* SR-only title for context */}
          <h2 className="sr-only">Märken</h2>
          {/* Floating actions menu (bottom-right) */}
          <div
            className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 z-[60]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="relative">
            <button
              type="button"
              ref={menuButtonRef}
              aria-haspopup="menu"
              aria-controls="fullscreen-actions-menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary border border-border text-foreground shadow-lg hover:bg-bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              title="Visa åtgärder"
              aria-label="Visa åtgärder"
            >
              <span aria-hidden="true">⋮</span>
            </button>

            {menuOpen && (
              <div
                id="fullscreen-actions-menu"
                ref={menuRef}
                role="menu"
                aria-label="Åtgärder"
                className="absolute right-0 bottom-14 sm:bottom-16 w-56 rounded-md border border-border bg-background shadow-xl overflow-hidden"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setMenuOpen(false)
                    menuButtonRef.current?.focus()
                  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    const items = Array.from(e.currentTarget.querySelectorAll('[role="menuitem"]'))
                    if (items.length === 0) return
                    const i = items.indexOf(document.activeElement)
                    let next = 0
                    if (e.key === 'ArrowDown') next = i >= 0 ? (i + 1) % items.length : 0
                    if (e.key === 'ArrowUp') next = i >= 0 ? (i - 1 + items.length) % items.length : items.length - 1
                    e.preventDefault()
                    items[next]?.focus()
                  }
                }}
              >
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => { setMenuOpen(false); resetView() }}
                  className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Återställ vy
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => { setMenuOpen(false); handleExportPNG() }}
                  className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Exportera som PNG
                </button>
                <button
                  role="menuitem"
                  type="button"
                  ref={closeBtnRef}
                  onClick={() => { setMenuOpen(false); navigate(-1) }}
                  className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Stäng helskärm
                </button>
              </div>
            )}
            </div>
          </div>

          <div className="flex-1">
            <canvas
              ref={setCanvasRef}
              role="img"
              aria-label="Interaktiv träd-vy-canvas"
              aria-describedby={legendDescribedById ? 'skilltree-help-fs ' + legendDescribedById : 'skilltree-help-fs'}
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
            💡 Dra för att panorera • Nyp för att zooma • Klicka på märken för detaljer • ⌨️ Piltangenter för att panorera
          </p>

          {/* Modal is route-driven while in fullscreen */}
        </div>
      )}

      {/* Non-fullscreen modal is now route-driven via AppRoutes */}
    </div>
  )
}
