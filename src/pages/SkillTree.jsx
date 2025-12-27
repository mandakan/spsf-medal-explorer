import React, { useState } from 'react'
import SkillTreeCanvas from '../components/SkillTreeCanvas'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import ProfilePromptBanner from '../components/ProfilePromptBanner'
import { useProfile } from '../hooks/useProfile'
import ProfileSelector from '../components/ProfileSelector'
import { STATUS_ORDER, getStatusProps } from '../config/statuses'
import StatusIcon from '../components/StatusIcon'
import { getStatusColorVar } from '../config/statusColors'

export default function SkillTree() {
  const [viewMode, setViewMode] = useState('canvas') // 'canvas' or 'stats'
  const statuses = useAllMedalStatuses()
  const statusCards = React.useMemo(() => (
    STATUS_ORDER.map(key => {
      const s = getStatusProps(key)
      return {
        key,
        label: s.label,
        count: Array.isArray(statuses?.[key]) ? statuses[key].length : 0,
      }
    })
  ), [statuses])

  const { currentProfile, resetCurrentProfileData } = useProfile()
  const isGuest = Boolean(currentProfile?.isGuest)
  const [showSaveProgress, setShowSaveProgress] = useState(false)

  return (
    <div className="space-y-6">
      {isGuest ? (
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
        <ProfilePromptBanner id="profile-picker-skill-tree" />
      )}
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
          <SkillTreeCanvas />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-stats"
          aria-labelledby="tab-stats"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
        >
          {statusCards.map(({ key, label, count }) => (
            <div key={key} className="card p-6">
              <p
                className="text-sm font-semibold inline-flex items-center gap-2"
                style={{ color: `var(${getStatusColorVar(key)})` }}
              >
                <StatusIcon status={key} className="w-4 h-4" />
                <span>{label}</span>
              </p>
              <p className="text-3xl font-bold text-foreground">{count}</p>
            </div>
          ))}
        </div>
      )}
      <ProfileSelector
        id="save-progress-picker-skilltree"
        mode="picker"
        open={showSaveProgress}
        onClose={() => setShowSaveProgress(false)}
        forceCreate
        convertGuest
      />
    </div>
  )
}
