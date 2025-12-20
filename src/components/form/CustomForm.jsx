import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'
import { validateCustom } from '../../validators/universalValidator'

export default function CustomForm({ medal, onSubmit, loading }) {
  const { values, errors, handleChange, handleSubmit } = useAchievementForm({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      weaponGroup: 'A',
      eventName: '',
      notes: '',
    },
    validate: (vals) => validateCustom(vals, medal),
    onSubmit,
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="c-date" className="field-label mb-2">
          Date
        </label>
        <input
          id="c-date"
          type="date"
          name="date"
          aria-label="Date"
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'c-error-date' : undefined}
          value={values.date}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.date && <p id="c-error-date" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="c-weapon-group" className="field-label mb-2">
          Weapon Group
        </label>
        <select
          id="c-weapon-group"
          name="weaponGroup"
          aria-label="Weapon group"
          aria-invalid={Boolean(errors.weaponGroup)}
          aria-describedby={errors.weaponGroup ? 'c-error-weaponGroup' : undefined}
          value={values.weaponGroup}
          onChange={handleChange}
          className="select py-3 cursor-pointer"
          required
        >
          <option value="A">Group A</option>
          <option value="B">Group B</option>
          <option value="C">Group C</option>
          <option value="R">Group R</option>
        </select>
        {errors.weaponGroup && <p id="c-error-weaponGroup" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weaponGroup}</p>}
      </div>

      <div>
        <label htmlFor="c-name" className="field-label mb-2">
          Title (optional)
        </label>
        <input
          id="c-name"
          type="text"
          name="eventName"
          aria-label="Title"
          value={values.eventName}
          onChange={handleChange}
          className="input py-3"
        />
      </div>

      <div>
        <label htmlFor="c-notes" className="field-label mb-2">
          Notes
        </label>
        <textarea
          id="c-notes"
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
        {loading ? 'Saving...' : 'Log Achievement'}
      </button>
    </form>
  )
}
