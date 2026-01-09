import React from 'react'
import { createPortal } from 'react-dom'
import UniversalAchievementLogger from './UniversalAchievementLogger'
import Icon from './Icon'

/**
 * Dialog wrapper for context-aware achievement entry.
 * Allows logging achievements directly from medal cards/details.
 */
export default function AchievementEntryDialog({ medal, open, onClose }) {
  if (!open || !medal) return null

  const dialogContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[3000]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Container - Mobile bottom sheet, Desktop centered */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-entry-title"
        style={{
          position: 'fixed',
          zIndex: 3001,
          inset: 0,
          display: 'flex',
          alignItems: 'flex-end',
        }}
        className="sm:items-center sm:justify-center"
      >
        <div
          style={{
            width: '100%',
            maxWidth: '42rem',
            maxHeight: '90vh',
            overflow: 'hidden',
          }}
          className="
            bg-bg-primary rounded-t-xl sm:rounded-xl shadow-xl
            flex flex-col
            border-t border-border sm:border
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-bg-secondary">
            <h2
              id="achievement-entry-title"
              className="text-lg font-semibold text-text-primary"
            >
              Logga aktivitet
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Stäng"
            >
              <Icon name="X" className="w-5 h-5" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            <UniversalAchievementLogger
              medal={medal}
              onSuccess={onClose}
              unlockMode={false}
            />
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(dialogContent, document.body)
}
