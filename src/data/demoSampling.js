// Sample data for the 3.4 demo buttons. Built in memory; nothing here is a real client's data.
const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }
export function demoSales(seed = 11) {
  const r = rnd(seed); const rows = []
  for (let i = 1; i <= 60; i++) rows.push([`INV-${1000 + i}`, `2025-0${1 + (i % 9)}-1${i % 9}`, `Customer ${((i * 7) % 15) + 1}`, Math.round((r() ** 3) * 90000 + 500)])
  return { headers: ['Invoice No', 'Date', 'Customer', 'Taxable Value'], rows }
}
export function demoExpenses(seed = 5) {
  const r = rnd(seed); const acc = ['Rent', 'Fuel', 'Travel', 'Telephone', 'Legal fees', 'Repairs', 'Insurance']; const rows = []
  for (let i = 0; i < 70; i++) rows.push([acc[i % acc.length], `Expense ${i + 1}`, `2025-0${1 + (i % 9)}-0${1 + (i % 8)}`, Math.round((r() ** 2) * 40000 + 200)])
  return { headers: ['Account', 'Description', 'Date', 'Amount'], rows }
}
export function demoParties() {
  const base = [['C001', 'Al Noor Trading', 0, 182000], ['C002', 'Gulf Supplies', 0, 91000], ['C003', 'Desert Logistics', 0, 56000], ['C004', 'Riyadh Packaging', 0, 20500], ['C005', 'Eastern Steel', 0, 8000],
    ['C006', 'Najd Stationery', 12000, 0], ['C007', 'Hijaz Parts', 4500, 0], ['C008', 'Rounding Co', 100, 99.6], ['C009', 'Nil Co', 500, 500]]
  return { headers: ['Code', 'Particulars', 'Debits for the period', 'Credits for the period', 'Closing balance'], rows: base.map(([c, n, d, cr]) => [c, n, d, cr, d - cr]) }
}
export function demoLedgerForMateriality(seed = 3) {
  const r = rnd(seed); const rows = []
  for (let i = 0; i < 120; i++) rows.push([`V-${i + 1}`, `2025-0${1 + (i % 9)}-1${i % 9}`, i % 4 === 0 ? 'Rent' : i % 4 === 1 ? 'Fuel' : 'Sales', `Entry ${i + 1}`, Math.round((r() ** 3) * 30000 + 100), 0])
  return { headers: ['Voucher Ref', 'Date', 'Account', 'Description', 'Debit', 'Credit'], rows }
}
