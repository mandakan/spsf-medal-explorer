import React from 'react'
import StatusIcon from './StatusIcon'

export default function ReviewLegend({ className = '', id, variant = 'list' }) {
  if (variant === 'canvas') {
    return (
      <div
        id={id}
        className={['flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground w-full min-w-0', className].join(' ')}
      >
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <StatusIcon status="review" />
          <span>Under granskning</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <StatusIcon status="placeholder" />
          <span>Platshållare</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <StatusIcon status="locked" />
          <span>Låst</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <StatusIcon status="available" />
          <span>Tillgänglig</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <StatusIcon status="eligible" />
          <span>Kvalificerad</span>
        </span>

        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <StatusIcon status="unlocked" />
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
        <StatusIcon status="review" />
        <span>Under granskning</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <StatusIcon status="placeholder" />
        <span>Platshållare</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <StatusIcon status="locked" />
        <span>Låst</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <StatusIcon status="available" />
        <span>Tillgänglig</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <StatusIcon status="eligible" />
        <span>Kvalificerad</span>
      </span>

      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <StatusIcon status="unlocked" />
        <span>Upplåst</span>
      </span>
    </div>
  )
}
