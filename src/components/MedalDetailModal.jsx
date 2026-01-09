import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { useMedalCalculator } from '../hooks/useMedalCalculator'
import { useProfile } from '../hooks/useProfile'
import UnlockMedalDialog from './UnlockMedalDialog'
import RemoveMedalDialog from './RemoveMedalDialog'
import AchievementEntryDialog from './AchievementEntryDialog'
import { useUnlockGuard } from '../hooks/useUnlockGuard'
import { useFlag } from '../hooks/useFeatureFlags'
const Markdown = lazy(() => import('react-markdown'))
import remarkGfm from 'remark-gfm'
import { useNavigate, useLocation } from 'react-router-dom'
import Disclaimer from './Disclaimer'
import { LINKS } from '../config/links'
import RequirementTree from './RequirementTree'
import SectionCard from './SectionCard'
import StatusPill from './StatusPill'
import StatusIcon from './StatusIcon'
import Icon from './Icon'

export default function MedalDetailModal({ medalId, onClose, onNavigateMedal }) {
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const calculator = useMedalCalculator()
  const { currentProfile } = useProfile()
  const allowManual = !!currentProfile?.features?.allowManualUnlock
  const medal = medalDatabase?.getMedalById(medalId)
  const [selectedYear, setSelectedYear] = useState(null)
  const { state: achievementEntryEnabled } = useFlag('achievementEntry')
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [achievementEntryOpen, setAchievementEntryOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const originalId = medal ? `medal-req-original-${medal.id}` : undefined
  const unlockTargetsId = medal ? `medal-unlock-targets-${medal.id}` : undefined

  const { canRemove, blocking, tryRemove } = useUnlockGuard(medalId)
  const [showConfirmRemove, setShowConfirmRemove] = useState(false)
  const [showBlockedInfo, setShowBlockedInfo] = useState(false)

  // Compute status once per change
  const status = useMemo(() => {
    if (!statuses) return null
    return (
      statuses.unlocked.find(s => s.medalId === medalId) ||
      statuses.eligible.find(s => s.medalId === medalId) ||
      statuses.available.find(s => s.medalId === medalId) ||
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

  // Get eligible years and available years for year selector
  const eligibleYears = useMemo(() => {
    if (!calculator || !medalId) return []
    try {
      return calculator.getEligibleYears(medalId) || []
    } catch {
      return []
    }
  }, [calculator, medalId])

  const achievementYears = useMemo(() => {
    if (!calculator) return []
    try {
      return calculator.getAllAchievementYears() || []
    } catch {
      return []
    }
  }, [calculator])

  const currentYear = new Date().getFullYear()

  // Determine which year to show by default
  const defaultYear = useMemo(() => {
    // If unlocked, show the unlocked year
    if (unlockedYear != null) return unlockedYear
    // If user has selected a year, use that
    if (selectedYear != null) return selectedYear
    // If eligible in current year, show current year
    if (eligibleYears.includes(currentYear)) return currentYear
    // If eligible in any year, show the most recent eligible year
    if (eligibleYears.length > 0) return Math.max(...eligibleYears)
    // Otherwise show current year (to see what they're working towards)
    return currentYear
  }, [unlockedYear, selectedYear, eligibleYears, currentYear])

  // Available years for the selector: achievement years + current year + eligible years
  const availableYears = useMemo(() => {
    const years = new Set([...achievementYears, currentYear, ...eligibleYears])
    return Array.from(years).sort((a, b) => b - a) // Descending order
  }, [achievementYears, currentYear, eligibleYears])

  const reqTree = useMemo(() => {
    if (!medal) return null
    // If unlocked, use the tree from status which was computed at unlock time
    if (status?.status === 'unlocked' && status?.details?.tree) {
      return status.details.tree
    }
    // Otherwise evaluate for the selected/default year
    try {
      return calculator?.checkRequirements?.(medal, { endYear: defaultYear })?.tree ?? null
    } catch {
      return null
    }
  }, [calculator, medal, status, defaultYear])

  const reqCounts = useMemo(() => {
    if (!reqTree) return null
    const acc = { met: 0, total: 0 }
    const walk = (n) => {
      if (!n) return
      if (n.node === 'leaf') {
        acc.total += 1
        if (n.leaf?.isMet) acc.met += 1
        return
      }
      for (const ch of n.children || []) walk(ch)
    }
    walk(reqTree)
    return acc
  }, [reqTree])

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

  const prereqCounts = useMemo(() => {
    const items = prereqItemsResolved || []
    const total = items.length
    const met = items.reduce((a, it) => a + (it.displayMet ? 1 : 0), 0)
    return { met, total }
  }, [prereqItemsResolved])

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
  const placeholderNoteId = isPlaceholder && medal ? `placeholder-note-${medal.id}` : null
  const descId = [descBaseId, underReviewNoteId, placeholderNoteId].filter(Boolean).join(' ') || undefined

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

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50"
    >
      <div
        ref={panelRef}
        role="dialog"
        data-tour="medal-detail-panel"
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
              <div className="flex items-start gap-2 flex-wrap">
                <h2
                  id={titleId}
                  data-tour="medal-detail-title"
                  className="text-xl sm:text-2xl font-bold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary break-words"
                  tabIndex={-1}
                >
                  {medal.displayName}
                </h2>

                <div role="status" aria-live="polite" className="mt-1 sm:mt-0">
                  {isPlaceholder ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700"
                      aria-label="Status: plats­hållare"
                    >
                      <StatusIcon status="placeholder" className="w-3.5 h-3.5" />
                      Plats­hållare
                    </span>
                  ) : (
                    <StatusPill status={status?.status || 'locked'} />
                  )}
                </div>

                {underReview && (
                  <span
                    className="mt-1 sm:mt-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700"
                    aria-label="Status för regler: under granskning"
                  >
                    <StatusIcon status="review" className="w-3.5 h-3.5" />
                    Under granskning
                  </span>
                )}
              </div>
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
            {isPlaceholder && (
              <>
                <p id={placeholderNoteId} className="sr-only">
                  Detta är ett platshållarmärke. Avsnitten nedan visar exempel på information som kommer att finnas här när märket publiceras.
                </p>

                <SectionCard id={`placeholder-unlocked-${medal.id}`} title="Upplåst" collapsible={false}>
                  <p className="text-sm text-muted-foreground">
                    Här visas normalt vilket år du låste upp märket.
                  </p>
                </SectionCard>

                <SectionCard id={`placeholder-prereq-${medal.id}`} title="Förhandskrav" collapsible={false}>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Exempel: krav eller förkunskap 1</li>
                    <li>• Exempel: krav eller förkunskap 2</li>
                    <li>• Exempel: krav eller förkunskap 3</li>
                  </ul>
                </SectionCard>

                <SectionCard id={`placeholder-req-${medal.id}`} title="Krav" collapsible={false}>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><span className="text-foreground">✓</span> Exempel: uppfyllt krav</li>
                    <li><span className="text-muted-foreground">○</span> Exempel: krav som återstår</li>
                    <li><span className="text-muted-foreground">○</span> Exempel: ytterligare krav</li>
                  </ul>
                </SectionCard>

                <SectionCard id={descBaseId || `placeholder-desc-${medal.id}`} title="Beskrivning" collapsible={false}>
                  <p className="text-muted-foreground break-words">
                    Beskrivning kommer att visas här när innehållet är klart.
                  </p>
                </SectionCard>

                <SectionCard id={originalId} title="Visa ursprunglig kravtext" collapsible defaultOpen={false}>
                  <div className="text-sm text-foreground break-words">
                    <Suspense fallback={null}>
                      <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                        {`Det här avsnittet visar vanligtvis den ursprungliga kravtexten från regelboken.

- Exempelpunkt 1
- Exempelpunkt 2
- Exempelpunkt 3`}
                      </Markdown>
                    </Suspense>
                  </div>
                </SectionCard>

                <SectionCard id={`placeholder-refs-${medal.id}`} title="Uppfyller också kraven för" collapsible={false}>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Kommer snart</li>
                  </ul>
                </SectionCard>

                <SectionCard id={`placeholder-required-for-${medal.id}`} title="Detta märke krävs för" collapsible={false}>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Kommer snart</li>
                  </ul>
                </SectionCard>
              </>
            )}

            {!isPlaceholder && unlockedYear != null && (
              <SectionCard id={`unlocked-${medal.id}`} title="Upplåst" collapsible={false}>
                <div role="status" aria-live="polite">
                  <p className="text-sm text-foreground">
                    <time dateTime={(function() { try { return new Date(unlockedIso).toISOString().slice(0,10) } catch { return String(unlockedIso) } })()}>
                      {unlockedYear}
                    </time>
                  </p>
                </div>
              </SectionCard>
            )}

            {!isPlaceholder && prereqItemsResolved.length > 0 && (
              <SectionCard
                id={`prereq-${medal.id}`}
                title="Förhandskrav"
                summary={`${prereqCounts.met}/${prereqCounts.total} uppfyllda`}
                collapsible={false}
              >
                <ul className="list-none m-0 p-0 text-sm text-muted-foreground space-y-1">
                  {prereqItemsResolved.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Icon
                        name={item.displayMet ? 'CheckCircle2' : 'Circle'}
                        className={item.displayMet ? 'w-4 h-4 text-foreground shrink-0' : 'w-4 h-4 text-muted-foreground shrink-0'}
                      />
                      <span className="sr-only">{item.displayMet ? 'Uppfyllt' : 'Saknas'}</span>
                      <span className="text-foreground flex-1 min-w-0 break-words">
                        {item.type === 'medal' ? (item.displayName || item.medalId) : (item.description || item.type)}
                      </span>
                      {item.type === 'medal' && typeof item.yearOffset === 'number' ? (
                        <span className={item.gapFailed ? 'text-danger' : 'text-muted-foreground'}>
                          Kräver {item.yearOffset} års gap
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {underReview && (
              <div id={`under-review-note-${medal.id}`} className="mb-4 alert alert-warning">
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

            {!isPlaceholder && reqTree && (
              <>
                {/* Year selector for progress - only show if not unlocked and has multiple years */}
                {status?.status !== 'unlocked' && availableYears.length > 1 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <label htmlFor="year-selector" className="text-sm font-medium text-foreground">
                        Visa framsteg för år:
                      </label>
                      <button
                        type="button"
                        aria-label="Information om årsvisa krav"
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-bg-secondary hover:bg-background border border-border text-xs text-muted-foreground"
                        title="Kraven måste uppfyllas under samma kalenderår"
                      >
                        <Icon name="Info" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin" role="group" aria-label="Välj år">
                      {availableYears.map((year) => {
                        const isSelected = year === defaultYear
                        const isEligible = eligibleYears.includes(year)
                        const isCurrent = year === currentYear
                        const hasAchievements = achievementYears.includes(year)

                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => setSelectedYear(year)}
                            aria-pressed={isSelected}
                            aria-label={`År ${year}${isCurrent ? ' (nuvarande år)' : ''}${isEligible ? ' (kvalificerad)' : ''}${hasAchievements ? ' (har aktiviteter)' : ''}`}
                            className={[
                              'shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                              isSelected
                                ? isEligible
                                  ? 'bg-green-100 text-green-900 border-2 border-green-500 dark:bg-green-900/30 dark:text-green-100 dark:border-green-600'
                                  : isCurrent
                                  ? 'bg-primary text-primary-foreground border-2 border-primary'
                                  : 'bg-bg-secondary text-foreground border-2 border-primary'
                                : isEligible
                                ? 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800 dark:hover:bg-green-900/30'
                                : 'bg-bg-secondary text-foreground border border-border hover:bg-background'
                            ].join(' ')}
                          >
                            <span className="flex items-center gap-1.5">
                              {year}
                              {isEligible && (
                                <Icon name="CheckCircle2" className="w-4 h-4" aria-hidden="true" />
                              )}
                              {isCurrent && !isEligible && (
                                <Icon name="Circle" className="w-3 h-3 fill-current" aria-hidden="true" />
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <Icon name="CheckCircle2" className="w-3 h-3 inline text-green-600 dark:text-green-400" aria-hidden="true" /> = Kvalificerad för detta år
                      {' • '}
                      <Icon name="Circle" className="w-2.5 h-2.5 inline fill-current" aria-hidden="true" /> = Nuvarande år
                    </p>
                  </div>
                )}

                <SectionCard
                  id={`req-${medal.id}`}
                  title="Krav"
                  summary={reqCounts ? `${reqCounts.met}/${reqCounts.total} uppfyllda${status?.status !== 'unlocked' ? ` • ${defaultYear}` : ''}` : undefined}
                  collapsible={false}
                >
                  <RequirementTree tree={reqTree} bare />
                </SectionCard>
              </>
            )}

            {!isPlaceholder && medal.requirementsOriginal && (
              <SectionCard id={originalId} title="Visa ursprunglig kravtext" collapsible defaultOpen={false}>
                <div className="text-sm text-foreground break-words">
                  <Suspense fallback={null}>
                    <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                      {medal.requirementsOriginal}
                    </Markdown>
                  </Suspense>
                </div>
              </SectionCard>
            )}

            {!isPlaceholder && referencedMedals.length > 0 && (
              <SectionCard
                id={`refs-${medal.id}`}
                title="Uppfyller också kraven för"
                summary={`${referencedMedals.length}`}
                collapsible
                defaultOpen={false}
              >
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
              </SectionCard>
            )}

            {!isPlaceholder && unlockTargets.length > 0 && (
              <SectionCard
                id={unlockTargetsId}
                title="Detta märke krävs för"
                summary={`${unlockTargets.length}`}
                collapsible
                defaultOpen={false}
              >
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
              </SectionCard>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap gap-3 p-4 sm:p-6 border-t border-border pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <button
              onClick={onClose}
              className="flex-1 min-h-[44px] px-4 py-2 rounded-md bg-background text-foreground hover:bg-bg-secondary ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
            >
              Stäng
            </button>

            {/* Log Achievement button - show for non-locked, non-placeholder medals (feature-gated) */}
            {currentProfile && !isPlaceholder && status?.status !== 'locked' && achievementEntryEnabled !== 'off' && (
              <button
                type="button"
                onClick={() => setAchievementEntryOpen(true)}
                aria-haspopup="dialog"
                className="flex-1 min-h-[44px] px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              >
                <span className="flex items-center justify-center gap-2">
                  <Icon name="Plus" className="w-5 h-5" />
                  Logga aktivitet
                </span>
              </button>
            )}

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

            {currentProfile && !isPlaceholder && (status?.status === 'eligible' || (allowManual && status?.status !== 'unlocked')) && (
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
        preferredYear={defaultYear}
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

      <AchievementEntryDialog
        medal={medal}
        open={achievementEntryOpen}
        onClose={() => setAchievementEntryOpen(false)}
      />
    </div>
  )
}
