/**
 * Canvas rendering utilities
 * Colors are resolved from global theme (CSS vars/Tailwind), with safe fallbacks.
 */
import { Medal } from '../models/Medal.js'
import { STATUS_COLOR_VARS } from '../config/statusColors.js'

 const LABEL_FONT_PX = 14

// Cache for measured Tailwind class colors to avoid reflow per call
const classColorCache = new Map()
export function clearThemeCache() { classColorCache.clear() }
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
      (styles && readVar(styles, [STATUS_COLOR_VARS.unlocked])) ||
      '#22C55E',
    achievable:
      (styles && readVar(styles, ['--color-success', '--color-achievable'])) ||
      getClassColor('text-emerald-400') ||
      '#20C997',
    available:
      (styles && readVar(styles, [STATUS_COLOR_VARS.available])) ||
      '#0EA5E9',
    eligible:
      (styles && readVar(styles, [STATUS_COLOR_VARS.eligible])) ||
      '#F59E0B',
    locked:
      (styles && readVar(styles, [STATUS_COLOR_VARS.locked])) ||
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
    review:
      (styles && readVar(styles, [STATUS_COLOR_VARS.review])) ||
      '#8B5CF6',
    placeholder:
      (styles && readVar(styles, [STATUS_COLOR_VARS.placeholder])) ||
      '#94A3B8',
  }
  return palette
}

function getFontFamily(canvas) {
  try {
    const styles = typeof getComputedStyle === 'function'
      ? getComputedStyle(isDomElement(canvas) ? canvas : document.documentElement)
      : null
    const ff = styles?.fontFamily
    return ff && ff.trim().length ? ff : 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
  } catch {
    return 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
  }
}

// Back-compat constant (not used by runtime rendering anymore)
function wrapText(ctx, text, maxWidth, maxLines = 3, ellipsis = '…') {
  if (!text) return []
  const words = String(text).trim().split(/\s+/)
  const lines = []
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i]
    if (ctx.measureText(test).width <= maxWidth) {
      line = test
      continue
    }
    if (lines.length === maxLines - 1) {
      let truncated = line || words[i]
      while (ctx.measureText(truncated + ellipsis).width > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1)
      }
      lines.push(truncated + ellipsis)
      return lines
    }
    if (line) lines.push(line)
    line = words[i]
  }
  if (line) lines.push(line)
  return lines.slice(0, maxLines)
}

export function drawMedalNode(ctx, x, y, radius, medal, status, scale, forceLabel = false) {
  if (!(medal instanceof Medal)) {
    if (!medal || typeof medal !== 'object') {
      throw new Error('drawMedalNode requires a Medal instance or a plain medal-like object')
    }
  }
  const palette = getThemeColors(ctx?.canvas)
  const isPlaceholder = (typeof medal?.isPlaceholder === 'function' ? medal.isPlaceholder() : (medal?.status === 'placeholder'))
  const isUnderReview = !isPlaceholder && (typeof medal?.isUnderReview === 'function' ? medal.isUnderReview() : (medal?.status === 'under_review'))
  const statusKey = status?.status || 'locked'
  const statusColor = palette[statusKey]
  
  // Node base
  ctx.beginPath()
  ctx.fillStyle = statusColor
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Border
  ctx.strokeStyle = palette.border
  ctx.lineWidth = Math.max(0.5, 2 * Math.max(scale, 0.001))
  ctx.stroke()

  // Placeholder indicator: dotted ring
  if (isPlaceholder) {
    const s = Math.max(scale, 0.001)
    const canSave = typeof ctx.save === 'function'
    if (canSave) ctx.save()
    if (typeof ctx.setLineDash === 'function') {
      // dotted effect
      const dot = Math.max(1, 2 * s)
      ctx.setLineDash([dot, dot * 1.5])
    }
    ctx.strokeStyle = palette.placeholder
    ctx.lineWidth = Math.max(0.75, 2.5 * s)
    ctx.beginPath()
    ctx.arc(x, y, radius + Math.max(1, 3 * s), 0, Math.PI * 2)
    ctx.stroke()
    if (canSave && typeof ctx.restore === 'function') ctx.restore()
  }
  // Under review indicator: dashed ring
  if (isUnderReview) {
    const s = Math.max(scale, 0.001)
    const canSave = typeof ctx.save === 'function'
    if (canSave) ctx.save()
    if (typeof ctx.setLineDash === 'function') {
      const dash = Math.max(1, 6 * s)
      ctx.setLineDash([dash, dash])
    }
    ctx.strokeStyle = palette.review
    ctx.lineWidth = Math.max(0.75, 2.5 * s)
    ctx.beginPath()
    ctx.arc(x, y, radius + Math.max(1, 3 * s), 0, Math.PI * 2)
    ctx.stroke()
    if (canSave && typeof ctx.restore === 'function') ctx.restore()
    // No text label for under-review in canvas; using dashed review ring only for consistency with list
  }

  // Label text: base name on first line; tierName on subsequent lines
  const baseName = (typeof medal?.name === 'string' ? medal.name.trim() : '') || 'Medal'
  // Avoid label clutter when zoomed far out; always show when forced (hover/selected)
  if ((forceLabel || scale >= 0.8) && baseName) {
    ctx.fillStyle = palette.text
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // Accessible, consistent size regardless of zoom
    const fontPx = LABEL_FONT_PX
    const lineHeight = Math.round(fontPx * 1.3)
    const fontFamily = getFontFamily(ctx.canvas)
    ctx.font = `${fontPx}px ${fontFamily}`

    // Wrap to a max width and line count
    const maxWidth = 180
    const maxLines = forceLabel ? 3 : (scale >= 1.3 ? 3 : 2)
    const tier = typeof medal?.tierName === 'string' ? medal.tierName.trim() : ''

    // Ensure the base name occupies a single header line if a tier is present; otherwise it can wrap.
    const clampOneLine = (text) => {
      if (!text) return ''
      if (ctx.measureText(text).width <= maxWidth) return text
      const ellipsis = '…'
      let t = text
      while (t.length && ctx.measureText(t + ellipsis).width > maxWidth) {
        t = t.slice(0, -1)
      }
      return t.length ? t + ellipsis : text
    }

    let lines
    if (tier) {
      const header = clampOneLine(baseName)
      const restLines = wrapText(ctx, tier, maxWidth, Math.max(0, maxLines - 1))
      lines = [header, ...restLines]
    } else {
      lines = wrapText(ctx, baseName, maxWidth, maxLines)
    }

    const startY = y + radius + 8

    // Subtle shadow for readability over connections or lines
    const prevShadowColor = ctx.shadowColor
    const prevShadowBlur = ctx.shadowBlur
    const prevShadowOffsetX = ctx.shadowOffsetX
    const prevShadowOffsetY = ctx.shadowOffsetY
    ctx.shadowColor = 'rgba(0,0,0,0.2)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, startY + i * lineHeight)
    }

    // Reset shadow to avoid side effects
    ctx.shadowColor = prevShadowColor
    ctx.shadowBlur = prevShadowBlur
    ctx.shadowOffsetX = prevShadowOffsetX
    ctx.shadowOffsetY = prevShadowOffsetY
  }
}

