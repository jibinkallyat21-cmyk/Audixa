import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { readScheduleWorkbook, buildSalaryWorkbook, buildGosiEosbWorkbook } from '../src/utils/payrollExcel.js'
import { buildPrepaidWorkbook, buildDepreciationWorkbook } from '../src/utils/assetsExcel.js'
import * as S from '../src/utils/salary.js'
import { prepaidSchedule, depSchedule } from '../src/utils/prepaidDep.js'

const buf = async (wb) => { const b = await wb.xlsx.writeBuffer(); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }
test('read a client schedule, build the full salary workbook', async () => {
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Jan 2025'); ws.addRow(['Iqama', 'Employee Name', 'Basic Salary', 'Housing Allowance', 'Absence', 'Net Salary']); ws.addRow(['111', 'Ali', 5000, 1000, 100, 5900]); ws.addRow(['222', 'Sara', 4000, 800, 0, 4800]); ws.addRow(['', 'Total', 9000, 1800, 100, 10700])
  const srcs = await readScheduleWorkbook(await buf(wb), 'jan.xlsx', 'F1'); assert.equal(srcs.length, 1); assert.equal(srcs[0].mapping['Basic Salary'], 'basic')
  const built = S.buildAllMonths(srcs); assert.equal(built.records.length, 2)
  const totals = S.monthTotals(built.records); const recon = S.tbReconciliation(totals, { monthly: { '2025-01': 10700 } })
  const out = await buildSalaryWorkbook({ built, totals, recon, tb: {}, control: S.employeeControl(built.records), calc: S.calcValidation(built.records), completenessResult: S.completeness(built.records, '2025-01-01', '2025-02-28'), sourceRecon: S.sourceReconciliation(srcs, built), status: null, final: S.finalStatus({ built, control: [], calc: [], recon: [], completenessResult: S.completeness(built.records, '2025-01-01', '2025-02-28'), tbResult: recon, status: null }) })
  assert.deepEqual(out.worksheets.slice(0, 3).map((w) => w.name), ['All Months', 'TB Reconciliation', 'Validation - Exceptions'])
  const am = out.getWorksheet('All Months'); assert.equal(am.getCell('J2').value.formula, 'SUM(C2:I2)'); assert.equal(am.getCell('N2').value.formula, 'SUM(J2:M2)'); assert.equal(am.getCell('O2').value, 'Jan-2025'); assert.equal(am.getCell('I2').value, -100); assert.equal(am.getCell('K2').value, null)
  await buf(out)
})
test('GOSI/EOSB, prepaid, depreciation workbooks build', async () => {
  const g = S.gosiSheet([{ employeeId: '1', name: 'A', month: '2025-01', gosiExpense: 500, lateFee: 0 }], [{ employeeId: '1', month: '2025-01', netPay: 500 }])
  const e = [{ id: '1', name: 'A', joining: '2020-01-01', salary: 6000, endDate: '2025-12-31', opening: 1000, closing: 16000 }]
  await buf(await buildGosiEosbWorkbook({ gosi: g, eosb: e, yearEnd: '2025-12-31' }))
  const s = prepaidSchedule([{ particulars: 'Office rent', amount: 36500, start: '2025-07-01', end: '2026-06-30', vatPct: 15, paid: 36500, source: 'INV-1' }], '2025-12-31')
  const pw = await buildPrepaidWorkbook({ byCategory: { Rent: s }, yearStart: '2025-01-01', yearEnd: '2025-12-31' }); assert.equal(pw.worksheets[0].name, 'Summary'); assert.match(pw.getWorksheet('Rent').getCell('I4').value.formula, /MAX\(0/); await buf(pw)
  const assets = [{ cls: 'Furniture', name: 'Table', rate: 0.1, opening: 1000, openingAcc: 200, date: '2022-01-01' }, { cls: 'Computers and IT equipments', name: 'Laptop', rate: 0.25, addition: 3650, date: '2025-07-01' }, { cls: 'Buildings', name: 'Shed', rate: 0.05, addition: 100, date: '2025-03-01' }]
  const sched = depSchedule(assets, '2025-12-31', { yearStart: '2025-01-01' })
  const dw = await buildDepreciationWorkbook({ assets: sched.rows, yearStart: '2025-01-01', yearEnd: '2025-12-31', priorStart: '2024-01-01', priorEnd: '2024-12-31' })
  assert.deepEqual(dw.worksheets.map((w) => w.name), ['Depreciation ', 'Verification', 'Review Notes']); const d = dw.getWorksheet('Depreciation ')
  assert.equal(d.getCell('B3').value, 'Asset '); assert.match(JSON.stringify(d.getCell('M3').value), /Closing WDV -  31\.12\.2025/); await buf(dw)
  const rows = []; d.eachRow((r) => rows.push(r.getCell(2).value)); assert.ok(rows.includes('Buildings')); assert.ok(rows.includes('Total'))
})
