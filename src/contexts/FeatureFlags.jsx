import React, { useMemo } from 'react'
import flagsConfig from '../config/featureFlags.js'
import { FeatureFlagsContext } from './FeatureFlagsContext.js'

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
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : ''
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development'
  return 'production'
}

export function FeatureFlagsProvider({ children }) {
  const env = detectEnv()
  const flags = useMemo(() => {
    const overrides = typeof window !== 'undefined' ? loadLocalOverrides() : {}
    const query = typeof window !== 'undefined' ? parseQuery() : {}
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


