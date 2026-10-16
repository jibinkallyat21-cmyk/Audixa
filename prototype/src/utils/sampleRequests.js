// Samples and cut-off items raised by the tools become requirements for the client, once a person has approved them: one requirement per item, so the
// client uploads the supporting document against each one. They sit in their own category on the issued list, grouped by area and, inside it, by
// sub-group (for example "Above materiality", or "Debits" and "Credits"). Each item carries the fields shown in the client's table. Pure functions.
const slugOf = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 14)

// samples: [{ key, text, data?, row?: { ref, date, ledger, description, amount }, subgroup? }]
// key = a stable identifier of the item (invoice number, ledger line), so approving the same item twice does not duplicate it.
export function withSampleRequirements(rec, { area, label = area, group = 'samples', samples = [], approvedBy = '', note = '' }) {
  const cut = group === 'cutoff'
  const id = `${cut ? 'cut' : 'smp'}-${slugOf(area).toLowerCase()}`
  const cats = rec.categories || []
  const cur = cats.find((c) => c.id === id)
  const known = new Set((cur?.items || []).map((i) => i.sampleKey))
  let n = (cur?.items || []).length
  const fresh = samples.filter((s) => s.key !== undefined && !known.has(s.key))
  const items = fresh.map((s) => ({ ref: `${cut ? 'CUT' : 'SMP'}-${slugOf(area)}-${String(++n).padStart(2, '0')}`, text: `${cut ? 'Item' : 'Sample'} ${n}: ${s.text}`, status: 'Pending Client', sample: true, sampleKey: s.key, ...(s.data ? { data: s.data } : {}), ...(s.row ? { row: s.row } : {}), ...(s.subgroup ? { subgroup: s.subgroup } : {}) }))
  if (!items.length) return { rec, added: 0 }
  const reason = cut
    ? `Items picked around the year end for ${label}${approvedBy ? ` and approved by ${approvedBy}` : ''}. For each item please upload the invoice or supporting document, or explain the transaction${note ? `. ${note}` : ''}.`
    : `Samples selected for ${label}${approvedBy ? ` and approved by ${approvedBy}` : ''}. Please upload the supporting document for each sample${note ? `. ${note}` : ''}.`
  const next = cur ? cats.map((c) => (c.id === id ? { ...c, items: [...c.items, ...items] } : c)) : [...cats, { id, title: `${cut ? 'Cut-off' : 'Samples'}: ${label}`, reason, group: cut ? 'cutoff' : 'samples', area, items }]
  return { rec: { ...rec, categories: next, itemCount: next.reduce((k, c) => k + c.items.length, 0) }, added: items.length }
}
