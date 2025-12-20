import { applyFilters, sortMedals } from '../src/logic/filterEngine'

const medals = [
  { id: 'm1', displayName: 'Bronze Pistol Mark', type: 'pistol_mark', tier: 'bronze' },
  { id: 'm2', displayName: 'Silver Pistol Mark', type: 'pistol_mark', tier: 'silver' },
  { id: 'm3', displayName: 'Gold Field Mark', type: 'field_mark', tier: 'gold' },
]

const statuses = {
  unlocked: [{ medalId: 'm1', status: 'unlocked' }],
  achievable: [{ medalId: 'm2', status: 'achievable' }],
  locked: [{ medalId: 'm3', status: 'locked' }],
}

describe('filterEngine.applyFilters', () => {
  test('filters by status', () => {
    const r = applyFilters(medals, statuses, { status: 'unlocked' })
    expect(r.map(m => m.id)).toEqual(['m1'])
  })

  test('filters by tier', () => {
    const r = applyFilters(medals, statuses, { tier: 'silver' })
    expect(r.map(m => m.id)).toEqual(['m2'])
  })

  test('filters by type', () => {
    const r = applyFilters(medals, statuses, { type: 'field_mark' })
    expect(r.map(m => m.id)).toEqual(['m3'])
  })

  test('filters by search (case-insensitive)', () => {
    const r = applyFilters(medals, statuses, { search: 'pistol' })
    expect(r.map(m => m.id)).toEqual(['m1', 'm2'])
  })

  test('combines multiple filters (AND)', () => {
    const r = applyFilters(medals, statuses, { search: 'mark', type: 'pistol_mark', tier: 'silver' })
    expect(r.map(m => m.id)).toEqual(['m2'])
  })
})

describe('filterEngine.sortMedals', () => {
  test('sort by name', () => {
    const r = sortMedals(medals, 'name', statuses)
    expect(r.map(m => m.displayName)).toEqual([
      'Bronze Pistol Mark',
      'Gold Field Mark',
      'Silver Pistol Mark',
    ])
  })

  test('sort by tier using order', () => {
    const r = sortMedals(medals, 'tier', statuses)
    expect(r.map(m => m.tier)).toEqual(['bronze', 'silver', 'gold'])
  })

  test('sort by status order unlocked -> achievable -> locked', () => {
    const r = sortMedals(medals, 'status', statuses)
    expect(r.map(m => m.id)).toEqual(['m1', 'm2', 'm3'])
  })
})
