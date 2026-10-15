// Tests for Process 6.4 (archiving and closure). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { ITEMS, evaluateClosure, markProblem, emptyClosure, archiveRecord, reopenRecord, systemBlock } from '../src/utils/closureCore.js'

const done = (keys) => Object.fromEntries(keys.map((k) => [k, { status: 'done', evidence: 'ref', by: 'x', at: '2026-10-15' }]))
const allKeys = ITEMS.map((i) => i.key)

test('there are 17 steps before archiving (step 18)', () => { assert.equal(ITEMS.length, 17); assert.equal(ITEMS[16].n, 17) })

test('nothing is done by default and every step is listed as a blocker', () => {
  const r = evaluateClosure({})
  assert.equal(r.satisfied, 0); assert.equal(r.ready, false); assert.equal(r.blockers.length, 17)
})

test('steps 1 to 3 are satisfied by what the platform already knows', () => {
  const r = evaluateClosure({ signals: { elSigned: true, hasProposal: true, hasBasicDocs: true } })
  assert.deepEqual(r.items.slice(0, 3).map((i) => i.status), ['done', 'done', 'done']); assert.equal(r.items[0].system, true)
  assert.equal(evaluateClosure({ signals: { elVerified: true } }).items[0].status, 'open') // verified but not signed yet
})

test('a step is done only with evidence', () => {
  assert.equal(evaluateClosure({ record: { items: { tbgl: { status: 'done', evidence: '  ' } } } }).items[3].status, 'open')
  assert.equal(evaluateClosure({ record: { items: { tbgl: { status: 'done', evidence: 'TB v3, GL full' } } } }).items[3].status, 'done')
})

test('only some steps can be not applicable, and only with a reason', () => {
  assert.equal(markProblem('bank', 'na', '', {}), 'Give the reason it does not apply.')
  assert.equal(markProblem('bank', 'na', 'No bank accounts', {}), '')
  assert.match(markProblem('afs', 'na', 'x', {}), /cannot be marked not applicable/)
  const r = evaluateClosure({ record: { items: { afs: { status: 'na', evidence: 'x' } } } })
  assert.equal(r.items.find((i) => i.key === 'afs').status, 'open')
})

test('open adjustments, review comments and queries block their steps', () => {
  const s = { pendingAdjustments: 2, unresolvedReviewComments: 1, queryGate: { ok: false, reasons: ['1 critical query is still open.'] } }
  assert.match(systemBlock('adjustments', s), /2 adjustment/); assert.match(systemBlock('reviewPoints', s), /1 review comment/); assert.match(systemBlock('finalReview', s), /query tracker blocks/)
  assert.match(markProblem('adjustments', 'done', 'all agreed', s), /not approved/)
  const r = evaluateClosure({ record: { items: done(['adjustments']) }, signals: s })
  assert.equal(r.items.find((i) => i.key === 'adjustments').status, 'open') // a stale tick does not survive a new open problem
  assert.ok(r.blockers.some((b) => /adjustments: 2 adjustment/.test(b)))
})

test('ready to archive only when all 17 are satisfied; archiving and reopening', () => {
  const record = { items: done(allKeys), archived: null }
  const r = evaluateClosure({ record })
  assert.equal(r.ready, true); assert.equal(r.satisfied, 17)
  const arch = archiveRecord(record, 'Tariq', '2026-10-15')
  assert.equal(evaluateClosure({ record: arch }).archived, true); assert.equal(evaluateClosure({ record: arch }).ready, false)
  assert.throws(() => reopenRecord(arch, 'Tariq', ' ', '2026-10-16'), /reason is required/)
  const re = reopenRecord(arch, 'Tariq', 'Late audit adjustment', '2026-10-16')
  assert.equal(re.archived, null); assert.equal(re.reopened.length, 1)
  assert.equal(evaluateClosure({ record: emptyClosure() }).ready, false)
})
