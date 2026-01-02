import React from 'react'
import { useOnboardingGate } from '../hooks/useOnboardingGate'
import GuestModeBanner from './GuestModeBanner'
import ProfilePromptBanner from './ProfilePromptBanner'
import OnboardingChoiceBanner from './OnboardingChoiceBanner'

export default function ProfileExperienceBanner({ idPrefix = 'default', promptId }) {
  const { isProfileLoading, showOnboarding, isGuest, chooseGuest, chooseSaved } = useOnboardingGate()

  if (isProfileLoading) return null

  if (showOnboarding) {
    return (
      <OnboardingChoiceBanner
        idPrefix={idPrefix}
        onChooseGuest={chooseGuest}
        onChooseSaved={chooseSaved}
      />
    )
  }

  if (isGuest) {
    return <GuestModeBanner idPrefix={idPrefix} />
  }

  const id = promptId || `profile-picker-${idPrefix}`
  return <ProfilePromptBanner id={id} />
}
