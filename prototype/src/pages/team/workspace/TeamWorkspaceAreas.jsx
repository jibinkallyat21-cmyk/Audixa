import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ChevronRight, ArrowRight, Wrench, Scissors, FileText, PenLine, CheckCircle2 } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import { Card, Chip, DataTable, Empty, SecondaryButton, PrimaryButton } from '../../../components/execution/ReviewParts'
import CutOffTool from '../../../components/execution/CutOffTool'
import ConfirmationTab from '../../../components/execution/ConfirmationTab'
import SamplingTab from '../../../components/execution/SamplingTab'
import VouchingTab from '../../../components/execution/VouchingTab'
import SalaryTab from '../../../components/execution/SalaryTab'
import GosiEosbTab from '../../../components/execution/GosiEosbTab'
import PrepaidTab from '../../../components/execution/PrepaidTab'
import DepreciationTab from '../../../components/execution/DepreciationTab'
import { useDemoClient } from '../../../utils/useDemoClient'
import { useIssuedLists } from '../../../utils/requirementsStore'
import { useProcedureStatuses, setSubStatus } from '../../../utils/procedureStore'
import { AREAS, findArea, areaFigures, areaProgress, procStatusKey } from '../../../utils/auditAreas'

const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const KIND = { tool: [Wrench, 'Working tool'], cutoff: [Scissors, 'Cut-off'], requirement: [FileText, 'From the client'], notes: [PenLine, 'Your notes'] }
const STATUSES = ['Not Started', 'In Progress', 'Complete']
const DONE = ['Uploaded Processing', 'Under Review', 'Accepted']

function Crumbs({ parts }) {
  return <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">{parts.map((p, i) => <span key={i} className="flex items-center gap-1.5">{i > 0 && <ChevronRight className="h-3.5 w-3.5" />}{p.to ? <Link to={p.to} className="font-medium text-navy hover:underline">{p.label}</Link> : <span className="font-semibold text-navy">{p.label}</span>}</span>)}</nav>
}

// What the client has done on a requirement or on the items sent for a procedure.
function clientStatus(proc, area, issued) {
  const cats = issued?.categories || []
  if (proc.kind === 'requirement') {
    const it = cats.flatMap((c) => c.items).find((i) => proc.match.test(i.text))
    if (!it) return { text: 'Not on the requirement list', tone: 'grey' }
    return DONE.includes(it.status) ? { text: it.status === 'Accepted' ? 'Accepted' : 'Received from the client', tone: 'green', file: it.filename } : { text: 'Waiting for the client', tone: 'amber' }
  }
  if (proc.kind === 'cutoff') {
    const c = cats.find((x) => x.id === `cut-${proc.area}`)
    return c ? { text: `${c.items.filter((i) => DONE.includes(i.status)).length} of ${c.items.length} cut-off items uploaded`, tone: 'amber' } : { text: 'No items sent yet', tone: 'grey' }
  }
  return null
}

function ToolBody({ proc, dc }) {
  const common = { client: dc.slug, clientName: dc.client }
  switch (proc.tool) {
    case 'confirmation': return <ConfirmationTab {...common} legalName={dc.client} />
    case 'party-sample': return <SamplingTab firm={dc.auditor} initialMode="party" initialArea={proc.area} {...common} />
    case 'sales-sample': return <SamplingTab firm={dc.auditor} initialMode="sales" initialArea="Revenue" {...common} />
    case 'cogs-sample': return <SamplingTab firm={dc.auditor} initialMode="sales" initialKind="Purchase Report" initialArea="COGS" {...common} />
    case 'exp-sample': return <SamplingTab firm={dc.auditor} initialMode="expense" initialArea="Expenses" {...common} />
    case 'vouching': return <VouchingTab firm={dc.auditor} initialKind={proc.vouch || 'sales'} {...common} />
    case 'salary': return <SalaryTab {...common} />
    case 'gosi': return <GosiEosbTab clientName={dc.client} />
    case 'prepaid': return <PrepaidTab {...common} />
    case 'depreciation': return <DepreciationTab {...common} />
    default: return null
  }
}

