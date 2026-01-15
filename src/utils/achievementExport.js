import { ACHIEVEMENT_TYPES, getAchievementTypeLabel } from './labels'

function escapeCsvCell(val) {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const HEADERS = [
  'id',
  'type',
  'year',
  'weaponGroup',
  'points',
  'date',
  'timeSeconds',
  'hits',
  'competitionName',
  'competitionType',
  'disciplineType',
  'ppcClass',
  'weapon',
  'score',
  'teamName',
  'position',
  'eventName',
  'notes',
  'schema_version',
]

/**
 * Generate example data for a specific achievement type.
 * Returns an object with field values appropriate for the type.
 * @param {string} type - Achievement type
 * @returns {object} Example achievement data
 */
export function generateExampleForType(type) {
  const base = {
    id: '',
    type,
    year: '2024',
    weaponGroup: 'A',
    points: '',
    date: '',
    timeSeconds: '',
    hits: '',
    competitionName: '',
    competitionType: '',
    disciplineType: '',
    ppcClass: '',
    weapon: '',
    score: '',
    teamName: '',
    position: '',
    eventName: '',
    notes: getAchievementTypeLabel(type),
  }

  switch (type) {
    case 'precision_series':
      return { ...base, points: '45' }

    case 'application_series':
      return { ...base, timeSeconds: '25', hits: '5' }

    case 'competition_result':
      return {
        ...base,
        date: '2024-05-20',
        score: '285',
        disciplineType: 'precision',
        competitionType: 'krets',
        competitionName: 'Kretsmästerskap',
      }

    case 'qualification_result':
      return {
        ...base,
        date: '2024-06-15',
        score: '270',
        disciplineType: 'national_whole_match',
      }

    case 'team_event':
      return {
        ...base,
        date: '2024-08-10',
        teamName: 'Lag A',
        eventName: 'Lagtävling',
        position: '2',
      }

    case 'event':
      return {
        ...base,
        date: '2024-09-01',
        eventName: 'Skytte-event',
      }

    case 'custom':
      return {
        ...base,
        notes: 'Egen aktivitet',
      }

    case 'special_achievement':
      return {
        ...base,
        date: '2024-07-20',
        notes: 'Specialprestation - beskrivning',
      }

    case 'standard_medal':
      return {
        ...base,
        disciplineType: 'precision',
        notes: 'Standardmedalj brons',
      }

    case 'running_shooting_course':
      return {
        ...base,
        date: '2024-04-15',
        points: '85',
      }

    case 'shooting_round':
      return {
        ...base,
        points: '42',
      }

    case 'speed_shooting_series':
      return {
        ...base,
        points: '48',
      }

    case 'competition_performance':
      return {
        ...base,
        date: '2024-10-05',
        disciplineType: 'field',
        score: '85',
        competitionName: 'Fälttävling',
      }

    case 'air_pistol_precision':
      return {
        ...base,
        weaponGroup: 'C',
        points: '92',
      }

    case 'cumulative_competition_score':
      return {
        ...base,
        score: '1250',
        competitionName: 'Säsong 2024',
      }

    default:
      return base
  }
}

export function achievementsToCSV(achievements = [], schemaVersion = '1') {
  const header = HEADERS.join(',')
  const rows = (achievements || []).map(a =>
    HEADERS.map(h => (h === 'schema_version' ? schemaVersion : (a?.[h] ?? '')))
      .map(escapeCsvCell)
      .join(',')
  )
  return [header, ...rows].join('\n')
}

/**
 * Generate a CSV template with one example row for each achievement type.
 * @param {string} schemaVersion - Schema version to include
 * @returns {string} CSV string with header and example rows
 */
export function exportCsvTemplate(schemaVersion = '1') {
  const header = HEADERS.join(',')
  const exampleRows = ACHIEVEMENT_TYPES.map(type => {
    const example = generateExampleForType(type)
    return HEADERS.map(h => (h === 'schema_version' ? schemaVersion : (example[h] ?? '')))
      .map(escapeCsvCell)
      .join(',')
  })
  return [header, ...exampleRows].join('\n')
}



export function downloadCSV(csvString, filename = 'achievements.csv') {
  if (typeof document === 'undefined') return
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
