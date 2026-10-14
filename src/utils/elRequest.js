// Process 2.1 Step 1 — EL request preparation (Audit360 Execution Rule Book).
// Pure functions only: given the values read from the signed proposal, CR and AOA
// (plus anything the FO or coordinator typed in to resolve a flag) they work out the
// EL request values, the open flags and, once nothing is open, the text draft.
import { AUDIT_TYPES } from '../data/firms.js'

// ── dates (ISO yyyy-mm-dd, UTC) ────────────────────────────────────────────
export function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? '').trim())
  if (!m) return null
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null
}
const iso = (d) => d.toISOString().slice(0, 10)
const addDays = (d, n) => new Date(d.getTime() + n * 864e5)
function makeDate(y, m, d) {
  // clamp 29 Feb to 28 Feb in non-leap years
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return new Date(Date.UTC(y, m - 1, Math.min(d, last)))
}
export function fmtDate(s) {
  const d = parseDate(s)
  if (!d) return ''
  return `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`
}
// First day of the financial year that ends on `end` (a 12-month year).
export function standardStart(end) {
  const e = typeof end === 'string' ? parseDate(end) : end
  if (!e) return null
  const prevEnd = makeDate(e.getUTCFullYear() - 1, e.getUTCMonth() + 1, e.getUTCDate())
  return iso(addDays(prevEnd, 1))
}

// ── names and types ────────────────────────────────────────────────────────
export function normalizeName(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.,'’"()\-_/]/g, ' ')
    .replace(/\blimited liability company\b/g, 'llc')
    .replace(/\bl\s?l\s?c\b/g, 'llc')
    .replace(/\s+/g, ' ')
    .trim()
}
const hasArabic = (s) => /[؀-ۿ]/.test(String(s ?? ''))
const isEnglish = (s) => /[A-Za-z]/.test(String(s ?? '')) && !hasArabic(s)

const TYPE_ALIASES = {
  proper: 'Proper Audit',
  'proper audit': 'Proper Audit',
  disclaimer: 'Disclaimer Audit',
  'disclaimer audit': 'Disclaimer Audit',
  'disclaimer of opinion': 'Disclaimer Audit',
  liquidation: 'Liquidation Audit',
  'liquidation audit': 'Liquidation Audit',
  special: 'Special Audit',
  'special audit': 'Special Audit',
  'special purpose audit': 'Special Audit',
  'agreed-upon procedures': 'Agreed-Upon Procedures',
  'agreed upon procedures': 'Agreed-Upon Procedures',
}
export function normalizeAuditType(s) {
  const k = String(s ?? '').trim().toLowerCase()
  if (!k) return null
  if (TYPE_ALIASES[k]) return TYPE_ALIASES[k]
  return AUDIT_TYPES.find((t) => t.toLowerCase() === k) || null
}

// ── money ──────────────────────────────────────────────────────────────────
const num = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}
export const fmtAmount = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const sar = (n) => `SR. ${fmtAmount(n)}`

// ── what is needed ─────────────────────────────────────────────────────────
export const DOC_LABEL = {
  proposal: 'Proposal',
  cr: 'Commercial Registration (CR)',
  aoa: 'Articles of Association (AOA)',
  misaClosure: 'MISA closure letter',
  ministryLetter: 'Letter received from the Ministry',
}
export function requiredDocs(auditType) {
  const base = ['proposal', 'cr', 'aoa']
  return auditType === 'Liquidation Audit' ? [...base, 'misaClosure', 'ministryLetter'] : base
}

export const emptyFields = () => ({
  proposal: {
    companyName: '', auditType: '', yearEnd: '', revenue: '', signed: false,
    auditFee: '', auditFeeUnclear: false,
    translationOpted: false, translationFee: '',
    zakatOpted: false, zakatFee: '', accountsOpted: false, accountsFee: '',
  },
  cr: { companyName: '', entityType: '', crNumber: '', startDate: '' },
  aoa: { companyName: '', capital: '', yearEndDay: '', yearEndMonth: '', startsFromCR: false },
  liquidation: { misaClosureDate: '', ministryLetterDate: '' },
  resolutions: {
    companyName: '', companyNameNote: '', companyEnglish: '',
    period: { choice: '', foStart: '', otherStart: '', otherEnd: '' },
    liquidationStart: '', liquidationDatesConfirmed: false,
  },
})

// Flag helper. owner = whose dashboard it appears on; notify = who else is told.
function flag(key, kind, title, detail, inputs = []) {
  return { key, kind, title, detail, owner: 'FO', notify: 'Project coordinator', inputs }
}
const inp = (path, label, type = 'text', extra = {}) => ({ path, label, type, ...extra })