function AreaGrid({ dc, statuses }) {
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-navy">Audit areas</h2><p className="mt-1 text-sm text-slate-500">Pick an area to see its accounts and the procedures to follow. Everything below comes from {dc.client}'s trial balance.</p></div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {AREAS.map((a) => {
          const f = areaFigures(a, dc.ledgers); const pr = areaProgress(a, statuses)
          return (
            <Link key={a.id} to={`?area=${a.id}`} className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-navy">{a.label}</h3><p className="mt-1 text-sm text-slate-500">{a.blurb}</p></div><ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-navy" /></div>
              <div className="mt-5 flex items-end justify-between"><div><p className="text-xs font-medium text-slate-500">Balance in the trial balance</p><p className="mt-0.5 text-xl font-bold text-navy">{f.ledgers.length ? money(Math.abs(f.total)) : '—'}<span className="ml-1.5 text-xs font-medium text-slate-400">{f.ledgers.length ? (f.total >= 0 ? 'Dr' : 'Cr') : ''}</span></p></div><p className="text-sm text-slate-500">{f.ledgers.length} account{f.ledgers.length === 1 ? '' : 's'}</p></div>
              <div className="mt-5"><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-slate-600">{pr.done} of {pr.total} procedure{pr.total === 1 ? '' : 's'} done</span><span className="text-slate-400">{pr.pct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald" style={{ width: `${pr.pct}%` }} /></div></div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function AreaView({ area, dc, statuses, issued }) {
  const f = areaFigures(area, dc.ledgers)
  return (
    <div className="space-y-6">
      <Crumbs parts={[{ label: 'Audit areas', to: '?' }, { label: area.label }]} />
      <div><h2 className="text-xl font-bold text-navy">{area.label}</h2><p className="mt-1 text-sm text-slate-500">{area.blurb}</p></div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card title="Accounts in this area" subtitle="From the trial balance">
          {f.ledgers.length ? <DataTable columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Account' }, { key: 'closing', label: 'Balance', render: (r) => <span className="tabular-nums">{money(Math.abs(r.closing))} <span className="text-xs text-slate-400">{r.closing >= 0 ? 'Dr' : 'Cr'}</span></span> }]} rows={f.ledgers} /> : <Empty>No accounts with a balance in this area.</Empty>}
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Total <b className="text-navy">{money(Math.abs(f.total))} {f.total >= 0 ? 'Dr' : 'Cr'}</b></div>
        </Card>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procedures</p>
          {area.procedures.map((p) => {
            const [Icon, kindLabel] = KIND[p.kind]; const st = statuses[procStatusKey(area.id, p.id)] || 'Not Started'; const cs = clientStatus(p, area, issued)
            return (
              <Link key={p.id} to={`?area=${area.id}&proc=${p.id}`} className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy"><Icon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold text-navy">{p.label}</h3><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{kindLabel}</span></div>
                  <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
                  {cs && <p className={`mt-2 text-sm font-medium ${cs.tone === 'green' ? 'text-emerald' : cs.tone === 'amber' ? 'text-amber' : 'text-slate-400'}`}>{cs.text}{cs.file ? ` · ${cs.file}` : ''}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3"><Chip value={st === 'Complete' ? 'Pass' : st === 'In Progress' ? 'Unclear' : 'Not provided'} /><span className="hidden text-sm text-slate-500 sm:block">{st}</span><ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-navy" /></div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProcView({ area, proc, dc, statuses, issued }) {
  const key = procStatusKey(area.id, proc.id); const st = statuses[key] || 'Not Started'; const note = statuses[`note:${key}`] || ''; const cs = clientStatus(proc, area, issued)
  const [Icon] = KIND[proc.kind]
  return (
    <div className="space-y-6">
      <Crumbs parts={[{ label: 'Audit areas', to: '?' }, { label: area.label, to: `?area=${area.id}` }, { label: proc.label }]} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/10 text-navy"><Icon className="h-6 w-6" /></div><div><h2 className="text-xl font-bold text-navy">{proc.label}</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">{proc.desc}</p></div></div>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Status">{STATUSES.map((s) => <button key={s} onClick={() => setSubStatus(dc.slug, key, s)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${st === s ? (s === 'Complete' ? 'bg-emerald text-white shadow-sm' : 'bg-white text-navy shadow-sm') : 'text-slate-500 hover:text-navy'}`}>{s}</button>)}</div>
      </div>

      {proc.kind === 'tool' && <ToolBody proc={proc} dc={dc} />}
      {proc.kind === 'cutoff' && <CutOffTool area={proc.area} client={dc.slug} firm={dc.auditor} />}
      {proc.kind === 'requirement' && (
        <Card title="What the client has sent" subtitle="This is on the client's requirement list. You review it there.">
          {cs && <div className={`rounded-xl border px-5 py-4 text-sm font-semibold ${cs.tone === 'green' ? 'border-emerald/30 bg-emerald/5 text-emerald' : cs.tone === 'amber' ? 'border-amber/30 bg-amber/5 text-amber' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{cs.text}{cs.file ? ` · ${cs.file}` : ''}</div>}
          <Link to="/team/workspace/requirements"><SecondaryButton>Open the requirement list</SecondaryButton></Link>
        </Card>
      )}
      <Card title="Your notes and conclusion" subtitle="What you checked, what you found, what you concluded. Saved with the file.">
        <textarea aria-label="Notes" value={note} onChange={(e) => setSubStatus(dc.slug, `note:${key}`, e.target.value)} rows={4} className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" />
        <div className="flex flex-wrap items-center gap-3">{st !== 'Complete' ? <PrimaryButton onClick={() => setSubStatus(dc.slug, key, 'Complete')}><CheckCircle2 className="h-4 w-4" />Mark this procedure complete</PrimaryButton> : <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald"><CheckCircle2 className="h-4 w-4" />Complete</p>}<Link to={`?area=${area.id}`} className="text-sm font-semibold text-navy hover:underline">Back to {area.label}</Link></div>
      </Card>
    </div>
  )
}

export default function TeamWorkspaceAreas() {
  const dc = useDemoClient(); const [params] = useSearchParams()
  const statuses = useProcedureStatuses(dc.slug); const issued = useIssuedLists()[dc.slug]
  const area = findArea(params.get('area')); const proc = area?.procedures.find((p) => p.id === params.get('proc'))
  const body = useMemo(() => {
    if (!dc.ready) return <Empty>Load the demo client to try the audit areas. Every figure here comes from the client's trial balance.</Empty>
    if (area && proc) return <ProcView area={area} proc={proc} dc={dc} statuses={statuses} issued={issued} />
    if (area) return <AreaView area={area} dc={dc} statuses={statuses} issued={issued} />
    return <AreaGrid dc={dc} statuses={statuses} />
  }, [dc, area, proc, statuses, issued])
  return (
    <AuditTeamLayout title="File Workspace">
      <PageTransition>
        <WorkspaceHeader fileSlug="al-marai" />
        <div className="mt-2">{body}</div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
