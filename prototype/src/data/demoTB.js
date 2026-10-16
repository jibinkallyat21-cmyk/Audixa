import { groupOf } from '../utils/tbCore.js'
// Demo trial balances and prior-year AFS for the TB review (clearly labelled demo data).
const row = (code, name, opening, debit, credit, branch) => ({ code, name, opening, debit, credit, closing: opening + debit - credit, closingSupplied: true, branch: branch || '', sourceRow: 0, fileName: 'demo', group: groupOf(name) })
export function demoPY() {
  const base = [
    ['1001', 'Cash at Bank - SNB', 85000], ['1100', 'Trade Receivables', 410000], ['1200', 'Inventory', 230000], ['1300', 'Prepaid Expenses', 18000],
    ['1500', 'Furniture - Cost', 120000], ['1501', 'Accumulated Depreciation - Furniture', -48000], ['1510', 'Motor Vehicles - Cost', 210000], ['1511', 'Accumulated Depreciation - Motor Vehicles', -84000],
    ['2001', 'Trade Payables', -265000], ['2100', 'Accruals', -74000], ['2300', 'End of Service Benefits', -96000], ['2400', 'Partner Current Account', -120000], ['3001', 'Share Capital', -300000],
    ['4001', 'Sales', -2100000], ['5001', 'Cost of Sales', 1470000], ['6001', 'Salaries and Wages', 380000], ['6002', 'Rent Expense', 96000], ['6003', 'Depreciation Expense', 42000], ['6004', 'Bank Charges', 6500],
  ]
  const re = -base.reduce((n, [, , c]) => n + c, 0)
  return [...base.map(([c, n, cl]) => ({ ...row(c, n, 0, 0, 0), closing: cl })), { ...row('3100', 'Retained Earnings', 0, 0, 0), closing: re }]
}
export function demoCY(py = demoPY()) {
  const profit = py.filter((l) => /^[4-6]/.test(l.code)).reduce((n, l) => n + l.closing, 0)
  const open = (l) => (/^[4-6]/.test(l.code) ? 0 : l.code === '3100' ? l.closing + profit : l.closing)
  const cy = py.map((l) => row(l.code, l.name, open(l), 0, 0))
  const mv = (code, d, c) => { const l = cy.find((x) => x.code === code); l.debit = d; l.credit = c; l.closing = l.opening + d - c }
  mv('1001', 2350000, 2205200); mv('1100', 2300000, 2210000); mv('4001', 0, 2400000); mv('5001', 1700000, 0); mv('1200', 0, 40000)
  mv('6001', 400000, 0); mv('6002', 96000, 0); mv('6003', 45000, 0); mv('1501', 0, 12000); mv('1511', 0, 33000); mv('6004', 7200, 0)
  mv('2001', 1800000, 1760000); mv('2100', 60000, 83000)
  // deliberate issues for the demo
  cy.find((l) => l.code === '1100').opening += 7500           // opening receivables differ from last year's closing
  cy.find((l) => l.code === '3100').opening -= 7500
  cy.push(row('1002', 'Cash at Bank - SNB.', 0, 0, 0), row('9001', 'Consultancy Income', 0, 0, 15000))   // near-duplicate and a new ledger
  cy.find((l) => l.code === '6004').closing = -1200                                                            // expense with a credit balance
  return cy
}
// Same demo year, corrected: the receivables / retained earnings opening difference is removed, the near-duplicate bank ledger and the unmapped
// consultancy income ledger are dropped, and the bank payments carry the 15,000 that the dropped consultancy income ledger had offset, so the trial balance balances
// and every opening balance agrees to the previous year audited trial balance. Nothing is flagged.
export function demoCorrectedLedgers() {
  const fix = { 1100: -7500, 3100: 7500 }
  return demoCY(demoPY()).filter((l) => !['1002', '9001'].includes(l.code)).map((l) => {
    const opening = l.opening + (fix[l.code] || 0); const credit = l.code === '1001' ? l.credit + 15000 : l.credit
    return { ...l, opening, credit, closing: opening + l.debit - credit }
  })
}
export const demoAFS = [
  { name: 'Cash and cash equivalents', line: 'cash', amount: 85000 }, { name: 'Trade receivables', line: 'receivables', amount: 410000 }, { name: 'Inventory', line: 'inventory', amount: 230000 },
  { name: 'Prepayments', line: 'prepayments', amount: 18000 }, { name: 'Property, plant and equipment', line: 'ppe', amount: 198000 },
  { name: 'Trade payables', line: 'payables', amount: 265000 }, { name: 'Accrued expenses', line: 'accruals', amount: 74000 }, { name: "Employees' end of service benefits", line: 'eosb', amount: 96000 },
  { name: 'Due to a partner', line: 'related', amount: 120000 }, { name: 'Share capital', line: 'capital', amount: 300000 }, { name: 'Retained earnings', line: 're', amount: 86000 },
  { name: 'Revenue', line: 'revenue', amount: 2100000 }, { name: 'Cost of revenue', line: 'cogs', amount: 1470000 }, { name: 'General and administrative expenses', line: 'opex', amount: 524500 },
]
