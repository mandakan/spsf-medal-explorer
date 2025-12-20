import { useCallback, useMemo } from 'react'
import { useMedalDatabase } from './useMedalDatabase'
import { useProfile } from './useProfile'
import { buildDependencyIndex, getDescendants } from '../utils/medalDependencies'

/**
 * Determine if a medal can be safely removed (re-locked) without breaking
 * other currently unlocked medals that depend on it.
 */
export function useUnlockGuard(medalId) {
  const { medalDatabase } = useMedalDatabase()
  const { currentProfile, lockMedal } = useProfile()

  const dependencyIndex = useMemo(() => {
    const medals = medalDatabase?.getAllMedals?.() || []
    return buildDependencyIndex(medals)
  }, [medalDatabase])

  const descendants = useMemo(() => {
    return getDescendants(medalId, dependencyIndex)
  }, [medalId, dependencyIndex])

  const unlockedSet = useMemo(() => {
    return new Set((currentProfile?.unlockedMedals || []).map(m => m.medalId))
  }, [currentProfile])

  const blocking = useMemo(() => {
    return Array.from(descendants).filter(id => unlockedSet.has(id))
  }, [descendants, unlockedSet])

  const canRemove = blocking.length === 0

  const tryRemove = useCallback(async () => {
    if (!medalId) return { ok: false }
    if (!canRemove) return { ok: false, blocking }
    const ok = await lockMedal(medalId)
    return { ok: !!ok }
  }, [medalId, canRemove, blocking, lockMedal])

  return { canRemove, blocking, tryRemove }
}
