import React, { useMemo, useState } from 'react'
import MobileBottomSheet from './MobileBottomSheet'

const currentYear = new Date().getFullYear()

export default function AchievementDialog({
  open,
  onClose,
  initialRow,
  onSave,
  mode = 'batch',
  submitLabel,
  WG = ['A', 'B', 'C', 'R'],
  DISCIPLINE_TYPES = ['field', 'precision', 'military_fast'],
  COMP_TYPES = ['national', 'regional/landsdels', 'crewmate/krets', 'championship'],
  MEDAL_TYPES = ['bronze', 'silver', 'gold'],
  APP_TIME_OPTIONS = [
    { value: 60, label: '60, Brons' },
    { value: 40, label: '40, Silver' },
    { value: 17, label: '17, Guld A/R' },
    { value: 15, label: '15, Guld B/C' },
  ],
}) {
  // Remount the form content when dialog opens or initialRow changes to avoid setState in effects
  const resetKey = useMemo(
    () => (open ? JSON.stringify(initialRow ?? {}) : 'closed'),
    [open, initialRow]
  )

  return (
    <MobileBottomSheet
      id="batch-row-editor"
      title="Aktivitet"
      open={open}
      onClose={onClose}
      swipeToDismiss
    >
      {open ? (
        <FormContent
          key={resetKey}
          initialRow={initialRow}
          onSave={onSave}
          onClose={onClose}
          mode={mode}
          submitLabel={submitLabel}
          WG={WG}
          DISCIPLINE_TYPES={DISCIPLINE_TYPES}
          COMP_TYPES={COMP_TYPES}
          MEDAL_TYPES={MEDAL_TYPES}
          APP_TIME_OPTIONS={APP_TIME_OPTIONS}
        />
      ) : null}
    </MobileBottomSheet>
  )
}

