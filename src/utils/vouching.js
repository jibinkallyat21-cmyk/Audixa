// Process 3.4 Step 2 (vouching) and Step 3 (cash and bank confirmation). Pure functions.
import { r2 } from './sampling.js'
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// ── reference numbers: only for samples whose document was actually received ──
export const REF_START = { sales: '6002.02', cogs: '10002.02', expense: '10001.02' }   // MISCPA (decision 12)
export function nextRef(prefix, issued = []) {
  const [base, startSuffix] = prefix.split('.')
  const used = issued.filter((x) => x && x.startsWith(`${base}.`)).map((x) => Number(x.split('.')[1])).filter(Number.isFinite)
  return `${base}.${String(used.length ? Math.max(...used) + 1 : Number(startSuffix)).padStart(2, '0')}`
}
// samples: [{ id, received, taxable }] in the order the documents are received. Existing refs are never reused.
export function assignRefs(samples, start) {
  const issued = samples.map((s) => s.ref).filter(Boolean)
  return samples.map((s) => {
    if (s.ref) return s
    if (!s.received) return { ...s, ref: '', note: 'Invoice not received – not numbered' }
    const ref = nextRef(start, issued); issued.push(ref); return { ...s, ref, note: '' }
  })
}
// Sample Testing % = value of tested (received) invoices ÷ total value × 100, by value, 2 decimals.
export const sampleTestingPct = (samples, total) => (num(total) ? r2(samples.filter((s) => s.received).reduce((n, s) => n + num(s.taxable), 0) / num(total) * 100) : 0)

export const SALES_COLUMNS = ['Sales Invoice', 'Invoice Number', 'Invoice Date', 'Customer Details', 'Description', 'Quantity & Rate', 'Sales Value', 'VAT/GST', 'Discounts', 'Supporting Documents', 'Delivery Evidence']
export const SALES_MARKS = ['✓', 'No', 'NA']
export const COGS_TESTS = ['Invoice Received', 'Invoice Date', 'Supplier Name', 'Invoice for Client', 'COGS Purchase', 'Supplier in Accounts Payable', 'Invoice Amount', 'Currency / Amount in SAR']
export const COGS_MARKS = ['✓', '✗', 'N/A', 'NP', '?', '—']
export const EXPENSE_COLUMNS = ['Invoice Received', 'Company Match', 'Vendor Match', 'Invoice No. Match', 'Invoice Sequence', 'Duplicate Check', 'Invoice Date', 'Audit Period', 'Book Amount', 'Taxable Value', 'GST/Tax Amount Match', 'Arithmetic', 'Classification', 'Business Purpose', 'Approval', 'PO/WO', 'Service Evidence', 'Payment', 'Cut-off', 'Prepaid', 'Capital/Revenue']
export const EXPENSE_STATUS = ['PASS', 'FAIL', 'EXCEPTION', 'N/A', 'NOT VERIFIED', 'INVOICE NOT RECEIVED']

// COGS: OK when no ✗; Exception when at least one ✗; Not Available when the invoice was not provided.
export function cogsResult(marks) {
  if (marks['Invoice Received'] === 'No' || marks['Invoice Received'] === 'NP') return 'Not Available'
  return Object.values(marks).includes('✗') ? 'Exception' : 'OK'
}
// Sales: a received invoice is clean when no column is marked No.
export const salesResult = (marks) => (Object.values(marks).includes('No') ? 'Exception' : 'OK')
// Expense final status from the per-column results.
export function expenseFinal(marks, { duplicate = '', risk = '' } = {}) {
  if (marks['Invoice Received'] === 'INVOICE NOT RECEIVED' || marks['Invoice Received'] === 'No') return 'INVOICE NOT RECEIVED'
  const v = Object.values(marks)
  if (duplicate === 'HIGH-RISK' || risk === 'HIGH') return 'HIGH-RISK EXCEPTION'
  if (v.includes('FAIL') || v.includes('EXCEPTION')) return 'EXCEPTION'
  if (v.includes('NOT VERIFIED')) return 'NOT VERIFIABLE'
  return risk === 'MEDIUM' || risk === 'LOW' ? 'PASS WITH OBSERVATION' : 'VERIFIED – PASS'
}
// Duplicate check on vendor + invoice number + date + amount.
export function findDuplicates(rows) {
  const key = (r) => [r.vendor, r.invoiceNo, r.date, r.amount].map((x) => String(x ?? '').trim().toLowerCase()).join('|')
  const seen = new Map()
  rows.forEach((r, i) => { if (r.invoiceNo) seen.set(key(r), [...(seen.get(key(r)) || []), i]) })
  const dup = new Set(); for (const idx of seen.values()) if (idx.length > 1) idx.forEach((i) => dup.add(i))
  return rows.map((_, i) => (dup.has(i) ? 'EXCEPTION – Potential duplicate' : 'PASS – No duplicate identified'))
}

