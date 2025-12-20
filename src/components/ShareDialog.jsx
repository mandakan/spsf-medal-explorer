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
        setError(e.message || 'Failed to generate QR code')
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
      setError('Failed to copy link')
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
        className="
          w-full max-w-md p-6 rounded-lg
          bg-color-bg-primary border-2 border-color-border
        "
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-color-text-primary mb-4">
          Share Your Progress
        </h2>

        {error && (
          <div
            className="
              mb-4 p-3 rounded-lg
              bg-color-error-bg text-color-error
              border-2 border-color-error
            "
            role="alert"
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
              <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-color-border rounded">
                <span className="text-color-text-secondary">Generating...</span>
              </div>
            )}

            <div className="w-full mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="
                    flex-1 px-3 py-2 rounded border-2 border-color-border
                    bg-color-bg-secondary text-color-text-primary
                  "
                  aria-label="Share link"
                />
                <button
                  onClick={copyLink}
                  className="
                    px-3 py-2 rounded-lg
                    bg-color-primary text-white
                    hover:bg-color-primary-hover
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-offset-2 focus-visible:ring-color-primary
                    min-w-[96px]
                  "
                  aria-label="Copy share link"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="
              px-4 py-2 rounded-lg
              bg-color-bg-secondary text-color-text-primary
              border-2 border-color-border
              hover:bg-color-bg-secondary/70
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-color-primary
            "
            aria-label="Close share dialog"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
