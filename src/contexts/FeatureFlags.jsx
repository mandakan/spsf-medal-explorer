import React, { createContext, useContext, useMemo } from 'react'
import flagsConfig from '../config/featureFlags.js'

const FeatureFlagsContext = createContext(null)

function parseQuery() {
  try {
    const sp = new URLSearchParams(window.location.search)
    const raw = sp.get('ff')
    if (!raw) return {}
    return raw.split(',').reduce((acc, part) => {
      const [k, v] = part.split(':')
      if (k && v) acc[k.trim()] = v.trim()
      return acc
    }, {})
  } catch {
    return {}
  }
}

function loadLocalOverrides() {
  try {
    return JSON.parse(localStorage.getItem('ff:overrides') || '{}')
  } catch {
    return {}
  }
}

function detectEnv() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) return import.meta.env.MODE
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) return process.env.NODE_ENV
  return 'production'
}

export function FeatureFlagsProvider({ children }) {
  const env = detectEnv()
  const overrides = typeof window !== 'undefined' ? loadLocalOverrides() : {}
  const query = typeof window !== 'undefined' ? parseQuery() : {}

  const flags = useMemo(() => {
    const out = {}
    for (const [name, def] of Object.entries(flagsConfig || {})) {
      const base = def.default || 'off'
      const envState = def.env?.[env] ?? base
      const local = overrides[name]
      const fromQuery = query[name]
      out[name] = fromQuery || local || envState
    }
    return out
  }, [env])

  const api = {
    get(name) { return flags[name] || 'off' },
    enabled(name) {
      const s = flags[name] || 'off'
      return s === 'on' || s === 'preview'
    },
    all() { return { ...flags } },
  }

  return <FeatureFlagsContext.Provider value={api}>{children}</FeatureFlagsContext.Provider>
}

export function useFlag(name) {
  const ctx = useContext(FeatureFlagsContext)
  const state = ctx?.get(name) ?? 'off'
  return { state, enabled: state === 'on' || state === 'preview' }
}

export function useFlags() {
  const ctx = useContext(FeatureFlagsContext)
  return ctx ?? { get: () => 'off', enabled: () => false, all: () => ({}) }
}
