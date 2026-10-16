// What the execution team portal shows while the demo client is loaded: only the demo client's own data, worked out from the real stores
// (trial balance submission, issued requirement list, queries, audit log). Nothing here is invented: a count is the number of real items.
// Pure functions, so they are tested. useTeamScope() in teamScopeHook.js feeds them from the stores.
import { openingCheck } from './openingCheck.js'
import { flagsFromCheck } from './openingReview.js'
import { isOpen, isOverdue, awaitingReview } from './queriesCore.js'
import { overdueItems } from './sampleTracking.js'

const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`
const DOC_REVIEW = ['Uploaded Processing', 'Under Review']

export function relativeTime(iso, now = new Date()) {
  const t = new Date(iso).getTime(); if (Number.isNaN(t)) return ''
  const mins = Math.max(0, Math.round((now.getTime() - t) / 60000))
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.round(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

const trailType = (e) => (/accept/i.test(e.title) ? 'accept' : /reject|return/i.test(e.title) ? 'reject' : e.category === 'query' ? 'query' : e.category === 'doc-request' || e.category === 'client-response' ? 'document' : 'stage')
const stamp = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }

export function buildTeamScope({ file, tb, issued, queries = [], log = [], now = new Date() }) {
  const today = now.toISOString().slice(0, 10)
  const slug = file.slug
  const docs = (issued?.[slug]?.categories || []).flatMap((c) => c.items || [])
  const docsToReview = docs.filter((d) => DOC_REVIEW.includes(d.status))
  const tbWaiting = tb?.status === 'Submitted'
  const flagCount = tbWaiting && tb.pyLedgers?.length ? (() => { const oc = openingCheck(tb.pyLedgers, tb.ledgers); return oc.aligned ? 0 : flagsFromCheck(tb.pyLedgers, tb.ledgers, oc).length })() : 0
  const mine = queries.filter((q) => q.client === slug || q.clientName === file.client)
  const openQ = mine.filter(isOpen)
  const overdueQ = mine.filter((q) => isOverdue(q, today))
  const replyQ = mine.filter(awaitingReview)
  const daysToDue = file.statutoryDue ? Math.round((new Date(file.statutoryDue).getTime() - now.getTime()) / 86400000) : null
  const nearDeadline = daysToDue !== null && !Number.isNaN(daysToDue) && daysToDue <= 30 ? 1 : 0

  const tasks = []
  const add = (priority, description, deadline = 'Today', route) => tasks.push({ id: `dt${tasks.length + 1}`, priority, description, client: file.client, deadline, fileSlug: slug, route })
  if (tbWaiting) add('URGENT', 'Review the submitted trial balance and general ledger, then approve it to issue the requirement list', 'Today', '/team/workspace/requirements')
  if (flagCount) add('URGENT', `Check ${plural(flagCount, 'flagged ledger')} in the opening balance check against the previous year audited trial balance`, 'Today', '/team/workspace/requirements')
  if (overdueQ.length) add('URGENT', `${plural(overdueQ.length, 'query', 'queries')} overdue for a client reply`, 'Today', '/team/workspace/queries')
  if (docsToReview.length) add('HIGH', `Review ${plural(docsToReview.length, 'uploaded document')} on the requirement list`, 'This week', '/team/workspace/requirements')
  if (replyQ.length) add('HIGH', `Review the client's reply on ${plural(replyQ.length, 'query', 'queries')}`, 'This week', '/team/workspace/queries')
  const owed = overdueItems(issued?.[slug], now, 3)
  if (owed.length) add('HIGH', `${plural(owed.length, 'sample or cut-off item')} waiting more than 3 days for the client: send a reminder`, 'This week', '/team/workspace/requirements')
  if (nearDeadline) add('HIGH', `Statutory deadline ${file.statutoryDue} is within 30 days`, file.statutoryDue, '/team/files')

  const urgent = tasks.some((t) => t.priority === 'URGENT') ? 1 : 0
  const stats = { totalActive: 1, urgent, onTrack: 1 - urgent, withReviewer: 0, parked: 0, avgTurnaround: 'Not enough data', pendingActionsToday: tasks.length, totalOpenExceptions: flagCount + openQ.length }
  const actionCards = [
    { id: 'review', tone: docsToReview.length ? 'alert-red' : 'amber', title: docsToReview.length ? `${plural(docsToReview.length, 'Document')} Awaiting Review` : 'No Documents Awaiting Review', icon: 'FileText', action: 'Open Requirements', route: '/team/workspace/requirements' },
    { id: 'queries', tone: 'amber', title: replyQ.length ? `${plural(replyQ.length, 'Open Query', 'Open Queries')} — Client Replies Received` : `${plural(openQ.length, 'Open Query', 'Open Queries')}`, icon: 'MessageCircle', action: 'View Queries', route: '/team/workspace/queries' },
    { id: 'ai-flags', tone: 'alert-red', count: flagCount, title: flagCount ? `${plural(flagCount, 'Flagged Ledger')} — Awaiting Your Approval` : 'No flags awaiting your approval', icon: 'ShieldAlert', note: flagCount ? 'The opening balance check flagged these ledgers. Your approval is required before the trial balance is accepted.' : 'Nothing is flagged on this file right now.', action: 'Review Flags', route: '/team/workspace/requirements' },
    { id: 'deadlines', tone: 'amber', title: nearDeadline ? '1 File Approaching Deadline' : 'No Files Approaching Deadline', icon: 'Clock', action: 'View Files', route: '/team/files' },
  ]
  const own = log.filter((e) => e.clientName === file.client).sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  const activity = own.slice(0, 5).map((e) => ({ id: e.id, client: e.clientName, event: e.description ? `${e.title}: ${e.description}` : e.title, timestamp: relativeTime(e.at, now) }))
  const notifications = own.filter((e) => e.category === 'client-response').slice(0, 8).map((e) => ({ id: e.id, icon: 'FileText', title: e.title, message: e.description || e.title, client: e.clientName, timestamp: relativeTime(e.at, now), action: { label: 'Open', route: '/team/workspace/requirements', tone: 'red' }, unread: true }))
  const statusNotifications = own.filter((e) => e.category !== 'client-response').slice(0, 8).map((e) => ({ id: e.id, title: e.title, message: e.description || e.title, timestamp: relativeTime(e.at, now) }))
  const auditTrail = own.map((e) => ({ id: e.id, type: trailType(e), title: e.title, description: e.description || e.title, user: e.user || 'System', client: e.clientName, timestamp: stamp(e.at) }))
  return { demo: true, auditTrail, files: [file], stats, tasks, actionCards, activity, notifications, statusNotifications, longPending: [], meetings: [], completedMeetings: 0, conversations: [], escalations: [], navBadges: { notifications: notifications.length, messages: 0, meetings: 0 }, counts: { docsToReview: docsToReview.length, flags: flagCount, openQueries: openQ.length } }
}
