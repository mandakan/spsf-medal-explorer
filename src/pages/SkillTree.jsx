import React, { useState } from 'react'
import SkillTreeCanvas from '../components/SkillTreeCanvas'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import ProfilePromptBanner from '../components/ProfilePromptBanner'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import ReviewLegend from '../components/ReviewLegend'

export default function SkillTree() {
  const [viewMode, setViewMode] = useState('canvas') // 'canvas' or 'stats'
  const statuses = useAllMedalStatuses()
  const { medalDatabase } = useMedalDatabase()
  const hasUnderReview = React.useMemo(() => {
    const all = medalDatabase?.getAllMedals?.() || []
    return all.some(m => m && m.reviewed !== true)
  }, [medalDatabase])

  return (
    <div className="space-y-6">
      <ProfilePromptBanner id="profile-picker-skill-tree" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-text-primary mb-1 sm:mb-0">Trädvy</h1>
        <div
          role="tablist"
          aria-label="Trädvy med märken"
          className="inline-flex gap-2 flex-wrap sm:flex-nowrap"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
              setViewMode(viewMode === 'canvas' ? 'stats' : 'canvas')
              e.preventDefault()
            }
          }}
        >
          <button
            role="tab"
            id="tab-canvas"
            aria-controls="panel-canvas"
            aria-selected={viewMode === 'canvas'}
            className={`btn ${viewMode === 'canvas' ? 'btn-primary' : 'btn-muted'} min-h-[44px]`}
            onClick={() => setViewMode('canvas')}
          >
            <span aria-hidden="true">🎨</span> Canvas
          </button>
          <button
            role="tab"
            id="tab-stats"
            aria-controls="panel-stats"
            aria-selected={viewMode === 'stats'}
            className={`btn ${viewMode === 'stats' ? 'btn-primary' : 'btn-muted'} min-h-[44px]`}
            onClick={() => setViewMode('stats')}
          >
            <span aria-hidden="true">📊</span> Statistik
          </button>
        </div>
      </div>

      {viewMode === 'canvas' ? (
        <div role="tabpanel" id="panel-canvas" aria-labelledby="tab-canvas">
          <SkillTreeCanvas legendDescribedById={hasUnderReview ? 'tree-review-legend' : undefined} />
          {hasUnderReview && (
            <div className="mt-2 text-xs text-muted-foreground">
              <ReviewLegend id="tree-review-legend" />
            </div>
          )}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-stats"
          aria-labelledby="tab-stats"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="card p-6">
            <h3 className="section-title mb-2">Upplåsta</h3>
            <p className="text-3xl font-bold text-foreground">
              {statuses.unlocked.length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Märken du redan låst upp
            </p>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-2">Uppnåeliga</h3>
            <p className="text-3xl font-bold text-foreground">
              {statuses.achievable.length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Märken du kan låsa upp
            </p>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-2">Låsta</h3>
            <p className="text-3xl font-bold text-foreground">
              {statuses.locked.length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Framtida mål att arbeta mot
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
