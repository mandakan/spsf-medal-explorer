import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { useProfile } from '../hooks/useProfile'
import UniversalAchievementLogger from './UniversalAchievementLogger'

export default function MedalDetailModal({ medalId, onClose }) {
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const { currentProfile } = useProfile()
  const medal = medalDatabase?.getMedalById(medalId)
  const [showLogger, setShowLogger] = useState(false)

  // Compute status once per change
  const status = useMemo(() => {
    if (!statuses) return null
    return (
      statuses.unlocked.find(s => s.medalId === medalId) ||
      statuses.achievable.find(s => s.medalId === medalId) ||
      statuses.locked.find(s => s.medalId === medalId) ||
      null
    )
  }, [statuses, medalId])

  if (!medal) return null

  const statusLabel = {
    unlocked: '🏆 Unlocked',
    achievable: '🎯 Achievable',
    locked: '🔒 Locked'
  }[status?.status] || 'Unknown'

  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const prevFocusRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const titleId = `medal-detail-title-${medalId || 'unknown'}`
  const descId = medal?.description ? `medal-detail-desc-${medalId || 'unknown'}` : undefined

  // Lock body scroll, set focus, restore focus on close
  useEffect(() => {
    prevFocusRef.current = typeof document !== 'undefined' ? document.activeElement : null
    const body = typeof document !== 'undefined' ? document.body : null
    const prevOverflow = body ? body.style.overflow : ''
    if (body) body.style.overflow = 'hidden'
    setMounted(true)

    // Move focus into the dialog
    const t = setTimeout(() => {
      // Try focus heading, otherwise panel
      const heading = panelRef.current?.querySelector(`#${titleId}`)
      if (heading && heading.focus) heading.focus()
      else panelRef.current?.focus()
    }, 0)

    // ESC to close
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      if (body) body.style.overflow = prevOverflow
      // Restore focus to the previously focused element if still in the document
      const prev = prevFocusRef.current
      if (prev && typeof prev.focus === 'function') {
        try {
          prev.focus()
        } catch {
          // no-op
        }
      }
    }
  }, [onClose, titleId])

  // Focus trap inside the panel
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return
    const root = panelRef.current
    if (!root) return
    const focusable = root.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const current = document.activeElement
    if (e.shiftKey && current === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && current === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Close when clicking the scrim (not when clicking inside the panel)
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose?.()
    }
  }

  const handleAddAchievement = () => {
    setShowLogger(true)
  }

  const statusClass = 'bg-bg-secondary text-foreground ring-1 ring-border'

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={[
          'pointer-events-auto fixed',
          // Mobile bottom sheet
          'inset-x-0 bottom-0 w-full max-h-[80vh]',
          // Desktop right drawer
          'sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[32rem] sm:h-full',
          // Surface
          'bg-bg-secondary shadow-2xl',
          // Shape
          'rounded-t-2xl sm:rounded-none sm:rounded-l-2xl',
          // Animation
          'transform transition-transform duration-200 ease-out motion-reduce:transition-none',
          mounted ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full',
          // Accessibility
          'focus:outline-none'
        ].join(' ')}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-4 sm:p-6 bg-bg-secondary border-b border-border">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-xl sm:text-2xl font-bold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary break-words"
                tabIndex={-1}
              >
                {medal.displayName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground break-words">
                {medal.type} • {medal.tier}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              aria-label="Close medal details"
              title="Close"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mb-4">
              <span
                className={[
                  'inline-block px-3 py-1 rounded-full text-sm font-semibold',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
                  statusClass
                ].join(' ')}
              >
                {statusLabel}
              </span>
            </div>

            {medal.description && (
              <div className="mb-4">
                <p id={descId} className="text-muted-foreground break-words">
                  {medal.description}
                </p>
              </div>
            )}

            {status?.details?.missingItems?.length > 0 && (
              <div className="mb-4 bg-background border border-border rounded p-3">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Missing Prerequisites:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {status.details.missingItems.map((item, i) => (
                    <li key={i} className="break-words">• {item.description}</li>
                  ))}
                </ul>
              </div>
            )}

            {status?.details?.items?.length > 0 && (
              <div className="mb-4 bg-background border border-border rounded p-3">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Requirements:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {status.details.items.map((item, i) => (
                    <li key={i} className="break-words">
                      <span className={item.isMet ? 'text-foreground' : 'text-muted-foreground'}>
                        {item.isMet ? '✓' : '○'}
                      </span>{' '}
                      {item.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 sm:p-6 border-t border-border">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md bg-background text-foreground hover:bg-bg-secondary ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
            >
              Close
            </button>
            {status?.status === 'achievable' && currentProfile && (
              <button
                type="button"
                onClick={handleAddAchievement}
                aria-expanded={showLogger}
                className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              >
                Add Achievement
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
