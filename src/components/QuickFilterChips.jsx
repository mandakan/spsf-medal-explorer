import React from 'react'

export default function QuickFilterChips({ filters, onToggle }) {
  const Chip = ({ active, onClick, children, ariaLabel }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active ? 'true' : 'false'}
      aria-label={ariaLabel}
      className={[
        'inline-flex items-center px-3 py-1 rounded-full border text-sm min-h-[32px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        active
          ? 'bg-primary/10 text-primary border-primary dark:bg-primary/20'
          : 'bg-transparent text-text-secondary border-border hover:bg-bg-secondary',
      ].join(' ')}
    >
      {children}
    </button>
  )

  const status = filters.status || null
  const weaponGroup = filters.weaponGroup || null

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2" role="group" aria-label="Snabbfilter">
      {/* Status chips */}
      <Chip
        active={status === 'unlocked'}
        onClick={() => onToggle('status', 'unlocked')}
        ariaLabel="Filtrera på Upplåsta"
      >
        Upplåsta
      </Chip>
      <Chip
        active={status === 'achievable'}
        onClick={() => onToggle('status', 'achievable')}
        ariaLabel="Filtrera på Uppnåeliga"
      >
        Uppnåeliga
      </Chip>
      <Chip
        active={status === 'locked'}
        onClick={() => onToggle('status', 'locked')}
        ariaLabel="Filtrera på Låsta"
      >
        Låsta
      </Chip>

      <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

      {/* Weapon group chips */}
      {['A', 'B', 'C', 'R'].map((wg) => (
        <Chip
          key={wg}
          active={weaponGroup === wg}
          onClick={() => onToggle('weaponGroup', wg)}
          ariaLabel={`Filtrera på vapengrupp ${wg}`}
        >
          {wg}
        </Chip>
      ))}
    </div>
  )
}
