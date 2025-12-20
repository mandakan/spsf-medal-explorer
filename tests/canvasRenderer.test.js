import { drawMedalNode, drawConnection } from '../src/logic/canvasRenderer'

function createStubCtx(width = 800, height = 600) {
  const calls = []
  const fn = (name) => (...args) => calls.push({ name, args })
  return {
    canvas: { width, height },
    // drawing state
    fillStyle: null,
    strokeStyle: null,
    lineWidth: 1,
    font: '',
    textAlign: 'center',
    textBaseline: 'middle',
    // path methods
    beginPath: fn('beginPath'),
    closePath: fn('closePath'),
    arc: fn('arc'),
    fill: fn('fill'),
    stroke: fn('stroke'),
    moveTo: fn('moveTo'),
    lineTo: fn('lineTo'),
    fillText: fn('fillText'),
    calls
  }
}

describe('Canvas Renderer', () => {
  test('drawMedalNode does not throw and draws elements', () => {
    const ctx = createStubCtx()
    const medal = { displayName: 'Medal 1', tier: 'bronze' }
    expect(() => drawMedalNode(ctx, 100, 100, 20, medal, { status: 'achievable' }, 1)).not.toThrow()
    // basic sanity - at least one arc and one fillText
    const arcCalls = ctx.calls.filter(c => c.name === 'arc').length
    const textCalls = ctx.calls.filter(c => c.name === 'fillText').length
    expect(arcCalls).toBeGreaterThan(0)
    expect(textCalls).toBeGreaterThan(0)
  })

  test('drawConnection draws a line and an arrowhead', () => {
    const ctx = createStubCtx()
    expect(() => drawConnection(ctx, 10, 10, 200, 200, 'prerequisite', 1)).not.toThrow()
    const moveToCalls = ctx.calls.filter(c => c.name === 'moveTo').length
    const lineToCalls = ctx.calls.filter(c => c.name === 'lineTo').length
    expect(moveToCalls).toBeGreaterThan(0)
    expect(lineToCalls).toBeGreaterThan(0)
  })
})
