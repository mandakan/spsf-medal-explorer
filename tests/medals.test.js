import { Medal, MedalDatabase } from '../src/models/Medal'
import medalsData from '../src/data/medals.json'

function collectRequirementLeaves(spec, acc = []) {
  if (!spec) return acc
  if (Array.isArray(spec)) {
    spec.forEach(s => collectRequirementLeaves(s, acc))
    return acc
  }
  if (typeof spec !== 'object') return acc

  // Direct leaf
  if (typeof spec.type === 'string') {
    acc.push(spec)
    return acc
  }

  // Common containers
  if (Array.isArray(spec.items)) collectRequirementLeaves(spec.items, acc)
  if (Array.isArray(spec.and)) collectRequirementLeaves(spec.and, acc)
  if (Array.isArray(spec.or)) collectRequirementLeaves(spec.or, acc)

  // Keyed by type names
  Object.entries(spec).forEach(([key, val]) => {
    if (!val || typeof val !== 'object') return
    if (key === 'precision_series' || key === 'application_series') {
      acc.push({ type: key, ...val })
    }
  })

  return acc
}

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

    const leaves = collectRequirementLeaves(medal.requirements)
    const seriesReq = leaves.find(r => r && r.type === 'precision_series') || null

    expect(seriesReq).toBeTruthy()

    const pts = seriesReq.pointThresholds || seriesReq.thresholds || {}
    const getMin = (group) => {
      const entry = pts[group] || pts[String(group).toUpperCase()] || pts[String(group).toLowerCase()] || {}
      if (typeof entry.min === 'number') return entry.min
      if (typeof entry.minPoints === 'number') return entry.minPoints
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
