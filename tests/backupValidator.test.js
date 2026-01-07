/**
 * Unit tests for backup validation utilities
 */

import { validateBackup, quickValidate } from '../src/utils/backupValidator'

describe('validateBackup', () => {
  describe('valid backups', () => {
    it('should return valid status for complete backup', () => {
      const backup = {
        kind: 'profile-backup',
        version: '1.0',
        exportedAt: '2026-01-07T00:00:00.000Z',
        profile: {
          userId: 'user-123',
          displayName: 'Test User',
          dateOfBirth: '1990-01-01',
          sex: 'male',
          unlockedMedals: [],
          prerequisites: [],
          features: { allowManualUnlock: false, enforceCurrentYearForSustained: true },
          notifications: true
        }
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('valid')
      expect(result.warnings).toEqual([])
      expect(result.canImport).toBe(true)
    })

    it('should accept backup with achievements', () => {
      const backup = {
        kind: 'profile-backup',
        version: '1.0',
        exportedAt: '2026-01-07T00:00:00.000Z',
        profile: {
          displayName: 'Test',
          sex: 'female',
          unlockedMedals: [{ medalId: 'm1', unlockedDate: '2024-01-01' }],
          prerequisites: [{ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 50 }]
        }
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('valid')
      expect(result.canImport).toBe(true)
    })

    it('should accept fresh profile without achievements', () => {
      const backup = {
        kind: 'profile-backup',
        version: '1.0',
        exportedAt: '2026-01-07T00:00:00.000Z',
        profile: {
          displayName: 'Fresh User',
          sex: 'male',
          unlockedMedals: [],
          prerequisites: []
        }
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('valid')
      expect(result.canImport).toBe(true)
    })
  })

  describe('error cases - cannot import', () => {
    it('should return error for null backup', () => {
      const result = validateBackup(null)
      expect(result.status).toBe('error')
      expect(result.warnings).toContain('Ogiltig fil')
      expect(result.canImport).toBe(false)
    })

    it('should return error for undefined backup', () => {
      const result = validateBackup(undefined)
      expect(result.status).toBe('error')
      expect(result.canImport).toBe(false)
    })

    it('should return error for non-object backup', () => {
      const result = validateBackup('not an object')
      expect(result.status).toBe('error')
      expect(result.canImport).toBe(false)
    })

    it('should return error for invalid kind', () => {
      const backup = {
        kind: 'wrong-type',
        version: '1.0',
        profile: { displayName: 'Test', sex: 'male' }
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('error')
      expect(result.warnings).toContain('Inte en giltig säkerhetskopia')
      expect(result.canImport).toBe(false)
    })

    it('should return error for missing profile', () => {
      const backup = {
        kind: 'profile-backup',
        version: '1.0',
        exportedAt: '2026-01-07T00:00:00.000Z'
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('error')
      expect(result.warnings).toContain('Profil saknas i säkerhetskopian')
      expect(result.canImport).toBe(false)
    })

    it('should return error for non-object profile', () => {
      const backup = {
        kind: 'profile-backup',
        version: '1.0',
        profile: 'not an object'
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('error')
      expect(result.canImport).toBe(false)
    })
  })

  describe('warning cases - can still import', () => {
    it('should warn if exportedAt is missing', () => {
      const backup = {
        kind: 'profile-backup',
        version: '1.0',
        profile: { displayName: 'Test', sex: 'male' }
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('warning')
      expect(result.warnings).toContain('Datum för säkerhetskopia saknas')
      expect(result.canImport).toBe(true)
    })

    it('should warn if version is missing', () => {
      const backup = {
        kind: 'profile-backup',
        exportedAt: '2026-01-07T00:00:00.000Z',
        profile: { displayName: 'Test', sex: 'male' }
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('warning')
      expect(result.warnings).toContain('Formatversion saknas')
      expect(result.canImport).toBe(true)
    })

    it('should warn for unknown version', () => {
      const backup = {
        kind: 'profile-backup',
        version: '2.0',
        exportedAt: '2026-01-07T00:00:00.000Z',
        profile: { displayName: 'Test', sex: 'male' }
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('warning')
      expect(result.warnings).toContain('Okänd formatversion: 2.0')
      expect(result.canImport).toBe(true)
    })

    it('should warn if displayName is missing', () => {
      const backup = {
        kind: 'profile-backup',
        version: '1.0',
        exportedAt: '2026-01-07T00:00:00.000Z',
        profile: { sex: 'male' }
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('warning')
      expect(result.warnings).toContain('Profilnamn saknas')
      expect(result.canImport).toBe(true)
    })

    it('should warn if sex is missing', () => {
      const backup = {
        kind: 'profile-backup',
        version: '1.0',
        exportedAt: '2026-01-07T00:00:00.000Z',
        profile: { displayName: 'Test' }
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('warning')
      expect(result.warnings).toContain('Kön saknas i profilen')
      expect(result.canImport).toBe(true)
    })

    it('should return multiple warnings', () => {
      const backup = {
        kind: 'profile-backup',
        profile: {}
      }
      const result = validateBackup(backup)
      expect(result.status).toBe('warning')
      expect(result.warnings.length).toBeGreaterThan(1)
      expect(result.canImport).toBe(true)
    })
  })
})

describe('quickValidate', () => {
  it('should return error for empty text', () => {
    const result = quickValidate('')
    expect(result.status).toBe('error')
    expect(result.message).toBe('Ingen data angiven')
  })

  it('should return error for whitespace only', () => {
    const result = quickValidate('   ')
    expect(result.status).toBe('error')
    expect(result.message).toBe('Ingen data angiven')
  })

  it('should return error for invalid JSON', () => {
    const result = quickValidate('not valid json')
    expect(result.status).toBe('error')
    expect(result.message).toBe('Ogiltig JSON')
  })

  it('should return error for non-object JSON', () => {
    const result = quickValidate('"just a string"')
    expect(result.status).toBe('error')
    expect(result.message).toBe('Ogiltig JSON-struktur')
  })

  it('should return error for wrong kind', () => {
    const json = JSON.stringify({ kind: 'other-type', profile: {} })
    const result = quickValidate(json)
    expect(result.status).toBe('error')
    expect(result.message).toBe('Inte en säkerhetskopia')
  })

  it('should return error for missing profile', () => {
    const json = JSON.stringify({ kind: 'profile-backup', version: '1.0' })
    const result = quickValidate(json)
    expect(result.status).toBe('error')
    expect(result.message).toBe('Profil saknas')
  })

  it('should return warning for missing metadata', () => {
    const json = JSON.stringify({
      kind: 'profile-backup',
      profile: { sex: 'male' }
    })
    const result = quickValidate(json)
    expect(result.status).toBe('warning')
    expect(result.message).toBe('Säkerhetskopia kan importeras med varningar')
  })

  it('should return valid for complete backup', () => {
    const json = JSON.stringify({
      kind: 'profile-backup',
      version: '1.0',
      exportedAt: '2026-01-07T00:00:00.000Z',
      profile: { displayName: 'Test', sex: 'male' }
    })
    const result = quickValidate(json)
    expect(result.status).toBe('valid')
    expect(result.message).toBe('Giltig säkerhetskopia')
  })

  it('should handle formatted JSON with newlines', () => {
    const json = `{
      "kind": "profile-backup",
      "version": "1.0",
      "exportedAt": "2026-01-07T00:00:00.000Z",
      "profile": {
        "displayName": "Test",
        "sex": "male"
      }
    }`
    const result = quickValidate(json)
    expect(result.status).toBe('valid')
  })
})
