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
    <div className="card flex flex-col overflow-hidden h-[80svh] max-h-[80vh] sm:h-auto sm:max-h-none">
      <div className="p-4">
        <h3 className="font-bold text-foreground">Advancerad filter-byggare</h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
            <select
              value={local.status}
              onChange={(e) => update('status', e.target.value)}
              className="select"
            >
              <option value="">Alla</option>
              <option value="unlocked">Upplåst</option>
              <option value="achievable">Uppnåelig</option>
              <option value="locked">Låst</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Valör</label>
            <input
              type="text"
              value={local.tier}
              onChange={(e) => update('tier', e.target.value || '')}
              placeholder="bronze, silver, gold, star_1..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Typ</label>
            <input
              type="text"
              value={local.type}
              onChange={(e) => update('type', e.target.value || '')}
              placeholder="pistol_mark, field_mark..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Vapengrupp</label>
            <select
              value={local.weaponGroup}
              onChange={(e) => update('weaponGroup', e.target.value)}
              className="select"
            >
              <option value="">Alla</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="R">R</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Sök</label>
            <input
              type="text"
              value={local.search}
              onChange={(e) => update('search', e.target.value)}
              placeholder="Keyword in name or type"
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 p-4 border-t border-border pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <button
          type="button"
          onClick={() => onApply?.({
            status: local.status || null,
            tier: local.tier || null,
            type: local.type || null,
            weaponGroup: local.weaponGroup || null,
            search: local.search || '',
          })}
          className="btn btn-primary min-h-[44px]"
        >
          Filtrera
        </button>
      </div>
    </div>
  )
}
