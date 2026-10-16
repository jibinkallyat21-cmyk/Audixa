import { useMemo, useState } from 'react'
import { Archive, CheckCircle2, Lock } from 'lucide-react'
import { Card } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { useStore } from '../../utils/store'
import { useClientProfiles } from '../../utils/clientProfiles'
import { useELRequests } from '../../utils/elStore'
import { useQueries } from '../../utils/queriesStore'
import { useAuditLog, logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { completionGate } from '../../utils/queriesCore'
import { ITEMS, ARCHIVE_STEP, emptyClosure, evaluateClosure, markProblem, archiveRecord, reopenRecord, systemHint } from '../../utils/closureCore'

const SEL = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy'
const CHIP = { done: 'bg-emerald/10 text-emerald border-emerald/30', na: 'bg-slate-100 text-slate-500 border-slate-300', open: 'bg-amber/10 text-amber border-amber/30' }
const LABEL = { done: 'Done', na: 'Not applicable', open: 'Open' }
const EMPTY = {}

function useSignals(pid) {
  const { requests } = useELRequests()
  const { queries } = useQueries()
  const log = useAuditLog()
  const [docs] = useStore('basic-docs', EMPTY)
  const profiles = useClientProfiles()
  return useMemo(() => {
    const p = profiles.find((x) => x.id === pid)
    const r = requests.find((x) => x.profileId === pid)
    const mine = log.filter((e) => e.client === pid)
    return {
      elSigned: r?.signedStatus === 'VERIFIED AND COMPLETED', elVerified: r?.elStatus === 'VERIFIED',
      hasProposal: !!(p?.proposalReference || p?.source === 'proposal'), hasBasicDocs: !!docs[pid]?.aoa,
      queryGate: completionGate(queries, pid),
      unresolvedReviewComments: mine.filter((e) => e.category === 'review-comment' && !(e.extra?.resolved === true || e.extra?.resolved === 'true')).length,
      pendingAdjustments: mine.filter((e) => e.category === 'adjustment' && !['Approved', 'Rejected'].includes(e.extra?.approval)).length,
    }
  }, [pid, requests, queries, log, docs, profiles])
}

function Step({ it, locked, onSet, signals }) {
  const [evidence, setEvidence] = useState('')
  const [msg, setMsg] = useState('')
  const hint = systemHint(it.key, signals)
  const act = (kind) => { const p = markProblem(it.key, kind, evidence, signals); if (p) { setMsg(p); return } setMsg(''); onSet(it.key, kind, evidence.trim()); setEvidence('') }
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="text-sm font-semibold text-navy">{it.n}. {it.label}</p><p className="text-xs text-slate-500">{it.hint}</p></div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${CHIP[it.status]}`}>{LABEL[it.status]}{it.system ? ' (from the platform)' : ''}</span>
      </div>
      {it.note && <p className="mt-1 text-xs text-slate-600"><b>Evidence:</b> {it.note}</p>}
      {hint && it.status === 'open' && <p className="mt-1 text-xs text-amber">{hint}</p>}
      {it.block && <p className="mt-1 text-xs font-semibold text-alert-red">Blocked: {it.block}</p>}
      {!locked && it.status !== 'done' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input aria-label={`Evidence for ${it.label}`} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder={it.na ? 'Evidence or reference, or the reason it does not apply' : 'Evidence or reference'} className={`${SEL} min-w-[240px] flex-1 py-1.5 text-xs`} />
          <button onClick={() => act('done')} className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90">Mark done</button>
          {it.na && <button onClick={() => act('na')} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">Not applicable</button>}
        </div>
      )}
      {!locked && it.status !== 'open' && !it.system && <button onClick={() => onSet(it.key, 'open', '')} className="mt-1 text-[11px] font-semibold text-slate-500 underline">Reopen this step</button>}
      {msg && <p className="mt-1 text-xs text-alert-red">{msg}</p>}
    </div>
  )
}

// Process 6.4. Shared by the Audit Team and Manager portals.
export default function ArchiveView() {
  const showToast = useToast()
  const profiles = useClientProfiles()
  const [all, setAll] = useStore('closure', EMPTY)
  const [pid, setPid] = useState('')
  const [reason, setReason] = useState('')
  const me = currentUser()
  const profile = profiles.find((p) => p.id === pid) || null
  const record = (pid && all[pid]) || emptyClosure()
  const signals = useSignals(pid)
  const ev = useMemo(() => evaluateClosure({ record, signals }), [record, signals])
  const save = (rec) => setAll((cur) => ({ ...cur, [pid]: rec }))
  const log = (title, description) => logEvent({ client: pid, clientName: profile.client, category: 'general', title, description, user: me })

  const onSet = (key, kind, evidence) => {
    const it = ITEMS.find((x) => x.key === key)
    save({ ...record, items: { ...record.items, [key]: kind === 'open' ? { status: 'open' } : { status: kind, evidence, by: me.name, at: new Date().toISOString().slice(0, 10) } } })
    log(`Closure step ${it.n}: ${it.label} ${kind === 'open' ? 'reopened' : kind === 'na' ? 'marked not applicable' : 'completed'}`, evidence)
  }
  const archive = () => { save(archiveRecord(record, me.name, new Date().toISOString())); log('Audit file archived and closed', `All ${ITEMS.length} closure steps satisfied`); showToast(`${profile.client} archived`) }
  const reopen = () => { try { save(reopenRecord(record, me.name, reason, new Date().toISOString())); log('Archived file reopened', reason); setReason(''); showToast('File reopened') } catch (e) { showToast(e.message) } }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy">Audit File Archiving and Closure</h1>
        <p className="mt-1 text-sm text-slate-500">Process 6.4. Complete every step before the engagement is marked Completed / Closed and the file is archived.</p>
      </div>
      <select aria-label="Client" value={pid} onChange={(e) => setPid(e.target.value)} className={`${SEL} w-full max-w-md`}>
        <option value="">Select a client</option>
        {profiles.map((p) => <option key={p.id} value={p.id}>{p.client} · {p.auditor}{all[p.id]?.archived ? ' (archived)' : ''}</option>)}
      </select>

      {profile && (
        <>
          {ev.archived && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald/30 bg-emerald/5 p-4">
              <Lock className="mt-0.5 h-5 w-5 text-emerald" />
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald">Archived and closed</p>
                <p className="text-xs text-slate-600">By {record.archived.by} on {new Date(record.archived.at).toLocaleString('en-GB')}. The file is read-only.</p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <input aria-label="Reason to reopen" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason to reopen the file" className={`${SEL} min-w-[240px] flex-1 py-1.5 text-xs`} />
                  <button onClick={reopen} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">Reopen</button>
                </div>
              </div>
            </div>
          )}

          <Card title="Progress">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald transition-all" style={{ width: `${(ev.satisfied / ev.total) * 100}%` }} /></div>
            <p className="mt-1 text-xs text-slate-500">{ev.satisfied} of {ev.total} steps done or not applicable.</p>
            {ev.blockers.length > 0 && !ev.archived && <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-slate-500">What is still open ({ev.blockers.length})</summary><ul className="mt-1 list-disc pl-5 text-xs text-slate-600">{ev.blockers.map((b) => <li key={b}>{b}</li>)}</ul></details>}
          </Card>

          <div className="space-y-2">{ev.items.map((it) => <Step key={`${pid}-${it.key}`} it={it} locked={ev.archived} onSet={onSet} signals={signals} />)}</div>

          <Card title={`${ARCHIVE_STEP.n}. ${ARCHIVE_STEP.label}`}>
            <p className="text-xs text-slate-500">{ARCHIVE_STEP.hint}</p>
            {ev.archived ? <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald"><CheckCircle2 className="h-4 w-4" />Archived</p> : (
              <>
                <button onClick={archive} disabled={!ev.ready} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35] disabled:opacity-40"><Archive className="h-4 w-4" />Archive the audit file</button>
                {!ev.ready && <p className="mt-1 text-xs text-slate-500">Available once steps 1 to 17 are done or not applicable.</p>}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
