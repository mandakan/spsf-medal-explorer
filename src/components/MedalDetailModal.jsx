import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { useMedalCalculator } from '../hooks/useMedalCalculator'
import { useProfile } from '../hooks/useProfile'
import UnlockMedalDialog from './UnlockMedalDialog'
import RemoveMedalDialog from './RemoveMedalDialog'
import { useUnlockGuard } from '../hooks/useUnlockGuard'
const Markdown = lazy(() => import('react-markdown'))
import remarkGfm from 'remark-gfm'
import { useNavigate, useLocation } from 'react-router-dom'
import Disclaimer from './Disclaimer'
import { LINKS } from '../config/links'

export default function MedalDetailModal({ medalId, onClose, onNavigateMedal }) {
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const calculator = useMedalCalculator()
  const { currentProfile } = useProfile()
  const allowManual = !!currentProfile?.features?.allowManualUnlock
  const medal = medalDatabase?.getMedalById(medalId)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const originalId = medal ? `medal-req-original-${medal.id}` : undefined
  const [showUnlockTargets, setShowUnlockTargets] = useState(false)
  const unlockTargetsId = medal ? `medal-unlock-targets-${medal.id}` : undefined

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

  // Unlocked date/year for display
  const unlockedIso = useMemo(() => {
    if (status?.status !== 'unlocked') return null
    return status?.unlockedDate || calculator?.getUnlockedDate?.(medalId) || null
  }, [status, calculator, medalId])

  const unlockedYear = useMemo(() => {
    if (!unlockedIso) return null
    const d = new Date(unlockedIso)
    return Number.isNaN(d.getTime()) ? null : d.getFullYear()
  }, [unlockedIso])

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

  // Prerequisites (presence + optional year-offset gap) for display and gating "Unlock"
  const prereqCheck = useMemo(() => {
    if (!calculator || !medal) return { allMet: true, items: [], missingItems: [] }
    try {
      return calculator.checkPrerequisites(medal)
    } catch {
      return { allMet: true, items: [], missingItems: [] }
    }
  }, [calculator, medal])

  const prereqGapFailedIds = useMemo(() => {
    const set = new Set()
    for (const m of (prereqCheck.missingItems || [])) {
      if (m && m.type === 'medal' && m.offsetChecked) set.add(m.medalId)
    }
    return set
  }, [prereqCheck])

  const prereqItemsResolved = useMemo(() => {
    return (prereqCheck.items || []).map((it) => {
      if (it.type === 'medal') {
        const ref = medalDatabase?.getMedalById?.(it.medalId)
        const gapFailed = prereqGapFailedIds.has(it.medalId)
        return {
          ...it,
          displayName: ref?.displayName || ref?.name || it.medalId,
          displayMet: it.isMet && !gapFailed,
          gapFailed,
        }
      }
      return it
    })
  }, [prereqCheck, prereqGapFailedIds, medalDatabase])

  const prereqsOk = prereqCheck?.allMet === true
  const prereqHintId = medal ? `unlock-prereq-hint-${medal.id}` : undefined

  const blockingMedals = useMemo(() => {
    return (blocking || [])
      .map(id => medalDatabase?.getMedalById(id))
      .filter(Boolean)
  }, [blocking, medalDatabase])

  const referencedMedals = useMemo(() => {
    const refs = Array.isArray(medal?.references) ? medal.references : []
    return refs.map(r => {
      const m = medalDatabase?.getMedalById?.(r.medalId)
      if (!m) return null
      return { target: m, description: r.description || '' }
    }).filter(Boolean)
  }, [medal, medalDatabase])

  const unlockTargets = useMemo(() => {
    if (!medal || !medalDatabase?.getAllMedals) return []
    const all = medalDatabase.getAllMedals()
    return all
      .filter(m =>
        m?.id !== medal.id &&
        Array.isArray(m?.prerequisites) &&
        m.prerequisites.some(p => p?.type === 'medal' && p.medalId === medal.id)
      )
      .map(m => ({ target: m }))
  }, [medal, medalDatabase])

  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const prevFocusRef = useRef(null)
  const titleId = `medal-detail-title-${medalId || 'unknown'}`
  const isPlaceholder = medal ? (typeof medal.isPlaceholder === 'function' ? medal.isPlaceholder() : (medal.status === 'placeholder')) : false
  const underReview = medal && !isPlaceholder ? (typeof medal.isUnderReview === 'function' ? medal.isUnderReview() : (medal.status === 'under_review')) : false
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
    // Trigger enter animation without React state to avoid cascading renders
    const panelEl = panelRef.current
    if (panelEl) {
      panelEl.classList.remove('translate-y-full', 'sm:translate-x-full')
      panelEl.classList.add('translate-y-0', 'sm:translate-x-0')
    }

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

  useEffect(() => {
    if (!medal) return
    if (typeof document === 'undefined') return
    const prev = document.title
    const name = medal.displayName || medal.name || String(medalId)
    try {
      document.title = `${name} - Detaljer`
    } catch {
      // Ignore non-critical document title update errors
    }
    return () => {
      try {
        document.title = prev
      } catch {
        // Ignore non-critical document title update errors
      }
    }
  }, [medal, medalId])

  if (!medal) return null

  const statusLabel = {
    unlocked: '🏆 Upplåst',
    achievable: '🎯 Uppnåelig',
    locked: '🔒 Låst'
  }[status?.status] || '🔒 Locked'

  const mdComponents = {
    ul: (props) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
    ol: (props) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
    li: (props) => <li className="marker:text-muted-foreground" {...props} />,
    table: (props) => (
      <div className="my-2 overflow-x-auto">
        <table className="w-full text-sm border-collapse" {...props} />
      </div>
    ),
    thead: (props) => <thead className="bg-bg-secondary" {...props} />,
    th: (props) => <th className="border border-border px-2 py-1 text-left font-semibold" {...props} />,
    td: (props) => <td className="border border-border px-2 py-1 align-top" {...props} />,
    a: ({ href, children, ...rest }) => (
      <a
        href={href}
        className="underline text-primary hover:text-primary-hover"
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    ),
    code: (props) => <code className="px-1 py-0.5 rounded bg-bg-secondary" {...props} />
  }


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

  const handleReferenceClick = (targetId) => (e) => {
    const isPlainLeftClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey
    if (!isPlainLeftClick) return
    e.preventDefault()
    if (typeof onNavigateMedal === 'function') {
      onNavigateMedal(targetId)
      return
    }
    const background = location.state?.backgroundLocation
    navigate(`/medals/${targetId}`, {
      state: background ? { backgroundLocation: background } : undefined
    })
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
          'inset-x-0 bottom-0 w-full h-[90svh] max-h-[90vh]',
          // Desktop right drawer
          'sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[32rem] sm:h-full',
          // Surface
          'bg-bg-secondary shadow-2xl overflow-hidden',
          // Shape
          'rounded-t-2xl sm:rounded-none sm:rounded-l-2xl',
          // Animation
          'transform transition-transform duration-200 ease-out motion-reduce:transition-none',
          'translate-y-full sm:translate-y-0 sm:translate-x-full',
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
                {isPlaceholder ? (
                  <span
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700"
                    aria-label="Status: plats­hållare"
                  >
                    Plats­hållare
                  </span>
                ) : underReview && (
                  <span
                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700"
                    aria-label="Status för regler: under granskning"
                  >
                    Under granskning
                  </span>
                )}
              </h2>
              {!isPlaceholder && (
                <p className="mt-1 text-sm text-muted-foreground break-words">
                  {medal.type} • {medal.tier}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              aria-label="Stäng medal-detaljer"
              title="Stäng"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
            <div className="mb-4">
              <Disclaimer
                id="disclaimer-rules"
                variant="warning"
                text="Regelboken gäller före appens tolkning. Kontrollera alltid senaste officiella regelbok."
                linkUrl={LINKS.RULEBOOK}
              />
            </div>
            {!isPlaceholder && (
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
            )}
            {isPlaceholder && (
              <div className="mb-4 bg-background border border-border rounded p-3" role="region" aria-label="Plats­hållare">
                <p className="text-sm text-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
            )}

            {!isPlaceholder && unlockedYear != null && (
              <div className="mb-4 bg-background border border-border rounded p-3" role="status" aria-live="polite">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Upplåst</span>:{' '}
                  <time dateTime={(function() { try { return new Date(unlockedIso).toISOString().slice(0,10) } catch { return String(unlockedIso) } })()}>
                    {unlockedYear}
                  </time>
                </p>
              </div>
            )}

            {/* Prerequisites */}
            {!isPlaceholder && prereqItemsResolved.length > 0 && (
              <div className="mb-4 bg-background border border-border rounded p-3" role="region" aria-labelledby={`prereq-title-${medal.id}`}>
                <p id={`prereq-title-${medal.id}`} className="text-sm font-semibold text-foreground mb-2">
                  Förhandskrav
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {prereqItemsResolved.map((item, i) => (
                    <li key={i} className="flex flex-wrap items-baseline gap-2 break-words">
                      <span className={item.displayMet ? 'text-foreground' : 'text-muted-foreground'}>
                        {item.displayMet ? '✅' : '❌'}
                      </span>
                      <span className="text-foreground">
                        {item.type === 'medal' ? (item.displayName || item.medalId) : (item.description || item.type)}
                      </span>
                      {item.type === 'medal' && typeof item.yearOffset === 'number' ? (
                        <span className={item.gapFailed ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
                          Kräver {item.yearOffset} års gap
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}



            {underReview && (
              <div id={`under-review-note-${medal.id}`} className="mb-4 bg-amber-50 text-amber-900 border border-amber-300 rounded p-3 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-700">
                Reglerna för det här märket är under granskning och kan komma att ändras.
              </div>
            )}

            {!isPlaceholder && medal.description && (
              <div className="mb-4">
                <p id={descBaseId} className="text-muted-foreground break-words">
                  {medal.description}
                </p>
              </div>
            )}

            {!isPlaceholder && status?.details?.missingItems?.length > 0 && (
              <div className="mb-4 bg-background border border-border rounded p-3">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Saknade förhandskrav:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {status.details.missingItems.map((item, i) => (
                    <li key={i} className="break-words">• {item.description}</li>
                  ))}
                </ul>
              </div>
            )}

            {!isPlaceholder && requirementItems.length > 0 && (
              <div className="mb-4 bg-background border border-border rounded p-3">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Krav:
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

            {!isPlaceholder && medal.requirementsOriginal && (
              <div className="mb-4 bg-background border border-border rounded">
                <button
                  type="button"
                  onClick={() => setShowOriginal(v => !v)}
                  aria-expanded={showOriginal}
                  aria-controls={originalId}
                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary rounded-t"
                >
                  <span className="text-sm font-semibold text-foreground">Visa ursprunglig kravtext</span>
                  <span aria-hidden="true" className="ml-2">{showOriginal ? '▼' : '▶'}</span>
                </button>
                {showOriginal && (
                  <div className="px-3 pb-3" id={originalId} aria-hidden={!showOriginal}>
                    <div className="text-sm text-foreground break-words">
                      <Suspense fallback={null}>
                        <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                          {medal.requirementsOriginal}
                        </Markdown>
                      </Suspense>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isPlaceholder && referencedMedals.length > 0 && (
              <div className="mb-4 bg-background border border-border rounded p-3">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Uppfyller också kraven för:
                </p>
                <ul className="space-y-1">
                  {referencedMedals.map(({ target }) => (
                    <li key={target.id}>
                      <a
                        href={`/medals/${target.id}`}
                        onClick={handleReferenceClick(target.id)}
                        className="inline-flex items-center underline text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary px-2 py-2 rounded min-h-[44px]"
                      >
                        {target.displayName || target.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!isPlaceholder && unlockTargets.length > 0 && (
              <div className="mb-4 bg-background border border-border rounded">
                <button
                  type="button"
                  onClick={() => setShowUnlockTargets(v => !v)}
                  aria-expanded={showUnlockTargets}
                  aria-controls={unlockTargetsId}
                  className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary rounded-t"
                >
                  <span className="text-sm font-semibold text-foreground">
                    Detta märke krävs för
                    <span className="ml-1 text-muted-foreground">({unlockTargets.length})</span>
                  </span>
                  <span aria-hidden="true" className="ml-2">{showUnlockTargets ? '▼' : '▶'}</span>
                </button>
                {showUnlockTargets && (
                  <div className="px-3 pb-3" id={unlockTargetsId} aria-hidden={!showUnlockTargets}>
                    <ul className="space-y-1">
                      {unlockTargets.map(({ target }) => (
                        <li key={target.id}>
                          <a
                            href={`/medals/${target.id}`}
                            onClick={handleReferenceClick(target.id)}
                            className="inline-flex items-center underline text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary px-2 py-2 rounded min-h-[44px]"
                          >
                            {target.displayName || target.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 sm:p-6 border-t border-border pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <button
              onClick={onClose}
              className="flex-1 min-h-[44px] px-4 py-2 rounded-md bg-background text-foreground hover:bg-bg-secondary ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
            >
              Stäng
            </button>

            {status?.status === 'unlocked' && currentProfile && !isPlaceholder && (
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRemoveClick}
                  aria-haspopup="dialog"
                  aria-expanded={showConfirmRemove || showBlockedInfo}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-md bg-background text-foreground hover:bg-bg-secondary ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                >
                  Ta bort upplåst
                </button>
                {!canRemove && (
                  <button
                    type="button"
                    onClick={() => setShowBlockedInfo(true)}
                    className="text-sm text-muted-foreground underline"
                    aria-label="Why can’t I remove this medal?"
                  >
                    Varför kan jag inte?
                  </button>
                )}
              </div>
            )}

            {currentProfile && !isPlaceholder && (status?.status === 'achievable' || (allowManual && status?.status !== 'unlocked')) && (
              <div className="flex-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setUnlockOpen(true)}
                  aria-haspopup="dialog"
                  aria-controls="unlock-medal"
                  disabled={!prereqsOk}
                  aria-disabled={!prereqsOk}
                  aria-describedby={!prereqsOk ? prereqHintId : undefined}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                >
                  Lås upp nu
                </button>
                {!prereqsOk && (
                  <p id={prereqHintId} className="text-xs text-muted-foreground">
                    Förhandskraven måste uppnåst innan märket kan låsas upp.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <UnlockMedalDialog
        medal={medal}
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
      />

      <RemoveMedalDialog
        medal={medal}
        open={showConfirmRemove}
        onClose={() => setShowConfirmRemove(false)}
        variant="confirm"
        onConfirmRemove={tryRemove}
      />
      <RemoveMedalDialog
        medal={medal}
        open={showBlockedInfo}
        onClose={() => setShowBlockedInfo(false)}
        variant="blocked"
        blockingMedals={blockingMedals}
      />
    </div>
  )
}
