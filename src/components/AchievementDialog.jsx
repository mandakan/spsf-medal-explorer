import React, { useEffect, useMemo, useState } from 'react'
import MobileBottomSheet from './MobileBottomSheet'

const currentYear = new Date().getFullYear()

export default function AchievementDialog({
  open,
  onClose,
  initialRow,
  onSave,
  WG = ['A', 'B', 'C', 'R'],
  COMP_TYPES = ['national', 'regional/landsdels', 'crewmate/krets', 'championship'],
  MEDAL_TYPES = ['bronze', 'silver', 'gold'],
  APP_TIME_OPTIONS = [
    { value: 60, label: '60, Bronze' },
    { value: 40, label: '40, Silver' },
    { value: 17, label: '17, Gold A/R' },
    { value: 15, label: '15, Gold B/C' },
  ],
}) {
  const [form, setForm] = useState(initialRow || {})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(initialRow || {})
      setErrors({})
    }
  }, [open, initialRow])

  const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }))

  const validate = useMemo(() => {
    return (row) => {
      const errs = []
      const y = Number(row.year)
      if (!Number.isFinite(y) || y < 2000 || y > currentYear) {
        errs.push(`Year must be between 2000 and ${currentYear}`)
      }
      if (!WG.includes(row.weaponGroup)) {
        errs.push('Invalid group (A, B, C, R)')
      }

      switch (row.type) {
        case 'precision_series': {
          const p = Number(row.points)
          if (!Number.isFinite(p) || p < 0 || p > 50) {
            errs.push('Points must be 0–50')
          }
          break
        }
        case 'application_series': {
          const d = new Date(row.date)
          if (!row.date || Number.isNaN(d.getTime())) {
            errs.push('Date is invalid')
          } else {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            d.setHours(0, 0, 0, 0)
            if (d.getTime() > today.getTime()) {
              errs.push('Date cannot be in the future')
            }
          }
          const allowed = APP_TIME_OPTIONS.map(o => o.value)
          const t = Number(row.timeSeconds)
          if (!Number.isFinite(t) || !allowed.includes(t)) {
            errs.push('Select a valid time')
          }
          const h = Number(row.hits)
          if (!Number.isFinite(h) || h < 0) {
            errs.push('Enter a valid hits number')
          }
          break
        }
        case 'competition_result': {
          const ct = String(row.competitionType || '').toLowerCase()
          const mt = String(row.medalType || '').toLowerCase()
          if (!COMP_TYPES.includes(ct)) errs.push('Select a valid competition type')
          if (!MEDAL_TYPES.includes(mt)) errs.push('Select a valid medal type')
          break
        }
        default:
          break
      }
      return errs
    }
  }, [WG, COMP_TYPES, MEDAL_TYPES, APP_TIME_OPTIONS])

  const onSubmit = (addAnother = false) => {
    const errs = validate(form)
    if (errs.length) {
      setErrors({ list: errs })
      return
    }
    onSave?.(form, { addAnother })
    if (!addAnother) onClose?.()
    else {
      // reset type-specific fields but keep year/group/type
      const base = {
        year: form.year,
        weaponGroup: form.weaponGroup,
        type: form.type,
        date: new Date().toISOString().slice(0, 10),
        timeSeconds: '',
        hits: '',
        points: '',
        competitionType: '',
        medalType: '',
        competitionName: '',
        weapon: '',
        score: '',
        teamName: '',
        position: '',
        participants: '',
        eventName: '',
        notes: '',
      }
      setForm(base)
      setErrors({})
    }
  }

  return (
    <MobileBottomSheet
      id="batch-row-editor"
      title="Achievement"
      open={open}
      onClose={onClose}
      swipeToDismiss
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(false) }} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="br-year" className="field-label mb-2">Year</label>
            <input
              id="br-year"
              type="number"
              min="2000"
              max={currentYear}
              className="input py-3"
              value={form.year ?? currentYear}
              onChange={(e) => setField('year', Number(e.target.value))}
              aria-invalid={errors.list?.some(e => /year/i.test(e)) || undefined}
            />
          </div>

          <div>
            <label htmlFor="br-group" className="field-label mb-2">Group</label>
            <select
              id="br-group"
              className="select py-3"
              value={form.weaponGroup ?? 'A'}
              onChange={(e) => setField('weaponGroup', e.target.value)}
              aria-invalid={errors.list?.some(e => /group/i.test(e)) || undefined}
            >
              {WG.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="br-type" className="field-label mb-2">Type</label>
          <select
            id="br-type"
            className="select py-3"
            value={form.type || 'precision_series'}
            onChange={(e) => setField('type', e.target.value)}
          >
            <option value="precision_series">Precision Series</option>
            <option value="application_series">Application Series</option>
            <option value="competition_result">Competition Result</option>
            <option value="qualification_result">Qualification</option>
            <option value="team_event">Team Event</option>
            <option value="event">Event</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {form.type === 'precision_series' && (
          <div>
            <label htmlFor="br-points" className="field-label mb-2">Points (0–50)</label>
            <input
              id="br-points"
              type="number"
              min="0"
              max="50"
              className="input py-3"
              value={form.points ?? ''}
              onChange={(e) => setField('points', e.target.value)}
              aria-invalid={errors.list?.some(e => /points?/i.test(e)) || undefined}
            />
          </div>
        )}

        {form.type === 'application_series' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="br-date" className="field-label mb-2">Date</label>
              <input
                id="br-date"
                type="date"
                className="input py-3"
                value={form.date ?? new Date().toISOString().slice(0,10)}
                onChange={(e) => setField('date', e.target.value)}
                aria-invalid={errors.list?.some(e => /date/i.test(e)) || undefined}
              />
            </div>
            <div>
              <label htmlFor="br-time" className="field-label mb-2">Time</label>
              <select
                id="br-time"
                className="select py-3"
                value={form.timeSeconds === '' ? '' : Number(form.timeSeconds)}
                onChange={(e) => setField('timeSeconds', e.target.value === '' ? '' : Number(e.target.value))}
                aria-invalid={errors.list?.some(e => /time/i.test(e)) || undefined}
              >
                <option value="">Select time…</option>
                {APP_TIME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="br-hits" className="field-label mb-2">Hits</label>
              <input
                id="br-hits"
                type="number"
                min="0"
                className="input py-3"
                value={form.hits ?? ''}
                onChange={(e) => setField('hits', e.target.value)}
                aria-invalid={errors.list?.some(e => /hits?/i.test(e)) || undefined}
              />
            </div>
          </div>
        )}

        {form.type === 'competition_result' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="br-ctype" className="field-label mb-2">Competition Type</label>
              <select
                id="br-ctype"
                className="select py-3"
                value={form.competitionType ?? ''}
                onChange={(e) => setField('competitionType', e.target.value)}
              >
                <option value="">Select type…</option>
                {COMP_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="br-mtype" className="field-label mb-2">Medal</label>
              <select
                id="br-mtype"
                className="select py-3"
                value={form.medalType ?? ''}
                onChange={(e) => setField('medalType', e.target.value)}
              >
                <option value="">Select medal…</option>
                {MEDAL_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="br-cname" className="field-label mb-2">Name (optional)</label>
              <input
                id="br-cname"
                type="text"
                className="input py-3"
                value={form.competitionName ?? ''}
                onChange={(e) => setField('competitionName', e.target.value)}
              />
            </div>
          </div>
        )}

        {form.type === 'qualification_result' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="br-weapon" className="field-label mb-2">Weapon</label>
              <input
                id="br-weapon"
                type="text"
                className="input py-3"
                value={form.weapon ?? ''}
                onChange={(e) => setField('weapon', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="br-score" className="field-label mb-2">Score</label>
              <input
                id="br-score"
                type="number"
                className="input py-3"
                value={form.score ?? ''}
                onChange={(e) => setField('score', e.target.value)}
              />
            </div>
          </div>
        )}

        {form.type === 'team_event' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="br-team" className="field-label mb-2">Team</label>
              <input
                id="br-team"
                type="text"
                className="input py-3"
                value={form.teamName ?? ''}
                onChange={(e) => setField('teamName', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="br-pos" className="field-label mb-2">Position</label>
              <input
                id="br-pos"
                type="number"
                min="1"
                className="input py-3"
                value={form.position ?? ''}
                onChange={(e) => setField('position', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="br-part" className="field-label mb-2">Participants</label>
              <input
                id="br-part"
                type="text"
                className="input py-3"
                placeholder="Anna, Björn, Carin"
                value={form.participants ?? ''}
                onChange={(e) => setField('participants', e.target.value)}
              />
            </div>
          </div>
        )}

        {(form.type === 'event' || form.type === 'custom') && (
          <div>
            <label htmlFor="br-ename" className="field-label mb-2">Title</label>
            <input
              id="br-ename"
              type="text"
              className="input py-3"
              value={form.eventName ?? ''}
              onChange={(e) => setField('eventName', e.target.value)}
            />
          </div>
        )}

        <div>
          <label htmlFor="br-notes" className="field-label mb-2">Notes (optional)</label>
          <textarea
            id="br-notes"
            className="textarea py-3 resize-none"
            rows={3}
            value={form.notes ?? ''}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </div>

        {errors.list?.length ? (
          <div role="alert" className="card p-3 text-sm text-red-600 dark:text-red-400">
            {errors.list.join(', ')}
          </div>
        ) : null}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-muted" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-muted" onClick={() => onSubmit(true)}>Add &amp; add another</button>
          <button type="submit" className="btn btn-primary">Add to batch</button>
        </div>
      </form>
    </MobileBottomSheet>
  )
}
