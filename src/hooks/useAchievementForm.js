import { useCallback, useMemo, useRef, useState } from 'react'

/**
 * Generic form state + validation hook for achievement forms.
 * - Ensures 44px min touch targets via py-3 in components
 * - Exposes simple change/submit API
 */
export function useAchievementForm({ initialValues, validate, onSubmit }) {
  const [values, setValues] = useState({ ...(initialValues || {}) })
  const [errors, setErrors] = useState({})
  const touchStart = useRef(null)

  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target
    let next = value
    if (type === 'number') {
      const n = Number(value)
      next = Number.isFinite(n) ? n : value
    }
    setValues((prev) => ({ ...prev, [name]: next }))
  }, [])

  const runValidation = useCallback((vals) => {
    if (typeof validate === 'function') {
      const result = validate(vals)
      return result || {}
    }
    return {}
  }, [validate])

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()
    const nextErrors = runValidation(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }
    await onSubmit?.(values)
  }, [onSubmit, runValidation, values])

  // Optional touch gesture (swipe down to dismiss) support can be added by consumers if desired
  const formProps = useMemo(() => {
    return {
      onTouchStart: (e) => {
        const t = e.changedTouches?.[0]
        if (t) touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() }
      },
      onTouchEnd: () => {
        touchStart.current = null
      },
    }
  }, [])

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    validate: runValidation,
    formProps,
    setValues,
    setErrors,
  }
}
