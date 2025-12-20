import React from 'react'
import { useSwipeGesture } from '../hooks/useSwipeGesture'

export default function SwipeableList({ children, onSwipe, className = '', ...rest }) {
  const swipe = useSwipeGesture({ onSwipe })
  return (
    <div
      role="region"
      aria-label="Swipeable content"
      className={className}
      {...swipe}
      {...rest}
    >
      {children}
    </div>
  )
}
