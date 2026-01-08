/**
 * Vite-specific medal data loader using import.meta.glob
 * This file is only imported in browser/Vite environment, not in Jest
 */

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

/**
 * Merge multiple medal files into single dataset structure
 */
export function mergeAndValidateMedalFiles(files) {
  const allMedals = []
  const fileTypes = new Set()

  for (const { path, data } of files) {
    // Validate file structure
    if (!data.type || !Array.isArray(data.medals)) {
      throw new Error(`Invalid medal file structure in ${path}: missing 'type' or 'medals' array`)
    }

    // Check for duplicate types
    if (fileTypes.has(data.type)) {
      throw new Error(`Duplicate medal type '${data.type}' found in ${path}`)
    }
    fileTypes.add(data.type)

    // Validate all medals in file have correct type
    for (const medal of data.medals) {
      if (medal.type !== data.type) {
        throw new Error(
          `Medal ${medal.id} in ${path} has type '${medal.type}' but file is for '${data.type}'`
        )
      }
    }

    allMedals.push(...data.medals)
  }

  // Return standard format expected by MedalDatabase
  return {
    version: '1.0',
    medals: allMedals
  }
}
