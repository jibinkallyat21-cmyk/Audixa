// Tests for Process 3.3 (opening balance verification and TB review). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { groupOf, detectTBMapping, toLedgers, toAmount, detectBranches, consolidate } from '../src/utils/tbCore.js'
import { compareOpening, runChecks, ratios, buildNotes, afsSigned } from '../src/utils/tbChecks.js'

const L = (code, name, opening, debit = 0, credit = 0, extra = {}) => ({ code, name, opening, debit, credit, closing: opening + debit - credit, closingSupplied: true, group: groupOf(name), branch: '', ...extra })

// prior-year TB (pre-closing): the retained earnings ledger is the balancing figure
function pyTB() {
  const base = [
    L('1001', 'Cash at Bank - SNB', 0, 0, 0, { closing: 50000 }), L('1100', 'Trade Receivables', 0, 0, 0, { closing: 100000 }), L('1200', 'Inventory', 0, 0, 0, { closing: 30000 }),
    L('1500', 'Furniture - Cost', 0, 0, 0, { closing: 40000 }), L('1501', 'Accumulated Depreciation - Furniture', 0, 0, 0, { closing: -10000 }),
    L('2001', 'Trade Payables', 0, 0, 0, { closing: -60000 }), L('2100', 'Accruals', 0, 0, 0, { closing: -20000 }), L('3001', 'Share Capital', 0, 0, 0, { closing: -100000 }),
    L('4001', 'Sales', 0, 0, 0, { closing: -500000 }), L('5001', 'Cost of Sales', 0, 0, 0, { closing: 300000 }), L('6001', 'Salaries', 0, 0, 0, { closing: 100000 }), L('6002', 'Depreciation Expense', 0, 0, 0, { closing: 10000 }),
  ]
  const re = -base.reduce((n, l) => n + l.closing, 0)
  return [...base, L('3100', 'Retained Earnings', 0, 0, 0, { closing: re })]
}
// current-year TB: opening = PY closing for the balance sheet, retained earnings picks up the PY profit
function cyTB(py = pyTB()) {
  const profit = py.filter((l) => /^[4-6]/.test(l.code)).reduce((n, l) => n + l.closing, 0)
  return py.map((l) => {
    const isPL = /^[4-6]/.test(l.code)
    const opening = isPL ? 0 : l.code === '3100' ? l.closing + profit : l.closing
    return L(l.code, l.name, opening, 0, 0)
  })
}
const afs = [
  { line: 'cash', amount: 50000 }, { line: 'receivables', amount: 100000 }, { line: 'inventory', amount: 30000 }, { line: 'ppe', amount: 30000 },
  { line: 'payables', amount: 60000 }, { line: 'accruals', amount: 20000 }, { line: 'capital', amount: 100000 },
]

test('ledger names are grouped by their nature', () => {
  const g = (n) => groupOf(n)
  assert.equal(g('Cash at Bank - SNB'), 'cash'); assert.equal(g('Bank Charges'), 'opex'); assert.equal(g('Accumulated Depreciation - Vehicles'), 'accDep')
  assert.equal(g('Trade Receivables'), 'receivables'); assert.equal(g('Prepaid Expenses'), 'prepayments'); assert.equal(g('Trade Payables'), 'payables')
  assert.equal(g('VAT Input'), 'vat'); assert.equal(g('End of Service Benefits'), 'eosb'); assert.equal(g('Partner Current Account'), 'related')
  assert.equal(g('Share Capital'), 'capital'); assert.equal(g('Retained Earnings'), 're'); assert.equal(g('Sales - Local'), 'revenue'); assert.equal(g('Cost of Sales'), 'cogs')
  assert.equal(g('Depreciation Expense'), 'opex'); assert.equal(g('Zakat Expense'), 'tax'); assert.equal(g('Zzz Quux'), 'unmapped')
})

