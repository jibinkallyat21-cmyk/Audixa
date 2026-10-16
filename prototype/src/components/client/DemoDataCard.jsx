import { Database } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { useState } from 'react'
import { useDemoLoaded, useDemoAuditor, useDemoExisting, useDemoOwn, loadDemoData, clearDemoData } from '../../utils/demoData'

export default function DemoDataCard({ D }) {
  const showToast = useToast()
  const loaded = useDemoLoaded()
  const current = useDemoAuditor()
  const [firm, setFirm] = useState('MISCPA')
  const [existingClient, setExistingClient] = useState(true)
  const isExisting = useDemoExisting(); const isOwn = useDemoOwn(); const [own, setOwn] = useState(false); const [name, setName] = useState('')
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3" style={{ background: D.card, border: `1px dashed ${D.border}` }}>
      <div className="flex min-w-0 items-start gap-3">
        <Database className="mt-0.5 h-4 w-4 shrink-0" style={{ color: D.muted }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: D.text }}>Demo data {loaded && <span className="ml-1 text-xs font-medium text-emerald">loaded</span>}</p>
          <p className="text-xs" style={{ color: D.muted }}>{loaded ? "This client now appears as a file in the Execution Team portal. Its demo trial balance and general ledger are already submitted and wait for the audit team's approval." : 'Adds this client as a file in the Execution Team portal so you can see how it looks to the audit team.'}</p>
        </div>
      </div>
      {!loaded ? (
        <label className="flex items-center gap-2 text-xs" style={{ color: D.muted }}>Audit firm
          <select aria-label="Audit firm" value={firm} onChange={(e) => setFirm(e.target.value)} className="rounded-md px-2 py-1.5 text-xs" style={{ background: D.card, color: D.text, border: `1px solid ${D.border}` }}><option>MISCPA</option><option>ABCPA</option></select>
        </label>
      ) : <span className="text-xs" style={{ color: D.muted }}>Audit firm: {current} · {isExisting ? 'existing client' : 'new client'}{isOwn ? ' · your own files' : ''}</span>}
      {!loaded && <label className="flex items-center gap-2 text-xs" style={{ color: D.muted }}>Data
        <select aria-label="Data source" value={own ? 'own' : 'demo'} onChange={(e) => setOwn(e.target.value === 'own')} className="rounded-md px-2 py-1.5 text-xs" style={{ background: D.card, color: D.text, border: `1px solid ${D.border}` }}><option value="demo">Demo files</option><option value="own">My own client files</option></select>
      </label>}
      {!loaded && own && <label className="flex items-center gap-2 text-xs" style={{ color: D.muted }}>Client name
        <input aria-label="Client name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" className="w-48 rounded-md px-2 py-1.5 text-xs" style={{ background: D.card, color: D.text, border: `1px solid ${D.border}` }} />
      </label>}
      {!loaded && (
        <label className="flex items-center gap-2 text-xs" style={{ color: D.muted }}>Client
          <select aria-label="Client type" value={existingClient ? 'existing' : 'new'} onChange={(e) => setExistingClient(e.target.value === 'existing')} className="rounded-md px-2 py-1.5 text-xs" style={{ background: D.card, color: D.text, border: `1px solid ${D.border}` }}><option value="existing">Existing (audited by us last year)</option><option value="new">New</option></select>
        </label>
      )}
      <button onClick={() => { if (loaded) { clearDemoData(); showToast('Demo data removed') } else { loadDemoData(firm, existingClient, { own, clientName: name }); showToast(own ? 'Client file started. Upload the trial balance and general ledger under Requirement List.' : 'Demo data loaded. Open the Execution Team portal to see the file.') } }}
        disabled={!loaded && own && !name.trim()} className="shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-40" style={{ background: loaded ? '#64748b' : '#E63946' }}>
        {loaded ? (isOwn ? 'Remove this client file' : 'Remove demo data') : own ? 'Start the client file' : 'Load demo data'}
      </button>
    </div>
  )
}
