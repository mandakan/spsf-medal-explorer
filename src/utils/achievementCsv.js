const HEADERS = [
  'id','type','year','weaponGroup','points','date','timeSeconds','hits',
  'competitionName','competitionType','disciplineType','ppcClass','weapon','score',
  'teamName','position','eventName','notes','schema_version'
]

function splitLines(str = '') {
  return String(str).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
}

function parseCsvRow(line) {
  const cells = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur)
  return cells.map(s => s.trim())
}

function toNumber(val) {
  if (val == null || val === '') return undefined
  const s = String(val).replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

function lc(val) {
  return val == null ? undefined : String(val).trim().toLowerCase()
}

/**
 * Normalize weapon group values.
 * Accepts A, A1, A2, A3 and maps them all to A.
 * B, C, R are kept as-is.
 */
function normalizeWeaponGroup(val) {
  const raw = String(val || 'A').trim().toUpperCase()
  // Map A1, A2, A3 to A
  if (raw === 'A1' || raw === 'A2' || raw === 'A3') {
    return 'A'
  }
  return raw
}

function normalizeRecord(obj) {
  const out = {}
  for (const k of Object.keys(obj)) {
    const key = k.trim()
    const v = obj[k]
    switch (key) {
      case 'type': out.type = lc(v); break
      case 'year': out.year = toNumber(v); break
      case 'weaponGroup': out.weaponGroup = normalizeWeaponGroup(v); break
      case 'points': out.points = toNumber(v); break
      case 'timeSeconds': out.timeSeconds = toNumber(v); break
      case 'hits': out.hits = toNumber(v); break
      case 'score': out.score = toNumber(v); break
      case 'position': out.position = toNumber(v); break
      case 'competitionType':
      case 'disciplineType':
      case 'weapon':
      case 'teamName':
      case 'competitionName':
      case 'eventName':
      case 'notes':
      case 'date': {
        const s = typeof v === 'string' ? v.trim() : v
        if (key === 'competitionType' || key === 'disciplineType' || key === 'weapon') {
          out[key] = lc(s)
        } else {
          out[key] = s
        }
        break
      }
      case 'ppcClass': {
        // Keep PPC class as typed (case and punctuation can be significant)
        out.ppcClass = typeof v === 'string' ? v.trim() : v
        break
      }
      case 'id': out.id = String(v || '').trim() || undefined; break
      default: break
    }
  }
  return out
}

export function parseCsv(text) {
  const lines = splitLines(text).filter(Boolean)
  if (!lines.length) return { rows: [], errors: ['Empty file'] }
  const header = parseCsvRow(lines[0]).map(h => h.trim())
  const unknown = header.filter(h => !HEADERS.includes(h))
  const rows = []
  const errors = unknown.length ? [`Okända rubriker: ${unknown.join(', ')}`] : []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvRow(lines[i])
    const rec = {}
    for (let c = 0; c < header.length; c++) {
      rec[header[c]] = cols[c] ?? ''
    }
    rows.push(normalizeRecord(rec))
  }
  return { rows, errors }
}

export function toAchievement(rec) {
  return {
    id: rec.id,
    type: rec.type,
    year: rec.year,
    weaponGroup: rec.weaponGroup || 'A',
    points: rec.points,
    date: rec.date,
    timeSeconds: rec.timeSeconds,
    hits: rec.hits,
    competitionName: rec.competitionName,
    competitionType: rec.competitionType,
    disciplineType: rec.disciplineType,
    ppcClass: rec.ppcClass,
    weapon: rec.weapon,
    score: rec.score,
    teamName: rec.teamName,
    position: rec.position,
    eventName: rec.eventName,
    notes: rec.notes,
  }
}
