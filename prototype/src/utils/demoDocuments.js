// Demo only: stands in for the client's uploads. Every item still waiting for the client (or rejected) gets a placeholder file and goes to the audit team for review.
export function withDemoDocuments(rec) {
  let count = 0
  const categories = rec.categories.map((c) => ({ ...c, items: c.items.map((i) => {
    if (!['Pending Client', 'Rejected', 'Action Required'].includes(i.status)) return i
    count++
    return { ...i, status: 'Uploaded Processing', filename: `Demo document ${i.ref}.pdf`, alert: '' }
  }) }))
  return { rec: { ...rec, categories }, count }
}
