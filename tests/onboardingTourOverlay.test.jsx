import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { OnboardingTourProvider } from '../src/contexts/OnboardingTourContext.jsx'
import OnboardingTourOverlay from '../src/components/OnboardingTourOverlay.jsx'
import { useOnboardingTour } from '../src/hooks/useOnboardingTour'

function Controls() {
  const tour = useOnboardingTour()
  return (
    <div>
      <button type="button" onClick={() => tour.start()}>
        open
      </button>
    </div>
  )
}

describe('OnboardingTourOverlay', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('does not render when closed', () => {
    render(
      <OnboardingTourProvider>
        <OnboardingTourOverlay />
      </OnboardingTourProvider>
    )
    expect(screen.queryByRole('dialog')).toBe(null)
  })

  it('renders dialog when started and supports next/back/close', async () => {
    render(
      <OnboardingTourProvider>
        <Controls />
        <OnboardingTourOverlay />
      </OnboardingTourProvider>
    )

    await act(async () => {
      screen.getByText('open').click()
    })

    const dialog = screen.getByRole('dialog', { name: /snabbguide/i })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText(/Steg 1 av/i)).toBeInTheDocument()

    await act(async () => {
      screen.getByRole('button', { name: 'Nästa' }).click()
    })
    expect(screen.getByText(/Steg 2 av/i)).toBeInTheDocument()

    await act(async () => {
      screen.getByRole('button', { name: 'Tillbaka' }).click()
    })
    expect(screen.getByText(/Steg 1 av/i)).toBeInTheDocument()

    await act(async () => {
      screen.getByRole('button', { name: /Avsluta guiden/i }).click()
    })
    expect(screen.queryByRole('dialog')).toBe(null)
  })

  it('Escape closes (complete)', async () => {
    render(
      <OnboardingTourProvider>
        <Controls />
        <OnboardingTourOverlay />
      </OnboardingTourProvider>
    )

    await act(async () => {
      screen.getByText('open').click()
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await act(async () => {
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    })
    expect(screen.queryByRole('dialog')).toBe(null)
  })

  it('requiresTarget disables primary and shows hint when target missing', async () => {
    render(
      <OnboardingTourProvider>
        <Controls />
        <OnboardingTourOverlay />
      </OnboardingTourProvider>
    )

    await act(async () => {
      screen.getByText('open').click()
    })

    await act(async () => {
      screen.getByRole('button', { name: 'Nästa' }).click()
      screen.getByRole('button', { name: 'Nästa' }).click()
      screen.getByRole('button', { name: 'Nästa' }).click()
      screen.getByRole('button', { name: 'Nästa' }).click()
    })

    expect(screen.getByText(/Öppna ett märke/i)).toBeInTheDocument()
    expect(screen.getByText(/Öppna en medalj för att fortsätta/i)).toBeInTheDocument()

    const primary = screen.getByRole('button', { name: 'Nästa' })
    expect(primary).toBeDisabled()
  })
})
