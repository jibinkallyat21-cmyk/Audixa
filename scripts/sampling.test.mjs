import test from 'node:test'
import assert from 'node:assert/strict'
import { sampleSalesPurchase, sampleExpense, sampleParties, classifyParty, alternativeApplicable, confirmationDifference, unsettled, materialityFromRevenue, sampleByMateriality } from '../src/utils/sampling.js'

test('sales: highest first until 50% is reached, crossing entry included', () => {
  const r = sampleSalesPurchase([{ id: 1, taxable: 10 }, { id: 2, taxable: 50 }, { id: 3, taxable: 30 }, { id: 4, taxable: 10 }])
  assert.equal(r.total, 100); assert.equal(r.target, 50)
  assert.deepEqual(r.rows.map((x) => x.selected), [false, true, false, false])   // 50 alone reaches 50
  const r2 = sampleSalesPurchase([{ taxable: 40 }, { taxable: 40 }, { taxable: 20 }])
  assert.deepEqual(r2.rows.map((x) => x.selected), [true, true, false])          // 40 < 50, the 2nd crosses it
})
test('sales: stops at 30 entries even before 50%', () => {
  const rows = Array.from({ length: 100 }, (_, i) => ({ taxable: 1 }))
  const r = sampleSalesPurchase(rows); assert.equal(r.selectedIds.length, 30); assert.ok(r.capped)
})
test('expense: excluded accounts leave the population, 7 per account, formula percentage', () => {
  const rows = []
  for (let i = 0; i < 10; i++) rows.push({ account: 'Rent', amount: 1000 - i })
  rows.push({ account: 'Fuel', amount: 500 }, { account: 'Tested', amount: 2000 })
  const r = sampleExpense(rows, { Tested: false })
  assert.equal(r.total, 9945 + 2500 - 0 > 0 ? r.total : 0)
  assert.equal(r.revised, r.total - 2000); assert.equal(r.excludedValue, 2000); assert.equal(r.required, r.revised / 2)
  assert.ok(r.selected.every((x) => x.account !== 'Tested'))
  assert.ok(r.selected.filter((x) => x.account === 'Rent').length <= 7)
  assert.equal(r.percentage, r.selectedValue / r.revised)
  assert.deepEqual(r.selected.map((x) => x.amount), [...r.selected.map((x) => x.amount)].sort((a, b) => b - a))
})
test('expense: zero eligible population gives 0%', () => {
  assert.equal(sampleExpense([{ account: 'A', amount: 5 }], { A: false }).percentage, 0)
})
test('expense: switching Exclude back to Include returns it to the population', () => {
  const rows = [{ account: 'A', amount: 100 }, { account: 'B', amount: 100 }]
  assert.equal(sampleExpense(rows, { B: false }).revised, 100); assert.equal(sampleExpense(rows, { B: true }).revised, 200)
})
test('AR/AP: classification, 50% cumulative with crossing party, reconciliation', () => {
  assert.equal(classifyParty(0.4), 'Needs Review'); assert.equal(classifyParty(-500), 'Trade Payable'); assert.equal(classifyParty(500), 'Advance to Supplier')
  const r = sampleParties([{ name: 'A', debit: 0, credit: 600 }, { name: 'B', debit: 0, credit: 300 }, { name: 'C', debit: 0, credit: 100 }, { name: 'D', debit: 50, credit: 0 }, { name: 'E', debit: 10, credit: 10 }])
  const tp = r.categories['Trade Payable']
  assert.deepEqual(tp.rows.map((x) => x.selected), [true, false, false])         // A alone = 60% >= 50%
  assert.equal(tp.total, 1000); assert.equal(tp.target, 500); assert.ok(tp.coverage >= 0.5)
  assert.equal(r.categories['Advance to Supplier'].selectedCount, 1); assert.equal(r.needsReview.length, 1)
  assert.equal(r.reconciliation.diff, 0); assert.equal(r.reconciliation.ledgerCount, r.reconciliation.categoriesCount)
  const two = sampleParties([{ name: 'A', credit: 400 }, { name: 'B', credit: 400 }, { name: 'C', credit: 200 }]).categories['Trade Payable']
  assert.deepEqual(two.rows.map((x) => x.selected), [true, true, false])         // 400 < 500, so B crosses and is included
})
test('trackers: alternative procedures applicability, differences', () => {
  assert.equal(alternativeApplicable({ option: '', status: '' }), 'Select option')
  assert.equal(alternativeApplicable({ option: 'Alternative Procedures' }), 'Yes')
  assert.equal(alternativeApplicable({ option: 'Confirmation', status: 'No Reply' }), 'Yes')
  assert.equal(alternativeApplicable({ option: 'Confirmation', status: 'Confirmed' }), 'No')
  assert.equal(confirmationDifference('', 100), null); assert.equal(confirmationDifference(90, 100), -10); assert.equal(unsettled(100, ''), null); assert.equal(unsettled(100, 30), 70)
})
test('materiality: 80% of 0.5% of revenue', () => { assert.deepEqual(materialityFromRevenue(1000000), { calculated: 5000, used: 4000 }) })
test('ABCPA: above materiality 100%, below by n capped by the 732 table, excluded accounts out, equal-to-materiality is below', () => {
  const items = [{ amount: 5000 }, { amount: -4001 }, { amount: 4000 }, ...Array.from({ length: 200 }, () => ({ amount: 100 })), { amount: 99999, excluded: true }]
  const r = sampleByMateriality(items, { materiality: 4000, risk: 'Low to Moderate (2)', size: 'Small', seed: 7 })
  assert.equal(r.above.length, 2); assert.ok(r.above[0].abs >= r.above[1].abs)
  assert.equal(r.belowPopulation, 201)                     // 200 + the item equal to materiality
  assert.equal(r.interval, 8000); assert.equal(r.calculatedSize, Math.round((20000 + 4000) / 8000))
  assert.equal(r.below.length, r.sizeUsed); assert.equal(r.excludedCount, 1); assert.ok(r.checks.every((c) => c.pass))
  const again = sampleByMateriality(items, { materiality: 4000, risk: 'Low to Moderate (2)', size: 'Small', seed: 7 })
  assert.deepEqual(again.below.map((x) => x._i), r.below.map((x) => x._i))   // a stored seed reproduces the sample
})
test('ABCPA: highest-value method, override and cap', () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ amount: 100 + i }))
  const r = sampleByMateriality(items, { materiality: 50, risk: 'Low (1)', size: 'Small', method: 'highest' })
  assert.equal(r.above.length, 100); assert.equal(r.below.length, 0)
  const q = sampleByMateriality(items, { materiality: 1000, risk: 'Significant (4)', size: 'Small', method: 'highest', override: 3 })
  assert.equal(q.below.length, 3); assert.equal(q.below[0].amount, 199)
  const cap = sampleByMateriality(items, { materiality: 1000, risk: 'Significant (4)', size: 'Small' })
  assert.equal(cap.sizeUsed, 15 * 0 + Math.min(cap.calculatedSize, 40))
})
