import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { useOnboardingTour } from '../hooks/useOnboardingTour'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function resolveTarget(selector) {
  if (!selector) return null
  try {
    return document.querySelector(selector)
  } catch {
    return null
  }
}

export default function OnboardingTourOverlay() {
  const { open, stepIndex, steps, close, complete, next, back } = useOnboardingTour()
  const step = steps?.[stepIndex] || null

  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)

  const [targetRect, setTargetRect] = useState(null)

  const updateTarget = useCallback(() => {
    if (!open) return
    if (typeof document === 'undefined') return
    const el = resolveTarget(step?.target)
    if (!el) {
      setTargetRect(null)
      return
    }
    try {
      el.scrollIntoView({ block: 'center', inline: 'nearest' })
    } catch {
      // ignore
    }
    const r = el.getBoundingClientRect()
    setTargetRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      right: r.right,
      bottom: r.bottom,
    })
  }, [open, step?.target])

  const isLast = stepIndex >= (steps?.length || 1) - 1
  const titleId = useMemo(() => `tour-title-${step?.id || stepIndex}`, [step?.id, stepIndex])
  const descId = useMemo(() => `tour-desc-${step?.id || stepIndex}`, [step?.id, stepIndex])

  const handleClose = useCallback(() => {
    close()
  }, [close])

  const handleSkip = useCallback(() => {
    complete()
  }, [complete])

  const handlePrimary = useCallback(() => {
    if (isLast) complete()
    else next()
  }, [isLast, complete, next])

  // Focus management + trap
  useEffect(() => {
    if (!open) return
    if (typeof document === 'undefined') return

    lastFocusedRef.current = document.activeElement
    const root = dialogRef.current
    if (!root) return

    const getFocusables = () =>
      root.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }
      if (e.key !== 'Tab') return

      const focusables = getFocusables()
      if (!focusables.length) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    // initial focus
    const focusables = getFocusables()
    ;(focusables[0] || root)?.focus?.()

    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('keydown', onKeyDown)
      const prev = lastFocusedRef.current
      if (prev && typeof prev.focus === 'function') {
        try {
          prev.focus()
        } catch {
          // ignore
        }
      }
    }
  }, [open, handleClose])

  // Target tracking
  useEffect(() => {
    if (!open) return
    updateTarget()
    const onResize = () => updateTarget()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [open, stepIndex, updateTarget])

  if (!open || !step) return null

  const onBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  // Mobile-first: bottom sheet always. Desktop: if target exists, position near it.
  const desktopPopoverStyle = (() => {
    if (!targetRect) return null
    if (typeof window === 'undefined') return null
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (vw < 768) return null

    const maxWidth = 360
    const margin = 12

    const preferredTop = targetRect.bottom + 10
    const top = clamp(preferredTop, margin, vh - margin - 220)

    const preferredLeft = targetRect.left
    const left = clamp(preferredLeft, margin, vw - margin - maxWidth)

    return {
      position: 'fixed',
      top,
      left,
      width: maxWidth,
    }
  })()

  const spotlightStyle = targetRect
    ? {
        position: 'fixed',
        top: Math.max(0, targetRect.top - 6),
        left: Math.max(0, targetRect.left - 6),
        width: Math.max(0, targetRect.width + 12),
        height: Math.max(0, targetRect.height + 12),
        borderRadius: 12,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
        pointerEvents: 'none',
      }
    : null

  return (
    <div className="fixed inset-0 z-50" onMouseDown={onBackdropMouseDown} aria-hidden={false}>
      {/* Spotlight (preferred) or plain scrim */}
      {spotlightStyle ? (
        <div aria-hidden="true" style={spotlightStyle} />
      ) : (
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={[
          'card',
          desktopPopoverStyle ? 'rounded-xl shadow-lg' : 'fixed inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-2xl shadow-lg',
          !desktopPopoverStyle
            ? 'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[min(90vw,520px)] md:rounded-xl'
            : '',
          'outline-none',
        ].join(' ')}
        style={desktopPopoverStyle || undefined}
      >
        <div className="p-4 sm:p-6">
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg sm:text-xl font-semibold text-foreground">
                {step.title}
              </h2>
              <p id={descId} className="mt-1 text-sm text-muted-foreground">
                {step.body}
              </p>
            </div>
            <button type="button" className="btn btn-muted min-h-[44px]" onClick={handleClose} aria-label="Stäng guiden">
              Stäng
            </button>
          </header>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground" aria-live="polite">
              Steg {stepIndex + 1} av {steps.length}
            </div>
            <button type="button" className="btn btn-secondary min-h-[44px]" onClick={handleSkip}>
              Hoppa över
            </button>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 safe-bottom">
            <button
              type="button"
              className="btn btn-secondary min-h-[44px]"
              onClick={back}
              disabled={stepIndex === 0}
              aria-disabled={stepIndex === 0}
            >
              Tillbaka
            </button>
            <button type="button" className="btn btn-primary min-h-[44px]" onClick={handlePrimary}>
              {isLast ? 'Klart' : 'Nästa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
