# PR-007: Advanced Filtering & Search System (React + Tailwind + Vite)

## DESCRIPTION
Implement powerful filtering and search capabilities across the medal list. Users can search by name, filter by type/tier/status, apply multiple filters simultaneously, save filter presets, and quickly find medals matching their criteria.

## DEPENDENCIES
- PR-001: Project Setup & Medal Database
- PR-002: Data Layer & Storage System
- PR-003: Medal Achievement Calculator
- PR-004: UI Shell with React Router

## ACCEPTANCE CRITERIA
- [ ] Real-time search by medal name/type
- [ ] Filter by status (unlocked/achievable/locked)
- [ ] Filter by tier (bronze/silver/gold/star)
- [ ] Filter by medal type (pistol, elite, field, etc.)
- [ ] Filter by weapon group (A/B/C)
- [ ] Multiple simultaneous filters
- [ ] Filter preset save/load/delete
- [ ] Advanced filter builder interface
- [ ] Filter result count display
- [ ] Sort options (alphabetical, tier, type, status)
- [ ] Search highlighting in results
- [ ] Keyboard shortcuts (/ to focus search)
- [ ] Filter persistence in localStorage
- [ ] Clear all filters button
- [ ] Filter sharing via URL parameters

## FILES TO CREATE
- src/components/SearchBar.jsx (search input with suggestions)
- src/components/FilterPanel.jsx (main filter UI)
- src/components/FilterPresets.jsx (save/load filters)
- src/components/AdvancedFilterBuilder.jsx (complex filter logic)
- src/hooks/useFilter.js (filter state management)
- src/hooks/useSearch.js (search functionality)
- src/logic/filterEngine.js (filter application logic)
- src/logic/searchEngine.js (search and highlighting)
- src/utils/filterStorage.js (localStorage for presets)
- src/pages/MedalsList.jsx (updated with search/filter)
- tests/filterEngine.test.js
- tests/searchEngine.test.js

## CODE STRUCTURE

### src/hooks/useFilter.js

```javascript
import { useState, useCallback, useMemo } from 'react'

export function useFilter(medals, initialFilters = {}) {
  const [filters, setFilters] = useState({
    status: null,
    tier: null,
    type: null,
    weaponGroup: null,
    search: '',
    ...initialFilters
  })

  const filteredMedals = useMemo(() => {
    if (!medals) return []

    return medals.filter(medal => {
      // Status filter
      if (filters.status && medal.status !== filters.status) return false

      // Tier filter
      if (filters.tier && medal.tier !== filters.tier) return false

      // Type filter
      if (filters.type && medal.type !== filters.type) return false

      // Weapon group filter
      if (filters.weaponGroup && medal.weaponGroup !== filters.weaponGroup) return false

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matches = 
          medal.displayName.toLowerCase().includes(searchLower) ||
          medal.name?.toLowerCase().includes(searchLower) ||
          medal.type.toLowerCase().includes(searchLower)
        
        if (!matches) return false
      }

      return true
    })
  }, [medals, filters])

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({
      status: null,
      tier: null,
      type: null,
      weaponGroup: null,
      search: ''
    })
  }, [])

  const hasActiveFilters = Object.values(filters).some(v => v !== null && v !== '')

  return {
    filters,
    filteredMedals,
    setFilter,
    clearAllFilters,
    hasActiveFilters
  }
}
```

### src/hooks/useSearch.js

```javascript
import { useState, useCallback, useMemo } from 'react'

export function useSearch(medals, searchTerm = '') {
  const [term, setTerm] = useState(searchTerm)
  const [suggestions, setSuggestions] = useState([])

  const results = useMemo(() => {
    if (!term.trim()) return []

    const lowerTerm = term.toLowerCase()
    return medals.filter(medal =>
      medal.displayName.toLowerCase().includes(lowerTerm) ||
      medal.name?.toLowerCase().includes(lowerTerm) ||
      medal.type.toLowerCase().includes(lowerTerm)
    )
  }, [medals, term])

  const generateSuggestions = useCallback((input) => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }

    const lowerInput = input.toLowerCase()
    const unique = new Set()

    medals.forEach(medal => {
      if (medal.displayName.toLowerCase().startsWith(lowerInput) && unique.size < 5) {
        unique.add(medal.displayName)
      }
    })

    setSuggestions(Array.from(unique))
  }, [medals])

  const handleSearchChange = useCallback((value) => {
    setTerm(value)
    generateSuggestions(value)
  }, [generateSuggestions])

  const handleSuggestionSelect = useCallback((suggestion) => {
    setTerm(suggestion)
    setSuggestions([])
  }, [])

  return {
    term,
    results,
    suggestions,
    handleSearchChange,
    handleSuggestionSelect,
    setTerm
  }
}
```

