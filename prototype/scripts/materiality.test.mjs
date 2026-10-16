import test from 'node:test'
import assert from 'node:assert/strict'
import { demoCorrectedLedgers } from '../src/data/demoTB.js'
import { benchmarks, materialityRows, sampleMateriality } from '../src/utils/materiality.js'
test('benchmarks from the trial balance and the percentages applied', () => {
  const led = demoCorrectedLedgers(); const b = benchmarks(led)
  assert.equal(b.revenue, 2400000); assert.ok(b.assets > 0); assert.ok(Math.abs(b.income) > 0)
  const rows = materialityRows(b); assert.deepEqual(rows.map((r) => r.pct), [1, 0.5, 1, 5]); assert.equal(rows[0].amount, 24000)
  assert.equal(materialityRows(b, { revenue: 0.4 })[0].outOfRange, true); assert.equal(materialityRows(b, { revenue: 0.75 })[0].amount, 18000)
  assert.equal(sampleMateriality(24000), 19200)
})
test('a basis at or below zero is not usable', () => { const r = materialityRows({ revenue: 100, assets: 0, equity: -5, income: 10 }); assert.equal(r[1].amount, null); assert.equal(r[2].amount, null); assert.equal(r[3].amount, 0.5) })
