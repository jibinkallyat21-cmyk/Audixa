import test from 'node:test'
import assert from 'node:assert/strict'
import { flagsFromCheck, verifyProposals, amountMatching, reviewOpening } from '../src/utils/openingReview.js'
import { openingCheck } from '../src/utils/openingCheck.js'
import { groupOf } from '../src/utils/tbCore.js'

const L = (code, name, opening, closing = opening) => ({ code, name, group: groupOf(name), opening, debit: 0, credit: 0, closing })
// previous year: one prepaid ledger of 18,000. This year: it is split, and the second part is named in a way the grouping cannot place.
const py = [L('1300', 'Prepaid Expenses', 18000), L('1001', 'Cash at Bank - SNB', 5000)]
const cy = [L('1300', 'Prepaid Expenses', 12000), L('1350', 'Amounts due from Al Noor Contracting', 6000), L('1001', 'Cash at Bank - SNB', 5000)]

test('code step flags only the area that differs, and the unplaced ledger', () => {
  const oc = openingCheck(py, cy); assert.equal(oc.aligned, false)
  const f = flagsFromCheck(py, cy, oc)
  assert.deepEqual(f.map((x) => `${x.side}:${x.name}`).sort(), ['CY:Amounts due from Al Noor Contracting', 'CY:Prepaid Expenses', 'PY:Prepaid Expenses'])
})
test('a proposal that adds up clears the flag', () => {
  const r = reviewOpening({ py, cy, proposals: [{ py: ['Prepaid Expenses'], cy: ['Prepaid Expenses', 'Amounts due from Al Noor Contracting'], reason: 'The prepayment was split' }] })
  assert.equal(r.verified.length, 1); assert.equal(r.resolved, true)
})
test('a proposal that does not add up is rejected and the flag stays', () => {
  const r = reviewOpening({ py, cy, proposals: [{ py: ['Prepaid Expenses'], cy: ['Amounts due from Al Noor Contracting'], reason: 'Same thing' }] })
  assert.equal(r.verified.length, 0); assert.ok(r.rejected[0].why.includes('do not add up')); assert.equal(r.resolved, false)
})
test('invented ledgers and reused ledgers are rejected', () => {
  const f = flagsFromCheck(py, cy)
  const { verified, rejected } = verifyProposals([{ py: ['Prepaid Expenses'], cy: ['Imaginary'] }, { py: ['Prepaid Expenses'], cy: ['Prepaid Expenses', 'Amounts due from Al Noor Contracting'] }, { py: ['Prepaid Expenses'], cy: ['Prepaid Expenses', 'Amounts due from Al Noor Contracting'] }], f)
  assert.equal(verified.length, 1); assert.equal(rejected.length, 2)
})
test('a genuine difference cannot be cleared', () => {
  const cy2 = [L('1300', 'Prepaid Expenses', 12000), L('1350', 'Amounts due from Al Noor Contracting', 7000), L('1001', 'Cash at Bank - SNB', 5000)]
  const r = reviewOpening({ py, cy: cy2, proposals: [{ py: ['Prepaid Expenses'], cy: ['Prepaid Expenses', 'Amounts due from Al Noor Contracting'], reason: 'split' }] })
  assert.equal(r.resolved, false)
})
test('amount matching finds the grouping without any AI', () => {
  const p = amountMatching(flagsFromCheck(py, cy)); assert.deepEqual(p, [{ py: ['Prepaid Expenses'], cy: ['Prepaid Expenses', 'Amounts due from Al Noor Contracting'], reason: 'The amounts agree exactly.' }])
  assert.equal(reviewOpening({ py, cy, proposals: p }).resolved, true)
})
