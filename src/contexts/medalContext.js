import { createContext } from 'react'

export const defaultMedalContextValue = { medalDatabase: null, loading: true, error: null }
export const MedalContext = createContext(defaultMedalContextValue)
export { MedalProvider } from './MedalContext.jsx'
