import { useCallback, useEffect } from 'react'
import { useProfile } from './useProfile'
import { useUndoRedo } from './useUndoRedo'
import { Achievement } from '../models/Achievement'

/**
 * Provides achievement list operations (add/update/delete/batch) with undo/redo support.
 * Assumes ProfileContext provides: currentProfile, addAchievement, updateAchievement, removeAchievement
 */
export function useAchievementHistory() {
  const {
    currentProfile,
    addAchievement: profileAddAchievement,
    updateAchievement: profileUpdateAchievement,
    removeAchievement: profileRemoveAchievement,
    unlockMedal: profileUnlockMedal,
  } = useProfile()

  const {
    pushState, undo, redo, canUndo, canRedo, history, historyIndex
  } = useUndoRedo()

  // Snapshot helper
  const snapshot = useCallback(() => {
    const list = currentProfile?.prerequisites || []
    // Deep-ish copy to avoid mutation
    return list.map(a => ({ ...a }))
  }, [currentProfile])

  // Push current snapshot (call this right after a successful mutation)
  const pushCurrent = useCallback(() => {
    pushState({ type: 'achievements', data: snapshot() })
  }, [pushState, snapshot])

  // Apply a snapshot by reconciling current → target using ids
  const applySnapshot = useCallback(async (targetList) => {
    if (!currentProfile) return
    const userId = currentProfile.userId
    const current = (currentProfile.prerequisites || []).map(a => ({ ...a }))
    const byIdCurrent = new Map(current.map(a => [a.id, a]))
    const byIdTarget = new Map(targetList.map(a => [a.id, a]))

    // Remove missing
    for (const cur of current) {
      if (!byIdTarget.has(cur.id)) {
        if (typeof profileRemoveAchievement === 'function') {
          try { await profileRemoveAchievement(cur.id) } catch { void 0 }
        }
      }
    }

    // Add new
    for (const tgt of targetList) {
      if (!byIdCurrent.has(tgt.id)) {
        if (typeof profileAddAchievement === 'function') {
          try {
            await profileAddAchievement(new Achievement(tgt))
          } catch { void 0 }
        }
      }
    }

    // Update changed
    for (const tgt of targetList) {
      const cur = byIdCurrent.get(tgt.id)
      if (!cur) continue
      const changed = ['type', 'year', 'weaponGroup', 'points', 'date', 'competitionName', 'notes', 'timeSeconds', 'hits']
        .some(k => String(cur[k] ?? '') !== String(tgt[k] ?? ''))
      if (changed && typeof profileUpdateAchievement === 'function') {
        try {
          await profileUpdateAchievement(new Achievement(tgt))
        } catch { void 0 }
      }
    }
  }, [profileAddAchievement, profileRemoveAchievement, profileUpdateAchievement, currentProfile])

  // Public operations

  const addMany = useCallback(async (rows = []) => {
    if (!rows.length || !currentProfile) return 0
    let added = 0
    const failures = []
    const toNum = (v) => (v === '' || v == null ? undefined : Number(v))

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const achievement = new Achievement({
        id: row.id, // allow pre-specified id
        type: row.type,
        year: Number(row.year),
        weaponGroup: row.weaponGroup,
        date: row.date || new Date().toISOString().slice(0, 10),
        competitionName: row.competitionName || '',
        notes: row.notes || '',
        // precision_series
        points: row.type === 'precision_series' ? toNum(row.points) : undefined,
        // standard_medal
        disciplineType: row.type === 'standard_medal' ? (row.disciplineType || '') : undefined,
        medalType: (row.type === 'standard_medal' || row.type === 'competition_result' )? (row.medalType || '') : undefined,
        // competition_result
        competitionType: row.type === 'competition_result' ? (row.competitionType || '') : undefined,
        // qualification_result
        weapon: row.type === 'qualification_result' ? (row.weapon || '') : undefined,
        score: row.type === 'qualification_result' ? toNum(row.score) : undefined,
        // team_event
        teamName: row.type === 'team_event' ? (row.teamName || '') : undefined,
        position: row.type === 'team_event' ? toNum(row.position) : undefined,
        participants: row.type === 'team_event'
          ? (Array.isArray(row.participants)
              ? row.participants
              : String(row.participants || '').split(',').map(s => s.trim()).filter(Boolean))
          : undefined,
        // event/custom
        eventName: (row.type === 'event' || row.type === 'custom') ? (row.eventName || '') : undefined,
        // application_series
        timeSeconds: row.type === 'application_series'
          ? Number(row.timeSeconds)
          : undefined,
        hits: row.type === 'application_series'
          ? (row.hits === '' || row.hits == null ? undefined : Number(row.hits))
          : undefined,
      })
      if (typeof profileAddAchievement === 'function') {
        try {
          await profileAddAchievement(achievement)
          added++
        } catch (e1) {
          failures.push({ index: i, message: e1?.message || 'Failed to add achievement' })
          try { console.error('addMany: add failed', { index: i + 1, error: e1, achievement }) } catch {}
        }
      }
    }

    if (added > 0) {
      pushCurrent()
      return added
    }

    if (failures.length > 0) {
      const msg = failures.map(f => `Row ${f.index + 1}: ${f.message}`).join(' | ')
      throw new Error(msg)
    }

    return 0
  }, [profileAddAchievement, currentProfile, pushCurrent])

  const updateOne = useCallback(async (updated) => {
    if (!currentProfile) return false
    const payload = updated instanceof Achievement
      ? updated
      : new Achievement({ ...updated, id: updated?.id })
    if (!payload?.id) return false
    try {
      await profileUpdateAchievement(payload)
      pushCurrent()
      return true
    } catch (e1) {
      console.error('updateAchievement failed', { error: e1, payload })
      return false
    }
  }, [currentProfile, profileUpdateAchievement, pushCurrent])

  const removeOne = useCallback(async (achievementId) => {
    if (!currentProfile || !achievementId) return false
    let ok = false
    if (typeof profileRemoveAchievement === 'function') {
      try {
        await profileRemoveAchievement(achievementId)
        ok = true
      } catch (e) {
        console.error('removeAchievement failed', { error: e, achievementId })
      }
    }
    if (ok) pushCurrent()
    return ok
  }, [currentProfile, profileRemoveAchievement, pushCurrent])

  // Undo/Redo helpers for achievements
  const undoAchievements = useCallback(async () => {
    const idx = undo()
    if (idx == null) return false
    const snapshotObj = history[idx]
    if (snapshotObj?.type === 'achievements') {
      await applySnapshot(snapshotObj.data)
      return true
    }
    return false
  }, [undo, history, applySnapshot])

  const redoAchievements = useCallback(async () => {
    const idx = redo()
    if (idx == null) return false
    const snapshotObj = history[idx]
    if (snapshotObj?.type === 'achievements') {
      await applySnapshot(snapshotObj.data)
      return true
    }
    return false
  }, [redo, history, applySnapshot])

  // Keyboard shortcuts: Cmd/Ctrl+Z and Cmd/Ctrl+Y
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey
      if (!ctrlOrMeta) return
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault()
        void undoAchievements()
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault()
        void redoAchievements()
      }
    }
    window.addEventListener('keydown', onKey, { passive: false })
    return () => window.removeEventListener('keydown', onKey)
  }, [undoAchievements, redoAchievements])

  // Canonical single-item operations exposed by this hook
  const addAchievement = useCallback(async (row) => {
    if (!currentProfile || !row) return false
    const achievement = row instanceof Achievement ? row : new Achievement(row)
    if (typeof profileAddAchievement !== 'function') return false
    try {
      await profileAddAchievement(achievement)
      pushCurrent()
      return true
    } catch (e) {
      console.error('addAchievement failed', { error: e, achievement })
      return false
    }
  }, [currentProfile, profileAddAchievement, pushCurrent])

  const updateAchievement = updateOne
  const removeAchievement = removeOne

  return {
    achievements: currentProfile?.prerequisites || [],
    addMany,
    addAchievement,
    updateAchievement,
    removeAchievement,
    unlockMedal: profileUnlockMedal,
    updateOne,
    removeOne,
    undoAchievements,
    redoAchievements,
    canUndo,
    canRedo,
    historyIndex
  }
}
