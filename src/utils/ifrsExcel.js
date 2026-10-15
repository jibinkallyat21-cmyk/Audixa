// Process 3.6 Step 1 Excel: the IFRS TB workbook (bridge Client TB → adjustments → final, with live formulas).
import { loadExcelJS } from './eosbExcel.js'
import { IFRS, ifrsByCode } from './ifrs.js'

const ARIAL = { name: 'Arial', size: 10 }
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const NAVY = fill('FF002060'), HEAD = fill('FFD9E1F2'), GREEN = fill('FFC6E0B4'), RED = fill('FFF4B6B6'), AMBER = fill('FFFFE699'), YEL = fill('FFFFFF99')
const NUM = '#,##0.00;(#,##0.00);"-"'
const BLUE = { ...ARIAL, color: { argb: 'FF0000FF' } }, GREENF = { ...ARIAL, color: { argb: 'FF00B050' } }
const finish = (ws, widths) => { widths?.forEach((w, i) => { ws.getColumn(i + 1).width = w }); ws.eachRow((r) => r.eachCell((c) => { c.font = { ...ARIAL, ...(c.font || {}) } })) }
const head = (row, n) => { for (let j = 1; j <= n; j++) { const c = row.getCell(j); c.fill = NAVY; c.font = { ...ARIAL, bold: true, color: { argb: 'FFFFFFFF' } }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } } }

