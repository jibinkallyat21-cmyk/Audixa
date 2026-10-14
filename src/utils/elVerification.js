// Process 2.1 Step 2 — verification of the EL received from the auditor (Audit360 Execution Rule Book).
// Five checks, each PASS / FAIL / NEEDS REVIEW with the value found and the page it was found on.
// The client's signature and stamp are NOT checked here; that is Step 4, after the client signs.
// AI reading does not prove authenticity: the EL is only VERIFIED once every check passes AND a human
// reviewer has confirmed the checklist.
import { FIRMS } from '../data/firms.js'
import { normalizeName, fmtDate, fmtAmount, parseDate } from './elRequest.js'

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
  fees: { audit: '', translation: '', zakat: '', accounts: '' }, feesIncludeVat: false,
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

// expected = { companyName, period: {start,end}, services: [{key,label,opted,fee}], discount }
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

  // 3. Audit fee, service by service, excluding VAT
  {
    const lines = (expected.services || []).map((x) => {
      const exp = x.opted ? num(x.fee) : null
      const got = num(e.fees[x.key])
      let status = PASS, note = ''
      if (x.opted && exp === null) { status = REVIEW; note = 'Opted in the proposal but no fee is stored.' }
      else if (x.opted && got === null) { status = FAIL; note = 'Opted in the proposal but missing from the EL.' }
      else if (!x.opted && got !== null) { status = FAIL; note = 'In the EL but not opted in the proposal or client profile.' }
      else if (x.opted && round2(exp) !== round2(got)) { status = FAIL; note = `EL ${fmtAmount(got)}; proposal ${fmtAmount(exp)}.` }
      return { key: x.key, label: x.label, opted: x.opted, expected: exp, found: got, status, note }
    })
    const anyFee = Object.values(e.fees).some((v) => num(v) !== null)
    const failed = lines.filter((l) => l.status === FAIL)
    const unsure = lines.filter((l) => l.status === REVIEW)
    const total = (k) => lines.reduce((n, l) => n + (l[k] ?? 0), 0)
    const foundTxt = anyFee ? `SR ${fmtAmount(total('found'))}` : '—'
    const expTxt = `SR ${fmtAmount(total('expected'))}`
    let r
    if (!anyFee) r = out(REVIEW, foundTxt, expTxt, 'No fees could be read from the EL.')
    else if (e.feesIncludeVat) r = out(REVIEW, foundTxt, expTxt, 'The EL fees include VAT; the proposal fees exclude VAT. Reviewer to compare.')
    else if (failed.length) {
      const disc = Number(expected.discount) || 0
      const onlyDiscount = failed.length === 1 && failed[0].expected !== null && failed[0].found !== null && round2(failed[0].expected - failed[0].found) === round2(disc) && disc > 0
      if (onlyDiscount) r = out(REVIEW, foundTxt, expTxt, `The difference on ${failed[0].label} equals the proposal discount (SR ${fmtAmount(disc)}). Reviewer to confirm how the discount should appear in the EL.`)
      else r = out(FAIL, foundTxt, expTxt, failed.map((l) => `${l.label}: ${l.note}`).join(' '))
    } else if (unsure.length) r = out(REVIEW, foundTxt, expTxt, unsure.map((l) => `${l.label}: ${l.note}`).join(' '))
    else r = out(PASS, foundTxt, expTxt, 'Every service matches the proposal (excluding VAT).')
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

  const failed = checks.some((c) => c.result === FAIL)
  const unsure = checks.some((c) => c.result === REVIEW)
  const confirmed = !!(review.confirmed && String(review.reviewedBy || '').trim())
  const overall = failed ? 'NOT VERIFIED' : unsure || !confirmed || openQueries > 0 ? 'PENDING' : 'VERIFIED'
  const discrepancies = checks.filter((c) => c.result !== PASS).map((c) => ({ key: c.key, label: c.label, result: c.result, note: c.overridden ? c.overrideNote : c.note }))
  return { checks, overall, discrepancies, humanReviewNeeded: !confirmed || unsure || openQueries > 0 }
}
