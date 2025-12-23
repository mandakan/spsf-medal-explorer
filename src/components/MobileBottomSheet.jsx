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
  const prevFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return
    // Remember previously focused element to restore on close
    prevFocusRef.current = document.activeElement
    const node = sheetRef.current

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      }
    }
    // Trap focus within the sheet
    const onTrapKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const root = node
      if (!root) return
      const focusables = root.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const list = Array.from(focusables).filter(n => !n.hasAttribute('disabled') && n.getAttribute('aria-hidden') !== 'true')
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    node?.addEventListener('keydown', onTrapKeyDown)

    // Focus the sheet when it opens for accessibility
    const t = setTimeout(() => node?.focus(), 0)

    return () => {
      document.removeEventListener('keydown', onKey)
      node?.removeEventListener('keydown', onTrapKeyDown)
      clearTimeout(t)
      // Restore focus to the element that opened the dialog
      if (prevFocusRef.current && typeof prevFocusRef.current.focus === 'function') {
        prevFocusRef.current.focus()
      }
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
          transition: (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'none' : 'transform 200ms ease',
          maxHeight: '85dvh',
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
        <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] overflow-auto" style={{ maxHeight: 'calc(85dvh - 56px)', overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
