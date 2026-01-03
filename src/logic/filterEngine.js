function getMedalStatus(medalId, statuses) {
  if (!statuses) return 'locked'
  if (statuses.unlocked?.some(s => s.medalId === medalId)) return 'unlocked'
  if (statuses.eligible?.some(s => s.medalId === medalId)) return 'eligible'
  if (statuses.available?.some(s => s.medalId === medalId)) return 'available'
  return 'locked'
}

export function applyFilters(medals, statuses, filters = {}) {
  if (!Array.isArray(medals)) return []

  const searchLower = (filters.search || '').toLowerCase()

  return medals.filter(medal => {
    const medalStatus = getMedalStatus(medal.id, statuses)

    // Status
    if (filters.status && medalStatus !== filters.status) return false

    // Tier
    if (filters.tier && medal.tier !== filters.tier) return false

    // Type
    if (filters.type && medal.type !== filters.type) return false

    // Weapon group (optional property)
    if (filters.weaponGroup && medal.weaponGroup !== filters.weaponGroup) return false

    // Review state (absence of 'reviewed' means under review)
    const underReview = medal.reviewed !== true
    if (filters.reviewState === 'reviewed' && underReview) return false
    if (filters.reviewState === 'under_review' && !underReview) return false

    // Search
    if (searchLower) {
      const matches =
        (medal.displayName || '').toLowerCase().includes(searchLower) ||
        (medal.name || '').toLowerCase().includes(searchLower) ||
        (medal.type || '').toLowerCase().includes(searchLower)
      if (!matches) return false
    }

    return true
  })
}

export function sortMedals(medals, sortBy = 'name', statuses) {
  const arr = Array.isArray(medals) ? [...medals] : []

  switch (sortBy) {
    case 'name':
      return arr.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
    case 'type':
      return arr.sort((a, b) => (a.type || '').localeCompare(b.type || ''))
    case 'tier': {
      const tierOrder = { bronze: 0, silver: 1, gold: 2, star_1: 3, star_2: 4, star_3: 5 }
      return arr.sort((a, b) => (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99))
    }
    case 'status': {
      const order = { unlocked: 0, eligible: 1, available: 2, locked: 3 }
      return arr.sort((a, b) => {
        const sa = order[getMedalStatus(a.id, statuses)] ?? 99
        const sb = order[getMedalStatus(b.id, statuses)] ?? 99
        return sa - sb
      })
    }
    default:
      return arr
  }
}
