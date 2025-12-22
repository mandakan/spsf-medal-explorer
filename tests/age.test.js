import { calculateAge } from '../src/utils/age'

describe('calculateAge', () => {
  const OLD_TZ = process.env.TZ

  beforeAll(() => {
    process.env.TZ = 'UTC'
  })

  afterAll(() => {
    process.env.TZ = OLD_TZ
  })

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('throws on non-string or empty input', () => {
    expect(() => calculateAge()).toThrow('dateOfBirth must be a non-empty string')
    // @ts-ignore intentional invalid usage in JS test
    expect(() => calculateAge(123)).toThrow('dateOfBirth must be a non-empty string')
    expect(() => calculateAge('')).toThrow('dateOfBirth must be a non-empty string')
  })

  test('throws on invalid date string', () => {
    expect(() => calculateAge('not-a-date')).toThrow('Invalid dateOfBirth')
  })

  test('calculates age before, on, and after birthday (YYYY-MM-DD)', () => {
    const dob = '2000-06-15'

    jest.setSystemTime(new Date('2025-06-14T12:00:00Z'))
    expect(calculateAge(dob)).toBe(24) // day before birthday

    jest.setSystemTime(new Date('2025-06-15T12:00:00Z'))
    expect(calculateAge(dob)).toBe(25) // birthday

    jest.setSystemTime(new Date('2025-06-16T12:00:00Z'))
    expect(calculateAge(dob)).toBe(25) // day after birthday
  })

  test('accepts full ISO string with timezone', () => {
    const dob = '2000-06-15T00:00:00Z'

    jest.setSystemTime(new Date('2025-06-15T12:00:00Z'))
    expect(calculateAge(dob)).toBe(25)
  })

  test('handles leap day birthdays correctly in non-leap years', () => {
    const dob = '2004-02-29'

    jest.setSystemTime(new Date('2025-02-28T12:00:00Z'))
    expect(calculateAge(dob)).toBe(20) // not yet reached "birthday" equivalent

    jest.setSystemTime(new Date('2025-03-01T12:00:00Z'))
    expect(calculateAge(dob)).toBe(21) // birthday considered passed
  })
})
