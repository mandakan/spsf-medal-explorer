/**
 * Export Manager
 * - toProfileBackup(profile)
 * - toCSV(achievements)
 * - toPDF(profile)
 * - toQRCode(shareData)
 */

function safeDateISO(d = new Date()) {
  try {
    return new Date(d).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function ensureArray(val) {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function escapeCsvCell(val) {
  if (val == null) return ''
  const s = String(val)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCsv(rows) {
  return rows.map(r => r.map(escapeCsvCell).join(',')).join('\n')
}

function summarizeProfile(profile) {
  const achievements = profile?.achievements ?? profile?.prerequisites ?? []
  const unlocked = profile?.unlockedMedals ?? []
  return {
    totalAchievements: achievements.length,
    unlocked: unlocked.length,
  }
}

function createMinimalPdf(profile) {
  // Minimal PDF generation (no external deps) for environments without jspdf
  const summary = summarizeProfile(profile)
  const text = [
    'Medal Progress Report',
    '---------------------',
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
    'Summary:',
    `- Total Achievements: ${summary.totalAchievements}`,
    `- Unlocked Medals: ${summary.unlocked}`,
  ].join('\n')

  // Very simple PDF: wrap text into a barebones PDF content stream
  const pdfContent = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj
4 0 obj <</Length ${text.length + 100}>> stream
BT
/F1 12 Tf
72 720 Td
(${text.replace(/[\r\n]+/g, ') Tj\nT* (')}) Tj
ET
endstream endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000075 00000 n 
0000000136 00000 n 
0000000327 00000 n 
0000000584 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
692
%%EOF`
  return new TextEncoder().encode(pdfContent)
}


export async function toCSV(achievements) {
  const rows = []
  const header = ['Medal', 'Type', 'Date', 'Score', 'Position', 'Weapon', 'Team', 'Notes', 'Status']
  rows.push(header)

  ensureArray(achievements).forEach(a => {
    const medal = a.medalName || a.medalId || ''
    const type = a.type || ''
    const date = a.date || a.competitionDate || ''
    const score = a.points ?? a.score ?? ''
    const position = a.position ?? ''
    const weapon = a.weapon ?? a.weaponGroup ?? ''
    const team = a.team ?? ''
    const notes = a.notes ?? ''
    const status = a.status ?? ''
    rows.push([medal, type, date, score, position, weapon, team, notes, status])
  })

  return buildCsv(rows)
}

export async function toPDF(profile) {
  // Try to use jspdf if available, otherwise fallback
  try {
    const mod = await import(/* @vite-ignore */ 'jspdf').catch(() => null)
    if (mod && mod.jsPDF) {
      const { jsPDF } = mod
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Medal Progress Report', 14, 18)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26)

      const summary = summarizeProfile(profile)
      const lines = [
        'Summary:',
        `- Total Achievements: ${summary.totalAchievements}`,
        `- Unlocked Medals: ${summary.unlocked}`,
      ]
      let y = 36
      lines.forEach(line => {
        doc.text(line, 14, y)
        y += 6
      })

      return doc.output('arraybuffer')
    }
  } catch {
    // ignore
  }
  // Fallback minimal PDF bytes
  return createMinimalPdf(profile)
}

export async function toQRCode(shareData, options = {}) {
  const payload = typeof shareData === 'string' ? shareData : JSON.stringify(shareData)
  try {
    const qr = await import(/* @vite-ignore */ 'qrcode').catch(() => null)
    if (qr && qr.toDataURL) {
      return await qr.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        width: options.width || 256,
        margin: 2,
      })
    }
  } catch {
    // ignore
  }
  // Fallback: textual data URL (not a real QR) to avoid crashes in environments without qrcode
  const hasNodeBuffer = typeof globalThis !== 'undefined' && globalThis.Buffer && typeof globalThis.Buffer.from === 'function'
  const base64 =
    (hasNodeBuffer
      ? globalThis.Buffer.from(payload, 'utf8').toString('base64')
      : (typeof btoa === 'function'
          ? btoa(unescape(encodeURIComponent(payload)))
          : '')) || ''
  return `data:text/plain;base64,${base64}`
}

export async function toProfileBackup(profile, { version = '1.0' } = {}) {
  const payload = {
    kind: 'profile-backup',
    version,
    exportedAt: safeDateISO(),
    profile: {
      userId: profile?.userId || '',
      displayName: profile?.displayName || '',
      createdDate: profile?.createdDate || safeDateISO(),
      lastModified: profile?.lastModified || safeDateISO(),
      dateOfBirth: profile?.dateOfBirth || '',
      unlockedMedals: ensureArray(profile?.unlockedMedals),
      prerequisites: ensureArray(profile?.prerequisites),
      features: {
        allowManualUnlock: !!profile?.features?.allowManualUnlock,
        enforceCurrentYearForSustained: !!profile?.features?.enforceCurrentYearForSustained,
      },
      notifications: !!profile?.notifications,
    },
  }
  return JSON.stringify(payload, null, 2)
}
