import { useState, useCallback, useRef } from 'react'

export function usePanZoom(initialScale = 1, minScale = 0.5, maxScale = 3) {
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [scale, setScale] = useState(initialScale)

  const dragStartRef = useRef(null)
  const pointersRef = useRef(new Map()) // pointerId -> { x, y }
  const pinchRef = useRef({ initialDistance: 0, initialScale: initialScale, lastCenter: null })

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    const next = Math.max(minScale, Math.min(maxScale, scale * factor))
    setScale(next)
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

  const handlePointerMove = useCallback((e) => {
    // Allow synthetic pan via keyboard
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
      setScale(next)
    } else if (pointersRef.current.size === 1 && dragStartRef.current) {
      const deltaX = (e.clientX - dragStartRef.current.x) / Math.max(scale, 0.001)
      const deltaY = (e.clientY - dragStartRef.current.y) / Math.max(scale, 0.001)
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