test('TB columns are found by header; sign conventions are converted; negatives in brackets and Cr suffix', () => {
  const m = detectTBMapping(['Ledger Code', 'Ledger Name', 'Opening Balance', 'Debit', 'Credit', 'Closing Balance', 'Branch'])
  assert.deepEqual([m.code, m.name, m.opening, m.debit, m.credit, m.closing, m.branch], ['Ledger Code', 'Ledger Name', 'Opening Balance', 'Debit', 'Credit', 'Closing Balance', 'Branch'])
  assert.equal(toAmount('(1,200.50)'), -1200.5); assert.equal(toAmount('500 Cr'), -500); assert.equal(toAmount('1,000 Dr'), 1000); assert.equal(toAmount(''), null)
  const rows = [{ sourceRow: 2, values: { 'Ledger Code': '4001', 'Ledger Name': 'Sales', 'Opening Balance': 100, Debit: 0, Credit: 20, 'Closing Balance': 120 } }]
  assert.equal(toLedgers(rows, m)[0].opening, 100)
  assert.equal(toLedgers(rows, m, { convention: 'crPositive' })[0].opening, -100) // credit-positive source converted to debit-positive
  const split = detectTBMapping(['Name', 'Opening Debit', 'Opening Credit', 'Debit', 'Credit', 'Closing Debit', 'Closing Credit'])
  const l = toLedgers([{ sourceRow: 2, values: { Name: 'Sales', 'Opening Debit': 0, 'Opening Credit': 500, Debit: 0, Credit: 100, 'Closing Debit': 0, 'Closing Credit': 600 } }], split)[0]
  assert.deepEqual([l.opening, l.closing], [-500, -600])
})

test('opening balances agree when CY opening equals the PY TB and the AFS', () => {
  const r = compareOpening({ py: pyTB(), cy: cyTB(), afs })
  assert.ok(r.tested)
  const byLine = Object.fromEntries(r.rows.map((x) => [x.afsLine, x]))
  assert.equal(byLine.cash.status, 'OK'); assert.equal(byLine.ppe.pyTb, 30000); assert.equal(byLine.ppe.cyOpen, 30000); assert.equal(byLine.ppe.pyAfs, 30000)
  assert.equal(byLine.payables.pyAfs, -60000) // credit-nature AFS lines are signed credit
  assert.equal(byLine.re.status, 'AFS not provided') // agrees after the roll-forward, no AFS line entered
  assert.equal(r.re.status, 'OK'); assert.equal(r.re.diff, 0)
})

test('a difference against the AFS or the PY TB is flagged with the amount', () => {
  const cy = cyTB(); cy.find((l) => l.code === '1100').opening += 5000; cy.find((l) => l.code === '3100').opening -= 5000
  const r = compareOpening({ py: pyTB(), cy, afs })
  const rec = r.rows.find((x) => x.afsLine === 'receivables')
  assert.equal(rec.status, 'Difference'); assert.equal(rec.diffAfs, 5000); assert.equal(rec.diffTb, 5000)
  assert.equal(rec.ledgers[0].status, 'Difference'); assert.equal(r.re.status, 'Difference')
  const tolerant = compareOpening({ py: pyTB(), cy: cyTB().map((l) => ({ ...l, opening: l.opening + (l.code === '1001' ? 0.5 : 0) })), afs })
  assert.equal(tolerant.rows.find((x) => x.afsLine === 'cash').status, 'OK') // rounding within tolerance
})

test('retained earnings roll-forward includes distributions', () => {
  const cy = cyTB(); cy.find((l) => l.code === '3100').opening += 20000; cy.find((l) => l.code === '1001').opening -= 20000 // dividend paid from cash
  const r = compareOpening({ py: pyTB(), cy, afs: [], distributions: 20000 })
  assert.equal(r.re.status, 'OK')
  assert.equal(compareOpening({ py: pyTB(), cy, afs: [], distributions: 0 }).re.status, 'Difference')
})