// ── AR / AP / Advances vouching ───────────────────────────────────────────
// parties: [{ party, ref, namesAgree, amountChecked, confirmationVerified, paymentChecked, clientOptionPending, unableToVerify, issue }]
export function partyVouchStatus(p) {
  if (!p.ref) return null
  if (p.issue) return 'REVIEW REMARKS'
  if (p.unableToVerify || p.clientOptionPending) return 'PENDING'
  if (p.namesAgree && p.amountChecked && p.confirmationVerified && p.paymentChecked) return 'OK'
  return 'CHECK'
}
export function partyVouchSummary(parties) {
  const withRef = parties.filter((p) => p.ref)
  const counts = { OK: 0, PENDING: 0, CHECK: 0, 'REVIEW REMARKS': 0 }
  withRef.forEach((p) => { counts[partyVouchStatus(p)]++ })
  const refs = withRef.map((p) => p.ref); const dups = refs.filter((r, i) => refs.indexOf(r) !== i)
  return { counts, withRef: withRef.length, countsTie: Object.values(counts).reduce((a, b) => a + b, 0) === withRef.length, duplicateRefs: [...new Set(dups)],
    overall: withRef.length > 0 && counts.OK === withRef.length ? 'COMPLETE' : 'NOT COMPLETE' }
}
export const overallColour = (r) => (['Confirmed / Matched', 'OK', 'COMPLETE'].includes(r) ? 'green' : ['Not Available / Unable to Verify', 'Not Available', 'PENDING'].includes(r) ? 'amber' : 'red')

