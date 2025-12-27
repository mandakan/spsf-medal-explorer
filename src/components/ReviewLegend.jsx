import React from 'react'

export default function ReviewLegend({ className = '', id, variant = 'list' }) {
  if (variant === 'canvas') {
    return (
      <div
        id={id}
        className={['flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground w-full min-w-0', className].join(' ')}
      >
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-dashed"
            style={{ borderColor: 'var(--color-review)' }}
            aria-hidden="true"
          />
          <span>Under granskning</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-dotted"
            style={{ borderColor: 'var(--color-placeholder)' }}
            aria-hidden="true"
          />
          <span>Platshållare</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-locked)' }} aria-hidden="true" />
          <span>Låst</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-available)' }} aria-hidden="true" />
          <span>Tillgänglig</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-eligible)' }} aria-hidden="true" />
          <span>Kvalificerad</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-unlocked)' }} aria-hidden="true" />
          <span>Upplåst</span>
        </span>
      </div>
    )
  }

  // variant === 'list'
  return (
    <div
      id={id}
      className={['flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground w-full min-w-0', className].join(' ')}
    >
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-review)' }} aria-hidden="true" />
        <span>Under granskning</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-placeholder)' }} aria-hidden="true" />
        <span>Platshållare</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-locked)' }} aria-hidden="true" />
        <span>Låst</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-available)' }} aria-hidden="true" />
        <span>Tillgänglig</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-eligible)' }} aria-hidden="true" />
        <span>Kvalificerad</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="legend-dot" style={{ backgroundColor: 'var(--color-status-unlocked)' }} aria-hidden="true" />
        <span>Upplåst</span>
      </span>
    </div>
  )
}
