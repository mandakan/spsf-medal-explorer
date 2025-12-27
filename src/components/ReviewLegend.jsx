import React from 'react'
import Icon from './Icon'

export default function ReviewLegend({ className = '', id, variant = 'list' }) {
  if (variant === 'canvas') {
    return (
      <span
        id={id}
        className={['inline-flex items-center gap-3 text-xs text-muted-foreground', className].join(' ')}
      >
        {/* Under granskning: endast kontur (violett, streckad) */}
        <span className="inline-flex items-center gap-2" aria-hidden="true">
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-dashed"
            style={{ borderColor: 'var(--color-review)' }}
          />
        </span>
        <span>Under granskning</span>

        {/* Platshållare: endast kontur (neutral, prickad) */}
        <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-dotted"
            style={{ borderColor: 'var(--color-placeholder)' }}
          />
        </span>
        <span>Platshållare</span>

        {/* Användarstatusar (fyllda prickar) */}
        <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-locked)' }} />
        </span>
        <span>Låst</span>

        <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-available)' }} />
        </span>
        <span>Tillgänglig</span>

        <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-eligible)' }} />
        </span>
        <span>Kvalificerad</span>

        <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-unlocked)' }} />
        </span>
        <span>Upplåst</span>
      </span>
    )
  }

  // variant === 'list'
  return (
    <span
      id={id}
      className={['inline-flex items-center gap-3 text-xs text-muted-foreground', className].join(' ')}
    >
      {/* Under granskning: färgprick + label (matchar radindikatorn) */}
      <span className="inline-flex items-center gap-2" aria-hidden="true">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-review)' }} />
      </span>
      <span>Under granskning</span>

      {/* Platshållare: färgprick + label (matchar radindikatorn) */}
      <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-placeholder)' }} />
      </span>
      <span>Platshållare</span>

      {/* Användarstatusar (kompakt dot + label) */}
      <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-locked)' }} />
      </span>
      <span>Låst</span>

      <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-available)' }} />
      </span>
      <span>Tillgänglig</span>

      <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-eligible)' }} />
      </span>
      <span>Kvalificerad</span>

      <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-unlocked)' }} />
      </span>
      <span>Upplåst</span>
    </span>
  )
}
