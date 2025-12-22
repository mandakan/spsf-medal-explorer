/**
 * Calculate age in whole years from an ISO date string (YYYY-MM-DD) or Date-parsable string.
 * Throws if the input is invalid.
 * @param {string} dateOfBirth
 * @returns {number}
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    throw new Error('dateOfBirth must be a non-empty string')
  }
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) {
    throw new Error('Invalid dateOfBirth')
  }
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}
