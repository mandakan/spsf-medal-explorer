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
import MedalDetailModal from '../components/MedalDetailModal'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ProfilePromptBanner from '../components/ProfilePromptBanner'
import ReviewLegend from '../components/ReviewLegend'
import ProfileSelector from '../components/ProfileSelector'
import { useProfile } from '../hooks/useProfile'

export default function MedalsList() {
  const { medalDatabase } = useMedalDatabase()
  const { id: selectedMedalId } = useParams()
  const navigate = useNavigate()
  const statuses = useAllMedalStatuses()
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentProfile, startExplorerMode, convertGuestToSaved, resetCurrentProfileData } = useProfile()
  const isGuest = Boolean(currentProfile?.isGuest)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !currentProfile && !window.localStorage.getItem('app:onboardingChoice')
    } catch {
      return !currentProfile
    }
  })
  const [showSaveProgress, setShowSaveProgress] = useState(false)

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

  // Sync filters/search/sort to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.type) params.set('type', filters.type)
    if (filters.tier) params.set('tier', filters.tier)
    if (filters.weaponGroup) params.set('weaponGroup', filters.weaponGroup)
    if (filters.reviewState) params.set('reviewState', filters.reviewState)
    if (query) params.set('search', query)
    if (sortBy && sortBy !== 'name') params.set('sort', sortBy)
    setSearchParams(params)
  }, [filters, query, sortBy, setSearchParams])

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

  const hasUnderReview = useMemo(() => finalResults.some(m => m.reviewed !== true), [finalResults])

  if (!medalDatabase) {
    return <div className="text-muted-foreground">Laddar märken...</div>
  }

  return (
    <div className="space-y-6">
      {showOnboarding ? (
        <div className="card p-4" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <h2 id="onboarding-title" className="section-title mb-2">Hur vill du börja?</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Utforska märken direkt eller skapa en profil för att spara ditt arbete.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary min-h-[44px]"
              onClick={() => {
                try { window.localStorage.setItem('app:onboardingChoice', 'guest') } catch {}
                startExplorerMode()
                setShowOnboarding(false)
              }}
            >
              Utforska utan att spara (Gästläge)
            </button>
            <button
              type="button"
              className="btn btn-primary min-h-[44px]"
              onClick={() => {
                try { window.localStorage.setItem('app:onboardingChoice', 'saved') } catch {}
                setShowOnboarding(false)
              }}
            >
              Skapa profil
            </button>
          </div>
        </div>
      ) : isGuest ? (
        <div className="card p-4" role="status" aria-live="polite">
          <div className="flex items-start gap-3">
            <div aria-hidden="true" className="text-xl leading-none">🧭</div>
            <div className="flex-1">
              <p className="mb-2">Gästläge: framsteg sparas tillfälligt.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary min-h-[44px]"
                  onClick={() => setShowSaveProgress(true)}
                >
                  Spara framsteg
                </button>
                <button
                  type="button"
                  className="btn btn-secondary min-h-[44px]"
                  onClick={async () => {
                    if (window.confirm('Återställa alla märken och förkunskaper? Detta går inte att ångra.')) {
                      await resetCurrentProfileData()
                    }
                  }}
                >
                  Återställ alla
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ProfilePromptBanner id="profile-picker-medals-list" />
      )}
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
            <div className="border border-gray-200 dark:border-slate-700 rounded-md overflow-hidden" role="region" aria-label="Märkes-resultat">
              <MedalList medals={finalResults} height={listHeight} itemSize={60} onSelect={(m) => navigate(`/medals/${m.id}`)} statusesById={statusesById} />
            </div>
          )}
        </div>
      </div>

      {hasUnderReview && (
        <div className="mt-4 lg:hidden" role="note" aria-label="Teckenförklaring">
          <ReviewLegend />
        </div>
      )}

      {selectedMedalId && (
        <MedalDetailModal
          medalId={selectedMedalId}
          onClose={() => navigate('/medals')}
        />
      )}
      <ProfileSelector
        id="save-progress-picker"
        mode="picker"
        open={showSaveProgress}
        onClose={() => setShowSaveProgress(false)}
        forceCreate
        convertGuest
      />
    </div>
  )
}
