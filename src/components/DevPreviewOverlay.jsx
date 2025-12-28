import React from 'react'
import flags from '../config/featureFlags.js'
import Icon from './Icon'

export default function DevPreviewOverlay({ feature, children }) {
  const cfg = flags?.[feature] || {}
  const title = cfg.title || 'Feature i utveckling'
  const message = cfg.message || `Den här funktionen (“${feature}”) visas som förhandsvisning.`

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-60 [filter:blur(2px)]">
        {children}
      </div>
      <div
        role="note"
        aria-label="Feature preview"
        className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      >
        <div className="mx-4 max-w-lg rounded-lg border border-border bg-bg-secondary p-4 shadow-lg text-foreground">
          <div className="flex items-start gap-3">
            <Icon name="FlaskConical" className="w-5 h-5" aria-hidden="true" style={{ color: 'var(--color-info)' }} />
            <div>
              <div className="font-semibold leading-5">{title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{message}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
