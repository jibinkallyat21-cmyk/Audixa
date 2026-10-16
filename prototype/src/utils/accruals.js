// Accrued expenses: each line is backed by the invoice or contract and by the payment made after the year end. Pure functions.
// For the demo client the lines are worked out from the accrual ledgers of the trial balance, so they add up to it.
import { splitAmount } from './clientSamplingData.js'

const YEAR = 2025
const LINES = [
  ['Audit fee for the year', 'Audit firm', 15, `${YEAR}-01-01`, `${YEAR}-12-31`],
  ['Electricity, December', 'Utility company', 15, `${YEAR}-12-01`, `${YEAR}-12-31`],
  ['Telephone and internet, December', 'Telecom provider', 15, `${YEAR}-12-01`, `${YEAR}-12-31`],
  ['Legal and professional fees', 'Legal adviser', 15, `${YEAR}-10-01`, `${YEAR}-12-31`],
  ['Security services, December', 'Security contractor', 15, `${YEAR}-12-01`, `${YEAR}-12-31`],
]
export function clientAccruals(ledgers) {
  const total = Math.abs(ledgers.filter((l) => l.group === 'accruals').reduce((n, l) => n + (Number(l.closing) || 0), 0))
  if (!total) return []
  return splitAmount(total, LINES.length, 23).map((amount, i) => ({ description: LINES[i][0], vendor: LINES[i][1], amount, vatPct: LINES[i][2], start: LINES[i][3], end: LINES[i][4] }))
}
// What the lines add up to against the trial balance (code compares; a person decides).
export function accrualTie(lines, ledgers) {
  const tb = Math.round(Math.abs(ledgers.filter((l) => l.group === 'accruals').reduce((n, l) => n + (Number(l.closing) || 0), 0)) * 100) / 100
  const sum = Math.round(lines.reduce((n, l) => n + (Number(l.amount) || 0), 0) * 100) / 100
  return { tb, sum, difference: Math.round((tb - sum) * 100) / 100 }
}
