#!/usr/bin/env node
/**
 * Script to verify that base pointThresholds match under_55 age category
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(__dirname, '../src/data/pistol_mark.medals.json'), 'utf-8'))

function findPrecisionSeries(obj, path = '', results = []) {
  if (!obj || typeof obj !== 'object') return results

  if (obj.type === 'precision_series' && obj.pointThresholds && obj.ageCategories) {
    const base = obj.pointThresholds
    const under55 = obj.ageCategories.find(c => c.name === 'under_55')

    if (under55) {
      const baseVals = `A=${base.A?.min ?? 'N/A'} B=${base.B?.min ?? 'N/A'} C=${base.C?.min ?? 'N/A'}`
      const u55Vals = `A=${under55.pointThresholds?.A?.min ?? 'N/A'} B=${under55.pointThresholds?.B?.min ?? 'N/A'} C=${under55.pointThresholds?.C?.min ?? 'N/A'}`
      const match = JSON.stringify(base) === JSON.stringify(under55.pointThresholds)
      results.push({ path, baseVals, u55Vals, match })
    }
  }

  for (const [key, val] of Object.entries(obj)) {
    if (Array.isArray(val)) {
      val.forEach((item, i) => findPrecisionSeries(item, `${path}.${key}[${i}]`, results))
    } else if (typeof val === 'object') {
      findPrecisionSeries(val, `${path}.${key}`, results)
    }
  }
  return results
}

let hasIssues = false

data.medals.forEach(medal => {
  console.log(`\n=== ${medal.displayName} ===`)
  const results = findPrecisionSeries(medal.requirements, 'requirements')
  results.forEach(r => {
    const status = r.match ? '✓' : '✗ MISMATCH'
    console.log(`  Base: ${r.baseVals} | under_55: ${r.u55Vals} ${status}`)
    if (!r.match) hasIssues = true
  })
  if (results.length === 0) {
    console.log('  (no precision_series with ageCategories found)')
  }
})

console.log('\n' + (hasIssues ? '❌ Issues found - base thresholds do not match under_55' : '✅ All base thresholds match under_55'))
process.exit(hasIssues ? 1 : 0)
