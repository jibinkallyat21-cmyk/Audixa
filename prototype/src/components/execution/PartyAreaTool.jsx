import { useState } from 'react'
import SamplingTab from './SamplingTab'
import PartySamples from './PartySamples'

// Trade receivables and trade payables in one place: the sample list with each customer's or supplier's confirmation, alternative procedure and documents,
// and the tool that picks the samples.
export default function PartyAreaTool({ dc, side }) {
  const [tab, setTab] = useState('list'); const area = side === 'receivables' ? 'Trade receivables' : 'Trade payables'
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist">{[['list', 'Sample list'], ['pick', 'Pick samples']].map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${tab === id ? 'bg-navy text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{l}</button>)}</div>
      {tab === 'list' ? <PartySamples dc={dc} side={side} /> : <SamplingTab firm={dc.auditor} initialMode="party" initialArea={area} client={dc.slug} clientName={dc.client} lockArea />}
    </div>
  )
}
