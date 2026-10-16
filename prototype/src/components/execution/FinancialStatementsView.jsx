import { useState } from 'react'
import { useClientProfiles } from '../../utils/clientProfiles'
import IfrsTBTab from './IfrsTBTab'
import FSPrepTab from './FSPrepTab'

const SEL = 'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-navy'

// Process 3.6. Audit Team portal.
export default function FinancialStatementsView() {
  const profiles = useClientProfiles(); const [pid, setPid] = useState(''); const [tab, setTab] = useState('proper')
  const prof = profiles.find((p) => p.id === pid); const name = prof?.client || ''
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-navy">Trial Balance and Financial Statements</h1><p className="mt-1 text-sm text-slate-500">Process 3.6. Client TB to IFRS TB (proper and disclaimer audits) and the statutory financial statements from the TB and the prior-year audited AFS. Nothing is plugged and every figure is traceable.</p></div>
      <div className="flex flex-wrap items-center gap-3"><label htmlFor="fs-client" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Client</label><select id="fs-client" value={pid} onChange={(e) => setPid(e.target.value)} className={`${SEL} min-w-[260px]`}><option value="">Select a client</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.client} ({p.auditType || p.auditor})</option>)}</select>{prof?.auditType && <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy">{prof.auditType}</span>}</div>
      <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">{[['proper', 'IFRS TB – Proper audit'], ['disclaimer', 'IFRS TB – Disclaimer audit'], ['fs', 'Financial statements']].map(([id, l]) => <button key={id} onClick={() => setTab(id)} className={`rounded-md px-3.5 py-1.5 text-xs font-semibold ${tab === id ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>{l}</button>)}</div>
      {tab === 'proper' && <IfrsTBTab key="proper" mode="proper" client={pid} clientName={name} />}{tab === 'disclaimer' && <IfrsTBTab key="disclaimer" mode="disclaimer" client={pid} clientName={name} />}{tab === 'fs' && <FSPrepTab client={pid} clientName={name} />}
    </div>
  )
}
