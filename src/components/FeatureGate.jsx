import React from 'react'
import { useFlag } from '../contexts/FeatureFlags.jsx'
import DevPreviewOverlay from './DevPreviewOverlay.jsx'

/**
 * name: flag name
 * mode:
 *  - 'preview' (default) => show children under a blocking overlay when state=preview
 *  - 'hide' => hide entirely when state=preview
 */
export default function FeatureGate({ name, mode = 'preview', fallback = null, children }) {
  const { state } = useFlag(name)

  if (state === 'off') return fallback
  if (state === 'preview') {
    if (mode === 'hide') return fallback
    return <DevPreviewOverlay feature={name}>{children}</DevPreviewOverlay>
  }
  return children
}
