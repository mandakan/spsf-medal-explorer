import React from 'react'
import { render } from '@testing-library/react'

// Ensure BrowserRouter works reliably under jsdom by mapping to MemoryRouter in tests
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return new Proxy(actual, {
    get(target, prop) {
      if (prop === 'BrowserRouter') return target.MemoryRouter
      return target[prop]
    },
  })
})

// Mock providers to pass through children for routing isolation in tests
jest.mock('../src/contexts/MedalContext', () => ({
  MedalProvider: ({ children }) => <>{children}</>,
}))
jest.mock('../src/contexts/ProfileContext', () => ({
  ProfileProvider: ({ children }) => <>{children}</>,
}))
jest.mock('../src/contexts/CalculatorContext', () => ({
  CalculatorProvider: ({ children }) => <>{children}</>,
}))

// Stub ProfileSelector to avoid needing ProfileContext in this routing test
jest.mock('../src/components/ProfileSelector.jsx', () => ({
  __esModule: true,
  default: () => null,
}))

import App from '../src/App.jsx'

describe('Routing', () => {
  it('renders app shell without crashing', () => {
    render(<App />)
    expect(true).toBe(true)
  })
})
