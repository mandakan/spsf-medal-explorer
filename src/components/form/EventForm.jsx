import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'

export default function EventForm({ onSubmit, loading, preservedValues }) {
  const { values, errors, handleChange, handleSubmit } = useAchievementForm({
    initialValues: {
      date: preservedValues?.date ?? new Date().toISOString().split('T')[0],
      weaponGroup: preservedValues?.weaponGroup ?? 'C',
      eventName: preservedValues?.eventName ?? '',
      notes: '',
    },
    validate: (vals) => {
      const errs = {}
      if (!vals.date) errs.date = 'Datum krävs'
      if (!vals.weaponGroup) errs.weaponGroup = 'Vapengrupp krävs'
      if (!vals.eventName?.trim()) errs.eventName = 'Händelsenamn krävs'
      return errs
    },
    onSubmit,
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="e-date" className="field-label mb-2">
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
          className="input py-3"
          required
        />
        {errors.date && <p id="e-error-date" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="e-weapon-group" className="field-label mb-2">
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
          className="select py-3 cursor-pointer"
          required
        >
          <option value="C">Group C</option>
          <option value="B">Group B</option>
          <option value="A">Group A</option>
          <option value="R">Group R</option>
        </select>
        {errors.weaponGroup && <p id="e-error-weaponGroup" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weaponGroup}</p>}
      </div>

      <div>
        <label htmlFor="e-name" className="field-label mb-2">
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
          className="input py-3"
          required
        />
        {errors.eventName && <p id="e-error-name" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eventName}</p>}
      </div>

      <div>
        <label htmlFor="e-notes" className="field-label mb-2">
          Notes (optional)
        </label>
        <textarea
          id="e-notes"
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
        {loading ? 'Saving...' : 'Log Event'}
      </button>
    </form>
  )
}
