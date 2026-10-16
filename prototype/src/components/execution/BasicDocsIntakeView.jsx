import { useMemo, useRef, useState } from 'react'
import { CheckCircle2, FileUp, Loader2, Send, Sparkles } from 'lucide-react'
import { Card, Chip, Flags } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { readDocument } from './elShared'
import { useClientProfiles } from '../../utils/clientProfiles'
import { useLeads } from '../../utils/leadStore'
import { useIntakes, createIntake, issue, addItem, toggleItem, dropItem, receive, decide, retrievePY, remind, confirmFolder } from '../../utils/intakeStore'
import { FOLDERS, outstanding, referredItems, folderStatus, folderTree, isDone, FOLLOWUP_INTERVAL_DAYS } from '../../utils/intake'
import { financialYear } from '../../utils/proposalDraft'
import { foUser } from '../../data/sampleData'

const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const TONE = { Accepted: 'Pass', Confirmed: 'Pass', Retrieved: 'Pass', Rejected: 'Fail', Referred: 'Unclear', Missing: 'Fail', 'Not applicable': 'Not provided', 'Not issued': 'Not provided' }
const BOOL = (key, label) => ({ key, label, kind: 'bool' })
const FACTS = {
  proposal: [BOOL('signaturePresent', 'Signature present'), BOOL('stampPresent', 'Company stamp present'), BOOL('signatoryAuthorised', 'Signatory is authorised'), { key: 'fee', label: 'Fee on the proposal', kind: 'number' }, { key: 'periodFrom', label: 'Period from', kind: 'date' }, { key: 'periodTo', label: 'Period to', kind: 'date' }],
  cr: [{ key: 'legalName', label: 'Legal name', kind: 'text' }, { key: 'crNumber', label: 'CR number', kind: 'text' }, { key: 'validUntil', label: 'Valid until', kind: 'date' }],
  aoa: [{ key: 'legalName', label: 'Legal name', kind: 'text' }, BOOL('isLatestAmended', 'Latest amended version')],
  pyAudit: [{ key: 'fyYear', label: 'Report year', kind: 'number' }, BOOL('hasOpinion', 'Opinion included'), BOOL('hasFS', 'Financial statements included'), BOOL('hasNotes', 'Notes included')],
  zakat: [{ key: 'fyYear', label: 'Year', kind: 'number' }, { key: 'validUntil', label: 'Certificate valid until', kind: 'date' }],
  vat: [{ key: 'vatNumber', label: 'VAT number', kind: 'text' }, { key: 'legalName', label: 'Name on the certificate', kind: 'text' }],
  tb: [BOOL('coversFullPeriod', 'Covers the full period'), BOOL('hasTotals', 'Shows totals')],
  custom: [],
}
const COMMON = [BOOL('legible', 'Legible'), BOOL('complete', 'All pages present'), { key: 'confidence', label: 'AI confidence (0–1)', kind: 'number' }]
function sample(type, s, variant) {
  const ok = variant === 'valid'; const base = { legible: true, complete: true, confidence: 0.94 }
  const o = s.odoo || {}; const fy = s.fyYear; const thisYear = new Date().getFullYear()
  const by = {
    proposal: { signaturePresent: ok, stampPresent: true, signatoryAuthorised: true, fee: s.proposal?.fee, periodFrom: s.proposal?.periodFrom, periodTo: s.proposal?.periodTo },
    cr: { legalName: o.legalName, crNumber: o.crNumber, validUntil: ok ? `${thisYear + 1}-06-30` : `${thisYear - 1}-06-30` },
    aoa: { legalName: ok ? o.legalName : `${o.legalName} (old name)`, isLatestAmended: true },
    pyAudit: { fyYear: ok ? fy - 1 : fy - 3, hasOpinion: true, hasFS: true, hasNotes: true },
    zakat: { fyYear: fy - 1, validUntil: `${thisYear + 1}-03-31` },
    vat: { vatNumber: ok ? '300123456700003' : '12345', legalName: o.legalName },
    tb: { coversFullPeriod: ok, hasTotals: true },
    custom: {},
  }
  return { ...base, ...by[type] }
}

