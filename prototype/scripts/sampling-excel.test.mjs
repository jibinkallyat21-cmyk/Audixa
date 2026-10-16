import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { sampleSalesPurchase, sampleExpense, sampleParties, sampleByMateriality } from '../src/utils/sampling.js'
import { readLedgerSheet, buildSalesWorkbook, buildExpenseWorkbook, buildPartyWorkbook, buildMaterialityWorkbook, SALES_FIELDS } from '../src/utils/samplingExcel.js'

const toBuf = async (wb) => { const b = await wb.xlsx.writeBuffer(); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }
async function ledgerBuf(headers, rows) { const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Sales'); ws.addRow(headers); rows.forEach((r) => ws.addRow(r)); return toBuf(wb) }

test('sales: original untouched, selected rows yellow, summary formulas', async () => {
  const buf = await ledgerBuf(['Invoice No', 'Customer', 'Taxable Value'], [['A', 'x', 100], ['B', 'y', 300], ['C', 'z', 50]])
  const src = await readLedgerSheet(buf, SALES_FIELDS); assert.equal(src.mapping.taxable, 'Taxable Value')
  const res = sampleSalesPurchase(src.rows.map((r) => ({ taxable: r.values['Taxable Value'] })))
  const wb = await buildSalesWorkbook({ source: src, taxableHeader: 'Taxable Value', result: res, label: 'Sales Report' })
  const ws = wb.getWorksheet('Sales'); assert.equal(ws.getCell('C3').value, 300); assert.equal(ws.getCell('C3').fill.fgColor.argb, 'FFFFFF00'); assert.equal(ws.getCell('C2').fill?.fgColor?.argb, undefined)
  assert.equal(ws.columnCount, 3); const sm = wb.getWorksheet('Sampling Summary'); assert.equal(sm.getCell('B3').value.formula, 'SUM(\'Sales\'!C2:C4)')
})
test('expense workbook: the Rule Book cells and formula', async () => {
  const rows = [{ account: 'Rent', amount: 100 }, { account: 'Fuel', amount: 50 }, { account: 'Tested', amount: 200 }]
  const include = { Tested: false }; const res = sampleExpense(rows, include)
  const wb = await buildExpenseWorkbook({ rows: res.rows, include, result: res })
  const sp = wb.getWorksheet('Sampling'); assert.equal(sp.getCell('C16').value.formula, 'IF($C$13=0,0,C15/$C$13)'); assert.match(sp.getCell('C13').value.formula, /Include/)
  assert.equal(wb.getWorksheet('Expense Accounts').getCell('B4').value, 'Exclude')
  await wb.xlsx.writeBuffer()
})
test('party workbook builds with every sheet', async () => {
  const res = sampleParties([{ name: 'A', debit: 0, credit: 600 }, { name: 'B', debit: 0, credit: 400 }, { name: 'C', debit: 80, credit: 0 }, { name: 'D', debit: 1, credit: 1 }])
  const wb = await buildPartyWorkbook({ result: res, inputs: { pct: 0.5, tolerance: 1, yearEnd: '31-12-2025', auditStart: '', today: '15-10-2026' } })
  assert.deepEqual(wb.worksheets.map((w) => w.name), ['Sheet1', 'Summary', 'Sample - Trade Payable', 'Sample - Advance to Supplier', 'Confirmation Tracker', 'Alt Procedures Tracker'])
  assert.equal(wb.getWorksheet('Summary').getCell('B3').value, 'Not provided – please enter')
  assert.equal(wb.getWorksheet('Sheet1').getCell('H2').value, 'Yes'); await toBuf(wb)
})
test('materiality workbook builds', async () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ account: 'A', amount: 100 * (i + 1) }))
  const params = { risk: 'Moderate (3)', size: 'Small', seed: 3, method: 'random' }
  const res = sampleByMateriality(items, { materiality: 2000, ...params })
  const wb = await buildMaterialityWorkbook({ items, params, result: res, area: 'Revenue', revenue: 1000000, materialityCalc: { pct: 0.5, calculated: 5000 } })
  assert.ok(wb.getWorksheet('Revenue Above')); assert.ok(wb.getWorksheet('Revenue Below')); assert.equal(wb.getWorksheet('Revenue Testing').getCell('E22').value.formula, 'MIN(E20,E21)'); await toBuf(wb)
})

import { buildVouchingWorkbook, buildPartyVouchingWorkbook, buildConfirmationWorkbook } from '../src/utils/vouchingExcel.js'
import { confirmationTests, confirmationOverall } from '../src/utils/vouching.js'
test('vouching workbooks build; Sample Testing % formula present', async () => {
  const wb = await buildVouchingWorkbook({ kind: 'sales', total: 1000, samples: [{ ref: '6002.02', party: 'A', taxable: 200, marks: { 'Sales Invoice': '✓' }, received: true }, { ref: '', taxable: 300, received: false, marks: {} }] })
  const ws = wb.getWorksheet('Vouching'); assert.equal(ws.getCell('A6').value, '6002.02'); assert.match(ws.getCell('A7').value, /Not Numbered/); assert.match(JSON.stringify(ws.getCell('B10').value), /SUMPRODUCT/); await toBuf(wb)
  for (const kind of ['cogs', 'expense']) await toBuf(await buildVouchingWorkbook({ kind, total: 10, samples: [{ ref: '1', taxable: 5, marks: {}, received: true }] }))
  await toBuf(await buildPartyVouchingWorkbook({ parties: [{ party: 'A', ref: '1', namesAgree: true }] }))
})
test('confirmation workbook sheets', async () => {
  const ctx = { tbAmount: 100, yearEnd: '2025-12-31', legalName: 'Acme', tbBank: 'SNB' }
  const c = { type: 'Bank', ref: '5002.01', amount: 100, tbAmount: 100, asAt: '2025-12-31', sealPresent: true, signaturePresent: true, clientName: 'Acme', bankName: 'SNB', letterhead: true }
  const t = confirmationTests(c, ctx); const wb = await buildConfirmationWorkbook({ confirmations: [{ ...c, tests: t.tests, reasons: t.reasons, overall: confirmationOverall(t.tests), clientProvided: true, statementChecked: true }], docLog: [{ ref: '5002.01', description: 'Confirmation', amount: 100, comparedWith: 100 }] })
  assert.deepEqual(wb.worksheets.map((w) => w.name), ['Summary', 'Cash', 'Bank', 'Document Log', 'Final Check', 'Closing Note']); assert.equal(wb.getWorksheet('Summary').getCell('D5').value, 'Confirmed / Matched'); await toBuf(wb)
})
