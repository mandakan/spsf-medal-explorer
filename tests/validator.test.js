import { InputValidator } from '../src/logic/validator'

describe('InputValidator', () => {
  test('accepts valid precision series input', () => {
    const input = {
      year: new Date().getFullYear(),
      weaponGroup: 'A',
      points: 42
    }
    const result = InputValidator.validatePrecisionSeriesInput(input)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })

  test('rejects future date', () => {
    const input = {
      year: new Date().getFullYear(),
      weaponGroup: 'A',
      points: 42,
      date: '2099-06-15'
    }
    const result = InputValidator.validatePrecisionSeriesInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Date cannot be in the future')
  })

  test('rejects invalid weapon group', () => {
    const input = {
      year: new Date().getFullYear(),
      weaponGroup: 'Z',
      points: 30
    }
    const result = InputValidator.validatePrecisionSeriesInput(input)
    expect(result.isValid).toBe(false)
  })

  test('rejects out-of-range points', () => {
    const inputLow = { year: 2024, weaponGroup: 'A', points: -1 }
    const inputHigh = { year: 2024, weaponGroup: 'B', points: 51 }
    expect(InputValidator.validatePrecisionSeriesInput(inputLow).isValid).toBe(false)
    expect(InputValidator.validatePrecisionSeriesInput(inputHigh).isValid).toBe(false)
  })
})
