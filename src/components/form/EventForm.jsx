import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'
import { validateEvent } from '../../validators/universalValidator'

export default function EventForm({ medal, onSubmit, loading }) {
  const { values, errors, handleChange, handleSubmit } = useAchievementForm({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      weaponGroup: 'A',
      eventName: '',
      notes: '',
    },
    validate: (vals) => validateEvent(vals, medal),
    onSubmit,
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="e-date" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Date
        </label>
        <input
          id="e-date"
          type="date"
          name="date"
          aria-label="Event date"
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'e-error-date' : undefined}
          value={values.date}
          onChange={handleChange}
          className="w-full px-3 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
          required
        />
        {errors.date && <p id="e-error-date" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="e-weapon-group" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Weapon Group
        </label>
        <select
          id="e-weapon-group"
          name="weaponGroup"
          aria-label="Weapon group"
          aria-invalid={Boolean(errors.weaponGroup)}
          aria-describedby={errors.weaponGroup ? 'e-error-weaponGroup' : undefined}
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
        {errors.weaponGroup && <p id="e-error-weaponGroup" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weaponGroup}</p>}
      </div>

      <div>
        <label htmlFor="e-name" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Event Name
        </label>
        <input
          id="e-name"
          type="text"
          name="eventName"
          aria-label="Event name"
          aria-invalid={Boolean(errors.eventName)}
          aria-describedby={errors.eventName ? 'e-error-name' : undefined}
          value={values.eventName}
          onChange={handleChange}
          className="w-full px-3 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
          required
        />
        {errors.eventName && <p id="e-error-name" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eventName}</p>}
      </div>

      <div>
        <label htmlFor="e-notes" className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Notes (optional)
        </label>
        <textarea
          id="e-notes"
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
        {loading ? 'Saving...' : 'Log Event'}
      </button>
    </form>
  )
}
