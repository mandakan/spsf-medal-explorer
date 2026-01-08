/**
 * Tests for multi-file medal data structure validation
 * Note: In Jest, the legacy medals.json is used. Multi-file loading is tested in the browser.
 */
import { loadBestAvailableData } from '../src/utils/medalDatabase'

describe('Medal data structure', () => {
  test('no medals are duplicated', async () => {
    const data = await loadBestAvailableData()

    const ids = data.medals.map(m => m.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  test('all 10 medal types are represented', async () => {
    const data = await loadBestAvailableData()
    const types = new Set(data.medals.map(m => m.type))

    expect(types.size).toBe(10)
    expect(types).toContain('pistol_mark')
    expect(types).toContain('air_pistol_mark')
    expect(types).toContain('field_mark')
    expect(types).toContain('running_mark')
    expect(types).toContain('skis_mark')
    expect(types).toContain('elite_mark')
    expect(types).toContain('championship_mark')
    expect(types).toContain('military_fast_match_mark')
    expect(types).toContain('national_full_match_mark')
    expect(types).toContain('precision_mark')
  })

  test('total medal count is 92', async () => {
    const data = await loadBestAvailableData()
    expect(data.medals.length).toBe(92)
  })

  test('medal type counts are correct', async () => {
    const data = await loadBestAvailableData()
    const typeCounts = {}

    for (const medal of data.medals) {
      if (!typeCounts[medal.type]) {
        typeCounts[medal.type] = 0
      }
      typeCounts[medal.type]++
    }

    expect(typeCounts.pistol_mark).toBe(20)
    expect(typeCounts.air_pistol_mark).toBe(11)
    expect(typeCounts.field_mark).toBe(10)
    expect(typeCounts.running_mark).toBe(10)
    expect(typeCounts.skis_mark).toBe(10)
    expect(typeCounts.elite_mark).toBe(7)
    expect(typeCounts.championship_mark).toBe(6)
    expect(typeCounts.military_fast_match_mark).toBe(6)
    expect(typeCounts.national_full_match_mark).toBe(6)
    expect(typeCounts.precision_mark).toBe(6)
  })

  test('all medals have required fields', async () => {
    const data = await loadBestAvailableData()

    for (const medal of data.medals) {
      expect(medal).toHaveProperty('id')
      expect(medal).toHaveProperty('type')
      expect(medal).toHaveProperty('tier')
      expect(medal).toHaveProperty('name')
      expect(medal).toHaveProperty('displayName')
      expect(medal.id).toBeTruthy()
      expect(medal.type).toBeTruthy()
      expect(medal.tier).toBeTruthy()
    }
  })
})