function FactsEditor({ item, s, onSubmit }) {
  const showToast = useToast(); const fileRef = useRef(null)
  const [facts, setFacts] = useState(() => sample(item.type, s, 'valid')); const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [note, setNote] = useState('')
  const fields = [...COMMON, ...(FACTS[item.type] || [])]
  const set = (k, v) => setFacts((f) => ({ ...f, [k]: v }))
  const pick = async (file) => {
    if (!file) return; setName(file.name); setBusy(true); setNote('')
    const r = await readDocument('intake', file)
    if (r.source === 'claude') { setFacts({ ...r.fields }); setNote(`Read by Claude. Check the values.${r.notes?.length ? ` ${r.notes.join(' · ')}` : ''}`) } else setNote(`${r.reason || 'Not read automatically'}. Review the values below (sample values are shown).`)
    setBusy(false)
  }
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}Choose the client's file</button>
        <span className="text-xs text-slate-500">{name || 'No file chosen (a demo file name is used)'}</span>
        <button onClick={() => setFacts(sample(item.type, s, 'valid'))} className="ml-auto text-xs font-semibold text-slate-500 underline">Sample: valid</button>
        <button onClick={() => setFacts(sample(item.type, s, 'issue'))} className="text-xs font-semibold text-slate-500 underline">Sample: with an issue</button>
      </div>
      {note && <p className="text-xs text-amber">{note}</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => f.kind === 'bool' ? (
          <label key={f.key} className="flex items-center justify-between gap-2 text-xs text-slate-500">{f.label}
            <select aria-label={f.label} value={facts[f.key] === true ? 'yes' : facts[f.key] === false ? 'no' : ''} onChange={(e) => set(f.key, e.target.value === '' ? null : e.target.value === 'yes')} className={INP}><option value="">Unclear</option><option value="yes">Yes</option><option value="no">No</option></select></label>
        ) : (
          <label key={f.key} className="flex items-center justify-between gap-2 text-xs text-slate-500">{f.label}
            <input aria-label={f.label} type={f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text'} value={facts[f.key] ?? ''} onChange={(e) => set(f.key, f.kind === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} className={`${INP} w-44`} /></label>
        ))}
      </div>
      <div className="flex justify-end"><button onClick={() => { onSubmit(name || `${item.label.toLowerCase().replace(/\s+/g, '_')}.pdf`, facts); showToast('Document validated and filed') }} className="flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white"><Sparkles className="h-3.5 w-3.5" />Validate and file</button></div>
    </div>
  )
}

