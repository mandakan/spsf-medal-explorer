import { generateMedalLayout } from '../src/logic/canvasLayout'
import { Medal } from '../src/models/Medal'

describe('Canvas Layout Algorithm', () => {
  test('generates layout for medals', () => {
    const medals = [
      new Medal({
        id: 'medal-1',
        type: 'pistol_mark',
        tier: 'bronze',
        displayName: 'Medal 1',
        prerequisites: []
      }),
      new Medal({
        id: 'medal-2',
        type: 'pistol_mark',
        tier: 'silver',
        displayName: 'Medal 2',
        prerequisites: [{ type: 'medal', medalId: 'medal-1' }]
      })
    ]

    const layout = generateMedalLayout(medals)

    expect(layout.medals.length).toBe(2)
    expect(layout.connections.length).toBeGreaterThan(0)
  })

  test('positions medals with coordinates', () => {
    const medals = [
      new Medal({
        id: 'medal-1',
        type: 'type1',
        tier: 'bronze',
        displayName: 'Medal 1',
        prerequisites: []
      })
    ]

    const layout = generateMedalLayout(medals)
    const medal = layout.medals[0]

    expect(medal.x).toBeDefined()
    expect(medal.y).toBeDefined()
    expect(medal.radius).toBeDefined()
  })

  test('creates connections for prerequisites', () => {
    const medals = [
      new Medal({
        id: 'medal-1',
        type: 'type1',
        tier: 'bronze',
        displayName: 'Medal 1',
        prerequisites: []
      }),
      new Medal({
        id: 'medal-2',
        type: 'type2',
        tier: 'silver',
        displayName: 'Medal 2',
        prerequisites: [{ type: 'medal', medalId: 'medal-1' }]
      })
    ]

    const layout = generateMedalLayout(medals)
    const connection = layout.connections.find(c => c.from === 'medal-1')

    expect(connection).toBeDefined()
    expect(connection.to).toBe('medal-2')
  })
})
