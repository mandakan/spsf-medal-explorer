import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { usePanZoom } from '../hooks/usePanZoom'
import { useCanvasRenderer } from '../hooks/useCanvasRenderer'
import { exportCanvasToPNG } from '../utils/canvasExport'
import { clearThemeCache, getThemeColors } from '../logic/canvasRenderer'
import { useNavigate, useLocation } from 'react-router-dom'
import ReviewLegend from './ReviewLegend'
import { useProfile } from '../hooks/useProfile'
import ProfileSelector from './ProfileSelector'
import ConfirmDialog from './ConfirmDialog'
import Icon from './Icon'
import { useSkillTreeLayoutPreset } from '../hooks/useSkillTreeLayoutPreset'
import { useSkillTreeLayout } from '../hooks/useSkillTreeLayout'

export default function SkillTreeCanvas({ legendDescribedById }) {
  const canvasRef = useRef(null)
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()

  const { render } = useCanvasRenderer()

  const [selectedMedal, setSelectedMedal] = useState(null)
  const [hoveredMedal, setHoveredMedal] = useState(null)
  const [badgeData, setBadgeData] = useState([])
  const [laneLabels, setLaneLabels] = useState([])
  const navigate = useNavigate()
  const location = useLocation()
  const isFullscreen = location.pathname.endsWith('/skill-tree/fullscreen')
  const fullscreenRef = useRef(null)

  const { presetId, setPresetId } = useSkillTreeLayoutPreset()
  const { layout } = useSkillTreeLayout(presetId)

  // Shared canvas/label padding constants
  const CANVAS_PAD = 24
  const LABEL_HALF_PX = 80           // approximate half-width of label text area
  const LABEL_BOTTOM_PX = 56         // reserve for up to two lines of label text at bottom
  const LANE_LABEL_WIDTH = 120       // reserved width for timeline lane labels on left
  const TIMELINE_TOP_PAD = 40        // minimal top padding for timeline year labels (reduced to save space)
  const TIMELINE_BOTTOM_PAD = 100    // extra bottom padding for timeline to clear zoom controls
  const DEFAULT_LEGEND_SAFE_TOP_PX = 52
  // Legend visibility and reserved safe-top height must be defined before pan/zoom
  const [showLegend, setShowLegend] = useState(true)
  const [legendSafeTop, setLegendSafeTop] = useState(showLegend ? DEFAULT_LEGEND_SAFE_TOP_PX : 0)
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })
  const getWorldBounds = useCallback(() => {
    if (!layout || !layout.medals?.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (let i = 0; i < layout.medals.length; i++) {
      const m = layout.medals[i]
      const r = m.radius || 20
      if (m.x - r < minX) minX = m.x - r
      if (m.y - r < minY) minY = m.y - r
      if (m.x + r > maxX) maxX = m.x + r
      if (m.y + r > maxY) maxY = m.y + r
    }
    return { minX, minY, maxX, maxY }
  }, [layout])

  const computeBaseTransform = useCallback((canvas, padding = 24, extraTop = 0) => {
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
    const fitY = (height - padding * 2 - Math.max(0, extraTop)) / contentH
    const useHeightFit = layout?.meta?.kind === 'timeline'
    const baseScale = Math.max(0.001, useHeightFit ? fitY : Math.min(fitX, fitY))
    return { baseScale, minX, minY }
  }, [layout])
  const ZOOM_STEP = 1.2

  const getDesiredEffBounds = React.useCallback(() => {
    const isTimeline = layout?.meta?.kind === 'timeline'
    return isTimeline
      ? { min: 0.2, max: 1.5 }   // Timeline: allow a bit more zoom-out, lower zoom-in cap
      : { min: 0.5, max: 1.5 }    // Columns: unchanged
  }, [layout])

  const computeDynamicBounds = useCallback(() => {
    const { min: effMin, max: effMax } = getDesiredEffBounds()
    const w = canvasSize.w
    const h = canvasSize.h
    if (!layout || !w || !h) return { min: effMin, max: effMax }
    const mockCanvas = { width: w, height: h }
    const { baseScale } = computeBaseTransform(mockCanvas, CANVAS_PAD, legendSafeTop)
    const safeBase = Math.max(0.001, baseScale)
    const min = Math.max(0.001, effMin / safeBase)
    const max = Math.max(min, effMax / safeBase)
    return { min, max }
  }, [canvasSize, layout, getDesiredEffBounds, computeBaseTransform, legendSafeTop])
  const { min: MIN_SCALE, max: MAX_SCALE } = computeDynamicBounds()

  // Dynamic padding: extra left padding for timeline lane labels
  const contentPadding = React.useMemo(() => {
    const isTimeline = layout?.meta?.kind === 'timeline'
    return {
      left: (isTimeline ? LANE_LABEL_WIDTH : LABEL_HALF_PX) + CANVAS_PAD,
      top: (isTimeline ? TIMELINE_TOP_PAD : CANVAS_PAD) + legendSafeTop,
      right: LABEL_HALF_PX + CANVAS_PAD,
      bottom: (isTimeline ? TIMELINE_BOTTOM_PAD : LABEL_BOTTOM_PX) + CANVAS_PAD
    }
  }, [layout, legendSafeTop, LANE_LABEL_WIDTH, LABEL_HALF_PX, LABEL_BOTTOM_PX, TIMELINE_TOP_PAD, TIMELINE_BOTTOM_PAD, CANVAS_PAD])

  const { panX, panY, scale, setScaleAbsolute, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, resetView } = usePanZoom(6, MIN_SCALE, MAX_SCALE, {
    getBounds: getWorldBounds,
    overscrollPx: 48,
    contentPaddingPx: contentPadding
  })
  const [isDragging, setIsDragging] = useState(false)
  const closeBtnRef = useRef(null)
  const prevFocusRef = useRef(null)
  const didInitViewRef = useRef(false)
  const pointerDownPos = useRef({ x: 0, y: 0 })

  // Keep latest interactive scale without causing re-renders
  const scaleRef = useRef(scale)
  useEffect(() => { scaleRef.current = scale }, [scale])

  // Floating menu and overlays state/refs
  const [menuOpen, setMenuOpen] = useState(false)
  const [showYearBadges, setShowYearBadges] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)
  const legendId = legendDescribedById || 'skilltree-legend'
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)
  const legendRef = useRef(null)
  const legendFsRef = useRef(null)
  const menuId = isFullscreen ? 'fullscreen-actions-menu' : 'canvas-actions-menu'
  const { currentProfile, startExplorerMode, hydrated, resetCurrentProfileData } = useProfile()
  const isGuest = Boolean(currentProfile?.isGuest)
  const isProfileLoading = !hydrated || typeof currentProfile === 'undefined'
  const [dismissedFsOnboarding, setDismissedFsOnboarding] = useState(false)
  const [openPicker, setOpenPicker] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const hasOnboardingChoice = (() => {
    try { return window.localStorage.getItem('app:onboardingChoice') } catch { return null }
  })()
  const showFsOnboarding = isFullscreen && !isProfileLoading && !currentProfile && !hasOnboardingChoice && !dismissedFsOnboarding


  // Effective transform combines the base (top-left anchored, auto-fit) with interactive pan/zoom.
  const getEffectiveTransform = useCallback((canvas, padding = CANVAS_PAD) => {
    const { baseScale, minX, minY } = computeBaseTransform(canvas, padding, legendSafeTop)
    const width = canvas?.width || 0
    const height = canvas?.height || 0
    const effScale = Math.max(0.001, baseScale * scale)
    // Compute base pan using the effective scale so the top-left stays anchored at padding
    // Include label half-width (or lane label width for timeline) so the left-most label stays inside canvas padding.
    const isTimeline = layout?.meta?.kind === 'timeline'
    const extraLeftWorld = (isTimeline ? LANE_LABEL_WIDTH : LABEL_HALF_PX) / effScale
    const extraTopWorld = Math.max(0, legendSafeTop) / effScale
    const basePanX = (padding - width / 2) / effScale - (minX - extraLeftWorld)
    const basePanY = (padding - height / 2) / effScale - (minY - extraTopWorld)
    const effPanX = panX + basePanX
    const effPanY = panY + basePanY
    return { effScale, effPanX, effPanY, baseScale }
  }, [computeBaseTransform, panX, panY, scale, legendSafeTop, layout])

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
    if (!showYearBadges) return []
    // Skip year badges in timeline view since the X-axis already represents years
    if (layout?.meta?.kind === 'timeline') return []
    const { effScale, effPanX, effPanY } = getEffectiveTransform(canvas)
    const width = canvas.width
    const height = canvas.height
    const visible = getVisibleMedalsForCanvas(canvas)
    const badges = []
    const shouldShow = (medalId) => (hoveredMedal === medalId || selectedMedal === medalId || effScale >= 0.8)

    // Build quick lookup for node by medalId
    const nodeById = new Map()
    for (const n of layout.medals || []) nodeById.set(n.medalId, n)

    // Fixed pill size and layout constants (screen px)
    const PILL_W = 56
    const PILL_H = 20
    const VERT_MARGIN = 8
    const NODE_CLEAR = Math.max(PILL_H / 2 + 6, 12)

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

      // Default placement: centered horizontally, above the node with guaranteed clearance
      let cx = toNode.x
      let cy = toNode.y - (toNode.r + VERT_MARGIN + PILL_H / 2)

      // If there is a single incoming connection and that source sits too close to the pill,
      // nudge the pill slightly perpendicular to that connection to avoid overlap.
      const incoming = (layout.connections || []).find(c => c.to === m.medalId)
      if (incoming) {
        const fromNodeData = nodeById.get(incoming.from)
        if (fromNodeData) {
          const from = toScreen(fromNodeData)
          const vx = toNode.x - from.x
          const vy = toNode.y - from.y
          const vlen = Math.hypot(vx, vy) || 1
          const ux = vx / vlen
          const uy = vy / vlen
          const nx = -uy
          const ny = ux
          const dx = cx - from.x
          const dy = cy - from.y
          const dist = Math.hypot(dx, dy) || 1
          const minDist = from.r + Math.max(PILL_W, PILL_H) / 2 + 6
          if (dist < minDist) {
            const shift = (minDist - dist)
            cx += nx * shift
            cy += ny * shift
          }
        }
      }

      // Safety: if still too close to node center, nudge outward along the radial
      const dx = cx - toNode.x
      const dy = cy - toNode.y
      const dist = Math.hypot(dx, dy) || 1
      const minCenterDist = toNode.r + NODE_CLEAR
      if (dist < minCenterDist) {
        const ux = dx / dist
        const uy = dy / dist
        cx = toNode.x + ux * minCenterDist
        cy = toNode.y + uy * minCenterDist
      }

      const statusKey = statuses?.[m.medalId]?.status
      const variant = (statusKey === 'achievable' || statusKey === 'unlocked') ? 'ready' : 'neutral'
      const text = `${years} år`

      badges.push({ id: m.medalId, left: cx, top: cy, text, variant, w: PILL_W, h: PILL_H })
    }
    return badges
  }, [layout, getEffectiveTransform, getVisibleMedalsForCanvas, hoveredMedal, selectedMedal, statuses, showYearBadges])

  // Lane labels for timeline view (DOM overlay for better accessibility)
  const getLaneLabelsData = useCallback((canvas) => {
    if (!canvas || !layout) return []
    if (layout?.meta?.kind !== 'timeline') return []

    const { effScale, effPanY } = getEffectiveTransform(canvas)
    const height = canvas.height
    const lanes = Array.isArray(layout.meta.lanes) ? layout.meta.lanes : []
    const labels = []

    for (const lane of lanes) {
      const screenY = (lane.y + effPanY) * effScale + height / 2
      // Skip lanes that are off-screen
      if (screenY < -50 || screenY > height + 50) continue

      const text = String(lane.label || lane.type || '')

      // Smart line breaking: split before "märket" if present, add hyphen per Swedish grammar
      let line1 = text
      let line2 = ''
      const markerIndex = text.toLowerCase().lastIndexOf('märket')
      if (markerIndex > 0) {
        line1 = text.substring(0, markerIndex).trim() + '-'
        line2 = text.substring(markerIndex).trim()
      }

      labels.push({
        id: lane.type || `lane-${labels.length}`,
        line1,
        line2,
        top: screenY
      })
    }

    return labels
  }, [layout, getEffectiveTransform])

  const draw = useCallback(() => {
    if (!canvasRef.current || !layout || !medalDatabase) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Resize canvas to match container size
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
      canvas.width = Math.floor(rect.width)
      canvas.height = Math.floor(rect.height)
      setCanvasSize({ w: canvas.width, h: canvas.height })
    }

    // Clear canvas with computed background color to respect light/dark themes
    const bgColor = getComputedStyle(canvas).backgroundColor || '#fcfcf9'
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Render skill tree with view culling for performance
    const allMedals = medalDatabase.getAllMedals()
    const visibleNodes = getVisibleMedalsForCanvas(canvas)
    const visibleIds = new Set(visibleNodes.map(n => n.medalId))
    const culledMedals = allMedals.filter(m => visibleIds.has(m.id))

    const { effScale, effPanX, effPanY } = getEffectiveTransform(canvas)

    // Timeline overlay (grid + lane labels)
    if (layout?.meta?.kind === 'timeline') {
      const palette = getThemeColors(canvas) || {}
      const width = canvas.width
      const height = canvas.height

      // Visible world-space range
      const worldLeft = (-width / 2) / effScale - effPanX
      const worldRight = (width / 2) / effScale - effPanX

      const yearWidth = Number(layout.meta.yearWidth) || 220
      const startYear = Math.floor(worldLeft / yearWidth)
      const endYear = Math.ceil(worldRight / yearWidth)

      // Grid lines
      const gridColor = palette.connection || 'rgba(0,0,0,0.3)'
      const labelColor = palette.text || '#111827'
      // Position year labels just below the legend with minimal gap
      const labelY = showLegend ? legendSafeTop + 6 : 12

      ctx.save()
      ctx.lineWidth = 1
      ctx.strokeStyle = gridColor
      ctx.globalAlpha = 0.25
      for (let yi = startYear; yi <= endYear; yi++) {
        const worldX = yi * yearWidth
        const screenX = (worldX + effPanX) * effScale + width / 2
        ctx.beginPath()
        ctx.moveTo(screenX, 0)
        ctx.lineTo(screenX, height)
        ctx.stroke()

        // Year labels at top
        ctx.globalAlpha = 0.8
        ctx.fillStyle = labelColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
        ctx.fillText(`${yi} år`, screenX, labelY)
        ctx.globalAlpha = 0.25
      }
      ctx.restore()

      // Lane labels are now rendered as DOM overlay (see getLaneLabelsData)
    }

    render(
      ctx,
      culledMedals,
      layout,
      statuses,
      effPanX,
      effPanY,
      effScale,
      selectedMedal,
      hoveredMedal
    )
  }, [getVisibleMedalsForCanvas, getEffectiveTransform, layout, medalDatabase, statuses, selectedMedal, render, hoveredMedal, legendSafeTop, showLegend])

  const handleResetView = useCallback(() => {
    const el = canvasRef.current
    if (!el || !layout) return
    const { baseScale } = computeBaseTransform(el, CANVAS_PAD, legendSafeTop)
    const { min: effMin, max: effMax } = getDesiredEffBounds()
    const targetEff = (layout?.meta?.kind === 'timeline') ? 0.9 : 0.8
    const clampedEff = Math.min(effMax, Math.max(effMin, targetEff))
    const targetInteractive = clampedEff / Math.max(0.001, baseScale)
    resetView()
    setScaleAbsolute(targetInteractive)
  }, [computeBaseTransform, layout, resetView, setScaleAbsolute, legendSafeTop, getDesiredEffBounds])

  // Zoom controls
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
  const handleZoomIn = useCallback(() => {
    setScaleAbsolute(clamp(scaleRef.current * ZOOM_STEP, MIN_SCALE, MAX_SCALE))
  }, [setScaleAbsolute, MIN_SCALE, MAX_SCALE, ZOOM_STEP])
  const handleZoomOut = useCallback(() => {
    setScaleAbsolute(clamp(scaleRef.current / ZOOM_STEP, MIN_SCALE, MAX_SCALE))
  }, [setScaleAbsolute, MIN_SCALE, MAX_SCALE, ZOOM_STEP])

  const toggleLegend = useCallback(() => {
    setShowLegend(prev => {
      const next = !prev
      if (!next) setLegendSafeTop(0)
      return next
    })
  }, [setLegendSafeTop, setShowLegend])

  const closeFullscreen = useCallback(() => {
    const bg = location.state?.backgroundLocation
    // If we have a background location, return to it and mark that we're closing fullscreen
    if (bg && typeof bg === 'object') {
      const to = { pathname: bg.pathname, search: bg.search, hash: bg.hash }
      navigate(to, { replace: true, state: { ...(bg.state || {}), fromFullscreenClose: true } })
      return
    }
    if (typeof bg === 'string') {
      navigate(bg, { replace: true, state: { fromFullscreenClose: true } })
      return
    }
    // Fallback to base route with the same skip flag
    const base = location.pathname.replace(/\/fullscreen$/, '')
    navigate(base || '/skill-tree', { replace: true, state: { fromFullscreenClose: true } })
  }, [location, navigate])

  const setCanvasRef = useCallback((node) => {
    canvasRef.current = node
  }, [])

  // Measure legend height to reserve safe top area for initial render and during layout changes
  // Schedule via rAF to avoid synchronous setState inside effect (keeps renders predictable)
  useLayoutEffect(() => {
    if (!showLegend) return
    const el = isFullscreen ? legendFsRef.current : legendRef.current
    if (!el) return
    let raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      setLegendSafeTop(Math.max(0, Math.ceil(r.height)))
    })
    return () => cancelAnimationFrame(raf)
  }, [showLegend, isFullscreen])

  // Draw with requestAnimationFrame for smoothness
  useEffect(() => {
    let raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [draw])

  // Compute badge overlay positions and lane labels in layout effect to stay in sync with canvas
  useLayoutEffect(() => {
    const el = canvasRef.current
    if (!el) return
    // Ensure canvas pixel size matches DOM before computing overlay
    const rect = el.getBoundingClientRect()
    const w = Math.floor(rect.width)
    const h = Math.floor(rect.height)
    if (w > 0 && h > 0 && (el.width !== w || el.height !== h)) {
      el.width = w
      el.height = h
      setCanvasSize({ w, h })
    }
    setBadgeData(getYearsBadgeData(el))
    setLaneLabels(getLaneLabelsData(el))
  }, [getYearsBadgeData, getLaneLabelsData, panX, panY, scale, hoveredMedal, selectedMedal, layout])

  // Initialize view to the same target as "Återställ vy" once when layout is ready
  useEffect(() => {
    if (didInitViewRef.current) return
    if (!canvasRef.current || !layout) return
    didInitViewRef.current = true
    handleResetView()
  }, [layout, handleResetView])

  // Redraw and recompute overlay on window resize
  useEffect(() => {
    const onResize = () => {
      const el = canvasRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)
      if (w > 0 && h > 0 && (el.width !== w || el.height !== h)) {
        el.width = w
        el.height = h
        setCanvasSize({ w, h })
      }
      draw()
      setBadgeData(getYearsBadgeData(el))
      setLaneLabels(getLaneLabelsData(el))

      if (showLegend) {
        const legendEl = isFullscreen ? legendFsRef.current : legendRef.current
        if (legendEl) {
          const r = legendEl.getBoundingClientRect()
          setLegendSafeTop(Math.max(0, Math.ceil(r.height)))
        }
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw, getYearsBadgeData, getLaneLabelsData, isFullscreen, showLegend])

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
      // If the floating menu or help is open, they should handle Escape themselves.
      if (menuOpen || helpOpen) return
      const active = document.activeElement
      // Only exit fullscreen when focus is inside the fullscreen overlay.
      // If a modal has focus, it will handle Escape itself.
      if (fullscreenRef.current && fullscreenRef.current.contains(active)) {
        closeFullscreen()
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
  }, [isFullscreen, menuOpen, helpOpen, closeFullscreen])

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

  // Theme changes: redraw canvas and recompute overlay; also clear renderer theme cache
  useEffect(() => {
    const schedule = () => {
      requestAnimationFrame(() => {
        clearThemeCache()
        const el = canvasRef.current
        if (!el) return
        draw()
        setBadgeData(getYearsBadgeData(el))
        setLaneLabels(getLaneLabelsData(el))
      })
    }

    // System theme toggle
    const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
    if (mql && typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', schedule)
    }

    // App theme toggle via .dark on <html>
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          schedule()
          break
        }
      }
    })
    if (typeof document !== 'undefined' && document.documentElement) {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    }

    return () => {
      if (mql && typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', schedule)
      }
      observer.disconnect()
    }
  }, [draw, getYearsBadgeData, getLaneLabelsData])

  // Redraw when returning from bfcache/tab visibility and on orientation changes
  useEffect(() => {
    const redraw = () => {
      requestAnimationFrame(() => {
        const el = canvasRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const w = Math.floor(rect.width)
        const h = Math.floor(rect.height)
        if (w > 0 && h > 0 && (el.width !== w || el.height !== h)) {
          el.width = w
          el.height = h
          setCanvasSize({ w, h })
        }
        clearThemeCache()
        draw()
        setBadgeData(getYearsBadgeData(el))
        setLaneLabels(getLaneLabelsData(el))
      })
    }

    const onPageShow = (e) => {
      void e
      redraw()
    }
    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        redraw()
      }
    }
    const onOrientation = () => {
      redraw()
    }

    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('orientationchange', onOrientation)

    return () => {
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('orientationchange', onOrientation)
    }
  }, [draw, getYearsBadgeData, getLaneLabelsData])

  // Keyboard pan shortcuts (scope to focused canvas for WCAG 2.1/2.2)
  const handleCanvasKeyDown = useCallback((e) => {
    const { effScale } = getEffectiveTransform(canvasRef.current)
    const step = 50 / Math.max(effScale, 0.001)
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '0'].includes(e.key)) {
      e.preventDefault()
    }
    if (e.key === 'ArrowLeft') {
      handlePointerMove({ syntheticPan: { dx: -step, dy: 0 } }, effScale)
    } else if (e.key === 'ArrowRight') {
      handlePointerMove({ syntheticPan: { dx: step, dy: 0 } }, effScale)
    } else if (e.key === 'ArrowUp') {
      handlePointerMove({ syntheticPan: { dx: 0, dy: -step } }, effScale)
    } else if (e.key === 'ArrowDown') {
      handlePointerMove({ syntheticPan: { dx: 0, dy: step } }, effScale)
    } else if (e.key === '+' || e.key === '=') {
      handleZoomIn()
    } else if (e.key === '-') {
      handleZoomOut()
    } else if (e.key === '0') {
      handleResetView()
    }
  }, [getEffectiveTransform, handlePointerMove, handleResetView, handleZoomIn, handleZoomOut])

  // Pointer events
  const handleCanvasPointerDown = (e) => {
    setIsDragging(true)
    // Track initial pointer position to detect drag vs click
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      pointerDownPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
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
    const el = canvasRef.current
    const { effScale } = el ? getEffectiveTransform(el) : { effScale: scaleRef.current }
    handlePointerUp(e, effScale)
    setHoveredMedal(null)
  }

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !layout) return

    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Prevent accidental clicks after dragging - check if pointer moved significantly
    const dx = mouseX - pointerDownPos.current.x
    const dy = mouseY - pointerDownPos.current.y
    const dragDistance = Math.sqrt(dx * dx + dy * dy)
    const DRAG_THRESHOLD = 5 // pixels - if moved more than this, it was a drag not a click

    if (dragDistance > DRAG_THRESHOLD) {
      // This was a drag, not a click - don't open medal details
      return
    }

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

    // Prevent accidental double-clicks after dragging
    const dx = mouseX - pointerDownPos.current.x
    const dy = mouseY - pointerDownPos.current.y
    const dragDistance = Math.sqrt(dx * dx + dy * dy)
    const DRAG_THRESHOLD = 5

    if (dragDistance > DRAG_THRESHOLD) {
      return
    }

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

      <div className="card overflow-hidden overscroll-contain mt-2" role="region" aria-label="Trädvy canvas" aria-describedby={['skilltree-help', legendId].filter(Boolean).join(' ')}>
        {!isFullscreen && (
          <div className="relative">
            <canvas
              ref={setCanvasRef}
              data-tour="tree-canvas"
              role="img"
              aria-label="Interaktiv träd-vy-canvas"
              aria-describedby={['skilltree-help', showLegend ? legendId : null, legendDescribedById].filter(Boolean).join(' ')}
              aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown = + - 0"
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
              {badgeData.map(badge => (
                <React.Fragment key={badge.id}>
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: `${badge.left}px`,
                      top: `${badge.top}px`,
                      transform: 'translate3d(-50%, -50%, 0)',
                      willChange: 'transform',
                      width: `${badge.w}px`,
                      height: `${badge.h}px`,
                      borderRadius: '9999px',
                      background: 'var(--color-background, #fff)',
                      boxShadow: '0 0 0 3px var(--color-background, #fff)',
                      zIndex: 0
                    }}
                  />
                  <span
                    role="note"
                    aria-label={`Kräver ${badge.text}`}
                    title={`Kräver ${badge.text}`}
                    className={[
                      'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium shadow-sm',
                      badge.variant === 'ready'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-primary/10 dark:bg-primary/20 text-foreground border-primary'
                    ].join(' ')}
                    style={{
                      position: 'absolute',
                      left: `${badge.left}px`,
                      top: `${badge.top}px`,
                      transform: 'translate3d(-50%, -50%, 0)',
                      willChange: 'transform',
                      width: `${badge.w}px`,
                      height: `${badge.h}px`,
                      whiteSpace: 'nowrap',
                      zIndex: 1
                    }}
                  >
                    <span aria-hidden="true">{badge.text}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Lane labels for timeline view */}
            {laneLabels.length > 0 && (
              <div className="pointer-events-none absolute inset-0">
                {laneLabels.map(label => (
                  <div
                    key={label.id}
                    role="note"
                    aria-label={`${label.line1} ${label.line2}`.replace('-', '')}
                    className="absolute left-0 text-xs leading-tight font-medium text-text-primary bg-background/95 backdrop-blur-sm px-1.5 py-0.5 rounded-r border-r border-t border-b border-border/60 shadow-sm"
                    style={{
                      top: `${label.top}px`,
                      transform: 'translateY(-50%)',
                      zIndex: 5,
                      maxWidth: '115px'
                    }}
                    title={`${label.line1} ${label.line2}`.replace('-', '')}
                  >
                    <div className="whitespace-nowrap">{label.line1}</div>
                    {label.line2 && <div className="whitespace-nowrap">{label.line2}</div>}
                  </div>
                ))}
              </div>
            )}

            {showLegend && (
              <div
                ref={legendRef}
                data-tour="tree-legend"
                className="absolute left-3 right-3 top-3 sm:left-4 sm:right-auto sm:top-4 z-[40] overflow-x-auto whitespace-nowrap rounded-md border border-border/60 bg-background/80 backdrop-blur-sm shadow-md px-3 py-1.5"
                style={{ marginTop: 'env(safe-area-inset-top)' }}
                role="note"
                id={legendId}
              >
                <ReviewLegend variant="canvas" />
              </div>
            )}

            <div
              className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 z-30"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="relative">
                <button
                  type="button"
                  ref={menuButtonRef}
                  data-tour="tree-actions"
                  aria-haspopup="menu"
                  aria-controls={menuId}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary border border-border text-foreground shadow-lg hover:bg-bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  title="Visa åtgärder"
                  aria-label="Visa åtgärder"
                >
                  <Icon name="MoreVertical" className="w-6 h-6" />
                </button>

                {menuOpen && (
                  <div
                    id={menuId}
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
                      onClick={() => { setMenuOpen(false); handleResetView() }}
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
                      onClick={() => { setMenuOpen(false); toggleLegend() }}
                      aria-pressed={showLegend}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {showLegend ? 'Dölj teckenförklaring' : 'Visa teckenförklaring'}
                    </button>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { setMenuOpen(false); setShowYearBadges(v => !v) }}
                      aria-pressed={showYearBadges}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {showYearBadges ? 'Dölj årsbrickor' : 'Visa årsbrickor'}
                    </button>
                    <div role="group" aria-label="Visualisering" className="border-t border-border/60">
                      <button
                        role="menuitemradio"
                        aria-checked={presetId === 'columns'}
                        type="button"
                        onClick={() => { setMenuOpen(false); setPresetId('columns'); handleResetView() }}
                        className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Visualisering: Standard (kolumner)
                      </button>
                      <button
                        role="menuitemradio"
                        aria-checked={presetId === 'timeline'}
                        type="button"
                        onClick={() => { setMenuOpen(false); setPresetId('timeline'); handleResetView() }}
                        className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Visualisering: Tidslinje
                      </button>
                    </div>
                    {(!currentProfile || isGuest) && (
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => { setMenuOpen(false); setOpenPicker(true) }}
                        className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Spara
                      </button>
                    )}
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { setMenuOpen(false); setHelpOpen(true) }}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Visa hjälp
                    </button>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { setMenuOpen(false); navigate('/skill-tree/fullscreen', { replace: true, state: { backgroundLocation: location } }) }}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-haspopup="dialog"
                      aria-controls="skilltree-fullscreen"
                    >
                      Öppna helskärm
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 z-30"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="inline-flex flex-col gap-2" data-tour="zoom-controls">
                <button
                  type="button"
                  aria-label="Zooma in"
                  onClick={handleZoomIn}
                  className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary border border-border text-foreground shadow-lg hover:bg-bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  title="Zooma in"
                >
                  <Icon name="Plus" className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Zooma ut"
                  onClick={handleZoomOut}
                  className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary border border-border text-foreground shadow-lg hover:bg-bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  title="Zooma ut"
                >
                  <Icon name="Minus" className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Återställ vy"
                  onClick={handleResetView}
                  className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary border border-border text-foreground shadow-lg hover:bg-bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  title="Återställ vy"
                >
                  <Icon name="RotateCcw" className="w-6 h-6" />
                </button>
              </div>
            </div>

            <p id="skilltree-help" className="sr-only">
              💡 Dra för att panorera • Nyp för att zooma • Klicka på märken för detaljer
            </p>

            {helpOpen && (
              <div
                role="dialog"
                aria-modal="false"
                aria-labelledby="skilltree-help-title"
                className="absolute left-1/2 bottom-24 -translate-x-1/2 w-[min(92vw,28rem)] rounded-md border border-border bg-background text-foreground shadow-xl p-4 z-30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 id="skilltree-help-title" className="text-sm font-semibold mb-1">Hjälp</h3>
                    <p className="text-sm text-muted-foreground">
                      Dra för att panorera • Nyp eller använd +/− för att zooma • 0 återställer vy • Klicka för detaljer
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Stäng hjälp"
                    className="btn btn-muted min-h-[44px] px-3 py-2"
                    onClick={() => setHelpOpen(false)}
                  >
                    Stäng
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
                data-tour="tree-actions"
                aria-haspopup="menu"
                aria-controls={menuId}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary border border-border text-foreground shadow-lg hover:bg-bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                title="Visa åtgärder"
                aria-label="Visa åtgärder"
              >
                <Icon name="MoreVertical" className="w-6 h-6" />
              </button>

              {menuOpen && (
                <div
                  id={menuId}
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
                    onClick={() => { setMenuOpen(false); handleResetView() }}
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
                    onClick={() => { setMenuOpen(false); toggleLegend() }}
                    aria-pressed={showLegend}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {showLegend ? 'Dölj teckenförklaring' : 'Visa teckenförklaring'}
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setMenuOpen(false); setShowYearBadges(v => !v) }}
                    aria-pressed={showYearBadges}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {showYearBadges ? 'Dölj årsbrickor' : 'Visa årsbrickor'}
                  </button>
                  <div role="group" aria-label="Visualisering" className="border-t border-border/60">
                    <button
                      role="menuitemradio"
                      aria-checked={presetId === 'columns'}
                      type="button"
                      onClick={() => { setMenuOpen(false); setPresetId('columns'); handleResetView() }}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Visualisering: Standard (kolumner)
                    </button>
                    <button
                      role="menuitemradio"
                      aria-checked={presetId === 'timeline'}
                      type="button"
                      onClick={() => { setMenuOpen(false); setPresetId('timeline'); handleResetView() }}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Visualisering: Tidslinje
                    </button>
                  </div>
                  {(!currentProfile || isGuest) && (
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { setMenuOpen(false); setOpenPicker(true) }}
                      className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Spara framsteg
                    </button>
                  )}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { setMenuOpen(false); setHelpOpen(true) }}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Visa hjälp
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    ref={closeBtnRef}
                    onClick={() => { setMenuOpen(false); closeFullscreen() }}
                    className="w-full text-left px-4 py-3 min-h-[44px] text-foreground hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Stäng helskärm
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Zoom controls (bottom-left) */}
          <div
            className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 z-[60]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="inline-flex flex-col gap-2" data-tour="zoom-controls">
              <button
                type="button"
                aria-label="Zooma in"
                onClick={handleZoomIn}
                className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary border border-border text-foreground shadow-lg hover:bg-bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                title="Zooma in"
              >
                <Icon name="Plus" className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Zooma ut"
                onClick={handleZoomOut}
                className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary border border-border text-foreground shadow-lg hover:bg-bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                title="Zooma ut"
              >
                <Icon name="Minus" className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Återställ vy"
                onClick={handleResetView}
                className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-secondary border border-border text-foreground shadow-lg hover:bg-bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                title="Återställ vy"
              >
                <Icon name="RotateCcw" className="w-6 h-6" />
              </button>
            </div>
          </div>

          {showFsOnboarding && (
            <div
              role="region"
              aria-label="Onboarding"
              className="absolute left-3 right-3 z-[50]"
              style={{ marginTop: 'env(safe-area-inset-top)', top: Math.max(12, legendSafeTop + 12) }}
            >
              <div className="rounded-md border border-border bg-background/80 backdrop-blur-sm shadow-md p-3">
                <p className="text-sm text-foreground mb-2">Spara dina framsteg?</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary min-h-[44px]"
                    onClick={() => {
                      try { window.localStorage.setItem('app:onboardingChoice', 'saved') } catch { /* ignore unwriteable storage */ }
                      setDismissedFsOnboarding(true)
                      setOpenPicker(true)
                    }}
                  >
                    Skapa profil
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary min-h-[44px]"
                    onClick={() => {
                      try { window.localStorage.setItem('app:onboardingChoice', 'guest') } catch { /* ignore unwriteable storage */ }
                      setDismissedFsOnboarding(true)
                      startExplorerMode()
                    }}
                  >
                    Fortsätt som gäst
                  </button>
                  <button
                    type="button"
                    className="btn btn-muted min-h-[44px]"
                    onClick={() => setDismissedFsOnboarding(true)}
                  >
                    Inte nu
                  </button>
                </div>
              </div>
            </div>
          )}
          {isFullscreen && isGuest && !showFsOnboarding && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2"
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
              role="group"
              aria-label="Snabbåtgärder (gäst)"
            >
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur-sm px-3 py-1.5 text-sm shadow-md min-h-[36px]"
                aria-label="Återställ alla"
                title="Återställ alla"
              >
                Återställ alla
              </button>
              <button
                type="button"
                onClick={() => setOpenPicker(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur-sm px-3 py-1.5 text-sm shadow-md min-h-[36px]"
                aria-label="Spara framsteg"
                title="Spara framsteg"
              >
                Spara framsteg
              </button>
            </div>
          )}
          <div className="flex-1">
            <div className="relative h-full">
              <canvas
                ref={setCanvasRef}
                data-tour="tree-canvas"
                role="img"
                aria-label="Interaktiv träd-vy-canvas"
                aria-describedby={['skilltree-help-fs', showLegend ? 'skilltree-legend-fs' : null, legendDescribedById].filter(Boolean).join(' ')}
                aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown = + - 0"
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
              {showLegend && (
                <div
                  ref={legendFsRef}
                  data-tour="tree-legend"
                  className="absolute left-3 right-3 top-3 sm:left-4 sm:right-auto sm:top-4 z-[40] overflow-x-auto whitespace-nowrap rounded-md border border-border/60 bg-background/80 backdrop-blur-sm shadow-md px-3 py-1.5"
                  style={{ marginTop: 'env(safe-area-inset-top)' }}
                  role="note"
                  id="skilltree-legend-fs"
                >
                  <ReviewLegend variant="canvas" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0">
                {badgeData.map(badge => (
                  <React.Fragment key={badge.id}>
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: `${badge.left}px`,
                        top: `${badge.top}px`,
                        transform: 'translate3d(-50%, -50%, 0)',
                        willChange: 'transform',
                        width: `${badge.w}px`,
                        height: `${badge.h}px`,
                        borderRadius: '9999px',
                        background: 'var(--color-background, #fff)',
                        boxShadow: '0 0 0 3px var(--color-background, #fff)',
                        zIndex: 0
                      }}
                    />
                    <span
                      role="note"
                      aria-label={`Kräver ${badge.text}`}
                      title={`Kräver ${badge.text}`}
                      className={[
                        'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium shadow-sm',
                        badge.variant === 'ready'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-primary/10 dark:bg-primary/20 text-foreground border-primary'
                      ].join(' ')}
                      style={{
                        position: 'absolute',
                        left: `${badge.left}px`,
                        top: `${badge.top}px`,
                        transform: 'translate3d(-50%, -50%, 0)',
                        willChange: 'transform',
                        width: `${badge.w}px`,
                        height: `${badge.h}px`,
                        whiteSpace: 'nowrap',
                        zIndex: 1
                      }}
                    >
                      <span aria-hidden="true">{badge.text}</span>
                    </span>
                  </React.Fragment>
                ))}
              </div>

              {/* Lane labels for timeline view */}
              {laneLabels.length > 0 && (
                <div className="pointer-events-none absolute inset-0">
                  {laneLabels.map(label => (
                    <div
                      key={label.id}
                      role="note"
                      aria-label={`${label.line1} ${label.line2}`.replace('-', '')}
                      className="absolute left-0 text-xs leading-tight font-medium text-text-primary bg-background/95 backdrop-blur-sm px-1.5 py-0.5 rounded-r border-r border-t border-b border-border/60 shadow-sm"
                      style={{
                        top: `${label.top}px`,
                        transform: 'translateY(-50%)',
                        zIndex: 5,
                        maxWidth: '115px'
                      }}
                      title={`${label.line1} ${label.line2}`.replace('-', '')}
                    >
                      <div className="whitespace-nowrap">{label.line1}</div>
                      {label.line2 && <div className="whitespace-nowrap">{label.line2}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p id="skilltree-help-fs" className="sr-only">
            💡 Dra för att panorera • Nyp för att zooma • Klicka på märken för detaljer
          </p>

          {helpOpen && (
            <div
              role="dialog"
              aria-modal="false"
              aria-labelledby="skilltree-help-title-fs"
              className="absolute left-1/2 bottom-24 -translate-x-1/2 w-[min(92vw,28rem)] rounded-md border border-border bg-background text-foreground shadow-xl p-4 z-[70]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="skilltree-help-title-fs" className="text-sm font-semibold mb-1">Hjälp</h3>
                  <p className="text-sm text-muted-foreground">
                    Dra för att panorera • Nyp för att zooma • Klicka för detaljer
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Stäng hjälp"
                  className="btn btn-muted min-h-[44px] px-3 py-2"
                  onClick={() => setHelpOpen(false)}
                >
                  Stäng
                </button>
              </div>
            </div>
          )}

          {/* Modal is route-driven while in fullscreen */}
        </div>
      )}

      <ConfirmDialog
        id="reset-confirm-skilltree"
        open={showConfirmReset}
        onCancel={() => setShowConfirmReset(false)}
        onConfirm={async () => {
          setShowConfirmReset(false)
          await resetCurrentProfileData()
        }}
        title="Återställa allt?"
        description="Detta rensar alla tillfälliga framsteg (märken och förkunskaper) i gästläget. Denna åtgärd går inte att ångra."
        confirmLabel="Återställ"
        cancelLabel="Avbryt"
        variant="danger"
      />
      <ProfileSelector
        id="save-progress-picker-canvas"
        mode="picker"
        open={openPicker}
        onClose={() => setOpenPicker(false)}
        forceCreate
        convertGuest
      />
      {/* Non-fullscreen modal is now route-driven via AppRoutes */}
    </div>
  )
}
