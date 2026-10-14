// Process 2.1 Step 2 — verification of the EL received from the auditor (Audit360 Execution Rule Book).
// Five checks, each PASS / FAIL / NEEDS REVIEW with the value found and the page it was found on.
// The client's signature and stamp are NOT checked here; that is Step 4, after the client signs.
// AI reading does not prove authenticity: the EL is only VERIFIED once every check passes AND a human
// reviewer has confirmed the checklist.
import { FIRMS } from '../data/firms.js'
import { normalizeName, fmtDate, fmtAmount, parseDate, evaluateELRequest } from './elRequest.js'

export const PASS = 'PASS'
export const FAIL = 'FAIL'
export const REVIEW = 'NEEDS REVIEW'

export const CHECKS = [
  { key: 'companyName', label: 'Company name' },
  { key: 'period', label: 'Audit period' },
  { key: 'fee', label: 'Audit fee' },
  { key: 'auditor', label: 'Auditor identity' },
  { key: 'letterhead', label: 'CPA firm letterhead' },
]

export const emptyELData = () => ({
  companyName: '', periodStart: '', periodEnd: '',
  fees: { audit: '', translation: '' }, feesIncludeVat: false,
  auditorName: '', letterheadPresent: null, letterheadFirmName: '',
  pages: { companyName: '', period: '', fee: '', auditor: '', letterhead: '' },
})

const num = (v) => {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(String(v).replace(/[,\s]/g, ''))
  return Number.isFinite(n) ? n : null
}
const round2 = (n) => Math.round(n * 100) / 100

function similarity(a, b) {
  if (!a || !b) return 0
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  }
  return 1 - d[m][n] / Math.max(m, n)
}

const out = (result, found, expected, note, extra = {}) => ({ result, found, expected, note, ...extra })

