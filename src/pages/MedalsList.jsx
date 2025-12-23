import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { useFilter } from '../hooks/useFilter'
import { useMedalSearch } from '../hooks/useMedalSearch'
import { applyFilters, sortMedals } from '../logic/filterEngine'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import FilterPresets from '../components/FilterPresets'
import AdvancedFilterBuilder from '../components/AdvancedFilterBuilder'
import MedalList from '../components/MedalList'
import MobileBottomSheet from '../components/MobileBottomSheet'
import MedalDetailModal from '../components/MedalDetailModal'
import { useParams, useNavigate } from 'react-router-dom'
import ProfilePromptBanner from '../components/ProfilePromptBanner'

export default function MedalsList() {
  const { medalDatabase } = useMedalDatabase()
  const { id: selectedMedalId } = useParams()
  const navigate = useNavigate()
  const statuses = useAllMedalStatuses()
  const [sortBy, setSortBy] = useState('name')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef(null)

  // Responsive, mobile-first list height (~70vh with a sensible minimum)
  const [listHeight, setListHeight] = useState(600)
  useEffect(() => {
    const update = () => setListHeight(Math.max(360, Math.round(window.innerHeight * 0.7)))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const medals = useMemo(() => medalDatabase?.getAllMedals() || [], [medalDatabase])

  const { filters, setFilter, setFilters, clearAllFilters, hasActiveFilters } = useFilter(medals)

  const { query, setQuery, suggestions } = useMedalSearch(medals)

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

  const statusesById = useMemo(() => {
    const map = {}
    if (statuses) {
      ;['unlocked', 'achievable', 'locked'].forEach((k) => {
        (statuses[k] || []).forEach((r) => {
          map[r.medalId] = r
        })
      })
    }
    return map
  }, [statuses])

  const finalResults = useMemo(() => {
    const withSearch = { ...filters, search: query }
    const filtered = applyFilters(medals, statuses, withSearch)
    return sortMedals(filtered, sortBy, statuses)
  }, [medals, statuses, filters, query, sortBy])

  if (!medalDatabase) {
    return <div className="text-muted-foreground">Laddar märken...</div>
  }

  return (
    <div className="space-y-6">
      <ProfilePromptBanner id="profile-picker-medals-list" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-3xl font-bold text-foreground">Märken</h1>

        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select"
          >
            <option value="name">Sortera på namn</option>
            <option value="type">Sortera på typ</option>
            <option value="tier">Sortera på valör</option>
            <option value="status">Sortera på status</option>
          </select>

          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="btn btn-muted text-sm"
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? 'Dölj' : 'Visa'} Avancerade Filter
          </button>
        </div>
      </div>

      <SearchBar
        value={query}
        onChange={(val) => {
          setQuery(val)
          setFilter('search', val)
        }}
        suggestions={suggestions}
        onSuggestionSelect={(suggestion) => {
          setQuery(suggestion)
          setFilter('search', suggestion)
        }}
        inputRef={searchInputRef}
        placeholder="Sök märken... (klicka / för fokus)"
      />

      <div className="sm:hidden flex justify-end">
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="btn btn-muted mt-2 min-h-[44px]"
          aria-label="Öppna filter"
          aria-haspopup="dialog"
          aria-controls="mobile-filters-sheet"
        >
          Filter
        </button>
      </div>

      {showAdvanced && (
        <AdvancedFilterBuilder
          currentFilters={filters}
          onApply={(built) => setFilters(built)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="hidden lg:block lg:col-span-1 space-y-4">
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

        <MobileBottomSheet
          id="mobile-filters-sheet"
          title="Filter"
          open={showFilters}
          onClose={() => setShowFilters(false)}
          swipeToDismiss
        >
          <FilterPanel
            filters={filters}
            onFilterChange={setFilter}
            medalTypes={medalTypes}
            tiers={tiers}
            hasActiveFilters={hasActiveFilters}
            resultCount={finalResults.length}
            onClearAll={() => {
              clearAllFilters()
              setShowFilters(false)
            }}
          />
        </MobileBottomSheet>

        <div className="lg:col-span-3">
          {finalResults.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-muted-foreground">Inga märken matchar dina filter</p>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-slate-700 rounded-md overflow-hidden" role="region" aria-label="Märkes-resultat">
              <MedalList medals={finalResults} height={listHeight} itemSize={60} onSelect={(m) => navigate(`/medals/${m.id}`)} statusesById={statusesById} />
            </div>
          )}
        </div>
      </div>

      {selectedMedalId && (
        <MedalDetailModal
          medalId={selectedMedalId}
          onClose={() => navigate('/medals')}
        />
      )}
    </div>
  )
}
