import { Medal, MedalDatabase } from '../src/models/Medal'
import medalsData from '../src/data/medals.json'

describe('Medal Database', () => {
  let medalDb

  beforeEach(() => {
    medalDb = new MedalDatabase(medalsData)
  })

  test('loads all medals successfully', () => {
    expect(medalDb.medals.length).toBeGreaterThan(10)
  })

  test('finds medal by id', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze')
    expect(medal).toBeDefined()
    expect(medal.displayName).toBe('Pistolskyttemärket Brons')
  })

  test('bronze pistol mark has no prerequisites', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze')
    expect(medal.prerequisites.length).toBe(0)
  })

  test('silver pistol mark requires bronze', () => {
    const medal = medalDb.getMedalById('pistol-mark-silver')
    expect(medal.prerequisites.some(p => p.medalId === 'pistol-mark-bronze')).toBe(true)
  })

  test('precision series requirement has correct point thresholds', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze')
    const reqs = medal.requirements

    // Support both legacy array format and new object/nested formats
    let seriesReq = null
    if (Array.isArray(reqs)) {
      seriesReq = reqs.find(r => r && r.type === 'precision_series') || null
    } else if (reqs && typeof reqs === 'object') {
      if (reqs.precision_series && typeof reqs.precision_series === 'object') {
        seriesReq = reqs.precision_series
      } else if (Array.isArray(reqs.items)) {
        seriesReq = reqs.items.find(r => r && r.type === 'precision_series') || null
      }
    }

    expect(seriesReq).toBeTruthy()

    // Normalize threshold structure
    const pts = seriesReq.pointThresholds || seriesReq.thresholds || {}
    const getMin = (group) => {
      const g = pts[group] || {}
      if (typeof g.min === 'number') return g.min
      if (typeof g.minPoints === 'number') return g.minPoints
      return undefined
    }

    expect(getMin('A')).toBe(32)
    expect(getMin('B')).toBe(33)
    expect(getMin('C')).toBe(34)
  })

  test('medals unlock following medals correctly', () => {
    const bronze = medalDb.getMedalById('pistol-mark-bronze')
    expect(bronze.unlocksFollowingMedals).toContain('pistol-mark-silver')

    const gold = medalDb.getMedalById('pistol-mark-gold')
    expect(gold.unlocksFollowingMedals).toContain('elite-mark-bronze')
  })

  test('gets medals by type', () => {
    const pistolMarks = medalDb.getMedalsByType('pistol_mark')
    expect(pistolMarks.length).toBeGreaterThan(0)
    expect(pistolMarks.every(m => m.type === 'pistol_mark')).toBe(true)
  })

  test('gets medals by tier', () => {
    const bronzeMarks = medalDb.getMedalsByTier('bronze')
    expect(bronzeMarks.length).toBeGreaterThan(0)
    expect(bronzeMarks.every(m => m.tier === 'bronze')).toBe(true)
  })
})

describe('Medal Class', () => {
  test('creates medal with all properties', () => {
    const medal = new Medal({
      id: 'test-medal',
      type: 'pistol_mark',
      tier: 'bronze',
      displayName: 'Test Medal',
      color: '#FFD700',
      prerequisites: [],
      requirements: []
    })
    expect(medal.id).toBe('test-medal')
    expect(medal.type).toBe('pistol_mark')
  })

  test('getFullName returns tier name', () => {
    const medal = new Medal({
      id: 'test',
      displayName: 'Test Medal',
      tier: 'bronze'
    })
    expect(medal.getFullName()).toBe('Test Medal (Bronze)')
  })
})
