import { useRef } from 'react'

/**
 * Client-side swipe detection hook.
 * - threshold: minimum px before counting a swipe
 * - allowedDirections: subset of ['left','right','up','down']
 */
export function useSwipeGesture({
  onSwipe,
  threshold = 50,
  allowedDirections = ['left', 'right', 'up', 'down'],
} = {}) {
  const startRef = useRef({ x: 0, y: 0, t: 0 })
  const lastRef = useRef({ x: 0, y: 0, t: 0 })

  const onTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return
    const t = e.touches[0]
    startRef.current = { x: t.clientX, y: t.clientY, t: Date.now() }
    lastRef.current = { x: t.clientX, y: t.clientY, t: Date.now() }
  }

  const onTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return
    const t = e.touches[0]
    lastRef.current = { x: t.clientX, y: t.clientY, t: Date.now() }
  }

  const onTouchEnd = () => {
    const dx = lastRef.current.x - startRef.current.x
    const dy = lastRef.current.y - startRef.current.y
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)

    let direction = null
    if (adx > ady) {
      if (adx >= threshold) direction = dx > 0 ? 'right' : 'left'
    } else {
      if (ady >= threshold) direction = dy > 0 ? 'down' : 'up'
    }

    if (direction && allowedDirections.includes(direction)) {
      onSwipe?.(direction)
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
