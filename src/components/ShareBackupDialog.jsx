import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { isFileShareSupported, shareFile, getShareMessage } from '../utils/shareManager'
import { useBackup } from '../hooks/useBackup'

/**
 * Dialog offering share or download options after backup creation
 * Uses Web Share API on supported devices, download fallback always available
 * WCAG 2.1 AA compliant with proper ARIA attributes
 */
export default function ShareBackupDialog({ blob, filename, onClose, onComplete }) {
  const [error, setError] = useState(null)
  const { markBackupCreated } = useBackup()

  const canShare = isFileShareSupported()
  const shareMessage = getShareMessage()

  // Debug logging
  useEffect(() => {
    console.log('ShareBackupDialog:', {
      canShare,
      hasNavigatorShare: !!navigator.share,
      hasCanShare: !!navigator.canShare,
      userAgent: navigator.userAgent
    })
  }, [canShare])

  // Use ref to avoid stale closures
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const handleShare = async () => {
    // CRITICAL: Call navigator.share() IMMEDIATELY to preserve user gesture
    // Any async operations before this will cause "Permission denied"
    let result
    try {
      result = await shareFile(blob, filename)
    } catch (err) {
      // Share failed - show error
      setError(err.message || 'Delning misslyckades')
      return
    }

    // Now safe to do React state updates after share completes
    if (result.success) {
      try {
        await markBackupCreated()
        if (onComplete) onComplete()
      } catch (err) {
        setError(err.message || 'Kunde inte markera säkerhetskopia som skapad')
      }
    }
    // If cancelled, do nothing - user can try again
  }

  const handleDownload = async () => {
    try {
      // Create download link and trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      // Mark backup as created
      await markBackupCreated()
      if (onComplete) onComplete()
    } catch (err) {
      setError(err.message || 'Nedladdning misslyckades')
    }
  }

  const dialogContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[2000]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-backup-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 28rem)',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 2001
        }}
        className="
          bg-bg-primary
          border-2 border-border
          rounded-xl shadow-2xl
          p-6
        "
      >
        {/* Success Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="
              w-12 h-12 rounded-full
              bg-green-500
              flex items-center justify-center
            "
            aria-hidden="true"
          >
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2
            id="share-backup-title"
            className="text-2xl font-bold text-foreground"
          >
            Säkerhetskopia skapad
          </h2>
        </div>

        {/* Filename Display */}
        <div
          className="
            mb-4 p-4 rounded-lg
            bg-bg-secondary
            border border-border
          "
        >
          <p className="text-sm text-muted-foreground mb-1">
            Fil sparad som:
          </p>
          <p className="font-mono text-sm text-foreground break-all">
            {filename}
          </p>
        </div>

        {/* Cloud Storage Tip */}
        <div
          className="
            mb-6 p-4 rounded-lg
            bg-blue-50 dark:bg-blue-950
            border border-blue-200 dark:border-blue-800
          "
        >
          <p className="font-semibold text-foreground mb-2">
            💾 {canShare ? shareMessage : 'Spara din säkerhetskopia'}
          </p>
          <p className="text-sm text-muted-foreground">
            {canShare
              ? 'Tryck "Dela till molnet" för att spara i din molnlagring'
              : 'Ladda ner och ladda upp till din föredragna molnlagring'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="
              mb-4 p-3 rounded-lg
              bg-red-50 dark:bg-red-950
              border border-red-200 dark:border-red-800
              text-red-800 dark:text-red-200
            "
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {canShare && (
            <button
              onClick={handleShare}
              className="
                w-full py-3 rounded-lg font-medium
                bg-primary text-primary-foreground
                hover:bg-primary/90
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-offset-2 focus-visible:ring-primary
                flex items-center justify-center gap-2
                min-h-[44px]
              "
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Dela till molnet
            </button>
          )}

          <button
            onClick={handleDownload}
            className="
              w-full py-3 rounded-lg font-medium
              bg-bg-secondary text-foreground
              border-2 border-border
              hover:bg-bg-tertiary
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-border
              flex items-center justify-center gap-2
              min-h-[44px]
            "
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Ladda ner till enhet
          </button>

          <button
            onClick={onClose}
            className="
              w-full py-2 text-muted-foreground
              hover:text-foreground
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-border
              rounded
            "
          >
            Stäng
          </button>
        </div>
      </div>
    </>
  )

  return createPortal(dialogContent, document.body)
}
