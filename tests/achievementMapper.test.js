import { detectMedalFormType, mapFormToAchievement } from '../src/utils/achievementMapper'

describe('achievementMapper', () => {
  const medalGoldSeries = {
    id: 'pistol-mark-silver',
    type: 'pistol_mark',
    tier: 'silver',
    requirements: [{ type: 'precision_series' }]
  }

  const medalTeam = {
    id: 'team-pistol',
    type: 'pistol_team_mark',
    requirements: []
  }

  test('detectMedalFormType detects competition for precision_series', () => {
    expect(detectMedalFormType(medalGoldSeries)).toBe('competition')
  })

  test('detectMedalFormType detects team_event for team types', () => {
    expect(detectMedalFormType(medalTeam)).toBe('team_event')
  })

  test('mapFormToAchievement maps competition to precision_series with points', () => {
    const form = { date: '2025-06-15', weaponGroup: 'A', score: 42, competitionName: 'Club' }
    const mapped = mapFormToAchievement({ medal: medalGoldSeries, medalType: 'competition', formData: form })
    expect(mapped.type).toBe('precision_series')
    expect(mapped.points).toBe(42)
    expect(mapped.year).toBe(2025)
    expect(mapped.weaponGroup).toBe('A')
    expect(mapped.medalId).toBe('pistol-mark-silver')
  })
})
