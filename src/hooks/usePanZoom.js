import { useState, useCallback, useRef } from 'react'

export function usePanZoom(initialScale = 1, minScale = 0.5, maxScale = 3) {
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [scale, setScale] = useState(initialScale)
  const dragStartRef = useRef(null)

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    const next = Math.max(minScale, Math.min(maxScale, scale * factor))
    setScale(next)
  }, [scale, minScale, maxScale])

  const handleMouseDown = useCallback((e) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX, panY }
  }, [panX, panY])

  const handleMouseMove = useCallback((e) => {
    // Allow synthetic pan via keyboard
    if (e.syntheticPan) {
      const { dx, dy } = e.syntheticPan
      setPanX((prev) => prev + dx)
      setPanY((prev) => prev + dy)
      return
    }
    if (!dragStartRef.current) return
    const deltaX = (e.clientX - dragStartRef.current.x) / scale
    const deltaY = (e.clientY - dragStartRef.current.y) / scale
    setPanX(dragStartRef.current.panX + deltaX)
    setPanY(dragStartRef.current.panY + deltaY)
  }, [scale])

  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null
  }, [])

  // Touch support: single finger pan, two-finger pinch zoom
  const pinchRef = useRef({ initialDistance: 0, initialScale: initialScale, lastCenter: null })

  const getTouchInfo = (touches) => {
    const [t1, t2] = touches
    if (touches.length === 1) {
      return { type: 'pan', x: t1.clientX, y: t1.clientY }
    }
    const dx = t2.clientX - t1.clientX
    const dy = t2.clientY - t1.clientY
    const distance = Math.hypot(dx, dy)
    const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
    return { type: 'pinch', distance, center }
  }

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX, panY }
    } else if (e.touches.length === 2) {
      const info = getTouchInfo(e.touches)
      pinchRef.current = { initialDistance: info.distance, initialScale: scale, lastCenter: info.center }
    }
  }, [panX, panY, scale])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1 && dragStartRef.current) {
      const t = e.touches[0]
      const deltaX = (t.clientX - dragStartRef.current.x) / scale
      const deltaY = (t.clientY - dragStartRef.current.y) / scale
      setPanX(dragStartRef.current.panX + deltaX)
      setPanY(dragStartRef.current.panY + deltaY)
    } else if (e.touches.length === 2) {
      const info = getTouchInfo(e.touches)
      const ratio = info.distance / (pinchRef.current.initialDistance || info.distance)
      const next = Math.max(minScale, Math.min(maxScale, pinchRef.current.initialScale * ratio))
      setScale(next)
    }
  }, [scale, minScale, maxScale])

  const handleTouchEnd = useCallback(() => {
    dragStartRef.current = null
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
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView
  }
}