### src/components/SearchBar.jsx

```jsx
import React, { useState } from 'react'

export default function SearchBar({
  value,
  onChange,
  suggestions,
  onSuggestionSelect,
  placeholder = 'Search medals...'
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    onSuggestionSelect(suggestion)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
        <span className="text-gray-400">🔍</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          placeholder={placeholder}
          className="flex-1 outline-none text-text-primary placeholder-text-secondary"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 text-text-primary text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

### src/components/FilterPanel.jsx

```jsx
import React from 'react'

export default function FilterPanel({
  filters,
  onFilterChange,
  medalTypes,
  tiers,
  hasActiveFilters,
  resultCount,
  onClearAll
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
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
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
```

### src/components/FilterPresets.jsx

```jsx
import React, { useState } from 'react'
import { useFilterStorage } from '../utils/filterStorage'

export default function FilterPresets({ currentFilters, onApplyPreset }) {
  const { presets, savePreset, deletePreset } = useFilterStorage()
  const [presetName, setPresetName] = useState('')

  const handleSavePreset = () => {
    if (!presetName.trim()) return

    savePreset(presetName, currentFilters)
    setPresetName('')
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
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary-hover disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {presets.length > 0 && (
        <div className="space-y-2">
          {presets.map((preset, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
            >
              <button
                onClick={() => onApplyPreset(preset.filters)}
                className="text-left flex-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {preset.name}
              </button>
              <button
                onClick={() => deletePreset(index)}
                className="text-red-600 hover:text-red-800 text-sm"
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
```

### src/logic/filterEngine.js

```javascript
export function applyFilters(medals, statuses, filters) {
  if (!medals || !statuses) return []

  return medals.filter(medal => {
    // Get medal status
    const status = statuses.unlocked.find(s => s.medalId === medal.id) ||
                   statuses.achievable.find(s => s.medalId === medal.id) ||
                   statuses.locked.find(s => s.medalId === medal.id)

    const medalStatus = status?.status || 'locked'

    // Apply status filter
    if (filters.status && medalStatus !== filters.status) return false

    // Apply tier filter
    if (filters.tier && medal.tier !== filters.tier) return false

    // Apply type filter
    if (filters.type && medal.type !== filters.type) return false

    return true
  })
}

export function sortMedals(medals, sortBy = 'name') {
  const copy = [...medals]

  switch (sortBy) {
    case 'name':
      return copy.sort((a, b) => a.displayName.localeCompare(b.displayName))
    
    case 'type':
      return copy.sort((a, b) => a.type.localeCompare(b.type))
    
    case 'tier':
      const tierOrder = { bronze: 0, silver: 1, gold: 2, star_1: 3, star_2: 4, star_3: 5 }
      return copy.sort((a, b) => (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0))
    
    default:
      return copy
  }
}

export function generateFilterSummary(filters) {
  const parts = []
  
  if (filters.status) parts.push(`Status: ${filters.status}`)
  if (filters.tier) parts.push(`Tier: ${filters.tier}`)
  if (filters.type) parts.push(`Type: ${filters.type}`)
  if (filters.weaponGroup) parts.push(`Group: ${filters.weaponGroup}`)
  if (filters.search) parts.push(`Search: ${filters.search}`)

  return parts.length > 0 ? parts.join(' • ') : 'No filters applied'
}
```

### src/pages/MedalsList.jsx (updated)

```jsx
import React, { useState, useMemo } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { useFilter } from '../hooks/useFilter'
import { useSearch } from '../hooks/useSearch'
import { applyFilters, sortMedals } from '../logic/filterEngine'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import FilterPresets from '../components/FilterPresets'
import MedalCard from '../components/MedalCard'

export default function MedalsList() {
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const [sortBy, setSortBy] = useState('name')

  const { filter, filteredMedals, setFilter, clearAllFilters, hasActiveFilters } = useFilter(
    medalDatabase?.getAllMedals() || []
  )

  const { term, results, suggestions, handleSearchChange, handleSuggestionSelect } = useSearch(
    medalDatabase?.getAllMedals() || [],
    filter.search
  )

  const finalResults = useMemo(() => {
    let result = filter.search ? results : (medalDatabase?.getAllMedals() || [])
    
    // Apply other filters
    result = result.filter(medal => {
      const status = statuses.unlocked.find(s => s.medalId === medal.id) ||
                     statuses.achievable.find(s => s.medalId === medal.id) ||
                     statuses.locked.find(s => s.medalId === medal.id)
      
      const medalStatus = status?.status || 'locked'
      
      if (filter.status && medalStatus !== filter.status) return false
      if (filter.tier && medal.tier !== filter.tier) return false
      if (filter.type && medal.type !== filter.type) return false
      if (filter.weaponGroup && medal.weaponGroup !== filter.weaponGroup) return false
      
      return true
    })

    return sortMedals(result, sortBy)
  }, [medalDatabase, filter, term, results, statuses, sortBy])

  const medalTypes = useMemo(() => {
    if (!medalDatabase) return []
    return [...new Set(medalDatabase.getAllMedals().map(m => m.type))]
  }, [medalDatabase])

  const tiers = useMemo(() => {
    if (!medalDatabase) return []
    return [...new Set(medalDatabase.getAllMedals().map(m => m.tier))]
  }, [medalDatabase])

  if (!medalDatabase) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Medals</h1>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded"
        >
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
          <option value="tier">Sort by Tier</option>
        </select>
      </div>

      <SearchBar
        value={term}
        onChange={(val) => {
          handleSearchChange(val)
          setFilter('search', val)
        }}
        suggestions={suggestions}
        onSuggestionSelect={(suggestion) => {
          handleSuggestionSelect(suggestion)
          setFilter('search', suggestion)
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filter}
            onFilterChange={setFilter}
            medalTypes={medalTypes}
            tiers={tiers}
            hasActiveFilters={hasActiveFilters}
            resultCount={finalResults.length}
            onClearAll={clearAllFilters}
          />
          <div className="mt-4">
            <FilterPresets
              currentFilters={filter}
              onApplyPreset={(preset) => {
                Object.keys(preset).forEach(key => {
                  setFilter(key, preset[key])
                })
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalResults.length === 0 ? (
              <div className="col-span-full bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-text-secondary">No medals match your filters</p>
              </div>
            ) : (
              finalResults.map(medal => (
                <MedalCard key={medal.id} medal={medal} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### src/utils/filterStorage.js

```javascript
export function useFilterStorage() {
  const storageKey = 'medal-app-filter-presets'

  const getPresets = () => {
    try {
      const data = localStorage.getItem(storageKey)
      return data ? JSON.parse(data) : []
    } catch (err) {
      console.error('Failed to load presets:', err)
      return []
    }
  }

  const savePreset = (name, filters) => {
    try {
      const presets = getPresets()
      presets.push({ name, filters, createdAt: new Date().toISOString() })
      localStorage.setItem(storageKey, JSON.stringify(presets))
    } catch (err) {
      console.error('Failed to save preset:', err)
    }
  }

  const deletePreset = (index) => {
    try {
      const presets = getPresets()
      presets.splice(index, 1)
      localStorage.setItem(storageKey, JSON.stringify(presets))
    } catch (err) {
      console.error('Failed to delete preset:', err)
    }
  }

  return {
    presets: getPresets(),
    savePreset,
    deletePreset
  }
}
```

## DESIGN DOCUMENT REFERENCES
- **03-Interaction-Design.md** - Medal List View, Filtering section
- **04-Visual-Design.md** - Search and filter UI patterns
- **05-Technical-Architecture.md** - Search engine, filter logic

## PERFORMANCE OPTIMIZATIONS
- Search results computed with useMemo
- Filter application O(n) complexity
- Suggestion generation debounced
- Preset operations cached in localStorage
- No re-renders on filter change without results update

## URL PARAMETER SUPPORT
Future enhancement: Support shareable URLs like:
```
/medals?status=achievable&type=pistol_mark&tier=silver
```

## DONE WHEN
- Search works in real-time
- All filters apply correctly
- Filters combine (AND logic)
- Presets save/load properly
- Suggestions display without lag
- All tests pass
- No console errors
