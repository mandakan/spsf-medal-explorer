import { useCallback, useMemo, useState } from 'react'
import { useProfile } from '../hooks/useProfile'

function safeLocalSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function useOnboardingGate() {
  const { currentProfile, startExplorerMode, hydrated } = useProfile()
  const [dismissed, setDismissed] = useState(false)

  const hasOnboardingChoice = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem('app:onboardingChoice')
    } catch {
      return null
    }
  }, [])

  const isProfileLoading = !hydrated || typeof currentProfile === 'undefined'
  const showOnboarding = !isProfileLoading && !currentProfile && !hasOnboardingChoice && !dismissed
  const isGuest = Boolean(currentProfile?.isGuest)

  const chooseGuest = useCallback(() => {
    safeLocalSet('app:onboardingChoice', 'guest')
    startExplorerMode()
  }, [startExplorerMode])

  const chooseSaved = useCallback(() => {
    safeLocalSet('app:onboardingChoice', 'saved')
    setDismissed(true)
  }, [])

  return { isProfileLoading, showOnboarding, isGuest, chooseGuest, chooseSaved }
}
