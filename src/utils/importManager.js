/**
 * Import Manager
 * - parseFile(file)
 * - parseJSON(contentOrFile)
 * - parseCSV(contentOrFile)
 * - validateData(achievements)
 * - detectDuplicates(achievementsOrContainer)
 * - resolveConflicts(existing, incoming)
 */

export function parseProfileBackup(content) {
  let raw
  try {
    raw = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    throw new Error('Invalid JSON')
  }
  if (!raw || raw.kind !== 'profile-backup' || raw.version !== '1.0' || !raw.profile || typeof raw.profile !== 'object') {
    throw new Error('Invalid profile backup')
  }

  const p = raw.profile

  const achievements = Array.isArray(p.prerequisites)
    ? p.prerequisites.map((a, i) => ({
        ...a,
        id: a?.id || `achievement-${Date.now()}-${i}`,
      }))
    : []

  return {
    userId: typeof p.userId === 'string' ? p.userId.trim() : '',
    displayName: typeof p.displayName === 'string' ? p.displayName : '',
    createdDate: p.createdDate || new Date().toISOString(),
    lastModified: p.lastModified || new Date().toISOString(),
    dateOfBirth: typeof p.dateOfBirth === 'string' ? p.dateOfBirth : '',
    sex: typeof p.sex === 'string' ? p.sex.trim().toLowerCase() : '',
    unlockedMedals: Array.isArray(p.unlockedMedals) ? p.unlockedMedals : [],
    prerequisites: achievements,
    features: {
      allowManualUnlock: !!(p.features && p.features.allowManualUnlock),
      enforceCurrentYearForSustained: !!(p.features && p.features.enforceCurrentYearForSustained),
    },
    notifications: !!p.notifications,
  }
}
