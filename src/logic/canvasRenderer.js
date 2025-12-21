/**
 * Canvas rendering utilities
 * Colors are resolved from global theme (CSS vars/Tailwind), with safe fallbacks.
 */

// Cache for measured Tailwind class colors to avoid reflow per call
const classColorCache = new Map()
function getClassColor(className, property = 'color') {
  if (classColorCache.has(`${property}:${className}`)) {
    return classColorCache.get(`${property}:${className}`)
  }
  if (typeof document === 'undefined') return null
  const el = document.createElement('span')
  el.style.position = 'absolute'
  el.style.opacity = '0'
  el.style.pointerEvents = 'none'
  el.className = className
  document.body.appendChild(el)
  const color = getComputedStyle(el)[property]
  document.body.removeChild(el)
  classColorCache.set(`${property}:${className}`, color)
  return color
}

function readVar(styles, names = []) {
  for (const n of names) {
    const v = styles.getPropertyValue(n)?.trim()
    if (v) return v
  }
  return null
}

function isDomElement(el) {
  return el && typeof el === 'object' && el.nodeType === 1 && typeof el.nodeName === 'string'
}

// Primary accessor used by runtime rendering. Reads CSS variables off canvas element first.
export function getThemeColors(canvas) {
  const root = typeof document !== 'undefined' ? document.documentElement : null

  let styles = null
  try {
    if (typeof getComputedStyle === 'function' && isDomElement(canvas)) {
      styles = getComputedStyle(canvas)
    } else if (root && typeof getComputedStyle === 'function') {
      styles = getComputedStyle(root)
    }
  } catch {
    styles = null
  }

  // Try CSS vars first, then Tailwind utility class computed values, then hex fallback.
  const palette = {
    unlocked:
      (styles && readVar(styles, ['--color-medal-unlocked'])) ||
      getClassColor('text-medal-gold') ||
      '#FFD700',
    achievable:
      (styles && readVar(styles, ['--color-success', '--color-achievable'])) ||
      getClassColor('text-emerald-400') ||
      '#20C997',
    locked:
      (styles && readVar(styles, ['--color-muted-foreground', '--color-locked'])) ||
      getClassColor('text-slate-400') ||
      '#6C757D',
    text:
      (styles && readVar(styles, ['--color-text-primary', '--color-foreground'])) ||
      getClassColor('text-text-primary') ||
      getClassColor('text-slate-900') ||
      '#111827',
    connection:
      (styles && readVar(styles, ['--color-connection', '--color-border-muted'])) ||
      getClassColor('text-slate-400') ||
      '#94A3B8',
    border:
      (styles && readVar(styles, ['--color-border'])) ||
      getClassColor('border-slate-500', 'borderTopColor') ||
      'rgba(0,0,0,0.3)',
    accent:
      (styles && readVar(styles, ['--color-primary'])) ||
      getClassColor('text-primary') ||
      getClassColor('text-blue-500') ||
      '#3B82F6',
  }
  return palette
}

// Back-compat constant (not used by runtime rendering anymore)
export const COLORS = {
  unlocked: '#FFD700',
  achievable: '#20C997',
  locked: '#6C757D',
  text: '#111827',
  connection: '#94A3B8',
  border: '#5e5240',
  accent: '#3B82F6',
}

export function drawMedalNode(ctx, x, y, radius, medal, status, scale) {
  const palette = getThemeColors(ctx?.canvas)
  const statusKey = status?.status || 'locked'
  const statusColor = palette[statusKey]
  
  // Node base
  ctx.beginPath()
  ctx.fillStyle = statusColor
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Border
  ctx.strokeStyle = palette.border
  ctx.lineWidth = Math.max(1, 2 / Math.max(scale, 0.001))
  ctx.stroke()

  // Under review indicator: dashed ring and optional label
  const underReview = medal && (medal.reviewed !== true)
  if (underReview) {
    const s = Math.max(scale, 0.001)
    const canSave = typeof ctx.save === 'function'
    if (canSave) ctx.save()
    if (typeof ctx.setLineDash === 'function') {
      ctx.setLineDash([6 / s, 6 / s])
    }
    ctx.strokeStyle = getClassColor('text-amber-500') || palette.accent
    ctx.lineWidth = Math.max(1.5, 2.5 / s)
    ctx.beginPath()
    ctx.arc(x, y, radius + Math.max(2, 3 / s), 0, Math.PI * 2)
    ctx.stroke()
    if (canSave && typeof ctx.restore === 'function') ctx.restore()

    if (scale >= 1.2 && typeof ctx.measureText === 'function') {
      const pad = 4 / s
      const fontPx = Math.max(8, 10 / s)
      const label = 'Under review'
      if (canSave) ctx.save()
      ctx.font = `${fontPx}px sans-serif`
      const textW = (ctx.measureText(label) && ctx.measureText(label).width) || 0
      const w = textW + pad * 2
      const h = fontPx + pad * 1.5
      const rx = x - w / 2
      const ry = y + radius + 8 / s
      const r = 4 / s
      // Background
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)'
      ctx.strokeStyle = getClassColor('text-amber-500') || palette.accent
      ctx.lineWidth = Math.max(1, 1.5 / s)
      ctx.beginPath()
      if (typeof ctx.arcTo === 'function') {
        ctx.moveTo(rx + r, ry)
        ctx.arcTo(rx + w, ry, rx + w, ry + h, r)
        ctx.arcTo(rx + w, ry + h, rx, ry + h, r)
        ctx.arcTo(rx, ry + h, rx, ry, r)
        ctx.arcTo(rx, ry, rx + w, ry, r)
      } else {
        // Fallback to simple rectangle if arcTo is not supported by the context
        ctx.moveTo(rx, ry)
        ctx.lineTo(rx + w, ry)
        ctx.lineTo(rx + w, ry + h)
        ctx.lineTo(rx, ry + h)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // Text
      ctx.fillStyle = palette.text
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (typeof ctx.fillText === 'function') {
        ctx.fillText(label, x, ry + h / 2)
      }
      if (canSave && typeof ctx.restore === 'function') ctx.restore()
    }
  }

  // Label text
  ctx.fillStyle = palette.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = `${Math.max(10, 12 / Math.max(scale, 0.001))}px sans-serif`
  const displayText = (medal.displayName || '').split(' ')[0] || medal.tier || 'Medal'
  ctx.fillText(displayText, x, y - 6 / Math.max(scale, 0.001))
  
  ctx.font = `${Math.max(8, 10 / Math.max(scale, 0.001))}px sans-serif`
  ctx.fillText(medal.tier || '', x, y + 8 / Math.max(scale, 0.001))
}

export function drawConnection(ctx, x1, y1, x2, y2, type = 'prerequisite', scale) {
  const palette = getThemeColors(ctx?.canvas)
  ctx.strokeStyle = palette.connection
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
  ctx.fillStyle = palette.connection
  ctx.fill()
}
