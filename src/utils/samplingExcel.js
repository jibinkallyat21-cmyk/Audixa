// Process 3.4 Excel I/O: reads ledger exports and writes the sampling workbooks. exceljs loads on demand.
import { loadExcelJS } from './eosbExcel.js'
import { sampleByMateriality, MAX_SAMPLE, CONFIDENCE } from './sampling.js'

const norm = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const ARIAL = { name: 'Arial', size: 10 }
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const YELLOW = fill('FFFFFF00'), HEAD = fill('FFD9E1F2'), GREEN_IN = fill('FFE2EFDA'), GREY = fill('FFD9D9D9'), BLUE = fill('FFBDD7EE')
const NUM = '#,##0.00', DATE = 'dd-mm-yyyy'

function cellValue(c) {
  const v = c?.value
  if (v === null || v === undefined) return null
  if (typeof v === 'object' && !(v instanceof Date)) {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('')
    if ('result' in v) return v.result ?? null
    if ('text' in v) return v.text
    return String(v)
  }
  return v
}
// fields: { key: [aliases (normalised)] }. Returns the sheet whose header row best matches.
export async function readLedgerSheet(arrayBuffer, fields) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(arrayBuffer)
  const detect = (headers) => { const nh = headers.map(norm); const m = {}; for (const [k, al] of Object.entries(fields)) { let hit = null; for (const a of al) { const i = nh.indexOf(a); if (i >= 0) { hit = headers[i]; break } } m[k] = hit } return m }
  let best = null
  for (const ws of wb.worksheets) for (let r = 1; r <= Math.min(25, ws.rowCount); r++) {
    const row = ws.getRow(r); const headers = Array.from({ length: ws.columnCount }, (_, i) => { const v = cellValue(row.getCell(i + 1)); return v === null ? '' : String(v).trim() })
    const hits = Object.values(detect(headers)).filter(Boolean).length
    if (!best || hits > best.hits) best = { hits, ws, headerRow: r, headers }
  }
  if (!best || best.hits < 2) return { error: 'No recognisable columns were found in this file.', headers: [], rows: [], mapping: {} }
  const { ws, headerRow, headers } = best; const rows = []
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r); const values = {}; let any = false
    headers.forEach((h, i) => { if (!h) return; const v = cellValue(row.getCell(i + 1)); values[h] = v; if (v !== null && String(v).trim() !== '') any = true })
    if (any) rows.push({ sourceRow: r, values })
  }
  return { sheetName: ws.name, headerRow, headers: headers.filter(Boolean), rows, mapping: detect(headers), buffer: arrayBuffer }
}
export const toNum = (v) => { if (v === null || v === undefined || v === '') return null; const s = String(v).trim(); const neg = /^\(.*\)$/.test(s); const n = typeof v === 'number' ? v : Number(s.replace(/[(),\s]/g, '')); return Number.isFinite(n) ? (neg ? -Math.abs(n) : n) : null }

export const SALES_FIELDS = { id: ['invoiceno', 'invoicenumber', 'billno', 'documentno', 'voucherno', 'reference', 'ref'], date: ['date', 'invoicedate', 'billdate'], party: ['customer', 'customername', 'party', 'partyname', 'supplier', 'suppliername', 'vendor', 'name'], taxable: ['taxablevalue', 'taxableamount', 'taxable', 'netamount', 'amountexclvat', 'amountexcludingvat', 'subtotal'] }
export const EXPENSE_FIELDS = { account: ['account', 'accountname', 'ledger', 'ledgername', 'expenseaccount', 'category', 'head'], description: ['description', 'narration', 'remarks', 'particulars', 'details'], date: ['date', 'transactiondate', 'voucherdate'], debit: ['debit', 'dr', 'debitamount'], credit: ['credit', 'cr', 'creditamount'], amount: ['amount', 'netamount', 'value', 'taxablevalue'] }
export const PARTY_FIELDS = { code: ['code', 'partycode', 'ledgercode', 'accountcode'], name: ['particulars', 'party', 'partyname', 'name', 'accountname', 'customer', 'supplier'], debit: ['debitsfortheperiod', 'debits', 'debit', 'dr'], credit: ['creditsfortheperiod', 'credits', 'credit', 'cr'], closing: ['closingbalance', 'closing', 'balance'] }
export const MAT_FIELDS = { ref: ['voucherref', 'voucherno', 'voucher', 'reference', 'ref'], date: ['date'], account: ['account', 'accountname', 'ledger', 'ledgername'], description: ['description', 'remarks', 'narration', 'particulars'], debit: ['debit', 'dr'], credit: ['credit', 'cr'] }

