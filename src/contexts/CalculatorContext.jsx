/* eslint-disable react-refresh/only-export-components */
import React, { createContext } from 'react'
import { useMedalCalculator, useAllMedalStatuses } from '../hooks/useMedalCalculator'

export const CalculatorContext = createContext(null)

export function CalculatorProvider({ children }) {
  const calculator = useMedalCalculator()
  const allStatuses = useAllMedalStatuses()

  return (
    <CalculatorContext.Provider value={{ calculator, allStatuses }}>
      {children}
    </CalculatorContext.Provider>
  )
}
