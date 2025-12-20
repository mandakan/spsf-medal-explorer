import React, { useState } from 'react'

export default function AdvancedFilterBuilder({ currentFilters, onApply }) {
  const [local, setLocal] = useState({
    status: currentFilters?.status || '',
    tier: currentFilters?.tier || '',
    type: currentFilters?.type || '',
    weaponGroup: currentFilters?.weaponGroup || '',
    search: currentFilters?.search || '',
  })

  const update = (key, value) => setLocal(prev => ({ ...prev, [key]: value }))

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="font-bold text-text-primary">Advanced Filter Builder</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
          <select
            value={local.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Any</option>
            <option value="unlocked">Unlocked</option>
            <option value="achievable">Achievable</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Tier</label>
          <input
            type="text"
            value={local.tier}
            onChange={(e) => update('tier', e.target.value || '')}
            placeholder="bronze, silver, gold, star_1..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
          <input
            type="text"
            value={local.type}
            onChange={(e) => update('type', e.target.value || '')}
            placeholder="pistol_mark, field_mark..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Weapon Group</label>
          <select
            value={local.weaponGroup}
            onChange={(e) => update('weaponGroup', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Any</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">Search</label>
          <input
            type="text"
            value={local.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Keyword in name or type"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onApply?.({
            status: local.status || null,
            tier: local.tier || null,
            type: local.type || null,
            weaponGroup: local.weaponGroup || null,
            search: local.search || '',
          })}
          className="px-4 py-2 bg-teal-700 text-white rounded text-sm hover:bg-teal-800"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
