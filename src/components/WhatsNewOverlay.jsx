import React, { useEffect, useMemo, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getBuildId, getLastSeen, setLastSeen } from '../utils/whatsNew'
import { getReleasesSince } from '../content/whatsNew'

export default function WhatsNewOverlay() {
  const navigate = useNavigate()
  const location = useLocation()
  const background = location.state?.backgroundLocation

  const buildId = getBuildId()
  const items = useMemo(() => getReleasesSince(getLastSeen()), [])
  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)

  const handleClose = useCallback(() => {
    if (buildId) setLastSeen(buildId)
    if (background && background.pathname) {
      const to = `${background.pathname}${background.search || ''}${background.hash || ''}`
      navigate(to, { replace: true })
    } else {
      navigate(-1)
    }
  }, [buildId, background, navigate])

  // Focus management and trap
  useEffect(() => {
    lastFocusedRef.current = document.activeElement
    const root = dialogRef.current
    if (!root) return

    const getFocusables = () =>
      root.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

    const onKeyDown = (e) => {
      const focusables = getFocusables()
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      } else if (e.key === 'Tab') {
        if (focusables.length === 0) return
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    // initial focus
    const focusables = getFocusables()
    focusables[0]?.focus()

    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('keydown', onKeyDown)
      // restore focus
      if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === 'function') {
        lastFocusedRef.current.focus()
      }
    }
  }, [handleClose])


  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const latestLink = items[0]?.link || null
  const description =
    items.length > 1
      ? `Det finns ${items.length} uppdateringar sedan du senast tittade.`
      : 'Här är det senaste som är nytt i appen.'

  return (
    <div className="fixed inset-0 z-50" onMouseDown={onBackdropClick} aria-hidden={false}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsnew-title"
        aria-describedby="whatsnew-desc"
        className={[
          'card',
          'fixed inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-2xl shadow-lg',
          'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'md:w-[min(90vw,640px)] md:rounded-xl',
          'outline-none',
        ].join(' ')}
        tabIndex={-1}
      >
        <div className="p-4 sm:p-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 id="whatsnew-title" className="text-xl font-semibold">
                Nyheter
              </h2>
              <p id="whatsnew-desc" className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-muted"
              aria-label="Stäng nyheter"
              onClick={handleClose}
            >
              Stäng
            </button>
          </header>

          <div className="mt-4 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '55vh' }}>
            {items.map((rel, i) => (
              <details key={rel.id} className="rounded-lg border border-border p-3" open={i === 0}>
                <summary className="cursor-pointer select-none font-medium">
                  {rel.title || 'Uppdatering'} • {rel.date} • {rel.id}
                </summary>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                  {(rel.highlights || []).map((h, idx) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
                {rel.link && (
                  <div className="mt-2">
                    <a
                      className="text-primary underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:ring-primary"
                      href={rel.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Läs mer
                    </a>
                  </div>
                )}
              </details>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 safe-bottom">
            {latestLink && (
              <a
                className="btn btn-secondary"
                href={latestLink}
                target="_blank"
                rel="noreferrer"
              >
                Läs mer
              </a>
            )}
            <button type="button" className="btn btn-primary" onClick={handleClose}>
              Ok, visa appen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
