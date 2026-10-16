import test from 'node:test'
import assert from 'node:assert/strict'
import { withSampleRequirements } from '../src/utils/sampleRequests.js'
import { overdueItems, withReminders, sampleBlocks, countsOf, fileSummary } from '../src/utils/sampleTracking.js'
import { AREAS } from '../src/utils/auditAreas.js'

const t0 = '2026-10-10T09:00:00Z'
const mk = () => {
  let rec = { categories: [{ id: 'x', title: 'X', items: [{ ref: 'x-01', text: 'doc', status: 'Accepted' }] }] }
  rec = withSampleRequirements(rec, { area: 'sales', label: 'Sales', group: 'cutoff', approvedBy: 'Fahad', at: t0, samples: [{ key: 'a', text: 'a', row: { amount: 1 }, subgroup: 'After year end' }, { key: 'b', text: 'b', subgroup: 'After year end' }] }).rec
  rec = withSampleRequirements(rec, { area: 'ARAP', label: 'AR / AP', approvedBy: 'Fahad', at: t0, samples: [{ key: 'c', text: 'c', subgroup: 'Trade Receivable' }, { key: 'd', text: 'd', subgroup: 'Trade Payable' }] }).rec
  return rec
}
test('sent items carry who approved and when', () => { const c = mk().categories.find((x) => x.id === 'cut-sales'); assert.equal(c.items[0].sentBy, 'Fahad'); assert.equal(c.items[0].sentAt, t0); assert.equal(c.group, 'cutoff') })
test('overdue = still owed after N days; a reminder restarts the clock', () => {
  const rec = mk(); const now = new Date('2026-10-16T09:00:00Z')
  assert.equal(overdueItems(rec, now, 3).length, 4); assert.equal(overdueItems(rec, now, 10).length, 0)
  const { rec: r2, count } = withReminders(rec, ['CUT-SALES-01', 'SMP-ARAP-01'], '2026-10-15T09:00:00Z'); assert.equal(count, 2)
  assert.equal(overdueItems(r2, now, 3).length, 2); assert.equal(overdueItems(r2, now, 3).every((i) => !i.remindedAt), true)
  r2.categories.find((c) => c.id === 'cut-sales').items[1].status = 'Uploaded Processing'
  assert.equal(overdueItems(r2, now, 3).length, 1)
})
test('counts and blocks', () => {
  const b = sampleBlocks(mk(), 'cutoff'); assert.equal(b.length, 1); assert.equal(b[0].counts.waiting, 2)
  assert.deepEqual(countsOf([{ status: 'Accepted' }, { status: 'Rejected' }, { status: 'Uploaded Processing' }, { status: 'Pending Client' }]), { total: 4, waiting: 1, uploaded: 1, accepted: 1, rejected: 1 })
})
test('file summary: receivable and payable samples are told apart, attention list says what needs doing', () => {
  const s = fileSummary({ areas: AREAS, ledgers: [], rec: mk(), statuses: { 'area:cash.bank-cutoff': 'Complete' }, queries: [{ status: 'Open', replied: 'Replied' }], now: new Date('2026-10-16T09:00:00Z') })
  assert.equal(s.rows.find((r) => r.id === 'receivables').sent, 1); assert.equal(s.rows.find((r) => r.id === 'payables').sent, 1); assert.equal(s.rows.find((r) => r.id === 'revenue').sent, 2)
  assert.equal(s.procedures.done, 1); assert.ok(s.attention.some((a) => /waited more than 3/.test(a))); assert.ok(s.attention.some((a) => /waiting for your review/.test(a)))
})
