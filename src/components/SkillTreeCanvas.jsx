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
  const { panX, panY, scale, setScaleAbsolute, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, resetView } = usePanZoom(1, 0.5, 6)
  const { render } = useCanvasRenderer()
  
  const [selectedMedal, setSelectedMedal] = useState(null)
  const [hoveredMedal, setHoveredMedal] = useState(null)
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

  // Keep latest interactive scale without causing re-renders
  const scaleRef = useRef(scale)
  useEffect(() => { scaleRef.current = scale }, [scale])

  // Fullscreen floating menu state and refs
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)

  // Compute a base transform that anchors the layout's top-left to the canvas' top-left with padding,
  // and auto-fits the layout into the viewport (mobile-first).
  const computeBaseTransform = useCallback((canvas, padding = 24) => {
    if (!layout || !canvas) return { baseScale: 1, minX: 0, minY: 0 }
    const width = canvas.width
    const height = canvas.height
    if (!width || !height) return { baseScale: 1, minX: 0, minY: 0 }
    const medals = layout.medals || []
    if (!medals.length) return { baseScale: 1, minX: 0, minY: 0 }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (let i = 0; i < medals.length; i++) {
      const m = medals[i]
      const r = m.radius || 20
      if (m.x - r < minX) minX = m.x - r
      if (m.y - r < minY) minY = m.y - r
      if (m.x + r > maxX) maxX = m.x + r
      if (m.y + r > maxY) maxY = m.y + r
    }
    const contentW = Math.max(1, maxX - minX)
    const contentH = Math.max(1, maxY - minY)
    const fitX = (width - padding * 2) / contentW
    const fitY = (height - padding * 2) / contentH
    const baseScale = Math.max(0.001, Math.min(fitX, fitY))
    return { baseScale, minX, minY }
  }, [layout])

  // Effective transform combines the base (top-left anchored, auto-fit) with interactive pan/zoom.
  const getEffectiveTransform = useCallback((canvas, padding = 24) => {
    const { baseScale, minX, minY } = computeBaseTransform(canvas, padding)
    const width = canvas?.width || 0
    const height = canvas?.height || 0
    const effScale = Math.max(0.001, baseScale * scale)
    // Compute base pan using the effective scale so the top-left stays anchored at padding
    // Include label half-width so the left-most label stays inside canvas padding.
    const labelHalfPx = 90
    const extraLeftWorld = labelHalfPx / effScale
    const basePanX = (padding - width / 2) / effScale - (minX - extraLeftWorld)
    const basePanY = (padding - height / 2) / effScale - minY
    const effPanX = panX + basePanX
    const effPanY = panY + basePanY
    return { effScale, effPanX, effPanY, baseScale }
  }, [computeBaseTransform, panX, panY, scale])

  // Determine which medals are visible in the current viewport for culling
  const getVisibleMedalsForCanvas = useCallback((canvas, margin = 120) => {
    if (!layout || !canvas) return []
    const width = canvas.width
    const height = canvas.height
    const medals = layout.medals || []
    const { effScale, effPanX, effPanY } = getEffectiveTransform(canvas)
    const result = []
    for (let i = 0; i < medals.length; i++) {
      const m = medals[i]
      const nodeX = (m.x + effPanX) * effScale + width / 2
      const nodeY = (m.y + effPanY) * effScale + height / 2
      const r = (m.radius || 20) * effScale
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
  }, [layout, getEffectiveTransform])

  // Node-anchored "years required" badges (DOM overlay for accessibility)
  const getYearsBadgeData = useCallback((canvas) => {
    if (!canvas || !layout) return []
    const { effScale, effPanX, effPanY } = getEffectiveTransform(canvas)
    const width = canvas.width
    const height = canvas.height
    const visible = getVisibleMedalsForCanvas(canvas)
    const badges = []
    const shouldShow = (medalId) => (hoveredMedal === medalId || selectedMedal === medalId || effScale >= 0.8)

    // Build quick lookup for node by medalId
    const nodeById = new Map()
    for (const n of layout.medals || []) nodeById.set(n.medalId, n)

    // Fixed pill size in screen pixels and fixed offsets so pills don't change shape or jump
    const PILL_W = 64
    const PILL_H = 24
    const GAP_ALONG_PX = 8      // gap from node edge along the connection direction
    const SIDE_OFFSET_PX = 18   // perpendicular offset to the left side of the connection

    const toScreen = (node) => {
      const x = (node.x + effPanX) * effScale + width / 2
      const y = (node.y + effPanY) * effScale + height / 2
      const r = (node.radius || 20) * effScale
      return { x, y, r }
    }

    for (const m of visible) {
      const years = m.yearsRequired || 0
      if (!years || !shouldShow(m.medalId)) continue

      const toNode = toScreen(m)

      // Default placement: left-above the node (stable)
      let cx = toNode.x - (toNode.r + GAP_ALONG_PX)
      let cy = toNode.y - (toNode.r + GAP_ALONG_PX)

      // If there is an incoming connection, place pill to the left of that connection
      const incoming = (layout.connections || []).find(c => c.to === m.medalId)
      if (incoming) {
        const fromNodeData = nodeById.get(incoming.from)
        if (fromNodeData) {
          const from = toScreen(fromNodeData)
          // Vector from prerequisite to this node in screen space
          const vx = toNode.x - from.x
          const vy = toNode.y - from.y
          const vlen = Math.hypot(vx, vy) || 1
          const ux = vx / vlen
          const uy = vy / vlen
          // Perpendicular "left" normal relative to the connection direction
          const nx = -uy
          const ny = ux
          cx = toNode.x - ux * (toNode.r + GAP_ALONG_PX) + nx * SIDE_OFFSET_PX
          cy = toNode.y - uy * (toNode.r + GAP_ALONG_PX) + ny * SIDE_OFFSET_PX
        }
      }

      const statusKey = statuses?.[m.medalId]?.status
      const variant = (statusKey === 'achievable' || statusKey === 'unlocked') ? 'ready' : 'neutral'
      const text = `${years} år`

      badges.push({ id: m.medalId, left: cx, top: cy, text, variant, w: PILL_W, h: PILL_H })
    }
    return badges
  }, [layout, getEffectiveTransform, getVisibleMedalsForCanvas, hoveredMedal, selectedMedal, statuses])


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

    const { effScale, effPanX, effPanY } = getEffectiveTransform(canvas)

    render(
      ctx,
      filteredMedals,
      filteredLayout,
      statuses,
      effPanX,
      effPanY,
      effScale,
      selectedMedal,
      hoveredMedal
    )
  }, [getVisibleMedalsForCanvas, getEffectiveTransform, layout, medalDatabase, statuses, selectedMedal, render, hoveredMedal])

  // Ensure label readability at initial/reset states without fighting user zoom
  const ensureLabelVisibilityScale = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !layout) return
    const { baseScale } = computeBaseTransform(canvas)
    // Target minimum effective scale for label readability (labels draw at >= 0.8)
    const minEff = 0.8
    const targetInteractive = minEff / Math.max(0.001, baseScale)
    const current = scaleRef.current
    if (current + 1e-3 < targetInteractive) {
      setScaleAbsolute(targetInteractive)
    }
  }, [computeBaseTransform, layout, setScaleAbsolute])

  const setCanvasRef = useCallback((node) => {
    canvasRef.current = node
  }, [])

  // Draw with requestAnimationFrame for smoothness
  useEffect(() => {
    let raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [draw])

  // Ensure label readability once layout is ready (initialization only)
  useEffect(() => {
    if (canvasRef.current && layout) {
      ensureLabelVisibilityScale()
    }
  }, [layout, ensureLabelVisibilityScale])

  // Redraw on window resize
  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        draw()
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  // Native wheel listener (passive: false) to prevent page scroll/zoom during canvas zoom gestures.
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e) => {
      const { effScale } = getEffectiveTransform(el)
      handleWheel(e, effScale)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel, { passive: false })
    }
  }, [getEffectiveTransform, handleWheel, isFullscreen])

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

  // Redraw on fullscreen toggle
  useEffect(() => {
    if (canvasRef.current) {
      requestAnimationFrame(() => {
        draw()
      })
    }
  }, [isFullscreen, draw])

  // Keyboard pan shortcuts (scope to focused canvas for WCAG 2.1/2.2)
  const handleCanvasKeyDown = useCallback((e) => {
    const { effScale } = getEffectiveTransform(canvasRef.current)
    const step = 50 / Math.max(effScale, 0.001)
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
  }, [getEffectiveTransform, handlePointerMove])

  // Pointer events
  const handleCanvasPointerDown = (e) => {
    setIsDragging(true)
    handlePointerDown(e)
  }

  const handleCanvasPointerMove = (e) => {
    if (isDragging) {
      const { effScale } = getEffectiveTransform(canvasRef.current)
      handlePointerMove(e, effScale)
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
      return
    }

    if (!canvasRef.current || !layout) return

    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Hover hit test uses the same transform as renderer (top-left anchored)
    const { effScale, effPanX, effPanY } = getEffectiveTransform(canvasRef.current)
    const visibleMedals = getVisibleMedalsForCanvas(canvasRef.current)
    for (const medal of visibleMedals) {
      const nodeX = (medal.x + effPanX) * effScale + canvasRef.current.width / 2
      const nodeY = (medal.y + effPanY) * effScale + canvasRef.current.height / 2
      const radius = (medal.radius || 20) * effScale
      const effectiveRadius = Math.max(radius, 24)
      const dx = mouseX - nodeX
      const dy = mouseY - nodeY
      if (dx * dx + dy * dy < effectiveRadius * effectiveRadius) {
        setHoveredMedal(medal.medalId)
        canvasRef.current.style.cursor = 'pointer'
        return
      }
    }
    setHoveredMedal(null)
    canvasRef.current.style.cursor = 'grab'
  }

  const handleCanvasPointerUp = (e) => {
    setIsDragging(false)
    handlePointerUp(e)
    setHoveredMedal(null)
  }

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !layout) return

    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Determine clicked medal node (use culled set)
    const { effScale, effPanX, effPanY } = getEffectiveTransform(canvasRef.current)
    const visibleMedals = getVisibleMedalsForCanvas(canvasRef.current)
    for (const medal of visibleMedals) {
      const nodeX = (medal.x + effPanX) * effScale + canvasRef.current.width / 2
      const nodeY = (medal.y + effPanY) * effScale + canvasRef.current.height / 2
      const radius = (medal.radius || 20) * effScale
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

    const { effScale, effPanX, effPanY } = getEffectiveTransform(canvasRef.current)
    const visibleMedals = getVisibleMedalsForCanvas(canvasRef.current)
    for (const medal of visibleMedals) {
      const nodeX = (medal.x + effPanX) * effScale + canvasRef.current.width / 2
      const nodeY = (medal.y + effPanY) * effScale + canvasRef.current.height / 2
      const radius = (medal.radius || 20) * effScale
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
            onClick={() => { resetView(); ensureLabelVisibilityScale() }}
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
          <div className="relative">
            <canvas
              ref={setCanvasRef}
              role="img"
              aria-label="Interaktiv träd-vy-canvas"
              aria-describedby={legendDescribedById}
              aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
              tabIndex={0}
              onKeyDown={handleCanvasKeyDown}
              className="w-full h-[60vh] sm:h-[600px] bg-background cursor-grab active:cursor-grabbing touch-none overscroll-contain select-none"
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
            />
            <div className="pointer-events-none absolute inset-0">
              {getYearsBadgeData(canvasRef.current).map(badge => (
                <span
                  key={badge.id}
                  role="note"
                  aria-label={`Kräver ${badge.text}`}
                  title={`Kräver ${badge.text}`}
                  className={[
                    'inline-flex items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium shadow-sm',
                    badge.variant === 'ready'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-primary/10 dark:bg-primary/20 text-foreground border-primary'
                  ].join(' ')}
                  style={{
                    position: 'absolute',
                    left: `${badge.left}px`,
                    top: `${badge.top}px`,
                    transform: 'translate(-50%,-50%)',
                    width: `${badge.w}px`,
                    height: `${badge.h}px`,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span aria-hidden="true">📅</span>
                  <span aria-hidden="true">{badge.text}</span>
                </span>
              ))}
            </div>
          </div>
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
                  onClick={() => { setMenuOpen(false); resetView(); ensureLabelVisibilityScale() }}
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
            <div className="relative h-full">
              <canvas
                ref={setCanvasRef}
                role="img"
                aria-label="Interaktiv träd-vy-canvas"
                aria-describedby={legendDescribedById ? 'skilltree-help-fs ' + legendDescribedById : 'skilltree-help-fs'}
                aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
                tabIndex={0}
                onKeyDown={handleCanvasKeyDown}
                className="w-full h-full bg-background cursor-grab active:cursor-grabbing touch-none overscroll-contain select-none"
                onContextMenu={(e) => e.preventDefault()}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerLeave={handleCanvasPointerUp}
                onPointerCancel={handleCanvasPointerUp}
                onClick={handleCanvasClick}
                onDoubleClick={handleCanvasDoubleClick}
              />
              <div className="pointer-events-none absolute inset-0">
                {getYearsBadgeData(canvasRef.current).map(badge => (
                  <span
                    key={badge.id}
                    role="note"
                    aria-label={`Kräver ${badge.text}`}
                    title={`Kräver ${badge.text}`}
                    className={[
                      'inline-flex items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium shadow-sm',
                      badge.variant === 'ready'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-primary/10 dark:bg-primary/20 text-foreground border-primary'
                    ].join(' ')}
                    style={{
                      position: 'absolute',
                      left: `${badge.left}px`,
                      top: `${badge.top}px`,
                      transform: 'translate(-50%,-50%)',
                      width: `${badge.w}px`,
                      height: `${badge.h}px`,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span aria-hidden="true">📅</span>
                    <span aria-hidden="true">{badge.text}</span>
                  </span>
                ))}
              </div>
            </div>
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
