import React, { useMemo, useState, useContext } from 'react'
import flagsConfig from '../config/featureFlags.js'
import { FeatureFlagsContext } from './FeatureFlagsContext.js'
import { ProfileContext } from './profileContext.js'

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

function persistLocalOverrides(next) {
  try {
    localStorage.setItem('ff:overrides', JSON.stringify(next || {}))
  } catch {
    // ignore storage errors
  }
}

function detectEnv() {
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : ''
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development'
  return 'production'
}

export function FeatureFlagsProvider({ children }) {
  const env = detectEnv()
  const [localOverrides, setLocalOverrides] = useState(() => (typeof window !== 'undefined' ? loadLocalOverrides() : {}))

  // Read profile context if available (provider order may vary)
  const profileCtx = useContext(ProfileContext)
  const currentProfile = profileCtx?.currentProfile
  const updateProfile = profileCtx?.updateProfile
  const profileOverrides = useMemo(() => currentProfile?.features?.featureFlags || {}, [currentProfile])

  const flags = useMemo(() => {
    const query = (typeof window !== 'undefined') ? parseQuery() : {}
    // Start with env defaults
    const out = {}
    for (const [name, def] of Object.entries(flagsConfig || {})) {
      const base = def?.default || 'off'
      const envState = def?.env?.[env] ?? base
      out[name] = envState
    }
    // Apply local overrides (from localStorage)
    for (const [k, v] of Object.entries(localOverrides || {})) out[k] = v
    // Apply profile overrides
    for (const [k, v] of Object.entries(profileOverrides || {})) out[k] = v
    // Highest precedence: query param
    for (const [k, v] of Object.entries(query || {})) out[k] = v
    return out
  }, [env, localOverrides, profileOverrides])

  const setManyLocal = (map) => {
    const next = { ...(localOverrides || {}), ...(map || {}) }
    setLocalOverrides(next)
    persistLocalOverrides(next)
  }

  const api = {
    get(name) { return flags[name] || 'off' },
    enabled(name) { const s = flags[name] || 'off'; return s === 'on' || s === 'preview' },
    all() { return { ...flags } },

    // Reactive local overrides (mirrored to localStorage)
    set(name, value) { setManyLocal({ [name]: value }) },
    setMany(map) { setManyLocal(map) },
    clear(name) {
      const next = { ...(localOverrides || {}) }
      delete next[name]
      setLocalOverrides(next)
      persistLocalOverrides(next)
    },
    clearAll() {
      setLocalOverrides({})
      persistLocalOverrides({})
    },

    // Persist to profile if available (per-profile overrides)
    async saveToProfile(map) {
      if (!updateProfile || !currentProfile) return false
      const features = { ...(currentProfile.features || {}), featureFlags: { ...(map || {}) } }
      await updateProfile({ ...currentProfile, features })
      return true
    },
    async clearProfileOverrides() {
      if (!updateProfile || !currentProfile) return false
      const features = { ...(currentProfile.features || {}) }
      delete features.featureFlags
      await updateProfile({ ...currentProfile, features })
      return true
    },
  }

  return <FeatureFlagsContext.Provider value={api}>{children}</FeatureFlagsContext.Provider>
}


