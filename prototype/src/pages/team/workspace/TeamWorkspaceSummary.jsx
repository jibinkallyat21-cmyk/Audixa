import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Printer, AlertTriangle, CheckCircle2 } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import { Card, Stat, Empty, SecondaryButton } from '../../../components/execution/ReviewParts'
import { useDemoClient } from '../../../utils/useDemoClient'
import { useIssuedLists } from '../../../utils/requirementsStore'
import { useProcedureStatuses } from '../../../utils/procedureStore'
import { useQueries } from '../../../utils/queriesStore'
import { AREAS } from '../../../utils/auditAreas'
import { fileSummary } from '../../../utils/sampleTracking'

const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const BS = ['cash', 'receivables', 'prepayments', 'ppe', 'inventory', 'payables', 'accruals', 'payroll', 'borrowings', 'related', 'equity', 'unclassified']
const PL = ['revenue', 'cogs', 'expenses', 'tax']

function AreaTable({ title, ids, sum }) {
  const rows = ids.map((id) => sum.rows.find((r) => r.id === id)).filter((r) => r && (r.id !== 'unclassified' || r.accounts > 0))
  return (
    <Card title={title}>
      <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm">
        <thead><tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Area</th><th className="px-4 py-3 text-right">Balance (SAR)</th><th className="px-4 py-3">Procedures</th><th className="px-4 py-3 text-right">Sent to the client</th><th className="px-4 py-3 text-right">Waiting</th><th className="px-4 py-3 text-right">Rejected</th></tr></thead>
        <tbody>{rows.map((r, k) => (
          <tr key={r.id} className={`border-t border-slate-100 ${k % 2 ? 'bg-slate-50' : ''}`}>
            <td className="px-4 py-3"><Link to={`/team/workspace/areas?area=${r.id}`} className="font-semibold text-navy hover:underline">{r.label}</Link><span className="block text-xs text-slate-400">{r.accounts} account{r.accounts === 1 ? '' : 's'}</span></td>
            <td className="px-4 py-3 text-right tabular-nums text-navy">{r.accounts ? `${money(Math.abs(r.balance))} ${r.balance >= 0 ? 'Dr' : 'Cr'}` : '—'}</td>
            <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald" style={{ width: `${r.total ? (r.done / r.total) * 100 : 0}%` }} /></div><span className="text-xs text-slate-600">{r.done} of {r.total}</span></div></td>
            <td className="px-4 py-3 text-right text-navy">{r.sent || '—'}</td>
            <td className={`px-4 py-3 text-right ${r.waiting ? 'font-semibold text-amber' : 'text-slate-400'}`}>{r.waiting || '—'}</td>
            <td className={`px-4 py-3 text-right ${r.rejected ? 'font-semibold text-alert-red' : 'text-slate-400'}`}>{r.rejected || '—'}</td>
          </tr>))}</tbody></table></div>
    </Card>
  )
}

// One page for the Team Lead: where the file stands, what needs attention, and each area. Everything comes from the file's own data.
export default function TeamWorkspaceSummary() {
  const dc = useDemoClient(); const statuses = useProcedureStatuses(dc.slug); const issued = useIssuedLists()[dc.slug]; const { queries } = useQueries()
  const sum = useMemo(() => (dc.ready ? fileSummary({ areas: AREAS, ledgers: dc.ledgers, rec: issued, statuses, queries: queries.filter((q) => q.client === dc.slug), tb: dc.tb }) : null), [dc, issued, statuses, queries])
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <AuditTeamLayout title="File Workspace">
      <PageTransition>
        <WorkspaceHeader fileSlug="al-marai" />
        {!sum ? <div className="mt-2"><Empty>Load the demo client to see its file summary.</Empty></div> : (
          <div className="mt-2 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold text-navy">File summary</h2><p className="mt-1 text-sm text-slate-500">{dc.client} · {dc.file.code} · {dc.auditor} · statutory deadline {dc.file.statutoryDue} · as at {today}</p></div>
              <SecondaryButton onClick={() => window.print()}><Printer className="h-4 w-4" />Print or save as PDF</SecondaryButton>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Requirements received" value={`${sum.req.received} of ${sum.req.total}`} tone={sum.req.received === sum.req.total ? 'green' : 'navy'} />
              <Stat label="Accepted" value={sum.req.accepted} tone="green" />
              <Stat label="Procedures done" value={`${sum.procedures.done} of ${sum.procedures.total}`} />
              <Stat label="Open queries" value={sum.queries.open} tone={sum.queries.open ? 'amber' : 'green'} />
            </div>

            <Card title="Needs your attention">
              {sum.attention.length === 0 ? <p className="flex items-center gap-2 text-sm font-medium text-emerald"><CheckCircle2 className="h-4 w-4" />Nothing is waiting on you right now.</p>
                : <ul className="space-y-2">{sum.attention.map((a, i) => <li key={i} className="flex gap-3 rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm text-navy"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />{a}</li>)}</ul>}
            </Card>

            <Card title="Samples and cut-off" subtitle="What was sent to the client after approval.">
              <div className="grid gap-3 sm:grid-cols-2">
                {[['Samples', sum.samples], ['Cut-off', sum.cutoff]].map(([l, c]) => <div key={l} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600"><p className="text-base font-semibold text-navy">{l}</p>{c.total ? <p className="mt-1">{c.total} sent · {c.accepted} accepted · {c.uploaded} to review · {c.waiting} waiting · {c.rejected} rejected</p> : <p className="mt-1">None sent yet.</p>}</div>)}
              </div>
              <Link to="/team/workspace/requirements" className="text-sm font-semibold text-navy hover:underline">Open the requirement list</Link>
            </Card>

            <AreaTable title="Balance sheet areas" ids={BS} sum={sum} />
            <AreaTable title="Profit and loss areas" ids={PL} sum={sum} />

            <Card title="Not covered by this page yet">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>Basic documents (CR, AOA, MISA, VAT certificate and the others): see <Link to="/team/basic-documents" className="font-semibold text-navy hover:underline">Basic documents</Link>.</li>
                <li>Statutory data from GOSI, ZATCA, Muqeem and Mudad: the "Collect data" buttons are planned for the real build.</li>
                <li>Balances that need a person's judgement (inventory, related parties, equity) show their own notes inside each area.</li>
              </ul>
            </Card>
          </div>
        )}
      </PageTransition>
    </AuditTeamLayout>
  )
}
