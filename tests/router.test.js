import React from 'react'
import { render } from '@testing-library/react'
import App from '../src/App.jsx'

describe('Routing', () => {
  it('renders app shell without crashing', () => {
    render(<App />)
    expect(true).toBe(true)
  })
})
