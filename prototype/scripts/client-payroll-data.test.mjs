import test from 'node:test'
import assert from 'node:assert/strict'
import { demoCorrectedLedgers } from '../src/data/demoTB.js'
import { compactLedgers } from '../src/utils/tbFormat.js'
import { clientSalarySources, clientContributors, tbSalaries, clientGosi, clientEosbStaff, clientPrepaid, clientAssets } from '../src/utils/clientPayrollData.js'
import { buildAllMonths, monthTotals, tbReconciliation, employeeControl, calcValidation, gosiSheet, eosbRow, completeness } from '../src/utils/salary.js'
import { prepaidSchedule, depSchedule } from '../src/utils/prepaidDep.js'

const L = compactLedgers(demoCorrectedLedgers())
test('the salary schedule adds up to the trial balance salaries ledger', () => {
  assert.equal(tbSalaries(L), 400000)
  const built = buildAllMonths(clientSalarySources(L)); const totals = monthTotals(built.records)
  assert.equal(totals.length, 12)
  const r = tbReconciliation(totals, { total: tbSalaries(L), monthly: {} }, 'total')
  assert.equal(r.status, 'MATCHED'); assert.equal(r.difference, 0)
  assert.equal(completeness(built.records, '2025-01-01', '2025-12-31').missing?.length ?? 0, 0)
  assert.equal(clientContributors(L).active.length, 7)
})
test('GOSI agrees to MUDAD and EOSB lands on the trial balance provision', () => {
  const { bill, mud, emps } = clientGosi(L); const g = gosiSheet(bill, mud)
  assert.ok(g.rows.every((r) => r.difference === 0))
  const tb = Math.abs(L.filter((l) => l.group === 'eosb').reduce((n, l) => n + l.closing, 0))
  const calc = emps.reduce((n, e) => n + eosbRow({ salary: e.basic + e.housing, joining: e.joining, leaving: '', yearEnd: '2025-12-31', opening: e.opening }).closing, 0)
  assert.ok(Math.abs(calc - tb) < 15, `EOSB ${calc} vs ${tb}`)
  const op = Math.abs(L.filter((l) => l.group === 'eosb').reduce((n, l) => n + l.opening, 0)); assert.ok(Math.abs(emps.reduce((n, e) => n + e.opening, 0) - op) < 0.05)
})
test('prepaid schedule equals the prepayments ledger', () => {
  const items = clientPrepaid(L); const s = prepaidSchedule(items, '2025-12-31')
  assert.equal(s.totals.prepaid, L.filter((l) => l.group === 'prepayments').reduce((n, l) => n + l.closing, 0))
})
test('assets: cost and opening depreciation equal the ledgers', () => {
  const a = clientAssets(L); const s = depSchedule(a, '2025-12-31', { yearStart: '2025-01-01' })
  assert.equal(Math.round(s.totals.G), Math.round(L.filter((l) => l.group === 'ppeCost').reduce((n, l) => n + l.closing, 0)))
  assert.equal(Math.round(s.totals.H), Math.round(Math.abs(L.filter((l) => l.group === 'accDep').reduce((n, l) => n + l.opening, 0))))
})

import { clientPyAfs, clientDepreciation, clientBis } from '../src/utils/clientFsData.js'
import { demoPY } from '../src/data/demoTB.js'
test('financial statement inputs come from the client trial balances', () => {
  const py = clientPyAfs(compactLedgers(demoPY())); assert.equal(py.bs.cash, 85000); assert.equal(py.bs.ar, 410000); assert.equal(py.bs.capital, 300000); assert.equal(py.bs.tangible, 198000); assert.equal(py.bs.re, 86000)
  assert.equal(clientDepreciation(L), 45000)
  const b = clientBis(L); assert.ok(b.length > 10 && b.every((x) => x[1] >= 0 && (x[2] === 'Dr' || x[2] === 'Cr')))
})
