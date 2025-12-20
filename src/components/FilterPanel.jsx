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
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-text-primary">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">All</option>
            <option value="unlocked">Unlocked</option>
            <option value="achievable">Achievable</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        {/* Tier Filter */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Tier
          </label>
          <select
            value={filters.tier || ''}
            onChange={(e) => onFilterChange('tier', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Type
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => onFilterChange('type', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Weapon Group
          </label>
          <select
            value={filters.weaponGroup || ''}
            onChange={(e) => onFilterChange('weaponGroup', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
      </div>

      <div className="text-sm text-text-secondary">
        {resultCount} medal(s) match filters
      </div>
    </div>
  )
}
