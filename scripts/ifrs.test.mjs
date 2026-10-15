import test from 'node:test'
import assert from 'node:assert/strict'
import { mapLedger, buildIfrsTB, grossUpEntries, validateAdjustments, proposeBalancing, statements, cogsSchedule, vatReconciliation, verification, salesVsVat, pendingList, IFRS } from '../src/utils/ifrs.js'

const L = (code, name, closing, extra = {}) => ({ code, name, opening: 0, debit: closing > 0 ? closing : 0, credit: closing < 0 ? -closing : 0, closing, ...extra })
const base = () => [L('1', 'Cash at bank - Al Rajhi', 5000), L('2', 'Trade receivables', 20000), L('3', 'Customer ABC', -1500), L('4', 'Inventory', 8000), L('5', 'Furniture', 10000), L('6', 'Accumulated depreciation - furniture', -2000),
  L('7', 'Trade payables', -12000), L('8', 'Supplier XYZ', 700), L('9', 'Share capital', -20000), L('10', 'Sales', -60000), L('11', 'Opening stock', 6000), L('12', 'Local purchases', 30000), L('13', 'Salaries', 12000), L('14', 'Bank charges', 300), L('15', 'Input VAT', 900), L('16', 'Output VAT', -400), L('17', 'Closing stock', 0)]
// balance it: sum so far
const bal = () => { const l = base(); const s = l.reduce((n, x) => n + x.closing, 0); l.push(L('99', 'Retained earnings', -s)); return l }

test('mapping by nature, bank charges to G&A, related party by sign', () => {
  assert.equal(mapLedger(L('', 'Bank charges', 10)).code, 'P103'); assert.equal(mapLedger(L('', 'Accumulated depreciation', -5)).code, 'A202')
  assert.equal(mapLedger(L('', 'Partner current account', -50)).code, 'L103'); assert.equal(mapLedger(L('', 'Partner current account', 50)).code, 'A106')
  assert.equal(mapLedger(L('', 'Statutory reserve', -5)).code, 'E102'); assert.equal(mapLedger(L('', 'Advertising expense', 5)).code, 'P104'); assert.equal(mapLedger(L('', 'Zzzz qqq', 5)).code, null)
  assert.equal(mapLedger(L('', 'Anything', 5), 'L101').code, 'L101')
})
test('opposite-sign balances are grossed up by an entry, not netted', () => {
  const tb = buildIfrsTB({ ledgers: bal() }); const e = grossUpEntries(tb.mapped); assert.equal(e.length, 2)
  assert.equal(tb.rows.find((r) => r.code === 'A102').final, 20000)                         // 20000 - 1500 + 1500
  assert.equal(tb.rows.find((r) => r.code === 'L102').final, -1500); assert.equal(tb.rows.find((r) => r.code === 'A107').final, 700)
  assert.equal(tb.totals.adjDr, tb.totals.adjCr)
})
test('bridge: Client ± adjustments = Final; balanced status', () => {
  const tb = buildIfrsTB({ ledgers: bal() }); assert.equal(tb.status, 'BALANCED'); assert.ok(tb.checks.every((c) => c.pass)); assert.ok(tb.rows.every((r) => r.check === 0))
  assert.equal(tb.rows.find((r) => r.code === 'P103').final, 12300)
})
test('unbalanced client TB is shown, never plugged', () => {
  const l = bal(); l.push(L('100', 'Mystery', 123)); const tb = buildIfrsTB({ ledgers: l, overrides: { 100: 'P103' } })
  assert.equal(tb.status, 'NOT BALANCED - REVIEW REQUIRED'); assert.equal(tb.diff, 123); assert.ok(!tb.rows.some((r) => /suspense|plug/i.test(r.name)))
  const pend = pendingList({ tb, ledgers: l, adj: tb.adj }); assert.ok(pend.some((p) => p.area === 'Balancing' && p.amount === 123))
})
test('unmapped accounts block the BALANCED status and go to pending', () => {
  const l = bal(); l.push(L('101', 'Zzzz qqq', 0)); const tb = buildIfrsTB({ ledgers: l }); assert.equal(tb.unmapped.length, 1); assert.notEqual(tb.status, 'BALANCED')
})
test('adjustments: need support, must balance, B is information only, C stays pending', () => {
  const ok = { id: 'A1', part: 'A', description: 'Accrue audit fee', support: 'Engagement letter', legs: [{ code: 'P103', dr: 1000, cr: 0 }, { code: 'L102', dr: 0, cr: 1000 }] }
  const r = validateAdjustments([ok, { ...ok, id: 'A2', support: '' }, { ...ok, id: 'A3', legs: [{ code: 'P103', dr: 5, cr: 0 }, { code: 'L102', dr: 0, cr: 4 }] }, { ...ok, id: 'B1', part: 'B' }, { ...ok, id: 'C1', part: 'C' }])
  assert.deepEqual(r.booked.map((e) => e.id), ['A1']); assert.equal(r.pending.length, 3); assert.equal(r.clientPosted.length, 1); assert.equal(r.errors.length, 1)
  const tb = buildIfrsTB({ ledgers: bal(), entries: [ok] }); assert.equal(tb.rows.find((x) => x.code === 'P103').final, 13300); assert.equal(tb.status, 'BALANCED')
})
test('balancing proposal needs support', () => {
  assert.equal(proposeBalancing(100, 'L103', '').entry, null); assert.ok(proposeBalancing(100, 'L103', '').pending)
  const p = proposeBalancing(100, 'L103', 'Partner confirmation letter'); assert.equal(p.entry.legs[0].cr, 100)
})
test('statements: BS balances including current profit; P&L signs', () => {
  const tb = buildIfrsTB({ ledgers: bal() }); const s = statements(tb)
  assert.equal(s.cy.difference, 0); assert.equal(s.pl.revenue, 60000); assert.ok(s.pl.cos < 0); assert.equal(s.pl.gross, 60000 + s.pl.cos)
  assert.equal(s.pl.net, s.cy.profit); assert.equal(s.cy.cur.cash, 5000)
})
test('COGS schedule and VAT reconciliation agree with the IFRS TB', () => {
  const l = bal(); const tb = buildIfrsTB({ ledgers: l }); const c = cogsSchedule(l, tb)
  assert.equal(c.opening, 6000); assert.equal(c.local, 30000); assert.equal(c.total, 6000 + 30000 - 8000); assert.equal(c.diff, c.total - tb.rows.find((r) => r.code === 'P102').final)
  assert.equal(cogsSchedule(l, tb, { closingStock: 7000 }).closingLabel, 'client figure, support pending')
  const v = vatReconciliation(l, tb); assert.equal(v.net, 500); assert.equal(v.diff, 0)
})
test('verification keeps the client figure when the cause is unknown; sales vs VAT base', () => {
  const tb = buildIfrsTB({ ledgers: bal() })
  const v = verification([{ label: 'Salary', code: 'P103', schedule: 12000 }, { label: 'Capital', code: 'E101', schedule: 20000 }, { label: 'Fees', code: 'P103', schedule: '' }], tb)
  assert.equal(v[0].status, 'Difference - pending'); assert.ok(v[0].keepClientFigure); assert.equal(v[1].status, 'Agrees'); assert.equal(v[2].status, 'Schedule not provided')
  assert.equal(salesVsVat(-60000, 59000).diff, 1000); assert.equal(salesVsVat(-60000, 60000).status, 'Agrees'); assert.match(salesVsVat(-1, '').status, /not provided/)
})
test('pending list flags zakat, ECL, inventory, related parties', () => {
  const l = [...bal(), L('50', 'Partner current account', -100)]; const s = l.reduce((n, x) => n + x.closing, 0); l[l.length - 1].closing -= 0
  const tb = buildIfrsTB({ ledgers: l }); const p = pendingList({ tb, ledgers: l, adj: tb.adj, mode: 'disclaimer' }).map((x) => x.area)
  for (const a of ['Zakat and income tax', 'Expected credit losses', 'Inventory', 'Related parties', 'VAT', 'Disclaimer audit']) assert.ok(p.includes(a), a)
})
test('IFRS list has unique codes', () => assert.equal(new Set(IFRS.map((a) => a.code)).size, IFRS.length))

