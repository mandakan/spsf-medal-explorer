/**
 * Helper functions for exporting/importing profile backups (single JSON format)
 * Works with any DataManager-compatible implementation that supports restoreProfile
 */

import { toProfileBackup } from '../utils/exportManager'
import { parseProfileBackup } from '../utils/importManager'

/**
 * Export a user's profile as a profile-backup JSON string
 * @param {import('../data/dataManager').DataManager} dataManager
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function exportProfileBackupToJson(dataManager, userId) {
  const profile = await dataManager.getUserProfile(userId)
  if (!profile) throw new Error('Profile not found')
  return toProfileBackup(profile, { version: '1.0' })
}

/**
 * Import a profile-backup JSON string via the provided data manager
 * Returns the saved/restored profile
 * @param {import('../data/dataManager').DataManager} dataManager
 * @param {string|object} jsonString
 * @param {{strategy?: 'new-id'|'overwrite'}} options
 */
export async function importProfileBackupFromJson(dataManager, jsonString, { strategy = 'new-id' } = {}) {
  const parsed = parseProfileBackup(jsonString)
  return dataManager.restoreProfile(parsed.profile, { strategy })
}
