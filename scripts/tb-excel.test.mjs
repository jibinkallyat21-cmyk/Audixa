// Tests for the Process 3.3 workbook: reading TB files and writing the review workbook. Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { toLedgers, consolidate, detectBranches } from '../src/utils/tbCore.js'
import { compareOpening, runChecks, ratios, buildNotes } from '../src/utils/tbChecks.js'
import { readTBWorkbook, buildTBReviewWorkbook } from '../src/utils/tbExcel.js'

async function tbFile(headers, rows, sheets = ['Sheet1']) {
  const wb = new ExcelJS.Workbook()
  for (const name of sheets) { const ws = wb.addWorksheet(name); ws.addRow(['Trial balance']); ws.addRow(headers); rows.forEach((r) => ws.addRow(r)); ws.addRow(['Total', null, 0, 0]) }
  return wb.xlsx.writeBuffer()
}
const H = ['Ledger Code', 'Ledger Name', 'Opening Balance', 'Debit', 'Credit', 'Closing Balance']
const PY = [['1001', 'Cash at Bank', 50000, 0, 0, 50000], ['1100', 'Trade Receivables', 100000, 0, 0, 100000], ['3001', 'Share Capital', -100000, 0, 0, -100000], ['3100', 'Retained Earnings', -50000, 0, 0, -50000]]
const CY = [['1001', 'Cash at Bank', 50000, 20000, 5000, 65000], ['1100', 'Trade Receivables', 103000, 0, 0, 103000], ['3001', 'Share Capital', -100000, 0, 0, -100000], ['3100', 'Retained Earnings', -53000, 0, 0, -53000], ['4001', 'Sales', 0, 0, 15000, -15000]]

test('a TB workbook is read: header row found, total rows skipped, mapping detected', async () => {
  const sheets = await readTBWorkbook(await tbFile(H, PY))
  assert.equal(sheets.length, 1); assert.equal(sheets[0].rows.length, 4)
  assert.equal(sheets[0].mapping.opening, 'Opening Balance'); assert.equal(sheets[0].rows[0].sourceRow, 3)
  const ledgers = toLedgers(sheets[0].rows, sheets[0].mapping)
  assert.equal(ledgers.length, 4); assert.equal(ledgers[3].closing, -50000)
})

test('several sheets are several branches', async () => {
  const sheets = await readTBWorkbook(await tbFile(H, PY, ['Riyadh', 'Jeddah']))
  assert.equal(sheets.length, 2)
  assert.equal(detectBranches([], sheets.length).how, 'separate sheets')
  const all = sheets.flatMap((s) => toLedgers(s.rows, s.mapping, { fileName: s.sheetName }))
  assert.equal(consolidate(all).ledgers.find((l) => l.code === '1001').closing, 100000)
})

test('the review workbook has the Rule Book sheets, live formulas and the expected values', async () => {
  const py = toLedgers((await readTBWorkbook(await tbFile(H, PY)))[0].rows, (await readTBWorkbook(await tbFile(H, PY)))[0].mapping)
  const cyRead = (await readTBWorkbook(await tbFile(H, CY)))[0]
  const cy = toLedgers(cyRead.rows, cyRead.mapping)
  const afs = [{ line: 'cash', amount: 50000 }, { line: 'receivables', amount: 100000 }, { line: 'capital', amount: 100000 }, { line: 're', amount: 50000 }]
  const opening = compareOpening({ py, cy, afs })
  const checks = runChecks({ py, cy })
  const wb = await buildTBReviewWorkbook({ client: 'Test Co', cyPeriod: '2025', pyPeriod: '2024', currency: 'SAR', opening, checks, ratioResult: ratios({ cy, afs }), notes: buildNotes({ opening, checks }), cy, py })
  const back = new ExcelJS.Workbook(); await back.xlsx.load(await wb.xlsx.writeBuffer())
  assert.deepEqual(back.worksheets.map((w) => w.name), ['Opening Balance Verification', 'Initial TB Review'])
  const s1 = back.getWorksheet('Opening Balance Verification')
  assert.equal(s1.getRow(4).values.slice(1, 9).join('|'), 'AFS line / ledger|Ledger code|PY AFS closing balance|PY audited TB closing|CY TB opening|Difference (CY opening - PY AFS)|Difference (CY opening - PY TB closing)|Status')
  const rec = []; s1.eachRow((row, n) => { if (String(row.getCell(1).value).trim() === 'Trade receivables') rec.push(n) })
  const g = rec[0]
  assert.match(s1.getCell(`E${g}`).value.formula, /^SUM\(E\d+:E\d+\)$/)            // subtotal is a formula
  assert.match(s1.getCell(`F${g}`).value.formula, new RegExp(`^E${g}-C${g}$`))      // difference vs AFS is a formula
  assert.equal(s1.getCell(`F${g}`).value.result, 3000); assert.equal(s1.getCell(`H${g}`).value.result, 'Difference')
  assert.equal(s1.getFont ? 1 : 1, 1)
  const s2 = back.getWorksheet('Initial TB Review')
  let a = null, secC = null; s2.eachRow((row, n) => { const v = String(row.getCell(1).value || ''); if (v.startsWith('SECTION A')) a = n; if (v.startsWith('SECTION C')) secC = n })
  assert.ok(a && secC); assert.equal(s2.getCell(`B${a + 2}`).value, 'Dr = Cr for Opening, Movement and Closing')
  const firstTb = secC + 2
  assert.match(s2.getCell(`G${firstTb}`).value.formula, new RegExp(`^D${firstTb}\\+E${firstTb}-F${firstTb}$`)) // closing = opening + debit - credit
  assert.equal(s2.getCell('A1').font.name, 'Arial'); assert.equal(s1.views[0].ySplit, 4)
})
