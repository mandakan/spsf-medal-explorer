
const { validatePrerequisites, summarizeDataSet } = require('../medalDatabase')
const medalsData = require('../../data/medals.json')

describe('medalDatabase utils', () => {
  test('summarizeDataSet reports counts', () => {
    const summary = summarizeDataSet(medalsData)
    expect(summary.total).toBeGreaterThan(0)
    expect(summary.duplicates).toBe(0)
    expect(typeof summary.types).toBe('object')
  })

  test('validatePrerequisites passes for base dataset', () => {
    const result = validatePrerequisites(medalsData)
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })
})
