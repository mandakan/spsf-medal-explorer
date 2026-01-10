import { getAchievementTypeLabel } from './labels'

/**
 * Get achievements that contributed to unlocking a medal
 * Uses stored IDs if available
 * @param {Object} options
 * @param {Object} options.unlockedEntry - Entry from profile.unlockedMedals
 * @param {Object} options.profile - User profile
 * @returns {Array} Array of achievement objects
 */
export function getReceiptAchievements({ unlockedEntry, profile }) {
  if (!unlockedEntry?.achievementIds?.length) return []
  if (!profile?.prerequisites?.length) return []

  const idSet = new Set(unlockedEntry.achievementIds)
  return profile.prerequisites.filter(a => a.id && idSet.has(a.id))
}

/**
 * Format a date string for display (Swedish format: YYYY-MM-DD)
 * @param {string} dateStr - ISO date string
 * @returns {string|null} Formatted date or null
 */
function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString().slice(0, 10)
  } catch {
    return null
  }
}

/**
 * Format a single achievement for display
 * @param {Object} achievement - Achievement object
 * @returns {Object} Formatted achievement with label and details
 */
export function formatAchievementForDisplay(achievement) {
  const label = getAchievementTypeLabel(achievement.type)
  const details = []

  // Date (prefer full date, fall back to year)
  const formattedDate = formatDate(achievement.date)
  if (formattedDate) {
    details.push(formattedDate)
  } else if (achievement.year) {
    details.push(String(achievement.year))
  }

  // Weapon group
  if (achievement.weaponGroup) {
    details.push(`Grupp ${achievement.weaponGroup}`)
  }

  // Type-specific details
  switch (achievement.type) {
    case 'precision_series':
    case 'speed_shooting_series':
    case 'air_pistol_precision':
      if (typeof achievement.points === 'number') {
        details.push(`${achievement.points} p`)
      }
      break
    case 'application_series':
      if (typeof achievement.hits === 'number') {
        details.push(`${achievement.hits} tr`)
      }
      if (typeof achievement.timeSeconds === 'number') {
        details.push(`${achievement.timeSeconds} s`)
      }
      break
    case 'running_shooting_course':
      if (typeof achievement.points === 'number') {
        details.push(`${achievement.points} p`)
      }
      break
    case 'competition_result':
    case 'cumulative_competition_score':
      if (typeof achievement.score === 'number') {
        details.push(`${achievement.score} p`)
      }
      if (achievement.competitionName) {
        details.push(achievement.competitionName)
      }
      break
    case 'competition_performance':
      if (typeof achievement.scorePercent === 'number') {
        details.push(`${achievement.scorePercent}%`)
      } else if (typeof achievement.points === 'number') {
        details.push(`${achievement.points} p`)
      }
      break
    case 'shooting_round':
      if (typeof achievement.totalPoints === 'number') {
        details.push(`${achievement.totalPoints} p`)
      }
      break
    case 'standard_medal':
      if (achievement.disciplineType) {
        details.push(achievement.disciplineType)
      }
      if (achievement.medalType) {
        const tierLabels = { bronze: 'Brons', silver: 'Silver', gold: 'Guld' }
        details.push(tierLabels[achievement.medalType] || achievement.medalType)
      }
      break
    default:
      break
  }

  return {
    id: achievement.id,
    type: achievement.type,
    label,
    details: details.join(' - '),
    date: formattedDate || (achievement.year ? String(achievement.year) : null),
    year: achievement.year,
  }
}

/**
 * Generate formatted text receipt for clipboard
 * @param {Object} options
 * @param {Object} options.medal - Medal object
 * @param {Array} options.achievements - Array of achievement objects
 * @param {string} options.unlockedDate - ISO date string
 * @param {string} options.profileName - User's display name
 * @returns {string} Formatted receipt text
 */
export function generateReceiptText({ medal, achievements, unlockedDate, profileName }) {
  const lines = []

  lines.push('KVALIFICERINGSKVITTO')
  lines.push('====================')
  lines.push(`Marke: ${medal?.displayName || medal?.name || 'Okant'}`)

  if (unlockedDate) {
    const year = new Date(unlockedDate).getFullYear()
    lines.push(`Upplast: ${year}`)
  }

  if (profileName) {
    lines.push(`Profil: ${profileName}`)
  }

  lines.push('')
  lines.push('KVALIFICERANDE AKTIVITETER:')
  lines.push('---------------------------')

  if (achievements.length === 0) {
    lines.push('(Inga aktiviteter registrerade)')
  } else {
    achievements.forEach((ach, i) => {
      const formatted = formatAchievementForDisplay(ach)
      lines.push(`${i + 1}. ${formatted.label}`)
      if (formatted.details) {
        lines.push(`   ${formatted.details}`)
      }
      lines.push('')
    })
  }

  lines.push('---------------------------')
  lines.push('Genererat av SPSF Medal Explorer')

  return lines.join('\n')
}
