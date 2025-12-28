import React, { useEffect, useRef, useState } from 'react'
import flags from '../config/featureFlags.js'
import Icon from './Icon'

export default function DevPreviewOverlay({ feature, children, variant = 'auto' }) {
  const cfg = flags?.[feature] || {}
  const title = cfg.title || 'Feature i utveckling'
  const message = cfg.message || `Den här funktionen (“${feature}”) visas som förhandsvisning.`
  const requested = (variant === 'auto' ? (cfg.overlay || 'auto') : variant)

  const wrapRef = useRef(null)
  const [isSmall, setIsSmall] = useState(false)

  useEffect(() => {
    if (requested !== 'auto') return
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect || el.getBoundingClientRect()
      // Mobile-first thresholds: treat compact controls/rows as "small"
      setIsSmall(r.width < 420 || r.height < 160)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [requested])

  const mode = requested === 'auto' ? (isSmall ? 'inline' : 'panel') : requested

  return (
    <div ref={wrapRef} className="relative isolate">
      {/* Underlying UI: blurred, non-interactive, hidden from assistive tech */}
      <div className="pointer-events-none opacity-60 [filter:blur(2px)]" aria-hidden="true" inert="">
        {children}
      </div>

      {mode === 'panel' ? (
        <div
          role="note"
          aria-label="Feature preview"
          aria-live="polite"
          className="absolute inset-0 z-10 grid place-items-center bg-black/40 backdrop-blur-sm"
        >
          <div className="w-[min(92vw,36rem)] max-w-none mx-4 rounded-xl border border-border bg-bg-secondary/95 p-4 shadow-lg text-foreground">
            <div className="flex items-start gap-3">
              <Icon name="FlaskConical" className="w-5 h-5" aria-hidden="true" style={{ color: 'var(--color-info)' }} />
              <div>
                <div className="font-semibold leading-5 text-balance">{title}</div>
                <div className="mt-1 text-sm text-muted-foreground text-pretty break-words">{message}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Light scrim to convey disabled/preview state, blocks interaction */}
          <div className="absolute inset-0 z-10 bg-black/30 backdrop-blur-[1.5px]" aria-hidden="true" />
          {/* Centered compact info card within the gated area */}
          <div className="absolute inset-0 z-20 grid place-items-center">
            <div
              role="note"
              aria-label="Feature preview"
              className="mx-2 w-[min(92vw,calc(100%-1rem),28rem)] rounded-lg border border-border bg-bg-secondary/95 p-3 shadow-md text-foreground"
            >
              <div className="flex items-start gap-2">
                <Icon name="FlaskConical" className="w-4 h-4" aria-hidden="true" style={{ color: 'var(--color-info)' }} />
                <div>
                  <div className="font-semibold leading-5 text-balance">{title}</div>
                  <div className="mt-1 text-sm text-muted-foreground text-pretty break-words">{message}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
