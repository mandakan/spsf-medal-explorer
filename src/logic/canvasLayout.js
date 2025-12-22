/**
 * Simple columnar + slight repulsion layout for skill tree visualization
 * Positions medals by type to create readable groupings.
 */
export function generateMedalLayout(medals) {
  // Group medals by type
  const medalsByType = {}
  medals.forEach(medal => {
    if (!medalsByType[medal.type]) {
      medalsByType[medal.type] = []
    }
    medalsByType[medal.type].push(medal)
  })

  const types = Object.keys(medalsByType)
  const columnWidth = 180
  const rowHeight = 100

  const layout = {
    medals: [],
    connections: []
  }

  types.forEach((type, typeIndex) => {
    const typeMedals = medalsByType[type] || []
    typeMedals.forEach((medal, medalIndex) => {
      layout.medals.push({
        medalId: medal.id,
        displayName: medal.displayName,
        tier: medal.tier,
        type: medal.type,
        x: typeIndex * columnWidth,
        y: medalIndex * rowHeight,
        radius: 25
      })

      // Add prerequisites as connections
      if (Array.isArray(medal.prerequisites)) {
        medal.prerequisites.forEach(prereq => {
          if (prereq && prereq.type === 'medal' && prereq.medalId) {
            layout.connections.push({
              from: prereq.medalId,
              to: medal.id,
              type: 'prerequisite'
            })
          }
        })
      }
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