// ── Cash and bank confirmation: six tests, Yes / No / Unable to Verify ────
export const CONF_TESTS = ['Amount', 'Date', 'Signature & Seal', 'Client Name', 'Bank Name', 'Letterhead']
const squash = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '')
export function confirmationTests(c, ctx) {
  const t = {}; const why = {}
  // 1 amount
  if (ctx.tbAmount === null || ctx.tbAmount === undefined || ctx.tbAmount === '' || c.amount === '' || c.amount === null || c.amount === undefined) { t.Amount = 'Unable to Verify'; why.Amount = 'The TB amount or the confirmed amount is not available.' }
  else { const d = r2(num(c.amount) - num(ctx.tbAmount)); t.Amount = d === 0 ? 'Yes' : 'No'; if (d !== 0) why.Amount = `Confirmed ${r2(num(c.amount)).toFixed(2)} − TB ${r2(num(ctx.tbAmount)).toFixed(2)} = difference ${d.toFixed(2)}.` }
  // 2 date
  if (!c.asAt) { t.Date = 'Unable to Verify'; why.Date = 'The confirmation date is not readable.' } else { t.Date = c.asAt === ctx.yearEnd ? 'Yes' : 'No'; if (t.Date === 'No') why.Date = `Dated ${c.asAt}; year-end is ${ctx.yearEnd}.` }
  // 3 signature and seal
  if (c.illegible) { t.sig = 'Unable to Verify' }
  const sigOk = c.type === 'Cash' ? c.sealPresent && c.signaturePresent : (c.sealPresent && c.signaturePresent) || (c.eGenerated && c.digitalMark)
  t['Signature & Seal'] = c.sigIllegible ? 'Unable to Verify' : sigOk ? 'Yes' : 'No'
  if (t['Signature & Seal'] === 'No') why['Signature & Seal'] = c.type === 'Cash' ? 'Company seal or authorised signature is missing.' : 'Bank stamp and signature (or e-generated mark with digital verification) is missing.'
  delete t.sig
  // 4 client name (exact, ignoring case and spaces)
  if (!c.clientName) { t['Client Name'] = 'Unable to Verify'; why['Client Name'] = 'The client name on the confirmation is not readable.' }
  else { t['Client Name'] = squash(c.clientName) === squash(ctx.legalName) ? 'Yes' : 'No'; if (t['Client Name'] === 'No') why['Client Name'] = `Confirmation shows "${c.clientName}"; legal name is "${ctx.legalName}".` }
  // 5 bank name
  if (c.type === 'Cash') t['Bank Name'] = 'Not Applicable'
  else if (!ctx.tbBank || !c.bankName) { t['Bank Name'] = 'Unable to Verify'; why['Bank Name'] = 'The bank name in the TB description or on the confirmation is not available.' }
  else { t['Bank Name'] = squash(c.bankName) === squash(ctx.tbBank) || squash(ctx.tbBank).includes(squash(c.bankName)) || squash(c.bankName).includes(squash(ctx.tbBank)) ? 'Yes' : 'No'; if (t['Bank Name'] === 'No') why['Bank Name'] = `Confirmation bank "${c.bankName}"; TB shows "${ctx.tbBank}".` }
  // 6 letterhead
  t.Letterhead = c.letterheadIllegible ? 'Unable to Verify' : c.letterhead ? 'Yes' : 'No'
  if (t.Letterhead === 'No') why.Letterhead = c.type === 'Cash' ? 'Not on the client company letterhead.' : 'Not on bank letterhead or an official bank system-generated form.'
  return { tests: t, reasons: why }
}
export function confirmationOverall(tests, { available = true, c = null } = {}) {
  if (!available) return 'Confirmation Not Available'
  const vals = CONF_TESTS.map((k) => tests[k]).filter((v) => v !== 'Not Applicable')
  const noes = CONF_TESTS.filter((k) => tests[k] === 'No')
  if (noes.length >= 2) return 'Multiple Issues'
  if (noes.length === 1) {
    if (noes[0] === 'Signature & Seal') return (c && signatureLabel(c)) || 'Signature Missing'
    return { Amount: 'Amount Mismatch', Date: 'Date Issue' }[noes[0]] || 'Requires Review'
  }
  return vals.includes('Unable to Verify') ? 'Not Available / Unable to Verify' : 'Confirmed / Matched'
}
// The decision table maps a missing seal and a missing signature to separate labels; both → Multiple Issues.
export function signatureLabel({ sealPresent, signaturePresent }) { return !sealPresent && !signaturePresent ? 'Multiple Issues' : !sealPresent ? 'Seal/Stamp Missing' : !signaturePresent ? 'Signature Missing' : null }
export const bankStatementRecon = ({ opening, credits, debits, closing }) => { const calc = r2(num(opening) + num(credits) - num(debits)); return { calculated: calc, diff: r2(calc - num(closing)), ok: r2(calc - num(closing)) === 0 } }
export function denominationCheck(lines, confirmed) { const total = r2(lines.reduce((n, l) => n + num(l.denomination) * num(l.quantity), 0)); return { total, diff: r2(total - num(confirmed)), ok: r2(total - num(confirmed)) === 0 } }
export const nextConfRef = (type, issued = []) => nextRef(type === 'Cash' ? '5001.01' : '5002.01', issued)
export function confirmationCompletion({ confirmations, logComplete = true }) {
  const blockers = []
  if (!confirmations.length) blockers.push('No confirmation has been listed.')
  confirmations.forEach((c) => {
    if (!c.ref) blockers.push(`${c.label || 'A confirmation'} has no Ref. No.`)
    if (c.overall !== 'Confirmed / Matched') blockers.push(`${c.ref || c.label || 'A confirmation'} is ${c.overall || 'not tested'}.`)
    if (c.type === 'Bank' && c.statementChecked === false) blockers.push(`${c.ref || 'A bank confirmation'} is not yet cross-verified with its bank statement.`)
    if (c.type === 'Cash' && c.denominationsChecked === false) blockers.push(`${c.ref || 'A cash confirmation'} has no denomination check.`)
  })
  if (!logComplete) blockers.push('The Document Log is incomplete.')
  return { complete: blockers.length === 0, blockers, status: blockers.length ? 'NOT COMPLETE' : 'COMPLETE' }
}
