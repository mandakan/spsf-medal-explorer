/**
 * Release notes content (newest first).
 * Keep this concise; link to full release notes for details.
 */
export const releases = [
  {
    id: '0.9.3',
    date: '2026-01-02',
    title: 'Regelhänvisning',
    highlights: [
      'Hänvisa till regelbok version 20 tillsvidare',
    ],
    link: 'https://github.com/mandakan/spsf-medal-explorer/releases/tag/v0.9.2',
  },
  {
    id: '0.9.2',
    date: '2026-01-01',
    title: 'Versionsnytt',
    highlights: [
      'Versionsinformation med förändringslogg tillagd.',
    ],
    link: 'https://github.com/mandakan/spsf-medal-explorer/releases/tag/v0.9.2',
  },
  {
    id: '0.9.1',
    date: '2025-12-31',
    title: 'Uppdateringar av märken för luftpistol',
    highlights: [
      'Årsmärken för luftpistol korrigerade.',
    ],
    link: 'https://github.com/mandakan/spsf-medal-explorer/releases/tag/v0.9.1',
  },
  {
    id: '0.9.0',
    date: '2025-12-31',
    title: 'Ny trädvy',
    highlights: [
      'Ny trädvy för märken med tidslinje per märkestyp.',
    ],
    link: 'https://github.com/mandakan/spsf-medal-explorer/releases/tag/v0.9.0',
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
