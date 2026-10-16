import { useState } from 'react'
import { useClientProfiles } from '../../utils/clientProfiles'
import { useDemoLoaded, DEMO_FILE } from '../../utils/demoData'
import SalaryTab from './SalaryTab'
import GosiEosbTab from './GosiEosbTab'
import PrepaidTab from './PrepaidTab'
import DepreciationTab from './DepreciationTab'

const SEL = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'

// Process 3.5. Audit Team portal.
export default function PayrollAssetsView({ embedded = false, initialTab = 'salary' }) {
  const profiles = useClientProfiles(); const demoOn = useDemoLoaded(); const [pid, setPid] = useState(demoOn ? DEMO_FILE.slug : ''); const [tab, setTab] = useState(initialTab)
  const prof = profiles.find((p) => p.id === pid); const name = prof?.client || ''
  return (
    <div className="space-y-5">
      {!embedded && <div>
        <h1 className="text-xl font-bold text-navy">Payroll, Prepaid Expenses and Depreciation</h1>
        <p className="mt-1 text-sm text-slate-500">Process 3.5. Salary schedule with GOSI / MUDAD and EOSB, prepaid expenses and the depreciation schedule. Client data is never changed; every difference stays visible.</p>
      </div>}
      <div className="flex flex-wrap items-center gap-3"><label htmlFor="pa-client" className="text-xs font-medium text-slate-600">Client</label>
        <select id="pa-client" value={pid} onChange={(e) => setPid(e.target.value)} className={`${SEL} min-w-[260px]`}><option value="">Select a client</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.client} ({p.auditor})</option>)}</select></div>
      <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">{[['salary', 'Salary schedule'], ['gosi', 'GOSI & EOSB'], ['prepaid', 'Prepaid expenses'], ['dep', 'Depreciation']].map(([id, l]) => <button key={id} onClick={() => setTab(id)} className={`rounded-md px-3.5 py-1.5 text-xs font-semibold ${tab === id ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}>{l}</button>)}</div>
      {tab === 'salary' && <SalaryTab client={pid} clientName={name} />}{tab === 'gosi' && <GosiEosbTab clientName={name} />}{tab === 'prepaid' && <PrepaidTab client={pid} clientName={name} />}{tab === 'dep' && <DepreciationTab client={pid} clientName={name} />}
    </div>
  )
}
