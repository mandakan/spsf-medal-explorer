import { getLayout, DEFAULT_LAYOUT_ID, listLayouts } from '../src/logic/layouts'

describe('skill tree layout presets', () => {
  test('default layout is registered and resolvable', () => {
    const def = getLayout(DEFAULT_LAYOUT_ID)
    expect(def).toBeTruthy()
    expect(def.id).toBe(DEFAULT_LAYOUT_ID)
    expect(typeof def.generator).toBe('function')
  })

  test('listLayouts includes default layout metadata', () => {
    const list = listLayouts()
    expect(Array.isArray(list)).toBe(true)
    expect(list.some(x => x.id === DEFAULT_LAYOUT_ID)).toBe(true)
  })
})
