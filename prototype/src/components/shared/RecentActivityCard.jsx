import { Link } from 'react-router-dom'
import { useAuditLog } from '../../utils/auditLog'
import { relativeTime } from '../../utils/teamScope'

// The latest activity from the shared audit log, newest first. The same log feeds every portal.
export default function RecentActivityCard({ title = 'Recent activity', logHref, limit = 7 }) {
  const log = useAuditLog().slice(0, limit)
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-navy">{title}</h2>{logHref && <Link to={logHref} className="text-xs font-semibold text-navy hover:underline">Open the audit log</Link>}</div>
      {log.length === 0 ? <p className="text-xs text-slate-400">Nothing has happened yet. Activity appears here as the work is done.</p> : (
        <ul className="space-y-3">{log.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
            <div className="min-w-0"><p className="truncate text-xs font-semibold text-navy">{e.title}</p><p className="truncate text-[11px] text-slate-500">{[e.clientName, e.user].filter(Boolean).join(' · ')}{e.description ? ` · ${e.description}` : ''}</p></div>
            <span className="shrink-0 text-[11px] text-slate-400">{relativeTime(e.at)}</span>
          </li>))}</ul>)}
    </div>
  )
}
