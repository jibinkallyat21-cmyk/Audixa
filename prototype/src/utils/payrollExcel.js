// Process 3.5 Excel I/O for payroll: reads client salary schedules, writes the Salary Schedule workbook, GOSI and EOSB sheets.
import { loadExcelJS } from './eosbExcel.js'
import { suggestMapping, STD, monthLabel, norm } from './salary.js'

const TNR = { name: 'Times New Roman', size: 11 }
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const NAVY = fill('FF002060'), YELLOW = fill('FFFFFF99'), RED = fill('FFF4B6B6'), GREEN = fill('FFC6E0B4'), AMBER = fill('FFFFE699')
const ACC = '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)'
const statusFill = (s) => (s === 'MATCHED' || s === 'READY FOR AUDITOR' ? GREEN : s === 'NOT MATCHED' ? RED : AMBER)
const cellValue = (c) => { const v = c?.value; if (v === null || v === undefined) return null; if (typeof v === 'object' && !(v instanceof Date)) { if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join(''); if ('result' in v) return v.result ?? null; if ('text' in v) return v.text; return String(v) } return v }
const styleAll = (ws, widths) => { widths?.forEach((w, i) => { ws.getColumn(i + 1).width = w }); ws.eachRow((r) => r.eachCell((c) => { c.font = { ...TNR, ...(c.font || {}) } })) }
const headStyle = (row) => row.eachCell((c) => { c.fill = NAVY; c.font = { ...TNR, bold: true, color: { argb: 'FFFFFFFF' } }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } })

// One source per worksheet that looks like a schedule. File ids are F1, F2 … in upload order.
export async function readScheduleWorkbook(arrayBuffer, fileName, fileId) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(arrayBuffer); const out = []
  for (const ws of wb.worksheets) {
    let best = null
    for (let r = 1; r <= Math.min(25, ws.rowCount); r++) {
      const row = ws.getRow(r); const headers = Array.from({ length: ws.columnCount }, (_, i) => { const v = cellValue(row.getCell(i + 1)); return v === null ? '' : String(v).trim() })
      const m = suggestMapping(headers.filter(Boolean)); const hits = Object.values(m).filter(Boolean).length
      if (!best || hits > best.hits) best = { hits, headerRow: r, headers }
    }
    if (!best || best.hits < 3) continue
    const rows = []
    for (let r = best.headerRow + 1; r <= ws.rowCount; r++) { const row = ws.getRow(r); const values = {}; let any = false; best.headers.forEach((h, i) => { if (!h) return; const v = cellValue(row.getCell(i + 1)); values[h] = v; if (v !== null && String(v).trim() !== '') any = true }); if (any) rows.push({ sourceRow: r, values }) }
    const headers = best.headers.filter(Boolean)
    out.push({ fileId, fileName, sheetName: ws.name, headers, rows, mapping: suggestMapping(headers), headerRow: best.headerRow })
  }
  return out
}
export async function readBillWorkbook(arrayBuffer, aliases) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(arrayBuffer); const ws = wb.worksheets[0]; if (!ws) return []
  let best = null
  for (let r = 1; r <= Math.min(25, ws.rowCount); r++) { const row = ws.getRow(r); const headers = Array.from({ length: ws.columnCount }, (_, i) => { const v = cellValue(row.getCell(i + 1)); return v === null ? '' : String(v).trim() }); const hits = headers.filter((h) => Object.values(aliases).some((al) => al.includes(norm(h)))).length; if (!best || hits > best.hits) best = { hits, headerRow: r, headers } }
  const idx = {}; for (const [k, al] of Object.entries(aliases)) idx[k] = best.headers.findIndex((h) => al.includes(norm(h)))
  const rows = []
  for (let r = best.headerRow + 1; r <= ws.rowCount; r++) { const row = ws.getRow(r); const o = { sourceRow: r }; let any = false; for (const [k, i] of Object.entries(idx)) { o[k] = i >= 0 ? cellValue(row.getCell(i + 1)) : null; if (o[k] !== null && o[k] !== '') any = true } if (any) rows.push(o) }
  return rows
}

