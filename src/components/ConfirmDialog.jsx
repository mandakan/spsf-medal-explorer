import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmDialog({
  open,
  title = 'Bekräfta',
  description = '',
  confirmLabel = 'OK',
  cancelLabel = 'Avbryt',
  onConfirm,
  onCancel,
  variant = 'danger',
  id = 'confirm-dialog',
}) {
  const overlayRef = useRef(null)
  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)
  const labelId = `${id}-title`
  const descId = `${id}-desc`

  useEffect(() => {
    if (!open) return
    lastFocusedRef.current = document.activeElement
    const root = dialogRef.current
    if (!root) return

    const getFocusables = () =>
      root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')

    const focusables = getFocusables()
    const first = focusables[0]
    first?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
      } else if (e.key === 'Tab') {
        const list = getFocusables()
        if (list.length === 0) return
        const firstEl = list[0]
        const lastEl = list[list.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl?.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl?.focus()
        }
      }
    }
    const onOverlayPointerDown = (e) => {
      if (e.target === overlayRef.current) {
        onCancel?.()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const overlayEl = overlayRef.current
    overlayEl?.addEventListener('pointerdown', onOverlayPointerDown, { capture: true })

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      overlayEl?.removeEventListener('pointerdown', onOverlayPointerDown, { capture: true })
      const prev = lastFocusedRef.current
      if (prev && typeof prev.focus === 'function') prev.focus()
    }
  }, [open, onCancel])

  if (!open) return null
  const btnConfirmClass = variant === 'danger' ? 'btn btn-danger min-h-[44px]' : 'btn btn-primary min-h-[44px]'

  const content = (
    <div ref={overlayRef} className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-3 safe-bottom">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descId}
        className="w-full sm:w-[28rem] max-w-[92vw] rounded-lg border border-border bg-background shadow-xl p-4"
      >
        <h2 id={labelId} className="text-base font-semibold mb-1 text-foreground">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
        ) : null}
        <div className="flex flex-row-reverse flex-wrap gap-2">
          <button type="button" className={btnConfirmClass} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="btn btn-secondary min-h-[44px]" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return content
  return createPortal(content, document.body)
}
