// Process 3.2 — EOSB prompt (Audit360 Execution Rule Book): organise the GOSI Active and Inactive
// Contributors lists into one clean workbook. Pure functions; reading and writing the Excel files
// is in eosbExcel.js. Nothing is guessed: a missing value stays blank and is flagged.

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

export const normHeader = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

// Columns are mapped by header name, never by position. Columns not listed here
// (TOTAL WAGE, commissions, other allowance, …) are ignored on purpose.
const ALIASES = {
  id: ['employeeid', 'empid', 'employeeno', 'employeenumber', 'contributorid', 'contributorno', 'idnumber', 'id', 'iqama', 'iqamanumber', 'nationalid', 'subscriberid', 'subscriberno'],
  name: ['employeename', 'name', 'contributorname', 'fullname', 'subscribername', 'employee'],
  basic: ['basicwage', 'basicpay', 'basicsalary', 'basic', 'basicwages'],
  hra: ['housing', 'hra', 'housingallowance', 'housingwage'],
  joining: ['joiningdate', 'joindate', 'dateofjoining', 'datejoined', 'hiredate', 'startdate', 'joining', 'contributionstartdate', 'dateofhire'],
  leaving: ['leavingdate', 'leavedate', 'dateofleaving', 'terminationdate', 'enddate', 'leaving', 'dateleft', 'contributionenddate', 'dateofexit', 'exitdate'],
}
export const FIELDS = ['id', 'name', 'basic', 'hra', 'joining', 'leaving']

export function detectMapping(headers) {
  const norm = headers.map(normHeader)
  const map = {}
  for (const f of FIELDS) {
    let hit = null
    for (const a of ALIASES[f]) { const i = norm.indexOf(a); if (i >= 0) { hit = headers[i]; break } }
    map[f] = hit
  }
  return map
}

// ── values ─────────────────────────────────────────────────────────────────
const blank = (v) => v === null || v === undefined || String(v).trim() === ''

export function toNumber(v) {
  if (blank(v)) return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}

