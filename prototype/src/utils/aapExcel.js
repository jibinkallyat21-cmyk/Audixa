// The alternative audit procedure workbook for one customer or supplier, and the client folder it belongs in.
// The workbook holds the party ledger, the open invoices, the receipts or payments, how each was traced, and the exceptions. The folder holds the workbook,
// the ledger, the invoices and the payment proofs, each renamed to a standard name. Files the client uploaded are placeholders in the prototype.
import { loadExcelJS } from './eosbExcel.js'
import { words } from './aap.js'

const ARIAL = { name: 'Arial', size: 10 }
const NUM = '#,##0.00;(#,##0.00);"-"'
const NAVY = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }
const RED = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B6B6' } }
const GREEN = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } }
const clean = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()
const head = (ws, vals) => { ws.getRow(1).values = vals; vals.forEach((_, i) => { const c = ws.getRow(1).getCell(i + 1); c.fill = NAVY; c.font = { ...ARIAL, bold: true, color: { argb: 'FFFFFFFF' } }; c.alignment = { wrapText: true, vertical: 'middle' } }) }
const widths = (ws, w) => { w.forEach((x, i) => { ws.getColumn(i + 1).width = x }); ws.eachRow((r) => r.eachCell((c) => { c.font = { ...(c.font || {}), name: 'Arial', size: c.font?.size || 10 } })) }

// Where each document goes in the client folder and what it is called there.
export function folderPlan({ client, side, party, invoices, settlements, ledgerOriginal = 'ledger.xlsx' }) {
  const area = side === 'receivables' ? 'Trade receivables' : 'Trade payables'; const w = words(side); const root = `${clean(client)}/${area}/${clean(party)}`
  const files = [{ path: `${root}/Workbook - ${clean(party)} - alternative audit procedure.xlsx`, kind: 'Workbook', original: '' }, { path: `${root}/Ledger/${area} - ${clean(party)} - Ledger.xlsx`, kind: 'Ledger', original: ledgerOriginal }]
  invoices.forEach((i) => files.push({ path: `${root}/Invoices/${clean(party)} - Invoice ${clean(i.no)} - ${i.date} - SAR ${Number(i.amount).toFixed(2)}.pdf`, kind: 'Invoice', original: i.original || '' }))
  settlements.forEach((s) => files.push({ path: `${root}/${side === 'receivables' ? 'Receipts' : 'Payments'}/${clean(party)} - ${w.in[0].toUpperCase()}${w.in.slice(1)} ${s.date} - ${clean(s.ref || s.id)} - SAR ${Number(s.amount).toFixed(2)}.pdf`, kind: w.in[0].toUpperCase() + w.in.slice(1), original: s.original || '' }))
  return { root, files }
}