// expected = { companyName, period: {start,end}, services: [{key,label,opted,fee}] }
export function evaluateELVerification({ firm, expected, el = emptyELData(), overrides = {}, review = {}, openQueries = 0 }) {
  const e = { ...emptyELData(), ...el, fees: { ...emptyELData().fees, ...(el.fees || {}) }, pages: { ...emptyELData().pages, ...(el.pages || {}) } }
  const auto = {}

  // 1. Company name
  {
    const found = String(e.companyName || '').trim()
    const exp = String(expected.companyName || '').trim()
    if (!exp) auto.companyName = out(REVIEW, found || '—', '—', 'The EL request has no confirmed company name to compare with.')
    else if (!found) auto.companyName = out(REVIEW, '—', exp, 'The company name could not be read from the EL.')
    else if (normalizeName(found) === normalizeName(exp)) auto.companyName = out(PASS, found, exp, 'Matches the EL request.')
    else auto.companyName = out(FAIL, found, exp, `EL says "${found}"; the EL request says "${exp}".`)
  }

  // 2. Audit period
  {
    const s = parseDate(e.periodStart), en = parseDate(e.periodEnd)
    const exp = expected.period ? `${fmtDate(expected.period.start)} to ${fmtDate(expected.period.end)}` : '—'
    const found = s && en ? `${fmtDate(e.periodStart)} to ${fmtDate(e.periodEnd)}` : '—'
    if (!expected.period) auto.period = out(REVIEW, found, exp, 'The EL request has no approved audit period to compare with.')
    else if (!s || !en) auto.period = out(REVIEW, found, exp, 'The audit period could not be read from the EL (both dates needed).')
    else if (e.periodStart === expected.period.start && e.periodEnd === expected.period.end) auto.period = out(PASS, found, exp, 'Matches the approved period in the EL request.')
    else auto.period = out(FAIL, found, exp, `EL period ${found}; approved period ${exp}.`)
  }

  // 3. Audit fee, excluding VAT. Only the audit fee (and the translation fee, when the EL shows it) appear in the EL.
  //    Zakat filing and account finalisation fees are shown in the proposal only and are not compared.
  //    A translation fee opted in the proposal but not found in the EL is a low-priority note, not a failure.
  {
    const svc = (k) => (expected.services || []).find((x) => x.key === k) || { key: k, opted: false, fee: null }
    const aud = svc('audit'), tr = svc('translation')
    const auditExp = num(aud.fee), auditGot = num(e.fees.audit)
    const trExp = tr.opted ? num(tr.fee) : null, trGot = num(e.fees.translation)
    const lines = []
    let auditStatus = PASS, auditNote = ''
    if (auditExp === null) { auditStatus = REVIEW; auditNote = 'No audit fee is stored in the proposal.' }
    else if (auditGot === null) { auditStatus = REVIEW; auditNote = 'The audit fee could not be read from the EL.' }
    else if (round2(auditExp) !== round2(auditGot)) { auditStatus = FAIL; auditNote = `EL ${fmtAmount(auditGot)}; proposal ${fmtAmount(auditExp)}.` }
    lines.push({ key: 'audit', label: 'Audit', expected: auditExp, found: auditGot, status: auditStatus, note: auditNote })

    let trStatus = 'N/A', trNote = 'Not opted in the proposal.'
    if (tr.opted) {
      if (trExp === null) { trStatus = REVIEW; trNote = 'Opted in the proposal but no fee is stored.' }
      else if (trGot === null) { trStatus = 'NOT FOUND'; trNote = 'Opted in the proposal but not found in the EL (low-priority note).' }
      else if (round2(trExp) !== round2(trGot)) { trStatus = FAIL; trNote = `EL ${fmtAmount(trGot)}; proposal ${fmtAmount(trExp)}.` }
      else { trStatus = PASS; trNote = '' }
    } else if (trGot !== null) { trStatus = REVIEW; trNote = 'In the EL but not opted in the proposal or client profile.' }
    lines.push({ key: 'translation', label: 'Translation', expected: trExp, found: trGot, status: trStatus, note: trNote })
    lines.push({ key: 'zakat', label: 'Zakat filing', expected: null, found: null, status: 'N/A', note: 'Proposal only, not shown in the EL.' })
    lines.push({ key: 'accounts', label: 'Account finalisation', expected: null, found: null, status: 'N/A', note: 'Proposal only, not shown in the EL.' })

    const failed = lines.filter((l) => l.status === FAIL)
    const unsure = lines.filter((l) => l.status === REVIEW)
    const sum = (k) => round2((lines[0][k] ?? 0) + (lines[1][k] ?? 0))
    const anyFee = auditGot !== null || trGot !== null
    const foundTxt = anyFee ? `SR ${fmtAmount(sum('found'))}` : '—'
    const expTxt = `SR ${fmtAmount(sum('expected'))}`
    let r
    if (!anyFee) r = out(REVIEW, foundTxt, expTxt, 'No fees could be read from the EL.')
    else if (e.feesIncludeVat) r = out(REVIEW, foundTxt, expTxt, 'The EL fees include VAT; the proposal fees exclude VAT. Reviewer to compare.')
    else if (failed.length) r = out(FAIL, foundTxt, expTxt, failed.map((l) => `${l.label}: ${l.note}`).join(' '))
    else if (unsure.length) r = out(REVIEW, foundTxt, expTxt, unsure.map((l) => `${l.label}: ${l.note}`).join(' '))
    else r = out(PASS, foundTxt, expTxt, 'The audit fee matches the proposal (excluding VAT).')
    auto.fee = { ...r, lines }
  }

  // 4. Auditor identity
  {
    const exp = FIRMS[firm]?.legalName || ''
    const found = String(e.auditorName || '').trim()
    if (!exp) auto.auditor = out(REVIEW, found || '—', '—', 'The engagement has no firm set.')
    else if (!found) auto.auditor = out(REVIEW, '—', exp, 'The auditor name could not be read from the EL.')
    else if (normalizeName(found) === normalizeName(exp)) auto.auditor = out(PASS, found, exp, 'The EL names the engagement\'s firm.')
    else if (similarity(normalizeName(found), normalizeName(exp)) >= 0.8) auto.auditor = out(REVIEW, found, exp, 'The name is close to the firm\'s legal name but not identical (spelling).')
    else auto.auditor = out(FAIL, found, exp, `EL names "${found}"; the engagement's firm is "${exp}".`)
  }

  // 5. Letterhead — never passed by the system alone: there is no approved reference letterhead to compare with.
  {
    const exp = `${FIRMS[firm]?.legalName || 'the firm'} letterhead`
    if (e.letterheadPresent === false) auto.letterhead = out(FAIL, 'No CPA firm letterhead seen', exp, 'The EL does not appear to be on the firm\'s letterhead.')
    else if (e.letterheadPresent === true) {
      const same = e.letterheadFirmName && normalizeName(e.letterheadFirmName) === normalizeName(FIRMS[firm]?.legalName || '')
      auto.letterhead = out(REVIEW, e.letterheadFirmName || 'Letterhead present', exp,
        `${same ? 'The letterhead shows the firm\'s name.' : 'A letterhead is present.'} No approved reference letterhead is stored, so a reviewer must confirm the logo, address and contact details.`)
    } else auto.letterhead = out(REVIEW, '—', exp, 'The letterhead could not be assessed from the EL.')
  }

  // Reviewer overrides replace the automatic result. They need a note.
  const checks = CHECKS.map(({ key, label }) => {
    const a = auto[key]
    const o = overrides[key]
    const overridden = !!(o && o.result && String(o.note || '').trim())
    return {
      key, label, ...a, page: e.pages[key] || '',
      auto: a.result, result: overridden ? o.result : a.result, overridden, overrideNote: overridden ? o.note.trim() : '',
    }
  })

  // Low-priority notes: visible to the FO and the project coordinator, never blocking.
  const notices = []
  const feeLines = auto.fee.lines
  if (feeLines[1].status === 'NOT FOUND' && feeLines[0].found !== null) {
    notices.push({
      key: 'translation-not-in-el', priority: 'low', title: 'Translation fee not found in the EL',
      detail: `Translation is opted in the proposal (SR ${fmtAmount(feeLines[1].expected)}) but no translation fee appears in the EL. It may not be included in the EL; FO and the project coordinator to be aware.`,
      owner: 'FO', notify: 'Project coordinator',
    })
  }

  const failed = checks.some((c) => c.result === FAIL)
  const unsure = checks.some((c) => c.result === REVIEW)
  const confirmed = !!(review.confirmed && String(review.reviewedBy || '').trim())
  const overall = failed ? 'NOT VERIFIED' : unsure || !confirmed || openQueries > 0 ? 'PENDING' : 'VERIFIED'
  const discrepancies = checks.filter((c) => c.result !== PASS).map((c) => ({ key: c.key, label: c.label, result: c.result, note: c.overridden ? c.overrideNote : c.note }))
  return { checks, overall, discrepancies, notices, humanReviewNeeded: !confirmed || unsure || openQueries > 0 }
}

// What the EL is checked against: the values the EL request approved and the services in the proposal.
export function expectedFromRequest(req) {
  const ev = evaluateELRequest({ ...req, requestedBy: req.requestedBy })
  return { companyName: ev.values.companyName, period: ev.values.period, services: ev.services }
}
// Verification result for a request that already has an EL recorded (used by the panel and the FO page).
export function verificationForRequest(req) {
  const elr = req.elReceived
  if (!elr) return null
  return evaluateELVerification({
    firm: req.firm, expected: expectedFromRequest(req), el: elr.data, overrides: elr.overrides, review: elr.review,
    openQueries: (elr.queries || []).filter((q) => !q.resolved).length,
  })
}
