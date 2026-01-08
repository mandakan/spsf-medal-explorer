import { validatePrerequisites, loadBestAvailableData, mergeAndValidateMedalFiles } from '../src/utils/medalDatabase'

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

  describe('mergeAndValidateMedalFiles', () => {
    test('rejects medals with wrong type in file', () => {
      const invalidFiles = [{
        path: 'test.medals.json',
        data: {
          type: 'pistol_mark',
          medals: [{ id: 'test', type: 'air_pistol_mark' }] // Wrong type!
        }
      }]

      expect(() => mergeAndValidateMedalFiles(invalidFiles)).toThrow(/has type/)
      expect(() => mergeAndValidateMedalFiles(invalidFiles)).toThrow(/air_pistol_mark/)
    })

    test('rejects files missing type field', () => {
      const invalidFiles = [{
        path: 'test.medals.json',
        data: {
          medals: [{ id: 'test', type: 'pistol_mark' }]
          // Missing 'type' field
        }
      }]

      expect(() => mergeAndValidateMedalFiles(invalidFiles)).toThrow(/missing 'type'/)
    })

    test('rejects files missing medals array', () => {
      const invalidFiles = [{
        path: 'test.medals.json',
        data: {
          type: 'pistol_mark'
          // Missing 'medals' array
        }
      }]

      expect(() => mergeAndValidateMedalFiles(invalidFiles)).toThrow(/missing 'type' or 'medals' array/)
    })

    test('rejects duplicate medal types across files', () => {
      const invalidFiles = [
        {
          path: 'pistol_mark_1.medals.json',
          data: {
            type: 'pistol_mark',
            medals: [{ id: 'test-1', type: 'pistol_mark' }]
          }
        },
        {
          path: 'pistol_mark_2.medals.json',
          data: {
            type: 'pistol_mark', // Duplicate type!
            medals: [{ id: 'test-2', type: 'pistol_mark' }]
          }
        }
      ]

      expect(() => mergeAndValidateMedalFiles(invalidFiles)).toThrow(/Duplicate medal type/)
    })

    test('successfully merges valid files', () => {
      const validFiles = [
        {
          path: 'pistol_mark.medals.json',
          data: {
            type: 'pistol_mark',
            medals: [
              { id: 'pistol-bronze', type: 'pistol_mark' },
              { id: 'pistol-silver', type: 'pistol_mark' }
            ]
          }
        },
        {
          path: 'elite_mark.medals.json',
          data: {
            type: 'elite_mark',
            medals: [
              { id: 'elite-bronze', type: 'elite_mark' }
            ]
          }
        }
      ]

      const result = mergeAndValidateMedalFiles(validFiles)
      expect(result.version).toBe('1.0')
      expect(result.medals.length).toBe(3)
      expect(result.medals.map(m => m.id)).toEqual(['pistol-bronze', 'pistol-silver', 'elite-bronze'])
    })
  })
})
