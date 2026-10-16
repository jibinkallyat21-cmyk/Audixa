import test from 'node:test'
import assert from 'node:assert/strict'
import { parseMonth, suggestMapping, buildAllMonths, employeeControl, calcValidation, monthTotals, sourceReconciliation, completeness, tbReconciliation, matchContributors, employeeStatusTests, finalStatus, gosiSheet, gosiMudadAdjustment, eosbEntitlement, eosbRow, MONTH_REVIEW, expectedMonths } from '../src/utils/salary.js'

const src = (over = {}) => ({ fileId: 'F1', fileName: 'Jan-2025.xlsx', sheetName: 'Sheet1', headers: ['Iqama', 'Name', 'Basic', 'Housing', 'Absence', 'Loan', 'Net', 'Mystery'], mapping: { Iqama: 'iqama', Name: 'name', Basic: 'basic', Housing: 'housing', Absence: 'absence', Loan: 'loan', Net: 'net', Mystery: null },
  rows: [{ sourceRow: 2, values: { Iqama: '111', Name: 'Ali', Basic: 5000, Housing: 1000, Absence: 100, Loan: 200, Net: 5700, Mystery: 5 } }, { sourceRow: 3, values: { Iqama: '222', Name: 'Sara', Basic: 4000, Housing: 800, Absence: null, Loan: null, Net: 4800 } }, { sourceRow: 4, values: { Iqama: '', Name: '', Basic: 9000, Housing: 1800, Net: 10800 } }], ...over })
