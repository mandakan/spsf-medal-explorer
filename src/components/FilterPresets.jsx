import React, { useState } from 'react'
import { useFilterStorage } from '../utils/filterStorage'

export default function FilterPresets({ currentFilters, onApplyPreset }) {
  const { presets, savePreset, deletePreset, reload } = useFilterStorage()
  const [presetName, setPresetName] = useState('')

  const handleSavePreset = () => {
    if (!presetName.trim()) return
    savePreset(presetName.trim(), currentFilters)
    setPresetName('')
    reload()
  }

  const handleDelete = (index) => {
    deletePreset(index)
    reload()
  }

  return (
    <div className="card p-4">
      <h3 className="font-bold text-foreground mb-3">Filter Presets</h3>

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name (e.g., 'My Favorites')"
            className="input"
          />
          <button
            type="button"
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
            className="btn btn-primary text-sm disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {presets.length > 0 && (
        <div className="space-y-2">
          {presets.map((preset, index) => (
            <div
              key={`${preset.name}-${index}`}
              className="flex justify-between items-center p-3 bg-background border border-border rounded"
            >
              <button
                type="button"
                onClick={() => onApplyPreset?.(preset.filters)}
                className="btn btn-muted text-sm flex-1 text-left"
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="btn btn-muted text-sm"
                aria-label={`Delete preset ${preset.name}`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
