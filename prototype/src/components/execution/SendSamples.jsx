import { useState } from 'react'
import { Send } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { addSampleRequirements } from '../../utils/requirementsStore'
import { newQuery } from '../../utils/queriesCore'
import { useQueries } from '../../utils/queriesStore'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { defaultRoute } from '../../utils/sampleItems'
import { useDemoClient } from '../../utils/useDemoClient'

// After a person has looked at the selected sample, this sends it to the client: one requirement per sample (the client uploads against each one) or,
// where the nature is an explanation, one query per sample. Nothing reaches the client until the button is pressed.
export default function SendSamples({ area, label, items, client, group }) {
  const showToast = useToast(); const dc = useDemoClient(); const { queries, setQueries } = useQueries()
  const [route, setRoute] = useState(defaultRoute(items)); const [done, setDone] = useState('')
  if (!dc.isDemo(client) || !items.length) return null
  const me = currentUser()
  const send = () => {
    if (route === 'requirement') {
      const n = addSampleRequirements(dc.slug, { area, label, group, samples: items.map(({ key, text, data, row, subgroup }) => ({ key, text, data, row, subgroup })), approvedBy: me.name })
      if (n < 0) { showToast('The requirement list has not been issued yet. Approve the trial balance first.'); return }
      setDone(n ? `${n} ${group === 'cutoff' ? 'cut-off item' : 'sample requirement'}${n === 1 ? '' : 's'} added to the client's requirement list.` : 'These samples are already on the client\'s requirement list.')
      if (n) logEvent({ client: dc.slug, clientName: dc.client, category: 'doc-request', title: `${label}: samples approved and sent`, description: `${n} samples sent as requirements`, user: me })
    } else {
      const today = new Date().toISOString().slice(0, 10); const due = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
      const existing = new Set(queries.filter((q) => q.client === dc.slug).map((q) => q.sampleKey).filter(Boolean))
      let all = queries; let n = 0
      for (const it of items) { if (existing.has(it.key)) continue; const q = { ...newQuery({ queries: all, client: dc.slug, clientName: dc.client, area: 'Other', description: it.text, owner: me.name, dueDate: due, priority: 'Normal', raisedAt: today, raisedBy: me.name }), sampleKey: it.key }; all = [q, ...all]; n++ }
      if (n) { setQueries(all); logEvent({ client: dc.slug, clientName: dc.client, category: 'query', title: `${label}: samples approved and sent as queries`, description: `${n} queries raised`, user: me }) }
      setDone(n ? `${n} quer${n === 1 ? 'y' : 'ies'} raised to the client.` : 'These samples were already raised as queries.')
    }
    showToast('Sent to the client')
  }
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <p className="font-semibold text-navy">Send this sample to the client ({items.length} item{items.length === 1 ? '' : 's'})</p>
      <p className="mt-0.5">After you approve, each sample appears for the client, who answers against each one. Nothing is sent before you press the button.</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1">Send as
          <select aria-label="Send samples as" value={route} onChange={(e) => { setRoute(e.target.value); setDone('') }} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-navy"><option value="requirement">Requirements (client uploads documents)</option><option value="query">Queries (client explains)</option></select></label>
        <button onClick={send} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white"><Send className="h-3.5 w-3.5" />Approve and send to the client</button>
      </div>
      {done && <p className="mt-2 font-semibold text-emerald">{done}</p>}
    </div>
  )
}
