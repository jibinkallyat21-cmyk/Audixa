// Transaction level data for the sampling, vouching and confirmation tools, worked out from the demo client's own trial balance so that every total
// agrees to a trial balance ledger. Deterministic (seeded): the same trial balance always gives the same data. Shapes match src/data/demoSampling.js.
const YEAR = 2025
const cents = (n) => Math.round(n * 100)
const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 } }
const total = (ledgers, ...groups) => ledgers.filter((l) => groups.includes(l.group)).reduce((n, l) => n + (Number(l.closing) || 0), 0)

// n amounts that add up to exactly `sum` (to the cent); uneven, so a few items are large like real ledgers.
export function splitAmount(sum, n, seed = 1) {
  const r = rnd(seed); const w = Array.from({ length: n }, () => 0.15 + r() ** 2.2)
  const wt = w.reduce((a, b) => a + b, 0); const target = cents(sum)
  const parts = w.map((x) => Math.floor((x / wt) * target)); parts[0] += target - parts.reduce((a, b) => a + b, 0)
  return parts.map((c) => c / 100)
}
const date = (i, n, seed) => { const r = rnd(seed + i * 7)(); const d = new Date(Date.UTC(YEAR, 0, 1)); d.setUTCDate(1 + Math.floor(((i + r * 0.8) / n) * 364)); return d.toISOString().slice(0, 10) }
export const CUSTOMERS = ['Al Noor Trading', 'Gulf Supplies Co', 'Desert Retail', 'Jeddah Stores', 'Riyadh Packaging', 'Hijaz Parts', 'Najd Distribution', 'Red Sea Foods']
export const SUPPLIERS = ['Najd Wholesale', 'Red Sea Imports', 'Eastern Parts', 'Gulf Raw Materials', 'Arabian Packaging', 'Tihama Trading']
const pick = (list, i, seed) => list[Math.floor(rnd(seed + i)() * list.length) % list.length]

function register(prefix, names, sum, n, seed, headers) {
  const amounts = splitAmount(sum, n, seed)
  const rows = amounts.map((a, i) => [`${prefix}-${YEAR}-${String(i + 1).padStart(4, '0')}`, date(i, n, seed), pick(names, i, seed * 3), a])
  rows.sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)).forEach((r, i) => { r[0] = `${prefix}-${YEAR}-${String(i + 1).padStart(4, '0')}` })
  return { headers, rows }
}
export const clientSales = (ledgers) => register('INV', CUSTOMERS, -total(ledgers, 'revenue'), 48, 11, ['Invoice No', 'Date', 'Customer', 'Taxable Value'])
export const clientPurchases = (ledgers) => register('PUR', SUPPLIERS, total(ledgers, 'cogs'), 40, 17, ['Invoice No', 'Date', 'Supplier', 'Taxable Value'])

const MONTHLY = /salar|wage|rent|bank charge|insurance|telephone|utilit/i
export function clientExpenses(ledgers) {
  const rows = []
  ledgers.filter((l) => l.group === 'opex' && Number(l.closing) > 0).forEach((l, k) => {
    const n = /deprec/i.test(l.name) ? 1 : MONTHLY.test(l.name) ? 12 : 9
    splitAmount(l.closing, n, 31 + k).forEach((a, i) => rows.push([l.name, n === 12 ? `${l.name} for ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i]}` : n === 1 ? `${l.name} for the year` : `${l.name} ${i + 1}`, n === 1 ? `${YEAR}-12-31` : date(i, n, 31 + k), a]))
  })
  return { headers: ['Account', 'Description', 'Date', 'Amount'], rows }
}

// Voucher level ledger for the materiality method: revenue, cost of sales and expense entries.
export function clientLedger(ledgers) {
  const s = clientSales(ledgers), p = clientPurchases(ledgers), e = clientExpenses(ledgers); const rows = []
  const revName = ledgers.find((l) => l.group === 'revenue')?.name || 'Sales', cogsName = ledgers.find((l) => l.group === 'cogs')?.name || 'Cost of Sales'
  s.rows.forEach((r) => rows.push([r[0], r[1], revName, `Sales invoice ${r[2]}`, 0, r[3]]))
  p.rows.forEach((r) => rows.push([r[0], r[1], cogsName, `Purchase from ${r[2]}`, r[3], 0]))
  e.rows.forEach((r, i) => rows.push([`EXP-${YEAR}-${String(i + 1).padStart(4, '0')}`, r[2], r[0], r[1], r[3], 0]))
  return { headers: ['Voucher Ref', 'Date', 'Account', 'Description', 'Debit', 'Credit'], rows }
}

// Receivable and payable parties: closing balances add up to the control ledgers (receivables debit, payables credit).
export function clientParties(ledgers) {
  const rows = []
  // After the trial balance is approved the control ledgers are already party-wise ("Trade Receivables - Al Noor Trading"): use those balances as they are.
  const add = (group, names, seed, code) => {
    const led = ledgers.filter((l) => l.group === group && Math.abs(l.closing) > 0.004)
    const list = led.length > 1 ? led.map((l) => [l.name.includes(' - ') ? l.name.split(' - ').slice(1).join(' - ') : l.name, l.closing]) : (() => { const sum = total(ledgers, group); return splitAmount(Math.abs(sum), names.length, seed).map((a, i) => [names[i], sum < 0 ? -a : a]) })()
    list.forEach(([name, closing], i) => rows.push([`${code}${String(i + 1).padStart(3, '0')}`, name, closing > 0 ? closing : 0, closing < 0 ? -closing : 0, closing]))
  }
  add('receivables', CUSTOMERS.slice(0, 6), 5, 'C')
  add('payables', SUPPLIERS.slice(0, 5), 9, 'S')
  return { headers: ['Code', 'Particulars', 'Debits for the period', 'Credits for the period', 'Closing balance'], rows }
}

// Cash and bank ledgers for the confirmation tool: what the trial balance says, to be compared with what the bank letter says.
export function clientConfirmations(ledgers) {
  return ledgers.filter((l) => l.group === 'cash' && Math.abs(Number(l.closing)) > 0.004).map((l) => ({ type: /cash (in|on)|petty/i.test(l.name) ? 'Cash' : 'Bank', label: l.name, tbAmount: Math.round(l.closing * 100) / 100, asAt: `${YEAR}-12-31`, tbBank: l.name }))
}
