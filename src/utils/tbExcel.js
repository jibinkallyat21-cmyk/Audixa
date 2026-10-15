// Process 3.3 — reads trial balance workbooks and writes the review workbook (Audit360 Execution Rule Book).
// Calculations are live Excel formulas (totals, differences, closing, change, ratios). The values the formulas
// give are also stored with them so the file reads correctly in viewers that do not recalculate.
import { loadExcelJS } from './eosbExcel.js'
import { detectTBMapping, TB_FIELDS, groupById, sum, r2 } from './tbCore.js'

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

// Every worksheet that looks like a trial balance (name plus amount columns).
export async function readTBWorkbook(arrayBuffer) {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(arrayBuffer)
  const sheets = []
  for (const ws of wb.worksheets) {
    let best = null
    for (let r = 1; r <= Math.min(25, ws.rowCount); r++) {
      const row = ws.getRow(r)
      const headers = Array.from({ length: ws.columnCount }, (_, i) => { const v = cellValue(row.getCell(i + 1)); return v === null ? '' : String(v).trim() })
      const map = detectTBMapping(headers)
      const amounts = ['opening', 'openingDr', 'debit', 'credit', 'closing', 'closingDr'].filter((f) => map[f]).length
      const hits = (map.name ? 2 : 0) + amounts
      if (map.name && amounts >= 2 && (!best || hits > best.hits)) best = { hits, headerRow: r, headers, map }
    }
    if (!best) continue
    const rows = []
    for (let r = best.headerRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r); const values = {}; let any = false
      best.headers.forEach((h, i) => { if (!h) return; const v = cellValue(row.getCell(i + 1)); values[h] = v; if (v !== null && String(v).trim() !== '') any = true })
      const name = values[best.map.name]
      if (any && name && !/^total/i.test(String(name).trim())) rows.push({ sourceRow: r, values })
    }
    sheets.push({ sheetName: ws.name, headers: best.headers.filter(Boolean), mapping: best.map, rows })
  }
  return sheets
}
export { TB_FIELDS }

const ARIAL = { name: 'Arial', size: 10 }
const FILL = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const HEAD = FILL('FFD9E1F2'), GREEN = FILL('FFC6EFCE'), RED = FILL('FFFFC7CE'), AMBER = FILL('FFFFEB9C'), GREY = FILL('FFF2F2F2')
const NUM = '#,##0.00;(#,##0.00);-'
const PCT = '0.0%'
const RESULT_FILL = { Pass: GREEN, OK: GREEN, Fail: RED, Difference: RED, 'Not tested': AMBER, 'AFS not provided': AMBER }

function header(ws, row, labels) {
  const r = ws.getRow(row); labels.forEach((l, i) => { const c = r.getCell(i + 1); c.value = l; c.font = { ...ARIAL, bold: true }; c.fill = HEAD; c.alignment = { wrapText: true, vertical: 'middle' } })
}
function fontAll(ws) { ws.eachRow({ includeEmpty: false }, (row) => row.eachCell({ includeEmpty: false }, (c) => { c.font = { ...ARIAL, ...(c.font || {}), name: 'Arial', size: c.font?.size || 10 } })) }
const f = (formula, result) => ({ formula, result })

