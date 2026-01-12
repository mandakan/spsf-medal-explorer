#!/usr/bin/env node
/**
 * Script to clean up precision series ageCategories
 * Removes timeSeconds and hitsRequired properties that don't belong in precision series
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function cleanAgeCategories(obj) {
  if (obj === null || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(cleanAgeCategories)
  }

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    // If this is an ageCategories array inside a precision_series requirement
    if (key === 'ageCategories' && Array.isArray(value)) {
      result[key] = value.map(cat => {
        const cleaned = { ...cat }
        // Remove timeSeconds and hitsRequired from precision series age categories
        // These only belong in application_series requirements
        if ('timeSeconds' in cleaned) {
          delete cleaned.timeSeconds
          console.log(`  Removed timeSeconds from age category: ${cat.name || 'unnamed'}`)
        }
        if ('hitsRequired' in cleaned) {
          delete cleaned.hitsRequired
          console.log(`  Removed hitsRequired from age category: ${cat.name || 'unnamed'}`)
        }
        return cleaned
      })
    } else {
      result[key] = cleanAgeCategories(value)
    }
  }
  return result
}

function main() {
  const inputPath = join(__dirname, '../src/data/pistol_mark.medals.json')

  console.log('Reading pistol_mark.medals.json...')
  const data = JSON.parse(readFileSync(inputPath, 'utf-8'))

  console.log('Cleaning up ageCategories...')
  const cleaned = cleanAgeCategories(data)

  console.log('Writing cleaned file...')
  writeFileSync(inputPath, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8')

  console.log('Done!')
}

main()
