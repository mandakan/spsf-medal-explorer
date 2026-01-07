import 'fake-indexeddb/auto'
import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'node:util'

// Polyfill for libraries (e.g. react-router) that expect Web TextEncoder/TextDecoder.
// Must run at module load time (not in beforeAll), because some deps access TextEncoder during import.
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder
}

// Polyfill for structuredClone (needed for fake-indexeddb)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
  }
}

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

  // Ensure <base href="/"> exists for components that compute BASE_URL from the DOM
  if (typeof document !== 'undefined' && !document.querySelector('base')) {
    const el = document.createElement('base')
    el.setAttribute('href', '/')
    document.head.appendChild(el)
  }
})

afterAll(() => {
  if (console.warn && typeof console.warn.mockRestore === 'function') {
    console.warn.mockRestore()
  }
  if (console.error && typeof console.error.mockRestore === 'function') {
    console.error.mockRestore()
  }
})