test('months', () => { assert.equal(parseMonth('Jan 2025'), '2025-01'); assert.equal(parseMonth('2025-03'), '2025-03'); assert.equal(parseMonth('12/2025'), '2025-12'); assert.equal(parseMonth('Salary Mar-25'), '2025-03'); assert.equal(parseMonth('hello'), null); assert.equal(parseMonth(45658), '2025-01'); assert.equal(parseMonth('03/04/2025'), null) })
test('mapping suggestions and unmapped', () => { const m = suggestMapping(['Iqaama Id', 'BASIC SALARY ', 'Weird']); assert.equal(m['Iqaama Id'], 'iqama'); assert.equal(m['BASIC SALARY '], 'basic'); assert.equal(m.Weird, null) })
test('all months: month from sheet/file text, deductions negative, blank not zero, total rows excluded, unmapped flagged', () => {
  const b = buildAllMonths([src()]); assert.equal(b.records.length, 2); assert.equal(b.excluded.length, 1)
  const a = b.records[0]; assert.equal(a.month, '2025-01'); assert.equal(a.absence, -100); assert.equal(a.loan, -200); assert.equal(a.total, 5900); assert.equal(a.net, 5700)
  assert.equal(b.records[1].absence, null); assert.equal(b.records[1].net, 4800)
  assert.ok(b.exceptions.some((e) => /Mystery/.test(e.detail))); assert.ok(b.mappingTable.some((m) => m.client === 'Mystery' && m.basis === 'Not mapped'))
})
test('unknown month gets the standard message', () => { const b = buildAllMonths([src({ fileName: 'payroll.xlsx', sheetName: 'Sheet1' })]); assert.ok(b.records[0].flags.includes(MONTH_REVIEW)); assert.equal(b.records[0].month, null) })
test('calc validation never changes values', () => { const s = src(); s.rows[1].values.Net = 4700; const b = buildAllMonths([s]); const v = calcValidation(b.records); assert.ok(v.some((x) => /Net salary does not agree/.test(x.type))); assert.equal(b.records[1].net, 4800) })
test('employee control: duplicates kept, missing iqama, inconsistent ids', () => {
  const s = src(); s.rows.push({ sourceRow: 5, values: { Iqama: '111', Name: 'Ali', Basic: 100, Net: 100 } }); const b = buildAllMonths([s]); assert.equal(b.records.length, 3)
  const ex = employeeControl(b.records); assert.equal(ex.filter((e) => e.type === 'Duplicate employee-month').length, 2)
  const x = employeeControl(buildAllMonths([src({ rows: [{ sourceRow: 2, values: { Iqama: '1', Name: 'A', Basic: 1 } }, { sourceRow: 3, values: { Iqama: '1', Name: 'B', Basic: 1 } }, { sourceRow: 4, values: { Iqama: '', Name: 'C', Basic: 1 } }] })]).records)
  assert.ok(x.some((e) => e.type === 'Inconsistent identifiers')); assert.ok(x.some((e) => e.type === 'Missing Iqama number'))
})
test('source reconciliation and totals', () => { const s = src(); const b = buildAllMonths([s]); const r = sourceReconciliation([s], b)[0]; assert.equal(r.rowDiff, 0); assert.equal(r.sourceRows, 3); assert.equal(monthTotals(b.records)[0].total, 5900 + 4800) })
test('completeness: missing months and duplicate schedule', () => {
  assert.deepEqual(expectedMonths('2025-01-01', '2025-03-31'), ['2025-01', '2025-02', '2025-03'])
  const b = buildAllMonths([src()]); const c = completeness(b.records, '2025-01-01', '2025-03-31'); assert.deepEqual(c.missing, ['2025-02', '2025-03']); assert.equal(completeness(b.records, '', '').periodKnown, false)
  const d = buildAllMonths([src(), src({ fileId: 'F2' })]); assert.ok(completeness(d.records, '2025-01-01', '2025-01-31').matrix[0].duplicateSchedule)
})
test('TB reconciliation: missing TB month is not zero; zero difference matches; cause text', () => {
  const t = [{ month: '2025-01', total: 100, net: 90 }, { month: '2025-02', total: 100, net: 90 }]
  let r = tbReconciliation(t, { monthly: { '2025-01': 100 } }); assert.equal(r.monthly[0].status, 'MATCHED'); assert.equal(r.monthly[1].status, 'REVIEW REQUIRED'); assert.equal(r.status, 'REVIEW REQUIRED')
  r = tbReconciliation(t, { monthly: { '2025-01': 100, '2025-02': 99 } }); assert.equal(r.status, 'NOT MATCHED'); assert.equal(r.difference, 1); assert.match(r.cause, /could not be determined/)
  assert.equal(tbReconciliation(t, { total: 200 }).status, 'MATCHED'); assert.equal(tbReconciliation(t, { total: 180 }, 'net').status, 'MATCHED')
})
test('contributors: Iqama first, no name forcing, status tests', () => {
  const b = buildAllMonths([src({ rows: [{ sourceRow: 2, values: { Iqama: '111', Name: 'Ali', Basic: 1 } }, { sourceRow: 3, values: { Iqama: '222', Name: 'Sara', Basic: 1 } }, { sourceRow: 4, values: { Iqama: '333', Name: 'Zed', Basic: 1 } }] }), src({ fileId: 'F2', fileName: 'Mar-2025.xlsx', rows: [{ sourceRow: 2, values: { Iqama: '222', Name: 'Sara', Basic: 1 } }] })])
  const contributors = [{ id: '111', name: 'Ali', joining: '2025-02-01', leaving: null, list: 'Active' }, { id: '222', name: 'Sara', joining: '2020-01-01', leaving: '2025-02-15', list: 'Inactive' }]
  const m = matchContributors(b.records, contributors); assert.equal(m.get('111').result, 'Active'); assert.equal(m.get('333').result, 'Not found')
  const t = employeeStatusTests(b.records, m, { auditStart: '2025-01-01', auditEnd: '2025-12-31' })
  assert.ok(t.exceptions.some((e) => e.type === 'Salary paid before joining date' && e.employee === 'Ali'))
  assert.ok(t.exceptions.some((e) => e.type === 'Salary paid after left date' && e.employee === 'Sara' && e.month === '2025-03'))
  assert.ok(t.exceptions.some((e) => e.type === 'Employee missing from contributor lists'))
  const g = employeeStatusTests([], new Map([['x', { key: 'x', name: 'Q', result: 'Inactive', contributor: { list: 'Inactive', leaving: '2024-12-31', joining: '2020-01-01' } }]]), { auditStart: '2025-01-01', auditEnd: '2025-12-31' })
  assert.equal(g.groupA.length, 1); assert.equal(g.groupB.length, 1); assert.ok(g.groupB[0].overlapA)
})
test('final status: one status, READY only when nothing is open', () => {
  const b = buildAllMonths([src({ headers: ['Iqama', 'Name', 'Basic', 'Net'], mapping: { Iqama: 'iqama', Name: 'name', Basic: 'basic', Net: 'net' }, rows: [{ sourceRow: 2, values: { Iqama: '1', Name: 'A', Basic: 100, Net: 100 } }] })])
  const ctx = { built: b, control: employeeControl(b.records), calc: calcValidation(b.records), recon: sourceReconciliation([{ fileId: 'F1', sheetName: 'Sheet1', rows: [1], mapping: { Net: 'net' } }], b), completenessResult: completeness(b.records, '2025-01-01', '2025-01-31'), tbResult: tbReconciliation(monthTotals(b.records), { total: 100 }), status: { exceptions: [] } }
  assert.equal(finalStatus(ctx).status, 'READY FOR AUDITOR')
  assert.equal(finalStatus({ ...ctx, tbResult: tbReconciliation(monthTotals(b.records), { total: 90 }) }).status, 'REVIEW REQUIRED')
  assert.equal(finalStatus({ ...ctx, status: null }).status, 'REVIEW REQUIRED')
})
test('GOSI sheet and the GOSI/MUDAD rule', () => {
  const g = gosiSheet([{ employeeId: '1', name: 'A', month: '2025-01', gosiSalary: 5000, gosiExpense: 500, lateFee: 10 }, { employeeId: '1', name: 'A', month: '2025-12', gosiExpense: 500, lateFee: 0 }, { employeeId: '1', name: 'A', month: '2025-02', gosiExpense: 500, debitAdjustment: true }], [{ employeeId: '1', month: '2025-01', netPay: 505 }])
  assert.equal(g.expenseTotal, 1010); assert.equal(g.payable, 500); assert.equal(g.rows[0].difference, 5); assert.match(g.rows[0].note, /difference 5/); assert.equal(g.rows[2].note, 'Debit Adjustment')
  assert.deepEqual(gosiMudadAdjustment(500, 520), { other: 20, absence: 0, difference: 20 }); assert.deepEqual(gosiMudadAdjustment(520, 500), { other: 0, absence: -20, difference: -20 })
})
test('EOSB', () => {
  assert.equal(eosbEntitlement({ salary: 6000, joining: '2020-01-01', endDate: '2025-01-01' }), 6000 * 0.5 * 5 + Math.round((1828 / 365 - 5) * 6000 * 100) / 100)
  assert.equal(eosbEntitlement({ salary: 6000, joining: '2024-01-01', endDate: '2024-12-30' }), 3000)
  const e = eosbRow({ salary: 6000, joining: '2024-01-01', leaving: '2025-06-30', yearEnd: '2025-12-31', opening: 1000 }); assert.equal(e.endDate, '2025-06-30'); assert.ok(e.charge > 0)
  assert.equal(eosbRow({ salary: 1, joining: '', yearEnd: '2025-12-31' }).closing, null)
})
