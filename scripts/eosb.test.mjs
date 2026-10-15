// Tests for Process 3.2 EOSB (organise the Active / Inactive contributor lists). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { detectMapping, parseDateValue, mapRows, buildEosb, fmtIso } from '../src/utils/eosb.js'
import { readContributorSheet, buildEosbWorkbook } from '../src/utils/eosbExcel.js'

test('columns are mapped by header name, in any order; other columns are ignored', () => {
  const m = detectMapping(['TOTAL WAGE', 'Commissions', 'HOUSING', 'EMPLOYEE NAME', 'Employee ID', 'BASICWAGE', 'Joining Date', 'Leaving Date', 'Other Allowance'])
  assert.deepEqual(m, { id: 'Employee ID', name: 'EMPLOYEE NAME', basic: 'BASICWAGE', hra: 'HOUSING', joining: 'Joining Date', leaving: 'Leaving Date' })
})

test('dates: real dates, ISO, day-first text, Excel serials; unreadable stay null', () => {
  assert.deepEqual(parseDateValue(new Date(Date.UTC(2025, 2, 5))), { iso: '2025-03-05', assumed: false })
  assert.deepEqual(parseDateValue('2025-03-05'), { iso: '2025-03-05', assumed: false })
  assert.deepEqual(parseDateValue('25/03/2025'), { iso: '2025-03-25', assumed: false })
  assert.deepEqual(parseDateValue('03/25/2025'), { iso: '2025-03-25', assumed: false })   // month-first is clear when the second part > 12
  assert.deepEqual(parseDateValue('03/04/2025'), { iso: '2025-04-03', assumed: true })    // ambiguous -> day-month-year, flagged
  assert.equal(parseDateValue(45658).iso, '2025-01-01')
  assert.equal(parseDateValue('1446/05/10').iso, null); assert.equal(parseDateValue('').iso, null); assert.equal(parseDateValue('31/02/2025').iso, null)
  assert.equal(fmtIso('2025-03-05'), '05-03-2025')
})

const rec = (list, o) => ({ list, registration: 'REG1', sourceRow: 2, id: '', name: '', basic: 5000, hra: 1250, joining: '2020-01-01', leaving: null, joiningRaw: '2020-01-01', leavingRaw: '', ...o })
const flagsOf = (r, type) => r.exceptions.filter((e) => e.flagType === type)

test('active employees stay Active with no leaving date', () => {
  const r = buildEosb({ active: [rec('Active', { id: '1001', name: 'Ali', leaving: '2025-05-01' })] })
  assert.equal(r.active[0].status, 'Active'); assert.equal(r.active[0].leaving, null); assert.equal(r.exceptions.length, 0)
})

test('inactive: leaving in 2025 / outside 2025 / missing', () => {
  const r = buildEosb({ inactive: [
    rec('Inactive', { sourceRow: 2, id: '2001', name: 'A', leaving: '2025-06-30', joiningRaw: 'x' }),
    rec('Inactive', { sourceRow: 3, id: '2002', name: 'B', leaving: '2024-12-31' }),
    rec('Inactive', { sourceRow: 4, id: '2003', name: 'C', leaving: '2026-01-01' }),
    rec('Inactive', { sourceRow: 5, id: '2004', name: 'D', leaving: null }),
  ] })
  assert.deepEqual(r.inactive.map((x) => x.status), ['Inactive', 'Inactive - left outside 2025', 'Inactive - left outside 2025', 'Check - no leaving date'])
  assert.equal(r.inactive.length, 4)                                    // every inactive employee is listed
  assert.equal(flagsOf(r, 'Left outside 2025').length, 2); assert.equal(flagsOf(r, 'No leaving date').length, 1)
  assert.deepEqual(r.summary.outside.map((o) => [o.id, o.leaving]), [['2002', '2024-12-31'], ['2003', '2026-01-01']])
})

test('names: filled from the PDF by ID and marked; otherwise left blank and flagged', () => {
  const r = buildEosb({ active: [rec('Active', { id: '1001', name: '' }), rec('Active', { id: '1002', name: '', sourceRow: 3 })], pdfNames: { 1001: 'Ahmed Ali' } })
  assert.equal(r.active[0].name, 'Ahmed Ali'); assert.equal(flagsOf(r, 'Name filled from PDF').length, 1)
  assert.equal(r.active[1].name, ''); assert.equal(flagsOf(r, 'Missing name').length, 1); assert.ok(r.active[1].missing.has('name'))
  assert.equal(r.active.length, 2) // rows with missing names are kept
})

