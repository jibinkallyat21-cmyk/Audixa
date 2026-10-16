import { Database } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { useDemoLoaded, loadDemoData, clearDemoData } from '../../utils/demoData'

export default function DemoDataCard({ D }) {
  const showToast = useToast()
  const loaded = useDemoLoaded()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3" style={{ background: D.card, border: `1px dashed ${D.border}` }}>
      <div className="flex min-w-0 items-start gap-3">
        <Database className="mt-0.5 h-4 w-4 shrink-0" style={{ color: D.muted }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: D.text }}>Demo data {loaded && <span className="ml-1 text-xs font-medium text-emerald">loaded</span>}</p>
          <p className="text-xs" style={{ color: D.muted }}>{loaded ? 'This client now appears as a file in the Execution Team portal (Files, Requirements) with its requirement list issued.' : 'Adds this client as a file in the Execution Team portal so you can see how it looks to the audit team.'}</p>
        </div>
      </div>
      <button onClick={() => { if (loaded) { clearDemoData(); showToast('Demo data removed') } else { loadDemoData(); showToast('Demo data loaded. Open the Execution Team portal to see the file.') } }}
        className="shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold text-white" style={{ background: loaded ? '#64748b' : '#E63946' }}>
        {loaded ? 'Remove demo data' : 'Load demo data'}
      </button>
    </div>
  )
}
