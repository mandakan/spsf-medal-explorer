/**
 * Vite-specific medal data loader using import.meta.glob
 * This file is only imported in browser/Vite environment, not in Jest
 */

// Re-export mergeAndValidateMedalFiles from medalDatabase for use in Vite
export { mergeAndValidateMedalFiles } from './medalDatabase.js'

/**
 * Dynamically load all *.medals.json files using Vite's import.meta.glob
 */
export async function loadAllMedalFiles() {
  const medalModules = import.meta.glob('../data/*.medals.json')

  if (Object.keys(medalModules).length === 0) {
    throw new Error('No medal files found matching pattern *.medals.json')
  }

  const files = []
  const errors = []

  for (const [path, importFn] of Object.entries(medalModules)) {
    try {
      const module = await importFn()
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

  return files
}
