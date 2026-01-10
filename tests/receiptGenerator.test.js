import {
  getReceiptAchievements,
  formatAchievementForDisplay,
  generateReceiptText,
} from '../src/utils/receiptGenerator'

describe('receiptGenerator', () => {
  describe('getReceiptAchievements', () => {
    it('returns empty array when unlockedEntry has no achievementIds', () => {
      const result = getReceiptAchievements({
        unlockedEntry: { medalId: 'test-medal' },
        profile: { prerequisites: [{ id: 'ach-1', type: 'precision_series' }] },
      })
      expect(result).toEqual([])
    })

    it('returns empty array when achievementIds is empty', () => {
      const result = getReceiptAchievements({
        unlockedEntry: { medalId: 'test-medal', achievementIds: [] },
        profile: { prerequisites: [{ id: 'ach-1', type: 'precision_series' }] },
      })
      expect(result).toEqual([])
    })

    it('returns empty array when profile has no prerequisites', () => {
      const result = getReceiptAchievements({
        unlockedEntry: { medalId: 'test-medal', achievementIds: ['ach-1'] },
        profile: { prerequisites: [] },
      })
      expect(result).toEqual([])
    })

    it('returns matching achievements by ID', () => {
      const ach1 = { id: 'ach-1', type: 'precision_series', year: 2025, points: 195 }
      const ach2 = { id: 'ach-2', type: 'precision_series', year: 2025, points: 198 }
      const ach3 = { id: 'ach-3', type: 'application_series', year: 2025 }

      const result = getReceiptAchievements({
        unlockedEntry: { medalId: 'test-medal', achievementIds: ['ach-1', 'ach-3'] },
        profile: { prerequisites: [ach1, ach2, ach3] },
      })

      expect(result).toHaveLength(2)
      expect(result).toContainEqual(ach1)
      expect(result).toContainEqual(ach3)
      expect(result).not.toContainEqual(ach2)
    })

    it('ignores achievement IDs not in profile', () => {
      const ach1 = { id: 'ach-1', type: 'precision_series' }

      const result = getReceiptAchievements({
        unlockedEntry: { medalId: 'test-medal', achievementIds: ['ach-1', 'ach-missing'] },
        profile: { prerequisites: [ach1] },
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(ach1)
    })
  })

  describe('formatAchievementForDisplay', () => {
    it('formats precision_series achievement with date', () => {
      const result = formatAchievementForDisplay({
        id: 'ach-1',
        type: 'precision_series',
        date: '2025-03-15',
        year: 2025,
        weaponGroup: 'A',
        points: 195,
      })

      expect(result.label).toBe('Precisionsserier')
      expect(result.details).toContain('2025-03-15')
      expect(result.details).toContain('Grupp A')
      expect(result.details).toContain('195 p')
      expect(result.date).toBe('2025-03-15')
    })

    it('falls back to year when date is not available', () => {
      const result = formatAchievementForDisplay({
        id: 'ach-1',
        type: 'precision_series',
        year: 2025,
        weaponGroup: 'A',
        points: 195,
      })

      expect(result.details).toContain('2025')
      // Should not contain a date in YYYY-MM-DD format
      expect(result.details).not.toMatch(/\d{4}-\d{2}-\d{2}/)
      expect(result.date).toBe('2025')
    })

    it('formats application_series achievement', () => {
      const result = formatAchievementForDisplay({
        id: 'ach-1',
        type: 'application_series',
        year: 2025,
        weaponGroup: 'B',
        hits: 5,
        timeSeconds: 45,
      })

      expect(result.label).toBe('Tillämpningsserier')
      expect(result.details).toContain('5 tr')
      expect(result.details).toContain('45 s')
    })

    it('formats running_shooting_course achievement', () => {
      const result = formatAchievementForDisplay({
        id: 'ach-1',
        type: 'running_shooting_course',
        year: 2025,
        points: 120,
      })

      expect(result.label).toBe('Springskytte')
      expect(result.details).toContain('120 p')
    })

    it('formats competition_result achievement', () => {
      const result = formatAchievementForDisplay({
        id: 'ach-1',
        type: 'competition_result',
        year: 2025,
        score: 285,
        competitionName: 'SM Precision',
      })

      expect(result.label).toBe('Tävlingsresultat')
      expect(result.details).toContain('285 p')
      expect(result.details).toContain('SM Precision')
    })

    it('formats standard_medal achievement', () => {
      const result = formatAchievementForDisplay({
        id: 'ach-1',
        type: 'standard_medal',
        year: 2025,
        disciplineType: 'precision',
        medalType: 'gold',
      })

      expect(result.label).toBe('Standardmedalj')
      expect(result.details).toContain('precision')
      expect(result.details).toContain('Guld')
    })

    it('handles unknown type gracefully', () => {
      const result = formatAchievementForDisplay({
        id: 'ach-1',
        type: 'unknown_type',
        year: 2025,
      })

      expect(result.label).toBe('unknown_type')
      expect(result.details).toContain('2025')
    })
  })

  describe('generateReceiptText', () => {
    it('generates complete receipt text with dates', () => {
      const medal = { displayName: 'Pistolskyttemärket Brons' }
      const achievements = [
        { id: 'ach-1', type: 'precision_series', date: '2025-03-15', year: 2025, weaponGroup: 'A', points: 195 },
        { id: 'ach-2', type: 'precision_series', date: '2025-06-20', year: 2025, weaponGroup: 'A', points: 198 },
      ]

      const result = generateReceiptText({
        medal,
        achievements,
        unlockedDate: '2025-12-31',
        profileName: 'Test User',
      })

      expect(result).toContain('KVALIFICERINGSKVITTO')
      expect(result).toContain('Marke: Pistolskyttemärket Brons')
      expect(result).toContain('Upplast: 2025')
      expect(result).toContain('Profil: Test User')
      expect(result).toContain('KVALIFICERANDE AKTIVITETER:')
      expect(result).toContain('1. Precisionsserier')
      expect(result).toContain('2. Precisionsserier')
      expect(result).toContain('2025-03-15')
      expect(result).toContain('2025-06-20')
      expect(result).toContain('195 p')
      expect(result).toContain('198 p')
      expect(result).toContain('Genererat av SPSF Medal Explorer')
    })

    it('handles empty achievements', () => {
      const result = generateReceiptText({
        medal: { displayName: 'Test Medal' },
        achievements: [],
        unlockedDate: '2025-12-31',
        profileName: 'Test User',
      })

      expect(result).toContain('(Inga aktiviteter registrerade)')
    })

    it('handles missing medal name', () => {
      const result = generateReceiptText({
        medal: {},
        achievements: [],
        unlockedDate: '2025-12-31',
        profileName: 'Test User',
      })

      expect(result).toContain('Marke: Okant')
    })

    it('handles missing profile name', () => {
      const result = generateReceiptText({
        medal: { displayName: 'Test Medal' },
        achievements: [],
        unlockedDate: '2025-12-31',
        profileName: null,
      })

      expect(result).not.toContain('Profil:')
    })

    it('uses medal.name as fallback', () => {
      const result = generateReceiptText({
        medal: { name: 'Fallback Name' },
        achievements: [],
        unlockedDate: '2025-12-31',
        profileName: 'Test User',
      })

      expect(result).toContain('Marke: Fallback Name')
    })
  })
})
