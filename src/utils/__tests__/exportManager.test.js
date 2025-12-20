import { toJSON, toCSV, toPDF, toQRCode } from '../../utils/exportManager'

describe('exportManager', () => {
  const profile = {
    userId: 'user-123',
    displayName: 'John Doe',
    createdDate: '2025-01-01T00:00:00Z',
    achievements: [
      { id: 'a1', medalId: 'medal-1', type: 'competition', date: '2025-12-15', points: 95, notes: 'Championship' },
      { id: 'a2', medalId: 'medal-2', type: 'gold_series', date: '2025-12-01', points: 42 },
    ],
    unlockedMedals: [
      { medalId: 'medal-1', unlockedDate: '2025-12-16', year: 2025 },
    ],
  }

  test('toJSON returns valid JSON with version and profile', async () => {
    const json = await toJSON(profile)
    const obj = JSON.parse(json)
    expect(obj.version).toBeDefined()
    expect(obj.profile).toBeDefined()
    expect(Array.isArray(obj.achievements)).toBe(true)
  })

  test('toCSV returns CSV with header and rows', async () => {
    const csv = await toCSV(profile.achievements)
    const lines = csv.split('\n')
    expect(lines[0]).toMatch(/Medal,Type,Date,Score,Position,Weapon,Team,Notes,Status/i)
    expect(lines.length).toBeGreaterThan(1)
  })

  test('toPDF returns bytes (Uint8Array or ArrayBuffer)', async () => {
    const pdfBytes = await toPDF(profile)
    // Accept ArrayBuffer or Uint8Array or string starting with %PDF
    if (typeof pdfBytes === 'string') {
      expect(pdfBytes.startsWith('%PDF')).toBe(true)
    } else if (pdfBytes instanceof ArrayBuffer) {
      expect(pdfBytes.byteLength).toBeGreaterThan(0)
    } else {
      // Uint8Array
      expect(pdfBytes).toBeInstanceOf(Uint8Array)
      expect(pdfBytes.length).toBeGreaterThan(0)
    }
  })

  test('toQRCode returns data URL', async () => {
    const dataUrl = await toQRCode({ test: true })
    expect(typeof dataUrl).toBe('string')
    expect(dataUrl.startsWith('data:')).toBe(true)
  })
})
