import { useCallback, useState } from 'react'
import { DEFAULT_LAYOUT_ID } from '../logic/layouts'

const STORAGE_KEY = 'skilltree:layoutPreset'

function readStoredPreset() {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v && v.length ? v : null
  } catch {
    return null
  }
}

function writeStoredPreset(id) {
  if (typeof window === 'undefined') return
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function useSkillTreeLayoutPreset() {
  const [presetId, setPresetIdState] = useState(() => readStoredPreset() || DEFAULT_LAYOUT_ID)

  const setPresetId = useCallback((nextId) => {
    const id = nextId || DEFAULT_LAYOUT_ID
    setPresetIdState(id)
    writeStoredPreset(id)
  }, [])

  return { presetId, setPresetId }
}
