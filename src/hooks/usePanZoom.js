import { useState, useCallback, useRef } from 'react'

export function usePanZoom(initialScale = 1, minScale = 0.5, maxScale = 3) {
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [scale, setScale] = useState(initialScale)

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
  const startMomentum = useCallback((vx, vy) => {
    if (!isFinite(vx) || !isFinite(vy)) return
    if (getReduceMotion()) return
    stopMomentum()
    const s = inertiaRef.current
    s.vx = vx
    s.vy = vy
    s.lastT = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const step = (t) => {
      const prevT = s.lastT || t
      const dt = Math.max(1, t - prevT) // ms
      s.lastT = t
      // Exponential decay; adjust constant for feel
      const decay = Math.exp(-dt / 280)
      s.vx *= decay
      s.vy *= decay
      // Integrate in world units (vx, vy are world units per ms)
      setPanX(prev => prev + s.vx * dt)
      setPanY(prev => prev + s.vy * dt)
      if (Math.hypot(s.vx, s.vy) < 0.001) {
        stopMomentum()
        return
      }
      s.raf = requestAnimationFrame(step)
    }
    s.raf = requestAnimationFrame(step)
  }, [getReduceMotion, stopMomentum])

  const handleWheel = useCallback((e, effectiveScale) => {
    e.preventDefault()
    stopMomentum()
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
    setPanX(prev => prev + corrX)
    setPanY(prev => prev + corrY)
  }, [scale, minScale, maxScale, stopMomentum])

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    stopMomentum()
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
  }, [panX, panY, scale, stopMomentum])

  const handlePointerMove = useCallback((e, effectiveScale) => {
    // Allow synthetic pan via keyboard; dx/dy are in world units already.
    if (e.syntheticPan) {
      stopMomentum()
      const { dx, dy } = e.syntheticPan
      setPanX((prev) => prev + dx)
      setPanY((prev) => prev + dy)
      return
    }

    if (!pointersRef.current.has(e.pointerId)) return
    e.preventDefault()
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
      setPanX(prev => prev + corrX)
      setPanY(prev => prev + corrY)
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
      setPanX(dragStartRef.current.panX + deltaX)
      setPanY(dragStartRef.current.panY + deltaY)
    }
  }, [scale, minScale, maxScale, stopMomentum])

  const handlePointerUp = useCallback((e) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 1) {
      // Single-finger drag ended
      const v = inertiaRef.current
      const speed = Math.hypot(v.vx, v.vy)
      if (dragStartRef.current && speed > 0.002) {
        startMomentum(v.vx, v.vy)
      }
      dragStartRef.current = null
    }
    if (pointersRef.current.size < 2) {
      pinchRef.current.initialDistance = 0
    }
  }, [startMomentum])

  const resetView = useCallback(() => {
    stopMomentum()
    setPanX(0)
    setPanY(0)
    setScale(initialScale)
  }, [initialScale, stopMomentum])

  const setScaleAbsolute = useCallback((s) => {
    const clamped = Math.max(minScale, Math.min(maxScale, s))
    setScale(clamped)
  }, [minScale, maxScale])

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
