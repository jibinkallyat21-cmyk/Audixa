import { loadExcelJS, workbookToBlob } from './eosbExcel.js'
// The blank workbook in the prescribed trial balance format.
export async function buildTBTemplate() {
  const ExcelJS = await loadExcelJS()
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Trial Balance')
  ws.addRow(['Ledger Code', 'Ledger Name', 'Opening', 'Debit', 'Credit', 'Closing']).font = { bold: true }
  ws.addRow(['1001', 'Cash at Bank - Example Bank', 85000, 2350000, 2180000, 255000])
  ws.addRow(['1100', 'Trade Receivables', 410000, 2300000, 2210000, 500000])
  ;[12, 40, 16, 16, 16, 16].forEach((w, i) => { ws.getColumn(i + 1).width = w })
  const n = wb.addWorksheet('Notes')
  ;['Debit balances are positive and credit balances are negative in the Opening and Closing columns.', 'Debit and Credit are the current-year movements, both entered as positive amounts.', 'Closing = Opening + Debit - Credit.', 'Opening balances must agree with the previous year audit report.', 'Replace the two example rows with your ledgers. One row per ledger, no total row needed.'].forEach((t) => n.addRow([t]))
  n.getColumn(1).width = 110
  return workbookToBlob(wb)
}
