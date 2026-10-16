import { loadExcelJS, workbookToBlob } from './eosbExcel.js'
// The blank workbook in the prescribed trial balance format.
export async function buildTBTemplate() {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Trial Balance')
  ws.addRow(['Ledger Name', 'Account Code', 'Opening Balance', 'Current Year Debit', 'Current Year Credit', 'Closing Balance']).font = { bold: true }
  ws.addRow(['Cash at Bank - Example Bank', '1001', 85000, 2350000, 2180000, 255000])
  ws.addRow(['Trade Receivables', '1100', 410000, 2300000, 2210000, 500000])
  ;[40, 14, 18, 20, 20, 18].forEach((w, i) => { ws.getColumn(i + 1).width = w })
  const n = wb.addWorksheet('Notes')
  ;['One row per ledger. The trial balance must be at ledger level: no group, sub-group or total rows.', 'Only trade receivables, trade payables, advances from customers and advances to suppliers may be a single line. The party-wise balances are taken from the general ledger you provide.', 'Debit balances are positive and credit balances are negative in the Opening and Closing columns. Current Year Debit and Credit are entered as positive amounts.', 'Closing Balance = Opening Balance + Current Year Debit - Current Year Credit. A file where this does not hold is rejected.', 'Opening balances must agree with the previous year audit report.', 'Replace the two example rows with your ledgers.'].forEach((t) => n.addRow([t]))
  n.getColumn(1).width = 110
  return workbookToBlob(wb)
}

// The blank general ledger workbook: party-wise balances for receivables, payables and the two advance accounts.
export async function buildGLTemplate() {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('General Ledger')
  ws.addRow(['Account', 'Party', 'Opening Balance', 'Debit', 'Credit', 'Closing Balance']).font = { bold: true }
  ws.addRow(['Trade Receivables', 'Example Customer A', 150000, 900000, 850000, 200000])
  ws.addRow(['Trade Receivables', 'Example Customer B', 260000, 1400000, 1360000, 300000])
  ;[34, 34, 18, 18, 18, 18].forEach((w, i) => { ws.getColumn(i + 1).width = w })
  const n = wb.addWorksheet('Notes')
  ;['Provide the detailed general ledger. For trade receivables, trade payables, advances from customers and advances to suppliers there must be one row per party.', 'Account must be the same name (or code) as in your trial balance.', 'The party balances of each of these accounts must add up to the closing balance of that account in your trial balance. A file where they do not is rejected.', 'Debit balances are positive and credit balances are negative in the opening and closing columns.'].forEach((t) => n.addRow([t]))
  n.getColumn(1).width = 110
  return workbookToBlob(wb)
}
