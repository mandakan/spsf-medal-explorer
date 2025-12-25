import React from 'react'

export default function ReviewLegend({ className = '', id }) {
  return (
    <span id={id} className={['inline-flex items-center gap-3 text-xs text-muted-foreground', className].join(' ')}>
      <span className="inline-flex items-center gap-2" aria-hidden="true">
        <span className="inline-block w-3 h-3 rounded-full border-2 border-dashed border-review"></span>
        <span className="inline-block w-2 h-2 rounded-full bg-review"></span>
      </span>
      <span>Under granskning</span>
      <span className="inline-flex items-center gap-2 ml-4" aria-hidden="true">
        <span className="inline-block w-3 h-3 rounded-full border-2 border-dotted border-indigo-400"></span>
        <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
      </span>
      <span>Plats­hållare</span>
    </span>
  )
}
