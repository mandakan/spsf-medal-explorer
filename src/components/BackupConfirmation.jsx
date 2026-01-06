import { useEffect } from 'react'

/**
 * Success modal after backup creation
 * Shows filename and educational tips
 * WCAG 2.1 AA compliant with proper ARIA
 */
export default function BackupConfirmation({ filename, onClose }) {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 8000)
    return () => clearTimeout(timer)
  }, [onClose])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-confirmation-title"
        className="
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[90%] max-w-md
          bg-bg-primary
          border-2 border-border
          rounded-xl shadow-2xl
          p-6 z-50
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
            id="backup-confirmation-title"
            className="text-2xl font-bold text-foreground"
          >
            Säkerhetskopia skapad
          </h2>
        </div>

        {/* Filename */}
        <div
          className="
            mb-6 p-4 rounded-lg
            bg-bg-secondary
            border border-border
          "
        >
          <p className="text-sm text-muted-foreground mb-1">
            Fil sparad som:
          </p>
          <p className="font-mono text-foreground break-all">
            {filename}
          </p>
        </div>

        {/* Educational Tips */}
        <div
          className="
            mb-6 p-4 rounded-lg
            bg-blue-50 dark:bg-blue-950
            border border-blue-200 dark:border-blue-800
          "
        >
          <h3 className="font-semibold text-foreground mb-2">
            💡 Håll dina data säkra
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Lagra i iCloud Drive, Google Drive eller USB-minne</li>
            <li>• Dina data finns endast på din enhet</li>
            <li>• Säkerhetskopiera regelbundet för att undvika dataförlust</li>
          </ul>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="
            w-full py-3 rounded-lg font-medium
            bg-primary text-primary-foreground
            hover:bg-primary/90
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-offset-2 focus-visible:ring-primary
          "
        >
          Jag förstår
        </button>
      </div>
    </>
  )
}
