function uniq(arr) {
  return Array.from(new Set(arr))
}

function sustainedYears(medal) {
  const reqs = Array.isArray(medal?.requirements) ? medal.requirements : []
  let maxYears = 0
  for (const r of reqs) {
    const y = (r && r.type === 'sustained_achievement' && Number.isFinite(r.yearsOfAchievement))
      ? r.yearsOfAchievement
      : 0
    if (y > maxYears) maxYears = y
  }
  return maxYears
}

export const timelineLayout = {
  id: 'timeline',
  label: 'Tidslinje',
  description: 'Lanes per typ. X visar minsta ackumulerade år mellan förkunskaper (yearOffset).',
  defaultOptions: {
    yearWidth: 220,
    laneHeight: 260,
    rowHeight: 70,
    radius: 22,
  },
  generator: (medals, options = {}) => {
    const opts = { ...timelineLayout.defaultOptions, ...(options || {}) }
    const yearWidth = opts.yearWidth
    const laneHeight = opts.laneHeight
    const rowHeight = opts.rowHeight
    const radius = opts.radius

    const medalsArr = Array.isArray(medals) ? medals : []
    const medalById = new Map(medalsArr.map(m => [m.id, m]))

    // Node duration cost equals sustained_achievement.yearsOfAchievement (full years must elapse)
    const nodeCost = new Map(medalsArr.map(m => [m.id, sustainedYears(m)]))

    // Graph structures
    const incoming = new Map() // toId -> [{ from, cost }]
    const outgoing = new Map() // fromId -> [toIds]
    const inDegree = new Map() // id -> count
    const connections = []

    const ensure = (map, key, init) => {
      if (!map.has(key)) map.set(key, init)
      return map.get(key)
    }

    for (const m of medalsArr) {
      inDegree.set(m.id, 0)
      ensure(incoming, m.id, [])
      ensure(outgoing, m.id, [])
    }

    for (const m of medalsArr) {
      const prereqs = Array.isArray(m?.prerequisites) ? m.prerequisites : []
      for (const p of prereqs) {
        if (!p || p.type !== 'medal' || !p.medalId) continue
        if (!medalById.has(p.medalId)) continue

        const cost = (Number.isFinite(p.yearOffset) && p.yearOffset > 0) ? p.yearOffset : 0

        incoming.get(m.id).push({ from: p.medalId, cost })
        outgoing.get(p.medalId).push(m.id)
        inDegree.set(m.id, (inDegree.get(m.id) || 0) + 1)

        connections.push({
          from: p.medalId,
          to: m.id,
          type: 'prerequisite',
          label: cost > 0 ? `${cost} år` : undefined,
        })
      }
    }

    // Earliest-finish (xYears) via Kahn's topo sort with node duration
    const startAcc = new Map(medalsArr.map(m => [m.id, 0])) // earliest start per node
    const xYears = new Map(medalsArr.map(m => [m.id, 0]))   // earliest finish per node
    const queue = []
    for (const m of medalsArr) {
      if ((inDegree.get(m.id) || 0) === 0) {
        // roots: finish at their own duration
        xYears.set(m.id, (nodeCost.get(m.id) || 0))
        queue.push(m.id)
      }
    }

    while (queue.length) {
      const id = queue.shift()
      const outs = outgoing.get(id) || []
      for (const to of outs) {
        const edge = (incoming.get(to) || []).find(e => e.from === id)
        const edgeCost = edge?.cost || 0
        const candStart = (xYears.get(id) || 0) + edgeCost
        if ((startAcc.get(to) || 0) < candStart) startAcc.set(to, candStart)

        inDegree.set(to, (inDegree.get(to) || 0) - 1)
        if ((inDegree.get(to) || 0) === 0) {
          xYears.set(to, (startAcc.get(to) || 0) + (nodeCost.get(to) || 0))
          queue.push(to)
        }
      }
    }

    // Lanes by type
    const types = uniq(medalsArr.map(m => m?.type || 'unknown')).sort((a, b) => String(a).localeCompare(String(b)))
    const laneIndexByType = new Map(types.map((t, i) => [t, i]))

    const nodes = []
    const lanesMeta = []

    // Build human-friendly labels per type from first seen typeName; fallback to raw type
    const typeLabelByType = new Map()
    for (const m of medalsArr) {
      const t = m?.type || 'unknown'
      if (!typeLabelByType.has(t)) {
        const tn = (m && typeof m.typeName === 'string') ? m.typeName.trim() : ''
        typeLabelByType.set(t, tn.length ? tn : t)
      }
    }

    for (const type of types) {
      const laneIndex = laneIndexByType.get(type) || 0
      const laneBaseY = laneIndex * laneHeight
      const label = typeLabelByType.get(type) ?? type
      lanesMeta.push({ type, y: laneBaseY, label })

      const laneMedals = medalsArr.filter(m => (m?.type || 'unknown') === type)

      // group by xYears
      const groups = new Map()
      for (const m of laneMedals) {
        const xy = xYears.get(m.id) || 0
        if (!groups.has(xy)) groups.set(xy, [])
        groups.get(xy).push(m)
      }

      const xs = Array.from(groups.keys()).sort((a, b) => a - b)
      for (const xy of xs) {
        const list = groups.get(xy) || []
        list.sort((a, b) => String(a.id).localeCompare(String(b.id)))
        for (let i = 0; i < list.length; i++) {
          const m = list[i]
          const inc = incoming.get(m.id) || []
          const maxIncomingCost = inc.reduce((acc, e) => Math.max(acc, e.cost || 0), 0)

          nodes.push({
            medalId: m.id,
            type: m.type,
            x: xy * yearWidth,
            y: laneBaseY + i * rowHeight,
            radius,
            yearsRequired: maxIncomingCost,
          })
        }
      }
    }

    return {
      medals: nodes,
      connections,
      meta: {
        kind: 'timeline',
        yearWidth,
        laneHeight,
        rowHeight,
        lanes: lanesMeta,
      },
    }
  },
}
