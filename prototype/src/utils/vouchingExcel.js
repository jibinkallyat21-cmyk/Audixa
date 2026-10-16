// Process 3.4 Steps 2 and 3 workbooks: vouching (all checks horizontal, separate columns) and cash / bank confirmations.
import { loadExcelJS } from './eosbExcel.js'
import { SALES_COLUMNS, COGS_TESTS, EXPENSE_COLUMNS, CONF_TESTS, salesResult, cogsResult, partyVouchStatus, partyVouchSummary, confirmationCompletion } from './vouching.js'

const ARIAL = { name: 'Arial', size: 10 }
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const HEAD = fill('FFD9E1F2'), BLUE = fill('FFBDD7EE'), GREEN_IN = fill('FFE2EFDA'), RED = fill('FFF4B6B6'), AMBER = fill('FFFFE699'), OKG = fill('FFC6E0B4')
const NUM = '#,##0.00', DATE = 'dd-mm-yyyy'
const finish = (ws, widths) => { ws.columns.forEach((c, i) => { c.width = widths?.[i] || 16 }); ws.eachRow((r) => r.eachCell((c) => { c.font = { ...ARIAL, ...(c.font || {}) } })) }
const head = (row) => row.eachCell((c) => { c.fill = HEAD; c.font = { ...ARIAL, bold: true }; c.alignment = { wrapText: true, vertical: 'top' } })
const iso = (s) => (s ? new Date(`${s}T00:00:00Z`) : null)

// kind: 'sales' | 'cogs' | 'expense'. samples: [{ ref, fileName, party, invoiceNo, date, taxable, marks:{col: mark}, remarks, received }]
export async function buildVouchingWorkbook({ kind, samples, total, client = '' }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Vouching')
  const cols = kind === 'sales' ? SALES_COLUMNS : kind === 'cogs' ? COGS_TESTS : EXPENSE_COLUMNS
  const lead = ['Ref. No.', 'Client file name', 'Party', 'Invoice No.', 'Date', 'Taxable / Sales Value']
  const tail = kind === 'sales' ? ['Result', 'Remarks'] : kind === 'cogs' ? ['Result', 'Remarks (exceptions and queries only)'] : ['Sample Selected', 'Exception', 'Risk', 'Final Status', 'Remarks']
  ws.getCell('A1').value = `Vouching – ${kind === 'sales' ? 'Sales' : kind === 'cogs' ? 'COGS / Purchases' : 'Expenses'}${client ? ' – ' + client : ''}`; ws.getCell('A1').font = { ...ARIAL, bold: true }
  ws.getCell('A2').value = kind === 'sales' ? 'Marks: ✓ / No / NA' : kind === 'cogs' ? 'Symbols: ✓ = OK | ✗ = Exception | N/A = Not applicable | NP = Evidence not provided | ? = Query client | — = Not tested' : 'Status codes: PASS, FAIL, EXCEPTION, N/A, NOT VERIFIED, INVOICE NOT RECEIVED'
  ws.getCell('A3').value = 'Total value (population)'; ws.getCell('B3').value = total; ws.getCell('B3').numFmt = NUM; ws.getCell('B3').fill = GREEN_IN
  const hr = 5; ws.getRow(hr).values = [...lead, ...cols, ...tail]; head(ws.getRow(hr))
  const first = hr + 1; const valCol = 6
  samples.forEach((s, i) => { const k = first + i
    const row = [s.ref || (s.received === false ? 'Invoice Not Received – Not Numbered' : ''), s.fileName || '', s.party || '', s.invoiceNo || '', iso(s.date), s.taxable, ...cols.map((c) => s.marks?.[c] ?? '')]
    if (kind === 'sales') row.push(salesResult(s.marks || {}), s.remarks || '')
    else if (kind === 'cogs') row.push(cogsResult(s.marks || {}), s.remarks || '')
    else row.push(s.received === false ? 'No' : 'Yes', s.exception || '', s.risk || '', s.finalStatus || '', s.remarks || '')
    ws.getRow(k).values = row; ws.getCell(k, 5).numFmt = DATE; ws.getCell(k, valCol).numFmt = NUM
    for (let j = 1; j <= 6; j++) ws.getCell(k, j).fill = BLUE                                  // selected samples: blue
    for (let j = 7; j < 7 + cols.length; j++) ws.getCell(k, j).fill = GREEN_IN                 // auditor input: green
  })
  const last = first + Math.max(samples.length, 1) - 1; const vcol = ws.getColumn(valCol).letter; const rcol = ws.getColumn(1).letter
  const r1 = hr + samples.length + 3
  ws.getCell(`A${r1}`).value = 'Sample Testing %'; ws.getCell(`A${r1}`).font = { ...ARIAL, bold: true }
  ws.getCell(`B${r1}`).value = { formula: `IF($B$3=0,0,ROUND(SUMPRODUCT((${rcol}${first}:${rcol}${last}<>"")*(LEFT(${rcol}${first}:${rcol}${last},7)<>"Invoice")*N(+${vcol}${first}:${vcol}${last}))/$B$3*100,2))` }
  ws.getCell(`C${r1}`).value = 'by value of the invoices received and numbered ÷ total value × 100; not by number of invoices'
  ws.getCell(`A${r1 + 1}`).value = 'Dates dd-mm-yyyy · selected samples blue · auditor input green · formula cells white. The client\'s original file is never changed; the Ref. No. never replaces the client file name.'
  finish(ws, [22, 26, 26, 16, 12, 16, ...cols.map(() => 14), 14, 36, 16, 16, 20]); ws.views = [{ state: 'frozen', xSplit: 1, ySplit: hr }]
  return wb
}

