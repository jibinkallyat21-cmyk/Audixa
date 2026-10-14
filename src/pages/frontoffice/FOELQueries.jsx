import { CheckCircle2 } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import { FlagCard } from '../../components/execution/elShared'
import { evaluateELRequest, setPath } from '../../utils/elRequest.js'
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

  return (
    <FrontOfficeLayout title="EL Queries">
      <PageTransition>
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-navy">EL Queries</h1>
            <p className="mt-1 text-sm text-slate-500">Issues flagged while preparing engagement letter requests. Enter the missing information or resolve the difference; the request updates automatically.</p>
          </div>
          {withFlags.length === 0 && (
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
        </div>
      </PageTransition>
    </FrontOfficeLayout>
  )
}
