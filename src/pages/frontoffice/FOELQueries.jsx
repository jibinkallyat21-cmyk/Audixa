import { CheckCircle2 } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import { FlagCard } from '../../components/execution/elShared'
import { evaluateELRequest, setPath } from '../../utils/elRequest.js'
import { verificationForRequest } from '../../utils/elVerification.js'
import { signedForRequest } from '../../utils/signedEL'
import { useELRequests } from '../../utils/elStore'
import { FIRMS } from '../../data/firms.js'

// Process 2.1 Step 1: red flags and missing-information queries raised while a coordinator
// prepares an EL request. The FO can enter the missing information here; the request updates itself.
export default function FOELQueries() {
  const { requests, upsert } = useELRequests()
  const withFlags = requests
    .filter((r) => !r.sentAt)
    .map((r) => ({ r, flags: evaluateELRequest({ ...r, requestedBy: r.requestedBy }).flags }))
    .filter((x) => x.flags.length > 0)

  // Low-priority notes from checking the EL received from the auditor (never blocking).
  const notes = requests.flatMap((r) => (verificationForRequest(r)?.notices || []).map((n) => ({ ...n, client: r.client, firm: r.firm, id: `${r.id}-${n.key}` })))

  // Signed EL checks that failed or are still pending (the FO chases the client for these).
  const signedIssues = requests.map((r) => ({ r, v: signedForRequest(r) })).filter((x) => x.v && x.v.actions.length > 0)

  return (
    <FrontOfficeLayout title="EL Queries">
      <PageTransition>
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-navy">EL Queries</h1>
            <p className="mt-1 text-sm text-slate-500">Issues flagged while preparing engagement letter requests. Enter the missing information or resolve the difference; the request updates automatically.</p>
          </div>
          {withFlags.length === 0 && notes.length === 0 && signedIssues.length === 0 && (
            <p className="flex items-center gap-2 rounded-xl border border-emerald/30 bg-emerald/5 px-4 py-3 text-sm text-emerald"><CheckCircle2 className="h-4 w-4" />No open EL queries.</p>
          )}
          {withFlags.map(({ r, flags }) => (
            <div key={r.id} className="space-y-3">
              <p className="text-sm font-bold text-navy">{r.client} <span className="ml-1 text-xs font-normal text-slate-500">{FIRMS[r.firm]?.legalName} · requested by {r.requestedBy}</span></p>
              {flags.map((fl) => (
                <FlagCard key={fl.key} flag={fl} fields={r.fields}
                  onChange={(path, v) => upsert({ ...r, fields: setPath(r.fields, path, v), log: r.log })} />
              ))}
            </div>
          ))}
          {signedIssues.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-navy">Signed EL: open items</h2>
              {signedIssues.map(({ r, v }) => (
                <div key={r.id} className={`rounded-xl border p-4 ${v.overall === 'FAILED' ? 'border-alert-red/30 bg-alert-red/5' : 'border-amber/30 bg-amber/10'}`}>
                  <p className="text-sm font-semibold text-navy">{r.client} <span className="ml-1 text-xs font-normal text-slate-500">{FIRMS[r.firm]?.legalName} · {v.overall}</span></p>
                  <ul className="mt-1 list-disc pl-5 text-xs text-navy">{v.actions.map((a) => <li key={a.key}><b>{a.no}. {a.label}</b> ({a.status}): {a.note}</li>)}</ul>
                  <p className="mt-1 text-[11px] text-slate-500">The responsible employee has been notified.</p>
                </div>
              ))}
            </div>
          )}
          {notes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-navy">Low priority notes</h2>
              {notes.map((n) => (
                <div key={n.id} className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-navy">{n.title} <span className="ml-1 text-xs font-normal text-slate-500">{n.client} · {FIRMS[n.firm]?.legalName}</span></p>
                  <p className="mt-1 text-xs text-slate-600">{n.detail}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Seen by the FO and the project coordinator. Does not block the EL.</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </FrontOfficeLayout>
  )
}
