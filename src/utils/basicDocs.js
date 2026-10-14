// Process 3.2 — Basic documents review (Audit360 Execution Rule Book): AOA, MISA, VAT certificate, EL.
// The documents are read into structured fields (by Claude, or typed in); everything below is plain,
// tested comparison logic. A value that is not in the document is reported as missing, never assumed.
import { normalizeName, fmtDate, parseDate } from './elRequest.js'

const blank = (v) => v === null || v === undefined || String(v).trim() === ''
const money = (n) => (n === null || n === undefined ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const pct = (n) => (n === null || n === undefined ? 'not stated' : `${Number(n)}%`)
export const toNum = (v) => {
  if (blank(v)) return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

// ── nationality ────────────────────────────────────────────────────────────
const GCC = ['saudi', 'saudi arabia', 'ksa', 'kingdom of saudi arabia', 'uae', 'emirati', 'emirates', 'united arab emirates', 'kuwait', 'kuwaiti', 'qatar', 'qatari', 'bahrain', 'bahraini', 'oman', 'omani', 'sultanate of oman', 'kingdom of bahrain', 'state of qatar', 'state of kuwait']
export const isGCC = (country) => GCC.includes(String(country ?? '').trim().toLowerCase())

const nameKey = (s) => normalizeName(s).split(' ').filter(Boolean).sort().join(' ')
function sim(a, b) {
  if (!a || !b) return 0
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return 1 - d[m][n] / Math.max(m, n)
}
// legal-form suffix removed, so "X LLC" and "X" are recognised as the same name with a wording difference
const stripForm = (s) => normalizeName(s).replace(/\b(llc|co|company|ltd|limited|establishment|est|wll|jsc|inc)\b/g, ' ').replace(/\s+/g, ' ').trim()
export function compareNames(a, b) {
  if (blank(a) || blank(b)) return 'Not provided'
  if (normalizeName(a) === normalizeName(b)) return 'Yes'
  if (stripForm(a) === stripForm(b)) return 'Review: legal form wording differs'
  if (nameKey(a) === nameKey(b)) return 'Review: word order differs'
  if (sim(normalizeName(a), normalizeName(b)) >= 0.85) return 'Review: spelling differs'
  return 'No'
}
const isYes = (m) => m === 'Yes'

// ── 1. AOA ─────────────────────────────────────────────────────────────────
export function reviewAOA(d = {}) {
  const sh = d.shareholders || []
  const mgr = d.managers || []
  const flags = []
  const ref = (r) => (blank(r) ? '' : r)
  const sections = []

  // 1 Fiscal year
  const s1 = { title: '1. Fiscal year', rows: [] }
  if (blank(d.fiscalYearEndDay) || blank(d.fiscalYearEndMonth)) { s1.rows.push({ item: 'Fiscal year end', value: 'Not found', ref: '' }); flags.push('Fiscal year-end is missing or unclear.') }
  else s1.rows.push({ item: 'Fiscal year end', value: `${d.fiscalYearEndDay} / ${d.fiscalYearEndMonth} (day / month)`, ref: ref(d.fiscalYearRef) })
  s1.rows.push({ item: 'Fiscal year start', value: blank(d.fiscalYearStartDay) ? 'Not stated (follows from the year-end)' : `${d.fiscalYearStartDay} / ${d.fiscalYearStartMonth} (day / month)`, ref: ref(d.fiscalYearRef) })
  s1.rows.push({ item: 'First fiscal year differs in length', value: d.firstYearDiffers === true ? `Yes. ${d.firstYearNote || ''}`.trim() : d.firstYearDiffers === false ? 'No' : 'Not stated', ref: ref(d.fiscalYearRef) })
  sections.push(s1)

  // 2 Ownership and parent company
  const s2 = { title: '2. Ownership and parent company', rows: [{ item: 'Total number of owners', value: String(sh.length), ref: '' }] }
  sh.forEach((x, i) => s2.rows.push({ item: `Owner ${i + 1}${x.isCorporate ? ' (corporate)' : ''}`, value: `${x.name || 'Name not found'}: ${x.shares == null ? 'shares not stated' : `${money(x.shares)} shares`}, ${pct(x.percent)}`, ref: ref(x.ref) }))
  const total = sh.reduce((n, x) => n + (toNum(x.percent) ?? 0), 0)
  if (sh.length === 0) flags.push('No shareholders were found.')
  else if (sh.some((x) => toNum(x.percent) === null)) flags.push('A shareholder percentage is missing.')
  else if (Math.abs(total - 100) > 0.01) flags.push(`Shareholder percentages add up to ${total}%, not 100%.`)
  const corp = sh.filter((x) => x.isCorporate)
  s2.rows.push({ item: 'Parent company', value: corp.length ? `Yes: ${corp.map((x) => `${x.name} (${pct(x.percent)})`).join('; ')}` : 'No corporate shareholder', ref: '' })
  s2.rows.push({ item: 'Managers', value: `${mgr.length}${mgr.length ? `: ${mgr.map((m) => m.name).join(', ')}` : ''}`, ref: ref(d.managersRef) })
  if (mgr.length === 0) flags.push('No managers were found.')
  sections.push(s2)

  // 3 Classification and MISA
  const s3 = { title: '3. Foreign or GCC classification and MISA requirement', rows: [] }
  const origin = sh.map((x) => ({ name: x.name, country: x.isCorporate ? x.countryOfIncorporation : x.nationality, corp: !!x.isCorporate }))
  origin.forEach((o) => s3.rows.push({ item: o.name || 'Shareholder', value: blank(o.country) ? 'Nationality not stated' : `${o.country}${o.corp ? ' (country of incorporation)' : ''}: ${isGCC(o.country) ? 'GCC' : 'non-GCC'}`, ref: '' }))
  let cls = 'Unclear'
  if (origin.length && origin.every((o) => !blank(o.country))) cls = origin.every((o) => isGCC(o.country)) ? 'GCC' : origin.every((o) => !isGCC(o.country)) ? 'Foreign' : 'Mixed'
  else if (origin.length) flags.push('A shareholder nationality is missing, so the classification cannot be completed.')
  s3.rows.push({ item: 'Classification', value: cls, ref: '' })
  s3.rows.push({
    item: 'MISA license', ref: '',
    value: cls === 'Foreign' ? 'Required. Basis: every shareholder is non-GCC (foreign-owned), and foreign ownership needs a MISA license. Verify against current MISA rules.'
      : cls === 'GCC' ? 'Not indicated by shareholder nationality (all shareholders are GCC).'
      : cls === 'Mixed' ? 'Not covered by the foreign-only rule; the reviewer decides.' : 'Cannot be concluded.',
  })
  sections.push(s3)

  // 4 Amendment status
  const n = d.amendmentHeaderNumber
  const s4 = { title: '4. Amendment status', rows: [{ item: 'Number in the header of page 1', value: n == null ? 'Not found' : String(n), ref: ref(d.amendmentRef) }] }
  s4.rows.push({ item: 'Conclusion', value: n == null ? 'Cannot be concluded' : n <= 1 ? 'Not amended (header shows 1)' : `Amended (header shows ${n})`, ref: '' })
  if (n == null) flags.push('The amendment number in the header of page 1 was not found.')
  sections.push(s4)

  return { sections, flags, classification: cls }
}

// ── 2. MISA ────────────────────────────────────────────────────────────────
export function reviewMISA(licenses = [], aoa = {}, { today = new Date().toISOString().slice(0, 10), crNumber = '' } = {}) {
  const flags = []
  if (licenses.length === 0) return { licenses: [], table: [], flags: ['No MISA license has been provided.'], provided: false }
  const t = parseDate(today)
  const info = licenses.map((l, i) => {
    const exp = parseDate(l.expiryDate)
    let validity = 'Expiry date not found'
    if (exp) {
      const days = Math.round((exp - t) / 864e5)
      validity = days < 0 ? `Expired ${-days} days ago` : days <= 90 ? `Valid, EXPIRING SOON (${days} days)` : `Valid (${days} days left)`
    } else flags.push(`License ${l.licenseNumber || i + 1}: expiry date not found.`)
    if (exp && exp < t) flags.push(`License ${l.licenseNumber || i + 1} has expired.`)
    else if (exp && Math.round((exp - t) / 864e5) <= 90) flags.push(`License ${l.licenseNumber || i + 1} expires within 90 days.`)
    return { ...l, validity, label: l.licenseNumber || `License ${i + 1}` }
  })

  const table = []
  const row = (item, misa, aoaV, match, ref = '') => table.push({ item, misa, aoa: aoaV, match, ref })
  // name
  info.forEach((l) => {
    const names = [l.companyNameEn, l.companyNameAr].filter((x) => !blank(x)).join(' / ')
    const m = compareNames(l.companyNameEn, aoa.companyName)
    row(`Company name (${l.label})`, names || 'Not found', aoa.companyName || 'Not provided', m, l.ref)
    if (!isYes(m)) flags.push(`Company name on ${l.label}: ${m}.`)
  })
  // unified number vs CR number
  info.forEach((l) => {
    const cr = blank(aoa.crNumber) ? crNumber : aoa.crNumber
    const m = blank(l.unifiedNumber) || blank(cr) ? 'Not provided' : String(l.unifiedNumber).trim() === String(cr).trim() ? 'Yes' : 'No'
    row(`Unified / CR number (${l.label})`, l.unifiedNumber || 'Not found', cr || 'Not provided', m, l.ref)
    if (m === 'No') flags.push(`Unified number on ${l.label} differs from the CR number.`)
  })
  // capital: combined total when there is more than one license
  const caps = info.map((l) => toNum(l.capitalAmount))
  const aoaCap = toNum(aoa.capitalAmount ?? aoa.capital)
  const total = caps.every((c) => c !== null) ? caps.reduce((a, b) => a + b, 0) : null
  const cm = total === null || aoaCap === null ? 'Not provided' : Math.abs(total - aoaCap) < 0.01 ? 'Yes' : 'No'
  row(info.length > 1 ? `Capital (combined, ${info.length} licenses)` : 'Capital', total === null ? 'Not found' : money(total), aoaCap === null ? 'Not provided' : money(aoaCap), cm)
  if (cm === 'No') flags.push(`Capital on the MISA ${info.length > 1 ? 'licenses combined' : 'license'} (${money(total)}) differs from the AOA (${money(aoaCap)}).`)
  // shareholders, both directions
  const misaSh = info.flatMap((l) => (l.shareholders || []).map((s) => ({ ...s, from: l.label })))
  const aoaSh = aoa.shareholders || []
  if (misaSh.length === 0) { row('Shareholders', 'Not found', aoaSh.map((s) => s.name).join('; ') || 'Not provided', 'Not provided'); flags.push('No shareholders were found on the MISA license.') }
  const usedAoa = new Set()
  misaSh.forEach((s) => {
    let best = null
    aoaSh.forEach((a, i) => { const m = compareNames(s.name, a.name); const rank = m === 'Yes' ? 3 : m.startsWith('Review') ? 2 : 0; if (rank && (!best || rank > best.rank)) best = { i, m, rank, a } })
    if (best) {
      usedAoa.add(best.i)
      let m = best.m
      if (m === 'Yes' && !blank(s.percent) && !blank(best.a.percent) && Number(s.percent) !== Number(best.a.percent)) m = `No: ownership ${s.percent}% on MISA vs ${best.a.percent}% in the AOA`
      row(`Shareholder: ${s.name}`, `${s.name}${s.nationality ? `, ${s.nationality}` : ''}${blank(s.percent) ? '' : `, ${s.percent}%`}`, best.a.name, m)
      if (m !== 'Yes') flags.push(`Shareholder ${s.name}: ${m}.`)
    } else {
      row(`Shareholder: ${s.name}`, s.name, 'Not in the AOA', 'No'); flags.push(`${s.name} is on the MISA license but not in the AOA (for example a partner who exited in an amendment).`)
    }
  })
  aoaSh.forEach((a, i) => { if (!usedAoa.has(i) && misaSh.length) { row(`Shareholder: ${a.name}`, 'Not on the MISA license', a.name, 'No'); flags.push(`${a.name} is in the AOA but not on the MISA license.`) } })
  return { licenses: info, table, flags, provided: true }
}

// ── 3. VAT certificate ─────────────────────────────────────────────────────
export function reviewVAT(d = {}, aoa = {}, { crNumber = '' } = {}) {
  const table = []
  const flags = []
  const row = (item, vat, aoaV, match) => table.push({ item, vat: blank(vat) ? 'Not found' : String(vat), aoa: blank(aoaV) ? 'Not provided' : String(aoaV), match })
  const nm = compareNames(d.companyName, aoa.companyName)
  row('Company name', d.companyName, aoa.companyName, nm === 'Yes' ? 'Match' : nm === 'Not provided' ? 'Not provided' : 'Mismatch')
  if (nm !== 'Yes') flags.push(`Company name: ${nm}.`)
  const cr = blank(aoa.crNumber) ? crNumber : aoa.crNumber
  const crM = blank(d.crNumber) || blank(cr) ? 'Not provided' : String(d.crNumber).trim() === String(cr).trim() ? 'Match' : 'Mismatch'
  row('Commercial Registration (CR) number', d.crNumber, cr, crM)
  if (crM === 'Mismatch') flags.push('CR number on the VAT certificate differs from the AOA / client profile.')
  const addrM = blank(d.address) || blank(aoa.registeredAddress) ? 'Not provided' : normalizeName(d.address) === normalizeName(aoa.registeredAddress) ? 'Match' : 'Mismatch'
  row('Address', d.address, aoa.registeredAddress, addrM)
  if (addrM === 'Mismatch') flags.push('Address differs between the VAT certificate and the AOA.')
  row('Tax period (filing frequency)', [d.taxFrequency, d.taxPeriodText].filter((x) => !blank(x)).join(': '), '', 'Not provided')
  const digits = String(d.trn ?? '').replace(/\D/g, '')
  row('VAT registration number (TRN)', blank(d.trn) ? '' : `${d.trn} (${digits.length} digits${digits.length === 15 ? '' : '; a Saudi TRN is expected to have 15 digits'})`, '', 'Not provided')
  if (!blank(d.trn) && digits.length !== 15) flags.push(`The TRN has ${digits.length} digits; a Saudi TRN normally has 15.`)
  if (blank(d.trn)) flags.push('The VAT registration number was not found.')
  row('Effective registration date', blank(d.effectiveDate) ? '' : fmtDate(d.effectiveDate) || d.effectiveDate, '', 'Not provided')
  const branches = d.branches || []
  row('Branches', d.hasBranches === false ? 'None listed' : d.hasBranches === true ? `${branches.length} branch(es) listed` : '', '', 'Not provided')
  branches.forEach((b, i) => row(`Branch ${i + 1}`, [b.name, b.crNumber && `CR ${b.crNumber}`, b.licenseNumber && `License ${b.licenseNumber}`, b.contractNumber && `Contract ${b.contractNumber}`, b.address].filter(Boolean).join(' | '), '', 'Not provided'))
  const missing = []
  if (blank(aoa.companyName)) missing.push('AOA (needed for the comparison)')
  return { table, flags, missing }
}

// ── 4. Engagement letter (basic review) ────────────────────────────────────
export function reviewEL(d = {}, aoa = {}) {
  const checks = []
  const add = (check, finding, status, remarks) => checks.push({ check, finding, status, remarks })
  // 1 company name
  const nm = compareNames(d.companyName, aoa.companyName)
  add('Company name', `EL: ${d.companyName || 'not found'}. AOA: ${aoa.companyName || 'not provided'}.`, nm === 'Yes' ? 'Pass' : nm === 'Not provided' ? 'Unclear' : 'Fail', nm === 'Yes' ? 'Matches the AOA.' : nm === 'Not provided' ? 'One of the names is missing.' : nm)
  // 2 fiscal / audit year
  const s = parseDate(d.auditPeriodStart), e = parseDate(d.auditPeriodEnd)
  if (!s || !e) add('Fiscal / audit year', `Start ${d.auditPeriodStart || 'not found'}, end ${d.auditPeriodEnd || 'not found'}.`, 'Unclear', 'The period could not be read from the EL.')
  else {
    const ok = !blank(aoa.fiscalYearEndDay) && !blank(aoa.fiscalYearEndMonth)
    const same = ok && e.getUTCDate() === Number(aoa.fiscalYearEndDay) && e.getUTCMonth() + 1 === Number(aoa.fiscalYearEndMonth)
    add('Fiscal / audit year', `Start ${fmtDate(d.auditPeriodStart)}, end ${fmtDate(d.auditPeriodEnd)}; year-end ${fmtDate(d.auditPeriodEnd).slice(0, 5)}.`, !ok ? 'Unclear' : same ? 'Pass' : 'Fail', !ok ? 'The AOA year-end is not available to compare.' : same ? 'The EL year-end agrees with the AOA.' : `The AOA year-end is ${aoa.fiscalYearEndDay}/${aoa.fiscalYearEndMonth}.`)
  }
  // 3 seal and signature on every page
  const pages = d.pages || []
  if (pages.length === 0) add('Company seal and signature on every page', 'No page information found.', 'Unclear', 'Pages could not be assessed.')
  else {
    const list = (key) => pages.map((p) => `p${p.page}: ${p[key] === true ? 'present' : p[key] === false ? 'MISSING' : 'unclear'}`).join(', ')
    const bad = pages.filter((p) => p.seal === false || p.signature === false)
    const unclear = pages.filter((p) => p.seal == null || p.signature == null)
    add('Company seal and signature on every page', `Seal: ${list('seal')}. Signature: ${list('signature')}.`, bad.length ? 'Fail' : unclear.length ? 'Unclear' : 'Pass',
      bad.length ? `Missing on page(s) ${bad.map((p) => p.page).join(', ')}.` : unclear.length ? `Could not be assessed on page(s) ${unclear.map((p) => p.page).join(', ')}.` : 'Seal and signature on every page.')
  }
  // 4 audit fees
  const fee = toNum(d.auditFee)
  const known = fee !== null && !blank(d.currency) && typeof d.vatIncluded === 'boolean'
  add('Audit fees', `${fee === null ? 'Amount not found' : money(fee)} ${d.currency || ''}; VAT ${d.vatIncluded === true ? 'included' : d.vatIncluded === false ? 'excluded' : 'not stated'}.`.replace(/\s+/g, ' '),
    known ? 'Pass' : 'Unclear', known ? 'Amount, currency and VAT treatment are stated.' : 'The amount, currency or VAT treatment is missing.')
  const issues = checks.filter((c) => c.status !== 'Pass').map((c) => `${c.check}: ${c.remarks}`)
  const conclusion = checks.some((c) => c.status === 'Fail') ? 'Not acceptable as is: correct the items that failed.'
    : checks.some((c) => c.status === 'Unclear') ? 'Cannot be concluded yet: some items are unclear and need a reviewer.' : 'Acceptable as is, subject to the reviewer\'s own check.'
  return { checks, issues, conclusion }
}
