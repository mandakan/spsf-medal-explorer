/**
 * Detect a suitable form variant for a given medal.
 * Falls back to 'custom' if unknown.
 */
export function detectMedalFormType(medal) {
  if (!medal || typeof medal !== 'object') return 'custom'

  // Normalize commonly available fields to make detection robust across datasets
  const medalsType = String(medal.medals_type || medal.category || '').toLowerCase()
  const typeStr = String(medal.type || '').toLowerCase()
  const nameStr = String(medal.displayName || medal.name || '').toLowerCase()
  const tierStr = String(medal.tier || '').toLowerCase()

  // Competition heuristics (series/tiers gold/silver/bronze)
  if (
    medalsType === 'serie' ||
    /series|serie/.test(typeStr) ||
    ['gold', 'silver', 'bronze'].includes(tierStr)
  ) {
    return 'competition'
  }

  // Qualification heuristics
  if (
    medalsType === 'kvalificering' ||
    /qual|kval/.test(typeStr) ||
    /qual|kval/.test(nameStr)
  ) {
    return 'qualification'
  }

  // Team event heuristics
  if (
    Boolean(medal.team_medal) ||
    /team|lag/.test(typeStr) ||
    /team|lag/.test(nameStr)
  ) {
    return 'team_event'
  }

  // Event heuristics
  if (
    Boolean(medal.event_only) ||
    /event|cup|championship|mästerskap/.test(typeStr) ||
    /event|cup|championship|mästerskap/.test(nameStr)
  ) {
    return 'event'
  }

  // Fallback to requirements if present (compatible with earlier data)
  const reqs = Array.isArray(medal.requirements) ? medal.requirements : []
  if (reqs.length) {
    const types = reqs.map(r => String(r?.type || '').toLowerCase())
    if (types.includes('precision_series')) return 'competition'
    if (types.some(t => t.includes('qualification'))) return 'qualification'
  }

  return 'custom'
}

function ensureISODate(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10)
  // Assume input is yyyy-mm-dd from <input type="date">
  return dateStr
}

/**
 * Map UI form data into the app's persisted achievement shape.
 * Ensures fields required by LocalStorageDataManager.validateAchievement are present:
 * - type, year (number), weaponGroup in A/B/C/R
 * Adds points for precision_series.
 */
export function mapFormToAchievement({ medal, medalType, formData }) {
  const date = ensureISODate(formData?.date)
  const year = Number(String(date).slice(0, 4))
  const weaponGroup = formData?.weaponGroup || 'A'

  // Decide internal storage type
  let storageType = 'custom'
  if (medalType === 'competition') {
    const hasPrecisionSeries = Array.isArray(medal?.requirements) && medal.requirements.some(r => (r?.type || '').toLowerCase() === 'precision_series')
    storageType = hasPrecisionSeries ? 'precision_series' : 'competition_result'
  } else if (medalType === 'qualification') {
    storageType = 'qualification_result'
  } else if (medalType === 'team_event') {
    storageType = 'team_event'
  } else if (medalType === 'event') {
    storageType = 'event'
  } else {
    storageType = 'custom'
  }

  const base = {
    id: formData?.id || (`achievement-${crypto?.randomUUID ? crypto.randomUUID() : Date.now()}`),
    type: storageType,
    medalId: medal?.id || medal?.medalId || '',
    year,
    weaponGroup,
    date,
    notes: formData?.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  switch (storageType) {
    case 'precision_series':
      return {
        ...base,
        points: Number(formData?.score ?? 0),
        competitionName: formData?.competitionName || '',
      }
    case 'competition_result':
      return {
        ...base,
        score: Number(formData?.score ?? 0),
        competitionName: formData?.competitionName || '',
        competitionType: String(formData?.competitionType || '').toLowerCase(),
        medalType: String((formData?.medalType ?? medal?.tier ?? '')).toLowerCase(), // bronze/silver/gold
      }
    case 'qualification_result':
      return {
        ...base,
        weapon: formData?.weapon || '',
        score: Number(formData?.score ?? 0),
      }
    case 'team_event':
      return {
        ...base,
        teamName: formData?.teamName || '',
        position: Number(formData?.position ?? 0),
        participants: (formData?.participants || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      }
    case 'event':
      return {
        ...base,
        eventName: formData?.eventName || '',
      }
    default:
      return {
        ...base,
        eventName: formData?.eventName || '',
      }
  }
}
