// Turns a query from the tracker into the chat view shared by the client and the audit team: team on the left, client on the right.
export function toThread(q, clientAuthor = 'You') {
  const replies = q.clientReplies || (q.responseText ? [{ at: q.replyDate, text: q.responseText }] : [])
  return [
    { side: 'left', author: q.raisedBy, role: 'Audit team', timestamp: q.raisedAt, text: q.description },
    ...(q.followUps || []).map((f) => ({ side: 'left', author: f.by, role: 'Audit team', timestamp: f.date, text: `Follow-up: ${f.note}` })),
    ...replies.map((r) => ({ side: 'right', author: clientAuthor, role: 'Finance Director', timestamp: r.at, text: r.text, deliveredRead: !!q.responseReviewed, attachment: r.attachment || null })),
  ]
}
export const chatStatus = (q) => (q.status === 'Closed' ? 'Closed' : q.replied === 'Replied' ? 'Answered' : 'Open')
