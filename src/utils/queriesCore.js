// Process 6.2 — Client query management and follow-up (Audit360 Execution Rule Book). Pure rules.
// Tracker fields from the Rule Book: query number, client name, audit area, date raised, query description,
// person responsible, due date, status, date received, replied / not replied, reply date.

export const AREAS = ['Revenue', 'Trade receivables', 'Trade payables', 'Cash and bank', 'Inventory', 'Fixed assets', 'Payroll and GOSI', 'Tax and Zakat', 'Related parties', 'Equity', 'Opening balances', 'Other']
export const PRIORITIES = ['Normal', 'High', 'Critical']
export const STATUSES = ['Open', 'Replied', 'Follow-up', 'Escalated', 'Closed']
export const FOLLOW_UP_DAYS = { Normal: 3, High: 2, Critical: 1 }
export const LONG_PENDING_DAYS = 7

const day = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null }
export const daysBetween = (a, b) => { const x = day(a), y = day(b); return x === null || y === null ? null : Math.round((y - x) / 864e5) }

export function nextNo(queries) {
  const max = queries.reduce((n, q) => Math.max(n, Number(String(q.no).replace(/\D/g, '')) || 0), 0)
  return `QRY-${String(max + 1).padStart(4, '0')}`
}

export function newQuery({ queries, client, clientName, area, description, owner, dueDate, priority = 'Normal', raisedAt, raisedBy }) {
  return {
    id: `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, no: nextNo(queries),
    client, clientName, area, description: description.trim(), owner, dueDate, priority, raisedAt, raisedBy,
    status: 'Open', dateReceived: '', replied: 'Not replied', replyDate: '', responseText: '', responseReviewed: false, addressed: false, clientConfirmed: false,
    followUps: [], escalations: [], closedAt: '', history: [{ at: raisedAt, by: raisedBy, text: 'Query raised' }],
  }
}

export const isOpen = (q) => q.status !== 'Closed'
export const isCritical = (q) => q.priority === 'Critical'
export const isImportant = (q) => q.priority === 'High' || q.priority === 'Critical'
export const isOverdue = (q, today) => isOpen(q) && q.replied !== 'Replied' && q.dueDate && daysBetween(q.dueDate, today) > 0
export const daysOverdue = (q, today) => (isOverdue(q, today) ? daysBetween(q.dueDate, today) : 0)
export const isPendingReply = (q) => isOpen(q) && q.replied !== 'Replied'
export const awaitingReview = (q) => isOpen(q) && q.replied === 'Replied' && !(q.responseReviewed && q.addressed)

// A follow-up is due when there is no reply and no follow-up (or raise) within the interval for its priority.
export function followUpDue(q, today) {
  if (!isPendingReply(q)) return false
  const last = [q.raisedAt, ...q.followUps.map((f) => f.date)].filter(Boolean).sort().pop()
  const gap = daysBetween(last, today)
  return gap !== null && gap >= FOLLOW_UP_DAYS[q.priority || 'Normal']
}
// Critical queries, or any query long overdue, should be escalated to the senior / team lead.
export function shouldEscalate(q, today) {
  if (!isOpen(q) || q.status === 'Escalated') return false
  return isCritical(q) && isPendingReply(q) && daysBetween(q.raisedAt, today) >= 2 ? true : daysOverdue(q, today) >= LONG_PENDING_DAYS
}

// Why a query cannot be closed yet (empty list = it can).
export function closeBlockers(q) {
  const b = []
  if (q.replied !== 'Replied') b.push('No client reply has been recorded.')
  if (q.replied === 'Replied' && !q.responseReviewed) b.push('The response has not been reviewed.')
  if (!q.addressed) b.push('It has not been confirmed that the response and documents fully address the query.')
  if (!q.clientConfirmed) b.push('The client has not confirmed that the response is clear and satisfactory.')
  return b
}

// Review before audit completion: important queries closed, replies received, no critical query open.
export function completionGate(queries, clientId) {
  const mine = queries.filter((q) => !clientId || q.client === clientId)
  const open = mine.filter(isOpen)
  const openCritical = open.filter(isCritical)
  const openImportant = open.filter(isImportant)
  const noReply = open.filter(isPendingReply)
  const reasons = []
  if (openCritical.length) reasons.push(`${openCritical.length} critical ${openCritical.length === 1 ? 'query is' : 'queries are'} still open.`)
  const importantOther = openImportant.filter((q) => !isCritical(q))
  if (importantOther.length) reasons.push(`${importantOther.length} high-priority ${importantOther.length === 1 ? 'query is' : 'queries are'} not closed.`)
  const missingReply = openImportant.filter(isPendingReply)
  if (missingReply.length) reasons.push(`${missingReply.length} important ${missingReply.length === 1 ? 'query has' : 'queries have'} no client response yet.`)
  return { ok: reasons.length === 0, reasons, open: open.length, openCritical: openCritical.length, noReply: noReply.length, total: mine.length }
}

// Priority first, then the earliest due date.
export function sortForAttention(queries) {
  const rank = { Critical: 0, High: 1, Normal: 2 }
  return [...queries].sort((a, b) => (rank[a.priority] - rank[b.priority]) || String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')))
}

export function summarize(queries, today) {
  const open = queries.filter(isOpen)
  return {
    open: open.length, overdue: open.filter((q) => isOverdue(q, today)).length, critical: open.filter(isCritical).length,
    awaitingReview: open.filter(awaitingReview).length, followUp: open.filter((q) => followUpDue(q, today)).length,
    escalate: open.filter((q) => shouldEscalate(q, today)).length, closed: queries.length - open.length,
  }
}
