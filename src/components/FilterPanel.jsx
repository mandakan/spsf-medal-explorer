import React from 'react'

export default function FilterPanel({
  filters,
  onFilterChange,
  medalTypes,
  tiers,
  hasActiveFilters,
  resultCount,
  onClearAll,
}) {
  return (
    <div className="card p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="btn btn-muted text-sm"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="statusSelect" className="block text-sm font-medium text-muted-foreground mb-1">
            Status
          </label>
          <select
            id="statusSelect"
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value || null)}
            className="select"
          >
            <option value="">All</option>
            <option value="unlocked">Unlocked</option>
            <option value="achievable">Achievable</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        {/* Tier Filter */}
        <div>
          <label htmlFor="tierSelect" className="block text-sm font-medium text-muted-foreground mb-1">
            Tier
          </label>
          <select
            id="tierSelect"
            value={filters.tier || ''}
            onChange={(e) => onFilterChange('tier', e.target.value || null)}
            className="select"
          >
            <option value="">All</option>
            {tiers.map(tier => (
              <option key={tier} value={tier}>
                {tier.charAt(0).toUpperCase() + tier.slice(1).replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label htmlFor="typeSelect" className="block text-sm font-medium text-muted-foreground mb-1">
            Type
          </label>
          <select
            id="typeSelect"
            value={filters.type || ''}
            onChange={(e) => onFilterChange('type', e.target.value || null)}
            className="select"
          >
            <option value="">All</option>
            {medalTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Weapon Group Filter */}
        <div>
          <label htmlFor="weaponGroupSelect" className="block text-sm font-medium text-muted-foreground mb-1">
            Weapon Group
          </label>
          <select
            id="weaponGroupSelect"
            value={filters.weaponGroup || ''}
            onChange={(e) => onFilterChange('weaponGroup', e.target.value || null)}
            className="select"
          >
            <option value="">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground" aria-live="polite">
        {resultCount} medal(s) match filters
      </div>
    </div>
  )
}
