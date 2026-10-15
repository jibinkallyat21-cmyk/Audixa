// Reads the Active / Inactive contributor Excel files and writes the clean three-sheet workbook.
// exceljs is loaded on demand so it does not weigh down the rest of the app.
import { detectMapping, normHeader, FIELDS, fmtIso } from './eosb.js'

export async function loadExcelJS() {
  const m = await import('exceljs')
  return m.default || m
}

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

// Reads the first sheet that contains the contributor columns. Returns { headers, rows, sheetName, mapping }.
export async function readContributorSheet(arrayBuffer) {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(arrayBuffer)
  let best = null
  for (const ws of wb.worksheets) {
    // find the header row: the row among the first 20 with the most recognised column names
    for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
      const row = ws.getRow(r)
      const headers = Array.from({ length: ws.columnCount }, (_, i) => { const v = cellValue(row.getCell(i + 1)); return v === null ? '' : String(v).trim() })
      const hits = Object.values(detectMapping(headers)).filter(Boolean).length
      if (!best || hits > best.hits) best = { hits, ws, headerRow: r, headers }
    }
  }
  if (!best || best.hits < 2) return { headers: [], rows: [], sheetName: best?.ws?.name || '', mapping: {}, error: 'No contributor columns were recognised in this file.' }
  const { ws, headerRow, headers } = best
  const rows = []
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const values = {}
    let any = false
    headers.forEach((h, i) => {
      if (!h) return
      const v = cellValue(row.getCell(i + 1))
      values[h] = v
      if (v !== null && String(v).trim() !== '') any = true
    })
    if (any) rows.push({ sourceRow: r, values })
  }
  return { headers: headers.filter(Boolean), rows, sheetName: ws.name, mapping: detectMapping(headers) }
}

const ARIAL = { name: 'Arial', size: 10 }
const YELLOW = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } }
const AMBER = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } }
const HEADER = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
const dateCell = (iso) => (iso ? new Date(`${iso}T00:00:00Z`) : null)

function styleSheet(ws, widths) {
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.columns.forEach((c, i) => { c.width = widths[i] || 14 })
  ws.getRow(1).eachCell((c) => { c.font = { ...ARIAL, bold: true }; c.fill = HEADER; c.alignment = { vertical: 'middle', wrapText: true } })
}

export async function buildEosbWorkbook(result) {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Audit360'

  const addPeople = (name, rows, inactive) => {
    const ws = wb.addWorksheet(name)
    const cols = ['Employee ID', 'Name', 'Basic Pay', 'HRA', 'Total Salary', 'Joining Date', ...(inactive ? ['Leaving Date'] : []), 'Status']
    ws.addRow(cols)
    rows.forEach((r, i) => {
      const n = i + 2
      const values = [r.id || null, r.name || null, r.basic, r.hra, null, dateCell(r.joining), ...(inactive ? [dateCell(r.leaving)] : []), r.status]
      const row = ws.addRow(values)
      row.getCell(5).value = { formula: `IF(OR(C${n}="",D${n}=""),"",C${n}+D${n})` }   // live formula: Basic + HRA
      row.eachCell({ includeEmpty: true }, (c) => { c.font = ARIAL })
      row.getCell(1).numFmt = '@'
      ;[3, 4, 5].forEach((k) => { row.getCell(k).numFmt = '#,##0.00' })
      row.getCell(6).numFmt = 'dd-mm-yyyy'
      if (inactive) row.getCell(7).numFmt = 'dd-mm-yyyy'
      // missing values: light-yellow cells, left blank
      const missCells = { id: 1, name: 2, basic: 3, hra: 4, joining: 6 }
      for (const k of r.missing) row.getCell(missCells[k]).fill = YELLOW
      if (inactive && !r.leaving) row.getCell(7).fill = YELLOW
      if (r.status === 'Check - no leaving date') row.eachCell({ includeEmpty: true }, (c) => { c.fill = AMBER })
    })
    styleSheet(ws, inactive ? [16, 30, 13, 13, 14, 14, 14, 30] : [16, 30, 13, 13, 14, 14, 16])
    return ws
  }
  addPeople('Active', result.active, false)
  addPeople('Inactive', result.inactive, true)

  const ex = wb.addWorksheet('Exceptions')
  ex.addRow(['Source List', 'Source Row', 'Employee ID', 'Name', 'Basic Pay', 'HRA', 'Joining Date', 'Leaving Date', 'Flag Type', 'Reason'])
  result.exceptions.forEach((e) => {
    const row = ex.addRow([e.sourceList, e.sourceRow, e.id || null, e.name || null, e.basic, e.hra, dateCell(e.joining), dateCell(e.leaving), e.flagType, e.reason])
    row.eachCell({ includeEmpty: true }, (c) => { c.font = ARIAL })
    row.getCell(3).numFmt = '@'; row.getCell(7).numFmt = 'dd-mm-yyyy'; row.getCell(8).numFmt = 'dd-mm-yyyy'
    ;[5, 6].forEach((k) => { row.getCell(k).numFmt = '#,##0.00' })
    if (!e.name) row.getCell(4).fill = YELLOW
  })
  styleSheet(ex, [22, 11, 16, 28, 12, 12, 14, 14, 26, 70])
  return wb
}

export async function workbookToBlob(wb) {
  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
export { FIELDS, normHeader, fmtIso }