test('missing data, duplicates, both-lists and joining-after-leaving are flagged', () => {
  const r = buildEosb({
    active: [rec('Active', { id: '1', name: 'A', basic: null, hra: null, joining: null, joiningRaw: '' }), rec('Active', { id: '9', name: 'D1', sourceRow: 3 }), rec('Active', { id: '9', name: 'D2', sourceRow: 4 }), rec('Active', { id: '5', name: 'Both', sourceRow: 5 })],
    inactive: [rec('Inactive', { id: '5', name: 'Both', sourceRow: 2, joining: '2024-01-01', leaving: '2025-02-02' }), rec('Inactive', { id: '6', name: 'Back', sourceRow: 3, joining: '2025-08-01', leaving: '2025-03-01' })],
  })
  assert.match(flagsOf(r, 'Missing data')[0].reason, /Basic Pay, HRA, Joining Date/)
  assert.equal(flagsOf(r, 'Duplicate ID').length, 2)
  const both = flagsOf(r, 'ID in both lists'); assert.equal(both.length, 2)
  assert.match(both.find((e) => e.sourceList.startsWith('Active')).reason, /Inactive list.*joined 01-01-2024, left 02-02-2025/)
  assert.equal(flagsOf(r, 'Joining after leaving').length, 1)
  assert.equal(r.active[0].basic, null) // blanks are never filled in
})

test('ambiguous text dates are flagged as assumed', () => {
  assert.equal(flagsOf(buildEosb({ active: [rec('Active', { id: '1', name: 'A', assumedDate: true })] }), 'Date format assumed').length, 1)
})

test('the audit period replaces the hard-coded 2025', () => {
  const r = buildEosb({ inactive: [rec('Inactive', { id: '1', name: 'A', leaving: '2025-06-30' })], window: { start: '2024-07-01', end: '2025-06-30', label: 'the audit period' } })
  assert.equal(r.inactive[0].status, 'Inactive')
  assert.equal(buildEosb({ inactive: [rec('Inactive', { id: '1', name: 'A', leaving: '2025-07-01' })], window: { start: '2024-07-01', end: '2025-06-30', label: 'the audit period' } }).inactive[0].status, 'Inactive - left outside the audit period')
})

async function makeXlsx(headers, rows) {
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Sheet1')
  ws.addRow(['Report title row']); ws.addRow(headers); rows.forEach((r) => ws.addRow(r))
  return wb.xlsx.writeBuffer()
}

test('end to end: read two files, build, write the workbook and read it back', async () => {
  const f1 = await makeXlsx(['EMPLOYEE NAME', 'Employee ID', 'BASICWAGE', 'HOUSING', 'TOTAL WAGE', 'Joining Date'], [['Ali', '0012345', 6000, 1500, 7500, new Date(Date.UTC(2021, 0, 15))], ['', '77', 4000, 1000, 5000, '05/03/2022'], [null, null, null, null, null, null]])
  const f2 = await makeXlsx(['Employee ID', 'Name', 'BASICWAGE', 'HOUSING', 'Joining Date', 'Leaving Date'], [['88', 'Omar', 3000, 750, new Date(Date.UTC(2019, 5, 1)), new Date(Date.UTC(2024, 11, 31))]])
  const a = await readContributorSheet(f1), i = await readContributorSheet(f2)
  assert.equal(a.rows.length, 2) // the empty row is skipped
  assert.equal(a.rows[0].sourceRow, 3)
  const active = mapRows(a.rows, a.mapping, { list: 'Active', registration: 'R1', fileName: 'a.xlsx' })
  const inactive = mapRows(i.rows, i.mapping, { list: 'Inactive', registration: 'R2', fileName: 'i.xlsx' })
  assert.equal(active[0].id, '0012345') // leading zeros kept (ID is text)
  const result = buildEosb({ active, inactive, pdfNames: { 77: 'Sami Khan' } })
  const wb = await buildEosbWorkbook(result)
  const buf = await wb.xlsx.writeBuffer(); const back = new ExcelJS.Workbook(); await back.xlsx.load(buf)
  assert.deepEqual(back.worksheets.map((w) => w.name), ['Active', 'Inactive', 'Exceptions'])
  const act = back.getWorksheet('Active')
  assert.equal(act.getRow(1).values.slice(1).join('|'), 'Employee ID|Name|Basic Pay|HRA|Total Salary|Joining Date|Status')
  assert.equal(act.getCell('A2').value, '0012345')
  assert.match(act.getCell('E2').value.formula, /C2\+D2/)                       // live formula
  assert.ok(act.getCell('F2').value instanceof Date); assert.equal(act.getCell('F2').numFmt, 'dd-mm-yyyy')
  assert.equal(act.getCell('B3').value, 'Sami Khan')
  assert.equal(act.getCell('A1').font.name, 'Arial'); assert.equal(act.views[0].ySplit, 1)
  const ina = back.getWorksheet('Inactive')
  assert.equal(ina.getCell('H2').value, 'Inactive - left outside 2025'); assert.equal(ina.getCell('G2').numFmt, 'dd-mm-yyyy')
  const ex = back.getWorksheet('Exceptions')
  assert.equal(ex.getRow(1).values.slice(1).join('|'), 'Source List|Source Row|Employee ID|Name|Basic Pay|HRA|Joining Date|Leaving Date|Flag Type|Reason')
  const types = []; ex.eachRow((r, n) => { if (n > 1) types.push(r.getCell(9).value) })
  assert.ok(types.includes('Name filled from PDF') && types.includes('Left outside 2025') && types.includes('Date format assumed'))
})

test('a file without contributor columns is rejected, not guessed', async () => {
  const f = await makeXlsx(['Foo', 'Bar'], [[1, 2]])
  assert.match((await readContributorSheet(f)).error, /No contributor columns/)
})
