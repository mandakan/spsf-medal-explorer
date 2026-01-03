/**
 * Import Manager
 * - parseFile(file)
 * - parseJSON(contentOrFile)
 * - parseCSV(contentOrFile)
 * - validateData(achievements)
 * - detectDuplicates(achievementsOrContainer)
 * - resolveConflicts(existing, incoming)
 */

function normalizeAchievementsContainer(parsed) {
  if (Array.isArray(parsed)) {
    return { achievements: parsed }
  }
  if (parsed && Array.isArray(parsed.achievements)) {
    return parsed
  }
  // Try to detect profile export format
  if (parsed && (Array.isArray(parsed.prerequisites) || Array.isArray(parsed.unlockedMedals))) {
    return { ...parsed, achievements: parsed.achievements || parsed.prerequisites || [] }
  }
  return { achievements: [] }
}

function splitCsvLines(csv) {
  // Split into lines, supporting CRLF/CR
  return csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
}

function parseCsvRow(row) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (inQuotes) {
      if (ch === '"') {
        if (row[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else {
      if (ch === ',') {
        out.push(cur)
        cur = ''
      } else if (ch === '"') {
        inQuotes = true
      } else {
        cur += ch
      }
    }
  }
  out.push(cur)
  return out
}

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
    unlockedMedals: Array.isArray(p.unlockedMedals) ? p.unlockedMedals : [],
    prerequisites: achievements,
    features: {
      allowManualUnlock: !!(p.features && p.features.allowManualUnlock),
      enforceCurrentYearForSustained: !!(p.features && p.features.enforceCurrentYearForSustained),
    },
    notifications: !!p.notifications,
  }
}
