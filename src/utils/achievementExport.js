function escapeCsvCell(val) {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function achievementsToCSV(achievements = []) {
  const headers = [
    'ID',
    'Type',
    'Year',
    'Weapon Group',
    'Points',
    'Date',
    'Competition Name',
    'Medal Type',
    'Discipline Type',
    'Notes'
  ]
  const rows = achievements.map(a => ([
    a.id,
    a.type,
    a.year,
    a.weaponGroup,
    a.points,
    a.date || a.competitionDate || '',
    a.competitionName || '',
    a.medalType || '',
    a.disciplineType || '',
    a.notes || ''
  ].map(escapeCsvCell).join(',')))

  const csv = [headers.join(','), ...rows].join('\n')
  return csv
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