const reorder = (list) => list.forEach((w, i) => { w.orderNo = i })
function style(ws, widths) {
  ws.columns.forEach((c, i) => { c.width = widths?.[i] || 16 })
  ws.eachRow((row) => row.eachCell({ includeEmpty: false }, (c) => { c.font = { ...ARIAL, ...(c.font || {}) } }))
  const h = ws.getRow(1); h.font = { ...ARIAL, bold: true }; h.eachCell((c) => { c.fill = HEAD })
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}
const sheetWith = (wb, name, headers, rows, widths, fmts = {}) => {
  const ws = wb.addWorksheet(name); ws.addRow(headers); rows.forEach((r) => ws.addRow(r)); style(ws, widths)
  Object.entries(fmts).forEach(([col, f]) => { for (let r = 2; r <= ws.rowCount; r++) ws.getCell(r, Number(col)).numFmt = f })
  return ws
}

// ── Sales / Purchase: the original file is kept; selected rows are highlighted yellow; a Sampling Summary sheet is added ──
export async function buildSalesWorkbook({ source, taxableHeader, result, label }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(source.buffer)
  const ws = wb.getWorksheet(source.sheetName); const hdrRow = ws.getRow(source.headerRow)
  const col = Array.from({ length: ws.columnCount }, (_, i) => i + 1).find((i) => String(cellValue(hdrRow.getCell(i)) ?? '').trim() === taxableHeader)
  const sel = source.rows.filter((_, i) => result.rows[i]?.selected)
  sel.forEach((r) => { ws.getRow(r.sourceRow).eachCell({ includeEmpty: true }, (c) => { c.fill = YELLOW }) })
  const sm = wb.addWorksheet('Sampling Summary')
  const colL = ws.getColumn(col).letter; const first = source.rows[0].sourceRow, last = source.rows[source.rows.length - 1].sourceRow
  const q = `'${source.sheetName}'`
  ;[['Sampling – ' + label, ''], ['Taxable Value column', taxableHeader], ['Total taxable value', { formula: `SUM(${q}!${colL}${first}:${colL}${last})` }], ['50% target', { formula: 'B3*0.5' }], ['Selected value (yellow)', { formula: sel.length ? `SUM(${sel.map((r) => `${q}!${colL}${r.sourceRow}`).join(',')})` : '0' }], ['Coverage', { formula: 'IF(B3=0,0,B5/B3)' }], ['Entries selected', sel.length], ['Cap', `${result.cap} entries${result.capped ? ' (reached before 50%)' : ''}`]]
    .forEach((r) => sm.addRow(r))
  ;['B3', 'B4', 'B5'].forEach((a) => { sm.getCell(a).numFmt = NUM }); sm.getCell('B6').numFmt = '0.00%'
  sm.getColumn(1).width = 28; sm.getColumn(2).width = 30; sm.eachRow((r) => r.eachCell((c) => { c.font = ARIAL })); sm.getRow(1).font = { ...ARIAL, bold: true }
  sm.addRow([]); sm.addRow(['Source row', 'Taxable value']).font = { ...ARIAL, bold: true }
  sel.forEach((r) => { const x = sm.addRow([r.sourceRow, { formula: `${q}!${colL}${r.sourceRow}` }]); x.getCell(2).numFmt = NUM; x.eachCell((c) => { c.font = ARIAL }) })
  sm.addRow([]); sm.addRow(['Only yellow highlighting was added to the original sheet; no data, formulas, headings, columns or layout were changed.']).font = { ...ARIAL, italic: true }
  return wb
}

