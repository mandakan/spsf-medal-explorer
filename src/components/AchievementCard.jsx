import React, { useState } from 'react'
import { useAchievementHistory } from '../hooks/useAchievementHistory'
import AchievementDialog from './AchievementDialog'
import { getAchievementTypeLabel } from '../utils/labels'

export default function AchievementCard({ achievement }) {
  const { addAchievement, updateAchievement, removeAchievement } = useAchievementHistory()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState('add')
  const [editorInitial, setEditorInitial] = useState(null)

  const handleDelete = async () => {
    if (!confirm('Delete this achievement?')) return
    try {
      await removeAchievement(achievement.id)
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  // Map stored achievement -> AchievementDialog row shape
  const achievementToDialogRow = (a) => ({
    id: a.id,
    type: a.type,
    year: a.year,
    weaponGroup: a.weaponGroup,
    date: a.date,
    points: a.points,
    timeSeconds: a.timeSeconds,
    hits: a.hits,
    competitionType: a.competitionType,
    medalType: a.medalType,
    competitionName: a.competitionName,
    weapon: a.weapon,
    score: a.score,
    teamName: a.teamName,
    position: a.position,
    participants: Array.isArray(a.participants) ? a.participants.join(', ') : (a.participants || ''),
    eventName: a.eventName,
    notes: a.notes,
  })

  // Map dialog row -> payload for update/add
  const dialogRowToPayload = (row, { id, medalId } = {}) => {
    const base = {
      id,
      medalId,
      type: row.type,
      year: Number(row.year),
      weaponGroup: row.weaponGroup,
      date: row.date,
      notes: row.notes || '',
    }
    switch (row.type) {
      case 'precision_series':
        return { ...base, points: row.points === '' ? undefined : Number(row.points ?? 0), competitionName: row.competitionName || undefined }
      case 'application_series':
        return {
          ...base,
          timeSeconds: row.timeSeconds === '' ? undefined : Number(row.timeSeconds ?? 0),
          hits: row.hits === '' ? undefined : Number(row.hits ?? 0),
        }
      case 'competition_result':
        return {
          ...base,
          score: row.score === '' ? undefined : Number(row.score ?? 0),
          competitionName: row.competitionName || '',
          competitionType: row.competitionType || '',
          medalType: row.medalType || '',
        }
      case 'qualification_result':
        return {
          ...base,
          weapon: row.weapon || '',
          score: row.score === '' ? undefined : Number(row.score ?? 0),
        }
      case 'team_event':
        return {
          ...base,
          teamName: row.teamName || '',
          position: row.position === '' ? undefined : Number(row.position ?? 0),
          participants: String(row.participants || '').split(',').map(s => s.trim()).filter(Boolean),
        }
      case 'event':
      case 'custom':
      default:
        return { ...base, eventName: row.eventName || '' }
    }
  }

  const openEditDialog = () => {
    setEditorMode('edit')
    setEditorInitial(achievementToDialogRow(achievement))
    setEditorOpen(true)
  }

  const openAddDialog = () => {
    setEditorMode('add')
    const today = new Date().toISOString().slice(0, 10)
    setEditorInitial({
      year: new Date(today).getFullYear(),
      weaponGroup: achievement.weaponGroup || 'A',
      type: achievement.type || 'precision_series',
      date: today,
      points: '',
      timeSeconds: '',
      hits: '',
      competitionType: '',
      medalType: '',
      competitionName: '',
      weapon: '',
      score: '',
      teamName: '',
      position: '',
      participants: '',
      eventName: '',
      notes: '',
    })
    setEditorOpen(true)
  }

  const handleEditorSave = async (row) => {
    try {
      if (editorMode === 'edit') {
        const payload = dialogRowToPayload(row, { id: achievement.id, medalId: achievement.medalId })
        await updateAchievement(payload)
      } else {
        const payload = dialogRowToPayload(row, { medalId: achievement.medalId })
        await addAchievement(payload)
      }
      setEditorOpen(false)
    } catch (err) {
      console.error('Misslyckades att spara:', err)
    }
  }

  const typeLabel = getAchievementTypeLabel(achievement.type)


  return (
    <>
      <div className="card p-4 flex justify-between items-start">
        <div>
          <div className="flex gap-2 items-center mb-1">
            <span className="font-semibold text-text-primary">{typeLabel}</span>
            <span className="text-xs px-2 py-1 rounded bg-bg-secondary text-text-secondary">
              Grupp {achievement.weaponGroup}
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            {(achievement.date || '').toString()} • {achievement.points} points
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openEditDialog}
            className="btn btn-muted text-sm"
            aria-label={`Ändra aktivitet ${achievement.id}`}
          >
            Ändra
          </button>
          <button
            onClick={openAddDialog}
            className="btn btn-primary text-sm"
            aria-label={`Logga ny aktivitet för medalj ${achievement.medalId}`}
          >
            Logga
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-muted text-red-600 text-sm"
            aria-label={`Ta bort aktivitet ${achievement.id}`}
          >
            Ta bort
          </button>
        </div>
      </div>

      <AchievementDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialRow={editorInitial}
        onSave={handleEditorSave}
        mode="immediate"
        submitLabel={editorMode === 'edit' ? 'Spara' : 'Lägg till'}
      />
    </>
  )
}
