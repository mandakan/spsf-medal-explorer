import React from 'react'
import MobileBottomSheet from './MobileBottomSheet'

export default function RemoveMedalDialog({
  medal,
  open,
  onClose,
  variant = 'confirm', // 'confirm' | 'blocked'
  blockingMedals = [],
  onConfirmRemove, // async () => { ok: boolean }
}) {
  const idBase = medal ? `remove-medal-${medal.id}` : 'remove-medal'
  const id = `${idBase}-${variant}`

  return (
    <MobileBottomSheet
      id={id}
      title={variant === 'confirm' ? 'Ta bort upplåsning' : 'Kan inte ta bort än'}
      open={open}
      onClose={onClose}
    >
      {variant === 'confirm' ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Det här påverkar inte andra märken.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-muted flex-1 min-h-[44px]"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={async () => {
                const res = await onConfirmRemove?.()
                if (res?.ok) onClose?.()
              }}
              className="btn btn-primary flex-1 min-h-[44px]"
            >
              Ta bort
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            De här upplåsta märkena beror på detta:
          </p>
          <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
            {blockingMedals.map(m => (
              <li key={m.id} className="break-words">
                {m.displayName || m.name}
              </li>
            ))}
          </ul>
          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-muted w-full min-h-[44px]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </MobileBottomSheet>
  )
}
