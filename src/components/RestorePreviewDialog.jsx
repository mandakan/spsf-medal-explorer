import { useMemo } from 'react'
import { createPortal } from 'react-dom'

/**
 * Preview backup contents before restoring
 * Shows metadata and record counts
 * WCAG 2.1 AA compliant
 */
export default function RestorePreviewDialog({
  backup,
  onRestore,
  onCancel
}) {
  // Extract metadata
  const metadata = useMemo(() => {
    const date = backup.exportedAt || backup.profile?.lastModified || backup.profile?.createdDate
    const version = backup.version || '1.0'
    const achievementCount = backup.profile?.prerequisites?.length || 0
    const medalCount = backup.profile?.unlockedMedals?.length || 0

    return { date, version, achievementCount, medalCount }
  }, [backup])

  const dialogContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[2000]"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-preview-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 32rem)',
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
        {/* Title */}
        <h2
          id="restore-preview-title"
          className="text-2xl font-bold text-foreground mb-6"
        >
          Återställ från säkerhetskopia
        </h2>

        {/* Warning */}
        <div
          className="
            mb-6 p-4 rounded-lg
            bg-yellow-50 dark:bg-yellow-950
            border-2 border-yellow-400 dark:border-yellow-600
          "
          role="alert"
        >
          <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
            ⚠️ Detta kommer att ersätta dina nuvarande data
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Se till att du har en säkerhetskopia av dina nuvarande framsteg innan du återställer.
          </p>
        </div>

        {/* Backup Details */}
        <div className="mb-6 space-y-3">
          <h3 className="font-semibold text-foreground mb-3">
            Information om säkerhetskopia
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-bg-secondary border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Skapad
              </p>
              <p className="font-semibold text-foreground">
                {metadata.date
                  ? new Date(metadata.date).toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Okänt datum'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-bg-secondary border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Format
              </p>
              <p className="font-semibold text-foreground">
                v{metadata.version}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-bg-secondary border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Aktiviteter
              </p>
              <p className="font-semibold text-foreground">
                {metadata.achievementCount}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-bg-secondary border border-border">
              <p className="text-xs text-muted-foreground mb-1">
                Upplåsta märken
              </p>
              <p className="font-semibold text-foreground">
                {metadata.medalCount}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="
              flex-1 py-3 rounded-lg font-medium
              bg-bg-secondary text-foreground
              border-2 border-border
              hover:bg-bg-tertiary
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-border
            "
          >
            Avbryt
          </button>

          <button
            onClick={onRestore}
            className="
              flex-1 py-3 rounded-lg font-medium
              bg-primary text-primary-foreground
              hover:bg-primary/90
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-primary
            "
          >
            Återställ nu
          </button>
        </div>
      </div>
    </>
  )

  return createPortal(dialogContent, document.body)
}
