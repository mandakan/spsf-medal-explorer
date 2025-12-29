import { useContext } from 'react'
import { FeatureFlagsContext } from '../contexts/FeatureFlagsContext.js'

export function useFlag(name) {
  const ctx = useContext(FeatureFlagsContext)
  const state = ctx?.get(name) ?? 'off'
  return { state, enabled: state === 'on' || state === 'preview' }
}

export function useFlags() {
  const ctx = useContext(FeatureFlagsContext)
  return ctx ?? {
    get: () => 'off',
    enabled: () => false,
    all: () => ({}),
    set: () => {},
    setMany: () => {},
    clear: () => {},
    clearAll: () => {},
    saveToProfile: async () => false,
    clearProfileOverrides: async () => false,
  }
}
