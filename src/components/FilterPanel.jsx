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
    <div className="card flex flex-col overflow-hidden h-[80svh] max-h-[80vh] sm:h-auto sm:max-h-none">
      <div className="p-4 flex justify-between items-center">
        <h3 className="font-bold text-foreground">Filter</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="btn btn-muted text-sm min-h-[44px]"
          >
            Återställ alla
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pt-0">
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
              <option value="">Alla</option>
              <option value="unlocked">Upplåsta</option>
              <option value="achievable">Uppnåeliga</option>
              <option value="locked">Låsta</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <label htmlFor="tierSelect" className="block text-sm font-medium text-muted-foreground mb-1">
              Valör
            </label>
            <select
              id="tierSelect"
              value={filters.tier || ''}
              onChange={(e) => onFilterChange('tier', e.target.value || null)}
              className="select"
            >
              <option value="">Alla</option>
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
              Typ
            </label>
            <select
              id="typeSelect"
              value={filters.type || ''}
              onChange={(e) => onFilterChange('type', e.target.value || null)}
              className="select"
            >
              <option value="">Alla</option>
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
              Vapengrupp
            </label>
            <select
              id="weaponGroupSelect"
              value={filters.weaponGroup || ''}
              onChange={(e) => onFilterChange('weaponGroup', e.target.value || null)}
              className="select"
            >
              <option value="">Alla</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="R">R</option>
            </select>
          </div>

          {/* Review Status Filter */}
          <div>
            <label htmlFor="reviewStatusSelect" className="block text-sm font-medium text-muted-foreground mb-1">
              Granskningsstatus
            </label>
            <select
              id="reviewStatusSelect"
              value={filters.reviewState || ''}
              onChange={(e) => onFilterChange('reviewState', e.target.value || null)}
              className="select"
            >
              <option value="">Alla</option>
              <option value="reviewed">Granskad</option>
              <option value="under_review">Under granskning</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border pb-[calc(env(safe-area-inset-bottom)+1rem)] text-sm text-muted-foreground" aria-live="polite">
        {resultCount} märke(n) matchar filtren
      </div>
    </div>
  )
}
