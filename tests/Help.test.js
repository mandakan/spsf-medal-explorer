import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Help from '../src/pages/Help.jsx'
import * as onboardingTourUtils from '../src/utils/onboardingTour'

// Mock react-router-dom navigation
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

// Mock requestManualTourStart utility
jest.spyOn(onboardingTourUtils, 'requestManualTourStart')

describe('Help Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    test('renders help page title and description', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      expect(screen.getByText('Hjälp & Guider')).toBeInTheDocument()
      expect(screen.getByText(/Välj en guide nedan för att lära dig/i)).toBeInTheDocument()
    })

    test('renders both guide cards', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      expect(screen.getByText('Märkeslista-guide')).toBeInTheDocument()
      expect(screen.getByText('Trädvy-guide')).toBeInTheDocument()
    })

    test('renders medals guide details', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      expect(screen.getByText(/Lär dig hur du söker, filtrerar och utforskar märken/i)).toBeInTheDocument()
      expect(screen.getByText(/Hur du söker efter märken/i)).toBeInTheDocument()
      expect(screen.getByText(/Använd snabbfilter för statusar/i)).toBeInTheDocument()
      expect(screen.getByText(/Öppna och läs detaljerad information/i)).toBeInTheDocument()
      expect(screen.getByText(/Filtrera efter ålder, kategori och mer/i)).toBeInTheDocument()
    })

    test('renders tree view guide details', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      expect(screen.getByText(/Upptäck hur du navigerar det interaktiva märkesträdet/i)).toBeInTheDocument()
      expect(screen.getByText(/Hur du panorerar och zoomar i trädet/i)).toBeInTheDocument()
      expect(screen.getByText(/Förstå färgkodning och status/i)).toBeInTheDocument()
      expect(screen.getByText(/Klicka på märken för detaljer/i)).toBeInTheDocument()
      expect(screen.getByText(/Använd zoomkontroller och helskärmsläge/i)).toBeInTheDocument()
    })

    test('renders contextual help info section', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      expect(screen.getByText('Kontextbaserad hjälp')).toBeInTheDocument()
      expect(screen.getByText(/Du hittar också snabblänkar till guider/i)).toBeInTheDocument()
    })

    test('renders two "Starta Guide" buttons', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const buttons = screen.getAllByText('Starta Guide')
      expect(buttons).toHaveLength(2)
    })
  })

  describe('medals guide button', () => {
    test('calls requestManualTourStart with "medals" when clicked', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const buttons = screen.getAllByLabelText('Starta märkeslista-guide')
      expect(buttons).toHaveLength(1)

      fireEvent.click(buttons[0])

      expect(onboardingTourUtils.requestManualTourStart).toHaveBeenCalledWith('medals')
      expect(onboardingTourUtils.requestManualTourStart).toHaveBeenCalledTimes(1)
    })

    test('navigates to /medals when clicked', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const buttons = screen.getAllByLabelText('Starta märkeslista-guide')
      fireEvent.click(buttons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/medals')
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    test('calls requestManualTourStart before navigate', () => {
      const callOrder = []

      onboardingTourUtils.requestManualTourStart.mockImplementation(() => {
        callOrder.push('requestManualTourStart')
      })

      mockNavigate.mockImplementation(() => {
        callOrder.push('navigate')
      })

      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const buttons = screen.getAllByLabelText('Starta märkeslista-guide')
      fireEvent.click(buttons[0])

      expect(callOrder).toEqual(['requestManualTourStart', 'navigate'])
    })
  })

  describe('tree view guide button', () => {
    test('calls requestManualTourStart with "tree-view" when clicked', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const buttons = screen.getAllByLabelText('Starta trädvy-guide')
      expect(buttons).toHaveLength(1)

      fireEvent.click(buttons[0])

      expect(onboardingTourUtils.requestManualTourStart).toHaveBeenCalledWith('tree-view')
      expect(onboardingTourUtils.requestManualTourStart).toHaveBeenCalledTimes(1)
    })

    test('navigates to /skill-tree when clicked', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const buttons = screen.getAllByLabelText('Starta trädvy-guide')
      fireEvent.click(buttons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/skill-tree')
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    test('calls requestManualTourStart before navigate', () => {
      const callOrder = []

      onboardingTourUtils.requestManualTourStart.mockImplementation(() => {
        callOrder.push('requestManualTourStart')
      })

      mockNavigate.mockImplementation(() => {
        callOrder.push('navigate')
      })

      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const buttons = screen.getAllByLabelText('Starta trädvy-guide')
      fireEvent.click(buttons[0])

      expect(callOrder).toEqual(['requestManualTourStart', 'navigate'])
    })
  })

  describe('accessibility', () => {
    test('medals guide button has proper aria-label', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const button = screen.getByLabelText('Starta märkeslista-guide')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    test('tree view guide button has proper aria-label', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const button = screen.getByLabelText('Starta trädvy-guide')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })

    test('guide step lists have aria-labels', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      expect(screen.getByLabelText('Steg i märkeslista-guiden')).toBeInTheDocument()
      expect(screen.getByLabelText('Steg i trädvy-guiden')).toBeInTheDocument()
    })

    test('uses semantic HTML with proper heading hierarchy', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      // Main heading
      const h1 = screen.getByRole('heading', { level: 1, name: 'Hjälp & Guider' })
      expect(h1).toBeInTheDocument()

      // Guide card headings
      const h2medals = screen.getByRole('heading', { level: 2, name: 'Märkeslista-guide' })
      expect(h2medals).toBeInTheDocument()

      const h2tree = screen.getByRole('heading', { level: 2, name: 'Trädvy-guide' })
      expect(h2tree).toBeInTheDocument()

      const h2context = screen.getByRole('heading', { level: 2, name: 'Kontextbaserad hjälp' })
      expect(h2context).toBeInTheDocument()
    })

    test('buttons are keyboard accessible', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const medalsButton = screen.getByLabelText('Starta märkeslista-guide')
      const treeButton = screen.getByLabelText('Starta trädvy-guide')

      // Buttons should be focusable
      expect(medalsButton).toHaveAttribute('type', 'button')
      expect(treeButton).toHaveAttribute('type', 'button')
    })
  })

  describe('multiple clicks', () => {
    test('medals button can be clicked multiple times', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const button = screen.getByLabelText('Starta märkeslista-guide')

      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(onboardingTourUtils.requestManualTourStart).toHaveBeenCalledTimes(3)
      expect(mockNavigate).toHaveBeenCalledTimes(3)
    })

    test('tree button can be clicked multiple times', () => {
      render(
        <BrowserRouter>
          <Help />
        </BrowserRouter>
      )

      const button = screen.getByLabelText('Starta trädvy-guide')

      fireEvent.click(button)
      fireEvent.click(button)

      expect(onboardingTourUtils.requestManualTourStart).toHaveBeenCalledTimes(2)
      expect(mockNavigate).toHaveBeenCalledTimes(2)
    })
  })
})