// ── Salary schedule workbook (format file columns, formulas live) ──────────
export async function buildSalaryWorkbook({ built, totals, recon, tb, control, calc, completenessResult, sourceRecon, status, final, client = '', basis = 'total', period = {} }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const am = wb.addWorksheet('All Months')
  const headers = ['Iqaama Id', 'Employee Name', 'BASIC SALARY ', ' HOUSING ALLOWANCE ', ' TRANSPORT ALLOWANCE ', ' FOOD ALLOWANCE ', ' OTHER ALLOWANCE ', 'LEAVE SALARY ', 'ABSENCE', 'TOTAL SALARY', 'ADVANCE DEDUCTION ', 'LOAN DEDUCTION ', 'OTHER DEDUCTION ', 'NET PAYABLE', 'MONTH']
  am.getRow(1).values = headers; headStyle(am.getRow(1)); am.getRow(1).height = 32
  const recs = [...built.records].sort((a, b) => (a.month || '9').localeCompare(b.month || '9') || (a.name || '').localeCompare(b.name || ''))
  const rowOf = new Map()
  recs.forEach((r, i) => { const k = i + 2; rowOf.set(r, k)
    am.getRow(k).values = [r.iqama || null, r.name || null, r.basic, r.housing, r.transport, r.food, r.other, r.leave, r.absence, { formula: `SUM(C${k}:I${k})` }, r.advance, r.loan, r.otherDed, { formula: `SUM(J${k}:M${k})` }, r.month ? monthLabel(r.month) : 'REVIEW REQUIRED']
    for (let j = 3; j <= 14; j++) am.getCell(k, j).numFmt = ACC
    if (!r.month || !r.iqama || !r.name) am.getRow(k).eachCell({ includeEmpty: true }, (c) => { c.fill = YELLOW }) })
  const last = recs.length + 1; const tr = last + 1
  am.getCell(`B${tr}`).value = 'Total'; for (let j = 3; j <= 14; j++) { const L = am.getColumn(j).letter; am.getCell(tr, j).value = { formula: `SUM(${L}2:${L}${last})` }; am.getCell(tr, j).numFmt = ACC }
  am.getRow(tr).eachCell({ includeEmpty: true }, (c) => { c.fill = NAVY; c.font = { ...TNR, bold: true, color: { argb: 'FFFFFFFF' } } })
  styleAll(am, [14, 30, 14, 14, 14, 14, 14, 12, 12, 14, 14, 14, 14, 14, 12]); headStyle(am.getRow(1)); am.views = [{ state: 'frozen', ySplit: 1 }]
  // TB reconciliation (formulas read All Months)
  const tbs = wb.addWorksheet('TB Reconciliation'); tbs.getCell('A1').value = `Reconciliation to TB Salary – amount basis: ${basis === 'net' ? 'Net Payable' : 'Total Salary'} (to be confirmed by the reviewer)`; tbs.getCell('A1').font = { ...TNR, bold: true }
  tbs.getRow(3).values = ['Month', 'Schedule Salary', 'TB Salary', 'Difference', 'Status']; headStyle(tbs.getRow(3))
  const col = basis === 'net' ? 'N' : 'J'
  recon.monthly.forEach((m, i) => { const k = 4 + i; tbs.getRow(k).values = [monthLabel(m.month), { formula: `SUMIF('All Months'!$O$2:$O$${last},A${k},'All Months'!$${col}$2:$${col}$${last})` }, m.tb, { formula: `IF(C${k}="","",ROUND(B${k}-C${k},2))` }, { formula: `IF(C${k}="","REVIEW REQUIRED",IF(D${k}=0,"MATCHED","NOT MATCHED"))` }]; tbs.getCell(k, 2).numFmt = ACC; tbs.getCell(k, 3).numFmt = ACC; tbs.getCell(k, 4).numFmt = ACC; tbs.getCell(k, 3).fill = YELLOW })
  const tt = 4 + recon.monthly.length
  tbs.getRow(tt).values = ['Overall', { formula: `SUM(B4:B${tt - 1})` }, recon.tbTotal ?? null, { formula: `IF(C${tt}="","",ROUND(B${tt}-C${tt},2))` }, { formula: `IF(C${tt}="","REVIEW REQUIRED",IF(D${tt}=0,"MATCHED","NOT MATCHED"))` }]; tbs.getRow(tt).font = { ...TNR, bold: true }; ;[2, 3, 4].forEach((j) => { tbs.getCell(tt, j).numFmt = ACC })
  if (recon.cause) tbs.getCell(`A${tt + 2}`).value = recon.cause
  recon.notes.forEach((n, i) => { tbs.getCell(`A${tt + 3 + i}`).value = n })
  tbs.getCell(`A${tt + 5}`).value = 'No balancing entries were made and no salary data was changed to force a match. A missing TB month is not treated as zero.'
  styleAll(tbs, [16, 20, 20, 16, 20]); headStyle(tbs.getRow(3))
  // Validation / Exceptions
  const v = wb.addWorksheet('Validation - Exceptions'); v.getCell('A1').value = `Salary schedule validation${client ? ' – ' + client : ''}`; v.getCell('A1').font = { ...TNR, bold: true }
  v.getRow(3).values = ['Control item', 'Source', 'Value']; headStyle(v.getRow(3))
  ;[['Total salary', 'All Months', { formula: `'All Months'!J${tr}` }], ['Total earnings', 'All Months', { formula: `SUM('All Months'!C${tr}:H${tr})` }], ['Total deductions', 'All Months', { formula: `SUM('All Months'!I${tr},'All Months'!K${tr}:M${tr})` }], ['Total net salary', 'All Months', { formula: `'All Months'!N${tr}` }], ['Total TB Salary', 'TB', recon.tbTotal ?? 'Not provided'], ['Overall difference', 'Calculated', { formula: `IF(ISNUMBER(C8),ROUND(C4-C8,2),"")` }], ['Overall status', 'MATCHED / NOT MATCHED', recon.status]]
    .forEach((r, i) => { v.getRow(4 + i).values = r; v.getCell(4 + i, 3).numFmt = ACC })
  v.getCell('C10').fill = statusFill(recon.status)
  v.getCell('A12').value = 'Final status'; v.getCell('B12').value = final.status; v.getCell('B12').fill = statusFill(final.status); v.getCell('B12').font = { ...TNR, bold: true }
  final.blockers.forEach((b, i) => { v.getCell(`A${13 + i}`).value = b })
  let r0 = 14 + final.blockers.length
  const block = (title, head, rows, mapRow) => { v.getCell(`A${r0}`).value = title; v.getCell(`A${r0}`).font = { ...TNR, bold: true }; r0++; v.getRow(r0).values = head; headStyle(v.getRow(r0)); r0++; rows.forEach((x) => { v.getRow(r0).values = mapRow(x); r0++ }); if (!rows.length) { v.getCell(`A${r0}`).value = 'None'; r0++ } r0++ }
  block('Period completeness (expected months vs months received)', ['Month', 'Received', 'Schedules', 'Duplicate schedule'], completenessResult.matrix, (m) => [monthLabel(m.month), m.received ? 'Yes' : 'No – REVIEW REQUIRED', m.schedules, m.duplicateSchedule ? 'REVIEW REQUIRED' : ''])
  block('Source-to-All Months reconciliation', ['File', 'Sheet', 'Source rows', 'In All Months', 'Excluded', 'Row difference', 'Source net', 'All Months net', 'Net difference'], sourceRecon, (s) => [s.fileName, s.sheet, s.sourceRows, s.inAllMonths, s.excluded, s.rowDiff, s.sourceNet, s.allMonthsNet, s.netDiff])
  block('Consolidated exceptions log', ['Type', 'Employee', 'Month', 'Detail', 'Status', 'Source'], [...control, ...calc, ...(status?.exceptions || []), ...built.exceptions], (e) => [e.type, e.employee || '', e.month ? monthLabel(e.month) : '', e.detail, e.status, e.ref || e.fileId || ''])
  if (status) { block('Group A – left one day before the audit period start', ['Employee', 'Left date'], status.groupA, (g) => [g.employee, g.leaving]); block('Group B – left before or during the audit period', ['Employee', 'Left date', 'Also in Group A'], status.groupB, (g) => [g.employee, g.leaving, g.overlapA ? 'Yes' : '']) }
  styleAll(v, [38, 28, 30, 80, 20, 40, 14, 16, 14])
  // Supporting sheets
  const reg = wb.addWorksheet('Source Register'); reg.getRow(1).values = ['File ID', 'File name', 'Sheet', 'Rows']; headStyle(reg.getRow(1)); built.registry.forEach((x, i) => { reg.getRow(2 + i).values = [x.fileId, x.fileName, x.sheet, x.rows] }); styleAll(reg, [10, 40, 24, 10])
  const mp = wb.addWorksheet('Mapping Table'); mp.getRow(1).values = ['File', 'Client column', 'Standard column', 'Basis', 'Earning / Deduction']; headStyle(mp.getRow(1)); built.mappingTable.forEach((x, i) => { mp.getRow(2 + i).values = [x.fileId, x.client, x.standard, x.basis, x.type]; if (x.basis === 'Not mapped') mp.getRow(2 + i).eachCell((c) => { c.fill = YELLOW }) }); styleAll(mp, [8, 30, 36, 20, 18])
  const st = wb.addWorksheet('Source Trace'); st.getRow(1).values = ['All Months row', 'Source reference', 'Employee ID', 'Month evidence', 'Flags']; headStyle(st.getRow(1)); recs.forEach((r, i) => { st.getRow(2 + i).values = [rowOf.get(r), r.sourceRef, r.employeeId || '', r.monthEvidence || '', r.flags.join(' ')] }); built.excluded.forEach((e, i) => { st.getRow(2 + recs.length + i).values = ['Excluded', e.sourceRef, '', '', e.reason] }); styleAll(st, [14, 36, 14, 24, 80])
  wb.worksheets.forEach((w, i) => { w.orderNo = i })
  return wb
}

