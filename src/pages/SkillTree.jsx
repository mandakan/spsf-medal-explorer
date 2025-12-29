import React, { useEffect } from 'react'
import SkillTreeCanvas from '../components/SkillTreeCanvas'
import ProfileExperienceBanner from '../components/ProfileExperienceBanner'
import { useProfile } from '../hooks/useProfile'
import { useNavigate, useLocation } from 'react-router-dom'

export default function SkillTree() {

  const { currentProfile, hydrated } = useProfile()
  const isProfileLoading = !hydrated || typeof currentProfile === 'undefined'

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isMobile = window.innerWidth < 768
    const isSkillTreeRoot = location.pathname === '/skill-tree'
    const fromClose = Boolean(location.state?.fromFullscreenClose)
    if (isMobile && isSkillTreeRoot && !fromClose) {
      navigate('/skill-tree/fullscreen', {
        replace: true,
        state: { backgroundLocation: location },
      })
    }
  }, [navigate, location])

  if (isProfileLoading) {
    return null
  }

  return (
    <div className="space-y-6">
      <ProfileExperienceBanner idPrefix="skilltree" promptId="profile-picker-skill-tree" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-text-primary mb-1 sm:mb-0">Trädvy</h1>
      </div>

      <SkillTreeCanvas />
    </div>
  )
}
