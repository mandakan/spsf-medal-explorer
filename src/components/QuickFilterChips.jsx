import React from 'react'

function ChipButton({ active, onClick, children, ariaLabel, dataTour }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active ? 'true' : 'false'}
      aria-label={ariaLabel}
      data-tour={dataTour}
      className={[
        'inline-flex items-center px-4 py-2 rounded-full border text-sm min-h-[44px] shrink-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        active
          ? 'bg-primary/10 text-primary border-primary dark:bg-primary/20'
          : 'bg-transparent text-text-secondary border-border hover:bg-bg-secondary',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export default function QuickFilterChips({
  filters,
  onToggle,
  onOpenFilters,
  activeCount = 0,
  controlsId,
  className = '',
}) {
  const status = filters.status || null

  return (
    <div
      className={['flex items-center gap-2 overflow-x-auto py-2 min-w-0', className].join(' ')}
      role="toolbar"
      aria-label="Snabbfilter"
    >
      <ChipButton
        active={status === 'unlocked'}
        onClick={() => onToggle('status', 'unlocked')}
        ariaLabel="Filtrera på Upplåst"
        dataTour="chip-unlocked"
      >
        Upplåst
      </ChipButton>
      <ChipButton
        active={status === 'eligible'}
        onClick={() => onToggle('status', 'eligible')}
        ariaLabel="Filtrera på Kvalificerad"
      >
        Kvalificerad
      </ChipButton>
      <ChipButton
        active={status === 'available'}
        onClick={() => onToggle('status', 'available')}
        ariaLabel="Filtrera på Tillgänglig"
      >
        Tillgänglig
      </ChipButton>
      <ChipButton
        active={status === 'locked'}
        onClick={() => onToggle('status', 'locked')}
        ariaLabel="Filtrera på Låst"
      >
        Låst
      </ChipButton>

      <span className="mx-2 h-5 w-px bg-border shrink-0 lg:hidden" aria-hidden="true" />

      <button
        type="button"
        onClick={onOpenFilters}
        aria-haspopup="dialog"
        aria-controls={controlsId}
        data-tour="open-filters"
        className="inline-flex items-center px-4 py-2 rounded-full border text-sm min-h-[44px] shrink-0 lg:hidden
                   bg-background text-foreground border-border hover:bg-bg-secondary
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {activeCount > 0 ? `Filter (${activeCount})` : 'Filter'}
      </button>
    </div>
  )
}
