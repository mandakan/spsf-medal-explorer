import '@testing-library/jest-dom'

const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    const msg = args[0] && String(args[0])
    if (msg && msg.includes('React Router Future Flag Warning')) return
    return originalWarn(...args)
  })
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const msg = args[0] && String(args[0])
    if (msg && msg.includes('not wrapped in act')) return
    return originalError(...args)
  })
})

afterAll(() => {
  if (console.warn && typeof console.warn.mockRestore === 'function') {
    console.warn.mockRestore()
  }
  if (console.error && typeof console.error.mockRestore === 'function') {
    console.error.mockRestore()
  }
})
