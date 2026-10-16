import test from 'node:test'
import assert from 'node:assert/strict'
import { applyPartyBreakdown, mapGLRows, demoGLRows } from '../src/utils/partyBreakdown.js'

const L = (code, name, opening, debit, credit) => ({ code, name, group: 'x', opening, debit, credit, closing: opening + debit - credit, closingSupplied: true })
const tb = [L('1001', 'Cash at Bank', 10, 0, 0), L('1100', 'Trade Receivables', 1000, 500, 300), L('2001', 'Trade Payables', -400, 0, 100)]

test('maps columns and computes balance from debit and credit', () => {
  const r = mapGLRows(['Account', 'Party Name', 'Debit', 'Credit'], [['Trade Receivables', 'A', 100, 20], ['Trade Receivables', 'Total', 100, 20]])
  assert.equal(r.ok, true); assert.equal(r.rows.length, 1); assert.equal(r.rows[0].balance, 80)
})
test('missing party column is named', () => { assert.deepEqual(mapGLRows(['Account', 'Debit', 'Credit'], []).missing, ['Party']) })
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
  const r = applyPartyBreakdown(tb, demoGLRows(tb))
  assert.ok(r.summary.filter((s) => s.replaced).every((s) => s.difference === 0))
})