function FormContent({
  initialRow,
  onSave,
  onClose,
  mode = 'batch',
  submitLabel,
  WG,
  DISCIPLINE_TYPES,
  COMP_TYPES,
  MEDAL_TYPES,
  APP_TIME_OPTIONS,
}) {
  const [form, setForm] = useState(() => initialRow || {})
  const [errors, setErrors] = useState({})

  const setField = (name, value) => setForm(prev => ({ ...prev, [name]: value }))

  const validate = useMemo(() => {
    return (row) => {
      const errs = []
      const y = Number(row.year)
      if (!Number.isFinite(y) || y < 1900 || y > currentYear) {
        errs.push(`Året måste vara mellan 1900 och ${currentYear}`)
      }
      if (!WG.includes(row.weaponGroup)) {
        errs.push('Ogiltig grupp (A, B, C, R)')
      }

      switch (row.type) {
        case 'precision_series': {
          const p = Number(row.points)
          if (!Number.isFinite(p) || p < 0 || p > 50) {
            errs.push('Poäng måste vara 0-50')
          }
          break
        }
        case 'application_series': {
          const d = new Date(row.date)
          if (!row.date || Number.isNaN(d.getTime())) {
            errs.push('Ogiltigt datum')
          } else {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            d.setHours(0, 0, 0, 0)
            if (d.getTime() > today.getTime()) {
              errs.push('Datum kan inte vara i framtiden')
            }
          }
          const allowed = APP_TIME_OPTIONS.map(o => o.value)
          const t = Number(row.timeSeconds)
          if (!Number.isFinite(t) || !allowed.includes(t)) {
            errs.push('Välj giltig tid')
          }
          const h = Number(row.hits)
          if (!Number.isFinite(h) || h < 0) {
            errs.push('Ange giltigt antal träffar')
          }
          break
        }
        case 'competition_result': {
          const ct = String(row.competitionType || '').toLowerCase()
          const mt = String(row.medalType || '').toLowerCase()
          if (!COMP_TYPES.includes(ct)) errs.push('Välj giltig tävlingstyp')
          if (!MEDAL_TYPES.includes(mt)) errs.push('Välj giltig märkestyp')
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
        disciplineType: '',
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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(false) }} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="br-year" className="field-label mb-2">År</label>
          <input
            id="br-year"
            type="number"
            min="1900"
            max={currentYear}
            className="input py-3"
            value={form.year ?? currentYear}
            onChange={(e) => setField('year', Number(e.target.value))}
            aria-invalid={errors.list?.some(e => /year/i.test(e)) || undefined}
          />
        </div>

        <div>
          <label htmlFor="br-group" className="field-label mb-2">Grupp</label>
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
          <option value="precision_series">Precisionsserier</option>
          <option value="application_series">Tillämpningsserier</option>
          <option value="standard_medal">Standardmedalj</option>
          <option value="competition_result">Tävlingsresultat</option>
          <option value="qualification_result">Kvalificering</option>
          <option value="team_event">Lag-eventt</option>
          <option value="event">Event</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {form.type === 'precision_series' && (
        <div>
          <label htmlFor="br-points" className="field-label mb-2">Poäng (0-50)</label>
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
            <label htmlFor="br-date" className="field-label mb-2">Datum</label>
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
            <label htmlFor="br-time" className="field-label mb-2">Tid</label>
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

      {form.type === 'standard_medal' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="br-ctype" className="field-label mb-2">Gren</label>
            <select
              id="br-ctype"
              className="select py-3"
              value={form.disciplineType ?? ''}
              onChange={(e) => setField('disciplineType', e.target.value)}
            >
              <option value="">Välj disciplin...</option>
              {DISCIPLINE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="br-mtype" className="field-label mb-2">Medalj</label>
            <select
              id="br-mtype"
              className="select py-3"
              value={form.medalType ?? ''}
              onChange={(e) => setField('medalType', e.target.value)}
            >
              <option value="">Välj medalj...</option>
              {MEDAL_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="br-cname" className="field-label mb-2">Namn (valfritt)</label>
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

      {form.type === 'competition_result' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="br-ctype" className="field-label mb-2">Tävlingstyp</label>
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
            <label htmlFor="br-mtype" className="field-label mb-2">Märke</label>
            <select
              id="br-mtype"
              className="select py-3"
              value={form.medalType ?? ''}
              onChange={(e) => setField('medalType', e.target.value)}
            >
              <option value="">Välj märke...</option>
              {MEDAL_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="br-cname" className="field-label mb-2">Namn (valfritt)</label>
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
            <label htmlFor="br-weapon" className="field-label mb-2">Vapen</label>
            <input
              id="br-weapon"
              type="text"
              className="input py-3"
              value={form.weapon ?? ''}
              onChange={(e) => setField('weapon', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="br-score" className="field-label mb-2">Poäng</label>
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
            <label htmlFor="br-team" className="field-label mb-2">Lag</label>
            <input
              id="br-team"
              type="text"
              className="input py-3"
              value={form.teamName ?? ''}
              onChange={(e) => setField('teamName', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="br-pos" className="field-label mb-2">Placering</label>
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
            <label htmlFor="br-part" className="field-label mb-2">Deltagare</label>
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
          <label htmlFor="br-ename" className="field-label mb-2">Titel</label>
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
        <label htmlFor="br-notes" className="field-label mb-2">Anteckningar (valfritt)</label>
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

      {mode === 'batch' ? (
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-muted" onClick={onClose}>Avbryt</button>
          <button type="button" className="btn btn-muted" onClick={() => onSubmit(true)}>Lägg till &amp; lägg till en till</button>
          <button type="submit" className="btn btn-primary">Lägg till batch</button>
        </div>
      ) : (
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-muted" onClick={onClose}>Avbryt</button>
          <button type="submit" className="btn btn-primary">{submitLabel || 'Spara'}</button>
        </div>
      )}
    </form>
  )
}
