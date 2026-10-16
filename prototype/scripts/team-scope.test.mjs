import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTeamScope, relativeTime } from '../src/utils/teamScope.js'
import { demoPY, demoCorrectedLedgers, demoCY } from '../src/data/demoTB.js'
import { compactLedgers } from '../src/utils/tbFormat.js'

const file = { slug: 'kingdom-retail', client: 'Kingdom Retail Holdings LLC', auditor: 'ABCPA', statutoryDue: '30 Apr 2027', isDemo: true }
const now = new Date('2026-10-16T10:00:00Z')
const cyFlagged = compactLedgers(demoCY(demoPY()).map((l) => ({ ...l, closing: l.opening + l.debit - l.credit })))

test('a freshly loaded demo file shows only its own work', () => {
  const s = buildTeamScope({ file, tb: { status: 'Submitted', ledgers: cyFlagged, pyLedgers: compactLedgers(demoPY()) }, issued: {}, queries: [], log: [], now })
  assert.equal(s.files.length, 1)
  assert.equal(s.stats.totalActive, 1)
  assert.ok(s.counts.flags > 0)
  assert.equal(s.tasks[0].priority, 'URGENT')
  assert.ok(s.tasks.every((t) => t.client === file.client))
  assert.equal(s.meetings.length, 0); assert.equal(s.conversations.length, 0)
  assert.equal(s.actionCards.find((c) => c.id === 'ai-flags').count, s.counts.flags)
})
test('with corrected opening balances nothing is flagged', () => {
  const s = buildTeamScope({ file, tb: { status: 'Submitted', ledgers: compactLedgers(demoCorrectedLedgers()), pyLedgers: compactLedgers(demoPY()) }, issued: {}, queries: [], log: [], now })
  assert.equal(s.counts.flags, 0)
})
test('queries and documents are counted from the real lists, other clients are ignored', () => {
  const q = (o) => ({ id: o.id, client: o.client, clientName: 'x', status: 'Open', replied: 'Not replied', dueDate: '2026-10-01', priority: 'Normal', ...o })
  const issued = { 'kingdom-retail': { itemCount: 3, categories: [{ items: [{ ref: 'A', status: 'Uploaded Processing' }, { ref: 'B', status: 'Accepted' }, { ref: 'C', status: 'Pending' }] }] } }
  const s = buildTeamScope({ file, tb: { status: 'Approved' }, issued, queries: [q({ id: '1', client: 'kingdom-retail' }), q({ id: '2', client: 'other' })], log: [], now })
  assert.equal(s.counts.docsToReview, 1)
  assert.equal(s.counts.openQueries, 1)
  assert.ok(s.tasks.some((t) => /overdue/.test(t.description)))
})
test('activity comes from this client\'s audit log only', () => {
  const log = [{ id: 'a', at: '2026-10-16T09:30:00Z', clientName: file.client, category: 'client-response', title: 'Trial balance uploaded', description: 'd' }, { id: 'b', at: '2026-10-16T09:00:00Z', clientName: 'Other', category: 'general', title: 'x' }]
  const s = buildTeamScope({ file, tb: null, issued: {}, queries: [], log, now })
  assert.equal(s.activity.length, 1); assert.equal(s.activity[0].timestamp, '30 mins ago')
  assert.equal(s.notifications.length, 1); assert.equal(s.auditTrail.length, 1)
})
test('relativeTime', () => { assert.equal(relativeTime('2026-10-15T10:00:00Z', now), 'Yesterday') })

import { withDemoDocuments } from '../src/utils/demoDocuments.js'
test('demo documents fill only what is waiting for the client', () => {
  const rec = { categories: [{ items: [{ ref: 'A', status: 'Pending Client' }, { ref: 'B', status: 'Accepted' }, { ref: 'C', status: 'Rejected', alert: 'x' }, { ref: 'D', status: 'Under Review' }] }] }
  const { rec: out, count } = withDemoDocuments(rec)
  assert.equal(count, 2)
  assert.deepEqual(out.categories[0].items.map((i) => i.status), ['Uploaded Processing', 'Accepted', 'Uploaded Processing', 'Under Review'])
  assert.equal(out.categories[0].items[2].alert, '')
})
