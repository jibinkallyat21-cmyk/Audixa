import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { draftProposal, canSubmit, transition, DRAFT_SETTINGS } from '../../utils/proposalDraft'
import { AUDITORS, AUDIT_TYPES, ProposalError, addGeneratedProposal, generateProposal, emailProposal } from '../../utils/proposals'
import { saveClientProfile, profileFromProposal } from '../../utils/clientProfiles'
import { saveDraft, updateLead } from '../../utils/leadStore'
import { logEvent } from '../../utils/auditLog'
import { foUser } from '../../data/sampleData'

const INP = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy outline-none focus:border-navy'
const STATUS_TONE = { Draft: 'bg-slate-100 text-slate-500 border-slate-300', 'Pending approval': 'bg-amber/10 text-amber border-amber/30', Returned: 'bg-alert-red/10 text-alert-red border-alert-red/30', Approved: 'bg-emerald/10 text-emerald border-emerald/30', Sent: 'bg-blue-100 text-blue-700 border-blue-300' }
const ROLE_FO = { actor: foUser.name, role: 'FO' }; const ROLE_MGR = { actor: foUser.name, role: 'FO Manager' }

// Process 1.1: the AI prepares the draft, the FO edits it, the FO Manager approves, only the FO sends.
export default function LeadProposalModal({ lead, onClose }) {
  const showToast = useToast()
  const prep = useMemo(() => draftProposal(lead), [lead])
  const stored = lead.draft
  const [data, setData] = useState(() => stored?.data || prep.draft)
  const [state, setState] = useState(() => stored ? { status: stored.status, log: stored.log || [], comments: stored.comments || '' } : { status: 'Draft', log: [] })
  const [justification, setJustification] = useState(stored?.justification || '')
  const [returnNote, setReturnNote] = useState('')
  const [phase, setPhase] = useState('idle'); const [failure, setFailure] = useState(''); const [result, setResult] = useState(null)
  const editable = ['Draft', 'Returned'].includes(state.status)
  if (prep.blocked) {
    return (
      <Shell onClose={onClose} title="Draft proposal" sub={lead.company}>
        <div className="flex items-start gap-2 rounded-lg border border-alert-red/30 bg-alert-red/5 p-3 text-sm text-alert-red"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{prep.reason}</div>
        <div className="mt-4 flex justify-end"><button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-navy">Close</button></div>
      </Shell>
    )
  }
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }))
  const missing = prep.missing.filter((m) => {
    const map = { 'Legal name (as on the CR)': data.legalName, 'CR number': data.crNumber, 'Contact person': data.contactName, 'Auditor (ABCPA / MISCPA)': data.auditor, Fee: data.fee }
    const key = Object.keys(map).find((k) => m.startsWith(k.split(' (')[0])); return !key || !String(map[key] ?? '').trim()
  })
  const feeOutside = lead.revenueCategory ? (Math.abs(Number(data.fee) - (prep.matrix || Number(data.fee))) / (prep.matrix || 1) * 100 > DRAFT_SETTINGS.matrixTolerancePct) : false
  const persist = (next, j = justification, d = data) => { setState(next); saveDraft(lead.id, { status: next.status, log: next.log, comments: next.comments, justification: j, data: d }) }
  const act = (action, extra = {}, who = ROLE_FO) => {
    try { const next = transition({ ...state }, action, { ...who, ...extra }); persist(next); logEvent({ client: lead.id, clientName: lead.company, category: 'general', title: `Draft proposal: ${action}`, description: `${state.status} → ${next.status}${extra.comments ? ` · ${extra.comments}` : ''}`, user: { name: who.actor, role: who.role } }); return next } catch (e) { showToast(e.message); return null }
  }
  const submit = () => {
    const chk = canSubmit({ justification }, { missing, outside: feeOutside })
    if (!chk.ok) { showToast(chk.errors[0]); return }
    act('submit')
  }
  const send = async (demo = false) => {
    setPhase('working'); setFailure('')
    try {
      const form = { client: data.legalName, contactName: data.contactName, contactEmail: data.contactEmail, crNumber: data.crNumber, city: data.city, auditor: data.auditor, auditType: data.auditType, auditFee: Number(data.fee), services: {}, applyDiscount: false, revenueCategory: data.revenueCategory }
      const record = await generateProposal(form, foUser.name, { demo }); addGeneratedProposal(record)
      saveClientProfile(profileFromProposal(form, record))
      let mail = { delivered: false, reason: '' }; try { mail = await emailProposal(record) } catch (e) { mail = { delivered: false, reason: e.message } }
      const next = act('send', {}, ROLE_FO); if (!next) { setPhase('idle'); return }
      updateLead(lead.id, { hasProposal: true, odooStatus: 'Proposal sent', proposalRef: record.reference }, 'Proposal sent', foUser.name)
      setResult({ record, mail }); setPhase('done')
    } catch (e) { setFailure(e instanceof ProposalError ? e.message : 'Could not reach the proposal service.'); setPhase('failed') }
  }
  return (
    <Shell onClose={onClose} title="Draft proposal" sub={`${lead.company} · ${data.period.label}`} status={state.status}>
      {phase === 'done' ? (
        <div className="space-y-3 text-sm text-navy">
          <p className="flex items-center gap-2 font-semibold text-emerald"><CheckCircle2 className="h-4 w-4" />Proposal {result.record.reference} sent</p>
          <p className="text-xs text-slate-500">{result.mail.delivered ? 'Emailed to the client.' : `Email not delivered (${result.mail.reason || 'not configured'}).`} The proposal and its status are saved on the platform; the Odoo update runs when Odoo is connected (demo mode).</p>
          <div className="flex justify-end"><button onClick={onClose} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-white">Done</button></div>
        </div>
      ) : (
        <div className="space-y-4">
          {state.status === 'Returned' && <div className="rounded-lg border border-alert-red/30 bg-alert-red/5 p-3 text-xs text-alert-red"><b>Returned by the approver:</b> {state.comments}</div>}
          {missing.length > 0 && <div className="rounded-lg border border-amber/30 bg-amber/5 p-3 text-xs text-amber">The AI could not complete: {missing.join(', ')}. Fill these before submitting.</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Legal name (as on the CR)"><input aria-label="Legal name" disabled={!editable} value={data.legalName} onChange={(e) => set('legalName', e.target.value)} className={INP} /><Missing ok={!!data.legalName} label="legal name" /></F>
            <F label="CR number"><input aria-label="CR number" disabled={!editable} value={data.crNumber} onChange={(e) => set('crNumber', e.target.value)} className={INP} /><Missing ok={!!data.crNumber} label="CR number" /></F>
            <F label="Contact person"><input aria-label="Contact person" disabled={!editable} value={data.contactName} onChange={(e) => set('contactName', e.target.value)} className={INP} /></F>
            <F label="Contact email"><input aria-label="Contact email" disabled={!editable} value={data.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className={INP} /></F>
            <F label="Auditor"><select aria-label="Auditor" disabled={!editable} value={data.auditor} onChange={(e) => set('auditor', e.target.value)} className={INP}><option value="">Select</option>{AUDITORS.map((a) => <option key={a}>{a}</option>)}</select><Flag prep={prep} field="Auditor" /><Missing ok={!!data.auditor} label="auditor" /></F>
            <F label="Audit type"><select aria-label="Audit type" disabled={!editable} value={data.auditType} onChange={(e) => set('auditType', e.target.value)} className={INP}>{AUDIT_TYPES.map((a) => <option key={a}>{a}</option>)}</select><Flag prep={prep} field="Audit type" /></F>
            <F label="Period (financial year under audit)"><p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-navy">{data.period.from} to {data.period.to}</p><Flag prep={prep} field="Period" /><Basis t={prep.basis.period} /></F>
            <F label="Framework"><input aria-label="Framework" disabled={!editable} value={data.framework} onChange={(e) => set('framework', e.target.value)} className={INP} /><Flag prep={prep} field="Framework" /><Basis t={prep.basis.framework} /></F>
            <F label="Audit fee (SAR, excl. VAT)"><input aria-label="Audit fee" type="number" disabled={!editable} value={data.fee ?? ''} onChange={(e) => set('fee', e.target.value)} className={INP} /><Flag prep={prep} field="Fee" /><Basis t={prep.basis.fee} /><Missing ok={data.fee !== null && data.fee !== ''} label="fee" /></F>
            <F label="Scope"><textarea aria-label="Scope" disabled={!editable} rows={3} value={data.scope} onChange={(e) => set('scope', e.target.value)} className={INP} /><Flag prep={prep} field="Scope" /><Basis t={prep.basis.scope} /></F>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500"><p className="mb-1 font-semibold text-navy">Standard terms (template)</p>{Object.entries(data.terms).map(([k, v]) => <p key={k}><span className="font-semibold capitalize">{k}:</span> {v}</p>)}</div>
          {feeOutside && <div className="rounded-lg border border-amber/30 bg-amber/5 p-3 text-xs text-amber"><p className="font-semibold">Fee outside the fee matrix</p><p>{prep.reason || 'The fee differs from the matrix fee by more than the allowed tolerance.'} A justification for the approver is required before it can be submitted.</p><textarea aria-label="Justification" disabled={!editable} rows={2} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Justification for the approver" className={`${INP} mt-2`} /></div>}
          {state.status === 'Pending approval' && (
            <div className="rounded-lg border border-slate-200 p-3"><p className="mb-2 text-xs font-semibold text-navy">FO Manager approval</p>
              <textarea aria-label="Return comments" rows={2} value={returnNote} onChange={(e) => setReturnNote(e.target.value)} placeholder="Comments (required to return it to the FO)" className={INP} />
              <div className="mt-2 flex gap-2"><button onClick={() => act('approve', {}, ROLE_MGR)} className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white">Approve (as FO Manager)</button><button onClick={() => { if (act('return', { comments: returnNote }, ROLE_MGR)) setReturnNote('') }} className="rounded-md border border-alert-red/40 px-3 py-1.5 text-xs font-semibold text-alert-red">Return to FO</button></div></div>
          )}
          {state.log.length > 0 && <details className="text-xs text-slate-500"><summary className="cursor-pointer font-semibold text-navy">Approval log ({state.log.length})</summary>{state.log.map((l, i) => <p key={i}>{new Date(l.at).toLocaleString('en-GB')} · {l.actor} ({l.role}) · {l.action}: {l.from} → {l.to}{l.comments ? ` · ${l.comments}` : ''}</p>)}</details>}
          {phase === 'failed' && <div className="rounded-lg border border-alert-red/30 bg-alert-red/5 p-3 text-xs text-alert-red">{failure} <button onClick={() => send(true)} className="ml-2 font-semibold underline">Generate a demo document instead</button></div>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
            <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-navy">Close</button>
            {editable && <button onClick={() => { persist(state, justification, data); showToast('Draft saved') }} className="rounded-md border border-navy/30 px-4 py-2 text-xs font-semibold text-navy">Save draft</button>}
            {editable && <button onClick={() => { persist(state, justification, data); submit() }} className="rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white">Submit for approval</button>}
            {state.status === 'Approved' && <button disabled={phase === 'working'} onClick={() => send(false)} className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{phase === 'working' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Send to client (as FO)</button>}
          </div>
        </div>
      )}
    </Shell>
  )
}
function Shell({ onClose, title, sub, status, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between"><div><h3 className="text-sm font-bold text-navy">{title}</h3><p className="text-xs text-slate-500">{sub}</p></div>
          <div className="flex items-center gap-3">{status && <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_TONE[status]}`}>{status}</span>}<button aria-label="Close" onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button></div></div>
        {children}
      </motion.div>
    </div>
  )
}
const F = ({ label, children }) => <div><label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>{children}</div>
const Basis = ({ t }) => (t ? <p className="mt-1 text-[10px] text-slate-400">{t}</p> : null)
const Flag = ({ prep, field }) => { const c = prep.changed.find((x) => x.field === field); return c ? <span className="ml-1 rounded bg-amber/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber">Differs from last year (was {String(c.previous) || 'blank'})</span> : null }
const Missing = ({ ok, label }) => (ok ? null : <span className="ml-1 rounded bg-alert-red/10 px-1.5 py-0.5 text-[10px] font-semibold text-alert-red">Could not be completed: {label}</span>)
