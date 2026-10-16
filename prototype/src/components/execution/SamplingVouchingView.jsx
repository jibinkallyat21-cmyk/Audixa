import { useState } from 'react'
import { useClientProfiles } from '../../utils/clientProfiles'
import { FIRMS } from '../../data/firms.js'
import { useDemoLoaded, DEMO_FILE } from '../../utils/demoData'
import SamplingTab from './SamplingTab'
import VouchingTab from './VouchingTab'
import ConfirmationTab from './ConfirmationTab'

const SEL = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'

// Process 3.4. Audit Team portal.
export default function SamplingVouchingView({ embedded = false, initialTab = 'sampling', initialMode = 'sales', initialArea = 'Revenue' }) {
  const profiles = useClientProfiles()
  const demoOn = useDemoLoaded(); const [pid, setPid] = useState(demoOn ? DEMO_FILE.slug : ''); const [tab, setTab] = useState(initialTab)
  const prof = profiles.find((p) => p.id === pid); const firm = prof?.auditor && FIRMS[prof.auditor] ? prof.auditor : ''
  return (
    <div className="space-y-5">
      {!embedded && <div>
        <h1 className="text-xl font-bold text-navy">Sampling, Vouching and Confirmations</h1>
        <p className="mt-1 text-sm text-slate-500">Process 3.4. The auditor on the proposal decides the framework: MISCPA uses the 50% rule books, ABCPA the materiality method. They are never mixed.</p>
      </div>}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="sv-client" className="text-xs font-medium text-slate-600">Client</label>
        <select id="sv-client" value={pid} onChange={(e) => setPid(e.target.value)} className={`${SEL} min-w-[260px]`}><option value="">Select a client</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.client} ({p.auditor})</option>)}</select>
        {firm && <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy">{FIRMS[firm].legalName}</span>}
      </div>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">{[['sampling', 'Sampling'], ['vouching', 'Vouching'], ['confirm', 'Cash & bank confirmation']].map(([id, l]) => <button key={id} onClick={() => setTab(id)} className={`rounded-md px-3.5 py-1.5 text-xs font-semibold ${tab === id ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>{l}</button>)}</div>
      {tab === 'sampling' && <SamplingTab initialMode={initialMode} initialArea={initialArea} firm={firm} client={pid} clientName={prof?.client || ''} />}
      {tab === 'vouching' && <VouchingTab firm={firm} client={pid} clientName={prof?.client || ''} />}
      {tab === 'confirm' && <ConfirmationTab key={pid} client={pid} clientName={prof?.client || ''} legalName={prof?.client || ''} />}
    </div>
  )
}
