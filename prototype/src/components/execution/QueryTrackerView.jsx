import { useMemo, useState } from 'react'
import { DEMO_DATA } from '../../utils/features'
import { AlertTriangle, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Card } from './ReviewParts'
import { FieldInput } from './elShared'
import { useToast } from '../shared/Toast'
import { useQueries } from '../../utils/queriesStore'
import { useClientProfiles } from '../../utils/clientProfiles'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { teamMembers, leadWorkload } from '../../data/sampleData'
import {
  AREAS, PRIORITIES, newQuery, isOverdue, daysOverdue, followUpDue, shouldEscalate, closeBlockers, completionGate, sortForAttention, summarize, awaitingReview, isOpen,
} from '../../utils/queriesCore'

const SEL = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy'
const today = () => new Date().toISOString().slice(0, 10)
const addDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const PEOPLE = [...new Set([...leadWorkload.map((l) => l.name), ...teamMembers.map((m) => m.name)])]
const ESCALATE_TO = ['Audit Lead', 'Audit Manager', 'Partner']
const PRI_STYLE = { Critical: 'bg-alert-red/10 text-alert-red border-alert-red/30', High: 'bg-amber/10 text-amber border-amber/30', Normal: 'bg-slate-100 text-slate-500 border-slate-300' }
const ST_STYLE = { Open: 'bg-blue-100 text-blue-700 border-blue-300', Replied: 'bg-amber/10 text-amber border-amber/30', 'Follow-up': 'bg-amber/10 text-amber border-amber/30', Escalated: 'bg-alert-red/10 text-alert-red border-alert-red/30', Closed: 'bg-emerald/10 text-emerald border-emerald/30' }
const pill = (style, text) => <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${style}`}>{text}</span>

function demoQueries(profiles, existing) {
  const pick = (i) => profiles[i % profiles.length]
  const specs = [
    ['Payroll and GOSI', 'GOSI contribution variance on the September payroll register', 'Critical', -9, -4, 'Fahad Al-Otaibi'],
    ['Revenue', 'Unbilled revenue entry of SAR 450,000 on 29 September: please provide the contract', 'High', -6, 2, 'Sara Al-Qahtani'],
    ['Cash and bank', 'Bank confirmation letters for the Al-Rajhi account', 'High', -12, -5, 'Omar Al-Harbi'],
    ['Fixed assets', 'Support for the disposal of vehicle 4521', 'Normal', -3, 4, 'Fahad Al-Otaibi'],
    ['Tax and Zakat', 'Zakat return for the prior year', 'Normal', -2, 8, 'Sara Al-Qahtani'],
  ]
  let qs = existing
  const made = specs.map(([area, description, priority, raised, due, owner], i) => {
    const p = pick(i)
    const q = newQuery({ queries: qs, client: p.id, clientName: p.client, area, description, owner, dueDate: addDays(due), priority, raisedAt: addDays(raised), raisedBy: owner })
    qs = [q, ...qs]
    return q
  })
  return made
}

function QueryCard({ q, onChange }) {
  const showToast = useToast()
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState({ dateReceived: today(), replyDate: today(), responseText: '' })
  const [follow, setFollow] = useState('')
  const [esc, setEsc] = useState({ to: 'Audit Lead', note: '' })
  const t = today()
  const me = currentUser()
  const overdue = isOverdue(q, t)
  const blockers = closeBlockers(q)
  const log = (title, description = '') => logEvent({ client: q.client, clientName: q.clientName, category: 'query', title: `${q.no}: ${title}`, description, extra: { queryNo: q.no }, user: me })
  const change = (patch, text, description) => {
    onChange({ ...q, ...patch, history: [{ at: t, by: me.name, text }, ...q.history] })
    log(text, description)
  }
  const flags = []
  if (overdue) flags.push(`Overdue by ${daysOverdue(q, t)} days`)
  if (followUpDue(q, t)) flags.push('Follow-up due')
  if (shouldEscalate(q, t)) flags.push('Should be escalated')
  if (awaitingReview(q)) flags.push('Response awaiting review')

  return (
    <div className={`rounded-xl border bg-white shadow-sm ${q.priority === 'Critical' && isOpen(q) ? 'border-alert-red/40' : 'border-slate-200'}`}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left">
        <span className="font-mono text-xs font-semibold text-navy">{q.no}</span>
        <span className="min-w-0 flex-1 basis-64 text-sm text-navy">{q.description}</span>
        <span className="text-xs text-slate-500">{q.clientName} · {q.area}</span>
        {pill(PRI_STYLE[q.priority], q.priority)}{pill(ST_STYLE[q.status], q.status)}
        <span className={`text-xs ${overdue ? 'font-semibold text-alert-red' : 'text-slate-500'}`}>Due {q.dueDate || 'not set'}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {flags.length > 0 && <p className="flex flex-wrap gap-2 px-4 pb-2 text-[11px] font-semibold text-alert-red">{flags.map((f) => <span key={f} className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{f}</span>)}</p>}
      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-3">
          <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
            {[['Raised', `${q.raisedAt} by ${q.raisedBy}`], ['Person responsible', q.owner], ['Replied?', q.replied], ['Date received', q.dateReceived || '—'], ['Reply date', q.replyDate || '—'], ['Closed', q.closedAt || '—']].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-slate-50 py-1"><dt className="font-semibold text-slate-500">{k}</dt><dd className="text-navy">{v}</dd></div>
            ))}
          </dl>
          {q.responseText && <p className="rounded-lg bg-slate-50 p-3 text-xs text-navy"><b>Response:</b> {q.responseText}</p>}

          {isOpen(q) && (
            <>
              {q.replied !== 'Replied' && (
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="mb-2 text-xs font-semibold text-navy">Record the client's reply</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <FieldInput input={{ path: 'dateReceived', label: 'Date received', type: 'date' }} fields={reply} onChange={(p, v) => setReply({ ...reply, [p]: v })} />
                    <FieldInput input={{ path: 'replyDate', label: 'Reply date', type: 'date' }} fields={reply} onChange={(p, v) => setReply({ ...reply, [p]: v })} />
                    <FieldInput input={{ path: 'responseText', label: 'Response / documents received' }} fields={reply} onChange={(p, v) => setReply({ ...reply, [p]: v })} />
                  </div>
                  <button onClick={() => { change({ replied: 'Replied', status: 'Replied', ...reply }, 'Client reply recorded', reply.responseText); showToast(`${q.no}: reply recorded`) }} className="mt-2 rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90">Record reply</button>
                  <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                    <div className="min-w-[220px] flex-1"><FieldInput input={{ path: 'follow', label: 'Follow-up note' }} fields={{ follow }} onChange={(_, v) => setFollow(v)} /></div>
                    <button disabled={!follow.trim()} onClick={() => { onChange({ ...q, status: q.status === 'Escalated' ? 'Escalated' : 'Follow-up', followUps: [...q.followUps, { date: t, note: follow.trim(), by: me.name }], history: [{ at: t, by: me.name, text: `Follow-up: ${follow.trim()}` }, ...q.history] }); log('Follow-up', follow.trim()); setFollow('') }} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 disabled:opacity-40">Log follow-up</button>
                  </div>
                </div>
              )}
              {q.replied === 'Replied' && (
                <div className="space-y-1.5 rounded-lg border border-slate-100 p-3">
                  <p className="text-xs font-semibold text-navy">Review the response</p>
                  {[['responseReviewed', 'I have reviewed the response (team responses are reviewed before they go to the client)'], ['addressed', 'The response and supporting documents fully address the original query'], ['clientConfirmed', 'The client has confirmed the response is clear and satisfactory']].map(([k, label]) => (
                    <label key={k} className="flex items-start gap-2 text-sm text-navy"><input type="checkbox" checked={!!q[k]} onChange={(e) => change({ [k]: e.target.checked }, `${label.split(' (')[0]}: ${e.target.checked ? 'yes' : 'no'}`)} className="mt-0.5 h-4 w-4 accent-navy" />{label}</label>
                  ))}
                  <button onClick={() => { change({ replied: 'Not replied', status: 'Follow-up', responseReviewed: false, addressed: false, clientConfirmed: false }, 'Further clarification needed from the client'); }} className="text-xs font-semibold text-slate-500 underline">The response is not enough: ask the client for more</button>
                </div>
              )}
              {q.status !== 'Escalated' && (
                <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-100 p-3">
                  <div><label htmlFor={`esc-${q.id}`} className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Escalate to</label>
                    <select id={`esc-${q.id}`} value={esc.to} onChange={(e) => setEsc({ ...esc, to: e.target.value })} className={SEL}>{ESCALATE_TO.map((x) => <option key={x}>{x}</option>)}</select></div>
                  <div className="min-w-[200px] flex-1"><FieldInput input={{ path: 'note', label: 'Why' }} fields={esc} onChange={(p, v) => setEsc({ ...esc, [p]: v })} /></div>
                  <button disabled={!esc.note.trim()} onClick={() => { onChange({ ...q, status: 'Escalated', escalations: [...q.escalations, { date: t, to: esc.to, note: esc.note.trim(), by: me.name }], history: [{ at: t, by: me.name, text: `Escalated to ${esc.to}: ${esc.note.trim()}` }, ...q.history] }); log(`Escalated to ${esc.to}`, esc.note.trim()); setEsc({ ...esc, note: '' }) }} className="rounded-md border border-alert-red/40 px-3 py-1.5 text-xs font-semibold text-alert-red hover:bg-alert-red/5 disabled:opacity-40">Escalate</button>
                </div>
              )}
              <div>
                <button disabled={blockers.length > 0} onClick={() => { onChange({ ...q, status: 'Closed', closedAt: t, history: [{ at: t, by: me.name, text: 'Query closed' }, ...q.history] }); log('Query closed'); showToast(`${q.no} closed`) }} className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">Close the query</button>
                {blockers.length > 0 && <ul className="mt-1 list-disc pl-5 text-[11px] text-slate-500">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>}
              </div>
            </>
          )}
          {(q.followUps.length > 0 || q.escalations.length > 0) && (
            <p className="text-xs text-slate-500">{q.followUps.length} follow-up(s), {q.escalations.length} escalation(s){q.escalations.length ? `: last to ${q.escalations[q.escalations.length - 1].to}` : ''}.</p>
          )}
          <details><summary className="cursor-pointer text-xs font-semibold text-slate-500">History</summary><ul className="mt-1 space-y-0.5 text-xs text-slate-500">{q.history.map((h, i) => <li key={i}>{h.at} · {h.by} · {h.text}</li>)}</ul></details>
        </div>
      )}
    </div>
  )
}

// Process 6.2. Shared by the Audit Team and Manager portals.
export default function QueryTrackerView() {
  const showToast = useToast()
  const { queries, upsert, setQueries } = useQueries()
  const profiles = useClientProfiles()
  const me = currentUser()
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ client: '', status: '', owner: '', priority: '', pending: false })
  const [form, setForm] = useState({ client: '', area: AREAS[0], description: '', owner: PEOPLE[0], dueDate: addDays(7), priority: 'Normal' })
  const [gateClient, setGateClient] = useState('')
  const t = today()

  const shown = useMemo(() => sortForAttention(queries.filter((q) => (!f.client || q.client === f.client) && (!f.status || q.status === f.status) && (!f.owner || q.owner === f.owner) && (!f.priority || q.priority === f.priority) && (!f.pending || (isOpen(q) && q.replied !== 'Replied')))), [queries, f])
  const sum = useMemo(() => summarize(queries, t), [queries, t])
  const gate = useMemo(() => completionGate(queries, gateClient), [queries, gateClient])
  const raise = () => {
    const p = profiles.find((x) => x.id === form.client)
    if (!p || !form.description.trim() || !form.dueDate) { showToast('Choose the client and enter a description and due date'); return }
    const q = newQuery({ queries, client: p.id, clientName: p.client, area: form.area, description: form.description, owner: form.owner, dueDate: form.dueDate, priority: form.priority, raisedAt: t, raisedBy: me.name })
    upsert(q)
    logEvent({ client: p.id, clientName: p.client, category: 'query', title: `${q.no}: query raised`, description: q.description, extra: { queryNo: q.no, area: q.area, owner: q.owner, due: q.dueDate }, user: me })
    setForm({ ...form, description: '' }); setAdding(false); showToast(`${q.no} raised`)
  }
  const tiles = [['Open', sum.open, ''], ['Overdue', sum.overdue, 'text-alert-red'], ['Critical', sum.critical, 'text-alert-red'], ['Awaiting review', sum.awaitingReview, 'text-amber'], ['Follow-up due', sum.followUp, 'text-amber'], ['To escalate', sum.escalate, 'text-alert-red'], ['Closed', sum.closed, 'text-emerald']]
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy">Client Query Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">Process 6.2. Every client query in one place, with owners, due dates, follow-up and escalation.</p>
        </div>
        <div className="flex gap-2">
          {DEMO_DATA && <button onClick={() => { setQueries((cur) => [...demoQueries(profiles, cur), ...cur]); showToast('Demo queries added') }} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50">Add demo queries</button>}
          <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-[#D12C35]"><Plus className="h-3.5 w-3.5" />Raise a query</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map(([label, n, tone]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><p className={`text-2xl font-bold ${n ? tone || 'text-navy' : 'text-slate-300'}`}>{n}</p><p className="text-[11px] text-slate-500">{label}</p></div>)}
      </div>

      {adding && (
        <Card title="Raise a query">
          <div className="grid gap-2 sm:grid-cols-3">
            <div><label htmlFor="qc" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Client</label><select id="qc" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className={`${SEL} w-full`}><option value="">Select a client</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.client}</option>)}</select></div>
            <div><label htmlFor="qa" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Audit area</label><select id="qa" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={`${SEL} w-full`}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></div>
            <div><label htmlFor="qo" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Person responsible</label><select id="qo" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className={`${SEL} w-full`}>{PEOPLE.map((a) => <option key={a}>{a}</option>)}</select></div>
            <FieldInput input={{ path: 'dueDate', label: 'Due date', type: 'date' }} fields={form} onChange={(p, v) => setForm({ ...form, [p]: v })} />
            <div><label htmlFor="qp" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Priority</label><select id="qp" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={`${SEL} w-full`}>{PRIORITIES.map((a) => <option key={a}>{a}</option>)}</select></div>
            <div className="sm:col-span-3"><FieldInput input={{ path: 'description', label: 'Query description' }} fields={form} onChange={(p, v) => setForm({ ...form, [p]: v })} /></div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Give High or Critical to queries that block a significant procedure or a deadline. Critical queries are followed up daily.</p>
          <button onClick={raise} className="mt-2 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90">Raise the query</button>
        </Card>
      )}

      <Card>
        <div className="grid gap-2 sm:grid-cols-5">
          <select aria-label="Client" value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} className={SEL}><option value="">All clients</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.client}</option>)}</select>
          <select aria-label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={SEL}><option value="">Any status</option>{['Open', 'Replied', 'Follow-up', 'Escalated', 'Closed'].map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Person responsible" value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} className={SEL}><option value="">Anyone</option>{PEOPLE.map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Priority" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} className={SEL}><option value="">Any priority</option>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select>
          <label className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={f.pending} onChange={(e) => setF({ ...f, pending: e.target.checked })} className="h-4 w-4 accent-navy" />Pending replies only</label>
        </div>
      </Card>

      <div className="space-y-2">
        {shown.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">No queries match. Raise one or add the demo queries.</p>}
        {shown.map((q) => <QueryCard key={q.id} q={q} onChange={upsert} />)}
      </div>

      <Card title="Final review before audit completion">
        <p className="mb-2 text-xs text-slate-500">All important queries closed, required responses received, no critical query outstanding, tracker up to date.</p>
        <select aria-label="Client for the review" value={gateClient} onChange={(e) => setGateClient(e.target.value)} className={SEL}><option value="">All clients</option>{profiles.map((p) => <option key={p.id} value={p.id}>{p.client}</option>)}</select>
        <div className={`mt-3 rounded-lg border px-4 py-3 ${gate.ok ? 'border-emerald/30 bg-emerald/5 text-emerald' : 'border-alert-red/30 bg-alert-red/5 text-alert-red'}`}>
          <p className="text-sm font-bold">{gate.ok ? 'No query blocks audit completion' : 'Audit completion is blocked'}</p>
          {!gate.ok && <ul className="mt-1 list-disc pl-5 text-xs">{gate.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
          <p className="mt-1 text-xs text-slate-600">{gate.open} open of {gate.total} queries{gate.open > 0 && gate.ok ? ', none of them important' : ''}.</p>
        </div>
      </Card>
    </div>
  )
}
