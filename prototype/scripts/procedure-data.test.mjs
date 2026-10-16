import test from 'node:test'
import assert from 'node:assert/strict'
import { buildProcedureData, effectiveStatuses, lineTotals } from '../src/utils/procedureData.js'
import { demoPY, demoCorrectedLedgers } from '../src/data/demoTB.js'
import { compactLedgers } from '../src/utils/tbFormat.js'

const py = compactLedgers(demoPY()), cy = compactLedgers(demoCorrectedLedgers())
test('revenue figures come from the trial balances and a big move raises a query draft', () => {
  const t = lineTotals(cy); assert.equal(t.revenue, -2400000)
  const d = buildProcedureData({ cy, py })
  assert.match(d.info['ap-1'][0], /Revenue: SAR 2,400,000 \(last year SAR 2,100,000, \+14.3%\)/)
  assert.match(d.flags['ap-1'], /\+14.3%/)
})
test('a small move raises no draft; benchmarks are not invented', () => {
  const small = cy.map((l) => (l.group === 'revenue' ? { ...l, closing: l.closing * 0.95 } : l))
  const d = buildProcedureData({ cy: small, py })
  assert.equal(d.flags['ap-1'], undefined)
  assert.match(d.info['ap-4'][0], /No industry benchmark/)
})
test('the opening balance step completes itself once the trial balance is approved with its check', () => {
  const d = buildProcedureData({ cy, py, openingCheck: { differences: 0 }, approved: true })
  assert.deepEqual(Object.keys(d.auto).sort(), ['obv-1', 'obv-2', 'obv-3'])
  assert.equal(effectiveStatuses({ 'obv-1': 'In Progress' }, d.auto)['obv-1'], 'Complete')
  const none = buildProcedureData({ cy, py, openingCheck: null, approved: false })
  assert.deepEqual(none.auto, {})
})
test('ratios', () => {
  const d = buildProcedureData({ cy, py })
  assert.ok(d.info['ap-2'].some((x) => /Gross margin/.test(x)))
})
