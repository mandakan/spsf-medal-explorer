/**
 * Import Manager
 * - parseFile(file)
 * - parseJSON(contentOrFile)
 * - parseCSV(contentOrFile)
 * - validateData(achievements)
 * - detectDuplicates(achievementsOrContainer)
 * - resolveConflicts(existing, incoming)
 */

import { readFile } from './fileHandlers'

/**
 * Prefer existing project validator logic if available.
 * Use static imports to avoid mixed static/dynamic import warnings and ensure consistent bundling.
 */
import { InputValidator } from '../logic/validator.js'
import { detectDuplicateAchievements } from '../logic/achievementValidator.js'

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

export async function parseFile(file) {
  const name = (file?.name || '').toLowerCase()
  const text = await readFile(file)
  if (name.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
    return parseJSON(text)
  }
  if (name.endsWith('.csv')) {
    return parseCSV(text)
  }
  throw new Error('Unsupported file format. Please upload JSON or CSV.')
}

export function parseJSON(content) {
  let parsed
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    throw new Error('Invalid JSON')
  }
  return normalizeAchievementsContainer(parsed)
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

export function parseCSV(content) {
  const lines = splitCsvLines(typeof content === 'string' ? content : '')
  if (!lines.length) return { achievements: [] }

  const header = parseCsvRow(lines[0]).map(h => h.trim().toLowerCase())
  const rows = lines.slice(1)
  const achievements = rows.map(line => {
    const cols = parseCsvRow(line)
    const get = key => {
      const idx = header.indexOf(key)
      return idx >= 0 ? cols[idx] : ''
    }
    // Expected headers (from PR): Medal,Type,Date,Score,Position,Weapon,Team,Notes,Status
    return {
      id: undefined,
      medalId: get('medal') || undefined,
      type: get('type') || undefined,
      date: get('date') || undefined,
      points: get('score') !== '' ? Number(get('score')) : undefined,
      position: get('position') || undefined,
      weaponGroup: get('weapon') || undefined,
      team: get('team') || undefined,
      notes: get('notes') || undefined,
      status: get('status') || undefined,
    }
  }).filter(a => Object.values(a).some(v => v !== undefined && v !== ''))

  return { achievements }
}

export function validateData(achievements) {
  const result = {
    valid: [],
    invalid: [],
    errorsByIndex: {},
  }
  const list = Array.isArray(achievements) ? achievements : (achievements?.achievements || [])
  list.forEach((ach, idx) => {
    let errors = []
    if (InputValidator && ach?.type === 'precision_series') {
      const res = InputValidator.validatePrecisionSeriesInput(ach)
      if (!res.isValid) {
        errors = res.errors || ['Invalid gold_series entry']
      }
    } else {
      // Generic sanity checks
      if (!ach?.type) errors.push('Missing type')
      if (!ach?.date) errors.push('Missing date')
      if (ach?.points != null && (Number.isNaN(Number(ach.points)) || Number(ach.points) < 0)) {
        errors.push('Invalid points')
      }
    }

    if (errors.length) {
      result.invalid.push(ach)
      result.errorsByIndex[idx] = errors
    } else {
      result.valid.push(ach)
    }
  })
  return result
}

export function detectDuplicates(input) {
  const list = Array.isArray(input) ? input : (input?.achievements || [])
  if (detectDuplicateAchievements) {
    return detectDuplicateAchievements(list)
  }
  // Fallback duplicate detection by composite key
  const seen = new Set()
  const dups = []
  list.forEach(a => {
    const key = `${a.type}|${a.medalId || ''}|${a.date || ''}|${a.points ?? ''}`
    if (seen.has(key)) dups.push(a)
    else seen.add(key)
  })
  return dups
}

export function resolveConflicts(existing, incoming) {
  const existingList = Array.isArray(existing) ? existing : (existing?.achievements || [])
  const incomingList = Array.isArray(incoming) ? incoming : (incoming?.achievements || [])

  const keyOf = a => a?.id || `${a.type}|${a.medalId || ''}|${a.date || ''}|${a.points ?? ''}`
  const existingKeys = new Set(existingList.map(keyOf))
  const merged = existingList.slice()
  incomingList.forEach(a => {
    const key = keyOf(a)
    if (!existingKeys.has(key)) {
      merged.push(a)
      existingKeys.add(key)
    }
  })
  return merged
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
