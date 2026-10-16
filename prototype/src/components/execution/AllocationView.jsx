import { useMemo, useState } from 'react'
import { Card, DataTable } from './ReviewParts'
import { FieldInput } from './elShared'
import { useToast } from '../shared/Toast'
import { useClientProfiles } from '../../utils/clientProfiles'
import { useAllocations, useCapacity } from '../../utils/allocationStore'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { leadWorkload } from '../../data/sampleData'
import { REVENUE_CATEGORIES } from '../../data/feeSchedule'
import { AUDIT_TYPES } from '../../data/firms.js'
import {
  emptyFactors, scoreComplexity, effectiveComplexity, rankCandidates, CHECKLIST, allocationProblems, EXPERIENCE, MAX_POINTS, THRESHOLDS,
} from '../../utils/allocationCore'

const SEL = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy'
const TONE = { Low: 'bg-emerald/10 text-emerald border-emerald/30', Medium: 'bg-amber/10 text-amber border-amber/30', High: 'bg-alert-red/10 text-alert-red border-alert-red/30' }
const PREV_NONE = 'None available'

function Capacity({ capacity, update, extraFiles }) {
  return (
    <Card title="Team capacity and experience (edit as needed)">
      <p className="mb-2 text-xs text-slate-500">Starting values for the demo; the manager keeps these up to date. Files already include allocations made here.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400"><th className="p-1.5">Lead</th><th className="p-1.5">Files</th><th className="p-1.5">High-complexity</th><th className="p-1.5">Due within 30 days</th><th className="p-1.5">Review duties</th><th className="p-1.5">On leave</th><th className="p-1.5">Experience (tick)</th></tr></thead>
          <tbody>
            {leadWorkload.map((l) => {
              const c = capacity[l.name]
              return (
                <tr key={l.name} className="border-b border-slate-50 align-top">
                  <td className="p-1.5 font-medium text-navy">{l.name}<span className="block text-[10px] font-normal text-slate-400">{l.seniority}</span></td>
                  <td className="p-1.5 text-navy">{l.files + (extraFiles[l.name] || 0)}</td>
                  {['highComplexityFiles', 'dueSoon', 'reviewDuties'].map((k) => <td key={k} className="p-1.5"><input aria-label={`${k} for ${l.name}`} type="number" min="0" value={c[k]} onChange={(e) => update(l.name, { [k]: Number(e.target.value) })} className="w-14 rounded border border-slate-200 bg-white px-1.5 py-1 text-navy" /></td>)}
                  <td className="p-1.5"><input aria-label={`On leave: ${l.name}`} type="checkbox" checked={c.onLeave} onChange={(e) => update(l.name, { onLeave: e.target.checked })} className="accent-navy" /></td>
                  <td className="p-1.5"><div className="flex flex-wrap gap-x-2">{EXPERIENCE.map(([k, label]) => <label key={k} title={label} className="flex items-center gap-0.5 text-[10px] text-slate-500"><input type="checkbox" aria-label={`${label}: ${l.name}`} checked={!!c.experience[k]} onChange={(e) => update(l.name, { experience: { ...c.experience, [k]: e.target.checked } })} className="accent-navy" />{label.replace(/^(Experience with |Knowledge of |Sufficient |Previous experience with )/, '')}</label>)}</div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// Process 6.1. Used in the Manager portal.
export default function AllocationView() {
  const showToast = useToast()
  const profiles = useClientProfiles()
  const { capacity, update } = useCapacity()
  const { allocations, add } = useAllocations()
  const me = currentUser()
  const [pid, setPid] = useState('')
  const [factors, setFactors] = useState(emptyFactors())
  const [override, setOverride] = useState({ value: '', reason: '' })
  const [lead, setLead] = useState('')
  const [checklist, setChecklist] = useState({})

  const extraFiles = useMemo(() => allocations.reduce((m, a) => ({ ...m, [a.lead]: (m[a.lead] || 0) + 1 }), {}), [allocations])
  const profile = profiles.find((p) => p.id === pid) || null
  const score = useMemo(() => scoreComplexity(factors), [factors])
  const complexity = effectiveComplexity(score, override)
  const candidates = useMemo(() => leadWorkload.map((l) => ({ name: l.name, seniority: l.seniority, files: l.files + (extraFiles[l.name] || 0), ...capacity[l.name] })), [capacity, extraFiles])
  const ranked = useMemo(() => rankCandidates({ complexity, candidates, prevNames: [factors.prevLead, factors.prevMember] }), [complexity, candidates, factors.prevLead, factors.prevMember])
  const problems = allocationProblems({ factors, score, lead, checklist, override })

  const pick = (id) => {
    setPid(id); setLead(''); setChecklist({}); setOverride({ value: '', reason: '' })
    const p = profiles.find((x) => x.id === id)
    setFactors({ ...emptyFactors(), auditType: p?.auditType || '', turnover: p?.revenueCategory || '' })
  }
  const setF = (patch) => setFactors((f) => ({ ...f, ...patch }))
  const confirm = () => {
    const rec = { id: `al-${Date.now().toString(36)}`, client: pid, clientName: profile.client, firm: profile.auditor, factors, points: score.points, complexity: score.complexity, override: override.value && override.reason.trim() ? override : null, effective: complexity, lead, date: new Date().toISOString().slice(0, 10), by: me.name }
    add(rec)
    logEvent({ client: pid, clientName: profile.client, category: 'allocation', title: `File allocated to ${lead}`, description: `${complexity} complexity (${score.points} points)${rec.override ? `, overridden: ${override.reason}` : ''}`, extra: { assignedTo: lead, allocatedBy: me.name }, user: me })
    showToast(`${profile.client} allocated to ${lead}`)
    setPid(''); setLead(''); setChecklist({}); setFactors(emptyFactors())
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy">File Allocation and Workload</h1>
        <p className="mt-1 text-sm text-slate-500">Process 6.1. Give the file to the right team based on its complexity, the workload and the experience needed.</p>
      </div>

      <Card title="1. Choose the file">
        <select aria-label="Client" value={pid} onChange={(e) => pick(e.target.value)} className={`${SEL} w-full max-w-md`}>
          <option value="">Select a client</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.client} · {p.auditor}{allocations.some((a) => a.client === p.id) ? ' (allocated)' : ''}</option>)}
        </select>
        {profile && <p className="mt-1 text-xs text-slate-500">Audit type and turnover are taken from the client profile; change them here if they are wrong.</p>}
      </Card>

      {profile && (
        <>
          <Card title="2. The file">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="f-type" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type of audit</label>
                <select id="f-type" value={factors.auditType} onChange={(e) => setF({ auditType: e.target.value })} className={`${SEL} w-full`}><option value="">Select</option>{AUDIT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label htmlFor="f-turn" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Turnover of the client</label>
                <select id="f-turn" value={factors.turnover} onChange={(e) => setF({ turnover: e.target.value })} className={`${SEL} w-full`}><option value="">Select</option>{REVENUE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
              <div className="sm:col-span-2"><p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nature of the business</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1">{[['inventory', 'Involves inventory'], ['receivablesPayables', 'Significant receivables / payables'], ['complicatedAreas', 'Complicated accounting areas'], ['industryRules', 'Industry-specific requirements']].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={factors.business[k]} onChange={(e) => setF({ business: { ...factors.business, [k]: e.target.checked } })} className="h-4 w-4 accent-navy" />{l}</label>))}</div>
                <div className="mt-2"><FieldInput input={{ path: 'description', label: 'What the client does and its main revenue streams' }} fields={factors.business} onChange={(p, v) => setF({ business: { ...factors.business, [p]: v } })} /></div></div>
              <label className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={factors.firstYear} onChange={(e) => setF({ firstYear: e.target.checked })} className="h-4 w-4 accent-navy" />First-year audit (otherwise recurring)</label>
              <label className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={factors.newClient} onChange={(e) => setF({ newClient: e.target.checked })} className="h-4 w-4 accent-navy" />New client (otherwise existing)</label>
              {!factors.newClient && (
                <>
                  <div><label htmlFor="f-pl" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Previous-year lead</label>
                    <select id="f-pl" value={factors.prevLead} onChange={(e) => setF({ prevLead: e.target.value })} className={`${SEL} w-full`}><option value="">Select</option><option>{PREV_NONE}</option>{leadWorkload.map((l) => <option key={l.name}>{l.name}</option>)}</select></div>
                  <FieldInput input={{ path: 'prevMember', label: 'Previous-year team member (if different)' }} fields={factors} onChange={(p, v) => setF({ [p]: v })} />
                  <FieldInput input={{ path: 'prevIssues', label: 'Significant issues / outstanding matters last year', type: 'number' }} fields={factors} onChange={(p, v) => setF({ [p]: Number(v) })} />
                  <FieldInput input={{ path: 'prevIssuesNote', label: 'Difficult areas or areas needing attention' }} fields={factors} onChange={(p, v) => setF({ [p]: v })} />
                </>
              )}
            </div>
          </Card>

          <Card title="3. Complexity" right={<span className={`rounded-full border px-3 py-1 text-xs font-bold ${TONE[complexity]}`}>{complexity}{complexity !== score.complexity ? ' (manager override)' : ''}</span>}>
            <p className="text-sm text-navy">{score.points} of {MAX_POINTS} points: Low below {THRESHOLDS.medium}, Medium {THRESHOLDS.medium} to {THRESHOLDS.high - 1}, High {THRESHOLDS.high} and above. The score suggests <b>{score.complexity}</b>.</p>
            <DataTable columns={[{ key: 'factor', label: 'Factor' }, { key: 'why', label: 'Value' }, { key: 'points', label: 'Points' }]} rows={score.lines.filter((l) => l.points > 0 || ['Audit type', 'Turnover category'].includes(l.factor))} />
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div><label htmlFor="ov" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Manager override</label>
                <select id="ov" value={override.value} onChange={(e) => setOverride({ ...override, value: e.target.value })} className={`${SEL} w-full`}><option value="">Use the score</option><option>Low</option><option>Medium</option><option>High</option></select></div>
              {override.value && <div className="sm:col-span-2"><FieldInput input={{ path: 'reason', label: 'Reason for the override (required)' }} fields={override} onChange={(p, v) => setOverride({ ...override, [p]: v })} /></div>}
            </div>
            <p className="mt-2 text-xs text-slate-500">{complexity === 'Low' ? 'Low: can go to a team member with less experience or spare capacity.' : complexity === 'Medium' ? 'Medium: an experienced associate or lead with appropriate supervision.' : 'High: an experienced team with a suitable lead and adequate review support.'}</p>
          </Card>

          <Card title="4. Choose the lead">
            <DataTable
              columns={[
                { key: 'pick', label: '', render: (r) => <input type="radio" name="lead" aria-label={`Allocate to ${r.name}`} disabled={r.onLeave} checked={lead === r.name} onChange={() => setLead(r.name)} className="accent-navy" /> },
                { key: 'name', label: 'Lead', render: (r) => <span className="font-medium">{r.name}<span className="block text-[10px] font-normal text-slate-400">{r.seniority}</span></span> },
                { key: 'fit', label: 'Fit', render: (r) => <span className={r.eligible ? '' : 'text-alert-red'}>{r.eligible ? (r === ranked[0] ? 'Best fit' : 'Suitable') : 'Not suitable'}</span> },
                { key: 'exp', label: 'Experience', render: (r) => `${r.exp}/6` },
                { key: 'files', label: 'Files' }, { key: 'load', label: 'Workload' }, { key: 'capacity', label: 'Spare capacity' },
                { key: 'notes', label: 'Notes', render: (r) => <span className="text-xs text-slate-500">{r.notes.join(' ') || '—'}</span> },
              ]}
              rows={ranked} />
          </Card>

          <Card title="5. Final allocation review">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {CHECKLIST.map(([k, label]) => <label key={k} className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" checked={checklist[k] === true} onChange={(e) => setChecklist({ ...checklist, [k]: e.target.checked })} className="h-4 w-4 accent-navy" />{label}</label>)}
            </div>
            {problems.length > 0 && <ul className="mt-3 list-disc pl-5 text-xs text-slate-500">{problems.map((p) => <li key={p}>{p}</li>)}</ul>}
            <button onClick={confirm} disabled={problems.length > 0} className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35] disabled:opacity-40">Confirm allocation</button>
          </Card>
        </>
      )}

      <Capacity capacity={capacity} update={update} extraFiles={extraFiles} />

      <Card title={`Allocations made (${allocations.length})`}>
        {allocations.length === 0 ? <p className="text-sm text-slate-400">None yet.</p> : (
          <DataTable columns={[{ key: 'date', label: 'Date' }, { key: 'clientName', label: 'Client' }, { key: 'effective', label: 'Complexity', render: (a) => `${a.effective} (${a.points} pts)${a.override ? ', overridden' : ''}` }, { key: 'lead', label: 'Lead' }, { key: 'by', label: 'Allocated by' }]} rows={allocations} />
        )}
      </Card>
    </div>
  )
}
