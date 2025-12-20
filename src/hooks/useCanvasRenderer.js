import { useCallback } from 'react'
import { drawMedalNode, drawConnection, getThemeColors } from '../logic/canvasRenderer'

export function useCanvasRenderer() {
  const render = useCallback((
    ctx,
    medals,
    layout,
    statuses,
    panX,
    panY,
    scale,
    selectedMedal
  ) => {
    if (!layout || !medals || !statuses) return

    // Create maps for quick lookup
    const medalMap = {}
    medals.forEach(m => { medalMap[m.id] = m })
    const nodeIndex = new Map((layout.medals || []).map(n => [n.medalId, n]))

    // Draw connections behind nodes
    layout.connections?.forEach(conn => {
      const fromMedal = nodeIndex.get(conn.from)
      const toMedal = nodeIndex.get(conn.to)
      if (!fromMedal || !toMedal) return

      const x1 = (fromMedal.x + panX) * scale + ctx.canvas.width / 2
      const y1 = (fromMedal.y + panY) * scale + ctx.canvas.height / 2
      const x2 = (toMedal.x + panX) * scale + ctx.canvas.width / 2
      const y2 = (toMedal.y + panY) * scale + ctx.canvas.height / 2

      drawConnection(ctx, x1, y1, x2, y2, conn.type, scale)
    })

    // Draw nodes
    layout.medals?.forEach(medalNode => {
      const medal = medalMap[medalNode.medalId]
      if (!medal) return

      const x = (medalNode.x + panX) * scale + ctx.canvas.width / 2
      const y = (medalNode.y + panY) * scale + ctx.canvas.height / 2
      const radius = medalNode.radius * scale

      const status =
        statuses.unlocked.find(s => s.medalId === medal.id) ||
        statuses.achievable.find(s => s.medalId === medal.id) ||
        statuses.locked.find(s => s.medalId === medal.id) ||
        { status: 'locked' }

      if (selectedMedal === medal.id) {
        const palette = getThemeColors(ctx.canvas)
        ctx.strokeStyle = palette.accent
        ctx.lineWidth = Math.max(2, 4 / Math.max(scale, 0.001))
        ctx.beginPath()
        ctx.arc(x, y, radius + 6, 0, Math.PI * 2)
        ctx.stroke()
      }

      drawMedalNode(ctx, x, y, radius, medalNode, status, scale)
    })
  }, [])

  return { render }
}
