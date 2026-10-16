// Cut-off testing (decisions recorded from the audit lead). The team sets how many items; the app picks them by the firm's rule; a person approves; the
// picked items go to the client's requirement list. Pure functions.
// ABCPA: from the subsequent period, in date order (first after the year end). Bank: one number for debits and one for credits, bank charges left out.
//        Every other area: one number.
// MISCPA: the last N before the year end and the first N after it, for bank, sales, cash, cost of sales and expenses. Bank charges left out of bank.
// Transactions: { date: 'YYYY-MM-DD', ref, ledger, description, debit, credit }
export const CUTOFF_AREAS = [['bank', 'Bank'], ['sales', 'Sales'], ['cash', 'Cash'], ['cogs', 'Cost of sales / purchases'], ['expenses', 'Expenses']]
export const areaLabel = (id) => CUTOFF_AREAS.find((a) => a[0] === id)?.[1] || id

const BANK_CHARGE = /bank (charge|fee|commission)|charges? for|service charge|vat on (bank|charge)/i
export const isBankCharge = (t) => BANK_CHARGE.test(`${t.description || ''} ${t.ledger || ''}`)
const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : String(a.ref).localeCompare(String(b.ref)))
const sideOf = (t) => ((Number(t.debit) || 0) > 0 ? 'Debit' : 'Credit')
const amountOf = (t) => ((Number(t.debit) || 0) > 0 ? Number(t.debit) : Number(t.credit) || 0)

export function selectCutoff({ firm, area, txns, yearEnd, n = 5, nDebit = 10, nCredit = 5 }) {
  const notes = []
  let pool = txns.filter((t) => t.date)
  if (area === 'bank') { const before = pool.length; pool = pool.filter((t) => !isBankCharge(t)); if (before !== pool.length) notes.push(`${before - pool.length} bank charge line(s) left out.`) }
  const after = pool.filter((t) => t.date > yearEnd).sort(byDate)
  const upTo = pool.filter((t) => t.date <= yearEnd).sort(byDate)
  const tag = (list, period) => list.map((t) => ({ ...t, period, side: sideOf(t), amount: amountOf(t) }))
  let picks = []
  if (firm === 'ABCPA') {
    if (area === 'bank') {
      const d = after.filter((t) => sideOf(t) === 'Debit').slice(0, Math.max(0, nDebit)); const c = after.filter((t) => sideOf(t) === 'Credit').slice(0, Math.max(0, nCredit))
      picks = tag([...d, ...c].sort(byDate), 'After year end')
      if (d.length < nDebit) notes.push(`Only ${d.length} debit(s) are available after the year end; ${nDebit} were asked for.`)
      if (c.length < nCredit) notes.push(`Only ${c.length} credit(s) are available after the year end; ${nCredit} were asked for.`)
    } else {
      picks = tag(after.slice(0, Math.max(0, n)), 'After year end')
      if (picks.length < n) notes.push(`Only ${picks.length} item(s) are available after the year end; ${n} were asked for.`)
    }
  } else {
    const b = upTo.slice(-Math.max(0, n)); const a = after.slice(0, Math.max(0, n))
    picks = [...tag(b, 'Before year end'), ...tag(a, 'After year end')]
    if (b.length < n) notes.push(`Only ${b.length} item(s) are available up to the year end; ${n} were asked for.`)
    if (a.length < n) notes.push(`Only ${a.length} item(s) are available after the year end; ${n} were asked for.`)
  }
  return { picks, notes }
}

// What the client is asked for, one clear sentence per picked item.
export const requestText = (area, p) => (area === 'bank'
  ? `${p.side} of SAR ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} on ${p.date}${p.description ? ` (${p.description})` : ''}: upload the invoice or supporting document for this transaction. If there is no invoice, explain what the transaction is. A bank voucher or transaction receipt is not accepted, because the item was picked from the bank statement.`
  : `${p.ref ? `${p.ref}, ` : ''}${p.ledger ? `${p.ledger}, ` : ''}${p.date}, SAR ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}${p.description ? ` (${p.description})` : ''}: upload the supporting document. A short explanation is required even when the document is provided; if there is no document, the explanation is mandatory.`)
