/**
 * Helper functions for importing/exporting profile data
 * Works with any DataManager-compatible implementation
 */

/**
 * Export a user's data to a formatted JSON string
 * @param {import('../data/dataManager').DataManager} dataManager
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function exportProfileToJson(dataManager, userId) {
  const payload = await dataManager.exportData(userId)
  return JSON.stringify(payload, null, 2)
}

/**
 * Parse a JSON string and return the object
 * Throws with a descriptive message on error
 * @param {string} jsonString
 */
export function parseExportJson(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    return data
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`)
  }
}

/**
 * Basic validation of an export payload
 * @param {object} data
 */
export function validateExportPayload(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Export payload must be an object')
  }
  if (!data.exportVersion) {
    throw new Error('Export payload missing exportVersion')
  }
  if (!data.userProfile) {
    throw new Error('Export payload missing userProfile')
  }
  if (!Array.isArray(data.achievements)) {
    throw new Error('Export payload missing achievements')
  }
  if (!Array.isArray(data.unlockedMedals)) {
    throw new Error('Export payload missing unlockedMedals')
  }
}

/**
 * Import a user's data from a JSON string via the provided data manager
 * Returns the newly saved/created profile
 * @param {import('../data/dataManager').DataManager} dataManager
 * @param {string} jsonString
 */
export async function importProfileFromJson(dataManager, jsonString) {
  return await dataManager.importData(jsonString)
}
