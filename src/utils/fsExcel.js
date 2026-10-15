// Process 3.6 Step 1 — FS workbook. Direct-link rule: statement → note → Client TB cell. No SUMIF / lookups on the statements and notes.
import { loadExcelJS } from './eosbExcel.js'
import { IFRS, ifrsByCode } from './ifrs.js'
import { PY_BS_LINES, PY_PL_LINES } from './fsPrep.js'

const TNR = { name: 'Times New Roman', size: 11 }
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const NAVY = fill('FF002060'), GREEN = fill('FFC6E0B4'), RED = fill('FFF4B6B6'), AMBER = fill('FFFFE699'), YEL = fill('FFFFFF99')
const NUM = '#,##0.00;(#,##0.00);"-"'
const BLUE = { ...TNR, color: { argb: 'FF0000FF' } }, GRN = { ...TNR, color: { argb: 'FF00B050' } }
const finish = (ws, widths) => { widths?.forEach((w, i) => { ws.getColumn(i + 1).width = w }); ws.eachRow((r) => r.eachCell((c) => { c.font = { ...TNR, ...(c.font || {}) } })) }
const head = (row, n) => { for (let j = 1; j <= n; j++) { const c = row.getCell(j); c.fill = NAVY; c.font = { ...TNR, bold: true, color: { argb: 'FFFFFFFF' } }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } } }
const NOTE_ORDER = [...PY_BS_LINES.map((l) => l[0]), ...PY_PL_LINES.map((l) => l[0])]
const LABEL = Object.fromEntries([...PY_BS_LINES.map((l) => [l[0], l[1]]), ...PY_PL_LINES.map((l) => [l[0], l[1]])])

// A ledger that sits on the wrong side for its line is moved (reclassification, never netted).
function effective(m) {
  if (!m.ifrs) return { line: null }
  const a = ifrsByCode(m.ifrs); let line = a.line; let moved = null
  if (m.ifrs === 'A108') { line = m.final < 0 ? 'accrued' : 'prepaid'; moved = line === 'accrued' ? 'Net VAT payable (credit balance): shown in accrued expenses and other liabilities.' : null }
  if (m.ifrs === 'A102' && m.final < 0) { line = 'accrued'; moved = 'Customer account with a credit balance: shown in accrued expenses and other liabilities, not netted against receivables.' }
  if (m.ifrs === 'L101' && m.final > 0) { line = 'prepaid'; moved = 'Supplier account with a debit balance: shown in prepaid expenses and other receivable (advances to suppliers), not netted against payables.' }
  return { line, moved, from: a.line, st: ifrsByCode(line === 'accrued' ? 'L102' : line === 'prepaid' ? 'A107' : m.ifrs).st }
}
const lineSign = (line) => { const b = PY_BS_LINES.find((l) => l[0] === line); return b ? b[2] : -1 }       // BS: +1 asset as is, −1 liability / equity negated; P&L negated

