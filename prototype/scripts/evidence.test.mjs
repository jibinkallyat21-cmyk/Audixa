import test from 'node:test'
import assert from 'node:assert/strict'
import { prepaidParts, standardName, checkPrepaidEvidence, demoPrepaidDocs } from '../src/utils/evidence.js'
const item = { category: 'Insurance – medical', particulars: 'Medical policy MP-8890', amount: 12000, vatPct: 15, start: '2025-10-01', end: '2026-09-30' }
const co = 'Kingdom Retail Holdings LLC'
test('parts per category', () => {
  assert.deepEqual(prepaidParts('Rent').map((p) => p.part), ['agreement', 'invoice', 'payment'])
  assert.deepEqual(prepaidParts('Subscriptions').map((p) => p.part), ['invoice', 'payment'])
  assert.equal(prepaidParts('Iqama, work permit & visa fees')[0].part, 'receipt')
})
test('standard name ignores the random upload name', () => assert.equal(standardName('Prepaid', 'Medical policy MP-8890', 'invoice', 'IMG_4471.PDF'), 'Prepaid - Medical policy MP-8890 - Tax invoice.pdf'))
test('complete, partial and mismatching sets', () => {
  const [a, b, c] = demoPrepaidDocs([item, item, item], co)
  assert.equal(checkPrepaidEvidence(item, a, co).status, 'Supported and paid')
  assert.equal(checkPrepaidEvidence(item, b, co).status, 'Supported, payment not shown')
  assert.equal(checkPrepaidEvidence(item, c, co).status, 'Mismatch')
  assert.equal(checkPrepaidEvidence(item, [], co).status, 'Not received')
})
test('wrong company or wrong payment amount is a mismatch', () => {
  const [a] = demoPrepaidDocs([item], co)
  assert.equal(checkPrepaidEvidence(item, a, 'Other LLC').status, 'Mismatch')
  const bad = a.map((d) => (d.part === 'payment' ? { ...d, fields: { ...d.fields, paid: 5 } } : d))
  assert.equal(checkPrepaidEvidence(item, bad, co).status, 'Mismatch')
})