import ExcelJS from 'exceljs'
import { buildIfrsWorkbook } from '../src/utils/ifrsExcel.js'
test('IFRS workbook: sheet order, bridge formulas, pending, status', async () => {
  const l = bal().map((x) => ({ ...x, closingSupplied: true })); const tb = buildIfrsTB({ ledgers: l })
  const cogs = cogsSchedule(l, tb); const vat = vatReconciliation(l, tb); const ver = verification([{ label: 'Salary', code: 'P103', schedule: 12000 }], tb)
  const st = statements(tb); const pending = pendingList({ tb, ledgers: l, adj: tb.adj })
  const wb = await buildIfrsWorkbook({ tb, ledgers: l, cogs, vat, verification: ver, pending, st, capital: [{ name: 'A', amount: 20000 }], period: { from: '01 Jan 2025', to: '31 Dec 2025' } })
  assert.deepEqual(wb.worksheets.map((w) => w.name), ['IFRS TB', 'BS', 'P and L', 'Statement of equity', 'Capital', 'COGS', 'IFRS Adjustment Entries', 'Reconciliation', 'Pending - Audit Review', 'Client TB Mapping', 'Client TB', 'VAT Reconciliation', 'Verification'])
  const it = wb.getWorksheet('IFRS TB'); assert.match(it.getCell('K4').value.formula, /MAX\(0,G4-H4\+I4-J4\)/); assert.match(it.getCell('G4').value.formula, /SUMIF\('Client TB Mapping'/)
  assert.equal(it.getCell('E4').value, 'A101'); assert.equal(it.getCell('B3').value, 2025)
  assert.match(JSON.stringify(wb.getWorksheet('BS').getCell('D7').value), /IFRS TB/); await wb.xlsx.writeBuffer()
})

test('supported balancing posting is booked and visible; unsupported stays pending', () => {
  const l = bal(); l.push(L('100', 'Mystery', 123)); const p = proposeBalancing(-123, 'L103', 'Partner confirmation')
  const tb = buildIfrsTB({ ledgers: l, overrides: { 100: 'P103' }, entries: [{ ...p.entry, legs: [{ code: 'L103', dr: 0, cr: 123 }] }] })
  assert.equal(tb.status, 'BALANCED'); assert.ok(tb.adj.booked.some((e) => e.id === 'BAL-01')); assert.ok(tb.checks.find((c) => c.check.startsWith('Adjustment debits')).pass)
  const none = buildIfrsTB({ ledgers: l, overrides: { 100: 'P103' }, entries: [{ id: 'BAL-01', part: 'A', kind: 'Proposed balancing (supported)', support: '', legs: [{ code: 'L103', dr: 0, cr: 123 }] }] }); assert.notEqual(none.status, 'BALANCED')
})
