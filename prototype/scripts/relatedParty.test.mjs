import test from 'node:test'
import assert from 'node:assert/strict'
import { demoCorrectedLedgers } from '../src/data/demoTB.js'
import { clientRelatedTransactions, flagTransactions, pickRelated, testedElsewhere } from '../src/utils/relatedParty.js'
import { accrualParts, vouchingParts, fixedAssetParts, checkEvidence, demoDocs } from '../src/utils/evidence.js'
import { clientAccruals, accrualTie } from '../src/utils/accruals.js'
const led = demoCorrectedLedgers(); const txs = clientRelatedTransactions(led)
test('population has ledger-linked and listed transactions', () => { assert.ok(txs.length > 20); assert.ok(txs.some((t) => t.ref.startsWith('RPT-'))); assert.ok(txs.some((t) => t.ref.startsWith('INV-'))) })
test('flags: round, duplicate, vague, year end', () => {
  const f = flagTransactions(txs, { materiality: 9600 }); const by = (ref) => f.find((t) => t.ref === ref)
  assert.ok(by('RPT-2025-0001').flags.some((x) => x.label === 'Round amount'))
  assert.ok(by('RPT-2025-0006').flags.some((x) => /twice/.test(x.label)))
  assert.ok(by('RPT-2025-0005').flags.some((x) => x.label === 'Vague description'))
  assert.ok(by('RPT-2025-0008').flags.some((x) => x.label === 'Close to the year end'))
})
test('picks the numbers asked, flagged first, deterministic', () => {
  const r = pickRelated(txs, { materiality: 9600, nAbove: 5, nBelow: 3 }); const again = pickRelated(txs, { materiality: 9600, nAbove: 5, nBelow: 3 })
  assert.equal(r.above.length, 5); assert.equal(r.below.length, 3); assert.deepEqual(r.above.map((t) => t.ref), again.above.map((t) => t.ref))
  assert.ok(r.above.every((t) => Math.abs(t.amount) >= 9600)); assert.ok(r.below.every((t) => Math.abs(t.amount) < 9600))
  const flaggedAbove = r.counts.flagged; assert.ok(flaggedAbove > 0)
  assert.equal(pickRelated(txs, { materiality: 9600, nAbove: 0, nBelow: 0 }).above.length, 0)
})
test('finds a transaction tested in another area, not its own', () => {
  const t = txs.find((x) => x.ref.startsWith('INV-'))
  const rec = { categories: [{ id: 'smp-revenue', title: 'Samples: Revenue', group: 'samples', area: 'Revenue', items: [{ ref: 'SMP-REVENUE-02', status: 'Pending Client', row: { ref: t.ref, date: t.date, amount: t.amount } }] }, { id: 'smp-related', title: 'Samples: Related', group: 'samples', area: 'Related parties', items: [{ ref: 'SMP-RELATED-01', row: { ref: t.ref } }] }] }
  const r = testedElsewhere(t, rec); assert.equal(r.length, 1); assert.equal(r[0].itemRef, 'SMP-REVENUE-02'); assert.equal(r[0].area, 'Revenue')
  assert.equal(testedElsewhere(t, { categories: [] }).length, 0)
})
test('accruals tie to the trial balance and evidence parts', () => {
  const l = clientAccruals(led); assert.equal(accrualTie(l, led).difference, 0)
  assert.equal(accrualParts().length, 3); assert.equal(fixedAssetParts().length, 2)
  assert.equal(vouchingParts('sales').find((p) => p.part === 'payment').need, 'If applicable'); assert.equal(vouchingParts('expense').find((p) => p.part === 'payment').need, 'Required')
})
test('sales invoice without a payment receipt is still supported', () => {
  const line = { amount: 1000, vatPct: 15, date: '2025-05-01', vendor: 'Al Noor' }
  const docs = demoDocs([line, line, line], 'Co', () => vouchingParts('sales'))
  assert.equal(checkEvidence(line, docs[1], 'Co', vouchingParts('sales')).status, 'Supported')
  assert.equal(checkEvidence(line, docs[0], 'Co', vouchingParts('sales')).status, 'Supported and paid')
})
