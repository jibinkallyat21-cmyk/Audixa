// Tests for Process 6.1 (file allocation). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyFactors, scoreComplexity, classify, effectiveComplexity, rankCandidates, checklistComplete, checklistMissing, allocationProblems, CHECKLIST, MAX_POINTS } from '../src/utils/allocationCore.js'

const f = (o = {}) => ({ ...emptyFactors(), auditType: 'Proper Audit', turnover: '1to5m', ...o, business: { ...emptyFactors().business, ...(o.business || {}) } })
const exp = (n) => Object.fromEntries(['similarClients', 'auditType', 'industry', 'complicatedAreas', 'technical', 'sameClient'].map((k, i) => [k, i < n]))
const cand = (name, o = {}) => ({ name, seniority: 'Lead', files: 6, highComplexityFiles: 0, dueSoon: 0, reviewDuties: 0, onLeave: false, experience: exp(4), ...o })

test('points: a simple recurring file is Low, a first-year inventory file is High', () => {
  const easy = scoreComplexity(f({ auditType: 'Disclaimer Audit', turnover: 'lt1m', newClient: false }))
  assert.equal(easy.points, 1); assert.equal(easy.complexity, 'Low')
  const hard = scoreComplexity(f({ turnover: '10to50m', firstYear: true, newClient: true, prevIssues: 3, business: { inventory: true, complicatedAreas: true, receivablesPayables: true } }))
  assert.equal(hard.points, 2 + 4 + 5 + 2 + 1 + 2); assert.equal(hard.complexity, 'High')
  assert.equal(MAX_POINTS, 18)
})

test('thresholds', () => { assert.deepEqual([5, 6, 10, 11].map(classify), ['Low', 'Medium', 'Medium', 'High']) })

test('missing audit type or turnover is reported, not guessed', () => {
  const s = scoreComplexity({ ...emptyFactors() })
  assert.deepEqual(s.missing, ['audit type', 'turnover category'])
})

test('an override counts only with a reason', () => {
  const s = scoreComplexity(f())
  assert.equal(effectiveComplexity(s, { value: 'High', reason: 'Group audit with branches' }), 'High')
  assert.equal(effectiveComplexity(s, { value: 'High', reason: ' ' }), s.complexity)
  assert.equal(effectiveComplexity(s, null), s.complexity)
})

test('High files go to the experienced; those below the bar are not eligible', () => {
  const r = rankCandidates({ complexity: 'High', candidates: [cand('Junior', { experience: exp(2), files: 2 }), cand('Senior', { experience: exp(6), files: 9 }), cand('Busy', { experience: exp(6), files: 16, highComplexityFiles: 3 })] })
  assert.equal(r[0].name, 'Senior'); assert.equal(r.find((x) => x.name === 'Junior').eligible, false)
  assert.ok(r.find((x) => x.name === 'Busy').notes.some((n) => /Already carries 16 files/.test(n)))
})

test('Low files go to the lead with capacity, even if less experienced', () => {
  const r = rankCandidates({ complexity: 'Low', candidates: [cand('Newer', { experience: exp(1), files: 3 }), cand('Experienced', { experience: exp(6), files: 13 })] })
  assert.equal(r[0].name, 'Newer')
})

test('continuity is a bonus; a lead on leave is never eligible', () => {
  const base = [cand('A', { files: 8 }), cand('B', { files: 8 })]
  assert.equal(rankCandidates({ complexity: 'Medium', candidates: base, prevNames: ['B'] })[0].name, 'B')
  const r = rankCandidates({ complexity: 'Medium', candidates: [cand('A', { onLeave: true }), cand('B')], prevNames: ['A'] })
  assert.equal(r[0].name, 'B'); assert.equal(r.find((x) => x.name === 'A').eligible, false)
})

test('the final review has the eleven Rule Book items and gates the allocation', () => {
  assert.equal(CHECKLIST.length, 11)
  const all = Object.fromEntries(CHECKLIST.map(([k]) => [k, true]))
  assert.equal(checklistComplete(all), true); assert.equal(checklistComplete({ ...all, workload: false }), false)
  assert.deepEqual(checklistMissing({ ...all, workload: false }), ['Current workload reviewed'])
  const s = scoreComplexity(f({ newClient: false, prevLead: 'Fahad' }))
  assert.deepEqual(allocationProblems({ factors: f({ newClient: false, prevLead: 'Fahad' }), score: s, lead: 'Fahad', checklist: all }), [])
  assert.equal(allocationProblems({ factors: f(), score: s, lead: '', checklist: {} }).length, 2)
  assert.match(allocationProblems({ factors: f({ newClient: false }), score: s, lead: 'X', checklist: all })[0], /previous-year team/)
})
