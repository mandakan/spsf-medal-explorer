import React, { useState } from 'react'
import SkillTreeCanvas from '../components/SkillTreeCanvas'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'

export default function SkillTree() {
  const [viewMode, setViewMode] = useState('canvas') // 'canvas' or 'stats'
  const statuses = useAllMedalStatuses()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Skill Tree</h1>
        <div
          role="tablist"
          aria-label="Skill tree view"
          className="inline-flex gap-2"
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
            className={`btn ${viewMode === 'canvas' ? 'btn-primary' : 'btn-muted'}`}
            onClick={() => setViewMode('canvas')}
          >
            <span aria-hidden="true">🎨</span> Canvas
          </button>
          <button
            role="tab"
            id="tab-stats"
            aria-controls="panel-stats"
            aria-selected={viewMode === 'stats'}
            className={`btn ${viewMode === 'stats' ? 'btn-primary' : 'btn-muted'}`}
            onClick={() => setViewMode('stats')}
          >
            <span aria-hidden="true">📊</span> Stats
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
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="card p-6">
            <h3 className="section-title mb-2">Unlocked</h3>
            <p className="text-3xl font-bold text-foreground">
              {statuses.unlocked.length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Medals you've already earned
            </p>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-2">Achievable</h3>
            <p className="text-3xl font-bold text-foreground">
              {statuses.achievable.length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Next medals you can unlock
            </p>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-2">Locked</h3>
            <p className="text-3xl font-bold text-foreground">
              {statuses.locked.length}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Future goals to work toward
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
