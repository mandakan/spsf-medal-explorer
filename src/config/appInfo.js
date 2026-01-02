/**
 * Central app info and versioning.
 */
export const APP_INFO = {
  APP_NAME: 'Skyttemärken',
  AUTHOR_NAME: 'Mathias A',
  LICENSE: 'MIT',
  // Map of year -> Skytteboken upplaga
  RULEBOOK_VERSIONS: { 2024: 20 },
}

/**
 * Get the rulebook version in effect for a given year.
 * Uses the latest defined version at or before the given year.
 */
export function getRulebookVersionForYear(year) {
  const entries = Object.entries(APP_INFO.RULEBOOK_VERSIONS)
    .map(([y, v]) => [Number(y), v])
    .sort((a, b) => a[0] - b[0])

  let version = entries[0]?.[1] ?? null
  for (const [y, v] of entries) {
    if (year >= y) version = v
  }
  return version
}

export const CURRENT_RULEBOOK_VERSION = getRulebookVersionForYear(new Date().getFullYear())
