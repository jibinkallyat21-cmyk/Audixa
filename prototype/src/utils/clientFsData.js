// Inputs for the IFRS trial balance and financial statements tools, taken from the demo client's own trial balance and last year's audited trial balance.
import { lineTotals } from './procedureData.js'

// Last year's audited closing balances in the keys the financial statements tool uses (assets positive, liabilities and equity positive).
const AFS_TO_FS = { cash: 'cash', receivables: 'ar', inventory: 'inventory', prepayments: 'prepaid', ppe: 'tangible', payables: 'ap', accruals: 'accrued', related: 'relPayCur', eosb: 'eosb', capital: 'capital', re: 're' }
const DEBIT_SIDE = ['cash', 'receivables', 'inventory', 'prepayments', 'ppe']
const PL_LINES = ['revenue', 'cogs', 'opex', 'finance', 'otherIncome', 'tax']
// The audited retained earnings include the year's result: the retained earnings ledger plus the profit or loss ledgers (closing the year's result into it).
const reAudited = (t) => -((t.re || 0) + PL_LINES.reduce((n, id) => n + (t[id] || 0), 0))
export function clientPyAfs(pyLedgers) {
  const t = lineTotals(pyLedgers); const bs = {}
  for (const [afs, fs] of Object.entries(AFS_TO_FS)) { const v = afs === 're' ? -reAudited(t) : t[afs]; if (v === undefined) continue; bs[fs] = Math.round(Math.abs(DEBIT_SIDE.includes(afs) ? v : -v) * 100) / 100 }
  return { bs, pl: {} }
}
// Depreciation expense for the year, as booked in the trial balance.
export const clientDepreciation = (ledgers) => Math.round(ledgers.filter((l) => /deprec/i.test(l.name) && l.group === 'opex').reduce((n, l) => n + l.closing, 0) * 100) / 100
// The balances listing for a disclaimer audit: every ledger with a balance and its side.
export const clientBis = (ledgers) => ledgers.filter((l) => Math.abs(l.closing) > 0.004).map((l) => [l.name, Math.round(Math.abs(l.closing) * 100) / 100, l.closing >= 0 ? 'Dr' : 'Cr'])

// Last year's audited AFS lines for the opening balance check, taken from last year's audited trial balance (natural side, positive).
import { AFS_LINES } from './tbCore.js'
export function clientAfs(pyLedgers) {
  const t = lineTotals(pyLedgers)
  const tt = { ...t, re: -reAudited(t) }
  return AFS_LINES.filter((l) => tt[l.id] !== undefined && Math.abs(tt[l.id]) > 0.004).map((l) => ({ name: l.label, line: l.id, amount: Math.round(Math.abs(tt[l.id]) * 100) / 100 }))
}
