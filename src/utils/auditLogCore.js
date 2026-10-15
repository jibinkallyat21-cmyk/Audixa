// Process 6.3 pure helpers (no storage), kept apart so they can be tested in Node.
// The 14 activities of the Rule Book's "Audit Log & Traceability" list (1 is the log itself, so 13 categories + general).
export const CATEGORIES = [
  { id: 'general', label: 'General / system', hint: 'Automatic entries: stage changes, documents, approvals' },
  { id: 'allocation', label: 'File allocation', hint: 'Who was assigned to the file and the date', fields: [['assignedTo', 'Assigned to'], ['allocatedBy', 'Allocated by']], required: ['assignedTo'] },
  { id: 'work', label: 'Work performed', hint: 'Audit work done by a team member in an audit area', fields: [['auditArea', 'Audit area'], ['performedBy', 'Performed by']], required: ['auditArea', 'performedBy'] },
  { id: 'doc-request', label: 'Document request', hint: 'Documents or information requested from the client', fields: [['requestedDate', 'Request date', 'date'], ['responseDate', 'Response date', 'date']], required: ['requestedDate'] },
  { id: 'client-response', label: 'Client response', hint: 'Documents or explanations received and who reviewed them', fields: [['receivedDate', 'Date received', 'date'], ['reviewedBy', 'Reviewed by']], required: ['receivedDate', 'reviewedBy'] },
  { id: 'query', label: 'Audit query', hint: 'Queries raised, responses, follow-ups and closure', fields: [['queryNo', 'Query no.'], ['closedDate', 'Closure date', 'date']], required: [] },
  { id: 'evidence', label: 'Supporting evidence', hint: 'Evidence behind a significant audit conclusion', fields: [['conclusion', 'Conclusion'], ['evidenceRef', 'Evidence / document reference']], required: ['conclusion', 'evidenceRef'] },
  { id: 'change', label: 'Change to working papers', hint: 'Important changes to working papers, schedules, calculations', fields: [['workingPaper', 'Working paper / schedule'], ['changedBy', 'Changed by']], required: ['workingPaper', 'changedBy'] },
  { id: 'review-comment', label: 'Review comment', hint: 'Review points from the senior or team lead and how they were resolved', fields: [['raisedBy', 'Raised by'], ['action', 'Action taken'], ['resolved', 'Resolved?', 'checkbox']], required: ['raisedBy'] },
  { id: 'adjustment', label: 'Audit adjustment', hint: 'Reason, amount, supporting evidence and approval status', fields: [['amount', 'Amount (SR)', 'number'], ['reason', 'Reason'], ['evidenceRef', 'Supporting evidence'], ['approval', 'Approval status', 'select', ['Proposed', 'Approved', 'Rejected', 'Client approval pending']]], required: ['amount', 'reason', 'approval'] },
  { id: 'reference', label: 'File reference', hint: 'Reference of a working paper, document or evidence for easy tracing', fields: [['refNo', 'Reference no.'], ['location', 'Where it is filed']], required: ['refNo'] },
  { id: 'pending', label: 'Pending item', hint: 'Outstanding procedure, document, query or review point', fields: [['dueDate', 'Due date', 'date'], ['owner', 'Owner'], ['status', 'Status', 'select', ['Open', 'In progress', 'Done']]], required: ['owner', 'status'] },
  { id: 'decision', label: 'Important decision', hint: 'Significant audit judgment, discussion or decision', fields: [['decidedBy', 'Decided by'], ['basis', 'Basis for the decision']], required: ['decidedBy', 'basis'] },
  { id: 'responsibility', label: 'Responsibility trail', hint: 'Who prepared, reviewed and approved an important working paper', fields: [['document', 'Working paper / document'], ['preparedBy', 'Prepared by'], ['reviewedBy', 'Reviewed by'], ['approvedBy', 'Approved by']], required: ['document', 'preparedBy'] },
]
export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]

// Returns the list of problems with a manual entry (empty = fine).
export function validateEntry(category, { title, extra = {} }) {
  const problems = []
  if (!String(title || '').trim()) problems.push('Enter a short title.')
  const c = categoryById(category)
  for (const k of c.required || []) {
    const v = extra[k]
    if (v === undefined || v === null || String(v).trim() === '') problems.push(`${(c.fields || []).find((f) => f[0] === k)?.[1] || k} is required.`)
  }
  return problems
}

export function filterLog(entries, { client = '', category = '', q = '', from = '', to = '' } = {}) {
  const needle = q.trim().toLowerCase()
  return entries.filter((e) => {
    if (client && e.client !== client) return false
    if (category && e.category !== category) return false
    if (from && e.at.slice(0, 10) < from) return false
    if (to && e.at.slice(0, 10) > to) return false
    if (needle && !`${e.title} ${e.description} ${e.user} ${e.clientName} ${Object.values(e.extra || {}).join(' ')}`.toLowerCase().includes(needle)) return false
    return true
  })
}

const csvCell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
export function toCsv(entries) {
  const head = ['Date and time', 'Client', 'Category', 'Title', 'Description', 'User', 'Role', 'Entered', 'Details']
  const rows = entries.map((e) => [e.at, e.clientName, categoryById(e.category).label, e.title, e.description, e.user, e.role, e.auto ? 'Automatic' : 'Manual',
    Object.entries(e.extra || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null).map(([k, v]) => `${k}: ${v}`).join('; ')])
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
}