export async function buildAapWorkbook({ client, side, party, balance, yearEnd = '31-12-2025', data, result, plan, preparedBy = '' }) {
  const ExcelJS = await loadExcelJS(); const wb = new ExcelJS.Workbook(); const w = words(side); const Up = w.in[0].toUpperCase() + w.in.slice(1)
  const sm = wb.addWorksheet('Summary'); sm.getCell('A1').value = `${client}: alternative audit procedure, ${side === 'receivables' ? 'trade receivable' : 'trade payable'} ${party}`; sm.getCell('A1').font = { ...ARIAL, bold: true, size: 12 }
  ;[['Balance at the year end', balance], ['Year end', yearEnd], ['Open invoices', result.invoices.length], [`${Up}s after the year end`, result.settlements.length], ['Traced', result.settlements.filter((d) => d.traced).length], ['Not traced', result.untraced.length], ['Invoices not settled', result.unsettled.length], ['Result', result.status === 'Can be performed' ? 'The alternative procedure can be performed' : 'Unable to verify'], ['Prepared by', preparedBy]].forEach(([k, v], i) => { sm.getCell(`A${3 + i}`).value = k; sm.getCell(`B${3 + i}`).value = v; if (typeof v === 'number' && i === 0) sm.getCell(`B${3 + i}`).numFmt = NUM })
  sm.getCell('A13').value = 'Every open invoice must be settled and every receipt or payment traced to the invoices it settles: by the reference on the document, by the amount, or by the ledger narration. Nothing is allocated oldest first or in proportion.'
  widths(sm, [34, 40])
  const lg = wb.addWorksheet('Ledger'); head(lg, ['Date', 'Reference', 'Narration', 'Debit', 'Credit']); data.ledgerLines.forEach((l, i) => { lg.getRow(2 + i).values = [l.date, l.ref, l.description, l.debit, l.credit]; lg.getCell(2 + i, 4).numFmt = NUM; lg.getCell(2 + i, 5).numFmt = NUM }); widths(lg, [14, 18, 56, 16, 16])
  const iv = wb.addWorksheet('Open invoices'); head(iv, ['Invoice', 'Date', 'Amount', 'Settled by', 'Not settled']); result.invoices.forEach((i, k) => { const by = result.allocations.filter((a) => a.invoiceNo === i.no).map((a) => `${a.settlementId} (${a.method})`).join('; '); iv.getRow(2 + k).values = [i.no, i.date, i.amount, by, i.remaining]; iv.getCell(2 + k, 3).numFmt = NUM; iv.getCell(2 + k, 5).numFmt = NUM; if (!i.settled) iv.getRow(2 + k).eachCell({ includeEmpty: true }, (c) => { c.fill = RED }) })
  const tl = 2 + result.invoices.length; iv.getCell(`A${tl}`).value = 'Total'; ;['C', 'E'].forEach((L) => { iv.getCell(`${L}${tl}`).value = { formula: `SUM(${L}2:${L}${tl - 1})` }; iv.getCell(`${L}${tl}`).numFmt = NUM }); widths(iv, [22, 14, 16, 60, 16])
  const st = wb.addWorksheet(`${Up}s`); head(st, ['Date', 'Reference', 'Amount', 'Named on the document', 'Traced', 'Not traced', 'How', 'Reason if not traced']); result.settlements.forEach((d, k) => { st.getRow(2 + k).values = [d.date, d.ref, d.amount, (d.invoiceRefs || []).join(', '), d.traced ? 'Yes' : 'No', d.untraced, d.method, d.why]; st.getCell(2 + k, 3).numFmt = NUM; st.getCell(2 + k, 6).numFmt = NUM; st.getRow(2 + k).eachCell({ includeEmpty: true }, (c) => { c.fill = d.traced ? GREEN : RED }) }); widths(st, [14, 18, 16, 30, 10, 16, 36, 90])
  const al = wb.addWorksheet('Allocation'); head(al, [Up, 'Invoice', 'Amount', 'Method']); result.allocations.forEach((a, k) => { al.getRow(2 + k).values = [a.settlementId, a.invoiceNo, a.amount, a.method]; al.getCell(2 + k, 3).numFmt = NUM }); widths(al, [14, 22, 16, 36])
  const ex = wb.addWorksheet('Exceptions'); head(ex, ['Item', 'Detail']); let r = 2
  result.untraced.forEach((d) => { ex.getRow(r++).values = [`${Up} ${d.ref || d.id} on ${d.date}`, `SAR ${Number(d.amount).toFixed(2)}: ${d.why}`] }); result.unsettled.forEach((i) => { ex.getRow(r++).values = [`Invoice ${i.no}`, `SAR ${Number(i.remaining).toFixed(2)} not covered by any ${w.in}`] }); if (r === 2) ex.getRow(2).values = ['None', 'Every invoice is settled and every ' + w.in + ' is traced.']; widths(ex, [44, 110])
  const fd = wb.addWorksheet('Client folder'); head(fd, ['Where it is filed', 'Kind', 'Uploaded by the client as']); plan.files.forEach((f, k) => { fd.getRow(2 + k).values = [f.path, f.kind, f.original] }); widths(fd, [120, 14, 44])
  return wb
}
export async function buildAapZip({ wb, plan }) {
  const { default: JSZip } = await import('jszip'); const zip = new JSZip(); const buf = await wb.xlsx.writeBuffer()
  for (const f of plan.files) zip.file(f.path, f.kind === 'Workbook' ? buf : `Placeholder. In the real app the client's uploaded file${f.original ? ` (${f.original})` : ''} is stored here under this name.\n`)
  zip.file(`${plan.root}/Folder map.txt`, plan.files.map((f) => `${f.path}${f.original ? `   <- ${f.original}` : ''}`).join('\n'))
  return zip.generateAsync({ type: 'blob' })
}
