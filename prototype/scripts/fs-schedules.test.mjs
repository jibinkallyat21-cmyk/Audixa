import test from 'node:test'
import assert from 'node:assert/strict'
import { demoCorrectedLedgers } from '../src/data/demoTB.js'
import { buildSchedules, scheduleOwner } from '../src/utils/fsSchedules.js'
import { buildIfrsTB, statements, cogsSchedule, vatReconciliation, pendingList } from '../src/utils/ifrs.js'
import { buildIfrsWorkbook } from '../src/utils/ifrsExcel.js'
const led = demoCorrectedLedgers()
test('schedule checks: agreeing and differing schedules are told apart', () => {
  const s = buildSchedules(led); const by = Object.fromEntries(s.checks.map((c) => [c.id, c]))
  assert.equal(by.prepaid.ok, true); assert.equal(by.cost.ok, true); assert.equal(by.accdep.ok, false); assert.equal(by.accdep.diff, 19500)
  assert.equal(s.mismatches.length, s.checks.filter((c) => !c.ok).length)
})
test('owner comes from who prepared the schedule, else the fallback', () => {
  const log = [{ clientName: 'C', at: '2026-01-01', extra: { auditArea: 'Depreciation', performedBy: 'Sara' } }, { clientName: 'C', at: '2026-02-01', extra: { auditArea: 'Depreciation', performedBy: 'Omar' } }]
  assert.equal(scheduleOwner('depreciation', log, 'C', 'Fallback'), 'Omar'); assert.equal(scheduleOwner('prepaid', log, 'C', 'Fallback'), 'Fallback')
})
test('workbook: client TB first, a three-column IFRS TB, the statements, then the schedules', async () => {
  const tb = buildIfrsTB({ ledgers: led }); const st = statements(tb); const schedules = buildSchedules(led); schedules.checks.forEach((c) => { c.owner = 'Khalid' })
  const wb = await buildIfrsWorkbook({ tb, ledgers: led, cogs: cogsSchedule(led, tb, {}), vat: vatReconciliation(led, tb), verification: [], pending: pendingList({ tb, ledgers: led, adj: tb.adj }), st, client: 'Kingdom', period: { from: '01 Jan 2025', to: '31 Dec 2025' }, mode: 'proper', schedules })
  const names = wb.worksheets.map((w) => w.name)
  assert.deepEqual(names.slice(0, 10), ['Client TB', 'IFRS TB', 'BS', 'P and L', 'Statement of equity', 'Prepaid', 'Depreciation', 'EOSB', 'GOSI Expense', 'Schedule checks'])
  const it = wb.getWorksheet('IFRS TB'); assert.deepEqual([1, 2, 3].map((c) => it.getRow(4).getCell(c).value), ['Ledger name', 'Closing balance 2025', 'Closing balance 2024']); assert.equal(it.getRow(4).getCell(4).value, null)
  const sc = wb.getWorksheet('Schedule checks'); assert.ok(sc.rowCount > 5)
  const no = await buildIfrsWorkbook({ tb, ledgers: led, cogs: cogsSchedule(led, tb, {}), vat: vatReconciliation(led, tb), verification: [], pending: [], st, client: 'K', period: {}, mode: 'disclaimer' })
  assert.ok(!no.worksheets.some((w) => w.name === 'Prepaid'))
})
