import test from 'node:test'
import assert from 'node:assert/strict'
import { demoCorrectedLedgers } from '../src/data/demoTB.js'
import { compactLedgers } from '../src/utils/tbFormat.js'
import { splitAmount, clientSales, clientPurchases, clientExpenses, clientLedger, clientParties, clientConfirmations } from '../src/utils/clientSamplingData.js'

const L = compactLedgers(demoCorrectedLedgers())
const sum = (rows, i) => Math.round(rows.reduce((n, r) => n + r[i], 0) * 100) / 100
test('splitAmount adds up to the cent', () => { for (const [t, n] of [[2400000, 48], [7200, 12], [33.33, 7]]) assert.equal(Math.round(splitAmount(t, n, 3).reduce((a, b) => a + b, 0) * 100) / 100, t) })
test('sales and purchases equal the revenue and cost of sales ledgers', () => {
  assert.equal(sum(clientSales(L).rows, 3), 2400000); assert.equal(sum(clientPurchases(L).rows, 3), 1700000)
  assert.equal(clientSales(L).rows.length, 48)
})
test('every expense ledger is covered exactly and the voucher ledger agrees', () => {
  const e = clientExpenses(L); const names = [...new Set(e.rows.map((r) => r[0]))]
  for (const n of names) assert.equal(Math.round(e.rows.filter((r) => r[0] === n).reduce((a, r) => a + r[3], 0) * 100) / 100, Math.round(L.find((l) => l.name === n).closing * 100) / 100)
  const v = clientLedger(L); assert.equal(sum(v.rows, 5), 2400000); assert.equal(sum(v.rows, 4), Math.round((1700000 + sum(e.rows, 3)) * 100) / 100)
})
test('party balances add up to the control ledgers', () => {
  const p = clientParties(L); const ar = L.filter((l) => l.group === 'receivables').reduce((n, l) => n + l.closing, 0), ap = L.filter((l) => l.group === 'payables').reduce((n, l) => n + l.closing, 0)
  assert.equal(Math.round(p.rows.filter((r) => r[0][0] === 'C').reduce((n, r) => n + r[4], 0) * 100) / 100, Math.round(ar * 100) / 100)
  assert.equal(Math.round(p.rows.filter((r) => r[0][0] === 'S').reduce((n, r) => n + r[4], 0) * 100) / 100, Math.round(ap * 100) / 100)
})
test('confirmation items come from the cash and bank ledgers', () => {
  const c = clientConfirmations(L); assert.ok(c.length >= 1); assert.equal(c[0].tbAmount, Math.round(L.find((l) => l.name === c[0].label).closing * 100) / 100)
})
test('deterministic', () => { assert.deepEqual(clientSales(L), clientSales(L)) })

import { sampleSalesPurchase } from '../src/utils/sampling.js'
import { salesItems, expenseItems, vouchingRowsFromSamples, defaultRoute } from '../src/utils/sampleItems.js'
import { withSampleRequirements } from '../src/utils/sampleRequests.js'
import { sampleExpense } from '../src/utils/sampling.js'
test('selected sales become client requirements with data, and the vouching rows follow the client uploads', () => {
  const reg = clientSales(L); const rows = reg.rows.map((r, i) => ({ sourceRow: i + 2, values: Object.fromEntries(reg.headers.map((h, k) => [h, r[k]])) }))
  const mapping = { id: 'Invoice No', date: 'Date', party: 'Customer', taxable: 'Taxable Value' }
  const res = sampleSalesPurchase(rows.map((r) => ({ taxable: r.values['Taxable Value'] })))
  const items = salesItems({ rows, mapping, result: res })
  assert.equal(items.length, res.selectedIds.length); assert.ok(items.every((i) => /^Sales invoice INV-2025-\d{4} dated/.test(i.text) && i.data.kind === 'sales'))
  const { rec } = withSampleRequirements({ categories: [] }, { area: 'Sales', label: 'Sales Report', samples: items })
  rec.categories[0].items[0].status = 'Uploaded Processing'; rec.categories[0].items[0].filename = 'a.pdf'
  const v = vouchingRowsFromSamples(rec)
  assert.equal(v.sales.length, items.length); assert.equal(v.sales[0].received, true); assert.equal(v.sales[1].received, false); assert.equal(v.sales[0].fileName, 'a.pdf')
})
test('expense samples and the default route', () => {
  const e = clientExpenses(L); const rows = e.rows.map((r) => ({ account: r[0], description: r[1], date: r[2], amount: r[3] }))
  const items = expenseItems(sampleExpense(rows)); assert.ok(items.length > 0 && items.every((i) => i.data.kind === 'expense'))
  assert.equal(defaultRoute(items), 'requirement'); assert.equal(defaultRoute([{ nature: 'explanation' }]), 'query')
})

import { groupOf } from '../src/utils/tbCore.js'
import { materialityItems } from '../src/utils/sampleItems.js'
test('each test area only takes its own accounts, so a sales sample holds no cost of sales or expenses', () => {
  const v = clientLedger(L); const accounts = [...new Set(v.rows.map((r) => r[2]))]
  const g = (a) => groupOf(a)
  assert.deepEqual(accounts.filter((a) => g(a) === 'revenue'), ['Sales'])
  assert.deepEqual(accounts.filter((a) => g(a) === 'cogs'), ['Cost of Sales'])
  assert.ok(accounts.filter((a) => g(a) === 'opex').length >= 3); assert.equal(accounts.filter((a) => g(a) === 'unmapped').length, 0)
})
test('materiality samples are routed by area: balances go as party items, entries as invoices', () => {
  const res = { above: [{ ref: 'C001', description: 'Al Noor Trading', account: 'Trade receivables', amount: 250000 }], below: [] }
  const ar = materialityItems(res, 'Trade receivables')[0]; assert.equal(ar.data.kind, 'party'); assert.match(ar.text, /^Trade receivables: Al Noor Trading, balance SAR 250,000.00/)
  const rev = materialityItems({ above: [{ ref: 'INV-1', account: 'Sales', description: 'Sales invoice X', amount: -5000, date: '2025-03-01' }], below: [] }, 'Revenue')[0]; assert.equal(rev.data.kind, 'sales')
  assert.equal(materialityItems({ above: [{ ref: 'E1', account: 'Rent', description: 'Rent', amount: 100 }], below: [] }, 'Expenses')[0].data.kind, 'expense')
})
