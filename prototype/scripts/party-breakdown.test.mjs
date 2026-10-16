import test from 'node:test'
import assert from 'node:assert/strict'
import { applyPartyBreakdown } from '../src/utils/partyBreakdown.js'
import { mapGLTransactions, checkGL, demoGLTransactions } from '../src/utils/generalLedger.js'

const L = (code, name, opening, debit, credit) => ({ code, name, group: 'x', opening, debit, credit, closing: opening + debit - credit, closingSupplied: true })
const tb = [L('1001', 'Cash at Bank', 10, 0, 0), L('1100', 'Trade Receivables', 1000, 500, 300), L('2001', 'Trade Payables', -400, 0, 100)]

test('group line is replaced by parties and reconciles', () => {
  const gl = [{ account: 'Trade Receivables', party: 'A', opening: 600, debit: 300, credit: 100, balance: 800 }, { account: 'Trade Receivables', party: 'B', opening: 400, debit: 200, credit: 200, balance: 400 }]
  const r = applyPartyBreakdown(tb, gl)
  assert.deepEqual(r.ledgers.map((l) => l.name), ['Cash at Bank', 'Trade Receivables - A', 'Trade Receivables - B', 'Trade Payables'])
  const s = r.summary.find((x) => x.line === 'Trade Receivables'); assert.equal(s.difference, 0); assert.equal(s.parties, 2)
  assert.equal(r.summary.find((x) => x.line === 'Trade Payables').replaced, false)
})
test('difference is reported, not hidden', () => {
  const r = applyPartyBreakdown(tb, [{ account: '1100', party: 'A', opening: 0, debit: 0, credit: 0, balance: 1000 }])
  assert.equal(r.summary[0].difference, 200)
})
test('same party on several rows is added up; unmatched accounts listed', () => {
  const r = applyPartyBreakdown(tb, [{ account: 'Trade Receivables', party: 'A', opening: 0, debit: 5, credit: 0, balance: 5 }, { account: 'Trade Receivables', party: 'a', opening: 0, debit: 5, credit: 0, balance: 5 }, { account: 'Other', party: 'Z', opening: 0, debit: 0, credit: 0, balance: 1 }])
  assert.equal(r.ledgers.filter((l) => l.partyOf).length, 1); assert.equal(r.ledgers.find((l) => l.partyOf).closing, 10); assert.deepEqual(r.unmatched, ['Other'])
})
test('demo general ledger adds up to the lines exactly', () => {
  const r = applyPartyBreakdown(tb, checkGL(tb, demoGLTransactions(tb)).partyRows)
  assert.ok(r.summary.filter((s) => s.replaced).every((s) => s.difference === 0))
})

const T = (account, party, debit, credit, narration = 'Sale', extra = {}) => ({ date: '2025-03-01', ref: 'V1', accountName: account, accountCode: '', party, narration, debit, credit, isOpening: /Opening/i.test(narration), ...extra })
test('transaction ledger: columns are mapped, opening lines flagged, totals dropped', () => {
  const r = mapGLTransactions(['Date', 'Voucher No', 'Account Name', 'Party', 'Narration', 'Debit', 'Credit'], [['2025-01-01', 'OB', 'Trade Receivables', 'A', 'Opening balance', 100, 0], ['2025-02-01', 'V2', 'Trade Receivables', 'A', 'Invoice', 50, 0], ['', '', 'Total', '', '', 150, 0]])
  assert.equal(r.ok, true); assert.equal(r.txns.length, 2); assert.equal(r.txns[0].isOpening, true); assert.equal(r.txns[1].isOpening, false)
})
test('missing debit/credit columns are named', () => { assert.deepEqual(mapGLTransactions(['Account', 'Narration'], []).missing, ['Debit', 'Credit']) })
test('demo transaction ledger agrees with its trial balance and gives party rows', () => {
  const r = checkGL(tb, demoGLTransactions(tb)); assert.deepEqual(r.errors, []); assert.ok(r.partyRows.some((p) => p.account === 'Trade Receivables'))
  const ar = r.partyRows.filter((p) => p.account === 'Trade Receivables').reduce((n, p) => n + p.balance, 0); assert.ok(Math.abs(ar - 1200) < 0.01)
})
test('a movement that differs from the trial balance is rejected with the ledger and amounts', () => {
  const t = demoGLTransactions(tb); t.push(T('Cash at Bank', '', 40, 0))
  const r = checkGL(tb, t); assert.equal(r.ok, false); assert.ok(r.errors.join(' ').includes('Cash at Bank: debits 40'))
})
test('trial balance ledgers with no transactions, and accounts missing from the trial balance, are reported', () => {
  const t = demoGLTransactions(tb).filter((x) => x.accountName !== 'Trade Payables'); t.push(T('Mystery Account', '', 5, 0))
  const e = checkGL(tb, t).errors.join(' '); assert.ok(e.includes('Mystery Account')); assert.ok(e.includes('No transactions in the general ledger') && e.includes('Trade Payables'))
})
test('control account lines need a party and the parties must add up to the trial balance', () => {
  const t = demoGLTransactions(tb).map((x) => (x.accountName === 'Trade Receivables' && x.isOpening && x.party === 'Gulf Supplies Co' ? { ...x, debit: x.debit + 70 } : x))
  assert.ok(checkGL(tb, t).errors.join(' ').includes('Trade Receivables'))
  const np = demoGLTransactions(tb).map((x) => (x.accountName === 'Trade Payables' ? { ...x, party: '' } : x))
  assert.ok(checkGL(tb, np).errors.join(' ').includes('needs a party name'))
})
test('no control lines: ledger rows without parties are fine', () => {
  const only = [L('1001', 'Cash at Bank', 10, 5, 0)]; assert.equal(checkGL(only, demoGLTransactions(only)).ok, true)
})