export async function buildIfrsWorkbook({ tb, ledgers, entries = [], cogs, vat, verification = [], salesVat = null, pending = [], st, client = 'Company Name', period = {}, mode = 'proper', capital = [], equityInputs = {}, vatReg = '', unresolvedNote = '' }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const names = ['IFRS TB', 'BS', 'P and L', 'Statement of equity', 'Capital', 'COGS', 'IFRS Adjustment Entries', 'Reconciliation', 'Pending - Audit Review', 'Client TB Mapping', 'Client TB', 'VAT Reconciliation', 'Verification']
  const S = Object.fromEntries(names.map((n) => [n, wb.addWorksheet(n)]))
  const cy = (String(period.to || '').match(/\d{4}/) || ['2025'])[0]; const py = String(Number(cy) - 1)
  const n = ledgers.length

  // Client TB (as received; closing is a formula, the supplied closing is kept beside it)
  const ct = S['Client TB']; ct.getRow(1).values = ['Code', 'Account name', 'Opening', 'Debit', 'Credit', 'Closing (Opening + Dr − Cr)', 'Closing as supplied']; head(ct.getRow(1), 7)
  ledgers.forEach((l, i) => { const k = i + 2; ct.getRow(k).values = [l.code, l.name, l.opening, l.debit, l.credit, { formula: `C${k}+D${k}-E${k}` }, l.closingSupplied === false ? null : l.closing]; ;[3, 4, 5, 6, 7].forEach((j) => { ct.getCell(k, j).numFmt = NUM }); ;[1, 2, 3, 4, 5, 7].forEach((j) => { ct.getCell(k, j).font = BLUE }) })
  const lastCT = n + 1; ct.getCell(`B${lastCT + 1}`).value = 'Total'; ;['C', 'D', 'E', 'F'].forEach((L) => { ct.getCell(`${L}${lastCT + 1}`).value = { formula: `SUM(${L}2:${L}${lastCT})` }; ct.getCell(`${L}${lastCT + 1}`).numFmt = NUM })
  finish(ct, [12, 44, 16, 16, 16, 20, 20]); ct.views = [{ state: 'frozen', ySplit: 1 }]

  // Client TB Mapping
  const mp = S['Client TB Mapping']; mp.getRow(1).values = ['TB ID', 'Client TB row', 'Account name', 'Opening', 'Closing', 'IFRS code', 'IFRS account', 'Mapping note', 'Flag']; head(mp.getRow(1), 9)
  tb.mapped.forEach((m, i) => { const k = i + 2; mp.getRow(k).values = [m.id, i + 2, { formula: `'Client TB'!B${i + 2}` }, { formula: `'Client TB'!C${i + 2}` }, { formula: `'Client TB'!F${i + 2}` }, m.ifrs || 'UNMAPPED', m.ifrs ? ifrsByCode(m.ifrs).name : '', m.note, m.flag]; mp.getCell(k, 4).numFmt = NUM; mp.getCell(k, 5).numFmt = NUM; mp.getCell(k, 3).font = GREENF; mp.getCell(k, 4).font = GREENF; mp.getCell(k, 5).font = GREENF; mp.getCell(k, 6).font = BLUE; if (!m.ifrs) mp.getRow(k).eachCell({ includeEmpty: true }, (c) => { c.fill = YEL }) })
  finish(mp, [9, 12, 40, 16, 16, 12, 42, 56, 52]); mp.views = [{ state: 'frozen', ySplit: 1 }]
  const mpLast = n + 1

  // Adjustment entries: A (feeds the TB, cols F/G), B and C (information only, cols I/J)
  const ae = S['IFRS Adjustment Entries']; ae.getRow(1).values = ['Part', 'Ref', 'Kind', 'IFRS code', 'IFRS account', 'Debit', 'Credit', 'Description', 'Information only: Dr', 'Information only: Cr', 'Support / trace', 'Status']; head(ae.getRow(1), 12)
  let r = 2; const addEntry = (e, part, status) => e.legs.forEach((l) => { ae.getRow(r).values = [part, e.id, e.kind || '', l.code, ifrsByCode(l.code)?.name || '', part === 'A' ? l.dr || 0 : null, part === 'A' ? l.cr || 0 : null, e.description, part !== 'A' ? l.dr || 0 : null, part !== 'A' ? l.cr || 0 : null, e.support || '', status]; ;[6, 7, 9, 10].forEach((j) => { ae.getCell(r, j).numFmt = NUM }); if (part === 'A') { ae.getCell(r, 6).font = BLUE; ae.getCell(r, 7).font = BLUE }; r++ })
  tb.adj.booked.forEach((e) => addEntry(e, 'A', 'Booked')); tb.adj.clientPosted.forEach((e) => addEntry(e, 'B', 'Already in the Client TB: audit trail only, not booked again')); tb.adj.pending.forEach((e) => addEntry(e, 'C', e.reason))
  const aeLast = Math.max(r - 1, 2); ae.getCell(`E${r + 1}`).value = 'Total booked'; ae.getCell(`F${r + 1}`).value = { formula: `SUM(F2:F${aeLast})` }; ae.getCell(`G${r + 1}`).value = { formula: `SUM(G2:G${aeLast})` }; ae.getCell(`H${r + 1}`).value = { formula: `IF(ROUND(F${r + 1}-G${r + 1},2)=0,"Balanced","NOT BALANCED")` }
  ;[`F${r + 1}`, `G${r + 1}`].forEach((a) => { ae.getCell(a).numFmt = NUM })
  ae.getCell(`A${r + 3}`).value = 'A = entries booked (feed the IFRS TB) · B = client entries already in the TB (information only) · C = possible adjustments that stay pending'
  finish(ae, [7, 9, 18, 10, 40, 16, 16, 60, 16, 16, 44, 40]); ae.views = [{ state: 'frozen', ySplit: 1 }]

  // IFRS TB
  const it = S['IFRS TB']; it.getCell('A1').value = client; it.getCell('F1').value = client; it.getCell('A2').value = `Trial Balance for the period from ${period.from || `01 Jan ${cy}`} to ${period.to || `31 Dec ${cy}`}`; if (vatReg) { it.getCell('D2').value = 'VAT Reg '; it.getCell('E2').value = vatReg }
  it.getRow(3).values = ['Account Name in English', Number(cy), Number(py), 'Remarks', 'IFRS code', 'IFRS classification', 'Client TB Dr', 'Client TB Cr', 'Adjustments Dr', 'Adjustments Cr', 'Final Dr', 'Final Cr', 'Account check']; head(it.getRow(3), 13)
  const rowOf = {}; let k = 4
  tb.rows.forEach((a) => { if (!a.count && !a.adjDr && !a.adjCr && !a.added) { /* keep every template account visible */ }
    rowOf[a.code] = k
    it.getRow(k).values = [a.name, { formula: `K${k}-L${k}` }, { formula: `SUMIF('Client TB Mapping'!$F$2:$F$${mpLast},E${k},'Client TB Mapping'!$D$2:$D$${mpLast})` }, a.added ? 'Account added to the template (no suitable template account)' : '', a.code, a.section,
      { formula: `MAX(0,SUMIF('Client TB Mapping'!$F$2:$F$${mpLast},E${k},'Client TB Mapping'!$E$2:$E$${mpLast}))` }, { formula: `MAX(0,-SUMIF('Client TB Mapping'!$F$2:$F$${mpLast},E${k},'Client TB Mapping'!$E$2:$E$${mpLast}))` },
      { formula: `SUMIF('IFRS Adjustment Entries'!$D$2:$D$${aeLast},E${k},'IFRS Adjustment Entries'!$F$2:$F$${aeLast})` }, { formula: `SUMIF('IFRS Adjustment Entries'!$D$2:$D$${aeLast},E${k},'IFRS Adjustment Entries'!$G$2:$G$${aeLast})` },
      { formula: `MAX(0,G${k}-H${k}+I${k}-J${k})` }, { formula: `MAX(0,H${k}-G${k}+J${k}-I${k})` }, { formula: `ROUND(G${k}-H${k}+I${k}-J${k}-(K${k}-L${k}),2)` }]
    ;[2, 3, 7, 8, 9, 10, 11, 12, 13].forEach((j) => { it.getCell(k, j).numFmt = NUM }); k++ })
  const tr = k; it.getCell(`A${tr}`).value = 'Total'; ;['B', 'C', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach((L) => { it.getCell(`${L}${tr}`).value = { formula: `SUM(${L}4:${L}${tr - 1})` }; it.getCell(`${L}${tr}`).numFmt = NUM })
  it.getRow(tr).eachCell({ includeEmpty: true }, (c) => { c.fill = NAVY; c.font = { ...ARIAL, bold: true, color: { argb: 'FFFFFFFF' } } })
  it.getCell(`A${tr + 2}`).value = 'Status'; it.getCell(`B${tr + 2}`).value = { formula: `IF(AND(ROUND(K${tr}-L${tr},2)=0,COUNTIF('Client TB Mapping'!F2:F${mpLast},"UNMAPPED")=0),"BALANCED","NOT BALANCED - REVIEW REQUIRED")` }
  it.getCell(`A${tr + 3}`).value = 'Difference (Final Dr − Cr)'; it.getCell(`B${tr + 3}`).value = { formula: `ROUND(K${tr}-L${tr},2)` }; it.getCell(`B${tr + 3}`).numFmt = NUM
  it.getCell(`A${tr + 5}`).value = `The ${py} column is the opening balance of each account, mapped the same way (no prior-year statements were supplied). Totals can differ from client plus adjustments when an entry offsets an opposite balance inside one IFRS line (proof lines are on the Reconciliation sheet). No suspense, rounding or plug account is used.`
  if (unresolvedNote) it.getCell(`A${tr + 6}`).value = unresolvedNote
  finish(it, [46, 18, 18, 40, 10, 24, 16, 16, 16, 16, 16, 16, 14]); it.views = [{ state: 'frozen', ySplit: 3 }]
  const ref = (code, col = 'B') => `'IFRS TB'!${col}${rowOf[code]}`

  // BS
  const bs = S.BS; bs.getCell('B1').value = client; bs.getCell('B2').value = `Statement of Financial Position as on 31 December ${cy}`; bs.getCell('D4').value = Number(cy); bs.getCell('E4').value = Number(py)
  const lines = [[5, 'Assets'], [6, 'Current Assets'], [7, 'Cash and cash equivalents', ['A101'], 1], [8, 'Trade accounts receivable', ['A102'], 1], [9, 'Term deposits', ['A103'], 1], [10, 'Trading investments', ['A104'], 1], [11, 'Inventories', ['A105'], 1], [12, 'Receivable from related parties', ['A106'], 1], [13, 'Prepaid expenses and other receivable (incl. net VAT receivable)', ['A107'], 1],
    [15, 'Non-Current Assets'], [16, 'Tangible Asset', ['A201', 'A202'], 1], [17, 'Intangible assets', ['A203'], 1], [18, 'Biological assets', ['A204'], 1], [19, 'Long term investments', ['A205'], 1], [20, 'Receivable from related parties', ['A206'], 1], [21, 'Other long term receivable', ['A207'], 1],
    [26, 'Liabilities and Equity'], [27, 'Current Liabilities'], [28, 'Accounts payable', ['L101'], -1], [29, 'Accrued expenses and other liabilities (incl. net VAT payable)', ['L102'], -1], [30, 'Payable to related parties', ['L103'], -1], [31, 'Dividend payable', ['L104'], -1],
    [33, 'Non-Current Liabilities'], [34, 'Loans', ['L201'], -1], [35, 'Payable to related parties', ['L202'], -1], [36, 'Provision for end of service benefits', ['L203'], -1],
    [38, 'Equity'], [39, 'Paid-in capital', ['E101'], -1], [40, 'Statutory reserve', ['E102'], -1], [41, 'Additional Paid-in capital/other reserves', ['E103'], -1], [42, 'Retained earnings (incl. result for the year)', ['E104'], -1]]
  for (const [row, label, codes, sign] of lines) { bs.getCell(row, 2).value = label; if (!codes) { bs.getCell(row, 2).font = { ...ARIAL, bold: true }; continue }
    const f = (col) => `${sign === -1 ? '-' : ''}(${codes.map((c) => ref(c, col)).join('+')})`; bs.getCell(row, 4).value = { formula: f('B') }; bs.getCell(row, 5).value = { formula: f('C') }; bs.getCell(row, 4).font = GREENF; bs.getCell(row, 5).font = GREENF }
  const vatA = (col) => `MAX(0,${ref('A108', col)})`; const vatL = (col) => `MAX(0,-(${ref('A108', col)}))`
  bs.getCell('D13').value = { formula: `${ref('A107')}+${vatA('B')}` }; bs.getCell('E13').value = { formula: `${ref('A107', 'C')}+${vatA('C')}` }
  bs.getCell('D29').value = { formula: `-(${ref('L102')})+${vatL('B')}` }; bs.getCell('E29').value = { formula: `-(${ref('L102', 'C')})+${vatL('C')}` }
  bs.getCell('D42').value = { formula: `-(${ref('E104')})+'P and L'!D18` }; bs.getCell('E42').value = { formula: `-(${ref('E104', 'C')})` }
  const sums = [[14, 'D7:D13', 'E7:E13'], [22, 'D16:D21', 'E16:E21'], [32, 'D28:D31', 'E28:E31'], [37, 'D34:D36', 'E34:E36'], [43, 'D39:D42', 'E39:E42']]; sums.forEach(([row, d, e]) => { bs.getCell(row, 4).value = { formula: `SUM(${d})` }; bs.getCell(row, 5).value = { formula: `SUM(${e})` }; bs.getCell(row, 4).font = { ...ARIAL, bold: true }; bs.getCell(row, 5).font = { ...ARIAL, bold: true } })
  bs.getCell('B23').value = 'Assets held for sale'; bs.getCell('D23').value = 0; bs.getCell('E23').value = 0
  bs.getCell('B24').value = 'Total Assets'; bs.getCell('D24').value = { formula: 'D14+D22+D23' }; bs.getCell('E24').value = { formula: 'E14+E22+E23' }
  bs.getCell('B45').value = 'Total Liabilities and Equity'; bs.getCell('D45').value = { formula: 'D32+D37+D43' }; bs.getCell('E45').value = { formula: 'E32+E37+E43' }
  bs.getCell('B47').value = 'Difference (must be nil)'; bs.getCell('D47').value = { formula: 'ROUND(D24-D45,2)' }; bs.getCell('E47').value = { formula: 'ROUND(E24-E45,2)' }
  for (let rr = 7; rr <= 47; rr++) { bs.getCell(rr, 4).numFmt = NUM; bs.getCell(rr, 5).numFmt = NUM }
  bs.getCell('B49').value = `The ${py} column is the opening balance sheet from the TB opening balances; the ${py} result is nil because profit and loss accounts start at zero.`
  finish(bs, [3, 52, 3, 18, 18])
  // P and L
  const pl = S['P and L']; pl.getCell('B1').value = client; pl.getCell('B2').value = `Statement of profit & loss for the year ended 31 December ${cy}`; pl.getCell('D4').value = Number(cy); pl.getCell('E4').value = Number(py)
  const pls = [[6, 'Sales/revenue', 'P101'], [7, 'Cost of sales', 'P102'], [10, 'General and administrative expenses', 'P103'], [11, 'Selling and marketing expenses', 'P104'], [14, 'Other income/expenses, gains/losses', 'P105'], [15, 'Finance charges', 'P106'], [17, 'Zakat and tax expense', 'P107']]
  pls.forEach(([row, label, code]) => { pl.getCell(row, 2).value = label; pl.getCell(row, 4).value = { formula: `-${ref(code)}` }; pl.getCell(row, 4).font = GREENF })
  pl.getCell('B8').value = 'Gross profit'; pl.getCell('D8').value = { formula: 'SUM(D6:D7)' }; pl.getCell('B12').value = 'Operating profit'; pl.getCell('D12').value = { formula: 'SUM(D8:D11)' }; pl.getCell('D16').value = { formula: 'SUM(D12:D15)' }; pl.getCell('B16').value = 'Profit before zakat and tax'; pl.getCell('B18').value = 'Net profit'; pl.getCell('D18').value = { formula: 'SUM(D16:D17)' }
  pl.getCell('B20').value = 'Agrees to the P&L accounts in the IFRS TB'; pl.getCell('D20').value = { formula: `ROUND(D18+(${rowOf.P101 ? ['P101', 'P102', 'P103', 'P104', 'P105', 'P106', 'P107'].map((c) => ref(c)).join('+') : '0'}),2)` }
  for (let rr = 6; rr <= 20; rr++) pl.getCell(rr, 4).numFmt = NUM
  finish(pl, [3, 46, 3, 18, 18])
  // Statement of equity (current year; opening from the TB opening column)
  const se = S['Statement of equity']; se.getCell('A1').value = client; se.getCell('A2').value = `Statement of Equity for the year ended 31 December ${cy}`
  se.getRow(4).values = ['', 'Share Capital', 'Statutory Reserve', 'Additional paid in capital', 'Retained Earnings', 'Total']; head(se.getRow(4), 6)
  se.getRow(5).values = [`Balance at 1 Jan ${cy}`, { formula: `-(${ref('E101', 'C')})` }, { formula: `-(${ref('E102', 'C')})` }, { formula: `-(${ref('E103', 'C')})` }, { formula: `-(${ref('E104', 'C')})` }, { formula: 'SUM(B5:E5)' }]
  const mv = [['Net income for the year', [0, 0, 0, { formula: "'P and L'!D18" }]], ['Statutory reserve transfer', [0, equityInputs.reserveTransfer || 0, 0, -(equityInputs.reserveTransfer || 0)]], ['Dividends', [0, 0, 0, -(equityInputs.dividends || 0)]], ['Additional investment from shareholders', [equityInputs.additionalInvestment || 0, 0, 0, 0]], ['Provision for zakat and income tax', [0, 0, 0, 0]], ['Increase/Decrease in share capital', [equityInputs.capitalChange || 0, 0, 0, 0]]]
  mv.forEach(([label, vals], i) => { se.getRow(6 + i).values = [label, ...vals.map((v) => v), { formula: `SUM(B${6 + i}:E${6 + i})` }] })
  se.getRow(12).values = [`Balance at 31 December ${cy}`, ...['B', 'C', 'D', 'E', 'F'].map((L) => ({ formula: `SUM(${L}5:${L}11)` }))]; se.getRow(12).font = { ...ARIAL, bold: true }
  se.getRow(14).values = ['Agrees to the balance sheet equity', '', '', '', '', { formula: "ROUND(F12-BS!D43,2)" }]
  for (let rr = 5; rr <= 14; rr++) for (let j = 2; j <= 6; j++) se.getCell(rr, j).numFmt = NUM
  se.getCell('A16').value = 'Movements other than net income are inputs (blue) and must be supported. The prior-year (2024) statement of equity needs prior-year statements, which were not supplied.'
  finish(se, [44, 16, 16, 18, 18, 16])
  // Capital
  const cp = S.Capital; cp.getRow(3).values = ['Sl. No.', 'CR Number', 'Name', 'Activity', 'Status', 'Type', 'Capital Amount']; head(cp.getRow(3), 7)
  capital.forEach((c, i) => { cp.getRow(4 + i).values = [i + 1, c.cr || '', c.name || '', c.activity || '', c.status || '', c.type || '', Number(c.amount) || 0]; cp.getCell(4 + i, 7).numFmt = NUM; cp.getRow(4 + i).eachCell((x) => { x.font = BLUE }) })
  const cpLast = Math.max(4, 3 + capital.length); cp.getCell(`A${cpLast + 1}`).value = 'Total Capital'; cp.getCell(`G${cpLast + 1}`).value = { formula: `SUM(G4:G${cpLast})` }; cp.getCell(`G${cpLast + 1}`).numFmt = NUM
  cp.getCell(`A${cpLast + 3}`).value = 'IFRS TB paid-in capital'; cp.getCell(`G${cpLast + 3}`).value = { formula: `-${ref('E101')}` }; cp.getCell(`A${cpLast + 4}`).value = 'Difference (pending if not nil; no adjustment without evidence)'; cp.getCell(`G${cpLast + 4}`).value = { formula: `ROUND(G${cpLast + 1}-G${cpLast + 3},2)` }
  ;[3, 4].forEach((o) => { cp.getCell(`G${cpLast + o}`).numFmt = NUM }); finish(cp, [8, 16, 36, 24, 14, 14, 18])
  // COGS
  const cg = S.COGS; cg.getCell('B2').value = 'COS'; cg.getRow(3).values = ['', 'Particulars', 'Amount']; head(cg.getRow(3), 3)
  const idx = (re, notRe) => ledgers.map((l, i) => ({ l, row: i + 2 })).filter(({ l }) => tb.mapped.find((m) => m.name === l.name)?.ifrs === 'P102' && re.test(l.name) && !(notRe && notRe.test(l.name))).map((x) => `'Client TB'!F${x.row}`)
  const sumRefs = (a) => (a.length ? `SUM(${a.join(',')})` : '0')
  const direct = ledgers.map((l, i) => ({ l, row: i + 2 })).filter(({ l }) => tb.mapped.find((m) => m.name === l.name)?.ifrs === 'P102' && !/opening (stock|inventory)|purchase/i.test(l.name)).map((x) => `'Client TB'!F${x.row}`)
  const invRefs = ledgers.map((l, i) => ({ l, row: i + 2 })).filter(({ l }) => tb.mapped.find((m) => m.name === l.name)?.ifrs === 'A105').map((x) => `'Client TB'!F${x.row}`)
  const rowsC = [[4, 'Opening Stock', sumRefs(idx(/opening (stock|inventory)/i))], [5, 'Purchases: ', null], [6, 'Local Purchase', sumRefs(idx(/purchase/i, /import|opening/i))], [7, 'Import Purchase', sumRefs(idx(/purchase/i).filter((_, i) => /import/i.test(ledgers[Number(idx(/purchase/i)[i].split('!F')[1]) - 2].name)))], [8, 'Direct expenses', sumRefs(direct)]]
  rowsC.forEach(([row, label, f]) => { cg.getCell(row, 2).value = label; if (f) { cg.getCell(row, 3).value = { formula: f }; cg.getCell(row, 3).font = GREENF } })
  cg.getCell('B9').value = cogs.closingLabel === 'client figure, support pending' ? 'Closing stock (client figure, support pending)' : 'Closing stock'; if (cogs.closingLabel === 'client figure, support pending') { cg.getCell('C9').value = cogs.closing; cg.getCell('C9').font = BLUE } else { cg.getCell('C9').value = { formula: sumRefs(invRefs) }; cg.getCell('C9').font = GREENF }
  cg.getCell('B10').value = 'COGS'; cg.getCell('C10').value = { formula: 'C4+C6+C7+C8-C9' }; cg.getCell('B10').font = { ...ARIAL, bold: true }
  cg.getCell('B12').value = 'Flow check'; cg.getCell('B12').font = { ...ARIAL, bold: true }
  ;[['Client TB / supporting data (before closing stock)', { formula: 'C4+C6+C7+C8' }], ['COGS schedule total', { formula: 'C10' }], ['IFRS TB cost of sales', { formula: ref('P102', 'K') + '-' + ref('P102', 'L') }], ['Difference: schedule vs IFRS TB (explained, never adjusted away)', { formula: 'ROUND(C14-C15,2)' }], ['Profit and loss cost of sales', { formula: "-'P and L'!D7" }], ['Difference: IFRS TB vs profit and loss', { formula: 'ROUND(C15+\'P and L\'!D7,2)' }]]
    .forEach(([l, f], i) => { cg.getCell(13 + i, 2).value = l; cg.getCell(13 + i, 3).value = { formula: typeof f === 'object' ? f.formula : f } })
  cg.getCell('B20').value = 'Trade discounts received reduce purchase cost (IAS 2). Periodic stock: opening stock moves into cost of sales; closing stock needs a count sheet.'
  for (let rr = 4; rr <= 18; rr++) cg.getCell(rr, 3).numFmt = NUM; finish(cg, [3, 62, 18])
  // VAT reconciliation
  const vr = S['VAT Reconciliation']; vr.getRow(1).values = ['Account', 'Type', 'Opening', 'Debit', 'Credit', 'Closing']; head(vr.getRow(1), 6)
  vat.rows.forEach((x, i) => { const kk = 2 + i; vr.getRow(kk).values = [x.account, x.kind, x.opening, x.debit, x.credit, { formula: `C${kk}+D${kk}-E${kk}` }]; for (let j = 3; j <= 6; j++) vr.getCell(kk, j).numFmt = NUM })
  const vl = 1 + vat.rows.length; vr.getCell(`A${vl + 2}`).value = 'Net VAT per this reconciliation'; vr.getCell(`F${vl + 2}`).value = { formula: `SUM(F2:F${Math.max(vl, 2)})` }; vr.getCell(`A${vl + 3}`).value = 'IFRS TB net VAT line'; vr.getCell(`F${vl + 3}`).value = { formula: ref('A108', 'K') + '-' + ref('A108', 'L') }; vr.getCell(`A${vl + 4}`).value = 'Difference'; vr.getCell(`F${vl + 4}`).value = { formula: `ROUND(F${vl + 2}-F${vl + 3},2)` }
  ;[2, 3, 4].forEach((o) => { vr.getCell(`F${vl + o}`).numFmt = NUM }); vr.getCell(`A${vl + 6}`).value = 'Tests still to do: output VAT against taxable sales, input VAT against purchases, reverse charge on imports, payments to the authority. VAT that cannot be offset stays separate and is reviewed.'
  finish(vr, [40, 14, 16, 16, 16, 16])
  // Verification
  const vf = S.Verification; vf.getRow(1).values = ['Check', 'IFRS line', 'Schedule figure', 'IFRS TB figure', 'Difference', 'Status', 'Treatment']; head(vf.getRow(1), 7)
  verification.forEach((v, i) => { const kk = 2 + i; vf.getRow(kk).values = [v.label, v.code, v.schedule, { formula: `ABS(${ref(v.code, 'K')}-${ref(v.code, 'L')})` }, { formula: `IF(C${kk}="","",ROUND(C${kk}-D${kk},2))` }, v.status, v.keepClientFigure ? 'The IFRS TB keeps the Client TB figure; the gap is on the pending list.' : ''] ; vf.getCell(kk, 3).numFmt = NUM; vf.getCell(kk, 4).numFmt = NUM; vf.getCell(kk, 5).numFmt = NUM; vf.getCell(kk, 3).font = BLUE })
  if (salesVat) { const kk = verification.length + 3; vf.getCell(`A${kk}`).value = 'Sales compared with the VAT return base'; vf.getCell(`F${kk}`).value = salesVat.status; vf.getCell(`E${kk}`).value = salesVat.diff; vf.getCell(`E${kk}`).numFmt = NUM; vf.getCell(`G${kk}`).value = 'Reported as pending, not adjusted.' }
  finish(vf, [40, 10, 18, 18, 16, 24, 62])
  // Reconciliation
  const rc = S.Reconciliation; rc.getRow(1).values = ['Check', 'Result', 'Detail']; head(rc.getRow(1), 3)
  const live = [['Client TB closing balances sum to nil', `IF(ROUND('Client TB'!F${lastCT + 1},2)=0,"Pass","Fail")`, `'Client TB'!F${lastCT + 1}`], ['Client TB debit = credit (movements)', `IF(ROUND('Client TB'!D${lastCT + 1}-'Client TB'!E${lastCT + 1},2)=0,"Pass","Fail")`, `'Client TB'!D${lastCT + 1}-'Client TB'!E${lastCT + 1}`],
    ['No Client TB account is unmapped', `IF(COUNTIF('Client TB Mapping'!F2:F${mpLast},"UNMAPPED")=0,"Pass","Fail")`, `COUNTIF('Client TB Mapping'!F2:F${mpLast},"UNMAPPED")`], ['Mapped total equals Client TB total', `IF(ROUND(SUM('Client TB Mapping'!E2:E${mpLast})-'Client TB'!F${lastCT + 1},2)=0,"Pass","Fail")`, `SUM('Client TB Mapping'!E2:E${mpLast})-'Client TB'!F${lastCT + 1}`],
    ['Adjustment debits = credits', `IF(ROUND('IFRS TB'!I${tr}-'IFRS TB'!J${tr},2)=0,"Pass","Fail")`, `'IFRS TB'!I${tr}-'IFRS TB'!J${tr}`], ['Account by account: Client ± adjustments = Final', `IF(ROUND(SUMPRODUCT(ABS('IFRS TB'!M4:M${tr - 1})),2)=0,"Pass","Fail")`, `SUMPRODUCT(ABS('IFRS TB'!M4:M${tr - 1}))`],
    ['Final debit = credit', `IF(ROUND('IFRS TB'!K${tr}-'IFRS TB'!L${tr},2)=0,"Pass","Fail")`, `'IFRS TB'!K${tr}-'IFRS TB'!L${tr}`], ['Balance sheet balances (cy and py)', `IF(AND(BS!D47=0,BS!E47=0),"Pass","Fail")`, 'BS!D47'], ['Statement of equity agrees to the balance sheet', `IF('Statement of equity'!F14=0,"Pass","Fail")`, "'Statement of equity'!F14"], ['P&L result agrees to the P&L accounts', `IF('P and L'!D20=0,"Pass","Fail")`, "'P and L'!D20"],
    ['COGS schedule agrees to the IFRS TB', 'IF(COGS!C16=0,"Pass","Review")', 'COGS!C16'], ['Net VAT agrees to the VAT reconciliation', `IF('VAT Reconciliation'!F${vl + 4}=0,"Pass","Review")`, `'VAT Reconciliation'!F${vl + 4}`], ['Capital agrees to the IFRS TB', `IF(Capital!G${cpLast + 4}=0,"Pass","Review")`, `Capital!G${cpLast + 4}`]]
  live.forEach(([c, f, d], i) => { rc.getRow(2 + i).values = [c, { formula: f }, { formula: d }]; rc.getCell(2 + i, 3).numFmt = NUM })
  const last = 2 + live.length; rc.getCell(`A${last + 1}`).value = 'No suspense, plug or rounding account exists'; rc.getCell(`B${last + 1}`).value = ledgers.some((l) => /suspense|plug|rounding differ/i.test(l.name)) ? 'Fail' : 'Pass'
  rc.getCell(`A${last + 3}`).value = 'Summary'; rc.getCell(`A${last + 3}`).font = { ...ARIAL, bold: true }
  ;[['Total Client TB (absolute debits)', { formula: `'IFRS TB'!G${tr}` }], ['Total IFRS TB (final debits)', { formula: `'IFRS TB'!K${tr}` }], ['Total IFRS adjustments (debits)', { formula: `'IFRS TB'!I${tr}` }], ['Final balancing status', { formula: `'IFRS TB'!B${tr + 2}` }]].forEach(([l, f], i) => { rc.getCell(`A${last + 4 + i}`).value = l; rc.getCell(`B${last + 4 + i}`).value = f; rc.getCell(`B${last + 4 + i}`).numFmt = NUM })
  rc.getCell(`A${last + 9}`).value = 'Key reclassifications and adjustments'; rc.getCell(`A${last + 9}`).font = { ...ARIAL, bold: true }
  tb.adj.booked.forEach((e, i) => { rc.getCell(`A${last + 10 + i}`).value = `${e.id}: ${e.description}` })
  finish(rc, [58, 40, 24])
  // Pending
  const pd = S['Pending - Audit Review']; pd.getRow(1).values = ['Ref', 'Category', 'Area', 'Client account', 'Observation', 'Information needed', 'Owner', 'Priority', 'Indicative amount', 'Related sheet']; head(pd.getRow(1), 10)
  pending.forEach((p, i) => { pd.getRow(2 + i).values = [p.ref, p.category, p.area, p.clientAccount, p.observation, p.needed, p.owner, p.priority, p.amount, p.sheet || '']; pd.getCell(2 + i, 9).numFmt = NUM; if (p.priority === 'High') pd.getCell(2 + i, 8).fill = RED })
  finish(pd, [8, 26, 24, 30, 80, 34, 14, 10, 16, 18]); pd.views = [{ state: 'frozen', ySplit: 1 }]
  wb.worksheets.forEach((w) => { w.orderNo = names.indexOf(w.name) })
  return wb
}