test('P&L ledgers carrying an opening balance are reported', () => {
  const cy = cyTB(); cy.find((l) => l.code === '4001').opening = -1000
  assert.equal(compareOpening({ py: pyTB(), cy, afs }).re.plOpen.length, 1)
})

const cyMoves = () => {
  const cy = cyTB()
  const set = (code, d, c) => { const l = cy.find((x) => x.code === code); l.debit = d; l.credit = c; l.closing = l.opening + d - c }
  set('1001', 80000, 5000); set('4001', 0, 80000); set('6002', 10000, 0); set('1501', 0, 10000)
  cy.push(L('1300', 'Prepaid Expenses', 0, 5000, 0))
  return cy
}

test('check 1 to 11 pass on a clean TB', () => {
  const checks = runChecks({ py: pyTB(), cy: cyMoves() })
  const failed = checks.filter((c) => c.result === 'Fail')
  assert.deepEqual(failed.map((c) => c.no), [10], 'only the new prepaid ledger is reported')   // new ledger vs PY
  assert.equal(checks.length, 11); assert.equal(checks[0].result, 'Pass'); assert.equal(checks[10].result, 'Pass')
  assert.match(checks[5].amount, /Total NBV 20,000/)
})

test('check 1 and 2: an unbalanced TB and a closing that is not opening + movement', () => {
  const cy = cyMoves(); cy.find((l) => l.code === '1100').closing += 700
  const c = runChecks({ py: pyTB(), cy })
  assert.equal(c[0].result, 'Fail'); assert.match(c[0].amount, /closing 700/)
  assert.equal(c[1].result, 'Fail'); assert.match(c[1].ledgers[0], /Trade Receivables \(off by 700\)/)
})

test('checks 3, 4, 5, 8, 9: balances on the wrong side', () => {
  const cy = cyMoves()
  const mod = (code, closing) => { cy.find((l) => l.code === code).closing = closing }
  mod('1100', -100); mod('2001', 50); mod('1200', -5); mod('3001', 10); mod('1500', -40000); mod('1501', 300); mod('6001', -40); mod('1001', -7)
  const c = runChecks({ py: pyTB(), cy })
  assert.equal(c[2].result, 'Fail'); assert.equal(c[2].ledgers.length, 4)
  assert.equal(c[3].result, 'Fail'); assert.equal(c[4].result, 'Fail'); assert.equal(c[7].result, 'Fail'); assert.equal(c[8].result, 'Fail')
})

test('check 7: duplicates by name, code and near-name', () => {
  const cy = cyMoves(); cy.push(L('1002', 'Cash at Bank - SNB', 0), L('1003', 'Cash At Bank – SNB.', 0), L('1001', 'Petty Cash', 0))
  const c = runChecks({ py: pyTB(), cy })
  assert.equal(c[6].result, 'Fail'); assert.ok(c[6].ledgers.some((x) => /Same name/.test(x)) && c[6].ledgers.some((x) => /Same code 1001/.test(x)) && c[6].ledgers.some((x) => /Near-same/.test(x)))
})

test('check 10: new and disappeared ledgers; no PY TB is not tested', () => {
  const cy = cyMoves().filter((l) => l.code !== '2100'); cy.push(L('9999', 'Consultancy Income', 0))
  const c = runChecks({ py: pyTB(), cy })
  assert.match(c[9].amount, /2 new, 1 disappeared/); assert.ok(c[9].ledgers.some((x) => /^Gone: Accruals/.test(x)))
  assert.equal(runChecks({ py: [], cy })[9].result, 'Not tested')
})

test('check 11: depreciation and prepaid, with the interim exception', () => {
  const noDep = cyTB()
  assert.equal(runChecks({ py: pyTB(), cy: noDep })[10].result, 'Fail')
  const interim = runChecks({ py: pyTB(), cy: noDep, interim: true })[10]
  assert.equal(interim.result, 'Not tested'); assert.match(interim.comment, /interim/)
})