// parties: [{ party, category, ref, fileName, namesAgree, amountChecked, confirmationVerified, paymentChecked, clientOptionPending, unableToVerify, issue }]
export async function buildPartyVouchingWorkbook({ parties, client = '' }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('AR-AP Vouching')
  const yn = (v) => (v === true ? 'Yes' : v === false ? 'No' : '')
  ws.getCell('A1').value = `AR / AP / Advances vouching${client ? ' – ' + client : ''}`; ws.getCell('A1').font = { ...ARIAL, bold: true }
  ws.getRow(3).values = ['Party', 'Category', 'Ref. No.', 'Client file name', 'Names agree', 'Amounts checked', 'Confirmation details verified', 'Payment / receipt copies checked', 'Client option pending', 'Unable to verify', 'Issue', 'Status']; head(ws.getRow(3))
  parties.forEach((p, i) => { const k = 4 + i; ws.getRow(k).values = [p.party, p.category, p.ref || '', p.fileName || '', yn(p.namesAgree), yn(p.amountChecked), yn(p.confirmationVerified), yn(p.paymentChecked), yn(p.clientOptionPending), yn(p.unableToVerify), p.issue || '', partyVouchStatus(p) || '']
    const st = partyVouchStatus(p); if (st) ws.getCell(k, 12).fill = st === 'OK' ? OKG : st === 'PENDING' ? AMBER : RED
    ws.getCell(k, 5).dataValidation = { type: 'list', formulae: ['"Yes,No"'] } })
  const s = partyVouchSummary(parties); const r = 5 + parties.length
  ws.getCell(`A${r}`).value = 'Results by label'; ws.getCell(`A${r}`).font = { ...ARIAL, bold: true }
  Object.entries(s.counts).forEach(([k, v], i) => { ws.getCell(`A${r + 1 + i}`).value = k; ws.getCell(`B${r + 1 + i}`).value = { formula: `COUNTIF($L$4:$L$${3 + parties.length},A${r + 1 + i})`, result: v } })
  ws.getCell(`A${r + 5}`).value = 'Parties with a Ref. No.'; ws.getCell(`B${r + 5}`).value = { formula: `COUNTIF($C$4:$C$${3 + parties.length},"?*")`, result: s.withRef }
  ws.getCell(`A${r + 6}`).value = 'Overall status'; ws.getCell(`B${r + 6}`).value = s.overall; ws.getCell(`B${r + 6}`).fill = s.overall === 'COMPLETE' ? OKG : RED
  ws.getCell(`A${r + 8}`).value = 'A party is selected by the 50% calculation, but a Ref. No. is given only when its sample / document is actually provided. The status stays NOT COMPLETE until every party with a Ref. No. is Confirmed / Matched.'
  finish(ws, [30, 22, 12, 26, 12, 14, 18, 18, 16, 14, 30, 16]); return wb
}