function isoOf(y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d && y >= 1900 && y <= 2100
    ? `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null
}

// Returns { iso, assumed }. assumed = the text was ambiguous (both parts <= 12) and was read as day-month-year.
export function parseDateValue(v) {
  if (blank(v)) return { iso: null, assumed: false }
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? { iso: null, assumed: false } : { iso: isoOf(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate()), assumed: false }
  if (typeof v === 'number') {
    if (v > 20000 && v < 80000) { const dt = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return { iso: isoOf(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()), assumed: false } }
    return { iso: null, assumed: false }
  }
  const s = String(v).trim()
  const m1 = ISO.exec(s.slice(0, 10))
  if (m1 && /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(s)) return { iso: isoOf(+m1[1], +m1[2], +m1[3]), assumed: false }
  const m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s)
  if (m) {
    const a = +m[1], b = +m[2], y = +m[3]
    if (a > 12) return { iso: isoOf(y, b, a), assumed: false }       // day first, clear
    if (b > 12) return { iso: isoOf(y, a, b), assumed: false }       // month first, clear
    return { iso: isoOf(y, b, a), assumed: a !== b }                  // ambiguous: read as day-month-year
  }
  return { iso: null, assumed: false }
}

export const fmtIso = (iso) => (ISO.test(iso || '') ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : '')

// ── mapping a sheet's rows to records ──────────────────────────────────────
// rows: array of objects keyed by header; sourceRow numbers are the Excel row numbers.
export function mapRows(rows, mapping, { list, registration, fileName }) {
  return rows.map(({ sourceRow, values }) => {
    const get = (f) => (mapping[f] ? values[mapping[f]] : undefined)
    const j = parseDateValue(get('joining')), l = parseDateValue(get('leaving'))
    return {
      list, registration, fileName, sourceRow,
      id: blank(get('id')) ? '' : String(get('id')).trim(),
      name: blank(get('name')) ? '' : String(get('name')).trim(),
      basic: toNumber(get('basic')), hra: toNumber(get('hra')),
      joiningRaw: get('joining'), leavingRaw: get('leaving'),
      joining: j.iso, leaving: list === 'Active' ? null : l.iso,
      assumedDate: j.assumed || (list === 'Inactive' && l.assumed),
    }
  })
}

// ── the build ──────────────────────────────────────────────────────────────
// input: { active: record[], inactive: record[], pdfNames: {id: name}, window: {start, end, label} }
export function buildEosb({ active = [], inactive = [], pdfNames = {}, window }) {
  const win = window || { start: '2025-01-01', end: '2025-12-31', label: '2025' }
  const exceptions = []
  const flag = (r, type, reason) => exceptions.push({
    sourceList: `${r.list}${r.registration ? ` (${r.registration})` : ''}`, sourceRow: r.sourceRow, id: r.id, name: r.name,
    basic: r.basic, hra: r.hra, joining: r.joining, leaving: r.leaving, flagType: type, reason,
  })

  const prep = (r) => {
    const rec = { ...r, flags: [], nameFromPdf: false, missing: new Set() }
    if (!rec.name && rec.id && pdfNames[rec.id]) { rec.name = String(pdfNames[rec.id]).trim(); rec.nameFromPdf = true }
    return rec
  }
  const A = active.map(prep).map((r) => ({ ...r, status: 'Active', leaving: null }))
  const I = inactive.map(prep)

  // Status for inactive employees by leaving date.
  for (const r of I) {
    if (!r.leaving) r.status = 'Check - no leaving date'
    else if (r.leaving >= win.start && r.leaving <= win.end) r.status = 'Inactive'
    else r.status = `Inactive - left outside ${win.label}`
  }

  const all = [...A, ...I]
  for (const r of all) {
    if (r.nameFromPdf) flag(r, 'Name filled from PDF', `Name taken from the PDF list, matched by Employee ID ${r.id}.`)
    const miss = []
    if (!r.id) miss.push('Employee ID')
    if (!r.name) { miss.push('Name'); r.missing.add('name') }
    if (r.basic === null) { miss.push('Basic Pay'); r.missing.add('basic') }
    if (r.hra === null) { miss.push('HRA'); r.missing.add('hra') }
    if (!r.joining) { miss.push('Joining Date'); r.missing.add('joining') }
    if (!r.id) r.missing.add('id')
    if (!r.name) flag(r, 'Missing name', `No name in the Excel${r.id ? ` and none in the PDF for ID ${r.id}` : ''}.`)
    const others = miss.filter((m) => m !== 'Name')
    if (others.length) flag(r, 'Missing data', `Missing: ${others.join(', ')}.`)
    if (r.joining === null && !blank(r.joiningRaw)) flag(r, 'Unreadable date', `Joining Date "${r.joiningRaw}" could not be read.`)
    if (r.list === 'Inactive' && r.leaving === null && !blank(r.leavingRaw)) flag(r, 'Unreadable date', `Leaving Date "${r.leavingRaw}" could not be read.`)
    if (r.status === 'Check - no leaving date') flag(r, 'No leaving date', 'The Leaving Date is missing or unreadable; the employee is kept and highlighted.')
    if (r.status.startsWith('Inactive - left outside')) flag(r, `Left outside ${win.label}`, `Leaving Date ${fmtIso(r.leaving)} is outside ${win.label}.`)
    if (r.joining && r.leaving && r.joining > r.leaving) flag(r, 'Joining after leaving', `Joining Date ${fmtIso(r.joining)} is later than Leaving Date ${fmtIso(r.leaving)}.`)
    if (r.assumedDate) flag(r, 'Date format assumed', 'A date written like 03/04/2025 was read as day-month-year.')
  }

  // duplicates within a list
  for (const list of [A, I]) {
    const byId = new Map()
    list.filter((r) => r.id).forEach((r) => byId.set(r.id, [...(byId.get(r.id) || []), r]))
    for (const [id, rs] of byId) if (rs.length > 1) rs.forEach((r) => flag(r, 'Duplicate ID', `ID ${id} appears ${rs.length} times in the ${r.list} list (source rows ${rs.map((x) => x.sourceRow).join(', ')}).`))
  }
  // the same ID in both lists
  const activeById = new Map(); A.filter((r) => r.id).forEach((r) => activeById.set(r.id, [...(activeById.get(r.id) || []), r]))
  const inactiveById = new Map(); I.filter((r) => r.id).forEach((r) => inactiveById.set(r.id, [...(inactiveById.get(r.id) || []), r]))
  const detail = (x) => `${x.list} list${x.registration ? ` (${x.registration})` : ''}, row ${x.sourceRow}, joined ${fmtIso(x.joining) || 'n/a'}, left ${fmtIso(x.leaving) || 'n/a'}`
  for (const [id, rs] of activeById) {
    const other = inactiveById.get(id); if (!other) continue
    rs.forEach((r) => flag(r, 'ID in both lists', `ID ${id} is also in the Inactive list: ${other.map(detail).join('; ')}.`))
    other.forEach((r) => flag(r, 'ID in both lists', `ID ${id} is also in the Active list: ${rs.map(detail).join('; ')}.`))
  }

  const outside = I.filter((r) => r.status.startsWith('Inactive - left outside')).map((r) => ({ id: r.id, name: r.name, leaving: r.leaving }))
  const counts = {}
  exceptions.forEach((e) => { counts[e.flagType] = (counts[e.flagType] || 0) + 1 })
  return {
    active: A, inactive: I, exceptions, window: win,
    summary: {
      sourceRows: { active: active.length, inactive: inactive.length },
      keptRows: { active: A.length, inactive: I.length },
      outside, namesFromPdf: all.filter((r) => r.nameFromPdf).map((r) => ({ id: r.id, name: r.name })),
      flagCounts: counts, exceptionRows: exceptions.length,
    },
  }
}
