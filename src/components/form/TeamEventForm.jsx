import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'

export default function TeamEventForm({ onSubmit, loading, preservedValues }) {
  const { values, errors, handleChange, handleSubmit } = useAchievementForm({
    initialValues: {
      date: preservedValues?.date ?? new Date().toISOString().split('T')[0],
      weaponGroup: preservedValues?.weaponGroup ?? 'C',
      teamName: preservedValues?.teamName ?? '',
      position: preservedValues?.position ?? '',
      participants: preservedValues?.participants ?? '',
      notes: '',
    },
    validate: (vals) => {
      const errs = {}
      if (!vals.date) errs.date = 'Date is required'
      if (!vals.weaponGroup) errs.weaponGroup = 'Weapon group is required'
      if (!vals.teamName?.trim()) errs.teamName = 'Team name is required'
      const pos = Number(vals.position)
      if (!Number.isFinite(pos) || pos < 1) {
        errs.position = 'Enter a valid position (1 or higher)'
      }
      return errs
    },
    onSubmit,
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="t-date" className="field-label mb-2">
          Date
        </label>
        <input
          id="t-date"
          type="date"
          name="date"
          aria-label="Team event date"
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 't-error-date' : undefined}
          value={values.date}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.date && <p id="t-error-date" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="t-weapon-group" className="field-label mb-2">
          Weapon Group
        </label>
        <select
          id="t-weapon-group"
          name="weaponGroup"
          aria-label="Weapon group"
          aria-invalid={Boolean(errors.weaponGroup)}
          aria-describedby={errors.weaponGroup ? 't-error-weaponGroup' : undefined}
          value={values.weaponGroup}
          onChange={handleChange}
          className="select py-3 cursor-pointer"
          required
        >
          <option value="C">Group C</option>
          <option value="B">Group B</option>
          <option value="A">Group A</option>
          <option value="R">Group R</option>
        </select>
        {errors.weaponGroup && <p id="t-error-weaponGroup" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weaponGroup}</p>}
      </div>

      <div>
        <label htmlFor="t-team" className="field-label mb-2">
          Team Name
        </label>
        <input
          id="t-team"
          type="text"
          name="teamName"
          aria-label="Team name"
          aria-invalid={Boolean(errors.teamName)}
          aria-describedby={errors.teamName ? 't-error-team' : undefined}
          value={values.teamName}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.teamName && <p id="t-error-team" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.teamName}</p>}
      </div>

      <div>
        <label htmlFor="t-position" className="field-label mb-2">
          Position (1-10)
        </label>
        <input
          id="t-position"
          type="number"
          name="position"
          aria-label="Team position"
          aria-invalid={Boolean(errors.position)}
          aria-describedby={errors.position ? 't-error-position' : undefined}
          min={1}
          max={10}
          value={values.position}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.position && <p id="t-error-position" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.position}</p>}
      </div>

      <div>
        <label htmlFor="t-participants" className="field-label mb-2">
          Participants (comma-separated)
        </label>
        <input
          id="t-participants"
          type="text"
          name="participants"
          aria-label="Participants"
          value={values.participants}
          onChange={handleChange}
          className="input py-3"
          placeholder="Anna, Björn, Carin"
        />
      </div>

      <div>
        <label htmlFor="t-notes" className="field-label mb-2">
          Notes (optional)
        </label>
        <textarea
          id="t-notes"
          name="notes"
          aria-label="Notes"
          value={values.notes}
          onChange={handleChange}
          className="textarea py-3 resize-none"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Log Team Event'}
      </button>
    </form>
  )
}