// ── Expense: Include / Exclude per account with live population, required sample and sample % ──
export async function buildExpenseWorkbook({ rows, include, result, client = '' }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const accounts = [...new Set(rows.map((r) => r.account))].sort()
  const acc = wb.addWorksheet('Expense Accounts'); acc.addRow(['Account', 'Include / Exclude', 'Lines', 'Net amount', 'Status'])
  accounts.forEach((a, i) => { const r = i + 2; acc.addRow([a, include[a] === false ? 'Exclude' : 'Include', { formula: `COUNTIF('Consolidated Expenses'!$A$2:$A$${rows.length + 1},A${r})` }, { formula: `SUMIF('Consolidated Expenses'!$A$2:$A$${rows.length + 1},A${r},'Consolidated Expenses'!$D$2:$D$${rows.length + 1})` }, { formula: `IF(B${r}="Exclude","Excluded – already tested","Included in sampling")` }]); acc.getCell(r, 2).fill = GREEN_IN; acc.getCell(r, 4).numFmt = NUM; acc.getCell(r, 2).dataValidation = { type: 'list', allowBlank: false, formulae: ['"Include,Exclude"'] } })
  style(acc, [34, 18, 10, 18, 28])
  const n = rows.length + 1
  const ex = wb.addWorksheet('Consolidated Expenses'); ex.addRow(['Expense Account', 'Description', 'Date', 'Amount', 'Include / Exclude', 'Rank by Value', 'Selected'])
  rows.forEach((r, i) => { const k = i + 2; ex.addRow([r.account, r.description || '', r.date || null, r.amount, { formula: `IFERROR(INDEX('Expense Accounts'!$B$2:$B$${accounts.length + 1},MATCH(A${k},'Expense Accounts'!$A$2:$A$${accounts.length + 1},0)),"Include")` }, r.included ? (r.rank ?? '') : '', r.selected ? 'Selected' : r.included ? 'Not Selected' : 'Excluded']); ex.getCell(k, 4).numFmt = NUM; ex.getCell(k, 3).numFmt = DATE; if (r.selected) ex.getRow(k).eachCell((c) => { c.fill = YELLOW }) })
  style(ex, [30, 40, 12, 16, 16, 12, 14])
  const sp = wb.addWorksheet('Sampling')
  const L = [['Expense sampling' + (client ? ' – ' + client : ''), ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', ''],
    ['Revised Eligible Population', { formula: `SUMIF('Consolidated Expenses'!$E$2:$E$${n},"Include",'Consolidated Expenses'!$D$2:$D$${n})` }],
    ['Required 50% Sample', { formula: 'C13*0.5' }], ['Selected Sample Value (snapshot)', result.selectedValue],
    ['Selected Sample Percentage', { formula: 'IF($C$13=0,0,C15/$C$13)' }]]
  // labels in column B, values in column C so that C13 = Revised Eligible Population and C15 = selected value, as the Rule Book formula states
  L.forEach((r, i) => { sp.getCell(i + 1, 2).value = r[0]; if (r[1] !== '') sp.getCell(i + 1, 3).value = r[1] })
  sp.getCell('B3').value = '100% Consolidated Expenses'; sp.getCell('C3').value = { formula: `SUM('Consolidated Expenses'!$D$2:$D$${n})` }
  sp.getCell('B5').value = 'Excluded expenses'; sp.getCell('C5').value = { formula: `SUMIF('Consolidated Expenses'!$E$2:$E$${n},"Exclude",'Consolidated Expenses'!$D$2:$D$${n})` }
  ;['C3', 'C5', 'C13', 'C14', 'C15'].forEach((a) => { sp.getCell(a).numFmt = NUM }); sp.getCell('C16').numFmt = '0.00%'
  sp.getColumn(2).width = 40; sp.getColumn(3).width = 22; sp.eachRow((r) => r.eachCell((c) => { c.font = ARIAL })); sp.getCell('B1').font = { ...ARIAL, bold: true }
  sp.getCell('B18').value = 'Flow: 100% Consolidated Expenses → Include / Exclude → Excluded → Revised Eligible Population → 50% of it → Selected sample (highest value first, maximum 7 per account) → Selected % of Revised Eligible Population.'
  sp.getCell('B19').value = 'The population, required sample and percentage update live. The selected items below are the selection made when this file was produced; run the sampling again after changing Include / Exclude to refresh them.'
  sp.getCell('B19').font = { ...ARIAL, italic: true }
  const s = wb.addWorksheet('Selected 50% Samples')
  s.addRow(['Expense Account', 'Item / Category', 'Description', 'Date', 'Amount', 'Include / Exclude', 'Rank by Value', 'Status', 'Selected Sample Amount', 'Revised Eligible Population', 'Required 50% Sample', 'Selected Sample %'])
  result.selected.forEach((r, i) => { const k = i + 2; s.addRow([r.account, r.account, r.description || '', r.date || null, r.amount, 'Include', r.rank, 'Selected', r.amount, { formula: 'Sampling!$C$13' }, { formula: 'Sampling!$C$14' }, { formula: 'Sampling!$C$16' }]); s.getCell(k, 4).numFmt = DATE; s.getCell(k, 5).numFmt = NUM; s.getCell(k, 9).numFmt = NUM; s.getCell(k, 10).numFmt = NUM; s.getCell(k, 11).numFmt = NUM; s.getCell(k, 12).numFmt = '0.00%' })
  style(s, [28, 28, 34, 12, 16, 14, 12, 12, 18, 20, 18, 16])
  reorder([sp, acc, ex, s])
  return wb
}

// ── AR / AP / Advances ───────────────────────────────────────────────────
export async function buildPartyWorkbook({ result, inputs, client = '' }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const items = result.items
  const led = wb.addWorksheet('Sheet1'); led.addRow(['Code', 'Particulars', 'Debits for the period', 'Credits for the period', 'Closing balance', 'Audit Category', 'Remarks', 'Sample Selected?'])
  const sel = {}; Object.entries(result.categories).forEach(([cat, c]) => c.rows.forEach((r) => { sel[r._i] = r.selected }))
  items.forEach((p, i) => { const k = i + 2; led.addRow([p.code || '', p.name, p.debit ?? 0, p.credit ?? 0, { formula: `C${k}-D${k}` }, { formula: `IF(ABS(E${k})<Summary!$B$7,"Needs Review",IF(E${k}<0,"${inputs.customerLedger ? 'Advance from Customer' : 'Trade Payable'}","${inputs.customerLedger ? 'Trade Receivable' : 'Advance to Supplier'}"))` },
    { formula: `IF(F${k}="Needs Review","Nil or rounding balance – excluded from sampling",IF(ABS(E${k}-(C${k}-D${k}))>0.005,"Closing balance does not equal Debits − Credits",""))` }, p.category === 'Needs Review' ? '-' : sel[i] ? 'Yes' : 'No']); led.getCell(k, 5).numFmt = NUM; if (sel[i]) led.getRow(k).eachCell((c) => { c.fill = YELLOW }) })
  led.addRow([]); led.addRow(['Columns F–H were added; columns A–E are unchanged.']).font = { ...ARIAL, italic: true }
  style(led, [14, 36, 18, 18, 18, 24, 44, 16])
  const sm = wb.addWorksheet('Summary')
  ;[['Audit sampling – AR / AP / Advances' + (client ? ' – ' + client : ''), ''], ['Financial year-end', inputs.yearEnd || 'Not provided – please enter'], ['Audit start date', inputs.auditStart || 'Not provided – please enter'], ['Current date', inputs.today || ''], ['Sample %', inputs.pct], ['', ''], ['Nil-balance tolerance', inputs.tolerance]].forEach((r, i) => { sm.getCell(i + 1, 1).value = r[0]; if (r[1] !== '') sm.getCell(i + 1, 2).value = r[1] })
  sm.getCell('B5').numFmt = '0%'
  ;['B2', 'B3', 'B4', 'B7'].forEach((a) => { sm.getCell(a).fill = GREEN_IN })
  sm.addRow([]); sm.addRow(['Category', 'No. of items', 'Net balance (Dr − Cr)', 'Absolute total', 'Sample target', 'Sample amount', '% coverage', 'Items selected']).eachCell((c) => { c.fill = HEAD; c.font = { ...ARIAL, bold: true } })
  const cats = Object.keys(result.categories); const startRow = sm.rowCount + 1
  cats.forEach((cat, i) => { const r = startRow + i; const sn = `'Sample - ${cat}'`
    sm.addRow([cat, { formula: `COUNTIF(Sheet1!$F$2:$F$${items.length + 1},A${r})` }, { formula: `SUMIF(Sheet1!$F$2:$F$${items.length + 1},A${r},Sheet1!$E$2:$E$${items.length + 1})` }, { formula: `${sn}!B4` }, { formula: `${sn}!B5` }, { formula: `${sn}!B6` }, { formula: `${sn}!B7` }, { formula: `${sn}!B8` }]) })
  const nr = startRow + cats.length
  sm.addRow(['Needs Review', { formula: `COUNTIF(Sheet1!$F$2:$F$${items.length + 1},"Needs Review")` }, { formula: `SUMIF(Sheet1!$F$2:$F$${items.length + 1},"Needs Review",Sheet1!$E$2:$E$${items.length + 1})` }])
  sm.addRow(['Total', { formula: `SUM(B${startRow}:B${nr})` }, { formula: `SUM(C${startRow}:C${nr})` }, { formula: `SUM(D${startRow}:D${nr})` }, { formula: `SUM(E${startRow}:E${nr})` }, { formula: `SUM(F${startRow}:F${nr})` }, '', { formula: `SUM(H${startRow}:H${nr})` }]).font = { ...ARIAL, bold: true }
  sm.addRow([]); sm.addRow(['Reconciliation to the ledger']).font = { ...ARIAL, bold: true }
  sm.addRow(['Grand total per the ledger', { formula: `SUM(Sheet1!E2:E${items.length + 1})` }]); sm.addRow(['Total per categories', { formula: `C${nr + 1}` }]); sm.addRow(['Difference', { formula: `B${nr + 5}-B${nr + 6}` }])
  sm.addRow(['Item count per the ledger', items.length]); sm.addRow(['Item count per categories', { formula: `B${nr + 1}` }]); sm.addRow(['Difference', { formula: `B${nr + 8}-B${nr + 9}` }])
  const noData = ['Trade Payable', 'Advance to Supplier', 'Trade Receivable', 'Advance from Customer'].filter((c) => !result.categories[c] && (inputs.customerLedger ? ['Trade Receivable', 'Advance from Customer'] : ['Trade Payable', 'Advance to Supplier']).includes(c))
  if (noData.length) sm.addRow(['Categories with no entries (no sheet created)', noData.join(', ')])
  for (let r = startRow; r <= sm.rowCount; r++) [3, 4, 5, 6].forEach((c) => { sm.getCell(r, c).numFmt = NUM }); for (let r = startRow; r < nr + 1; r++) sm.getCell(r, 7).numFmt = '0.00%'
  sm.getColumn(1).width = 40; for (let c = 2; c <= 8; c++) sm.getColumn(c).width = 20; sm.eachRow((r) => r.eachCell((c) => { c.font = { ...ARIAL, ...(c.font || {}) } }))
  // sample sheets
  cats.forEach((cat) => { const c = result.categories[cat]; const ws = wb.addWorksheet(`Sample - ${cat}`)
    const n = c.rows.length; const first = 12, last = first + n - 1
    ;[['Category', cat], ['', ''], ['Category total (absolute)', ''], ['', ''], ['', ''], ['', ''], ['', ''], ['', '']].forEach(() => {})
    ws.getCell('A1').value = cat; ws.getCell('A1').font = { ...ARIAL, bold: true }
    ws.getCell('A4').value = 'Category total (absolute)'; ws.getCell('B4').value = { formula: `SUM(C${first}:C${last})` }
    ws.getCell('A5').value = 'Target (total × sample %)'; ws.getCell('B5').value = { formula: 'B4*Summary!$B$5' }
    ws.getCell('A6').value = 'Amount covered'; ws.getCell('B6').value = { formula: `SUMIF(F${first}:F${last},"Yes",C${first}:C${last})` }
    ws.getCell('A7').value = '% coverage'; ws.getCell('B7').value = { formula: 'IF(B4=0,0,B6/B4)' }; ws.getCell('B7').numFmt = '0.00%'
    ws.getCell('A8').value = 'Items selected'; ws.getCell('B8').value = { formula: `COUNTIF(F${first}:F${last},"Yes")` }
    ws.getCell('A9').value = 'Items in population'; ws.getCell('B9').value = n
    ;['B4', 'B5', 'B6'].forEach((a) => { ws.getCell(a).numFmt = NUM })
    ws.getRow(11).values = ['S.No', 'Party', 'Balance (absolute)', '% of Total', 'Cumulative Amount', 'Selected (Yes/No)', 'Client Option']; ws.getRow(11).eachCell((x) => { x.fill = HEAD; x.font = { ...ARIAL, bold: true } })
    c.rows.forEach((r, i) => { const k = first + i; ws.getRow(k).values = [r.sNo, { formula: `Sheet1!B${r._i + 2}` }, { formula: `ABS(Sheet1!E${r._i + 2})` }, { formula: `IF($B$4=0,0,C${k}/$B$4)` }, { formula: `SUM(C$${first}:C${k})` }, { formula: `IF(SUM(C$${first}:C${k})-C${k}<$B$5,"Yes","No")` }, ''];
      ws.getCell(k, 3).numFmt = NUM; ws.getCell(k, 4).numFmt = '0.00%'; ws.getCell(k, 5).numFmt = NUM; ws.getCell(k, 7).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Confirmation,Alternative Procedures"'] }; ws.getCell(k, 7).fill = GREEN_IN; if (r.selected) for (let j = 1; j <= 6; j++) ws.getCell(k, j).fill = YELLOW })
    ws.columns.forEach((x, i) => { x.width = [30, 36, 20, 12, 20, 16, 24][i] || 16 }); ws.eachRow((r) => r.eachCell((x) => { x.font = { ...ARIAL, ...(x.font || {}) } })) })
  // trackers
  const tr = wb.addWorksheet('Confirmation Tracker'); tr.addRow(['Party', 'Category', 'Balance', 'Client Option', 'Date Sent', 'Date Received', 'Confirmed Balance', 'Difference', 'Status'])
  const alt = wb.addWorksheet('Alt Procedures Tracker')
  alt.getCell('A1').value = `SOA period: ${inputs.auditStart || 'Not provided'} to ${inputs.today || ''}   |   Year-end: ${inputs.yearEnd || 'Not provided'}`
  alt.addRow(['Party', 'Category', 'Closing Balance', 'Applicable?', 'SOA Obtained (Y/N)', 'Invoices / Supporting Docs Obtained (Y/N)', 'Payment or Receipt Copy Obtained (Y/N)', 'Subsequent Settlement', 'Unsettled Balance', 'Remarks'])
  let tk = 2; let ak = 3
  cats.forEach((cat) => { const c = result.categories[cat]; c.rows.filter((r) => r.selected).forEach((r) => {
    const sref = `'Sample - ${cat}'!G${12 + r.sNo - 1}`
    tr.addRow([r.name, cat, r.closing, { formula: `IF(${sref}="","",${sref})` }, null, null, null, { formula: `IF(G${tk}="","",G${tk}-C${tk})` }, null]); tr.getCell(tk, 3).numFmt = NUM; tr.getCell(tk, 5).numFmt = DATE; tr.getCell(tk, 6).numFmt = DATE; tr.getCell(tk, 8).numFmt = NUM
    tr.getCell(tk, 9).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Confirmed,Difference,Pending,No Reply"'] }; [5, 6, 7, 9].forEach((j) => { tr.getCell(tk, j).fill = GREEN_IN })
    alt.addRow([r.name, cat, r.closing, { formula: `IF('Confirmation Tracker'!D${tk}="","Select option",IF(OR('Confirmation Tracker'!D${tk}="Alternative Procedures",'Confirmation Tracker'!I${tk}="No Reply"),"Yes","No"))` }, null, null, null, null, { formula: `IF(H${ak}="","",C${ak}-H${ak})` }, null])
    alt.getCell(ak, 3).numFmt = NUM; alt.getCell(ak, 8).numFmt = NUM; alt.getCell(ak, 9).numFmt = NUM; [5, 6, 7].forEach((j) => { alt.getCell(ak, j).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Y,N"'] }; alt.getCell(ak, j).fill = GREEN_IN })
    tk++; ak++ }) })
  tr.addConditionalFormatting?.({ ref: `A2:I${Math.max(tk, 2)}`, rules: [{ type: 'expression', formulae: ['AND($D2<>"",$D2<>"Confirmation")'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD9D9D9' } } } }] })
  alt.addConditionalFormatting?.({ ref: `A3:J${Math.max(ak, 3)}`, rules: [{ type: 'expression', formulae: ['$D3="No"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD9D9D9' } } } }] })
  style(tr, [34, 24, 16, 22, 12, 14, 18, 14, 14]); style(alt, [34, 24, 16, 16, 14, 24, 24, 18, 18, 30])
  alt.getRow(2).eachCell((c) => { c.fill = HEAD; c.font = { ...ARIAL, bold: true } }); alt.getRow(1).fill = undefined
  alt.getCell(`A${ak + 1}`).value = 'Documents to obtain'; alt.getCell(`A${ak + 1}`).font = { ...ARIAL, bold: true }
  alt.getCell(`A${ak + 2}`).value = 'Trade Payable: SOA, invoices supporting the year-end balance, and payment copies after year-end.'
  alt.getCell(`A${ak + 3}`).value = 'Advance to Supplier: SOA, advance payment vouchers or POs, invoices of later adjustment, and payment copies after year-end.'
  reorder([led, sm, ...cats.map((c) => wb.getWorksheet(`Sample - ${c}`)), tr, alt])
  return wb
}

// ── ABCPA materiality workbook: Testing, Above, Below, Excluded ────────────
export async function buildMaterialityWorkbook({ items, params, result, area, client = '', revenue = null, materialityCalc = null }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const t = wb.addWorksheet(`${area} Testing`)
  const L = [['Test area', area], ['Revenue', revenue], ['Materiality % (of revenue)', materialityCalc?.pct ?? null], ['Calculated materiality', materialityCalc?.calculated ?? null], ['Materiality used for sampling (80%)', { formula: 'E8*0.8' }],
    ['Risk level', params.risk], ['Entity size', params.size], ['Sample size override (optional)', params.override ?? null]]
  // value cells in column E, as in the Rule Book layout
  t.getCell('C1').value = `${area} testing – materiality method${client ? ' – ' + client : ''}`; t.getCell('C1').font = { ...ARIAL, bold: true }
  t.getCell('C5').value = 'Test area'; t.getCell('E5').value = area
  t.getCell('C6').value = 'Revenue'; t.getCell('E6').value = revenue
  t.getCell('C7').value = 'Materiality % (of revenue)'; t.getCell('E7').value = materialityCalc ? materialityCalc.pct / 100 : null; t.getCell('E7').numFmt = '0.00%'
  t.getCell('C8').value = 'Calculated materiality'; t.getCell('E8').value = materialityCalc ? { formula: 'IF(E6="","",E6*E7)' } : null
  t.getCell('C9').value = 'Materiality used for sampling'; t.getCell('E9').value = materialityCalc ? { formula: 'E8*0.8' } : result.materiality
  t.getCell('C10').value = 'Risk level'; t.getCell('E10').value = params.risk; t.getCell('E10').dataValidation = { type: 'list', formulae: ['"Significant (4),Moderate (3),Low to Moderate (2),Low (1)"'] }
  t.getCell('C11').value = 'Entity size'; t.getCell('E11').value = params.size; t.getCell('E11').dataValidation = { type: 'list', formulae: ['"Small,Medium,Large"'] }
  t.getCell('C12').value = 'Sample size override (optional)'; t.getCell('E12').value = params.override ?? null
  ;['E6', 'E7', 'E10', 'E11', 'E12'].forEach((a) => { t.getCell(a).fill = GREEN_IN })
  t.getCell('C16').value = 'Remaining population (below materiality)'; t.getCell('E16').value = result.remaining
  t.getCell('C17').value = 'Planning materiality'; t.getCell('E17').value = { formula: 'E9' }
  t.getCell('C18').value = 'Confidence factor'; t.getCell('E18').value = { formula: 'IF(E10="Low (1)",0.25,IF(E10="Low to Moderate (2)",0.5,IF(E10="Moderate (3)",0.75,IF(E10="Significant (4)",0.999999,0.00001))))' }
  t.getCell('C19').value = 'Sampling interval'; t.getCell('E19').value = { formula: 'IFERROR(E17/E18,0)' }
  t.getCell('C20').value = 'Calculated sample size'; t.getCell('E20').value = { formula: 'IFERROR(ROUND(E16/E19,0),0)' }
  t.getCell('C21').value = 'Maximum sample size'; t.getCell('E21').value = { formula: 'INDEX($J$17:$L$20,MATCH(E10,$I$17:$I$20,0),MATCH(E11,$J$16:$L$16,0))' }
  t.getCell('C22').value = 'Sample size per template'; t.getCell('E22').value = { formula: 'MIN(E20,E21)' }
  t.getCell('C23').value = 'Sample size used'; t.getCell('E23').value = { formula: 'IF(E12<>"",E12,E22)' }
  ;['Small', 'Medium', 'Large'].forEach((s, j) => { t.getCell(16, 10 + j).value = s })
  Object.entries(MAX_SAMPLE).forEach(([risk, v], i) => { t.getCell(17 + i, 9).value = risk; ['Small', 'Medium', 'Large'].forEach((s, j) => { t.getCell(17 + i, 10 + j).value = v[s] }) })
  t.getCell('I15').value = 'Maximum sample size table (732 template)'
  t.getCell('C26').value = 'Total ledger transactions'; t.getCell('E26').value = items.length
  t.getCell('C28').value = 'Excluded lines'; t.getCell('E28').value = result.excludedCount
  t.getCell('C29').value = 'Excluded lines – value'; t.getCell('E29').value = result.excludedValue
  t.getCell('C31').value = 'Above materiality – items'; t.getCell('E31').value = result.above.length
  t.getCell('C32').value = 'Above materiality – value'; t.getCell('E32').value = result.aboveValue
  t.getCell('C33').value = 'Below materiality – population'; t.getCell('E33').value = result.belowPopulation
  t.getCell('C34').value = 'Below materiality – value'; t.getCell('E34').value = { formula: 'E16' }
  t.getCell('C35').value = 'Sample size used'; t.getCell('E35').value = { formula: 'E23' }
  t.getCell('C36').value = 'Random samples selected'; t.getCell('E36').value = { formula: 'MIN(E35,E33)' }
  t.getCell('C37').value = 'Eligible items not selected'; t.getCell('E37').value = { formula: 'E33-E36' }
  t.getCell('C42').value = 'Validation checks'; t.getCell('C42').font = { ...ARIAL, bold: true }
  result.checks.forEach((c, i) => { t.getCell(43 + i, 3).value = c.check; t.getCell(43 + i, 5).value = c.pass ? 'Pass' : c.review ? 'Review' : 'Fail' })
  t.getCell('C50').value = `Random numbers were generated with the stored seed ${params.seed}, so the sample can be reproduced. An item equal to materiality counts as below materiality.`
  t.getColumn(3).width = 44; t.getColumn(5).width = 20; t.getColumn(9).width = 22; t.eachRow((r) => r.eachCell((c) => { c.font = { ...ARIAL, ...(c.font || {}) } }))
  ;['E6', 'E8', 'E9', 'E16', 'E17', 'E19', 'E29', 'E32', 'E34'].forEach((a) => { t.getCell(a).numFmt = NUM })
  const list = (name, rows, banner, basis) => {
    const ws = wb.addWorksheet(name); ws.getCell('A1').value = banner; ws.getCell('A1').font = { ...ARIAL, bold: true }; ws.getCell('A1').fill = banner.startsWith('Above') ? fill('FFC6E0B4') : fill('FFF8CBAD')
    ws.getCell('A2').value = `${rows.length} item(s)`
    ws.getRow(4).values = ['Sample No.', 'Date', 'Ledger / Account', 'Description', 'Original Amount', 'Absolute Amount', 'Materiality', 'Selection Basis', 'Source row', 'Voucher Ref', 'Test result', 'Comments']; ws.getRow(4).eachCell((c) => { c.fill = HEAD; c.font = { ...ARIAL, bold: true } })
    rows.forEach((r, i) => { const k = 5 + i; ws.getRow(k).values = [i + 1, r.date || null, r.account || '', r.description || '', r.amount, { formula: `ABS(E${k})` }, { formula: `'${area} Testing'!$E$9` }, basis, r.sourceRow ?? '', r.ref || '', '', '']; ws.getCell(k, 2).numFmt = DATE; ;[5, 6, 7].forEach((j) => { ws.getCell(k, j).numFmt = NUM }); ws.getCell(k, 11).fill = YELLOW; ws.getCell(k, 12).fill = YELLOW })
    ws.columns.forEach((c, i) => { c.width = [11, 12, 28, 40, 16, 16, 14, 34, 11, 16, 16, 30][i] }); ws.eachRow((r) => r.eachCell((c) => { c.font = { ...ARIAL, ...(c.font || {}) } })); ws.views = [{ state: 'frozen', ySplit: 4 }]
    return ws }
  list(`${area} Above`, result.above, `Above materiality – every item selected (${area})`, 'Above materiality – automatically selected')
  list(`${area} Below`, result.below, `Below materiality – randomly selected (${area})`, params.method === 'highest' ? 'Below materiality – highest value' : 'Below materiality – randomly selected')
  const ex = items.map((x, i) => ({ ...x, _i: i })).filter((x) => x.excluded)
  if (ex.length) sheetWith(wb, 'Excluded lines', ['Source row', 'Account', 'Description', 'Amount'], ex.map((x) => [x.sourceRow ?? '', x.account, x.description || '', x.amount]), [11, 30, 40, 16], { 4: NUM })
  return wb
}
export { sampleByMateriality, CONFIDENCE }