test('a TB with no closing column is not tested for check 2', () => {
  const cy = cyMoves().map((l) => ({ ...l, closingSupplied: false }))
  assert.equal(runChecks({ py: pyTB(), cy })[1].result, 'Not tested')
})

test('consolidation: branches are detected and summed; intercompany that does not mirror is a visible suspense line', () => {
  const a = [L('1001', 'Cash', 0, 100, 0, { branch: 'Riyadh' }), L('1900', 'Inter-branch account', 0, 500, 0, { branch: 'Riyadh' })]
  const b = [L('1001', 'Cash', 0, 40, 0, { branch: 'Jeddah' }), L('1900', 'Inter-branch account', 0, 0, 450, { branch: 'Jeddah' })]
  const all = [...a, ...b]
  assert.deepEqual(detectBranches(all), { multi: true, how: 'branch column', branches: ['Riyadh', 'Jeddah'] })
  assert.equal(detectBranches(a).multi, false); assert.equal(detectBranches(a, 2).how, 'separate sheets')
  const c = consolidate(all)
  assert.equal(c.ledgers.find((l) => l.code === '1001').closing, 140)
  assert.equal(c.suspense.closing, 50); assert.match(c.flags[0], /do not mirror/)
  assert.equal(consolidate([...a.slice(0, 1), ...b.slice(0, 1)]).suspense, null)
})

test('ratios use PY from the AFS and CY from the TB, and say when months differ', () => {
  const afsPL = [{ line: 'revenue', amount: 500000 }, { line: 'cogs', amount: 300000 }, { line: 'opex', amount: 110000 }, ...afs]
  const cy = cyMoves().map((l) => (l.code === '4001' ? { ...l, closing: -600000 } : l.code === '5001' ? { ...l, closing: 360000 } : l))
  const r = ratios({ cy, afs: afsPL, cyMonths: 6 })
  const row = (n) => r.rows.find((x) => x.name === n)
  assert.ok(Math.abs(row('Gross profit margin').py - 0.4) < 1e-9); assert.ok(Math.abs(row('Gross profit margin').cy - 0.4) < 1e-9)
  assert.ok(Math.abs(row('Revenue growth').cy - 0.2) < 1e-9)
  assert.match(r.notes[0], /not annualised/); assert.equal(ratios({ cy, afs: afsPL }).notes.length, 0)
})

test('notes are ranked High first and cover differences, failed checks and consolidation', () => {
  const cy = cyMoves(); cy.find((l) => l.code === '1100').opening += 5000
  const opening = compareOpening({ py: pyTB(), cy, afs })
  const checks = runChecks({ py: pyTB(), cy })
  const notes = buildNotes({ opening, checks, consolidationFlags: ['x'], unmapped: [{ name: 'Zzz', closing: 5 }], assumptions: ['Sign convention: debit positive.'] })
  assert.equal(notes[0].severity, 'High'); assert.equal(notes.at(-1).severity, 'Low'); assert.equal(notes[0].no, 1)
  assert.ok(notes.some((n) => n.area === 'Opening balances' && /Trade receivables/i.test(n.ledger)))
  assert.ok(notes.some((n) => n.area === 'Mapping')); assert.equal(afsSigned({ line: 'payables', amount: 5 }), -5)
})

import { demoPY as dPY, demoCY as dCY, demoAFS as dAFS } from '../src/data/demoTB.js'
import { compareOpening as cmp } from '../src/utils/tbChecks.js'
test('demo data: opening agrees except the deliberate receivables difference', () => {
  const py = dPY(); const cy = dCY(py); const r = cmp({ py, cy, afs: dAFS, tolerance: 1, distributions: 0 })
  const bad = r.rows.filter((x) => x.status === 'Difference').map((x) => x.label)
  assert.ok(r.rows.find((x) => x.label === 'Cash and bank').pyTb !== 0)
  assert.ok(bad.length >= 1 && bad.length <= 3, bad.join(','))
})
