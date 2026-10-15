// Process 3.5 Excel output for prepaid expenses and depreciation. Every figure is a live formula.
import { loadExcelJS } from './eosbExcel.js'
import { DEP_CLASSES, EXTRA_CLASSES, depSchedule, depReview, depChecks, adjustingEntry } from './prepaidDep.js'

const TNR = { name: 'Times New Roman', size: 11 }
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const NAVY = fill('FF002060'), PALE = fill('FFDDEBF7'), AMBER = fill('FFFFE699'), GREEN = fill('FFC6E0B4'), RED = fill('FFF4B6B6')
const ACC = '_ * #,##0.00_ ;_ * \\-#,##0.00_ ;_ * "-"??_ ;_ @'
const ACC2 = '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)'
const BLUE = { ...TNR, color: { argb: 'FF0000FF' } }
const D = (iso) => (iso ? new Date(`${iso}T00:00:00Z`) : null)
const white = { ...TNR, bold: true, color: { argb: 'FFFFFFFF' } }
const dm = (iso) => iso.split('-').reverse().join('/')

// ── Prepaid ──────────────────────────────────────────────────────────────
export async function buildPrepaidWorkbook({ byCategory, yearStart, yearEnd, vatMode = 'WITHOUT VAT', client = '', notes = [] }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const sm = wb.addWorksheet('Summary'); const sheets = []
  for (const [cat, s] of Object.entries(byCategory)) {
    const ws = wb.addWorksheet(cat.replace(/[\\/*?:[\]]/g, ' ').slice(0, 31)); sheets.push({ cat, ws, s })
    const cols = 15
    ws.mergeCells(1, 1, 1, cols); ws.getCell('A1').value = `Prepaid ${cat} Calculation – ${dm(yearStart)} to ${dm(yearEnd)} – ${vatMode}`; ws.getCell('A1').fill = NAVY; ws.getCell('A1').font = white; ws.getCell('A1').alignment = { horizontal: 'center' }
    ws.getCell('B2').value = 'Accounting Period:'; ws.getCell('D2').value = D(yearStart); ws.getCell('E2').value = 'To'; ws.getCell('F2').value = D(yearEnd); ws.getCell('H2').value = 'Basis:'; ws.getCell('I2').value = vatMode; ws.getCell('I2').font = { ...TNR, bold: true, color: { argb: 'FFFF0000' } }
    ws.getCell('I2').note = vatMode === 'WITHOUT VAT' ? 'Prepaid is calculated on amounts excluding VAT (VAT-registered client, input VAT recoverable).' : 'Client not VAT-registered or VAT non-recoverable: prepaid on VAT-inclusive amounts.'
    ;['D2', 'F2'].forEach((a) => { ws.getCell(a).numFmt = 'mm-dd-yy' })
    ws.getRow(3).values = ['SL No:-', 'Particulars / Policy Number', 'Amount (excl. VAT)', 'Start Date', 'End Date', 'Opening Prepaid Amount', `Paid During ${yearEnd.slice(0, 4)}`, `Expense for ${yearEnd.slice(0, 4)}`, 'Prepaid Amount', 'VAT Treatment (WITH VAT / WITHOUT VAT)', 'VAT %', 'VAT Amount', 'Total Incl. VAT', 'Total Days in Period', 'Prepaid Days (after year-end)']
    ws.getRow(3).height = 42.75; ws.getRow(3).eachCell((c) => { c.fill = NAVY; c.font = white; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } })
    s.rows.forEach((r, i) => { const k = 4 + i
      ws.getRow(k).values = [i + 1, r.particulars, r.error ? null : Number(r.amount), D(r.start), D(r.end), Number(r.opening) || 0, Number(r.paid) || 0,
        { formula: `F${k}+G${k}-I${k}` }, { formula: `MAX(0,(C${k}/(E${k}-D${k}+1))*(E${k}-$F$2))` }, Number(r.vatPct) > 0 ? 'WITH VAT' : 'WITHOUT VAT', (Number(r.vatPct) || 0) / 100, { formula: `ROUND(C${k}*K${k},2)` }, { formula: `C${k}+L${k}` }, { formula: `E${k}-D${k}+1` }, { formula: `MAX(0,E${k}-$F$2)` }]
      ;[3, 6, 7, 8, 9, 12, 13].forEach((j) => { ws.getCell(k, j).numFmt = ACC }); ws.getCell(k, 4).numFmt = 'mm-dd-yy'; ws.getCell(k, 5).numFmt = 'mm-dd-yy'; ws.getCell(k, 11).numFmt = '0%'
      ;[2, 3, 4, 5, 6, 7, 11].forEach((j) => { ws.getCell(k, j).font = BLUE })
      if (r.source) ws.getCell(k, 2).note = r.source
      if (r.error) { ws.getRow(k).eachCell({ includeEmpty: true }, (c) => { c.fill = AMBER }); ws.getCell(k, 16).value = r.error } })
    const last = 3 + Math.max(s.rows.length, 1); const tot = last + 1
    ws.getCell(`B${tot}`).value = 'Total'; ;['C', 'F', 'G', 'H', 'I', 'L', 'M'].forEach((L) => { ws.getCell(`${L}${tot}`).value = { formula: `SUM(${L}4:${L}${last})` }; ws.getCell(`${L}${tot}`).numFmt = ACC })
    ws.getRow(tot).eachCell({ includeEmpty: true }, (c) => { c.fill = NAVY; c.font = white })
    ws.getCell(`B${tot + 1}`).value = 'Check: F+G-H-I'; ws.getCell(`C${tot + 1}`).value = { formula: `ROUND(F${tot}+G${tot}-H${tot}-I${tot},2)` }; ws.getCell(`C${tot + 1}`).numFmt = ACC
    ws.getCell(`B${tot + 3}`).value = 'Notes / Source documents'; ws.getCell(`B${tot + 3}`).font = { ...TNR, bold: true }
    s.rows.forEach((r, i) => { ws.getCell(`B${tot + 4 + i}`).value = `${i + 1}. ${r.particulars || ''}${r.source ? ' – ' + r.source : ''}` })
    ws.getRow(1).height = 20; ws.columns.forEach((c, i) => { c.width = [8, 36, 16, 12, 12, 16, 16, 16, 16, 18, 8, 14, 16, 12, 14, 40][i] || 14 })
    ws.eachRow((r) => r.eachCell((c) => { c.font = { ...TNR, ...(c.font || {}) } }))
    s.totRow = tot
  }
  // Summary sheet (first), linked to each sheet's total row
  sm.mergeCells(1, 1, 1, 9); sm.getCell('A1').value = `Prepaid Expenses Summary${client ? ' – ' + client : ''} – ${dm(yearStart)} to ${dm(yearEnd)}`; sm.getCell('A1').fill = NAVY; sm.getCell('A1').font = white; sm.getCell('A1').alignment = { horizontal: 'center' }
  sm.getRow(3).values = ['Category', 'Amount', 'No. of Items', 'Opening Prepaid', `Paid During ${yearEnd.slice(0, 4)}`, `Expense for ${yearEnd.slice(0, 4)}`, 'Prepaid', 'VAT Amount', 'Total Incl. VAT']; sm.getRow(3).eachCell((c) => { c.fill = NAVY; c.font = white; c.alignment = { horizontal: 'center', wrapText: true } })
  sheets.forEach(({ ws, s }, i) => { const k = 4 + i; const q = `'${ws.name}'`; sm.getRow(k).values = [ws.name, { formula: `${q}!C${s.totRow}` }, s.rows.length, { formula: `${q}!F${s.totRow}` }, { formula: `${q}!G${s.totRow}` }, { formula: `${q}!H${s.totRow}` }, { formula: `${q}!I${s.totRow}` }, { formula: `${q}!L${s.totRow}` }, { formula: `${q}!M${s.totRow}` }]; sm.getRow(k).eachCell((c, j) => { if (j > 1) c.font = { ...TNR, color: { argb: 'FF00B050' } } }) })
  const gt = 4 + sheets.length; sm.getCell(`A${gt}`).value = 'Grand total'; ;['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((L) => { sm.getCell(`${L}${gt}`).value = { formula: `SUM(${L}4:${L}${gt - 1})` } }); sm.getRow(gt).eachCell({ includeEmpty: true }, (c) => { c.fill = NAVY; c.font = white })
  for (let r = 4; r <= gt; r++) for (let j = 2; j <= 9; j++) if (j !== 3) sm.getCell(r, j).numFmt = ACC
  const ae = adjustingEntry(byCategory)
  sm.getCell(`A${gt + 2}`).value = 'Proposed adjusting entry at year-end'; sm.getCell(`A${gt + 2}`).font = { ...TNR, bold: true }
  sm.getCell(`A${gt + 3}`).value = 'Dr Prepaid Expenses'; sm.getCell(`B${gt + 3}`).value = { formula: `G${gt}` }
  sheets.forEach(({ ws }, i) => { sm.getCell(`A${gt + 4 + i}`).value = `   Cr ${ws.name} expense`; sm.getCell(`B${gt + 4 + i}`).value = { formula: `G${4 + i}` } })
  for (let r = gt + 3; r <= gt + 3 + sheets.length; r++) sm.getCell(r, 2).numFmt = ACC
  const nr = gt + 5 + sheets.length
  ;['Basis: prepaid = amount excl. VAT ÷ total days × days after year-end; expense = opening + paid − prepaid.', 'Colour legend: blue = inputs from documents, black = formulas, green = links to other sheets.', 'Opening prepaid balances come from the prior-year schedule where provided.', ...notes].forEach((n, i) => { sm.getCell(`A${nr + i}`).value = n })
  sm.columns.forEach((c, i) => { c.width = i === 0 ? 40 : 16 }); sm.eachRow((r) => r.eachCell((c) => { c.font = { ...TNR, ...(c.font || {}) } }))
  wb.worksheets.forEach((w) => { w.orderNo = w === sm ? 0 : sheets.findIndex((x) => x.ws === w) + 1 })
  return wb
}

// ── Depreciation ─────────────────────────────────────────────────────────
// assets: [{cls, name, date, rate, opening, addition, disposal, openingAcc, onDisposal}] ; the template layout is reproduced.
export async function buildDepreciationWorkbook({ assets, yearStart, yearEnd, priorStart, priorEnd, adjustments = {}, classes = [...DEP_CLASSES], useTemplateMethod = true, client = '' }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Depreciation ', { pageSetup: { paperSize: 9, orientation: 'portrait' }, views: [{ zoomScale: 55 }] })
  const ye = yearEnd.split('-').reverse().join('.')
  ws.getCell('B2').value = 'Depreciation Schedule'; ws.getCell('F2').value = D(yearStart); ws.getCell('H2').value = 'Year end'; ws.getCell('I2').value = D(yearEnd); ws.getCell('K2').value = D(priorStart); ws.getCell('L2').value = D(priorEnd)
  ;['B2', 'F2', 'H2', 'I2', 'K2', 'L2'].forEach((a) => { ws.getCell(a).font = { ...TNR, bold: true } }); ;['F2', 'I2', 'K2', 'L2'].forEach((a) => { ws.getCell(a).numFmt = 'mm-dd-yy' })
  const heads = ['Purchase Date', 'Asset ', 'Depreciation Rate', 'Opening Cost', 'Addition', 'Disposal', 'Closing Cost', 'Opening Acc. Depreciation', 'Current period Depreciation', 'On disposal', `Closing Acc. depreciation - ${ye}`, 'Opening WDV - SAR', `Closing WDV -  ${ye}`]
  const header = (r) => { ws.getRow(r).values = heads; ws.getRow(r).height = 42.75; ws.getRow(r).eachCell((c) => { c.fill = NAVY; c.font = white; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } } }) }
  header(3)
  let r = 4; const assetRows = []; const thin = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  const classList = [...classes]; assets.forEach((a) => { if (!classList.some((c) => c.name === a.cls)) { const ex = EXTRA_CLASSES.find((e) => e.name === a.cls); if (ex) classList.push({ no: classList.length + 1, name: ex.name, rate: ex.rate }) } })
  classList.forEach((c, ci) => {
    const list = assets.filter((a) => a.cls === c.name); ws.getCell(r, 1).value = c.no; ws.getCell(r, 1).numFmt = '0'; ws.getCell(r, 2).value = c.name
    for (let j = 1; j <= 13; j++) { const x = ws.getCell(r, j); x.font = { ...TNR, bold: true }; x.fill = PALE; x.border = thin; if (j === 1) x.alignment = { horizontal: 'center' }; if (j === 2) x.alignment = { horizontal: 'left', wrapText: true } }
    if (ci === 0) ws.getRow(r).height = 28.5; r++
    list.forEach((a) => { const k = r; const isAdd = (Number(a.addition) || 0) > 0 && !(Number(a.opening) > 0)
      ws.getRow(k).values = [D(a.date), a.name, Number(a.rate) || 0, Number(a.opening) || 0, Number(a.addition) || 0, Number(a.disposal) || 0, { formula: `D${k}+E${k}-F${k}` }, Number(a.openingAcc) || 0,
        isAdd ? { formula: `G${k}*C${k}*(($I$2-A${k}+1)/365)` } : { formula: `G${k}*C${k}` }, Number(a.onDisposal) || 0, { formula: `H${k}+I${k}-J${k}` }, { formula: `D${k}-H${k}` }, { formula: `G${k}-K${k}` }]
      for (let j = 1; j <= 13; j++) { const x = ws.getCell(k, j); x.font = TNR; x.border = thin; if (j >= 4) x.numFmt = ACC2 }
      ws.getCell(k, 1).numFmt = 'mm-dd-yy'; ws.getCell(k, 1).alignment = { horizontal: 'center' }; ws.getCell(k, 2).alignment = { horizontal: 'left', wrapText: true }; ws.getCell(k, 3).numFmt = '0%'; ws.getCell(k, 3).alignment = { horizontal: 'center' }
      if (a.flag) { ws.getCell(k, 14).value = a.flag; ws.getCell(k, 14).font = { ...TNR, bold: true, color: { argb: 'FFFF0000' } } }
      assetRows.push(k); r++ })
  })
  const first = 4, lastRow = r - 1; ws.getRow(r).height = 15.75
  ws.mergeCells(r, 2, r, 3); ws.getCell(r, 2).value = 'Total'; ws.getCell(r, 2).alignment = { horizontal: 'center' }
  for (let j = 4; j <= 13; j++) { const L = ws.getColumn(j).letter; ws.getCell(r, j).value = { formula: `SUM(${L}${first}:${L}${lastRow})` }; ws.getCell(r, j).numFmt = ACC2 }
  for (let j = 1; j <= 13; j++) { const x = ws.getCell(r, j); x.fill = NAVY; x.font = white; x.border = { bottom: { style: 'double' } } }
  ws.getCell('O6').value = 'Adjusted to Retained Earnings'; ws.getCell('P6').value = adjustments.retainedEarnings ?? null; ws.getCell('O7').value = 'TO ACC DEP'; ws.getCell('P7').value = adjustments.toAccDep ?? null
  ;['P6', 'P7'].forEach((a) => { ws.getCell(a).numFmt = ACC2 })
  ;[12, 29.43, 13.71, 11.43, 13, 12.86, 20.43, 15.14, 16.71, 11.86, 14, 15.14, 13.43, 44.57, 28, 9.14].forEach((w, i) => { ws.getColumn(i + 1).width = w })
  ws.eachRow((row) => row.eachCell((c) => { c.font = { ...TNR, ...(c.font || {}) } }))
  // Verification and review notes
  const sched = depSchedule(assets, yearEnd, { yearStart }); const checks = depChecks(sched.rows, sched.totals); const notes = depReview(sched.rows, classList)
  const v = wb.addWorksheet('Verification'); v.getRow(1).values = ['Asset', 'Class', 'Cost (closing)', 'Rate', 'Days held', 'Independent charge', 'Schedule charge', 'Difference', 'Result']; v.getRow(1).eachCell((c) => { c.fill = NAVY; c.font = white })
  sched.rows.forEach((x, i) => { const k = 2 + i; const rowRef = assetRows[i]; v.getRow(k).values = [x.name, x.cls, x.G, x.rate, x.days, x.I, { formula: `'Depreciation '!I${rowRef}` }, { formula: `ROUND(G${k}-F${k},2)` }, { formula: `IF(ABS(H${k})<0.01,"OK","CHECK")` }]; v.getCell(k, 3).numFmt = ACC2; v.getCell(k, 4).numFmt = '0%'; v.getCell(k, 6).numFmt = ACC2; v.getCell(k, 7).numFmt = ACC2 })
  const vk = 3 + sched.rows.length; v.getCell(`A${vk}`).value = 'Integrity checks'; v.getCell(`A${vk}`).font = { ...TNR, bold: true }
  checks.forEach((c, i) => { v.getCell(`A${vk + 1 + i}`).value = c.check; v.getCell(`B${vk + 1 + i}`).value = c.ok ? 'OK' : 'CHECK'; v.getCell(`B${vk + 1 + i}`).fill = c.ok ? GREEN : RED })
  v.getCell(`A${vk + 7}`).value = `Method switch: ${useTemplateMethod ? 'template method (days ÷ 365, inclusive)' : 'evidence method'}. Additions are pro-rated from the date available for use to the year end, inclusive, divided by 365.`
  v.columns.forEach((c, i) => { c.width = [34, 30, 16, 10, 10, 18, 18, 14, 10][i] }); v.eachRow((row) => row.eachCell((c) => { c.font = { ...TNR, ...(c.font || {}) } }))
  const rn = wb.addWorksheet('Review Notes'); rn.getRow(1).values = ['Item', 'Result', 'Finding', 'Action']; rn.getRow(1).eachCell((c) => { c.fill = NAVY; c.font = white })
  if (!notes.length) rn.addRow(['All items', 'Agrees', 'No rate differences, missing classes or date problems were found.', ''])
  notes.forEach((n) => rn.addRow([n.item, n.result, n.note, n.action])); rn.columns.forEach((c, i) => { c.width = [30, 14, 80, 40][i] }); rn.eachRow((row) => row.eachCell((c) => { c.font = { ...TNR, ...(c.font || {}) } }))
  wb.worksheets.forEach((w, i) => { w.orderNo = i }); return wb
}
