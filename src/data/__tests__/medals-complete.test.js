
const medalsData = require('../../data/medals.json')

describe('Medals base dataset integrity', () => {
  test('has version and non-empty medals array', () => {
    expect(typeof medalsData.version).toBe('string')
    expect(Array.isArray(medalsData.medals)).toBe(true)
    expect(medalsData.medals.length).toBeGreaterThan(0)
  })

  test('no duplicate medal ids', () => {
    const ids = medalsData.medals.map(m => m.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  test('prerequisite medal references exist', () => {
    const index = new Set(medalsData.medals.map(m => m.id))
    const missing = []
    for (const m of medalsData.medals) {
      const prereqs = m.prerequisites || []
      for (const p of prereqs) {
        if (p.type === 'medal' && !index.has(p.medalId)) {
          missing.push({ medal: m.id, prereq: p.medalId })
        }
      }
    }
    expect(missing).toHaveLength(0)
  })
})
