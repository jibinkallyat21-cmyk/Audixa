import { useState } from 'react'
import { useClientProfiles } from '../../utils/clientProfiles'
import { useDemoLoaded, DEMO_FILE } from '../../utils/demoData'
import IfrsTBTab from './IfrsTBTab'
import FSPrepTab from './FSPrepTab'

const SEL = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'

// Process 3.6. Audit Team portal.
export default function FinancialStatementsView() {
  const profiles = useClientProfiles(); const demoOn = useDemoLoaded(); const [pid, setPid] = useState(demoOn ? DEMO_FILE.slug : ''); const [tab, setTab] = useState('ifrs')
  const prof = profiles.find((p) => p.id === pid); const name = prof?.client || ''
  // The IFRS TB follows the audit type the client was engaged for (proper or disclaimer). It is needed only when the client is engaged for zakat filing,
  // whichever auditor the file is with. The financial statements in the MISCPA format are for MISCPA files only.
  const zakat = !!prof?.services?.zakat?.opted; const miscpa = !!prof && prof.auditor !== 'ABCPA'
  const mode = /disclaimer/i.test(prof?.auditType || '') ? 'disclaimer' : 'proper'
  const needIfrs = !!prof && zakat; const showFs = miscpa
  const tabs = [...(needIfrs ? [['ifrs', mode === 'disclaimer' ? 'IFRS TB – Disclaimer audit' : 'IFRS TB – Proper audit']] : []), ...(showFs ? [['fs', 'Financial statements']] : [])]
  const view = tabs.some(([id]) => id === tab) ? tab : tabs[0]?.[0]
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-navy">Trial Balance and Financial Statements</h1><p className="mt-1 text-sm text-slate-500">Process 3.6. {needIfrs || !prof ? `Client TB to IFRS TB (${mode === 'disclaimer' ? 'disclaimer' : 'proper'} audit)` : 'Client TB'}{showFs ? ' and the statutory financial statements from the TB and the prior-year audited AFS' : ''}. Nothing is plugged and every figure is traceable.</p></div>
      <div className="flex flex-wrap items-center gap-3"><label htmlFor="fs-client" className="text-xs font-medium text-slate-600">Client</label><select id="fs-client" value={pid} onChange={(e) => setPid(e.target.value)} className={`${SEL} min-w-[260px]`}><option value="">Select a client</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.client} ({p.auditType || 'audit type not set'})</option>)}</select>{prof && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-navy">{prof.auditor} · {mode === 'disclaimer' ? 'Disclaimer audit' : 'Proper audit'}</span>}</div>
      {!prof && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Select a client.</p>}
      {prof && !needIfrs && <p className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">The IFRS trial balance is not required for {name}: the client has not been engaged for zakat filing. It is needed only when the zakat filing service is taken.</p>}
      {tabs.length > 1 && <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">{tabs.map(([id, l]) => <button key={id} onClick={() => setTab(id)} className={`rounded-md px-3.5 py-1.5 text-xs font-semibold ${view === id ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>{l}</button>)}</div>}
      {view === 'ifrs' && <IfrsTBTab key={mode} mode={mode} client={pid} clientName={name} />}
      {view === 'fs' && <FSPrepTab client={pid} clientName={name} />}
    </div>
  )
}
