/**
 * Backup validation utilities
 * Returns validation status and warnings for backup imports
 */

/**
 * Validate backup data and return status with warnings
 * @param {object} backup - Parsed backup object
 * @returns {{status: 'valid'|'warning'|'error', warnings: string[], canImport: boolean}}
 */
export function validateBackup(backup) {
  const warnings = []

  // Critical validation - cannot import
  if (!backup || typeof backup !== 'object') {
    return { status: 'error', warnings: ['Ogiltig fil'], canImport: false }
  }

  if (backup.kind !== 'profile-backup') {
    return { status: 'error', warnings: ['Inte en giltig säkerhetskopia'], canImport: false }
  }

  if (!backup.profile || typeof backup.profile !== 'object') {
    return { status: 'error', warnings: ['Profil saknas i säkerhetskopian'], canImport: false }
  }

  // Non-critical validation - can still import with warnings
  if (!backup.exportedAt) {
    warnings.push('Datum för säkerhetskopia saknas')
  }

  if (!backup.version) {
    warnings.push('Formatversion saknas')
  }

  if (backup.version && backup.version !== '1.0') {
    warnings.push(`Okänd formatversion: ${backup.version}`)
  }

  if (!backup.profile.displayName) {
    warnings.push('Profilnamn saknas')
  }

  if (!backup.profile.sex) {
    warnings.push('Kön saknas i profilen')
  }

  const hasAchievements =
    (backup.profile.prerequisites && backup.profile.prerequisites.length > 0) ||
    (backup.profile.unlockedMedals && backup.profile.unlockedMedals.length > 0)

  if (!hasAchievements) {
    warnings.push('Profilen har inga upplåsta märken eller aktiviteter än')
  }

  // Return status based on warnings
  if (warnings.length === 0) {
    return { status: 'valid', warnings: [], canImport: true }
  }

  return { status: 'warning', warnings, canImport: true }
}

/**
 * Quick validation check for real-time feedback
 * @param {string} text - JSON text to validate
 * @returns {{status: 'valid'|'warning'|'error', message: string}}
 */
export function quickValidate(text) {
  if (!text || !text.trim()) {
    return { status: 'error', message: 'Ingen data angiven' }
  }

  try {
    const parsed = JSON.parse(text)

    if (!parsed || typeof parsed !== 'object') {
      return { status: 'error', message: 'Ogiltig JSON-struktur' }
    }

    if (parsed.kind !== 'profile-backup') {
      return { status: 'error', message: 'Inte en säkerhetskopia' }
    }

    if (!parsed.profile) {
      return { status: 'error', message: 'Profil saknas' }
    }

    // Check for warnings
    const hasWarnings = !parsed.exportedAt || !parsed.version || !parsed.profile.displayName

    if (hasWarnings) {
      return { status: 'warning', message: 'Säkerhetskopia kan importeras med varningar' }
    }

    return { status: 'valid', message: 'Giltig säkerhetskopia' }
  } catch {
    return { status: 'error', message: 'Ogiltig JSON' }
  }
}
