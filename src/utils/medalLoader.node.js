/**
 * Node/Jest-compatible medal data loader
 * Uses require() instead of import.meta.glob since Jest doesn't support it
 */

import { mergeAndValidateMedalFiles } from './medalDatabase.js'

// List of all medal type files
// Note: This list must be manually updated if new medal types are added
const MEDAL_TYPE_FILES = [
  'pistol_mark',
  'air_pistol_mark',
  'field_mark',
  'running_mark',
  'skis_mark',
  'elite_mark',
  'championship_mark',
  'military_fast_match_mark',
  'national_full_match_mark',
  'precision_mark'
]

/**
 * Load all *.medals.json files using dynamic imports (works in Node/Jest)
 */
export async function loadAllMedalFilesNode() {
  const files = []
  const errors = []

  for (const type of MEDAL_TYPE_FILES) {
    const path = `../data/${type}.medals.json`
    try {
      const module = await import(path)
      const data = module.default || module
      files.push({ path, data })
    } catch (error) {
      errors.push({ path, error: error.message })
    }
  }

  if (errors.length > 0) {
    const errorList = errors.map(e => `  - ${e.path}: ${e.error}`).join('\n')
    throw new Error(`Failed to load medal files:\n${errorList}`)
  }

  if (files.length === 0) {
    throw new Error('No medal files were loaded')
  }

  return files
}

/**
 * Load and merge all medal files for Node/Jest environment
 */
export async function loadMedalDataNode() {
  const files = await loadAllMedalFilesNode()
  return mergeAndValidateMedalFiles(files)
}
