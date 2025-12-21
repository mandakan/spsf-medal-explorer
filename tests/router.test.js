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

import App from '../src/App.jsx'

describe('Routing', () => {
  it('renders app shell without crashing', () => {
    render(<App />)
    expect(true).toBe(true)
  })
})
