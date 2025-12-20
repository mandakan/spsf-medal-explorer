/**
 * Canvas rendering utilities
 */
export const COLORS = {
  unlocked: '#FFD700',     // Gold
  achievable: '#20C997',   // Bright teal
  locked: '#6C757D',       // Cool gray
  text: '#212529',         // Text primary
  connection: '#98a0a3',
  border: '#5e5240'
}

export function drawMedalNode(ctx, x, y, radius, medal, status, scale) {
  const statusKey = status?.status || 'locked'
  const statusColor = COLORS[statusKey]
  
  // Node base
  ctx.beginPath()
  ctx.fillStyle = statusColor
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Border
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = Math.max(1, 2 / Math.max(scale, 0.001))
  ctx.stroke()

  // Label text
  ctx.fillStyle = COLORS.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = `${Math.max(10, 12 / Math.max(scale, 0.001))}px sans-serif`
  const displayText = (medal.displayName || '').split(' ')[0] || medal.tier || 'Medal'
  ctx.fillText(displayText, x, y - 6 / Math.max(scale, 0.001))
  
  ctx.font = `${Math.max(8, 10 / Math.max(scale, 0.001))}px sans-serif`
  ctx.fillText(medal.tier || '', x, y + 8 / Math.max(scale, 0.001))
}

export function drawConnection(ctx, x1, y1, x2, y2, type = 'prerequisite', scale) {
  ctx.strokeStyle = COLORS.connection
  ctx.lineWidth = Math.max(1, 2 / Math.max(scale, 0.001))
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  // Arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const arrowSize = Math.max(6, 10 / Math.max(scale, 0.001))
  
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI / 6), y2 - arrowSize * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI / 6), y2 - arrowSize * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fillStyle = COLORS.connection
  ctx.fill()
}
