/**
 * Simple columnar + slight repulsion layout for skill tree visualization
 * Positions medals by type to create readable groupings.
 */
export function generateMedalLayout(medals) {
  // Group medals by type
  const medalById = new Map(medals.map(m => [m.id, m]))
  const medalsByType = {}
  medals.forEach(medal => {
    if (!medalsByType[medal.type]) {
      medalsByType[medal.type] = []
    }
    medalsByType[medal.type].push(medal)
  })

  const types = Object.keys(medalsByType)
  const columnWidth = 200
  const rowHeight = 120

  const layout = {
    medals: [],
    connections: []
  }

  types.forEach((type, typeIndex) => {
    const typeMedals = medalsByType[type] || []
    typeMedals.forEach((medal, medalIndex) => {
      const node = {
        medalId: medal.id,
        displayName: medal.displayName,
        tier: medal.tier,
        type: medal.type,
        x: typeIndex * columnWidth,
        y: medalIndex * rowHeight,
        radius: 25,
        yearsRequired: 0,
      }
      layout.medals.push(node)

      // Add prerequisites as connections (no edge labels). Compute node-anchored yearsRequired.
      let yearsRequired = 0
      const sustainedYears = Array.isArray(medal.requirements)
        ? (medal.requirements.find(r =>
            r && r.type === 'sustained_achievement' && Number.isFinite(r.yearsOfAchievement)
          )?.yearsOfAchievement || 0)
        : 0

      if (Array.isArray(medal.prerequisites)) {
        medal.prerequisites.forEach(prereq => {
          if (prereq && prereq.type === 'medal' && prereq.medalId) {
            const fromMedal = medalById.get(prereq.medalId)
            const sameType = fromMedal && fromMedal.type === medal.type
            let candidate = 0
            if (Number.isFinite(prereq.yearOffset) && prereq.yearOffset > 0) {
              candidate = prereq.yearOffset
            } else if (sameType && typeof sustainedYears === 'number' && sustainedYears > 1) {
              candidate = sustainedYears
            }
            if (candidate > yearsRequired) yearsRequired = candidate

            layout.connections.push({
              from: prereq.medalId,
              to: medal.id,
              type: 'prerequisite'
            })
          }
        })
      }
      node.yearsRequired = yearsRequired
    })
  })

  return refineLayout(layout)
}

function refineLayout(layout) {
  // Light repulsion to reduce overlap
  const iterations = 5
  const repulsion = 100

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < layout.medals.length; i++) {
      for (let j = i + 1; j < layout.medals.length; j++) {
        const m1 = layout.medals[i]
        const m2 = layout.medals[j]

        const dx = m2.x - m1.x
        const dy = m2.y - m1.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        const force = repulsion / (dist * dist)
        const moveX = (dx / dist) * force * 0.1
        const moveY = (dy / dist) * force * 0.1

        m1.x -= moveX
        m1.y -= moveY
        m2.x += moveX
        m2.y += moveY
      }
    }
  }

  return layout
}
