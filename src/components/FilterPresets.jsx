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
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold text-text-primary mb-3">Filter Presets</h3>

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name (e.g., 'My Favorites')"
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <button
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
            className="px-4 py-2 bg-teal-700 text-white rounded text-sm hover:bg-teal-800 disabled:opacity-50"
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
              className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
            >
              <button
                onClick={() => onApplyPreset?.(preset.filters)}
                className="text-left flex-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {preset.name}
              </button>
              <button
                onClick={() => handleDelete(index)}
                className="text-red-600 hover:text-red-800 text-sm"
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
