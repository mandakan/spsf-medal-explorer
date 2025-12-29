import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFlags } from '../hooks/useFeatureFlags'
import flagsConfig from '../config/featureFlags.js'
import { useProfile } from '../hooks/useProfile'

const ADMIN_PASSWORD = 'spsf-admin' // Hard-coded per requirement

export default function AdminFeatureFlagsDialog({ open, onClose }) {
  const flagsCtx = useFlags()
  const { currentProfile, hydrated } = useProfile()
  const [authed, setAuthed] = useState(false)
  const [pass, setPass] = useState('')
  const [draft, setDraft] = useState(() => flagsCtx.all())

  const knownFlags = useMemo(() => {
    const names = Object.keys(flagsConfig || flagsCtx.all() || {})
    return names.map(name => ({
      name,
      state: draft[name] ?? flagsCtx.get(name) ?? 'off',
      meta: flagsConfig?.[name] || {},
    }))
  }, [draft, flagsCtx])

  if (!open) return null

  const canContinue = pass === ADMIN_PASSWORD

  const onSave = async () => {
    flagsCtx.setMany(draft)
    if (hydrated && currentProfile) {
      await flagsCtx.saveToProfile?.(draft)
    }
    onClose?.()
  }

  const onReset = async () => {
    flagsCtx.clearAll()
    setDraft({})
    if (hydrated && currentProfile) {
      await flagsCtx.clearProfileOverrides?.()
    }
    onClose?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose?.()
    if (!authed && e.key === 'Enter' && canContinue) setAuthed(true)
  }

  const headingId = 'admin-flags-heading'

  const content = (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6 bg-black/50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <div
        className="card flex-none w-full max-w-md sm:max-w-lg md:max-w-2xl p-4 md:p-6 mx-auto overflow-auto max-h-[calc(100dvh-3rem)]"
        onClick={e => e.stopPropagation()}
      >
        {!authed ? (
          <>
            <h2 id={headingId} className="section-title mb-2">Admin-läge</h2>
            <p className="text-sm text-muted-foreground mb-3">Ange lösenord för att hantera feature-gates.</p>
            <label className="field-label sr-only" htmlFor="admin-password">Lösenord</label>
            <input
              id="admin-password"
              type="password"
              className="input mb-3"
              placeholder="Lösenord"
              value={pass}
              onChange={e => setPass(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Avbryt</button>
              <button type="button" className="btn btn-primary" onClick={() => canContinue && setAuthed(true)} disabled={!canContinue}>Fortsätt</button>
            </div>
          </>
        ) : (
          <>
            <h2 id={headingId} className="section-title mb-2">Feature-flaggor</h2>
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
              {knownFlags.map(f => (
                <div key={f.name} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{f.meta.title || f.name}</div>
                    {f.meta.message && <div className="text-xs text-muted-foreground truncate">{f.meta.message}</div>}
                  </div>
                  <label className="sr-only" htmlFor={`flag-${f.name}`}>{f.meta.title || f.name}</label>
                  <select
                    id={`flag-${f.name}`}
                    className="select shrink-0 w-36 sm:w-40 md:w-44"
                    value={draft[f.name] ?? 'off'}
                    onChange={e => setDraft(prev => ({ ...prev, [f.name]: e.target.value }))}
                  >
                    <option value="off">Off</option>
                    <option value="preview">Preview</option>
                    <option value="on">On</option>
                  </select>
                </div>
              ))}
              {knownFlags.length === 0 && (
                <div className="text-sm text-muted-foreground">Inga flaggor hittades.</div>
              )}
            </div>
            <div className="flex gap-2 justify-between mt-4 safe-bottom">
              <button type="button" className="btn btn-muted" onClick={onReset}>Återställ till default</button>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Stäng</button>
                <button type="button" className="btn btn-primary" onClick={onSave}>Spara</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
