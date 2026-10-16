// Alternative audit procedure (AAP) for a trade receivable or payable balance, used when the balance confirmation cannot be obtained.
// The balance is supported by what happened after the year end: for a receivable, the receipts that settle its open invoices; for a payable, the payments.
// Every open invoice must be settled and every receipt or payment must be traced to the invoices it pays; otherwise the procedure cannot be performed.
// Pure functions. Amounts are compared in cents. Nothing is allocated by guess: no oldest-first, no proportional split.
import { splitAmount } from './clientSamplingData.js'

const cents = (n) => Math.round((Number(n) + Number.EPSILON) * 100)
const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const WORDS = { receivables: { party: 'customer', in: 'receipt', inPl: 'receipts', docIn: 'receipts after the year end', verb: 'received', ledgerSide: 'credit' }, payables: { party: 'supplier', in: 'payment', inPl: 'payments', docIn: 'payments after the year end', verb: 'paid', ledgerSide: 'debit' } }
export const words = (side) => WORDS[side]

// The documents the client is asked for once the alternative procedure is on. doc = the key used in the requirement item and in the folder.
export function aapDocs(side) {
  const w = WORDS[side]
  return [
    { doc: 'ledger', title: `${w.party[0].toUpperCase()}${w.party.slice(1)} ledger or statement of account`, text: `the ${w.party} ledger (statement of account) at the year end, showing every open invoice and the narration of each entry` },
    { doc: 'invoices', title: 'Open invoices', text: `a copy of every open ${side === 'receivables' ? 'sales' : 'supplier'} invoice that makes up the balance` },
    { doc: 'settlements', title: `${w.inPl[0].toUpperCase()}${w.inPl.slice(1)} after the year end`, text: `the ${w.inPl} after the year end until the balance is settled or up to the last ${w.in} (bank statement lines, ${w.in} vouchers or remittance advice). Each one must show which invoices it ${side === 'receivables' ? 'pays' : 'settles'}` },
    { doc: 'support', title: side === 'receivables' ? 'Proof of delivery or contract' : 'Goods received notes or contract', text: side === 'receivables' ? 'the proof of delivery or the contract behind the open invoices, where available' : 'the goods received notes or the contract behind the open invoices, where available' },
  ]
}
// The sample requirements added for one party (stable keys, so enabling twice adds nothing).
export function aapSamples({ side, party, balance, parentRef, area }) {
  return aapDocs(side).map((d) => ({
    key: `AAP:${side}|${party}|${d.doc}`, nature: 'document', subgroup: party,
    text: `Alternative audit procedure for ${party} (balance SAR ${money(balance)}): send ${d.text}.`,
    row: { ref: '', date: '', ledger: area, description: `${party}: ${d.title}`, amount: Number(balance) || 0 },
    data: { kind: 'aap', side, party, doc: d.doc, parentRef, balance: Number(balance) || 0 },
  }))
}

// ── tracing ───────────────────────────────────────────────────────────────
// invoices: [{ no, date, amount }]; settlements: [{ id, date, ref, amount, invoiceRefs: [no] }] (what each receipt or payment document names);
// ledgerLines: [{ date, ref, description, debit, credit }] of the party ledger. side decides which ledger column holds the settlements.
export function traceSettlement({ invoices, settlements, ledgerLines = [], side = 'receivables' }) {
  const remaining = Object.fromEntries(invoices.map((i) => [i.no, cents(i.amount)]))
  const allocations = []; const detail = settlements.map((s) => ({ ...s, left: cents(s.amount), method: '', why: '' }))
  const allocate = (d, no, c, method) => { const take = Math.min(c, remaining[no] ?? 0, d.left); if (take <= 0) return 0; remaining[no] -= take; d.left -= take; allocations.push({ settlementId: d.id, invoiceNo: no, amount: take / 100, method }); d.method = d.method ? (d.method.includes(method) ? d.method : `${d.method}, ${method}`) : method; return take }
  const known = new Set(invoices.map((i) => i.no))
  // 1. the document itself names the invoices it settles
  for (const d of detail) { const named = (d.invoiceRefs || []).filter((n) => known.has(n)); for (const no of named) allocate(d, no, d.left, 'Reference on the document') }
  // 2. no reference: the amount equals one open invoice or exactly one combination of open invoices
  for (const d of detail) {
    if (d.left <= 0 || (d.invoiceRefs || []).length) continue
    const open = invoices.filter((i) => remaining[i.no] > 0).slice(0, 16); const hits = []
    for (let mask = 1; mask < 1 << open.length; mask++) { let sum = 0; const pick = []; for (let b = 0; b < open.length; b++) if (mask & (1 << b)) { sum += remaining[open[b].no]; pick.push(open[b].no) } if (sum === d.left) hits.push(pick) }
    if (hits.length === 1) hits[0].forEach((no) => allocate(d, no, remaining[no], 'Amount equals the invoice or invoices'))
    else if (hits.length > 1) d.why = `its amount equals more than one combination of open invoices (${hits.length} combinations), so it cannot be tied to one`
  }
  // 3. the ledger narration of the entry names the invoices (their open amounts must add up to the entry, otherwise it is not a trace)
  for (const d of detail) {
    if (d.left <= 0) continue
    const line = ledgerLines.find((l) => (side === 'receivables' ? cents(l.credit) : cents(l.debit)) === cents(d.amount) && (l.date === d.date || (d.ref && l.ref === d.ref)))
    const named = line ? invoices.filter((i) => String(line.description || '').includes(i.no) && remaining[i.no] > 0) : []
    if (!named.length) continue
    const total = named.reduce((n, i) => n + remaining[i.no], 0)
    if (total === d.left) { named.forEach((i) => allocate(d, i.no, remaining[i.no], 'Ledger narration')); d.why = '' }
    else d.why = `the ledger narration names ${named.map((i) => i.no).join(', ')}, but their open amount (SAR ${money(total / 100)}) is not the amount of the ${d.left === cents(d.amount) ? 'entry' : 'balance of the entry'} (SAR ${money(d.left / 100)})`
  }
  for (const d of detail) {
    if (d.left > 0 && !d.why) d.why = `it is a lump sum: it names no invoice, its amount does not equal any open invoice or combination of them, and the ledger narration mentions no invoice number`
    d.traced = d.left === 0; d.untraced = d.left / 100
  }
  const invoicesDetail = invoices.map((i) => ({ ...i, remaining: remaining[i.no] / 100, settled: remaining[i.no] === 0 }))
  const untraced = detail.filter((d) => !d.traced); const unsettled = invoicesDetail.filter((i) => !i.settled)
  const status = !settlements.length && !invoices.length ? 'Waiting' : untraced.length === 0 && unsettled.length === 0 ? 'Can be performed' : 'Unable to verify'
  return { status, allocations, settlements: detail, invoices: invoicesDetail, untraced, unsettled }
}

