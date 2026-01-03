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

export function achievementsToCSV(achievements = [], schemaVersion = '1') {
  const header = HEADERS.join(',')
  const rows = (achievements || []).map(a =>
    HEADERS.map(h => (h === 'schema_version' ? schemaVersion : (a?.[h] ?? '')))
      .map(escapeCsvCell)
      .join(',')
  )
  return [header, ...rows].join('\n')
}

export function exportCsvTemplate(schemaVersion = '1') {
  const header = HEADERS.join(',')
  const example = [
    '',                 // id (leave empty for new)
    'precision_series', // type
    '2024',             // year
    'A',                // weaponGroup
    '45',               // points
    '2024-05-20',       // date
    '',                 // timeSeconds
    '',                 // hits
    '',                 // competitionName
    '',                 // competitionType
    '',                 // disciplineType
    '',                 // ppcClass
    '',                 // weapon
    '',                 // score
    '',                 // teamName
    '',                 // position
    '',                 // eventName
    'Exempelrad',       // notes
    schemaVersion,      // schema_version
  ].map(escapeCsvCell).join(',')
  return [header, example].join('\n')
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
