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

// The blank general ledger workbook: every transaction recorded in the books, one row per entry.
export async function buildGLTemplate() {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('General Ledger')
  ws.addRow(['Date', 'Voucher No', 'Account Code', 'Account Name', 'Party Name', 'Narration', 'Debit', 'Credit']).font = { bold: true }
  ws.addRow(['2025-01-01', 'OB-001', '1100', 'Trade Receivables', 'Example Customer A', 'Opening balance', 150000, 0])
  ws.addRow(['2025-03-10', 'INV-1001', '1100', 'Trade Receivables', 'Example Customer A', 'Sales invoice 1001', 900000, 0])
  ws.addRow(['2025-06-05', 'RV-2001', '1100', 'Trade Receivables', 'Example Customer A', 'Receipt against invoice 1001', 0, 850000])
  ws.addRow(['2025-03-10', 'INV-1001', '4001', 'Sales', '', 'Sales invoice 1001', 0, 900000])
  ;[12, 14, 14, 30, 28, 34, 16, 16].forEach((w, i) => { ws.getColumn(i + 1).width = w })
  const n = wb.addWorksheet('Notes')
  ;['Provide the detailed general ledger for the whole audit period: every transaction recorded in the books, one row per entry.', 'Enter the opening balance of each account as a line with the narration "Opening balance". For trade receivables, trade payables, advances from customers and advances to suppliers, enter the opening balance of each party the same way.', 'Account Name (and/or Account Code) must match the trial balance. Party Name is required on every line of trade receivables, trade payables, advances from customers and advances to suppliers.', 'Debit and Credit are positive amounts. For every account, the debits and credits (excluding the opening balance line) must agree with the Current Year Debit and Credit in your trial balance, otherwise the file is rejected.', 'Replace the example rows with your entries.'].forEach((t) => n.addRow([t]))
  n.getColumn(1).width = 120
  return workbookToBlob(wb)
}
