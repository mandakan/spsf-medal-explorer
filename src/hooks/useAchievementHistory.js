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
          // removeAchievement likely signature: (userId, achievementId) or (achievementId)
          try {
            await profileRemoveAchievement(userId, cur.id)
          } catch {
            try { await profileRemoveAchievement(cur.id) } catch (e) { /* ignore */ }
          }
        }
      }
    }

    // Add new
    for (const tgt of targetList) {
      if (!byIdCurrent.has(tgt.id)) {
        if (typeof profileAddAchievement === 'function') {
          try {
            await profileAddAchievement(new Achievement(tgt))
          } catch (e) {
            try { await profileAddAchievement(userId, new Achievement(tgt)) } catch (_) {}
          }
        }
      }
    }

    // Update changed
    for (const tgt of targetList) {
      const cur = byIdCurrent.get(tgt.id)
      if (!cur) continue
      const changed = ['type', 'year', 'weaponGroup', 'points', 'date', 'competitionName', 'notes']
        .some(k => String(cur[k] ?? '') !== String(tgt[k] ?? ''))
      if (changed && typeof profileUpdateAchievement === 'function') {
        try {
          await profileUpdateAchievement(new Achievement(tgt))
        } catch {
          try { await profileUpdateAchievement(userId, tgt.id, new Achievement(tgt)) } catch (_) {}
        }
      }
    }
  }, [profileAddAchievement, profileRemoveAchievement, profileUpdateAchievement, currentProfile])

  // Public operations

  const addMany = useCallback(async (rows = []) => {
    if (!rows.length || !currentProfile) return 0
    let added = 0
    for (const row of rows) {
      const achievement = new Achievement({
        id: row.id, // allow pre-specified id
        type: row.type,
        year: parseInt(row.year),
        weaponGroup: row.weaponGroup,
        points: parseInt(row.points),
        date: row.date || new Date().toISOString().split('T')[0],
        competitionName: row.competitionName || '',
        notes: row.notes || ''
      })
      if (typeof profileAddAchievement === 'function') {
        try {
          await profileAddAchievement(achievement)
          added++
        } catch (e) {
          // try alt signature
          try {
            await profileAddAchievement(currentProfile.userId, achievement)
            added++
          } catch (_) {}
        }
      }
    }
    if (added > 0) {
      pushCurrent()
    }
    return added
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
      try {
        await profileUpdateAchievement(currentProfile.userId, payload.id, payload)
        pushCurrent()
        return true
      } catch (e2) {
        console.error('updateAchievement failed', { e1, e2, payload })
        return false
      }
    }
  }, [currentProfile, profileUpdateAchievement, pushCurrent])

  const removeOne = useCallback(async (achievementId) => {
    if (!currentProfile || !achievementId) return false
    let ok = false
    if (typeof profileRemoveAchievement === 'function') {
      try {
        await profileRemoveAchievement(achievementId)
        ok = true
      } catch {
        try {
          await profileRemoveAchievement(currentProfile.userId, achievementId)
          ok = true
        } catch (_) {}
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
    } catch {
      // alt signature (userId, achievement)
      await profileAddAchievement(currentProfile.userId, achievement)
    }
    pushCurrent()
    return true
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