// The exact reason, in words the client can act on.
export function failureText({ result, side, party, balance, yearEnd = '31-12-2025' }) {
  const w = WORDS[side]; const lines = []
  lines.push(`We could not perform the alternative audit procedure on the ${party} balance of SAR ${money(balance)} as at ${yearEnd}, because the ${w.inPl} after the year end cannot be tied to the open invoices.`)
  result.untraced.forEach((d) => lines.push(`- The ${w.in} of SAR ${money(d.amount)} on ${d.date}${d.ref ? ` (reference ${d.ref})` : ''} cannot be traced${d.untraced < d.amount ? `: SAR ${money(d.untraced)} of it is not tied to any invoice` : ''}, because ${d.why}.`))
  result.unsettled.forEach((i) => lines.push(`- Invoice ${i.no} dated ${i.date} for SAR ${money(i.amount)} has SAR ${money(i.remaining)} that is not covered by any ${w.in} up to the last one received.`))
  lines.push(`Please send, for each ${w.in} above, the ${w.in} voucher or remittance advice that shows which invoices it ${side === 'receivables' ? 'pays' : 'settles'}, or a ledger with a narration naming the invoice numbers; and say what is still outstanding on each invoice listed.`)
  return lines.join('\n')
}

// ── demo data standing in for what is read from the uploaded ledger, invoices and receipts or payments ──
const pad = (n) => String(n).padStart(4, '0')
export function demoAapData({ side, party, balance, index = 0, seed = 1 }) {
  const w = WORDS[side]; const prefix = side === 'receivables' ? 'INV' : 'PUR'; const k = 3
  const amounts = splitAmount(balance, k, 100 + seed + index).map((a) => Math.round(a * 100) / 100); amounts[k - 1] = Math.round((balance - amounts.slice(0, k - 1).reduce((a, b) => a + b, 0)) * 100) / 100
  const invoices = amounts.map((a, i) => ({ no: `${prefix}-2025-${pad(900 + index * 10 + i)}`, date: `2025-1${i}-1${i + 2}`.replace('2025-10', '2025-10'), amount: a }))
  const scenario = index % 4; const mk = (id, date, ref, amount, invoiceRefs = []) => ({ id, date, ref, amount, invoiceRefs })
  let settlements = []; const narr = {}
  if (scenario === 0) settlements = invoices.map((inv, i) => mk(`s${i + 1}`, `2026-01-${10 + i * 5}`, `${side === 'receivables' ? 'RCT' : 'PAY'}-${pad(40 + i)}`, inv.amount, [inv.no]))
  if (scenario === 1) settlements = invoices.map((inv, i) => mk(`s${i + 1}`, `2026-01-${12 + i * 6}`, `TRF-${pad(70 + i)}`, inv.amount))
  if (scenario === 2) { settlements = [mk('s1', '2026-01-28', `TRF-${pad(88)}`, Math.round(balance * 100) / 100)]; narr.s1 = `${w.in[0].toUpperCase()}${w.in.slice(1)} for ${invoices.map((i) => i.no).join(', ')}` }
  if (scenario === 3) { const lump = Math.round(((amounts[0] + amounts[1]) * 0.93) / 100) * 100; settlements = [mk('s1', '2026-02-03', `TRF-${pad(91)}`, lump)]; narr.s1 = `Bank ${w.in}` }
  const ledgerLines = [
    ...invoices.map((inv) => ({ date: inv.date, ref: inv.no, description: `${side === 'receivables' ? 'Sales' : 'Purchase'} invoice ${inv.no}`, debit: side === 'receivables' ? inv.amount : 0, credit: side === 'receivables' ? 0 : inv.amount })),
    ...settlements.map((s) => ({ date: s.date, ref: s.ref, description: narr[s.id] || (scenario === 0 ? `${w.in} against ${s.invoiceRefs.join(', ')}` : `${w.in[0].toUpperCase()}${w.in.slice(1)} ${s.ref}`), debit: side === 'receivables' ? 0 : s.amount, credit: side === 'receivables' ? s.amount : 0 })),
  ]
  return { invoices, settlements, ledgerLines, scenario }
}
