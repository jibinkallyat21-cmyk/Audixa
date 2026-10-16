import test from 'node:test'
import assert from 'node:assert/strict'
import { selectCutoff, requestText, isBankCharge } from '../src/utils/cutoff.js'
import { clientCutoffTxns } from '../src/utils/clientCutoffData.js'
import { demoCorrectedLedgers } from '../src/data/demoTB.js'
import { compactLedgers } from '../src/utils/tbFormat.js'

const L = compactLedgers(demoCorrectedLedgers()); const T = clientCutoffTxns(L); const YE = '2025-12-31'
test('MISCPA: last N before and first N after the year end, in every area', () => {
  for (const area of ['sales', 'cogs', 'expenses', 'bank']) {
    const r = selectCutoff({ firm: 'MISCPA', area, txns: T[area], yearEnd: YE, n: 5 })
    assert.equal(r.picks.filter((p) => p.period === 'Before year end').length, 5, area); assert.equal(r.picks.filter((p) => p.period === 'After year end').length, 5, area)
    assert.ok(r.picks.filter((p) => p.period === 'Before year end').every((p) => p.date <= YE)); assert.ok(r.picks.filter((p) => p.period === 'After year end').every((p) => p.date > YE))
  }
})
test('MISCPA picks the latest before year end and the earliest after', () => {
  const r = selectCutoff({ firm: 'MISCPA', area: 'sales', txns: T.sales, yearEnd: YE, n: 2 })
  const before = T.sales.filter((t) => t.date <= YE).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-2).map((t) => t.ref)
  assert.deepEqual(r.picks.filter((p) => p.period === 'Before year end').map((p) => p.ref), before)
})
test('ABCPA bank: separate numbers for debits and credits after the year end, bank charges left out, in date order', () => {
  const r = selectCutoff({ firm: 'ABCPA', area: 'bank', txns: T.bank, yearEnd: YE, nDebit: 6, nCredit: 3 })
  assert.equal(r.picks.filter((p) => p.side === 'Debit').length, 6); assert.equal(r.picks.filter((p) => p.side === 'Credit').length, 3)
  assert.ok(r.picks.every((p) => p.date > YE && !isBankCharge(p))); assert.deepEqual(r.picks.map((p) => p.date), [...r.picks.map((p) => p.date)].sort())
  assert.ok(r.notes.some((n) => /bank charge/.test(n)))
})
test('ABCPA other areas: one number, first after the year end', () => {
  const r = selectCutoff({ firm: 'ABCPA', area: 'expenses', txns: T.expenses, yearEnd: YE, n: 4 })
  assert.equal(r.picks.length, 4); assert.ok(r.picks.every((p) => p.period === 'After year end'))
})
test('asking for more than exists says so', () => {
  const r = selectCutoff({ firm: 'ABCPA', area: 'sales', txns: T.sales, yearEnd: YE, n: 50 })
  assert.equal(r.picks.length, 8); assert.ok(r.notes.some((n) => /Only 8/.test(n)))
})
test('bank request text says a bank voucher is not accepted', () => {
  const p = selectCutoff({ firm: 'ABCPA', area: 'bank', txns: T.bank, yearEnd: YE, nDebit: 1, nCredit: 0 }).picks[0]
  assert.match(requestText('bank', p), /not accepted/); assert.match(requestText('sales', { ...p, ref: 'INV-1', ledger: 'Sales' }), /INV-1, Sales/)
})
