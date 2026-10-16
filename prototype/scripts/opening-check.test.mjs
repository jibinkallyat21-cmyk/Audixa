import test from 'node:test'
import assert from 'node:assert/strict'
import { openingCheck } from '../src/utils/openingCheck.js'
import { demoPY, demoCY } from '../src/data/demoTB.js'

const asTB = (l) => ({ ...l, closing: l.opening + l.debit - l.credit })
test('opening balances equal to the previous year closing are aligned', () => {
  const py = demoPY(); const cy = demoCY(py).map(asTB)
  // the demo deliberately has a receivables difference; remove it for the aligned case
  const fixed = cy.map((l) => (l.code === '1100' ? { ...l, opening: l.opening - 7500 } : l.code === '3100' ? { ...l, opening: l.opening + 7500 } : l))
  assert.equal(openingCheck(py, fixed).aligned, true)
})
test('a difference in receivables is found and named', () => {
  const py = demoPY(); const r = openingCheck(py, demoCY(py).map(asTB))
  assert.equal(r.aligned, false); assert.ok(r.differences >= 1)
  assert.ok(r.ledgerDiffs.some((g) => /receivable/i.test(g.name) && Math.round(g.diffTb) === 7500))
})