// ── the evaluation ─────────────────────────────────────────────────────────
// req = { docs: {proposal?: {fileName}}, fields, clientProfile?: {auditType}, requestedBy }
export function evaluateELRequest(req) {
  const f = { ...emptyFields(), ...(req.fields || {}) }
  const p = f.proposal, cr = f.cr, aoa = f.aoa, liq = f.liquidation, res = f.resolutions
  const docs = req.docs || {}
  const flags = []
  const sources = []
  const values = {}

  // Audit type (3.2): proposal first, then client profile.
  let typeRaw = p.auditType, typeSource = 'Proposal'
  if (!String(typeRaw || '').trim() && req.clientProfile?.auditType) { typeRaw = req.clientProfile.auditType; typeSource = 'Client profile' }
  const auditType = normalizeAuditType(typeRaw)
  if (!String(typeRaw || '').trim()) {
    flags.push(flag('auditType', 'missing', 'Audit type missing', 'The audit type is not in the proposal or the client profile.',
      [inp('proposal.auditType', 'Audit type', 'select', { options: AUDIT_TYPES })]))
  } else if (!auditType) {
    flags.push(flag('auditType', 'unclear', 'Audit type not recognised', `"${typeRaw}" is not one of: ${AUDIT_TYPES.join(', ')}.`,
      [inp('proposal.auditType', 'Audit type', 'select', { options: AUDIT_TYPES })]))
  } else {
    values.auditType = auditType
    sources.push({ field: 'Audit type', value: auditType, source: typeSource })
  }

  // 1. Required documents
  for (const d of requiredDocs(auditType)) {
    if (!docs[d]?.fileName) {
      const who = d === 'cr' || d === 'aoa' ? 'It should already be on the platform from the previous process. ' : ''
      flags.push(flag(`doc-${d}`, 'document', `${DOC_LABEL[d]} not available`, `${who}Ask the FO to upload it.`))
    }
  }

  // 3.1 Company name
  const crName = String(cr.companyName || '').trim(), aoaName = String(aoa.companyName || '').trim()
  if (!crName || !aoaName) {
    flags.push(flag('companyName-missing', 'missing', 'Company name cannot be verified',
      `${!crName ? 'CR' : 'AOA'} company name is missing, so it cannot be compared.`,
      [inp(!crName ? 'cr.companyName' : 'aoa.companyName', `${!crName ? 'CR' : 'AOA'} company name`)]))
  } else if (normalizeName(crName) !== normalizeName(aoaName)) {
    if (String(res.companyName || '').trim()) {
      values.companyName = res.companyName.trim()
      sources.push({ field: 'Company name', value: values.companyName, source: `Confirmed by FO${res.companyNameNote ? ` — ${res.companyNameNote}` : ''}` })
    } else {
      flags.push(flag('companyName-mismatch', 'mismatch', 'Company name differs between CR and AOA',
        `CR: "${crName}". AOA: "${aoaName}". The EL request cannot be finalised until FO clarifies.`,
        [inp('resolutions.companyName', 'Confirmed company name (English)'), inp('resolutions.companyNameNote', 'Note (optional)')]))
    }
  } else {
    const english = [crName, aoaName].find(isEnglish) || String(res.companyEnglish || '').trim()
    if (english) {
      values.companyName = english
      sources.push({ field: 'Company name', value: english, source: 'CR and AOA agree' })
    } else {
      flags.push(flag('companyName-english', 'missing', 'English company name needed',
        'The CR and AOA agree but only an Arabic name is available. Enter the English translation.',
        [inp('resolutions.companyEnglish', 'Company name in English')]))
    }
  }

  // 3.4 Business entity
  const entity = String(cr.entityType || '').trim()
  if (entity) { values.entity = entity; sources.push({ field: 'Business entity', value: entity, source: 'CR' }) }
  else flags.push(flag('entity', 'missing', 'Business entity missing', 'The entity type is not shown on the CR.', [inp('cr.entityType', 'Business entity (as on the CR)')]))

  // 3.5 Capital
  const capital = String(aoa.capital || '').trim()
  if (capital) {
    values.capital = /^[\d,.\s]+$/.test(capital) ? sar(num(capital) ?? 0) : capital
    sources.push({ field: 'Capital', value: values.capital, source: 'AOA' })
  } else flags.push(flag('capital', 'missing', 'Capital missing', 'The capital amount is missing or could not be identified in the AOA.', [inp('aoa.capital', 'Capital (as stated in the AOA)')]))

  // 3.6 Revenue
  const revenue = num(p.revenue)
  if (revenue !== null) { values.revenue = sar(revenue); sources.push({ field: 'Revenue', value: values.revenue, source: 'Proposal' }) }
  else flags.push(flag('revenue', 'missing', 'Revenue missing', 'The revenue amount is not in the proposal. FO to provide it.', [inp('proposal.revenue', 'Revenue (SR)', 'number')]))

  // 3.7 Fee: audit fee + translation fee only
  const auditFee = num(p.auditFee)
  const feeInputs = [inp('proposal.auditFee', 'Audit fee (SR, excl. VAT)', 'number')]
  if (auditFee === null || p.auditFeeUnclear) {
    flags.push(flag('fee-audit', 'unclear', 'Audit fee missing or unclear',
      p.auditFeeUnclear ? 'The audit fee cannot be told apart from the other fees in the proposal.' : 'The audit fee is not in the proposal.', [
        ...feeInputs, inp('proposal.auditFeeUnclear', 'Audit fee is unclear in the proposal', 'checkbox'),
      ]))
  } else {
    let total = auditFee
    let detail = `Audit fee ${sar(auditFee)}`
    if (p.translationOpted) {
      const t = num(p.translationFee)
      if (t === null) flags.push(flag('fee-translation', 'missing', 'Translation fee missing', 'Translation is opted in the proposal but its fee is missing.', [inp('proposal.translationFee', 'Translation fee (SR, excl. VAT)', 'number')]))
      else { total += t; detail += ` + translation fee ${sar(t)}` }
    }
    if (!flags.some((x) => x.key === 'fee-translation')) {
      values.fee = sar(total)
      sources.push({ field: 'Estimated fee', value: values.fee, source: `Proposal — ${detail} (zakat and accounts fees not included)` })
    }
  }

  // 3.3 Audit period
  const period = resolvePeriod({ auditType, p, cr, aoa, liq, res, docs, flags, sources })
  if (period) values.period = period

  const ready = flags.length === 0 && Object.keys(values).length >= 7 && !!values.period
  const draft = ready ? buildDraft(req.requestedBy, values) : null
  return { flags, values, sources, ready, draft }
}

