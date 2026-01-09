import {
  getApplicationSeriesDefaults,
  getPrecisionSeriesDefaults,
  getSpeedShootingSeriesDefaults,
  getRequirementHint,
  getAvailableWeaponGroups
} from '../src/utils/requirementDefaults'

describe('requirementDefaults utility', () => {
  describe('getApplicationSeriesDefaults', () => {
    test('extracts defaults from pistol mark bronze medal', () => {
      const medal = {
        id: 'pistol-mark-bronze',
        requirements: {
          and: [
            {
              type: 'application_series',
              description: '3 tillämpningsserier med 5 träffar inom 60s',
              thresholds: {
                A: { minHits: 5, maxTimeSeconds: 60 },
                B: { minHits: 5, maxTimeSeconds: 55 },
                C: { minHits: 5, maxTimeSeconds: 50 }
              }
            }
          ]
        }
      }

      const defaults = getApplicationSeriesDefaults(medal)

      expect(defaults).toEqual({
        weaponGroup: 'A',
        hits: 5,
        timeSeconds: 60
      })
    })

    test('returns empty defaults for medal without application_series requirement', () => {
      const medal = {
        id: 'test-medal',
        requirements: {
          and: [
            {
              type: 'precision_series',
              pointThresholds: { A: { min: 32 } }
            }
          ]
        }
      }

      const defaults = getApplicationSeriesDefaults(medal)

      expect(defaults).toEqual({
        weaponGroup: 'A',
        hits: '',
        timeSeconds: ''
      })
    })

    test('handles null/undefined medal gracefully', () => {
      expect(getApplicationSeriesDefaults(null)).toEqual({
        weaponGroup: 'A',
        hits: '',
        timeSeconds: ''
      })

      expect(getApplicationSeriesDefaults(undefined)).toEqual({
        weaponGroup: 'A',
        hits: '',
        timeSeconds: ''
      })
    })
  })

  describe('getPrecisionSeriesDefaults', () => {
    test('extracts defaults from pistol mark bronze medal', () => {
      const medal = {
        id: 'pistol-mark-bronze',
        requirements: {
          and: [
            {
              type: 'precision_series',
              description: '3 precisionsserier mot Pistoltavla 25m',
              pointThresholds: {
                A: { min: 32 },
                B: { min: 33 },
                C: { min: 34 }
              }
            }
          ]
        }
      }

      const defaults = getPrecisionSeriesDefaults(medal)

      expect(defaults).toEqual({
        weaponGroup: 'A',
        points: 32
      })
    })

    test('uses age-based thresholds when profile is provided', () => {
      const medal = {
        id: 'test-medal',
        requirements: {
          type: 'precision_series',
          pointThresholds: {
            A: { min: 32 }
          },
          ageCategories: [
            {
              ageMin: 0,
              ageMax: 54,
              pointThresholds: { A: { min: 32 } }
            },
            {
              ageMin: 55,
              ageMax: 64,
              pointThresholds: { A: { min: 31 } }
            },
            {
              ageMin: 65,
              ageMax: 999,
              pointThresholds: { A: { min: 30 } }
            }
          ]
        }
      }

      // User aged 60 (born in 1966)
      const profile = {
        dateOfBirth: '1966-01-01'
      }

      const defaults = getPrecisionSeriesDefaults(medal, profile)

      expect(defaults).toEqual({
        weaponGroup: 'A',
        points: 31 // Age 55-64 category
      })
    })

    test('returns empty defaults for medal without precision_series requirement', () => {
      const medal = {
        id: 'test-medal',
        requirements: {
          type: 'application_series',
          thresholds: { A: { minHits: 5 } }
        }
      }

      const defaults = getPrecisionSeriesDefaults(medal)

      expect(defaults).toEqual({
        weaponGroup: 'A',
        points: ''
      })
    })
  })

  describe('getSpeedShootingSeriesDefaults', () => {
    test('extracts defaults from medal with speed_shooting_series requirement', () => {
      const medal = {
        id: 'test-medal',
        requirements: {
          type: 'speed_shooting_series',
          pointThresholds: {
            A: { min: 35 },
            B: { min: 36 },
            C: { min: 37 }
          }
        }
      }

      const defaults = getSpeedShootingSeriesDefaults(medal)

      expect(defaults).toEqual({
        weaponGroup: 'A',
        points: 35
      })
    })
  })

  describe('getRequirementHint', () => {
    test('returns description from medal requirement', () => {
      const medal = {
        requirements: {
          and: [
            {
              type: 'application_series',
              description: '3 tillämpningsserier (5 träff inom 60s)'
            }
          ]
        }
      }

      const hint = getRequirementHint(medal, 'application_series')

      expect(hint).toBe('3 tillämpningsserier (5 träff inom 60s)')
    })

    test('returns null when requirement type not found', () => {
      const medal = {
        requirements: {
          type: 'precision_series',
          description: 'Precision requirement'
        }
      }

      const hint = getRequirementHint(medal, 'application_series')

      expect(hint).toBeNull()
    })

    test('returns null when medal has no requirements', () => {
      const medal = { id: 'test' }

      const hint = getRequirementHint(medal, 'application_series')

      expect(hint).toBeNull()
    })
  })

  describe('getAvailableWeaponGroups', () => {
    test('returns weapon groups from requirement thresholds', () => {
      const medal = {
        requirements: {
          type: 'application_series',
          thresholds: {
            A: { minHits: 5 },
            B: { minHits: 5 },
            C: { minHits: 5 }
          }
        }
      }

      const groups = getAvailableWeaponGroups(medal, 'application_series')

      expect(groups).toEqual(['A', 'B', 'C'])
    })

    test('returns weapon groups from pointThresholds', () => {
      const medal = {
        requirements: {
          type: 'precision_series',
          pointThresholds: {
            A: { min: 32 },
            B: { min: 33 }
          }
        }
      }

      const groups = getAvailableWeaponGroups(medal, 'precision_series')

      expect(groups).toEqual(['A', 'B'])
    })

    test('returns default groups when requirement not found', () => {
      const medal = {
        requirements: {
          type: 'other_type'
        }
      }

      const groups = getAvailableWeaponGroups(medal, 'application_series')

      expect(groups).toEqual(['A', 'B', 'C', 'R'])
    })
  })

  describe('nested requirement structures', () => {
    test('finds requirement in deeply nested and/or structure', () => {
      const medal = {
        requirements: {
          and: [
            {
              type: 'precision_series',
              pointThresholds: { A: { min: 32 } }
            },
            {
              or: [
                {
                  type: 'application_series',
                  thresholds: { A: { minHits: 5, maxTimeSeconds: 60 } }
                },
                {
                  type: 'speed_shooting_series',
                  pointThresholds: { A: { min: 35 } }
                }
              ]
            }
          ]
        }
      }

      const appDefaults = getApplicationSeriesDefaults(medal)
      expect(appDefaults.hits).toBe(5)
      expect(appDefaults.timeSeconds).toBe(60)

      const precDefaults = getPrecisionSeriesDefaults(medal)
      expect(precDefaults.points).toBe(32)

      const speedDefaults = getSpeedShootingSeriesDefaults(medal)
      expect(speedDefaults.points).toBe(35)
    })
  })
})
