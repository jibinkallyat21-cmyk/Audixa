// Supporting documents behind a schedule line (first built for prepaid expenses; the same shape serves the other areas).
// A line is backed by up to three documents: the agreement (if the item has one), the tax invoice, and the payment proof.
// The figures (amount, period, names) are read from the agreement or the invoice, whichever shows them; the payment proof only confirms it was paid.
// Code compares; a person decides every flag. Pure functions, so they are tested.
import { NO_VAT_CATEGORIES, r2 } from './prepaidDep.js'

export const PART_LABEL = { agreement: 'Agreement', invoice: 'Tax invoice', receipt: 'Government receipt', payment: 'Payment proof' }
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

const clean = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()
const extOf = (name) => ((String(name || '').match(/\.([A-Za-z0-9]{2,5})$/) || [])[1] || 'pdf').toLowerCase()
// The client may upload under any name (IMG_4471.pdf); it is shown as: Prepaid - Medical policy MP-8890 - Tax invoice.pdf
export const standardName = (area, subject, part, original) => `${clean(area)} - ${clean(subject)} - ${PART_LABEL[part]}.${extOf(original)}`

const same = (a, b) => clean(a).toLowerCase() === clean(b).toLowerCase() && clean(a) !== ''
const near = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005

// item: a prepaid line { particulars, amount, vatPct, start, end }. docs: [{ part, original, fields: { company, vendor, net, start, end, paid } }].
// Returns the overall status, which document supplied the figures, and every check with its result.
export function checkPrepaidEvidence(item, docs, company) {
  const byPart = (p) => docs.find((d) => d.part === p)
  const src = ['invoice', 'receipt', 'agreement'].map(byPart).find((d) => d && d.fields && d.fields.net !== undefined && d.fields.start && d.fields.end) || ['invoice', 'receipt', 'agreement'].map(byPart).find(Boolean)
  const pay = byPart('payment')
  const checks = []
  if (!src) return { status: 'Not received', source: null, checks, vendor: '' }
  const f = src.fields || {}
  checks.push({ label: 'Company name', ok: same(f.company, company), detail: `Document: ${f.company || 'not shown'}` })
  checks.push({ label: 'Net amount', ok: f.net !== undefined && f.net !== '' && near(f.net, item.amount), detail: `Document: ${f.net ?? 'not shown'} · Schedule: ${item.amount}` })
  checks.push({ label: 'Cover starts', ok: f.start === item.start, detail: `Document: ${f.start || 'not shown'} · Schedule: ${item.start || 'blank'}` })
  checks.push({ label: 'Cover ends', ok: f.end === item.end, detail: `Document: ${f.end || 'not shown'} · Schedule: ${item.end || 'blank'}` })
  const others = docs.filter((d) => d !== src && d.part !== 'payment' && d.fields?.vendor)
  checks.push({ label: 'Vendor name', ok: !!f.vendor && others.every((d) => same(d.fields.vendor, f.vendor)), detail: `Document: ${f.vendor || 'not shown'}${others.length ? ' · same on the other documents' : ''}` })
  const figuresOk = checks.every((c) => c.ok)
  let payOk = null
  if (pay) {
    const p = pay.fields || {}; const gross = r2((Number(item.amount) || 0) * (1 + (Number(item.vatPct) || 0) / 100))
    payOk = near(p.paid, gross) && same(p.company, company) && (!f.vendor || same(p.vendor, f.vendor))
    checks.push({ label: 'Payment proof', ok: payOk, detail: `Paid ${p.paid ?? 'not shown'} to ${p.vendor || 'not shown'} · Expected ${gross} to ${f.vendor || 'the vendor'}` })
  }
  const status = !figuresOk || payOk === false ? 'Mismatch' : pay ? 'Supported and paid' : 'Supported, payment not shown'
  return { status, source: src.part, checks, vendor: f.vendor || '' }
}

// Demo only: stands in for the client's uploads (random file names, as clients upload them). Line 1 is complete, line 2 has no payment proof, line 3 has a period that does not match.
const RANDOM = ['IMG_4471', 'scan0023', 'Document (3)', 'WhatsApp Document 2026-02-11', 'doc_final_v2', 'Scan_20260114', 'file (1)', 'IMG-20260203-WA0007']
const VENDOR = { Rent: 'Landlord', 'Insurance – medical': 'Medical insurer', 'Insurance – vehicle / motor': 'Motor insurer', 'Insurance – property / other': 'Property insurer', 'Licences & government fees': 'Licensing authority', Subscriptions: 'Software provider', 'Iqama, work permit & visa fees': 'Jawazat', 'Other prepayments': 'Supplier' }
export function demoPrepaidDocs(items, company) {
  let n = 0; const name = (ext = 'pdf') => `${RANDOM[n++ % RANDOM.length]}.${ext}`
  return items.map((it, idx) => {
    const vendor = VENDOR[it.category] || 'Supplier'; const gross = r2((Number(it.amount) || 0) * (1 + (Number(it.vatPct) || 0) / 100))
    const base = { company, vendor, net: Number(it.amount), start: it.start, end: it.end }
    const docs = prepaidParts(it.category).map(({ part }) => ({ part, original: name(part === 'payment' ? 'jpg' : 'pdf'), fields: part === 'payment' ? { company, vendor, paid: gross, date: it.start } : { ...base } }))
    const mode = idx % 3
    const out = mode === 1 ? docs.filter((d) => d.part !== 'payment') : docs
    if (mode === 2) { const s = out.find((d) => d.part === 'invoice' || d.part === 'receipt'); if (s && s.fields.end) s.fields = { ...s.fields, end: `${Number(s.fields.end.slice(0, 4)) - 1}${s.fields.end.slice(4)}` } }
    return out
  })
}