export async function buildTBReviewWorkbook({ client = '', cyPeriod = '', pyPeriod = '', currency = '', tolerance = 1, opening, checks, ratioResult, notes, cy = [], py = [], classes = [], consolidation = null, assumptions = [] }) {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook(); wb.creator = 'Audit360'

  // ── Sheet 1 ──────────────────────────────────────────────────────────────
  const s1 = wb.addWorksheet('Opening Balance Verification')
  s1.getCell('A1').value = `Opening balance verification: ${client}`; s1.getCell('A1').font = { ...ARIAL, bold: true, size: 12 }
  s1.getCell('A2').value = 'Tolerance'; s1.getCell('B2').value = tolerance; s1.getCell('C2').value = `Currency: ${currency || 'as in the source files'}. Debit positive, credit negative. CY period ${cyPeriod}; PY period ${pyPeriod}.`
  header(s1, 4, ['AFS line / ledger', 'Ledger code', 'PY AFS closing balance', 'PY audited TB closing', 'CY TB opening', 'Difference (CY opening - PY AFS)', 'Difference (CY opening - PY TB closing)', 'Status', 'Comment'])
  let r = 5
  const groupRows = []
  for (const line of opening.rows) {
    const gRow = r++
    groupRows.push(gRow)
    const first = r
    for (const l of line.ledgers) {
      const row = s1.getRow(r)
      row.getCell(1).value = `   ${l.name}`; row.getCell(2).value = l.code || null
      row.getCell(4).value = l.pyClosing; row.getCell(5).value = l.cyOpening
      const diff = l.pyClosing === null || l.cyOpening === null ? null : r2(l.cyOpening - l.pyClosing)
      row.getCell(7).value = l.pyClosing === null || l.cyOpening === null ? null : f(`E${r}-D${r}`, diff)
      row.getCell(8).value = f(`IF(OR(D${r}="",E${r}=""),IF(D${r}="","New in CY","Missing in CY"),IF(ABS(G${r})<=$B$2,"OK","Difference"))`, l.status === 'See roll-forward' ? 'Difference' : l.status)
      row.getCell(8).fill = RESULT_FILL[l.status] || RESULT_FILL.Difference
      r++
    }
    const last = r - 1
    const g = s1.getRow(gRow)
    g.getCell(1).value = line.label; g.getCell(1).font = { ...ARIAL, bold: true }
    g.getCell(3).value = line.pyAfs
    if (last >= first) { g.getCell(4).value = line.afsLine === 're' ? line.pyTb : f(`SUM(D${first}:D${last})`, line.pyTb); g.getCell(5).value = f(`SUM(E${first}:E${last})`, line.cyOpen) } else { g.getCell(4).value = line.pyTb; g.getCell(5).value = line.cyOpen }
    g.getCell(6).value = line.pyAfs === null ? null : f(`E${gRow}-C${gRow}`, line.diffAfs)
    g.getCell(7).value = f(`E${gRow}-D${gRow}`, line.diffTb)
    g.getCell(8).value = f(`IF(AND(OR(C${gRow}="",ABS(F${gRow})<=$B$2),ABS(G${gRow})<=$B$2),IF(C${gRow}="","AFS not provided","OK"),"Difference")`, line.status)
    g.getCell(8).fill = RESULT_FILL[line.status] || AMBER
    g.getCell(9).value = line.comment
    g.eachCell({ includeEmpty: true }, (c) => { if (!c.fill || !c.fill.fgColor) c.fill = GREY })
    s1.getRow(gRow).getCell(1).font = { ...ARIAL, bold: true }
  }
  // grand total over the group rows
  const gt = r++
  const T = s1.getRow(gt); T.getCell(1).value = 'Grand total (balance sheet)'; T.getCell(1).font = { ...ARIAL, bold: true }
  const sumRows = (col, rows) => (rows.length ? rows.map((x) => `${col}${x}`).join('+') : '0')
  T.getCell(4).value = f(sumRows('D', groupRows), r2(sum(opening.rows, (x) => x.pyTb))); T.getCell(5).value = f(sumRows('E', groupRows), r2(sum(opening.rows, (x) => x.cyOpen)))
  T.getCell(7).value = f(`E${gt}-D${gt}`, r2(sum(opening.rows, (x) => x.cyOpen) - sum(opening.rows, (x) => x.pyTb)))
  r += 1
  // retained earnings check row
  const re = opening.re
  s1.getRow(r).getCell(1).value = 'Retained earnings check: PY closing RE + PY result - distributions = CY opening RE'; s1.getRow(r).getCell(1).font = { ...ARIAL, bold: true }; r++
  const rr = r
  s1.getRow(rr).getCell(1).value = '   PY TB closing retained earnings'; s1.getRow(rr).getCell(5).value = re.pyRe
  s1.getRow(rr + 1).getCell(1).value = '   PY result (profit is negative)'; s1.getRow(rr + 1).getCell(5).value = re.pyProfit
  s1.getRow(rr + 2).getCell(1).value = '   Distributions per the AFS'; s1.getRow(rr + 2).getCell(5).value = re.distributions
  s1.getRow(rr + 3).getCell(1).value = '   Expected CY opening retained earnings'; s1.getRow(rr + 3).getCell(5).value = f(`SUM(E${rr}:E${rr + 2})`, re.expected)
  s1.getRow(rr + 4).getCell(1).value = '   CY TB opening retained earnings'; s1.getRow(rr + 4).getCell(5).value = re.cyOpening
  s1.getRow(rr + 5).getCell(1).value = '   Difference'; s1.getRow(rr + 5).getCell(5).value = f(`E${rr + 4}-E${rr + 3}`, re.diff)
  s1.getRow(rr + 5).getCell(8).value = f(`IF(ABS(E${rr + 5})<=$B$2,"OK","Difference")`, re.status); s1.getRow(rr + 5).getCell(8).fill = RESULT_FILL[re.status]
  r = rr + 7
  if (re.plOpen.length) {
    s1.getRow(r).getCell(1).value = 'Profit and loss ledgers with an opening balance (P&L must close to retained earnings):'; s1.getRow(r).getCell(1).font = { ...ARIAL, bold: true }; r++
    re.plOpen.forEach((l) => { s1.getRow(r).getCell(1).value = `   ${l.name}`; s1.getRow(r).getCell(5).value = l.opening; r++ })
  }
  ;[3, 4, 5, 6, 7].forEach((k) => { s1.getColumn(k).numFmt = NUM; s1.getColumn(k).width = 20 })
  s1.getColumn(1).width = 52; s1.getColumn(2).width = 13; s1.getColumn(8).width = 18; s1.getColumn(9).width = 60
  s1.views = [{ state: 'frozen', ySplit: 4 }]
  fontAll(s1)

  // ── Sheet 2 (four sections) ──────────────────────────────────────────────
  const s2 = wb.addWorksheet('Initial TB Review')
  let q = 1
  const title = (t) => { s2.getRow(q).getCell(1).value = t; s2.getRow(q).getCell(1).font = { ...ARIAL, bold: true, size: 12 }; q++ }
  title('SECTION A. Initial TB review checks')
  header(s2, q, ['No.', 'Check', 'Result', 'Amount or count', 'Ledgers affected', 'Comment']); q++
  for (const c of checks) {
    const row = s2.getRow(q)
    ;[c.no, c.check, c.result, c.amount, c.ledgers.join('; '), c.comment].forEach((v, i) => { row.getCell(i + 1).value = v })
    row.getCell(3).fill = RESULT_FILL[c.result] || AMBER; row.getCell(5).alignment = { wrapText: true, vertical: 'top' }; q++
  }
  q++
  if (classes.length) {
    s2.getRow(q).getCell(1).value = 'PPE net book value by class (check 6)'; s2.getRow(q).getCell(1).font = { ...ARIAL, bold: true }; q++
    header(s2, q, ['', 'Class', 'Cost', 'Accumulated depreciation', 'Net book value']); q++
    const f0 = q
    classes.forEach((c) => { const row = s2.getRow(q); row.getCell(2).value = c.name; row.getCell(3).value = c.cost; row.getCell(4).value = c.dep; row.getCell(5).value = f(`C${q}+D${q}`, c.nbv); q++ })
    const t = s2.getRow(q); t.getCell(2).value = 'Total'; t.getCell(2).font = { ...ARIAL, bold: true }; ;[3, 4, 5].forEach((k, i) => { t.getCell(k).value = f(`SUM(${'CDE'[i]}${f0}:${'CDE'[i]}${q - 1})`, r2(sum(classes, (c) => [c.cost, c.dep, c.nbv][i]))) }); q += 2
  }
  title('SECTION B. Profitability ratios (PY from the AFS, CY from the TB)')
  const inp = ratioResult.inputs
  s2.getRow(q).getCell(1).value = 'Inputs'; s2.getRow(q).getCell(1).font = { ...ARIAL, bold: true }; q++
  header(s2, q, ['', 'Item', 'CY (TB)', 'PY (AFS)']); q++
  const ref = {}
  ;[['rev', 'Revenue', inp.rev, inp.pyRev], ['cogs', 'Cost of sales', inp.cogs, null], ['opex', 'Operating expenses', inp.opex, null], ['profit', 'Net profit', inp.profit, inp.pyProfit], ['assets', 'Total assets (closing)', inp.assets, null], ['equity', 'Equity (closing, incl. profit)', inp.equity, null]]
    .forEach(([k, label, cyv, pyv]) => { const row = s2.getRow(q); row.getCell(2).value = label; row.getCell(3).value = r2(cyv); row.getCell(4).value = pyv === null ? null : r2(pyv); ref[k] = q; q++ })
  q++
  header(s2, q, ['', 'Ratio', 'Formula', 'PY', 'CY']); q++
  for (const rt of ratioResult.rows) {
    const row = s2.getRow(q)
    row.getCell(2).value = rt.name; row.getCell(3).value = rt.formula
    row.getCell(4).value = rt.py === null ? 'n/a' : rt.py; row.getCell(5).value = rt.cy === null ? 'n/a' : rt.cy
    row.getCell(4).numFmt = PCT; row.getCell(5).numFmt = PCT; q++
  }
  ratioResult.notes.forEach((n) => { s2.getRow(q).getCell(2).value = n; s2.getRow(q).getCell(2).font = { ...ARIAL, italic: true }; q++ })
  q++
  title('SECTION C. Full TB with movements, mapping and last year closing')
  header(s2, q, ['Ledger code', 'Ledger name', 'Group / AFS line', 'Opening', 'Debit', 'Credit', 'Closing', 'PY closing (PY TB)', 'Change vs PY', 'Flag']); q++
  const pyMap = new Map(py.map((l) => [(l.code || l.name).toLowerCase(), l]))
  const c0 = q
  cy.forEach((l) => {
    const p = pyMap.get((l.code || l.name).toLowerCase())
    const row = s2.getRow(q)
    row.getCell(1).value = l.code || null; row.getCell(2).value = l.name; row.getCell(3).value = groupById(l.group).label
    row.getCell(4).value = l.opening; row.getCell(5).value = l.debit; row.getCell(6).value = l.credit
    row.getCell(7).value = f(`D${q}+E${q}-F${q}`, r2(l.opening + l.debit - l.credit)); row.getCell(8).value = p ? p.closing : null
    row.getCell(9).value = p ? f(`G${q}-H${q}`, r2(l.opening + l.debit - l.credit - p.closing)) : null
    const flags = []
    if (!p) flags.push('New in CY'); if (l.group === 'unmapped') flags.push('Unmapped'); if (l.isSuspense) flags.push('Suspense')
    row.getCell(10).value = flags.join('; ') || null
    if (flags.length) row.getCell(10).fill = AMBER
    q++
  })
  const tr = s2.getRow(q); tr.getCell(2).value = 'Total (ties to check 1)'; tr.getCell(2).font = { ...ARIAL, bold: true }
  ;[['D', 4, r2(sum(cy, (l) => l.opening))], ['E', 5, r2(sum(cy, (l) => l.debit))], ['F', 6, r2(sum(cy, (l) => l.credit))], ['G', 7, r2(sum(cy, (l) => l.opening + l.debit - l.credit))]]
    .forEach(([col, idx, val]) => { tr.getCell(idx).value = f(`SUM(${col}${c0}:${col}${q - 1})`, val) })
  q += 2
  title('SECTION D. Detailed notes: mistakes and issues found')
  header(s2, q, ['No.', 'Area', 'Ledger / group', 'Issue found', 'Amount', 'Why it matters', 'Suggested audit action', 'Severity']); q++
  for (const n of notes) {
    const row = s2.getRow(q)
    ;[n.no, n.area, n.ledger, n.issue, n.amount === '' ? null : n.amount, n.why, n.action, n.severity].forEach((v, i) => { row.getCell(i + 1).value = v })
    row.getCell(8).fill = n.severity === 'High' ? RED : n.severity === 'Medium' ? AMBER : GREY
    ;[3, 4, 6, 7].forEach((k) => { row.getCell(k).alignment = { wrapText: true, vertical: 'top' } }); q++
  }
  ;[4, 5, 6, 7, 8, 9].forEach((k) => { if (k !== 8) s2.getColumn(k).numFmt = NUM })
  ;[1, 2, 3].forEach((k, i) => { s2.getColumn(k).width = [12, 42, 34][i] })
  ;[4, 5, 6, 7, 8, 9, 10].forEach((k, i) => { s2.getColumn(k).width = [38, 18, 38, 38, 16, 16, 24][i] })
  s2.views = [{ state: 'frozen', ySplit: 0 }]
  fontAll(s2)

  if (consolidation) {
    const s3 = wb.addWorksheet('Consolidated TB')
    s3.getCell('A1').value = `Consolidated from ${consolidation.how}: ${consolidation.branches.join(', ') || 'sheets'}. Intercompany accounts are shown, not eliminated.`
    header(s3, 3, ['Ledger code', 'Ledger name', 'Parts', 'Opening', 'Debit', 'Credit', 'Closing', 'Intercompany']); let k = 4
    consolidation.ledgers.forEach((l) => { const row = s3.getRow(k); row.getCell(1).value = l.code || null; row.getCell(2).value = l.name; row.getCell(3).value = (l.parts || []).join(', '); row.getCell(4).value = l.opening; row.getCell(5).value = l.debit; row.getCell(6).value = l.credit; row.getCell(7).value = f(`D${k}+E${k}-F${k}`, r2(l.opening + l.debit - l.credit)); row.getCell(8).value = consolidation.intercompany.includes(l) ? 'Yes' : null; k++ })
    if (consolidation.suspense) { const row = s3.getRow(k); row.getCell(2).value = consolidation.suspense.name; row.getCell(7).value = consolidation.suspense.closing; row.eachCell((c) => { c.fill = AMBER }); k++ }
    ;[4, 5, 6, 7].forEach((c) => { s3.getColumn(c).numFmt = NUM; s3.getColumn(c).width = 18 }); s3.getColumn(2).width = 48; s3.views = [{ state: 'frozen', ySplit: 3 }]; fontAll(s3)
  }
  if (assumptions.length) { /* assumptions are part of section D */ }
  return wb
}
