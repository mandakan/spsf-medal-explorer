import { parseJSON, parseCSV, validateData, detectDuplicates, resolveConflicts } from '../../utils/importManager'

describe('importManager', () => {
  test('parseJSON parses JSON string into achievements container', () => {
    const json = JSON.stringify({
      achievements: [
        { id: '1', type: 'competition', date: '2025-01-01', medalId: 'm1' },
      ],
    })
    const parsed = parseJSON(json)
    expect(Array.isArray(parsed.achievements)).toBe(true)
    expect(parsed.achievements.length).toBe(1)
  })

  test('parseCSV parses CSV content into achievements', () => {
    const csv = [
      'Medal,Type,Date,Score,Position,Weapon,Team,Notes,Status',
      'medal-1,competition,2025-12-15,95,,,,"Championship",unlocked',
      'medal-2,gold_series,2025-12-01,42,,,,,',
    ].join('\n')
    const parsed = parseCSV(csv)
    expect(parsed.achievements.length).toBe(2)
    expect(parsed.achievements[0].medalId).toBe('medal-1')
  })

  test('validateData returns invalid for missing fields', () => {
    const list = [
      { type: 'competition', medalId: 'm1', date: '2025-01-01' }, // ok generic
      { type: 'gold_series', medalId: 'm2' }, // missing fields
    ]
    const res = validateData(list)
    expect(res.valid.length + res.invalid.length).toBe(2)
    expect(Object.keys(res.errorsByIndex).length).toBeGreaterThan(0)
  })

  test('detectDuplicates finds duplicates by composite key fallback', () => {
    const list = [
      { type: 'competition', medalId: 'm1', date: '2025-01-01', points: 10 },
      { type: 'competition', medalId: 'm1', date: '2025-01-01', points: 10 },
      { type: 'competition', medalId: 'm2', date: '2025-01-01', points: 10 },
    ]
    const dups = detectDuplicates(list)
    expect(dups.length).toBe(1)
  })

  test('resolveConflicts merges without duplicates', () => {
    const existing = [{ id: '1', type: 'competition', date: '2025-01-01', medalId: 'm1' }]
    const incoming = [{ id: '1', type: 'competition', date: '2025-01-01', medalId: 'm1' }, { id: '2', type: 'competition', date: '2025-02-01', medalId: 'm2' }]
    const merged = resolveConflicts(existing, incoming)
    expect(merged.length).toBe(2)
  })
})
