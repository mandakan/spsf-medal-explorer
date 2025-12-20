import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'
import { validateTeamEvent } from '../../validators/universalValidator'

export default function TeamEventForm({ medal, onSubmit, loading }) {
  const { values, errors, handleChange, handleSubmit } = useAchievementForm({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      weaponGroup: 'A',
      teamName: '',
      position: '',
      participants: '',
      notes: '',
    },
    validate: (vals) => validateTeamEvent(vals, medal),
    onSubmit,
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="t-date" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
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
          className="w-full px-3 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
          required
        />
        {errors.date && <p id="t-error-date" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="t-weapon-group" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
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
          className="w-full px-3 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600 cursor-pointer"
          required
        >
          <option value="A">Group A</option>
          <option value="B">Group B</option>
          <option value="C">Group C</option>
          <option value="R">Group R</option>
        </select>
        {errors.weaponGroup && <p id="t-error-weaponGroup" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weaponGroup}</p>}
      </div>

      <div>
        <label htmlFor="t-team" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
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
          className="w-full px-3 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
          required
        />
        {errors.teamName && <p id="t-error-team" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.teamName}</p>}
      </div>

      <div>
        <label htmlFor="t-position" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
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
          className="w-full px-3 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
          required
        />
        {errors.position && <p id="t-error-position" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.position}</p>}
      </div>

      <div>
        <label htmlFor="t-participants" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Participants (comma-separated)
        </label>
        <input
          id="t-participants"
          type="text"
          name="participants"
          aria-label="Participants"
          value={values.participants}
          onChange={handleChange}
          className="w-full px-3 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
          placeholder="Anna, Björn, Carin"
        />
      </div>

      <div>
        <label htmlFor="t-notes" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Notes (optional)
        </label>
        <textarea
          id="t-notes"
          name="notes"
          aria-label="Notes"
          value={values.notes}
          onChange={handleChange}
          className="w-full px-3 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600 resize-none"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
      >
        {loading ? 'Saving...' : 'Log Team Event'}
      </button>
    </form>
  )
}
