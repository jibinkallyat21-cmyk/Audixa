// Tracking what was sent to the client from the sampling and cut-off tools: counts per area, what is overdue, reminders, and the figures for the file summary.
// Pure functions.
export const RECEIVED = ['Uploaded Processing', 'Under Review', 'Accepted']
export const WAITING = ['Pending Client', 'Rejected', 'Action Required']
const DAY = 86400000
const days = (from, now) => Math.floor((now.getTime() - new Date(from).getTime()) / DAY)

export function countsOf(items) {
  return { total: items.length, waiting: items.filter((i) => WAITING.includes(i.status) && i.status !== 'Rejected').length, uploaded: items.filter((i) => ['Uploaded Processing', 'Under Review'].includes(i.status)).length, accepted: items.filter((i) => i.status === 'Accepted').length, rejected: items.filter((i) => i.status === 'Rejected').length }
}
// One block per area for the samples and the cut-off items.
export function sampleBlocks(rec, group) {
  return (rec?.categories || []).filter((c) => c.group === group).map((c) => ({ ...c, counts: countsOf(c.items) }))
}
// Items the client still owes (not uploaded, or rejected and not re-uploaded) for more than `after` days since they were sent or last reminded.
export function overdueItems(rec, now = new Date(), after = 3) {
  return (rec?.categories || []).filter((c) => c.group).flatMap((c) => c.items.filter((i) => WAITING.includes(i.status) && i.sentAt && days(i.remindedAt || i.sentAt, now) >= after).map((i) => ({ ...i, area: c.title, daysWaiting: days(i.sentAt, now) })))
}
export function withReminders(rec, refs, at = new Date().toISOString()) {
  const set = new Set(refs); let n = 0
  const categories = rec.categories.map((c) => ({ ...c, items: c.items.map((i) => { if (!set.has(i.ref)) return i; n++; return { ...i, remindedAt: at, reminders: (i.reminders || 0) + 1 } }) }))
  return { rec: { ...rec, categories }, count: n }
}

// The figures for the one-page file summary the Team Lead looks at.
export function fileSummary({ areas, ledgers, rec, statuses, queries = [], tb = null, now = new Date(), overdueAfter = 3 }) {
  const items = (rec?.categories || []).flatMap((c) => c.items)
  const req = { total: items.length, received: items.filter((i) => RECEIVED.includes(i.status)).length, accepted: items.filter((i) => i.status === 'Accepted').length, rejected: items.filter((i) => i.status === 'Rejected').length }
  const sc = (g) => countsOf((rec?.categories || []).filter((c) => c.group === g).flatMap((c) => c.items))
  const open = queries.filter((q) => q.status !== 'Closed'); const awaiting = open.filter((q) => q.replied === 'Replied' && !(q.responseReviewed && q.addressed))
  const overdue = overdueItems(rec, now, overdueAfter)
  const rows = areas.map((a) => {
    const led = ledgers.filter((l) => a.groups.includes(l.group) && (Math.abs(l.closing) > 0.004 || Math.abs(l.opening) > 0.004))
    const done = a.procedures.filter((p) => statuses[`area:${a.id}.${p.id}`] === 'Complete').length
    const started = a.procedures.filter((p) => ['In Progress', 'Complete'].includes(statuses[`area:${a.id}.${p.id}`])).length
    const ci = (rec?.categories || []).filter((c) => c.group && (a.sampleAreas || []).includes(c.area)).flatMap((c) => c.items.filter((i) => c.area !== 'ARAP' || !a.subMatch || a.subMatch.test(i.subgroup || '')))
    return { id: a.id, label: a.label, balance: Math.round(led.reduce((n, l) => n + l.closing, 0) * 100) / 100, accounts: led.length, done, started, total: a.procedures.length, sent: ci.length, waiting: ci.filter((i) => WAITING.includes(i.status)).length, rejected: ci.filter((i) => i.status === 'Rejected').length }
  })
  const attention = []
  if (tb && tb.status === 'Submitted') attention.push('The trial balance is waiting for approval.')
  if (req.rejected) attention.push(`${req.rejected} document(s) were rejected and are waiting for the client to upload again.`)
  if (overdue.length) attention.push(`${overdue.length} sample or cut-off item(s) have waited more than ${overdueAfter} day(s) for the client.`)
  if (awaiting.length) attention.push(`${awaiting.length} client reply(ies) to queries are waiting for your review.`)
  if (open.length && !awaiting.length) attention.push(`${open.length} quer${open.length === 1 ? 'y is' : 'ies are'} still open.`)
  return { req, samples: sc('samples'), cutoff: sc('cutoff'), queries: { open: open.length, awaiting: awaiting.length }, overdue, rows, attention, procedures: { done: rows.reduce((n, r) => n + r.done, 0), total: rows.reduce((n, r) => n + r.total, 0) } }
}
