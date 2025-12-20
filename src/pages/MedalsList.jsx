import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { useFilter } from '../hooks/useFilter'
import { useSearch } from '../hooks/useSearch'
import { applyFilters, sortMedals } from '../logic/filterEngine'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import FilterPresets from '../components/FilterPresets'
import AdvancedFilterBuilder from '../components/AdvancedFilterBuilder'
import MedalCard from '../components/MedalCard'

export default function MedalsList() {
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const [sortBy, setSortBy] = useState('name')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const searchInputRef = useRef(null)

  const medals = useMemo(() => medalDatabase?.getAllMedals() || [], [medalDatabase])

  const { filters, setFilter, setFilters, clearAllFilters, hasActiveFilters } = useFilter(medals)

  const { term, suggestions, handleSearchChange, handleSuggestionSelect } = useSearch(
    medals,
    filters.search
  )

  // Keyboard shortcut: '/' focuses the search bar
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (document.activeElement?.tagName || '').toLowerCase()
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const medalTypes = useMemo(() => {
    return [...new Set(medals.map(m => m.type))].filter(Boolean)
  }, [medals])

  const tiers = useMemo(() => {
    return [...new Set(medals.map(m => m.tier))].filter(Boolean)
  }, [medals])

  const finalResults = useMemo(() => {
    const withSearch = { ...filters, search: term }
    const filtered = applyFilters(medals, statuses, withSearch)
    return sortMedals(filtered, sortBy, statuses)
  }, [medals, statuses, filters, term, sortBy])

  if (!medalDatabase) {
    return <div className="text-text-secondary">Loading medals…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-3xl font-bold text-text-primary">Medals</h1>

        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="tier">Sort by Tier</option>
            <option value="status">Sort by Status</option>
          </select>

          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="px-3 py-2 border border-gray-300 rounded text-sm text-text-secondary hover:bg-gray-50"
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </button>
        </div>
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
        inputRef={searchInputRef}
        placeholder="Search medals… (press / to focus)"
      />

      {showAdvanced && (
        <AdvancedFilterBuilder
          currentFilters={filters}
          onApply={(built) => setFilters(built)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilter}
            medalTypes={medalTypes}
            tiers={tiers}
            hasActiveFilters={hasActiveFilters}
            resultCount={finalResults.length}
            onClearAll={clearAllFilters}
          />
          <FilterPresets
            currentFilters={filters}
            onApplyPreset={(preset) => setFilters(preset)}
          />
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