export async function buildFSWorkbook({ fs, ledgers, client = 'Company Name', period = {}, params = {}, inputs = {}, py = {} }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const names = ['SOFP', 'SCI', 'SCE', 'SCF', 'Notes', 'TB Mapping', 'PY AFS Extraction', 'Checks and flags', 'Client TB']; const S = Object.fromEntries(names.map((n) => [n, wb.addWorksheet(n)]))
  const cy = (String(period.to || '').match(/\d{4}/) || ['2025'])[0]; const pyY = String(Number(cy) - 1)
  const title = (ws, t, cols) => { ws.mergeCells(1, 1, 1, cols); ws.getCell('A1').value = client; ws.getCell('A1').font = { ...TNR, bold: true }; ws.mergeCells(2, 1, 2, cols); ws.getCell('A2').value = t; ws.getCell('A2').font = { ...TNR, bold: true } }

  // Client TB: D opening … I final
  const ct = S['Client TB']; ct.getRow(1).values = ['TB ID', 'Account number', 'Account name', 'Opening', 'Debit', 'Credit', 'Adjustment Dr', 'Adjustment Cr', 'Final (recomputed)', 'Final as supplied', 'Difference']; head(ct.getRow(1), 11)
  fs.mapping.forEach((m, i) => { const k = i + 2; const l = ledgers[i]; ct.getRow(k).values = [m.id, l.code || '', l.name, l.opening || 0, l.debit || 0, l.credit || 0, l.adjDr || 0, l.adjCr || 0, { formula: `D${k}+E${k}-F${k}+G${k}-H${k}` }, l.closing === '' || l.closing === null || l.closing === undefined ? null : Number(l.closing), { formula: `IF(J${k}="","",ROUND(I${k}-J${k},2))` }]; for (let j = 4; j <= 11; j++) ct.getCell(k, j).numFmt = NUM; for (let j = 1; j <= 8; j++) ct.getCell(k, j).font = BLUE })
  const ctLast = ledgers.length + 1; ct.getCell(`C${ctLast + 1}`).value = 'Total'; ;['D', 'E', 'F', 'G', 'H', 'I'].forEach((L) => { ct.getCell(`${L}${ctLast + 1}`).value = { formula: `SUM(${L}2:${L}${ctLast})` }; ct.getCell(`${L}${ctLast + 1}`).numFmt = NUM })
  finish(ct, [9, 14, 44, 16, 16, 16, 16, 16, 18, 18, 14]); ct.views = [{ state: 'frozen', ySplit: 1 }]

  // PY AFS Extraction (source layer)
  const px = S['PY AFS Extraction']; px.getRow(1).values = ['Statement', 'Line', 'PY amount', 'Source']; head(px.getRow(1), 4); const pyRow = {}
  let pr = 2; PY_BS_LINES.forEach(([k, label]) => { pyRow[k] = pr; px.getRow(pr).values = ['SOFP', label, py.bs?.[k] ?? null, py.bs?.[k] === null || py.bs?.[k] === undefined ? 'Not provided' : 'PY AFS SOFP']; px.getCell(pr, 3).numFmt = NUM; px.getCell(pr, 3).font = BLUE; pr++ })
  PY_PL_LINES.forEach(([k, label]) => { pyRow[k] = pr; px.getRow(pr).values = ['SCI', label, py.pl?.[k] ?? null, py.pl?.[k] === null || py.pl?.[k] === undefined ? 'Not provided' : 'PY AFS SCI']; px.getCell(pr, 3).numFmt = NUM; px.getCell(pr, 3).font = BLUE; pr++ })
  px.getCell(`A${pr + 1}`).value = 'This sheet is the source layer for every comparative. It is never overwritten by current-year data. Liabilities, equity and income are entered as presented (positive).'
  finish(px, [12, 56, 18, 20])

  // Notes: one block per line; every account is a direct link to a Client TB cell
  const nt = S.Notes; title(nt, 'Notes to the financial statements', 5); nt.getRow(4).values = ['Note', 'Particulars', `${cy}`, `${pyY}`, 'Client TB account']; head(nt.getRow(4), 5)
  let nr = 5; const noteTotal = {}; const moves = []
  const byLine = {}; fs.mapped.forEach((m, i) => { const e = effective({ ifrs: m.ifrs, final: m.closing }); if (!e.line) return; (byLine[e.line] ||= []).push({ m, i, e }); if (e.moved) moves.push({ id: m.id, name: m.name, from: e.from, to: e.line, why: e.moved }) })
  let noteNo = 0
  NOTE_ORDER.forEach((line) => { const items = byLine[line] || []; const needsPy = PY_BS_LINES.some((l) => l[0] === line) || PY_PL_LINES.some((l) => l[0] === line); if (!items.length && !needsPy) return
    noteNo++; nt.getCell(nr, 1).value = noteNo; nt.getCell(nr, 2).value = LABEL[line] || line; nt.getRow(nr).font = { ...TNR, bold: true }; nr++
    const first = nr; const sign = lineSign(line)
    items.forEach(({ m, i }) => { const k = i + 2; nt.getCell(nr, 2).value = `   ${m.name}`; nt.getCell(nr, 3).value = { formula: `${sign === -1 ? '-' : ''}'Client TB'!I${k}` }; nt.getCell(nr, 3).font = GRN; nt.getCell(nr, 3).numFmt = NUM; nt.getCell(nr, 5).value = `${m.id}`; nr++ })
    if (line === 're' && fs.st) { nt.getCell(nr, 2).value = '   Profit for the year (from the statement of comprehensive income)'; nt.getCell(nr, 3).value = { formula: 'SCI!C20' }; nt.getCell(nr, 3).font = GRN; nt.getCell(nr, 3).numFmt = NUM; nr++ }
    nt.getCell(nr, 2).value = 'Total'; nt.getCell(nr, 3).value = { formula: nr > first ? `SUM(C${first}:C${nr - 1})` : '0' }; nt.getCell(nr, 4).value = { formula: `IF('PY AFS Extraction'!C${pyRow[line]}="","",'PY AFS Extraction'!C${pyRow[line]})` }
    nt.getCell(nr, 3).numFmt = NUM; nt.getCell(nr, 4).numFmt = NUM; nt.getCell(nr, 4).font = GRN; nt.getRow(nr).font = { ...TNR, bold: true }; noteTotal[line] = { row: nr, no: noteNo }; nr += 2 })
  finish(nt, [7, 62, 18, 18, 18])
  const ref = (line, col = 'C') => (noteTotal[line] ? `N(Notes!${col}${noteTotal[line].row})` : '0')       // N() so a missing comparative reads as nothing, never as an error

  // SOFP
  const sf = S.SOFP; title(sf, `Statement of Financial Position as at 31 December ${cy}`, 4); sf.getRow(4).values = ['', 'Note', cy, pyY]; head(sf.getRow(4), 4)
  const sofpRow = {}; let sr = 5
  const section = (label, lines, totalLabel) => { sf.getCell(sr, 1).value = label; sf.getCell(sr, 1).font = { ...TNR, bold: true }; sr++; const first = sr
    lines.forEach((k) => { sofpRow[k] = sr; sf.getCell(sr, 1).value = LABEL[k]; sf.getCell(sr, 2).value = noteTotal[k]?.no ?? ''; sf.getCell(sr, 3).value = { formula: ref(k, 'C') }; sf.getCell(sr, 4).value = { formula: ref(k, 'D') }; sf.getCell(sr, 3).font = GRN; sf.getCell(sr, 4).font = GRN; sr++ })
    sf.getCell(sr, 1).value = totalLabel; sf.getCell(sr, 3).value = { formula: `SUM(C${first}:C${sr - 1})` }; sf.getCell(sr, 4).value = { formula: `SUM(D${first}:D${sr - 1})` }; sf.getRow(sr).font = { ...TNR, bold: true }; const t = sr; sr += 2; return t }
  const tCA = section('Current assets', ['cash', 'ar', 'termDep', 'tradingInv', 'inventory', 'relRecCur', 'prepaid'], 'Total current assets')
  const tNCA = section('Non-current assets', ['tangible', 'intangible', 'biological', 'ltInv', 'relRecNc', 'ltRec'], 'Total non-current assets')
  sf.getCell(sr, 1).value = 'Total assets'; sf.getCell(sr, 3).value = { formula: `C${tCA}+C${tNCA}` }; sf.getCell(sr, 4).value = { formula: `D${tCA}+D${tNCA}` }; sf.getRow(sr).font = { ...TNR, bold: true }; const tA = sr; sr += 2
  const tCL = section('Current liabilities', ['ap', 'accrued', 'relPayCur', 'divPay'], 'Total current liabilities'); const tNCL = section('Non-current liabilities', ['loans', 'relPayNc', 'eosb'], 'Total non-current liabilities'); const tEQ = section('Equity', ['capital', 'statRes', 'otherRes', 're'], 'Total equity')
  sf.getCell(sr, 1).value = 'Total liabilities and equity'; sf.getCell(sr, 3).value = { formula: `C${tCL}+C${tNCL}+C${tEQ}` }; sf.getCell(sr, 4).value = { formula: `D${tCL}+D${tNCL}+D${tEQ}` }; sf.getRow(sr).font = { ...TNR, bold: true }; const tLE = sr; sr += 2
  sf.getCell(sr, 1).value = 'Difference (must be nil; never plugged)'; sf.getCell(sr, 3).value = { formula: `ROUND(C${tA}-C${tLE},2)` }; sf.getCell(sr, 4).value = { formula: `ROUND(D${tA}-D${tLE},2)` }; const sofpDiff = sr
  for (let rr = 5; rr <= sr; rr++) { sf.getCell(rr, 3).numFmt = NUM; sf.getCell(rr, 4).numFmt = NUM }
  finish(sf, [52, 8, 18, 18])
  // SCI (profit row 20 is referenced by the retained-earnings note)
  const sc = S.SCI; title(sc, `Statement of Comprehensive Income for the year ended 31 December ${cy}`, 4); sc.getRow(4).values = ['', 'Note', cy, pyY]; head(sc.getRow(4), 4)
  const plr = [[6, 'revenue'], [7, 'cos'], [9, 'ga'], [10, 'sm'], [13, 'other'], [14, 'finance'], [18, 'tax']]
  plr.forEach(([row, k]) => { sc.getCell(row, 1).value = LABEL[k]; sc.getCell(row, 2).value = noteTotal[k]?.no ?? ''; sc.getCell(row, 3).value = { formula: ref(k, 'C') }; sc.getCell(row, 4).value = { formula: ref(k, 'D') }; sc.getCell(row, 3).font = GRN; sc.getCell(row, 4).font = GRN })
  ;[[8, 'Gross profit', 'SUM(#6:#7)'], [11, 'Operating profit', '#8+#9+#10'], [15, 'Profit before zakat and tax', '#11+#13+#14'], [20, 'Profit for the year', '#15+#18']].forEach(([row, label, f]) => { sc.getCell(row, 1).value = label; sc.getCell(row, 3).value = { formula: f.replace(/#(\d+)/g, 'C$1') }; sc.getCell(row, 4).value = { formula: f.replace(/#(\d+)/g, 'D$1') }; sc.getRow(row).font = { ...TNR, bold: true } })
  sc.getCell('A22').value = 'Other comprehensive income'; sc.getCell('C22').value = 0; sc.getCell('D22').value = 0; sc.getCell('A23').value = 'Total comprehensive income'; sc.getCell('C23').value = { formula: 'C20+C22' }; sc.getCell('D23').value = { formula: 'D20+D22' }
  sc.getCell('A25').value = 'Previous year amounts come from the PY AFS only. Tax: only what the TB supports; a nil tax charge is flagged "Tax computation required".'
  for (let rr = 6; rr <= 23; rr++) { sc.getCell(rr, 3).numFmt = NUM; sc.getCell(rr, 4).numFmt = NUM }
  finish(sc, [52, 8, 18, 18])
  // SCE
  const se = S.SCE; title(se, `Statement of Changes in Equity for the year ended 31 December ${cy}`, 6); se.getRow(4).values = ['', 'Share capital', 'Statutory reserve', 'Other reserves', 'Retained earnings', 'Total']; head(se.getRow(4), 6)
  se.getRow(5).values = [`Balance at 1 January ${cy} (PY AFS closing)`, { formula: `'PY AFS Extraction'!C${pyRow.capital}` }, { formula: `'PY AFS Extraction'!C${pyRow.statRes}` }, { formula: `'PY AFS Extraction'!C${pyRow.otherRes}` }, { formula: `'PY AFS Extraction'!C${pyRow.re}` }, { formula: 'SUM(B5:E5)' }]
  se.getRow(6).values = ['Profit for the year', 0, 0, 0, { formula: 'SCI!C20' }, { formula: 'SUM(B6:E6)' }]
  se.getRow(7).values = ['Transfer to statutory reserve', 0, inputs.reserveTransfer || 0, 0, -(inputs.reserveTransfer || 0), { formula: 'SUM(B7:E7)' }]
  se.getRow(8).values = ['Dividends / distributions', 0, 0, 0, -(inputs.dividends || 0), { formula: 'SUM(B8:E8)' }]
  se.getRow(9).values = ['Other movements', inputs.capitalChange || 0, 0, 0, inputs.otherEquity || 0, { formula: 'SUM(B9:E9)' }]
  se.getRow(10).values = [`Balance at 31 December ${cy}`, ...['B', 'C', 'D', 'E', 'F'].map((L) => ({ formula: `SUM(${L}5:${L}9)` }))]; se.getRow(10).font = { ...TNR, bold: true }
  se.getRow(12).values = ['Equity per the SOFP', { formula: `SOFP!C${sofpRow.capital}` }, { formula: `SOFP!C${sofpRow.statRes}` }, { formula: `SOFP!C${sofpRow.otherRes}` }, { formula: `SOFP!C${sofpRow.re}` }, { formula: `SOFP!C${tEQ}` }]
  se.getRow(13).values = ['Difference', ...['B', 'C', 'D', 'E', 'F'].map((L) => ({ formula: `ROUND(${L}10-${L}12,2)` }))]
  for (let rr = 5; rr <= 13; rr++) for (let j = 2; j <= 6; j++) se.getCell(rr, j).numFmt = NUM
  ;[7, 8, 9].forEach((rr) => ['B', 'C', 'D', 'E'].forEach((L) => { se.getCell(`${L}${rr}`).font = BLUE }))
  se.getCell('A15').value = 'The movement is not assumed to be only the profit: dividends, reserve transfers and other movements are inputs and must be supported. The previous-year SCE comes from the PY AFS.'
  finish(se, [50, 16, 16, 16, 18, 16])
  // SCF (indirect)
  const cf = S.SCF; title(cf, `Statement of Cash Flows for the year ended 31 December ${cy}`, 4); cf.getRow(4).values = ['', 'Note', cy, pyY]; head(cf.getRow(4), 4)
  const S_ = (k, col = 'C') => `SOFP!${col}${sofpRow[k]}`
  const dlt = (k, sign) => `${sign}(${S_(k, 'C')}-${S_(k, 'D')})`
  const rowsCF = [[6, 'Profit before zakat and tax', 'SCI!C15'], [7, 'Depreciation and amortisation (input)', String(inputs.depreciation || 0), true], [8, 'Movement in end of service benefits', dlt('eosb', '')], [9, 'Trade receivables', dlt('ar', '-')], [10, 'Prepaid expenses and other receivable', dlt('prepaid', '-')], [11, 'Inventories', dlt('inventory', '-')], [12, 'Related parties (net)', `-((${S_('relRecCur')}+${S_('relRecNc')})-(${S_('relRecCur', 'D')}+${S_('relRecNc', 'D')}))+((${S_('relPayCur')}+${S_('relPayNc')})-(${S_('relPayCur', 'D')}+${S_('relPayNc', 'D')}))`], [13, 'Accounts payable', dlt('ap', '')], [14, 'Accrued expenses and other liabilities', dlt('accrued', '')], [15, 'Zakat and tax paid (input)', String(-(inputs.taxPaid || 0)), true]]
  rowsCF.forEach(([row, label, f, input]) => { cf.getCell(row, 1).value = label; cf.getCell(row, 3).value = { formula: f }; cf.getCell(row, 3).font = input ? BLUE : GRN })
  cf.getCell('A16').value = 'Net cash from operating activities'; cf.getCell('C16').value = { formula: 'SUM(C6:C15)' }
  cf.getCell('A18').value = 'Purchase of tangible assets (movement + depreciation)'; cf.getCell('C18').value = { formula: `-((${S_('tangible')}-${S_('tangible', 'D')})+C7)` }
  cf.getCell('A19').value = 'Intangible assets, investments and deposits'; cf.getCell('C19').value = { formula: `-(${['intangible', 'ltInv', 'termDep', 'tradingInv', 'biological', 'ltRec'].map((k) => `(${S_(k)}-${S_(k, 'D')})`).join('+')})` }
  cf.getCell('A20').value = 'Net cash from investing activities'; cf.getCell('C20').value = { formula: 'SUM(C18:C19)' }
  cf.getCell('A22').value = 'Paid-in capital and other reserves'; cf.getCell('C22').value = { formula: `(${S_('capital')}-${S_('capital', 'D')})+(${S_('otherRes')}-${S_('otherRes', 'D')})` }
  cf.getCell('A23').value = 'Loans'; cf.getCell('C23').value = { formula: dlt('loans', '') }; cf.getCell('A24').value = 'Dividends paid and dividend payable'; cf.getCell('C24').value = { formula: `${dlt('divPay', '')}-${inputs.dividends || 0}` }
  cf.getCell('A25').value = 'Net cash from financing activities'; cf.getCell('C25').value = { formula: 'SUM(C22:C24)' }
  cf.getCell('A27').value = 'Net movement in cash'; cf.getCell('C27').value = { formula: 'C16+C20+C25' }; cf.getCell('A28').value = 'Opening cash (PY AFS)'; cf.getCell('C28').value = { formula: S_('cash', 'D') }; cf.getCell('A29').value = 'Closing cash'; cf.getCell('C29').value = { formula: 'C27+C28' }
  cf.getCell('A30').value = 'Cash per the SOFP'; cf.getCell('C30').value = { formula: S_('cash') }; cf.getCell('A31').value = 'Difference (shown, never plugged)'; cf.getCell('C31').value = { formula: 'ROUND(C29-C30,2)' }
  cf.getCell('A33').value = 'ASSUMPTION: AUDITOR CONFIRMATION REQUIRED – indirect method built from the movement between the current notes and the PY AFS balances. The previous-year SCF comes from the PY AFS SCF, which was not entered.'; cf.getCell('D6').value = 'Not provided'
  for (let rr = 6; rr <= 31; rr++) cf.getCell(rr, 3).numFmt = NUM; finish(cf, [56, 8, 18, 18])
  // TB mapping
  const tm = S['TB Mapping']; tm.getRow(1).values = ['TB ID', 'Account', 'Opening', 'Final', 'FS line', 'Note', 'PY AFS line', 'Status', 'Mapping note']; head(tm.getRow(1), 9)
  fs.mapping.forEach((m, i) => { const e = effective({ ifrs: m.ifrs, final: m.final }); const k = i + 2; tm.getRow(k).values = [m.id, m.name, { formula: `'Client TB'!D${k}` }, { formula: `'Client TB'!I${k}` }, e.line ? LABEL[e.line] : 'UNMAPPED', e.line ? noteTotal[e.line]?.no ?? '' : '', e.line ? LABEL[e.line] : '', e.moved ? 'Reclassified' : m.status, e.moved || m.note]; tm.getCell(k, 3).numFmt = NUM; tm.getCell(k, 4).numFmt = NUM; if (m.status === 'Unmapped') tm.getRow(k).eachCell({ includeEmpty: true }, (c) => { c.fill = YEL }) })
  tm.getCell(`A${ctLast + 3}`).value = 'Reference only: no statement or note reads from this sheet. Statements link to notes; notes link directly to the Client TB.'; finish(tm, [9, 44, 16, 16, 40, 8, 40, 16, 70])
  // Checks and flags
  const ck = S['Checks and flags']; ck.getRow(1).values = ['Area', 'Check', 'Result', 'Detail']; head(ck.getRow(1), 4)
  const live = { 'Current year|SOFP balances': `IF(AND(SOFP!C${sofpDiff}=0),"Pass","Fail")`, 'Current year|SCE closing equals SOFP equity': 'IF(SCE!F13=0,"Pass","Fail")', 'Current year|SCF closing cash equals SOFP cash': 'IF(SCF!C31=0,"Pass","Fail")' }
  fs.checks.forEach((c, i) => { const f = live[`${c.area}|${c.check}`]; ck.getRow(2 + i).values = [c.area, c.check, f ? { formula: f } : c.info ? 'Info' : c.pass ? 'Pass' : 'Fail', c.detail] })
  let cr = 3 + fs.checks.length; ck.getCell(`A${cr}`).value = 'Overall'; ck.getCell(`C${cr}`).value = fs.status; cr += 2
  const block = (t, rows, cols) => { ck.getCell(`A${cr}`).value = t; ck.getCell(`A${cr}`).font = { ...TNR, bold: true }; cr++; ck.getRow(cr).values = cols; head(ck.getRow(cr), cols.length); cr++; rows.forEach((r) => { ck.getRow(cr).values = r; cr++ }); if (!rows.length) { ck.getCell(`A${cr}`).value = 'None'; cr++ } cr++ }
  block('PY closing vs TB opening', fs.opening.map((o) => [o.label, o.py, o.tbOpening, o.diff, o.status, o.reason || '', o.action || '']), ['Line', 'PY AFS closing', 'TB opening', 'Difference', 'Status', 'Likely reason', 'Action'])
  block('Review flags', fs.flags.map((f) => [f.area, f.message, f.severity]), ['Area', 'Flag', 'Severity'])
  block('Assumptions', fs.assumptions.map((a) => [a]), ['Assumption'])
  block('Reclassifications (what moved, from, to, why)', moves.map((m) => [m.id, m.name, LABEL[m.from] || m.from, LABEL[m.to] || m.to, m.why, 'Comparatives are not changed']), ['TB ID', 'Account', 'From', 'To', 'Why', 'Effect on comparatives'])
  block('Questions for the auditor', [['Only questions whose answer changes a number, a class or a disclosure and cannot be answered from the TB, adjustments, PY AFS or template are listed.']], ['Question'])
  block('Template change log', [['None: the template structure and formulas were kept.']], ['Change'])
  finish(ck, [22, 60, 18, 60, 14, 40, 40])
  wb.worksheets.forEach((w) => { w.orderNo = names.indexOf(w.name) }); return wb
}
