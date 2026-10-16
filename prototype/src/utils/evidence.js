// Supporting documents behind a schedule line (first built for prepaid expenses; the same shape serves the other areas).
// A line is backed by up to three documents: the agreement (if the item has one), the tax invoice, and the payment proof.
// The figures (amount, period, names) are read from the agreement or the invoice, whichever shows them; the payment proof only confirms it was paid.
// Code compares; a person decides every flag. Pure functions, so they are tested.
import { NO_VAT_CATEGORIES, r2 } from './prepaidDep.js'

export const PART_LABEL = { agreement: 'Agreement', invoice: 'Tax invoice', receipt: 'Government receipt', delivery: 'Delivery or contract proof', payment: 'Payment proof' }
const WITH_AGREEMENT = ['Rent', 'Insurance – medical', 'Insurance – vehicle / motor', 'Insurance – property / other']

// Which documents a prepaid line needs. Which categories carry an agreement is an assumption pending the audit lead's confirmation.
export function prepaidParts(category) {
  const govt = NO_VAT_CATEGORIES.includes(category)
  return [
    { part: 'agreement', need: WITH_AGREEMENT.includes(category) ? 'If applicable' : 'Not applicable' },
    { part: govt ? 'receipt' : 'invoice', need: 'Required' },
    { part: 'payment', need: 'Required' },
  ].filter((p) => p.need !== 'Not applicable')
}
// The other areas. Which documents each needs is an assumption pending the audit lead's confirmation.
export const fixedAssetParts = () => [{ part: 'invoice', need: 'Required' }, { part: 'payment', need: 'Required' }]
export const accrualParts = () => [{ part: 'agreement', need: 'If applicable', label: 'Contract or engagement letter' }, { part: 'invoice', need: 'Required', label: 'Invoice or statement' }, { part: 'payment', need: 'Required', label: 'Payment after the year end' }]
export function vouchingParts(kind) {
  if (kind === 'sales') return [{ part: 'invoice', need: 'Required', label: 'Sales invoice' }, { part: 'delivery', need: 'If applicable' }, { part: 'payment', need: 'If applicable', label: 'Receipt proof' }]
  return [{ part: 'invoice', need: 'Required', label: kind === 'cogs' ? 'Supplier invoice' : 'Supplier invoice' }, { part: 'payment', need: 'Required' }]
}

const clean = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()
const extOf = (name) => ((String(name || '').match(/\.([A-Za-z0-9]{2,5})$/) || [])[1] || 'pdf').toLowerCase()
// The client may upload under any name (IMG_4471.pdf); it is shown as: Prepaid - Medical policy MP-8890 - Tax invoice.pdf
export const standardName = (area, subject, part, original, label) => `${clean(area)} - ${clean(subject)} - ${label || PART_LABEL[part]}.${extOf(original)}`

const same = (a, b) => clean(a).toLowerCase() === clean(b).toLowerCase() && clean(a) !== ''
const near = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005

