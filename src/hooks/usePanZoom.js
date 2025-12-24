import { useState, useCallback, useRef } from 'react'

export function usePanZoom(initialScale = 1, minScale = 0.5, maxScale = 3) {
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [scale, setScale] = useState(initialScale)

  const dragStartRef = useRef(null)
  const pointersRef = useRef(new Map()) // pointerId -> { x, y }
  const pinchRef = useRef({ initialDistance: 0, initialScale: initialScale, lastCenter: null })

  const handleWheel = useCallback((e, effectiveScale) => {
    e.preventDefault()
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
  }, [scale, minScale, maxScale])

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    e.currentTarget?.setPointerCapture?.(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 1) {
      dragStartRef.current = { x: e.clientX, y: e.clientY, panX, panY }
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      const dx = pts[1].x - pts[0].x
      const dy = pts[1].y - pts[0].y
      pinchRef.current.initialDistance = Math.hypot(dx, dy)
      pinchRef.current.initialScale = scale
      pinchRef.current.lastCenter = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
    }
  }, [panX, panY, scale])

  const handlePointerMove = useCallback((e, effectiveScale) => {
    // Allow synthetic pan via keyboard; dx/dy are in world units already.
    if (e.syntheticPan) {
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
    } else if (pointersRef.current.size === 1 && dragStartRef.current) {
      const s = Math.max(0.001, effectiveScale ?? scale)
      const deltaX = (e.clientX - dragStartRef.current.x) / s
      const deltaY = (e.clientY - dragStartRef.current.y) / s
      setPanX(dragStartRef.current.panX + deltaX)
      setPanY(dragStartRef.current.panY + deltaY)
    }
  }, [scale, minScale, maxScale])

  const handlePointerUp = useCallback((e) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 1) {
      dragStartRef.current = null
    }
    if (pointersRef.current.size < 2) {
      pinchRef.current.initialDistance = 0
    }
  }, [])

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
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetView
  }
}
