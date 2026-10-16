// Transactions around the year end for the cut-off tool, built for the demo client from its trial balance. Before the year end they follow the
// registers already built for sampling; after the year end (the subsequent period) they are new, since the trial balance does not cover that period.
import { clientSales, clientPurchases, clientExpenses, splitAmount, CUSTOMERS, SUPPLIERS } from './clientSamplingData.js'

const YEAR_END = '2025-12-31'
const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const lastN = (rows, n) => rows.slice(-n)

function after(prefix, names, total, n, seed, mk) {
  return splitAmount(total, n, seed).map((a, i) => mk(`${prefix}-${YEAR_END.slice(0, 4) * 1 + 1}-${String(i + 1).padStart(4, '0')}`, addDays(YEAR_END, 2 + i * 2), names[i % names.length], a))
}
export function clientCutoffTxns(ledgers) {
  const rev = ledgers.find((l) => l.group === 'revenue')?.name || 'Sales', cogs = ledgers.find((l) => l.group === 'cogs')?.name || 'Cost of Sales'
  const sales = [...lastN(clientSales(ledgers).rows, 8).map((r) => ({ date: r[1], ref: r[0], ledger: rev, description: r[2], debit: 0, credit: r[3] })), ...after('INV', CUSTOMERS, 180000, 8, 71, (ref, date, party, a) => ({ date, ref, ledger: rev, description: party, debit: 0, credit: a }))]
  const purchases = [...lastN(clientPurchases(ledgers).rows, 8).map((r) => ({ date: r[1], ref: r[0], ledger: cogs, description: r[2], debit: r[3], credit: 0 })), ...after('PUR', SUPPLIERS, 120000, 8, 73, (ref, date, party, a) => ({ date, ref, ledger: cogs, description: party, debit: a, credit: 0 }))]
  const e = clientExpenses(ledgers).rows.filter((r) => !/deprec|bank charge/i.test(r[0]))
  const expenses = [...lastN(e, 8).map((r, i) => ({ date: r[2], ref: `EXP-${i + 1}`, ledger: r[0], description: r[1], debit: r[3], credit: 0 })), ...after('EXP', ['Rent Expense', 'Salaries and Wages'], 60000, 8, 79, (ref, date, name, a) => ({ date, ref, ledger: name, description: `${name} (January)`, debit: a, credit: 0 }))]
  const bankLed = ledgers.find((l) => l.group === 'cash' && Math.abs(l.closing) > 0.004)
  const bank = bankLed ? [
    ...splitAmount(420000, 9, 83).map((a, i) => ({ date: addDays('2025-12-01', i * 3), ref: `ST-${i + 1}`, ledger: bankLed.name, description: i % 2 ? `Payment to ${SUPPLIERS[i % SUPPLIERS.length]}` : `Receipt from ${CUSTOMERS[i % CUSTOMERS.length]}`, debit: i % 2 ? a : 0, credit: i % 2 ? 0 : a })),
    { date: '2025-12-31', ref: 'ST-CH1', ledger: bankLed.name, description: 'Bank charges December', debit: 600, credit: 0 },
    ...splitAmount(380000, 14, 89).map((a, i) => ({ date: addDays(YEAR_END, 1 + i * 2), ref: `ST-${i + 20}`, ledger: bankLed.name, description: i % 3 ? `Payment to ${SUPPLIERS[i % SUPPLIERS.length]}` : `Receipt from ${CUSTOMERS[i % CUSTOMERS.length]}`, debit: i % 3 ? a : 0, credit: i % 3 ? 0 : a })),
    { date: addDays(YEAR_END, 3), ref: 'ST-CH2', ledger: bankLed.name, description: 'Bank charges January', debit: 600, credit: 0 },
  ] : []
  return { bank, sales, cogs: purchases, expenses, cash: [] }
}
