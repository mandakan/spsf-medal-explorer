import React, { useEffect, useRef } from 'react'
import { useSwipeGesture } from '../hooks/useSwipeGesture'

export default function MobileBottomSheet({
  id,
  title,
  open,
  onClose,
  swipeToDismiss = true,
  children,
}) {
  const sheetRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    // Focus the sheet when it opens for accessibility
    const t = setTimeout(() => sheetRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open, onClose])

  const swipe = useSwipeGesture({
    onSwipe: (dir) => {
      if (swipeToDismiss && (dir === 'down' || dir === 'right')) {
        onClose?.()
      }
    },
  })

  if (!open) return null

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-50"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
        aria-hidden
      />
      {/* Sheet */}
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id ? `${id}-title` : undefined}
        ref={sheetRef}
        tabIndex={-1}
        className="absolute left-0 right-0 bottom-0 bg-bg-secondary text-foreground rounded-t-2xl shadow-2xl border-t border-border focus:outline-none"
        style={{
          transform: 'translateY(0)',
          transition: 'transform 250ms ease',
          maxHeight: '85vh',
          WebkitOverflowScrolling: 'touch',
        }}
        {...swipe}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 id={id ? `${id}-title` : undefined} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            className="btn btn-muted h-11 w-11 inline-flex items-center justify-center"
            onClick={() => onClose?.()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-auto safe-bottom" style={{ maxHeight: 'calc(85vh - 56px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