function resolvePeriod({ auditType, p, cr, aoa, liq, res, flags, sources }) {
  const aoaDay = num(aoa.yearEndDay), aoaMonth = num(aoa.yearEndMonth)
  const aoaOk = aoaDay !== null && aoaMonth !== null && aoaMonth >= 1 && aoaMonth <= 12 && aoaDay >= 1 && aoaDay <= 31
  const set = (start, end, basis) => {
    sources.push({ field: 'Audit period', value: `${fmtDate(start)} to ${fmtDate(end)}`, source: basis })
    return { start, end, basis }
  }

  // Scenario 4: liquidation audit — end date is the later of the two letters.
  if (auditType === 'Liquidation Audit') {
    const a = parseDate(liq.misaClosureDate), b = parseDate(liq.ministryLetterDate)
    if (!a || !b) {
      flags.push(flag('period-liq-dates', 'unclear', 'Liquidation dates unclear',
        'The date on the MISA closure letter and the date on the Ministry letter are both needed to fix the end date.', [
          inp('liquidation.misaClosureDate', 'MISA closure letter date', 'date'),
          inp('liquidation.ministryLetterDate', 'Ministry letter date', 'date'),
        ]))
      return null
    }
    const end = iso(a > b ? a : b)
    let start = String(res.liquidationStart || '').trim()
    let startNote = 'start entered by user'
    if (!start && cr.startDate && aoa.startsFromCR) { start = cr.startDate; startNote = 'start from CR (AOA refers to the CR start date)' }
    if (!start && aoaOk) {
      const e = parseDate(end)
      let ye = makeDate(e.getUTCFullYear(), aoaMonth, aoaDay)
      if (ye >= e) ye = makeDate(e.getUTCFullYear() - 1, aoaMonth, aoaDay)
      start = iso(addDays(ye, 1)); startNote = 'start derived from the AOA financial year-end'
    }
    if (!parseDate(start)) {
      flags.push(flag('period-liq-start', 'missing', 'Liquidation start date missing', 'The start date cannot be derived from the AOA. Enter it.', [inp('resolutions.liquidationStart', 'Audit period start date', 'date')]))
      return null
    }
    if (parseDate(start) > parseDate(end)) {
      flags.push(flag('period-liq-inconsistent', 'mismatch', 'Liquidation dates inconsistent', `The end date ${fmtDate(end)} is before the start date ${fmtDate(start)}.`, [inp('resolutions.liquidationStart', 'Audit period start date', 'date')]))
      return null
    }
    return set(start, end, `Liquidation: later of MISA closure (${fmtDate(iso(a))}) and Ministry letter (${fmtDate(iso(b))}); ${startNote}`)
  }

  // Scenarios 1–3 need the proposal year-end and the AOA year-end.
  const pEnd = parseDate(p.yearEnd)
  if (!pEnd) {
    flags.push(flag('period-proposal-yearend', 'missing', 'Proposal year-end missing', 'The year-end column of the proposal is empty or not a date.', [inp('proposal.yearEnd', 'Year-end per proposal', 'date')]))
    return null
  }
  if (!aoaOk) {
    flags.push(flag('period-aoa-yearend', 'missing', 'AOA year-end missing', 'The financial year-end could not be identified in the AOA.', [
      inp('aoa.yearEndDay', 'AOA year-end day', 'number', { min: 1, max: 31 }), inp('aoa.yearEndMonth', 'AOA year-end month', 'number', { min: 1, max: 12 }),
    ]))
    return null
  }
  const matches = pEnd.getUTCDate() === aoaDay && pEnd.getUTCMonth() + 1 === aoaMonth
  const aoaEnd = makeDate(pEnd.getUTCFullYear(), aoaMonth, aoaDay)
  const startFor = (end) => {
    if (aoa.startsFromCR) return parseDate(cr.startDate) ? cr.startDate : null
    return standardStart(end)
  }
  const firstYear = !!aoa.startsFromCR
  const needCrStart = () => flags.push(flag('period-cr-start', 'missing', 'CR start date missing', 'The AOA refers to the CR start date (first-year audit) but no start date is on the CR.', [inp('cr.startDate', 'CR start date', 'date')]))

  if (matches) {
    const start = startFor(iso(pEnd))
    if (!start) { needCrStart(); return null }
    return set(start, iso(pEnd), firstYear ? 'First-year audit: start per CR, year-end per AOA (matches proposal)' : 'AOA year-end matches the proposal year-end')
  }

  // Scenario 2: mismatch — the FO / coordinator chooses.
  const ch = res.period?.choice
  const detail = `AOA year-end is ${String(aoaDay).padStart(2, '0')}-${String(aoaMonth).padStart(2, '0')}; the proposal says ${fmtDate(p.yearEnd)}.`
  const choiceFlag = (extra = []) => flag('period-mismatch', 'period-choice', 'Audit period: AOA and proposal year-ends differ', `${detail} Choose how to proceed.`, extra)
  if (!ch) { flags.push(choiceFlag()); return null }
  if (ch === 'fo') {
    if (!parseDate(res.period.foStart)) { flags.push(choiceFlag()); return null }
    return set(res.period.foStart, iso(pEnd), "Proceeding with the FO's date; start date provided")
  }
  if (ch === 'aoa') {
    const start = startFor(iso(aoaEnd))
    if (!start) { needCrStart(); return null }
    return set(start, iso(aoaEnd), `Proceeding with the AOA date (applied to ${aoaEnd.getUTCFullYear()}, the proposal year)`)
  }
  if (ch === 'other') {
    const s = parseDate(res.period.otherStart), e = parseDate(res.period.otherEnd)
    if (!s || !e || s > e) { flags.push(choiceFlag()); return null }
    return set(res.period.otherStart, res.period.otherEnd, 'Dates entered by FO / coordinator')
  }
  flags.push(choiceFlag())
  return null
}

export function buildDraft(requestedBy, v) {
  return [
    `${requestedBy || '(Employee name)'} Analytix _BO Audit`,
    '',
    'Kindly issue EL',
    '',
    `Company name : ${v.companyName}`,
    '',
    `Audit Type: ${v.auditType}`,
    '',
    `Audit period - ${fmtDate(v.period.start)} to ${fmtDate(v.period.end)}`,
    '',
    `Business Entity : ${v.entity}`,
    '',
    `Capital: ${v.capital}`,
    '',
    `Revenue : ${v.revenue}`,
    '',
    `Estimated Fee Amount : ${v.fee}`,
  ].join('\n')
}

// ── path helpers for the form ──────────────────────────────────────────────
export function getPath(o, path) {
  return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o)
}
export function setPath(o, path, value) {
  const keys = path.split('.')
  const next = { ...o }
  let cur = next
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value
    else { cur[k] = { ...(cur[k] || {}) }; cur = cur[k] }
  })
  return next
}