// Process 1.2. role "fo": the FO collects the documents and follows up; role "pc": the Project Co-ordinator reviews.
export default function BasicDocsIntakeView({ role = 'fo', user = foUser }) {
  const showToast = useToast()
  const profiles = useClientProfiles(); const [leads] = useLeads(); const [intakes] = useIntakes()
  const [clientId, setClientId] = useState(''); const [open, setOpen] = useState(null); const [setup, setSetup] = useState({ hasPriorAudit: false, priorByAnalytix: false, vatRegistered: true, code: '', label: '' })
  const clients = useMemo(() => {
    const fromLeads = (leads || []).filter((l) => l.hasProposal || l.draft?.status === 'Sent').map((l) => ({ id: l.id, name: l.legalName || l.company, crNumber: l.crNumber, fee: l.draft?.data?.fee ?? l.prevProposal?.fee, yearEnd: l.yearEnd }))
    const fromProfiles = profiles.map((p) => ({ id: p.id, name: p.client, crNumber: p.crNumber, fee: p.services?.audit?.fee, yearEnd: '12-31' }))
    const seen = new Set(); return [...fromLeads, ...fromProfiles].filter((c) => (seen.has(c.name) ? false : seen.add(c.name)))
  }, [leads, profiles])
  const cl = clients.find((c) => c.id === clientId); const s = intakes[clientId]
  const run = (fn, okMsg) => { try { fn(); if (okMsg) showToast(okMsg) } catch (e) { showToast(e.message) } }
  const start = () => {
    const fy = financialYear(cl.yearEnd)
    const code = (setup.code || cl.name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 3) + '001').toUpperCase()
    createIntake({ clientId: cl.id, clientName: cl.name, clientCode: code, fyLabel: fy.label, fyYear: fy.year, hasPriorAudit: setup.hasPriorAudit, priorByAnalytix: setup.priorByAnalytix, vatRegistered: setup.vatRegistered, odoo: { legalName: cl.name, crNumber: cl.crNumber || '' }, proposal: { fee: cl.fee, periodFrom: fy.from, periodTo: fy.to } }, user)
  }
  const out = s ? outstanding(s) : []; const refs = s ? referredItems(s) : []; const st = s ? folderStatus(s) : null; const tree = s ? folderTree(s) : null

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-navy">Signed Proposal and Basic Documents</h1><p className="mt-1 text-sm text-slate-500">Process 1.2. {role === 'fo' ? 'Issue the checklist, collect and validate each document, and follow up on what is missing.' : 'Review the documents the AI could not settle and confirm that the client folder is complete.'}</p></div>
      <Card>
        <label className="text-xs font-medium text-slate-600">Client<select aria-label="Client" value={clientId} onChange={(e) => { setClientId(e.target.value); setOpen(null) }} className={`${INP} ml-2 min-w-[260px] font-normal normal-case`}><option value="">Select a client</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}{intakes[c.id] ? ' ✓' : ''}</option>)}</select></label>
      </Card>

      {cl && !s && (
        <Card title="Set up the checklist">
          {role !== 'fo' ? <p className="text-sm text-slate-500">The FO has not prepared the checklist for this client yet.</p> : (
            <div className="space-y-3 text-sm text-navy">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={setup.hasPriorAudit} onChange={(e) => setSetup({ ...setup, hasPriorAudit: e.target.checked })} className="accent-navy" />Audited in the previous year</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={setup.priorByAnalytix} onChange={(e) => setSetup({ ...setup, priorByAnalytix: e.target.checked, hasPriorAudit: e.target.checked || setup.hasPriorAudit })} className="accent-navy" />…by Analytix</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={setup.vatRegistered} onChange={(e) => setSetup({ ...setup, vatRegistered: e.target.checked })} className="accent-navy" />VAT registered</label>
                <label className="flex items-center gap-2 text-xs text-slate-500">Client code<input aria-label="Client code" value={setup.code} onChange={(e) => setSetup({ ...setup, code: e.target.value })} placeholder="auto" className={`${INP} w-28`} /></label>
              </div>
              <button onClick={() => run(start)} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-white">Prepare the checklist</button>
            </div>)}
        </Card>
      )}

      {s && (
        <>
          <Card title={`${s.clientName} · ${s.fyLabel} · ${s.clientCode}`} right={s.issued ? <Chip value="Pass" /> : <span className="text-xs text-slate-400">Not issued</span>}>
            <p className="text-xs text-slate-500">Odoo master: {s.odoo.legalName || '—'} · CR {s.odoo.crNumber || '—'} · approved fee {s.proposal.fee ?? '—'} · period {s.proposal.periodFrom} to {s.proposal.periodTo}</p>
            {!s.issued && role === 'fo' && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-500">Add or remove items before the checklist is issued. It goes to the client automatically when the proposal is accepted.</p>
                <AddItem onAdd={(label, folder) => run(() => addItem(clientId, label, folder))} />
                <button onClick={() => run(() => issue(clientId, user), 'Proposal accepted: checklist issued to the client')} className="rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white">Proposal accepted: issue the checklist</button>
              </div>
            )}
            {s.issued && s.priorByAnalytix && role === 'fo' && !s.items.some((i) => i.type === 'pyFS') && <button onClick={() => run(() => retrievePY(clientId, user), 'Previous year data retrieved')} className="mt-3 rounded-md border border-navy/30 px-3 py-1.5 text-xs font-semibold text-navy">Retrieve the previous year report, financial statements and trial balance</button>}
          </Card>

          <Card title="Checklist">
            <div className="hidden items-center gap-3 border-b border-slate-100 px-2 pb-2 md:flex text-[10px] font-semibold uppercase tracking-wide text-slate-400"><span className="flex-1">Document</span><span className="w-40">Folder</span><span className="w-36 text-center">Status</span><span className="w-72">Filed as</span><span className="w-40 text-right">Action</span></div>
            {s.items.map((i) => {
              const d = i.docs[i.docs.length - 1]
              return (
                <div key={i.id} className="border-b border-slate-100 last:border-0">
                  <div className="flex min-h-[48px] flex-wrap items-center gap-3 px-2 py-2 md:flex-nowrap">
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-navy">{i.label}{i.custom && <span className="ml-1 text-[10px] font-normal text-slate-400">(added)</span>}</p>{!i.applicable && <p className="text-[11px] text-slate-400">Not applicable to this client</p>}</div>
                    <span className="w-40 text-xs text-slate-500">{i.folder}</span>
                    <div className="w-36 [&>span]:w-full [&>span]:text-center"><Chip value={TONE[i.status] === 'Pass' ? 'Pass' : TONE[i.status] || 'Not provided'} /><p className="mt-0.5 text-center text-[10px] text-slate-400">{i.status}</p></div>
                    <span className="w-72 truncate text-xs text-slate-500" title={d?.name}>{d ? `${d.name}  (v${d.version})` : '—'}</span>
                    <div className="flex w-40 justify-end gap-2">
                      {!s.issued && role === 'fo' && <><button onClick={() => run(() => toggleItem(clientId, i.id, !i.applicable))} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-navy">{i.applicable ? 'Not needed' : 'Needed'}</button>{i.custom && <button onClick={() => run(() => dropItem(clientId, i.id))} className="text-xs font-semibold text-alert-red">Remove</button>}</>}
                      {s.issued && role === 'fo' && i.applicable && !isDone(i) && i.status !== 'Referred' && <button onClick={() => setOpen(open === i.id ? null : i.id)} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white">{i.status === 'Rejected' ? 'Re-upload' : 'Upload'}</button>}
                    </div>
                  </div>
                  {d && d.result.reasons.length > 0 && <div className="px-2 pb-2"><Flags flags={d.result.reasons.map((r) => `${r.kind === 'reject' ? 'Shown to the client: ' : 'For the Project Co-ordinator: '}${r.text}`)} /></div>}
                  {open === i.id && <div className="px-2 pb-3"><FactsEditor key={`${i.id}-${i.docs.length}`} item={i} s={s} onSubmit={(name, facts) => { run(() => receive(clientId, i.id, { originalName: name, facts }, user)); setOpen(null) }} /></div>}
                </div>
              )
            })}
          </Card>

          {s.issued && (
            <Card title={`Missing and invalid documents (${out.length})`}>
              {out.length === 0 ? <p className="text-sm text-emerald">Nothing is outstanding.</p> : (
                <div className="space-y-1.5">
                  {out.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center gap-3 text-sm text-navy">
                      <span className="min-w-[240px] flex-1"><b>{o.label}</b> · <span className={o.state === 'Missing' ? 'text-alert-red' : 'text-amber'}>{o.state}</span>{o.reason ? ` · ${o.reason}` : ''}</span>
                      <span className="text-xs text-slate-500">{o.ageDays} day(s) · {o.reminders} reminder(s){o.followUpDue ? ` · follow-up due (every ${FOLLOWUP_INTERVAL_DAYS} days)` : ''}</span>
                      {role === 'fo' && <button onClick={() => run(() => remind(clientId, o.id, user), `Reminder sent: ${o.label}`)} className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"><Send className="h-3 w-3" />Send reminder</button>}
                    </div>))}
                </div>)}
            </Card>
          )}

          {refs.length > 0 && (
            <Card title={`Referred to the Project Co-ordinator (${refs.length})`}>
              <div className="space-y-3">{refs.map((i) => (
                <Referred key={i.id} item={i} canDecide={role === 'pc'} onDecide={(decision, reason) => run(() => decide(clientId, i.id, decision, { by: user.name, reason }, user), decision === 'confirm' ? 'Document confirmed' : 'Document rejected: the reason is shown to the client')} />))}</div>
            </Card>
          )}

          <Card title={`Client folder · ${tree.root}`} right={st.complete ? (s.completeConfirmed ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald"><CheckCircle2 className="h-3.5 w-3.5" />Confirmed complete</span> : null) : <span className="text-xs text-amber">{st.open.length} item(s) open</span>}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{FOLDERS.map((f) => (
              <div key={f} className="rounded-lg border border-slate-200 p-2.5"><p className="mb-1 text-xs font-bold text-navy">{f}</p>
                {tree.folders[f].length === 0 ? <p className="text-[11px] text-slate-400">Empty</p> : tree.folders[f].map((x) => <p key={x.name} className="break-all text-[11px] text-slate-500" title={`Original: ${x.original}`}>{x.name}{x.status === 'Referred' ? ' (pending review)' : ''}</p>)}</div>))}</div>
            {role === 'pc' && s.issued && !s.completeConfirmed && <button disabled={!st.complete} onClick={() => run(() => confirmFolder(clientId, user), 'Client folder confirmed complete')} className="mt-3 rounded-md bg-navy px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Confirm that the folder is complete</button>}
            {!st.complete && s.issued && <p className="mt-2 text-[11px] text-slate-400">Open: {st.open.map((o) => `${o.label} (${o.status})`).join(', ')}</p>}
          </Card>
        </>
      )}
    </div>
  )
}
function AddItem({ onAdd }) {
  const [label, setLabel] = useState(''); const [folder, setFolder] = useState('Engagement')
  return <div className="flex flex-wrap gap-2"><input aria-label="New checklist item" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add a document to the checklist" className={`${INP} w-72`} /><select aria-label="Folder for the new item" value={folder} onChange={(e) => setFolder(e.target.value)} className={INP}>{FOLDERS.map((f) => <option key={f}>{f}</option>)}</select><button onClick={() => { onAdd(label, folder); setLabel('') }} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy">Add</button></div>
}
function Referred({ item, canDecide, onDecide }) {
  const [reason, setReason] = useState(''); const d = item.docs[item.docs.length - 1]
  return (
    <div className="rounded-lg border border-amber/30 bg-amber/5 p-3">
      <p className="text-sm font-semibold text-navy">{item.label} <span className="text-xs font-normal text-slate-500">· {d?.name}</span></p>
      <ul className="mt-1 list-disc pl-5 text-xs text-amber">{(d?.result.reasons || []).map((r, i) => <li key={i}>{r.text}</li>)}{item.note && <li>{item.note}</li>}</ul>
      {canDecide ? (
        <div className="mt-2 flex flex-wrap items-center gap-2"><button onClick={() => onDecide('confirm')} className="rounded-md bg-emerald px-3 py-1.5 text-xs font-semibold text-white">Confirm the document</button>
          <input aria-label="Rejection reason for the client" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason shown to the client (to reject)" className={`${INP} min-w-[260px] flex-1`} /><button onClick={() => onDecide('reject', reason)} className="rounded-md border border-alert-red/40 px-3 py-1.5 text-xs font-semibold text-alert-red">Reject</button></div>
      ) : <p className="mt-1 text-[11px] text-slate-400">Waiting for the Project Co-ordinator. Mismatches are not rejected automatically.</p>}
    </div>
  )
}
