import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { useMedalCalculator } from '../hooks/useMedalCalculator'
import { useProfile } from '../hooks/useProfile'
import UniversalAchievementLogger from './UniversalAchievementLogger'
import { UndoRedoProvider } from '../contexts/UndoRedoContext'
import { useUnlockGuard } from '../hooks/useUnlockGuard'

export default function MedalDetailModal({ medalId, onClose }) {
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const calculator = useMedalCalculator()
  const { currentProfile } = useProfile()
  const medal = medalDatabase?.getMedalById(medalId)
  const [showLogger, setShowLogger] = useState(false)

  const { canRemove, blocking, tryRemove } = useUnlockGuard(medalId)
  const [showConfirmRemove, setShowConfirmRemove] = useState(false)
  const [showBlockedInfo, setShowBlockedInfo] = useState(false)

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

  const requirementItems = useMemo(() => {
    if (!medal) return []
    const hasReqFromStatus =
      status?.details && status.reason !== 'prerequisites_not_met' && Array.isArray(status.details.items)
    if (hasReqFromStatus) return status.details.items
    try {
      const res = calculator?.checkRequirements?.(medal)
      return res?.items || []
    } catch {
      return []
    }
  }, [calculator, medal, status])

  const blockingMedals = useMemo(() => {
    return (blocking || [])
      .map(id => medalDatabase?.getMedalById(id))
      .filter(Boolean)
  }, [blocking, medalDatabase])

  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const prevFocusRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const titleId = `medal-detail-title-${medalId || 'unknown'}`
  const underReview = medal ? (typeof medal.isUnderReview === 'function' ? medal.isUnderReview() : (medal.reviewed !== true)) : false
  const descBaseId = medal?.description ? `medal-detail-desc-${medalId || 'unknown'}` : null
  const underReviewNoteId = underReview && medal ? `under-review-note-${medal.id}` : null
  const descId = [descBaseId, underReviewNoteId].filter(Boolean).join(' ') || undefined

  // Lock body scroll, set focus, restore focus on close
  useEffect(() => {
    if (!medal) return
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
  }, [onClose, titleId, medal])

  if (!medal) return null

  const statusLabel = {
    unlocked: '🏆 Unlocked',
    achievable: '🎯 Achievable',
    locked: '🔒 Locked'
  }[status?.status] || '🔒 Locked'


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

  const handleRemoveClick = () => {
    if (canRemove) {
      setShowBlockedInfo(false)
      setShowConfirmRemove(true)
    } else {
      setShowConfirmRemove(false)
      setShowBlockedInfo(true)
    }
  }

  const handleConfirmRemove = async () => {
    const res = await tryRemove()
    if (res?.ok) {
      setShowConfirmRemove(false)
    }
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
                {underReview && (
                  <span
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700"
                    aria-label="Medal rules status: under review"
                  >
                    Under review
                  </span>
                )}
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

            {showConfirmRemove && status?.status === 'unlocked' && canRemove && (
              <div className="mb-4 bg-background border border-border rounded p-3" role="dialog" aria-modal="false" aria-labelledby="confirm-remove-title">
                <p id="confirm-remove-title" className="text-sm font-semibold text-foreground mb-2">
                  Remove unlocked?
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  This won’t affect other medals.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmRemove(false)}
                    className="px-3 py-2 rounded-md bg-background text-foreground hover:bg-bg-secondary ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRemove}
                    className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {showBlockedInfo && status?.status === 'unlocked' && !canRemove && (
              <div className="mb-4 bg-background border border-border rounded p-3" role="region" aria-labelledby="blocked-remove-title">
                <p id="blocked-remove-title" className="text-sm font-semibold text-foreground mb-2">
                  Can’t remove yet
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  These unlocked medals depend on this one:
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                  {blockingMedals.map(m => (
                    <li key={m.id} className="break-words">{m.displayName || m.name}</li>
                  ))}
                </ul>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowBlockedInfo(false)}
                    className="px-3 py-2 rounded-md bg-background text-foreground hover:bg-bg-secondary ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            {underReview && (
              <div id={`under-review-note-${medal.id}`} className="mb-4 bg-amber-50 text-amber-900 border border-amber-300 rounded p-3 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-700">
                The rules for this medal are under review and may change.
              </div>
            )}

            {medal.description && (
              <div className="mb-4">
                <p id={descBaseId} className="text-muted-foreground break-words">
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

            {requirementItems.length > 0 && (
              <div className="mb-4 bg-background border border-border rounded p-3">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Requirements:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {requirementItems.map((item, i) => (
                    <li key={i} className="break-words">
                      <span className={item.isMet ? 'text-foreground' : 'text-muted-foreground'}>
                        {item.isMet ? '✓' : '○'}
                      </span>{' '}
                      {item.description || item.type}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showLogger && (
              <div className="mt-4">
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">Log achievement</h3>
                    <button
                      type="button"
                      className="btn btn-muted text-sm"
                      onClick={() => setShowLogger(false)}
                      aria-label="Close log achievement form"
                    >
                      Close
                    </button>
                  </div>
                  <UndoRedoProvider>
                    <UniversalAchievementLogger
                      medal={medal}
                      unlockMode={status?.status === 'achievable'}
                      onSuccess={() => setShowLogger(false)}
                    />
                  </UndoRedoProvider>
                </div>
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

            {status?.status === 'unlocked' && currentProfile && (
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRemoveClick}
                  aria-haspopup="dialog"
                  aria-expanded={showConfirmRemove || showBlockedInfo}
                  className="flex-1 px-4 py-2 rounded-md bg-background text-foreground hover:bg-bg-secondary ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                >
                  Remove unlocked
                </button>
                {!canRemove && (
                  <button
                    type="button"
                    onClick={() => setShowBlockedInfo(true)}
                    className="text-sm text-muted-foreground underline"
                    aria-label="Why can’t I remove this medal?"
                  >
                    Why can’t I?
                  </button>
                )}
              </div>
            )}

            {status?.status === 'achievable' && currentProfile && (
              <button
                type="button"
                onClick={handleAddAchievement}
                aria-expanded={showLogger}
                className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              >
                Unlock Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
