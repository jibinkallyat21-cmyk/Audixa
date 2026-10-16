import { Database } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDemoLoaded } from '../../utils/demoData'

// Shown instead of a page while the demo data is not loaded: there is no other data in the client and team portals.
export default function DemoGate({ children, client = false }) {
  const loaded = useDemoLoaded()
  if (loaded) return children
  return (
    <div style={{ borderColor: 'rgba(128,128,128,0.45)' }} className="mx-auto mt-10 max-w-lg rounded-2xl border border-dashed p-8 text-center opacity-80">
      <Database className="mx-auto h-6 w-6 opacity-60" />
      <p className="mt-3 text-sm font-semibold">Nothing here yet</p>
      <p className="mt-1 text-xs">{client ? 'Load the demo data from the Engagement Dashboard to see this page filled in.' : 'No client file exists yet. In the Client portal, open the Engagement Dashboard and choose Load demo data.'}</p>
      {client && <Link to="/client/dashboard" className="mt-4 inline-block rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white">Go to Engagement Dashboard</Link>}
    </div>
  )
}
