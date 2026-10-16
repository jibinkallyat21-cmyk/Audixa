import test from 'node:test'
import assert from 'node:assert/strict'
import { demoPY, demoCY, demoCorrectedLedgers } from '../src/data/demoTB.js'
import { compactLedgers } from '../src/utils/tbFormat.js'
import { openingCheck } from '../src/utils/openingCheck.js'

test('the original demo opening balances are flagged', () => {
  const cy = compactLedgers(demoCY(demoPY()).map((l) => ({ ...l, closing: l.opening + l.debit - l.credit })))
  assert.equal(openingCheck(compactLedgers(demoPY()), cy).aligned, false)
})
test('the corrected demo opening balances all agree to the previous year audited trial balance', () => {
  const r = openingCheck(compactLedgers(demoPY()), compactLedgers(demoCorrectedLedgers()))
  assert.equal(r.aligned, true)
  assert.equal(r.differences, 0)
})

test('the corrected demo trial balance balances and has nothing unmapped', () => {
  const L = compactLedgers(demoCorrectedLedgers())
  assert.equal(Math.round(L.reduce((n, l) => n + l.closing, 0) * 100), 0)
  assert.equal(Math.round(L.reduce((n, l) => n + l.opening, 0) * 100), 0)
  assert.equal(L.filter((l) => l.group === 'unmapped').length, 0)
})
