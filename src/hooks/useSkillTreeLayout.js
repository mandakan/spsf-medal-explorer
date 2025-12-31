import { useMemo } from 'react'
import { useMedalDatabase } from './useMedalDatabase'
import { getLayout, DEFAULT_LAYOUT_ID } from '../logic/layouts'

export function useSkillTreeLayout(presetId) {
  const { medalDatabase } = useMedalDatabase()

  const preset = useMemo(() => {
    return getLayout(presetId || DEFAULT_LAYOUT_ID)
  }, [presetId])

  const medals = useMemo(() => {
    return medalDatabase?.getAllMedals?.() || []
  }, [medalDatabase])

  const layout = useMemo(() => {
    if (!preset || !medals || medals.length === 0) return null
    return preset.generator(medals, preset.defaultOptions)
  }, [preset, medals])

  return { layout, preset }
}
