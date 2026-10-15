// Tests for Process 6.2 (client query management). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { newQuery, nextNo, isOverdue, daysOverdue, followUpDue, shouldEscalate, closeBlockers, completionGate, sortForAttention, summarize, awaitingReview } from '../src/utils/queriesCore.js'

const mk = (over = {}, qs = []) => ({ ...newQuery({ queries: qs, client: 'c1', clientName: 'Al-Bashir', area: 'Payroll and GOSI', description: 'GOSI variance Sept', owner: 'Fahad', dueDate: '2026-10-10', raisedAt: '2026-10-01', raisedBy: 'Fahad' }), ...over })

test('query numbers are sequential and the tracker fields exist', () => {
  const a = mk(); const b = mk({}, [a])
  assert.equal(a.no, 'QRY-0001'); assert.equal(b.no, 'QRY-0002'); assert.equal(nextNo([a, b]), 'QRY-0003')
  for (const k of ['no', 'clientName', 'area', 'raisedAt', 'description', 'owner', 'dueDate', 'status', 'dateReceived', 'replied', 'replyDate']) assert.ok(k in a, k)
  assert.equal(a.status, 'Open'); assert.equal(a.replied, 'Not replied')
})

test('overdue only while open and unanswered', () => {
  const q = mk()
  assert.equal(isOverdue(q, '2026-10-09'), false); assert.equal(isOverdue(q, '2026-10-14'), true); assert.equal(daysOverdue(q, '2026-10-14'), 4)
  assert.equal(isOverdue({ ...q, replied: 'Replied' }, '2026-10-14'), false); assert.equal(isOverdue({ ...q, status: 'Closed' }, '2026-10-14'), false)
})

test('follow-up is due by priority, and resets after a follow-up', () => {
  const q = mk({ raisedAt: '2026-10-01' })
  assert.equal(followUpDue(q, '2026-10-03'), false); assert.equal(followUpDue(q, '2026-10-04'), true)
  assert.equal(followUpDue({ ...q, priority: 'Critical' }, '2026-10-02'), true)
  assert.equal(followUpDue({ ...q, followUps: [{ date: '2026-10-03', note: 'called' }] }, '2026-10-04'), false)
  assert.equal(followUpDue({ ...q, replied: 'Replied' }, '2026-10-20'), false)
})

test('critical or long-overdue queries should be escalated', () => {
  assert.equal(shouldEscalate(mk({ priority: 'Critical' }), '2026-10-03'), true)
  assert.equal(shouldEscalate(mk({ priority: 'Critical' }), '2026-10-02'), false)
  assert.equal(shouldEscalate(mk(), '2026-10-16'), false); assert.equal(shouldEscalate(mk(), '2026-10-17'), true)
  assert.equal(shouldEscalate(mk({ priority: 'Critical', status: 'Escalated' }), '2026-10-20'), false)
})

test('a query closes only after reply, review, full address and client confirmation', () => {
  const q = mk()
  assert.equal(closeBlockers(q).length, 3) // no reply, not addressed, not confirmed
  const replied = { ...q, replied: 'Replied', replyDate: '2026-10-05' }
  assert.equal(closeBlockers(replied).length, 3)
  assert.deepEqual(closeBlockers({ ...replied, responseReviewed: true, addressed: true, clientConfirmed: true }), [])
  assert.equal(awaitingReview(replied), true); assert.equal(awaitingReview({ ...replied, responseReviewed: true, addressed: true }), false)
})

test('the completion gate blocks on open critical or important queries', () => {
  const crit = mk({ priority: 'Critical' }), high = mk({ priority: 'High', client: 'c1' }), normal = mk({ client: 'c2' })
  let g = completionGate([crit, high, normal], 'c1')
  assert.equal(g.ok, false); assert.equal(g.reasons.length, 3); assert.equal(g.openCritical, 1)
  g = completionGate([{ ...crit, status: 'Closed' }, { ...high, status: 'Closed' }, normal], 'c1')
  assert.equal(g.ok, true)
  assert.equal(completionGate([mk()], 'c1').ok, true) // a normal open query is a warning, not a block
  assert.equal(completionGate([mk()], 'c1').open, 1)
})

test('attention order and summary counts', () => {
  const a = mk({ dueDate: '2026-10-12' }), b = mk({ priority: 'Critical', dueDate: '2026-10-20' }), c = mk({ priority: 'High', dueDate: '2026-10-05' }), d = mk({ status: 'Closed' })
  assert.deepEqual(sortForAttention([a, b, c]).map((q) => q.priority), ['Critical', 'High', 'Normal'])
  const s = summarize([a, b, c, d], '2026-10-14')
  assert.deepEqual([s.open, s.closed, s.critical, s.overdue], [3, 1, 1, 2])
})