// ── GOSI + EOSB workbook ────────────────────────────────────────────────
export async function buildGosiEosbWorkbook({ gosi, eosb, yearEnd, client = '' }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const g = wb.addWorksheet('GOSI'); g.getCell('A1').value = `GOSI calculation${client ? ' – ' + client : ''}`; g.getCell('A1').font = { ...TNR, bold: true }
  g.getRow(3).values = ['Employee ID', 'Employee Name', 'Month', 'GOSI Salary (contributory wage)', 'GOSI Expense (total amount)', 'Late payment fee', 'GOSI Expense incl. late fee', 'MUDAD (net pay)', 'Difference', 'Note']; headStyle(g.getRow(3))
  gosi.rows.forEach((r, i) => { const k = 4 + i; g.getRow(k).values = [r.employeeId, r.name, monthLabel(r.month), r.gosiSalary ?? null, r.gosiExpense ?? 0, r.lateFee ?? 0, { formula: `E${k}+F${k}` }, r.mudad, { formula: `IF(H${k}="","",ROUND(G${k}-H${k},2))` }, r.note]; ;[4, 5, 6, 7, 8, 9].forEach((j) => { g.getCell(k, j).numFmt = ACC }); g.getCell(k, 8).fill = YELLOW; if (r.note) g.getCell(k, 10).fill = AMBER })
  const lastG = 3 + gosi.rows.length
  g.getCell(`B${lastG + 2}`).value = 'GOSI expense (January to November, incl. late fees)'; g.getCell(`G${lastG + 2}`).value = { formula: `SUMPRODUCT((LEFT(C4:C${lastG},3)<>"Dec")*G4:G${lastG})` }
  g.getCell(`B${lastG + 3}`).value = 'GOSI payable (December)'; g.getCell(`G${lastG + 3}`).value = { formula: `SUMPRODUCT((LEFT(C4:C${lastG},3)="Dec")*G4:G${lastG})` }
  ;[`G${lastG + 2}`, `G${lastG + 3}`].forEach((a) => { g.getCell(a).numFmt = ACC; g.getCell(a).font = { ...TNR, bold: true } })
  styleAll(g, [14, 30, 12, 18, 18, 14, 18, 16, 14, 50]); headStyle(g.getRow(3))
  const e = wb.addWorksheet('EOSB'); e.getCell('A1').value = `End of service benefit – year end ${yearEnd.split('-').reverse().join('-')}`; e.getCell('A1').font = { ...TNR, bold: true }
  e.getCell('A2').value = 'Basis (to be confirmed): half a month\'s salary for each of the first 5 years, one month\'s salary for each year after, pro-rated by days / 365. The Rule Book gives the inputs but not the entitlement rule.'; e.getCell('A2').font = { ...TNR, italic: true, color: { argb: 'FFC00000' } }
  e.getRow(4).values = ['Employee ID', 'Employee Name', 'Joining date', 'Calculation salary (basic + housing)', 'Ending calculation date', 'Opening (PY closing)', 'Closing provision', 'Charge for the year', 'Flag']; headStyle(e.getRow(4))
  eosb.forEach((r, i) => { const k = 5 + i; e.getRow(k).values = [r.id, r.name, r.joining ? new Date(`${r.joining}T00:00:00Z`) : null, r.salary, r.endDate ? new Date(`${r.endDate}T00:00:00Z`) : null, r.opening ?? 0, r.closing, { formula: `IF(G${k}="","",ROUND(G${k}-F${k},2))` }, r.flag]; e.getCell(k, 3).numFmt = 'dd-mm-yyyy'; e.getCell(k, 5).numFmt = 'dd-mm-yyyy'; ;[4, 6, 7, 8].forEach((j) => { e.getCell(k, j).numFmt = ACC }); if (r.flag) e.getCell(k, 9).fill = AMBER })
  const le = 4 + eosb.length; e.getCell(`B${le + 2}`).value = 'Total'; ;['F', 'G', 'H'].forEach((L) => { e.getCell(`${L}${le + 2}`).value = { formula: `SUM(${L}5:${L}${le})` }; e.getCell(`${L}${le + 2}`).numFmt = ACC; e.getCell(`${L}${le + 2}`).font = { ...TNR, bold: true } })
  styleAll(e, [14, 30, 14, 20, 18, 18, 18, 18, 50]); headStyle(e.getRow(4))
  wb.worksheets.forEach((w, i) => { w.orderNo = i }); return wb
}
export { STD }
