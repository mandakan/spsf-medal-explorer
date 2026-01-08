import { validatePrerequisites, loadBestAvailableData } from '../src/utils/medalDatabase'

describe('medalDatabase utils', () => {
  describe('multi-file loading', () => {
    test('loads and merges all medal files', async () => {
      const data = await loadBestAvailableData()
      expect(data.medals).toBeDefined()
      expect(Array.isArray(data.medals)).toBe(true)
      expect(data.medals.length).toBe(92)
      expect(data.version).toBe('1.0')
    })

    test('merges medals from all types', async () => {
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

    test('validates prerequisites across files', async () => {
      const data = await loadBestAvailableData()
      const result = validatePrerequisites(data)
      expect(result.ok).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('detects no duplicate medal IDs across files', async () => {
      const data = await loadBestAvailableData()
      const ids = data.medals.map(m => m.id)
      const unique = new Set(ids)
      expect(unique.size).toBe(ids.length)
    })
  })

  describe('validatePrerequisites', () => {
    test('passes for complete dataset', async () => {
      const data = await loadBestAvailableData()
      const result = validatePrerequisites(data)
      expect(result.ok).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('detects missing prerequisite references', () => {
      const invalidData = {
        medals: [
          {
            id: 'test-medal',
            prerequisites: [
              { type: 'medal', medalId: 'missing-medal' }
            ]
          }
        ]
      }
      const result = validatePrerequisites(invalidData)
      expect(result.ok).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('missing-medal')
    })
  })
})
