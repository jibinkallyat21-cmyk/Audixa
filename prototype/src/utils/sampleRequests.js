// Samples raised by the sampling tools become requirements for the client, once a person has approved them: one requirement per sample, so the client
// uploads the supporting document against each one. They sit in their own category on the issued list ("Samples - <area>"). Pure functions.
const slugOf = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 14)

// samples: [{ key, text }]  key = a stable identifier of the sampled item (e.g. invoice number), so approving the same sample twice does not duplicate it.
export function withSampleRequirements(rec, { area, label = area, samples = [], approvedBy = '', note = '' }) {
  const id = `smp-${slugOf(area).toLowerCase()}`
  const cats = rec.categories || []
  const cur = cats.find((c) => c.id === id)
  const known = new Set((cur?.items || []).map((i) => i.sampleKey))
  let n = (cur?.items || []).length
  const fresh = samples.filter((s) => s.key !== undefined && !known.has(s.key))
  const items = fresh.map((s) => ({ ref: `SMP-${slugOf(area)}-${String(++n).padStart(2, '0')}`, text: `Sample ${n}: ${s.text}`, status: 'Pending Client', sample: true, sampleKey: s.key, ...(s.data ? { data: s.data } : {}) }))
  if (!items.length) return { rec, added: 0 }
  const reason = `Samples selected for ${label}${approvedBy ? ` and approved by ${approvedBy}` : ''}. Please upload the supporting document for each sample${note ? `. ${note}` : ''}.`
  const next = cur ? cats.map((c) => (c.id === id ? { ...c, items: [...c.items, ...items] } : c)) : [...cats, { id, title: `Samples: ${label}`, reason, items }]
  return { rec: { ...rec, categories: next, itemCount: next.reduce((k, c) => k + c.items.length, 0) }, added: items.length }
}
