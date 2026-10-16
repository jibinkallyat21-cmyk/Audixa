import test from 'node:test'
import assert from 'node:assert/strict'
import { scoreLead, factorA, factorD, bandOf, rankLeads, makeOverride, appendHistory, historyEntry, contactBy, addWorkingDays, weightsValid, DEFAULT_WEIGHTS } from '../src/utils/leadScoring.js'

const asOf = new Date('2026-10-16')
test('factor ratings follow the definition', () => {
  assert.deepEqual([null, 0, 1, 2, 3, 4, 5, 9].map(factorA), [1, 1, 2, 3, 4, 4, 5, 5])
  assert.deepEqual([0, 1, 2, 3, 5].map(factorD), [1, 3, 4, 5, 5])
})
test('the worked example scores 76 and is Band A', () => {
  const r = scoreLead({ relationshipSince: 2023, managerRating: 4, satisfaction: 4, priorAuditByAnalytix: true, otherServices: ['VAT'] }, { asOf })
  assert.equal(r.factors.A.rating, 4); assert.equal(r.factors.D.rating, 3); assert.equal(r.score, 76); assert.equal(r.band, 'A')
  assert.deepEqual([r.factors.A.points, r.factors.B.points, r.factors.C.points, r.factors.D.points], [20, 24, 20, 12])
})
test('bands: 75 and above A, 50 to 74 B, below 50 C', () => { assert.deepEqual([100, 75, 74.9, 50, 49.9, 0].map(bandOf), ['A', 'A', 'B', 'B', 'C', 'C']) })
test('missing manager rating is neutral 3 and flagged; a new lead is A1 C3 D1', () => {
  const r = scoreLead({ relationshipSince: null, managerRating: null, otherServices: ['VAT', 'Zakat', 'Payroll'] }, { asOf })
  assert.deepEqual([r.factors.A.rating, r.factors.B.rating, r.factors.C.rating, r.factors.D.rating], [1, 3, 3, 1]); assert.ok(r.flags.includes('Manager input pending'))
  assert.equal(r.score, 5 + 18 + 15 + 4)
})
test('no previous audit by Analytix: satisfaction is neutral', () => {
  const r = scoreLead({ relationshipSince: 2020, managerRating: 5, satisfaction: 1, priorAuditByAnalytix: false, otherServices: [] }, { asOf }); assert.equal(r.factors.C.rating, 3)
})
test('weights can change and must total 100', () => {
  assert.ok(weightsValid(DEFAULT_WEIGHTS)); assert.ok(!weightsValid({ A: 30, B: 30, C: 25, D: 20 }))
  const r = scoreLead({ relationshipSince: 2015, managerRating: 5, satisfaction: 5, priorAuditByAnalytix: true, otherServices: ['a', 'b', 'c'] }, { asOf, weights: { A: 10, B: 40, C: 30, D: 20 } }); assert.equal(r.score, 100)
})
test('ranking: excludes lost / do-not-contact; ties by previous fee then earlier deadline', () => {
  const mk = (id, score, extra = {}) => ({ lead: { id, status: 'Open', ...extra }, result: { score } })
  const out = rankLeads([mk('a', 80), mk('lost', 99, { status: 'Lost' }), mk('dnc', 99, { doNotContact: true }), mk('b', 70, { prevProposal: { fee: 5000 }, statutoryDeadline: '2026-12-01' }), mk('c', 70, { prevProposal: { fee: 9000 }, statutoryDeadline: '2026-12-30' }), mk('d', 70, { prevProposal: { fee: 9000 }, statutoryDeadline: '2026-11-01' }), mk('e', 70, { turnover: 1000 })])
  assert.deepEqual(out.map((x) => x.lead.id), ['a', 'd', 'c', 'b', 'e'])
})
test('override needs a reason, keeps the original and is used as the score', () => {
  assert.throws(() => makeOverride({ original: 60, score: 80, reason: '  ' }), /reason/); assert.throws(() => makeOverride({ original: 60, score: 120, reason: 'x' }), /between/)
  const o = makeOverride({ original: 60, score: 80, reason: 'Signed verbally', by: 'FO Manager' }); const r = scoreLead({ managerRating: 3, relationshipSince: 2024, override: o }, { asOf })
  assert.equal(r.score, 80); assert.equal(r.computed === 80, false); assert.equal(r.overridden, true); assert.equal(o.original, 60)
})
test('history retains every change and skips an identical repeat', () => {
  const a = historyEntry({ score: 60, computed: 60, band: 'B', overridden: false }, 'sync', '1'), b = historyEntry({ score: 76, computed: 76, band: 'A', overridden: false }, 'rating', '2')
  let h = appendHistory([], a); h = appendHistory(h, a); h = appendHistory(h, b); assert.equal(h.length, 2); assert.equal(h[0].score, 60)
})
test('contact deadlines in working days', () => {
  assert.equal(contactBy('C'), null); assert.equal(addWorkingDays(new Date('2026-10-12'), 2).toISOString().slice(0, 10), '2026-10-14')
  assert.ok(contactBy('A', new Date('2026-10-15')) > new Date('2026-10-15'))
})
