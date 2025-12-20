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
    expect(medal.displayName).toBe('Pistol Mark - Bronze')
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
    const goldSeriesReq = medal.requirements.find(r => r.type === 'precision_series')
    expect(goldSeriesReq.pointThresholds.A.min).toBe(32)
    expect(goldSeriesReq.pointThresholds.B.min).toBe(33)
    expect(goldSeriesReq.pointThresholds.C.min).toBe(34)
  })

  test('medals unlock following medals correctly', () => {
    const medal = medalDb.getMedalById('pistol-mark-bronze')
    expect(medal.unlocksFollowingMedals).toContain('pistol-mark-silver')
    expect(medal.unlocksFollowingMedals).toContain('elite-mark-bronze')
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
