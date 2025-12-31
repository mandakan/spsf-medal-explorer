/**
 * Release notes content (newest first).
 * Keep this concise; link to full release notes for details.
 */
export const releases = [
  {
    id: '1.5.0',
    date: '2025-01-01',
    title: 'Snabbare sökning och ny medaljvy',
    highlights: [
      'Ny vy för medaljer med förbättrad filtrering.',
      'Sökningen är upp till 3× snabbare.',
      'Tillgänglighetsförbättringar och buggrättningar.',
    ],
    link: 'https://example.com/releases/v1.5.0',
  },
  {
    id: '1.4.0',
    date: '2024-12-10',
    title: 'Feature-flaggor och förbättrad UX',
    highlights: [
      'Nya feature-flaggor för förhandsvisning.',
      'Förbättrad tangentbordsnavigering och fokusmarkering.',
      'Stabilitetsförbättringar.',
    ],
    link: 'https://example.com/releases/v1.4.0',
  },
]

/**
 * Returns releases since lastSeen (exclusive), newest first.
 * If lastSeen isn't found or missing, returns all releases.
 */
export function getReleasesSince(lastSeen) {
  // Ensure newest-first by semantic version regardless of authoring order
  const ordered = [...releases].sort((a, b) => {
    const pa = String(a.id).split('.').map(n => parseInt(n, 10) || 0)
    const pb = String(b.id).split('.').map(n => parseInt(n, 10) || 0)
    for (let i = 0; i < 3; i++) {
      if (pa[i] !== pb[i]) return pb[i] - pa[i]
    }
    return 0
  })
  if (!lastSeen) return ordered
  const idx = ordered.findIndex(r => r.id === lastSeen)
  return idx <= 0 ? ordered : ordered.slice(0, idx)
}
