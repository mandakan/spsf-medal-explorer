import { useCallback, useMemo, useState } from 'react'
import { useProfile } from '../hooks/useProfile'

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
    try { window.localStorage.setItem('app:onboardingChoice', 'guest') } catch {}
    startExplorerMode()
  }, [startExplorerMode])

  const chooseSaved = useCallback(() => {
    try { window.localStorage.setItem('app:onboardingChoice', 'saved') } catch {}
    setDismissed(true)
  }, [])

  return { isProfileLoading, showOnboarding, isGuest, chooseGuest, chooseSaved }
}

export default useOnboardingGate
