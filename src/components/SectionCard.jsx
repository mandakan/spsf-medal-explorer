import React, { useId, useState } from 'react'

export default function SectionCard({ id, title, summary, collapsible = false, defaultOpen = true, children }) {
  const internalId = useId()
  const bodyId = id ? `${id}-body` : `${internalId}-body`
  const [open, setOpen] = useState(defaultOpen)

  const HeaderTag = collapsible ? 'button' : 'div'
  const headerProps = collapsible
    ? {
        type: 'button',
        onClick: () => setOpen(o => !o),
        'aria-expanded': open,
        'aria-controls': bodyId
      }
    : {}

  return (
    <div className="mb-4 bg-background border border-border rounded">
      <HeaderTag
        {...headerProps}
        className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary rounded-t min-h-[44px]"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          {summary ? <span>({summary})</span> : null}
          {collapsible ? <span aria-hidden="true">{open ? '▼' : '▶'}</span> : null}
        </span>
      </HeaderTag>
      {(!collapsible || open) && (
        <div id={bodyId} className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}
