// Tests for Process 6.3 helpers (audit log). Run: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, validateEntry, filterLog, toCsv } from '../src/utils/auditLogCore.js'

const e = (o) => ({ id: 'x', at: '2026-10-14T09:00:00.000Z', client: 'c1', clientName: 'Al-Bashir', category: 'general', title: 'T', description: '', extra: {}, auto: true, user: 'Fahad', role: 'Audit Lead', ...o })

test('thirteen categories plus the general log cover the Rule Book list', () => {
  assert.equal(CATEGORIES.length, 14)
  for (const id of ['allocation', 'work', 'doc-request', 'client-response', 'query', 'evidence', 'change', 'review-comment', 'adjustment', 'reference', 'pending', 'decision', 'responsibility']) assert.ok(CATEGORIES.some((c) => c.id === id), id)
})

test('manual entries are validated per category', () => {
  assert.deepEqual(validateEntry('general', { title: 'ok' }), [])
  assert.deepEqual(validateEntry('general', { title: ' ' }), ['Enter a short title.'])
  const adj = validateEntry('adjustment', { title: 'Accrual', extra: { amount: 1000 } })
  assert.deepEqual(adj, ['Reason is required.', 'Approval status is required.'])
  assert.deepEqual(validateEntry('adjustment', { title: 'Accrual', extra: { amount: 1000, reason: 'Unrecorded rent', approval: 'Proposed' } }), [])
  assert.ok(validateEntry('responsibility', { title: 'TB', extra: {} }).length === 2)
})

test('filter by client, category, text and date', () => {
  const list = [e({ id: '1' }), e({ id: '2', client: 'c2', category: 'query', title: 'GOSI variance' }), e({ id: '3', at: '2026-09-01T00:00:00.000Z', category: 'query' })]
  assert.deepEqual(filterLog(list, { client: 'c1' }).map((x) => x.id), ['1', '3'])
  assert.deepEqual(filterLog(list, { category: 'query' }).map((x) => x.id), ['2', '3'])
  assert.deepEqual(filterLog(list, { q: 'gosi' }).map((x) => x.id), ['2'])
  assert.deepEqual(filterLog(list, { from: '2026-10-01' }).map((x) => x.id), ['1', '2'])
  assert.deepEqual(filterLog(list, { to: '2026-09-30' }).map((x) => x.id), ['3'])
})

test('CSV export quotes commas, quotes and new lines', () => {
  const csv = toCsv([e({ title: 'He said "hi", ok', extra: { amount: 5, reason: 'x' }, auto: false })])
  const lines = csv.split('\n')
  assert.equal(lines[0].split(',')[0], 'Date and time')
  assert.match(lines[1], /"He said ""hi"", ok"/); assert.match(lines[1], /Manual/); assert.match(lines[1], /amount: 5; reason: x/)
})
