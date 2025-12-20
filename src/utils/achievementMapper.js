/**
 * Detect a suitable form variant for a given medal.
 * Falls back to 'custom' if unknown.
 */
export function detectMedalFormType(medal) {
  if (!medal || typeof medal !== 'object') return 'custom'
  const reqs = Array.isArray(medal.requirements) ? medal.requirements : []
  const hasGoldSeries = reqs.some(r => (r?.type || '').toLowerCase() === 'gold_series')
  const hasQualification = reqs.some(r => String(r?.type || '').toLowerCase().includes('qualification'))
  const teamFlag = Boolean(medal.team_medal) || /team/i.test(medal.type || '')
  const eventFlag = Boolean(medal.event_only) || /event/i.test(medal.type || '')

  if (hasGoldSeries) return 'competition'
  if (hasQualification) return 'qualification'
  if (teamFlag) return 'team_event'
  if (eventFlag) return 'event'
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
 * Adds points for gold_series.
 */
export function mapFormToAchievement({ medal, medalType, formData }) {
  const date = ensureISODate(formData?.date)
  const year = Number(String(date).slice(0, 4))
  const weaponGroup = formData?.weaponGroup || 'A'

  // Decide internal storage type
  let storageType = 'custom'
  if (medalType === 'competition') {
    const hasGoldSeries = Array.isArray(medal?.requirements) && medal.requirements.some(r => (r?.type || '').toLowerCase() === 'gold_series')
    storageType = hasGoldSeries ? 'gold_series' : 'competition_result'
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
    case 'gold_series':
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
        medalType: medal?.tier || '', // bronze/silver/gold if applicable
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
