import test from 'node:test'
import assert from 'node:assert/strict'
import { unplaced, toRequest, checkProposals, applyGroups, ledgerKey } from '../src/utils/ledgerReview.js'

const L = [
  { code: '1001', name: 'Cash at Bank', group: 'cash', closing: 100 },
  { code: '1350', name: 'Amounts due from Al Noor Contracting', group: 'unmapped', closing: 6000 },
  { code: '7770', name: 'مصاريف متنوعة', group: 'unmapped', closing: 900 },
  { code: 'SUSP', name: 'Intercompany difference', group: 'unmapped', closing: 5, isSuspense: true },
]
test('only unplaced real ledgers go to the AI, with amounts as they are', () => {
  assert.equal(unplaced(L).length, 2)
  assert.deepEqual(toRequest(L)[0], { code: '1350', name: 'Amounts due from Al Noor Contracting', amount: 6000 })
})
test('proposals are kept only for unplaced ledgers and real groups, one each', () => {
  const kept = checkProposals([
    { name: 'Amounts due from Al Noor Contracting', group: 'prepayments', reason: 'receivable from a third party' },
    { name: 'Amounts due from Al Noor Contracting', group: 'cash', reason: 'duplicate' },
    { name: 'Cash at Bank', group: 'cash', reason: 'already placed' },
    { name: 'مصاريف متنوعة', group: 'not-a-group', reason: 'x' },
    { name: 'مصاريف متنوعة', group: null, reason: 'unsure' },
  ], L)
  assert.equal(kept.length, 1); assert.equal(kept[0].group, 'prepayments'); assert.equal(kept[0].label, 'Prepayments and other receivables')
})
test('accepting changes the group only', () => {
  const out = applyGroups(L, { [ledgerKey(L[1])]: 'prepayments', [ledgerKey(L[2])]: 'bogus' })
  assert.equal(out[1].group, 'prepayments'); assert.equal(out[1].closing, 6000); assert.equal(out[2].group, 'unmapped'); assert.equal(out[0], L[0])
})
