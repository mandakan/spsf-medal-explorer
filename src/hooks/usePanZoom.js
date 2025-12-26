import { useState, useCallback, useRef, useEffect } from 'react'

export function usePanZoom(initialScale = 1, minScale = 0.5, maxScale = 3, opts = {}) {
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [scale, setScale] = useState(initialScale)
  const { getBounds = null, overscrollPx = 48, contentPaddingPx = { left: 0, top: 0, right: 0, bottom: 0 } } = opts

  const dragStartRef = useRef(null)
  const pointersRef = useRef(new Map()) // pointerId -> { x, y }
  const pinchRef = useRef({ initialDistance: 0, initialScale: initialScale, lastCenter: null })

  // Inertia state and helpers
  const inertiaRef = useRef({ vx: 0, vy: 0, lastT: 0, raf: 0 })
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 })
  const getReduceMotion = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])
  const stopMomentum = useCallback(() => {
    const s = inertiaRef.current
    if (s.raf) {
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
    s.vx = 0
    s.vy = 0
    s.lastT = 0
  }, [])
  // Viewport rect cache (updated from events that carry a currentTarget)
  const lastRectRef = useRef({ width: 0, height: 0 })
  // Live pan/scale refs for momentum and snap-back without re-renders
  const panRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(initialScale)
  useEffect(() => { scaleRef.current = scale }, [scale])
  useEffect(() => { panRef.current = { x: panX, y: panY } }, [panX, panY])

  const updateRectFromEvent = useCallback((e) => {
    const r = e?.currentTarget?.getBoundingClientRect?.()
    if (r) lastRectRef.current = { width: r.width, height: r.height }
  }, [])

  // Compute allowed pan range in world units for current scale and viewport
  const computePanLimits = useCallback((s, rect = lastRectRef.current) => {
    if (!opts || !getBounds || !rect?.width) return null
    const b = getBounds()
    const sEff = Math.max(0.001, s)

    // Viewport size in world units at current effective scale
    const viewW = rect.width / sEff
    const viewH = rect.height / sEff

    // Paddings converted to world units
    const padL = (contentPaddingPx?.left || 0) / sEff
    const padR = (contentPaddingPx?.right || 0) / sEff
    const padT = (contentPaddingPx?.top || 0) / sEff
    const padB = (contentPaddingPx?.bottom || 0) / sEff

    // Content size in world units
    const contentW = Math.max(0, (b.maxX - b.minX))
    const contentH = Math.max(0, (b.maxY - b.minY))

    // Available interactive pan space in world units.
    // pan = 0 means content's top-left (with padding) is aligned to viewport's top-left.
    const availX = viewW - (contentW + padL + padR)
    const availY = viewH - (contentH + padT + padB)

    // Pan-space limits
    const minX = Math.min(0, availX)
    const maxX = Math.max(0, availX)
    const minY = Math.min(0, availY)
    const maxY = Math.max(0, availY)

    return { minX, maxX, minY, maxY }
  }, [getBounds, opts, contentPaddingPx])

  // Clamp pan to limits with optional rubberband overscroll (in screen px)
  const applyClamp = useCallback((x, y, s, hard = false, rect = lastRectRef.current) => {
    const limits = computePanLimits(s, rect)
    if (!limits) return [x, y]
    const over = (overscrollPx || 0) / Math.max(0.001, s) // px -> world units
    let { minX, maxX, minY, maxY } = limits
    if (!hard && over > 0) {
      minX -= over; maxX += over
      minY -= over; maxY += over
    }
    const cx = Math.min(Math.max(x, minX), maxX)
    const cy = Math.min(Math.max(y, minY), maxY)
    return [cx, cy]
  }, [computePanLimits, overscrollPx])

  // Centralized pan setter that applies clamping
  const setPan = useCallback((x, y, s, hard = false, rect) => {
    const [cx, cy] = applyClamp(x, y, s, hard, rect)
    setPanX(cx)
    setPanY(cy)
    panRef.current = { x: cx, y: cy }
  }, [applyClamp])
  const startMomentum = useCallback((vx, vy, sEff) => {
    if (!isFinite(vx) || !isFinite(vy)) return
    if (getReduceMotion()) return
    stopMomentum()
    const s = inertiaRef.current
    s.vx = vx
    s.vy = vy
    s.lastT = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const eff = Math.max(0.001, sEff ?? (scaleRef.current || initialScale))
    const step = (t) => {
      const prevT = s.lastT || t
      const dt = Math.max(1, t - prevT) // ms
      s.lastT = t
      // Exponential decay; adjust constant for feel
      const decay = Math.exp(-dt / 280)
      s.vx *= decay
      s.vy *= decay
      // Integrate in world units (vx, vy are world units per ms)
      const nx = panRef.current.x + s.vx * dt
      const ny = panRef.current.y + s.vy * dt
      setPan(nx, ny, eff)
      if (Math.hypot(s.vx, s.vy) < 0.001) {
        stopMomentum()
        // Snap back inside hard bounds at rest
        const [sx, sy] = applyClamp(panRef.current.x, panRef.current.y, eff, true)
        setPan(sx, sy, eff, true)
        return
      }
      s.raf = requestAnimationFrame(step)
    }
    s.raf = requestAnimationFrame(step)
  }, [getReduceMotion, stopMomentum, setPan, applyClamp, initialScale])

  const handleWheel = useCallback((e, effectiveScale) => {
    e.preventDefault()
    stopMomentum()
    updateRectFromEvent(e)
    const el = e.currentTarget
    const rect = el?.getBoundingClientRect?.()
    const cx = rect ? e.clientX - rect.left : 0
    const cy = rect ? e.clientY - rect.top : 0
    const dx = rect ? cx - rect.width / 2 : 0
    const dy = rect ? cy - rect.height / 2 : 0

    const s0 = scale
    const factor = Math.pow(2, -e.deltaY / 300)
    const s1 = Math.max(minScale, Math.min(maxScale, s0 * factor))

    const eff0 = Math.max(0.001, effectiveScale ?? s0)
    const eff1 = Math.max(0.001, eff0 * (s1 / Math.max(0.001, s0)))

    const corrX = dx * (1 / eff1 - 1 / eff0)
    const corrY = dy * (1 / eff1 - 1 / eff0)

    setScale(s1)
    setPan(panX + corrX, panY + corrY, eff1, false, rect)
  }, [scale, minScale, maxScale, stopMomentum, updateRectFromEvent, setPan, panX, panY])

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    stopMomentum()
    updateRectFromEvent(e)
    e.currentTarget?.setPointerCapture?.(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now }

    if (pointersRef.current.size === 1) {
      dragStartRef.current = { x: e.clientX, y: e.clientY, panX, panY }
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      const dx = pts[1].x - pts[0].x
      const dy = pts[1].y - pts[0].y
      pinchRef.current.initialDistance = Math.hypot(dx, dy)
      pinchRef.current.initialScale = scale
      pinchRef.current.lastCenter = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
      // Clear velocity so pinch does not trigger momentum
      inertiaRef.current.vx = 0
      inertiaRef.current.vy = 0
    }
  }, [panX, panY, scale, stopMomentum, updateRectFromEvent])

  const handlePointerMove = useCallback((e, effectiveScale) => {
    // Allow synthetic pan via keyboard; dx/dy are in world units already.
    if (e.syntheticPan) {
      stopMomentum()
      const s = Math.max(0.001, effectiveScale ?? scale)
      const { dx, dy } = e.syntheticPan
      setPan(panX + dx, panY + dy, s)
      return
    }

    if (!pointersRef.current.has(e.pointerId)) return
    e.preventDefault()
    updateRectFromEvent(e)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      const dx = pts[1].x - pts[0].x
      const dy = pts[1].y - pts[0].y
      const distance = Math.hypot(dx, dy)
      const ratio = distance / (pinchRef.current.initialDistance || distance)
      const next = Math.max(minScale, Math.min(maxScale, pinchRef.current.initialScale * ratio))

      // Focal point correction around current pinch center
      const el = e.currentTarget
      const rect = el?.getBoundingClientRect?.()
      const cx = (pts[0].x + pts[1].x) / 2
      const cy = (pts[0].y + pts[1].y) / 2
      const localX = rect ? cx - rect.left : 0
      const localY = rect ? cy - rect.top : 0
      const dxLocal = rect ? localX - rect.width / 2 : 0
      const dyLocal = rect ? localY - rect.height / 2 : 0

      const s0 = scale
      const eff0 = Math.max(0.001, effectiveScale ?? s0)
      const eff1 = Math.max(0.001, eff0 * (next / Math.max(0.001, s0)))

      const corrX = dxLocal * (1 / eff1 - 1 / eff0)
      const corrY = dyLocal * (1 / eff1 - 1 / eff0)

      setScale(next)
      setPan(panX + corrX, panY + corrY, eff1, false, rect)
      // Clear velocity during pinch
      inertiaRef.current.vx = 0
      inertiaRef.current.vy = 0
    } else if (pointersRef.current.size === 1 && dragStartRef.current) {
      const s = Math.max(0.001, effectiveScale ?? scale)
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const last = lastMoveRef.current
      const dClientX = e.clientX - last.x
      const dClientY = e.clientY - last.y
      const dt = Math.max(1, now - last.t)

      // World-space deltas for velocity sampling
      const wdx = dClientX / s
      const wdy = dClientY / s
      const instVx = wdx / dt
      const instVy = wdy / dt

      // Exponential moving average for stable velocity
      const v = inertiaRef.current
      const alpha = 0.25
      v.vx = (1 - alpha) * v.vx + alpha * instVx
      v.vy = (1 - alpha) * v.vy + alpha * instVy

      lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now }

      const deltaX = (e.clientX - dragStartRef.current.x) / s
      const deltaY = (e.clientY - dragStartRef.current.y) / s
      setPan(dragStartRef.current.panX + deltaX, dragStartRef.current.panY + deltaY, s)
    }
  }, [scale, minScale, maxScale, stopMomentum, setPan, updateRectFromEvent, panX, panY])

  const handlePointerUp = useCallback((e, effectiveScale) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 1) {
      // Single-finger drag ended
      const v = inertiaRef.current
      const speed = Math.hypot(v.vx, v.vy)
      const currScale = Math.max(0.001, effectiveScale ?? (scaleRef.current || scale))
      if (dragStartRef.current && speed > 0.002) {
        startMomentum(v.vx, v.vy, currScale)
      } else {
        // Snap back to hard bounds if no momentum starts
        const [sx, sy] = applyClamp(panRef.current.x, panRef.current.y, currScale, true)
        setPan(sx, sy, currScale, true)
      }
      dragStartRef.current = null
    }
    if (pointersRef.current.size < 2) {
      pinchRef.current.initialDistance = 0
    }
  }, [startMomentum, applyClamp, setPan, scale])

  const resetView = useCallback(() => {
    stopMomentum()
    setScale(initialScale)
    setPan(0, 0, initialScale, true)
  }, [initialScale, stopMomentum, setPan])

  const setScaleAbsolute = useCallback((s) => {
    const clamped = Math.max(minScale, Math.min(maxScale, s))
    setScale(clamped)
    setPan(panX, panY, clamped)
  }, [minScale, maxScale, setPan, panX, panY])

  return {
    panX,
    panY,
    scale,
    setScaleAbsolute,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetView
  }
}
