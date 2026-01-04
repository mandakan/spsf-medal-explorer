import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { OnboardingTourProvider } from '../src/contexts/OnboardingTourContext.jsx'
import { useOnboardingTour } from '../src/hooks/useOnboardingTour'
import { getTourId } from '../src/utils/onboardingTour'

function Probe() {
  const tour = useOnboardingTour()
  return (
    <div>
      <div data-testid="open">{String(tour.open)}</div>
      <div data-testid="step">{String(tour.stepIndex)}</div>
      <div data-testid="canAuto">{String(tour.canAutoStart())}</div>

      <button type="button" onClick={() => tour.start()}>
        start
      </button>
      <button type="button" onClick={() => tour.next()}>
        next
      </button>
      <button type="button" onClick={() => tour.back()}>
        back
      </button>
      <button type="button" onClick={() => tour.complete()}>
        complete
      </button>
    </div>
  )
}

describe('OnboardingTourProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('start opens tour and resets stepIndex', async () => {
    render(
      <OnboardingTourProvider>
        <Probe />
      </OnboardingTourProvider>
    )

    expect(screen.getByTestId('open')).toHaveTextContent('false')
    expect(screen.getByTestId('step')).toHaveTextContent('0')

    await act(async () => {
      screen.getByText('next').click()
      screen.getByText('next').click()
    })
    expect(screen.getByTestId('step')).toHaveTextContent('2')

    await act(async () => {
      screen.getByText('start').click()
    })
    expect(screen.getByTestId('open')).toHaveTextContent('true')
    expect(screen.getByTestId('step')).toHaveTextContent('0')
  })

  it('next/back clamps within bounds', async () => {
    render(
      <OnboardingTourProvider>
        <Probe />
      </OnboardingTourProvider>
    )

    await act(async () => {
      screen.getByText('back').click()
    })
    expect(screen.getByTestId('step')).toHaveTextContent('0')

    await act(async () => {
      for (let i = 0; i < 50; i++) screen.getByText('next').click()
    })

    const step = Number(screen.getByTestId('step').textContent)
    expect(step).toBeGreaterThanOrEqual(0)
    expect(step).toBeLessThan(50)
  })

  it('complete marks tour as seen and closes', async () => {
    render(
      <OnboardingTourProvider>
        <Probe />
      </OnboardingTourProvider>
    )

    expect(screen.getByTestId('canAuto')).toHaveTextContent('true')

    await act(async () => {
      screen.getByText('start').click()
    })
    expect(screen.getByTestId('open')).toHaveTextContent('true')

    await act(async () => {
      screen.getByText('complete').click()
    })
    expect(screen.getByTestId('open')).toHaveTextContent('false')

    expect(localStorage.getItem('app:onboardingTour:lastSeen')).toBe(getTourId())
    expect(screen.getByTestId('canAuto')).toHaveTextContent('false')
  })
})