// line: { amount (net), vatPct, start?, end?, date?, vendor? }. docs: [{ part, original, fields: { company, vendor, net, start, end, date, paid } }]. parts: what the line needs.
// The figures come from the invoice or the agreement, whichever shows them; the payment proof only confirms it was paid.
export function checkEvidence(line, docs, company, parts = []) {
  const byPart = (p) => docs.find((d) => d.part === p)
  const order = ['invoice', 'receipt', 'agreement'].map(byPart)
  const src = order.find((d) => d && d.fields && d.fields.net !== undefined && d.fields.net !== '') || order.find(Boolean)
  const pay = byPart('payment')
  const checks = []
  if (!src) return { status: 'Not received', source: null, checks, vendor: '' }
  const f = src.fields || {}
  checks.push({ label: 'Company name', ok: same(f.company, company), found: f.company || 'Not shown', expected: company, detail: `Document: ${f.company || 'not shown'}` })
  checks.push({ label: 'Net amount', ok: f.net !== undefined && f.net !== '' && near(f.net, line.amount), found: f.net ?? 'Not shown', expected: line.amount, detail: `Document: ${f.net ?? 'not shown'} · Schedule: ${line.amount}` })
  if (line.start || line.end) {
    checks.push({ label: 'Period starts', ok: f.start === line.start, found: f.start || 'Not shown', expected: line.start || 'Blank', detail: `Document: ${f.start || 'not shown'} · Schedule: ${line.start || 'blank'}` })
    checks.push({ label: 'Period ends', ok: f.end === line.end, found: f.end || 'Not shown', expected: line.end || 'Blank', detail: `Document: ${f.end || 'not shown'} · Schedule: ${line.end || 'blank'}` })
  }
  if (line.date) checks.push({ label: 'Date', ok: f.date === line.date, found: f.date || 'Not shown', expected: line.date, detail: `Document: ${f.date || 'not shown'} · Schedule: ${line.date}` })
  const others = docs.filter((d) => d !== src && d.part !== 'payment' && d.fields?.vendor)
  checks.push({ label: 'Counterparty name', ok: !!f.vendor && (!line.vendor || same(f.vendor, line.vendor)) && others.every((d) => same(d.fields.vendor, f.vendor)), found: f.vendor || 'Not shown', expected: line.vendor || (others.length ? 'Same on the other documents' : 'Not on the schedule'), detail: `Document: ${f.vendor || 'not shown'}${line.vendor ? ` · Schedule: ${line.vendor}` : ''}${others.length ? ' · same on the other documents' : ''}` })
  const figuresOk = checks.every((c) => c.ok)
  let payOk = null
  if (pay) {
    const p = pay.fields || {}; const gross = r2((Number(line.amount) || 0) * (1 + (Number(line.vatPct) || 0) / 100))
    const amountOk = line.payMode === 'upto' ? Number(p.paid) > 0 && Number(p.paid) <= gross + 0.005 : near(p.paid, gross)   // 'upto': a part payment is fine (a later receipt or repayment)
    payOk = amountOk && same(p.company, company) && (!f.vendor || same(p.vendor, f.vendor))
    checks.push({ label: 'Payment proof', ok: payOk, found: `${p.paid ?? 'Not shown'} to ${p.vendor || 'not shown'}`, expected: `${line.payMode === 'upto' ? 'up to ' : ''}${gross} to ${f.vendor || 'the counterparty'}`, detail: `Paid ${p.paid ?? 'not shown'} to ${p.vendor || 'not shown'} · Expected ${line.payMode === 'upto' ? `up to ${gross}` : gross} to ${f.vendor || 'the counterparty'}` })
  }
  const needsPay = parts.some((x) => x.part === 'payment' && x.need === 'Required')
  const status = !figuresOk || payOk === false ? 'Mismatch' : pay ? 'Supported and paid' : needsPay ? 'Supported, payment not shown' : 'Supported'
  return { status, source: src.part, checks, vendor: f.vendor || '' }
}
export const checkPrepaidEvidence = (item, docs, company) => checkEvidence({ ...item }, docs, company, prepaidParts(item.category))

// Demo only: stands in for the client's uploads (random file names, as clients upload them). Line 1 is complete, line 2 has no payment proof, line 3 does not match.
const RANDOM = ['IMG_4471', 'scan0023', 'Document (3)', 'WhatsApp Document 2026-02-11', 'doc_final_v2', 'Scan_20260114', 'file (1)', 'IMG-20260203-WA0007']
const VENDOR = { Rent: 'Landlord', 'Insurance – medical': 'Medical insurer', 'Insurance – vehicle / motor': 'Motor insurer', 'Insurance – property / other': 'Property insurer', 'Licences & government fees': 'Licensing authority', Subscriptions: 'Software provider', 'Iqama, work permit & visa fees': 'Jawazat', 'Other prepayments': 'Supplier' }
// lines: [{ amount, vatPct, start?, end?, date?, vendor }]; partsOf(line, i) = the parts it needs. Every third line is incomplete or wrong so the statuses can be seen.
export function demoDocs(lines, company, partsOf, { offset = 0 } = {}) {
  let n = offset; const name = (ext = 'pdf') => `${RANDOM[n++ % RANDOM.length]}.${ext}`
  return lines.map((it, idx) => {
    const vendor = it.vendor || 'Supplier'; const gross = r2((Number(it.amount) || 0) * (1 + (Number(it.vatPct) || 0) / 100))
    const base = { company, vendor, net: Number(it.amount), ...(it.start ? { start: it.start } : {}), ...(it.end ? { end: it.end } : {}), ...(it.date ? { date: it.date } : {}) }
    const docs = partsOf(it, idx).filter((p) => p.need === 'Required' || idx % 3 !== 1 || p.part === 'payment').map(({ part }) => ({ part, original: name(part === 'payment' ? 'jpg' : 'pdf'), fields: part === 'payment' ? { company, vendor, paid: gross, date: it.date || it.start || '' } : { ...base } }))
    const mode = idx % 3
    const out = mode === 1 ? docs.filter((d) => d.part !== 'payment') : docs
    if (mode === 2) { const s = out.find((d) => d.part === 'invoice' || d.part === 'receipt') || out.find((d) => d.part !== 'payment'); if (s) s.fields = s.fields.end ? { ...s.fields, end: `${Number(s.fields.end.slice(0, 4)) - 1}${s.fields.end.slice(4)}` } : { ...s.fields, net: Number(s.fields.net) + 100 } }
    return out
  })
}
export const demoPrepaidDocs = (items, company) => demoDocs(items.map((i) => ({ ...i, vendor: VENDOR[i.category] })), company, (it) => prepaidParts(it.category))
