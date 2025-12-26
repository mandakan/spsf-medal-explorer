import React from 'react'

export default function AchievementRowCard({ row, index, onEdit, onRemove }) {
  const subtitle = (() => {
    switch (row.type) {
      case 'precision_series': return `Points: ${row.points ?? '—'}`
      case 'application_series': return `Time: ${row.timeSeconds ?? '—'} • Hits: ${row.hits ?? '—'}`
      case 'standard_medal': return `${row.disciplineType || '—'} • ${row.medalType || '—'}`
      case 'competition_result': return `${row.competitionType || '—'} • ${row.medalType || '—'}`
      case 'qualification_result': return `Weapon: ${row.weapon || '—'} • Score: ${row.score || '—'}`
      case 'team_event': return `Team: ${row.teamName || '—'} • Pos: ${row.position || '—'}`
      case 'event': return `${row.eventName || '—'}`
      default: return `${row.eventName || '—'}`
    }
  })()

  return (
    <div className="card p-4 flex items-start justify-between gap-3">
      <div>
        <div className="font-medium text-foreground">
          {row.type.replace(/_/g, ' ')} • {row.year} • Grupp {row.weaponGroup}
        </div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
        {row.notes ? <div className="text-xs text-muted-foreground mt-1">Anteckningar</div> : null}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onEdit?.(index)}
          className="btn btn-muted h-10 px-3"
          aria-label={`Ändra rad ${index + 1}`}
        >
          Ändra
        </button>
        <button
          type="button"
          onClick={() => onRemove?.(index)}
          className="btn btn-muted h-10 px-3 text-red-600"
          aria-label={`Ta bort rad ${index + 1}`}
        >
          Ta bort
        </button>
      </div>
    </div>
  )
}
