import { highlightText, matchMedal } from '../src/logic/searchEngine'

const medal = {
  displayName: 'Silver Pistol Mark',
  name: 'silver_pistol_mark',
  type: 'pistol_mark',
}

describe('searchEngine.matchMedal', () => {
  test('matches by displayName', () => {
    expect(matchMedal(medal, 'silver')).toBe(true)
  })

  test('matches by type', () => {
    expect(matchMedal(medal, 'pistol')).toBe(true)
  })

  test('no match returns false', () => {
    expect(matchMedal(medal, 'archery')).toBe(false)
  })
})

describe('searchEngine.highlightText', () => {
  test('wraps match with <mark>', () => {
    const out = highlightText('Silver Pistol Mark', 'pistol')
    expect(out).toContain('<mark>Pistol</mark>')
  })

  test('case-insensitive match', () => {
    const out = highlightText('Silver Pistol Mark', 'PISTOL')
    expect(out).toContain('<mark>Pistol</mark>')
  })

  test('empty term returns original text', () => {
    const str = 'Silver Pistol Mark'
    expect(highlightText(str, '')).toBe(str)
  })
})
