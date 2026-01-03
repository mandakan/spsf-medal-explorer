import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import { useFilter } from '../hooks/useFilter'
import { useMedalSearch } from '../hooks/useMedalSearch'
import { applyFilters, sortMedals } from '../logic/filterEngine'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import FilterPresets from '../components/FilterPresets'
import QuickFilterChips from '../components/QuickFilterChips'
import MedalList from '../components/MedalList'
import MobileBottomSheet from '../components/MobileBottomSheet'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import ProfileExperienceBanner from '../components/ProfileExperienceBanner'
import ReviewLegend from '../components/ReviewLegend'
import { useProfile } from '../hooks/useProfile'
import { useOnboardingTour } from '../hooks/useOnboardingTour'
import { getReleaseId, getLastSeen, isProductionEnv } from '../utils/whatsNew'

export default function MedalsList() {
  const { medalDatabase } = useMedalDatabase()
  const navigate = useNavigate()
  const location = useLocation()
  const statuses = useAllMedalStatuses()
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentProfile, hydrated } = useProfile()
  const isProfileLoading = !hydrated || typeof currentProfile === 'undefined'
  const tour = useOnboardingTour()

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

  // Initialize filters from URL once
  useEffect(() => {
    const get = (key) => {
      const v = searchParams.get(key)
      return v && v.length ? v : null
    }
    const initial = {
      status: get('status'),
      type: get('type'),
      tier: get('tier'),
      weaponGroup: get('weaponGroup'),
      reviewState: get('reviewState'),
    }
    const initialSearch = get('search') || ''
    const initialSort = get('sort') || 'name'

    const cleaned = Object.fromEntries(Object.entries(initial).filter(([, v]) => v != null))
    if (Object.keys(cleaned).length) {
      setFilters(cleaned)
    }
    if (initialSearch) {
      setQuery(initialSearch)
      setFilter('search', initialSearch)
    }
    if (initialSort) {
      setSortBy(initialSort)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync filters/search/sort to URL without adding history entries
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.type) params.set('type', filters.type)
    if (filters.tier) params.set('tier', filters.tier)
    if (filters.weaponGroup) params.set('weaponGroup', filters.weaponGroup)
    if (filters.reviewState) params.set('reviewState', filters.reviewState)
    if (query) params.set('search', query)
    if (sortBy && sortBy !== 'name') params.set('sort', sortBy)
    const next = params.toString()
    const curr = searchParams.toString()
    if (next !== curr) {
      setSearchParams(params, { replace: true })
    }
  }, [filters, query, sortBy, setSearchParams, searchParams])

  const medalTypes = useMemo(() => {
    return [...new Set(medals.map(m => m.type))].filter(Boolean)
  }, [medals])

  const tiers = useMemo(() => {
    return [...new Set(medals.map(m => m.tier))].filter(Boolean)
  }, [medals])

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((acc, [k, v]) => (k === 'search' || !v ? acc : acc + 1), 0)
  }, [filters])

  const onToggleQuickFilter = useCallback((key, value) => {
    setFilter(key, filters[key] === value ? null : value)
  }, [filters, setFilter])

  const statusesById = useMemo(() => {
    const map = Object.create(null)

    if (!statuses) return map

    // Build canonical progression map with explicit status and clear priority
    const addMany = (arr, s) => {
      (arr || []).forEach((r) => {
        map[r.medalId] = { ...r, status: s }
      })
    }

    addMany(statuses.locked, 'locked')
    addMany(statuses.available, 'available')
    addMany(statuses.eligible, 'eligible')
    addMany(statuses.unlocked, 'unlocked')

    return map
  }, [statuses])

  const finalResults = useMemo(() => {
    const withSearch = { ...filters, search: query }
    const filtered = applyFilters(medals, statuses, withSearch)
    return sortMedals(filtered, sortBy, statuses)
  }, [medals, statuses, filters, query, sortBy])

  const hasUnderReview = useMemo(() => finalResults.some(m => m.reviewed !== true), [finalResults])

  // Auto-start onboarding tour on first visit to /medals (after hydration and after "What's New" has been seen)
  useEffect(() => {
    if (isProfileLoading) return
    if (location.pathname !== '/medals') return
    if (tour?.open) return
    if (!tour?.canAutoStart?.()) return

    if (isProductionEnv()) {
      const releaseId = getReleaseId()
      const last = getLastSeen()
      if (releaseId && last !== releaseId) return
    }

    const needsReset = hasActiveFilters || query !== '' || sortBy !== 'name' || showFilters
    if (needsReset) {
      clearAllFilters()
      setQuery('')
      setFilter('search', '')
      setSortBy('name')
      setShowFilters(false)
    }

    tour.start()
  }, [
    isProfileLoading,
    location.pathname,
    tour,
    hasActiveFilters,
    query,
    sortBy,
    showFilters,
    clearAllFilters,
    setQuery,
    setFilter,
  ])

  if (isProfileLoading) {
    return null
  }
  if (!medalDatabase) {
    return <div className="text-muted-foreground">Laddar märken...</div>
  }

  return (
    <div className="space-y-6">
      <ProfileExperienceBanner idPrefix="medals-list" promptId="profile-picker-medals-list" />
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
        <h1 className="text-3xl font-bold text-foreground">Märken</h1>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground" aria-live="polite">
            {finalResults.length} märken
            {hasActiveFilters && (
              <>
                {' · '}
                <button type="button" className="underline hover:no-underline" onClick={clearAllFilters}>
                  Rensa filter
                </button>
              </>
            )}
            {hasUnderReview && (
              <>
                {' · '}
                <span className="hidden lg:inline" role="note" aria-label="Teckenförklaring">
                  <ReviewLegend />
                </span>
              </>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select hidden lg:block"
            aria-label="Sortera"
          >
            <option value="name">Sortera på namn</option>
            <option value="type">Sortera på typ</option>
            <option value="tier">Sortera på valör</option>
            <option value="status">Sortera på status</option>
          </select>
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

      <div className="flex items-center gap-2">
        <QuickFilterChips
          className="flex-1 min-w-0"
          filters={filters}
          onToggle={(key, value) => onToggleQuickFilter(key, value)}
          onOpenFilters={() => setShowFilters(true)}
          activeCount={activeFilterCount}
          controlsId="mobile-filters-sheet"
        />
      </div>

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
            sortBy={sortBy}
            onSortChange={setSortBy}
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
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </MobileBottomSheet>

        <div className="lg:col-span-3">
          {finalResults.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-muted-foreground">Inga märken matchar dina filter</p>
            </div>
          ) : (
            <div className="border border-border rounded-md overflow-hidden" role="region" aria-label="Märkes-resultat">
              <MedalList
                medals={finalResults}
                height={listHeight}
                itemSize={60}
                onSelect={(m) => navigate(`/medals/${m.id}`, { state: { backgroundLocation: location } })}
                statusesById={statusesById}
              />
            </div>
          )}
        </div>
      </div>

      {hasUnderReview && (
        <div className="mt-4 lg:hidden" role="note" aria-label="Teckenförklaring">
          <ReviewLegend />
        </div>
      )}
    </div>
  )
}