export function drawConnection(ctx, x1, y1, x2, y2, type = 'prerequisite', scale, label) {
  const palette = getThemeColors(ctx?.canvas)
  void type
  ctx.strokeStyle = palette.connection
  ctx.lineWidth = Math.max(0.5, 2 * Math.max(scale, 0.001))
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  // Arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const arrowSize = Math.max(4, 10 * Math.max(scale, 0.001))
  
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI / 6), y2 - arrowSize * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI / 6), y2 - arrowSize * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fillStyle = palette.connection
  ctx.fill()

  // Label (minimum years) – shown only when zoomed in to reduce clutter
  if (label && scale >= 0.8) {
    const palette = getThemeColors(ctx?.canvas)
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.hypot(dx, dy) || 1
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2

    // Offset slightly perpendicular to the line for readability
    const nx = -dy / dist
    const ny = dx / dist
    const offset = 12
    const cx = midX + nx * offset
    const cy = midY + ny * offset

    const fontPx = 12
    const padX = 6
    const padY = 4
    const fontFamily = getFontFamily(ctx.canvas)
    ctx.font = `${fontPx}px ${fontFamily}`
    const textW = (ctx.measureText(label)?.width) || 0
    const w = textW + padX * 2
    const h = fontPx + padY * 2
    const rx = cx - w / 2
    const ry = cy - h / 2
    const r = 6

    // Background and outline for contrast
    const prevAlpha = ctx.globalAlpha
    ctx.globalAlpha = 0.12
    ctx.fillStyle = palette.accent
    ctx.beginPath()
    if (typeof ctx.arcTo === 'function') {
      ctx.moveTo(rx + r, ry)
      ctx.arcTo(rx + w, ry, rx + w, ry + h, r)
      ctx.arcTo(rx + w, ry + h, rx, ry + h, r)
      ctx.arcTo(rx, ry + h, rx, ry, r)
      ctx.arcTo(rx, ry, rx + w, ry, r)
    } else {
      ctx.rect(rx, ry, w, h)
    }
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = prevAlpha

    ctx.strokeStyle = palette.accent
    ctx.lineWidth = Math.max(0.5, 1.5 * Math.max(scale, 0.001))
    ctx.beginPath()
    if (typeof ctx.arcTo === 'function') {
      ctx.moveTo(rx + r, ry)
      ctx.arcTo(rx + w, ry, rx + w, ry + h, r)
      ctx.arcTo(rx + w, ry + h, rx, ry + h, r)
      ctx.arcTo(rx, ry + h, rx, ry, r)
      ctx.arcTo(rx, ry, rx + w, ry, r)
    } else {
      ctx.rect(rx, ry, w, h)
    }
    ctx.closePath()
    ctx.stroke()

    ctx.fillStyle = palette.text
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (typeof ctx.fillText === 'function') {
      ctx.fillText(label, cx, cy)
    }
  }
}
