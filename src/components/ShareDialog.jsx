import { useEffect, useState } from 'react'
import { toQRCode } from '../utils/exportManager'

export default function ShareDialog({ open, onClose, shareData }) {
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        setError(null)
        const dataUrl = await toQRCode(shareData)
        setQrDataUrl(dataUrl)
      } catch (e) {
        setError(e.message || 'Misslyckades att skapa QR-kod')
      }
    })()
  }, [open, shareData])

  const shareLink = typeof shareData === 'string'
    ? shareData
    : (shareData?.link || '')

  const copyLink = async () => {
    try {
      if (!shareLink) return
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Misslyckades att kopiera länk')
    }
  }

  if (!open) return null

  return (
    <div
      className="
        fixed inset-0 bg-black/50 flex items-center justify-center p-4
      "
      role="dialog"
      aria-modal="true"
      aria-label="Share progress dialog"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-lg bg-bg-secondary border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-foreground mb-4">
          Dela dina framsteg
        </h2>

        {error && (
          <div
            className="
              mb-4 p-3 rounded-lg
              bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300
              border border-red-300 dark:border-red-600
            "
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {!error && (
          <div className="flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code for sharing progress"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center border border-dashed border-border rounded">
                <span className="text-muted-foreground">Skapar...</span>
              </div>
            )}

            <div className="w-full mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3 py-2 rounded border border-border bg-bg-primary text-foreground"
                  aria-label="Share link"
                />
                <button
                  onClick={copyLink}
                  className="btn btn-primary min-w-[96px] min-h-[44px]"
                  aria-label="Copy share link"
                >
                  {copied ? 'Kopierad' : 'Kopiera'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-muted min-h-[44px]"
            aria-label="Stäng delningsdialogen"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  )
}