// c: { ref, type, label, fileName, amount, asAt, tests, reasons, overall, clientProvided, statement, denominations, remarks }
export async function buildConfirmationWorkbook({ confirmations, docLog = [], client = '', yearEnd = '31-12-2025', prepared = {} }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook()
  const colour = (o) => (o === 'Confirmed / Matched' ? OKG : /Unable|Not Available/.test(o) ? AMBER : RED)
  const sheet = (name, type) => {
    const ws = wb.addWorksheet(name)
    ws.getRow(1).values = ['Ref. No.', 'Client file name', 'Description', 'TB amount', 'Confirmed amount', 'Difference', 'As at', ...CONF_TESTS, 'Overall Result', 'Remarks']; head(ws.getRow(1))
    confirmations.filter((c) => c.type === type).forEach((c, i) => { const k = 2 + i
      ws.getRow(k).values = [c.ref, c.fileName || '', c.label || '', c.tbAmount ?? null, c.amount ?? null, { formula: `IF(OR(D${k}="",E${k}=""),"",ROUND(E${k}-D${k},2))` }, iso(c.asAt), ...CONF_TESTS.map((t) => c.tests?.[t] ?? ''), c.overall, [c.clientProvided ? 'Client-provided confirmation: weaker evidence than one obtained directly from the bank / custodian.' : '', ...Object.values(c.reasons || {}), c.remarks || '', docLog.some((d) => d.ref?.startsWith(c.ref)) ? 'See Document Log' : ''].filter(Boolean).join(' ')]
      ws.getCell(k, 4).numFmt = NUM; ws.getCell(k, 5).numFmt = NUM; ws.getCell(k, 6).numFmt = NUM; ws.getCell(k, 7).numFmt = DATE
      for (let j = 8; j < 8 + CONF_TESTS.length; j++) { ws.getCell(k, j).fill = GREEN_IN }
      ws.getCell(k, 8 + CONF_TESTS.length).fill = colour(c.overall) })
    finish(ws, [12, 28, 28, 16, 16, 14, 12, ...CONF_TESTS.map(() => 14), 26, 70]); ws.views = [{ state: 'frozen', ySplit: 1 }]; return ws
  }
  const sm = wb.addWorksheet('Summary')
  sm.getCell('A1').value = `Cash & bank confirmation review${client ? ' – ' + client : ''}`; sm.getCell('A1').font = { ...ARIAL, bold: true }
  sm.getCell('A2').value = 'Year-end'; sm.getCell('B2').value = yearEnd
  sm.getRow(4).values = ['Ref. No.', 'Type', 'Description', 'Overall Result']; head(sm.getRow(4))
  confirmations.forEach((c, i) => { sm.getRow(5 + i).values = [c.ref, c.type, c.label || '', c.overall]; sm.getCell(5 + i, 4).fill = colour(c.overall) })
  const comp = confirmationCompletion({ confirmations, logComplete: docLog.length > 0 })
  sm.getCell(`A${6 + confirmations.length}`).value = 'Review status'; sm.getCell(`B${6 + confirmations.length}`).value = comp.status; sm.getCell(`B${6 + confirmations.length}`).fill = comp.complete ? OKG : RED
  finish(sm, [14, 12, 36, 32])
  sheet('Cash', 'Cash'); sheet('Bank', 'Bank')
  const dl = wb.addWorksheet('Document Log'); dl.getRow(1).values = ['Ref. No.', 'Client file name', 'Document / page', 'Amount', 'Compared with', 'Difference', 'Agrees', 'Supporting check']; head(dl.getRow(1))
  docLog.forEach((d, i) => { const k = 2 + i; dl.getRow(k).values = [d.ref, d.fileName || '', d.description || '', d.amount ?? null, d.comparedWith ?? null, { formula: `IF(OR(D${k}="",E${k}=""),"",ROUND(D${k}-E${k},2))` }, { formula: `IF(F${k}="","",IF(F${k}=0,"Yes","No"))` }, d.check || '']; dl.getCell(k, 4).numFmt = NUM; dl.getCell(k, 5).numFmt = NUM; dl.getCell(k, 6).numFmt = NUM }); finish(dl, [12, 28, 34, 16, 16, 14, 10, 50])
  const fc = wb.addWorksheet('Final Check'); fc.getRow(1).values = ['Requirement', 'Result']; head(fc.getRow(1))
  ;[['Every document has been listed', docLog.length > 0], ['Every confirmation has a Ref. No.', confirmations.length > 0 && confirmations.every((c) => c.ref)], ['All six tests performed', confirmations.every((c) => CONF_TESTS.every((t) => c.tests?.[t]))], ['Bank confirmations cross-verified with bank statements', confirmations.filter((c) => c.type === 'Bank').every((c) => c.statementChecked)], ['Cash denomination checks performed', confirmations.filter((c) => c.type === 'Cash').every((c) => c.denominationsChecked)], ['Every confirmation is Confirmed / Matched', confirmations.length > 0 && confirmations.every((c) => c.overall === 'Confirmed / Matched')]]
    .forEach((r, i) => { fc.getRow(2 + i).values = [r[0], r[1] ? 'Yes' : 'No']; fc.getCell(2 + i, 2).fill = r[1] ? OKG : RED })
  fc.getCell('A9').value = 'Final status'; fc.getCell('B9').value = comp.status; fc.getCell('B9').fill = comp.complete ? OKG : RED; comp.blockers.forEach((b, i) => { fc.getCell(`A${11 + i}`).value = b }); finish(fc, [60, 18])
  const cn = wb.addWorksheet('Closing Note')
  ;['Client-provided confirmations are weaker evidence than confirmations obtained directly from the bank / custodian.', 'Manager review flags: client name differences, missing signatures or seals, client-provided confirmations, unusual cash movements, related-party movements, bank statement / confirmation differences, other matters needing judgement.', 'Audit conclusions remain with the engagement team.', '', 'Prepared by: ' + (prepared.preparedBy || ''), 'Reviewed by (Manager): ', 'Approved by (Partner): '].forEach((t, i) => { cn.getCell(`A${1 + i}`).value = t })
  finish(cn, [120])
  return wb
}
