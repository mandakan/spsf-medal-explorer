import React from 'react'
import { CalculatorContext } from './calculatorContext'
import { useMedalCalculator, useAllMedalStatuses } from '../hooks/useMedalCalculator'
export { CalculatorContext } from './calculatorContext'


export function CalculatorProvider({ children }) {
  const calculator = useMedalCalculator()
  const allStatuses = useAllMedalStatuses()

  return (
    <CalculatorContext.Provider value={{ calculator, allStatuses }}>
      {children}
    </CalculatorContext.Provider>
  )
}
