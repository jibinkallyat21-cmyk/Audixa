import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCopy, FileText, Loader2, Plus, Send, Sparkles, Upload } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { FieldInput, FlagCard, readDocument } from '../../components/execution/elShared'
import ELVerificationPanel from '../../components/execution/ELVerificationPanel'
import { evaluateELRequest, setPath, requiredDocs, DOC_LABEL, normalizeAuditType, fmtDate, fmtAmount } from '../../utils/elRequest.js'
import { newELRequest, useCoordinators, useELRequests } from '../../utils/elStore'
import { applyProfile, getClientProfile, saveClientProfile, SERVICE_KEYS, SERVICE_LABEL, useClientProfiles } from '../../utils/clientProfiles'
import { teamUser } from '../../data/sampleData'
import { FIRMS } from '../../data/firms.js'

const DOC_FIELDS = {
  proposal: [
    { path: 'proposal.companyName', label: 'Company name' },
    { path: 'proposal.auditType', label: 'Audit type' },
    { path: 'proposal.yearEnd', label: 'Year-end (proposal column)', type: 'date' },
    { path: 'proposal.revenue', label: 'Revenue (SR)', type: 'number' },
    { path: 'proposal.auditFee', label: 'Audit fee (SR, excl. VAT)', type: 'number' },
    { path: 'proposal.auditFeeUnclear', label: 'Audit fee unclear in proposal', type: 'checkbox' },
    { path: 'proposal.translationOpted', label: 'Translation opted', type: 'checkbox' },
    { path: 'proposal.translationFee', label: 'Translation fee (SR)', type: 'number' },
    { path: 'proposal.zakatOpted', label: 'Zakat filing opted', type: 'checkbox' },
    { path: 'proposal.zakatFee', label: 'Zakat filing fee (SR)', type: 'number' },
    { path: 'proposal.accountsOpted', label: 'Account finalisation opted', type: 'checkbox' },
    { path: 'proposal.accountsFee', label: 'Account finalisation fee (SR)', type: 'number' },
    { path: 'proposal.signed', label: 'Proposal is signed', type: 'checkbox' },
  ],
  cr: [
    { path: 'cr.companyName', label: 'Company name (English)' },
    { path: 'cr.entityType', label: 'Business entity (as on CR)' },
    { path: 'cr.crNumber', label: 'CR number' },
    { path: 'cr.startDate', label: 'CR start date', type: 'date' },
  ],
  aoa: [
    { path: 'aoa.companyName', label: 'Company name (English)' },
    { path: 'aoa.capital', label: 'Capital (as stated)' },
    { path: 'aoa.yearEndDay', label: 'Year-end day', type: 'number', min: 1, max: 31 },
    { path: 'aoa.yearEndMonth', label: 'Year-end month', type: 'number', min: 1, max: 12 },
    { path: 'aoa.startsFromCR', label: 'First year runs from the CR start date', type: 'checkbox' },
  ],
  misaClosure: [{ path: 'liquidation.misaClosureDate', label: 'Date of the letter', type: 'date' }],
  ministryLetter: [{ path: 'liquidation.ministryLetterDate', label: 'Date of the letter', type: 'date' }],
}

// Where each value the reader returns is stored.
function applyExtraction(fields, docType, extracted) {
  let next = fields
  const put = (path, v) => { if (v !== null && v !== undefined && v !== '') next = setPath(next, path, v) }
  if (docType === 'misaClosure') put('liquidation.misaClosureDate', extracted.date)
  else if (docType === 'ministryLetter') put('liquidation.ministryLetterDate', extracted.date)
  else for (const [k, v] of Object.entries(extracted)) put(`${docType}.${k}`, typeof v === 'number' ? String(v) : v)
  return next
}

function sampleFields(client, auditType, withIssues) {
  let f = {}
  const base = {
    'proposal.companyName': client, 'proposal.auditType': auditType, 'proposal.yearEnd': '2025-12-31', 'proposal.revenue': '2500000',
    'proposal.auditFee': '18500', 'proposal.signed': true, 'proposal.translationOpted': true, 'proposal.translationFee': '1500',
    'proposal.zakatOpted': true, 'proposal.zakatFee': '3000', 'proposal.accountsOpted': true, 'proposal.accountsFee': '4000',
    'cr.companyName': client, 'cr.entityType': 'Limited Liability Company (LLC)', 'cr.crNumber': '1010123456', 'cr.startDate': '2022-03-15',
    'aoa.companyName': client, 'aoa.capital': 'SR 500,000', 'aoa.yearEndDay': 31, 'aoa.yearEndMonth': 12,
    'liquidation.misaClosureDate': '2025-09-10', 'liquidation.ministryLetterDate': '2025-10-20',
  }
  if (withIssues) Object.assign(base, { 'aoa.companyName': client.replace(/Co\.?$/i, 'Company'), 'proposal.revenue': '', 'aoa.yearEndDay': 30, 'aoa.yearEndMonth': 6 })
  Object.entries(base).forEach(([p, v]) => { f = setPath(f, p, v) })
  return f
}

function DocCard({ type, req, canEdit, onUpdate }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const doc = req.docs?.[type]
  const showToast = useToast()

  const onFile = async (file) => {
    if (!file) return
    setBusy(true); setMsg('')
    let next = { ...req, docs: { ...req.docs, [type]: { fileName: file.name, size: file.size, uploadedAt: new Date().toISOString(), read: 'manual' } } }
    const result = await readDocument(type, file)
    if (result.source === 'claude') {
      next = { ...next, fields: applyExtraction(next.fields, type, result.fields), docs: { ...next.docs, [type]: { ...next.docs[type], read: 'claude' } } }
      setMsg(`Read by Claude. Check the values below.${result.notes?.length ? ` Notes: ${result.notes.join(' · ')}` : ''}`)
    } else {
      setMsg(`${result.reason || 'Not read automatically'}. Enter the values below by hand.`)
    }
    onUpdate(next, `${DOC_LABEL[type]} uploaded (${file.name})`)
    setBusy(false)
    if (result.source === 'claude') showToast(`${DOC_LABEL[type]} read`)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-navy"><FileText className="h-4 w-4 text-slate-400" />{DOC_LABEL[type]}</p>
        <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 ${!canEdit ? 'pointer-events-none opacity-50' : ''}`}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {doc ? 'Replace and read' : 'Upload and read'}
          <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx" disabled={!canEdit || busy} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
        </label>
      </div>
      {doc ? (
        <p className="mt-1 text-xs text-slate-500">
          {doc.fileName}{doc.demo ? ' (demo sample)' : ''} · {doc.read === 'claude' ? 'values read by Claude' : 'values entered by hand'}
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">Not uploaded</p>
      )}
      {msg && <p className="mt-1 text-xs text-amber">{msg}</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {DOC_FIELDS[type].map((i) => (
          <FieldInput key={i.path} input={i} fields={req.fields} disabled={!canEdit} onChange={(path, v) => onUpdate({ ...req, fields: setPath(req.fields, path, v) })} />
        ))}
      </div>
    </div>
  )
}

function ProfileCard({ req, canEdit, onUpdate }) {
  const showToast = useToast()
  const [svc, setSvc] = useState('')
  const [fee, setFee] = useState('')
  const profile = getClientProfile(req.profileId)
  if (!profile) return null
  const notOpted = SERVICE_KEYS.filter((k) => !profile.services?.[k]?.opted)
  const refresh = () => { onUpdate({ ...req, fields: applyProfile(req.fields, profile) }, 'Proposal details refreshed from the client profile'); showToast('Refreshed from the client profile') }
  const addService = () => {
    const next = { ...profile, services: { ...profile.services, [svc]: { opted: true, fee: Number(fee) } } }
    saveClientProfile(next)
    onUpdate({ ...req, fields: applyProfile(req.fields, next) }, `${SERVICE_LABEL[svc]} added to the client profile (SR ${fmtAmount(Number(fee))})`)
    showToast(`${SERVICE_LABEL[svc]} added to the client profile`); setSvc(''); setFee('')
  }
  const rows = [
    ['Client', profile.client], ['Auditor', profile.auditor], ['Audit type', profile.auditType], ['Revenue category', profile.revenueCategoryLabel],
    ['Contact', [profile.contactName, profile.contactEmail].filter(Boolean).join(' · ')], ['CR number', profile.crNumber], ['City', profile.city],
    ['Proposal', profile.proposalReference], ['Discount', profile.discount?.applied ? `SR ${fmtAmount(profile.discount.amount)}` : ''],
  ]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-navy">Client profile</h2>
        <button onClick={refresh} disabled={!canEdit} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 disabled:opacity-40">Refresh from client profile</button>
      </div>
      <p className="mt-1 text-xs text-slate-500">Everything entered when the proposal was created is stored here and fetched into this request.</p>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-slate-50 py-1 text-sm"><dt className="text-xs font-semibold text-slate-500">{k}</dt><dd className="text-right text-navy">{v || <span className="text-slate-300">not set</span>}</dd></div>
        ))}
      </dl>
      {notOpted.length > 0 && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
          <div>
            <label htmlFor="add-svc" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Add a service to the client profile</label>
            <select id="add-svc" value={svc} onChange={(e) => setSvc(e.target.value)} disabled={!canEdit} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-navy">
              <option value="">Select service</option>
              {notOpted.map((k) => <option key={k} value={k}>{SERVICE_LABEL[k]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="add-fee" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fee (SR, excl. VAT)</label>
            <input id="add-fee" type="number" value={fee} onChange={(e) => setFee(e.target.value)} disabled={!canEdit} className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-navy" />
          </div>
          <button onClick={addService} disabled={!canEdit || !svc || !(Number(fee) > 0)} className="rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90 disabled:opacity-40">Add to profile</button>
        </div>
      )}
    </div>
  )
}

export default function TeamELRequest() {
  const showToast = useToast()
  const { requests, upsert } = useELRequests()
  const { coordinators } = useCoordinators()
  const profiles = useClientProfiles()
  const [selectedId, setSelectedId] = useState(null)
  const [picking, setPicking] = useState(false)

  const req = requests.find((r) => r.id === selectedId) || null
  const result = useMemo(() => (req ? evaluateELRequest({ ...req, requestedBy: teamUser.name }) : null), [req])
  const coordinator = req ? coordinators[req.firm] : null
  const isCoord = !!req && coordinator === teamUser.name
  const canEdit = isCoord && !req.sentAt

  const update = (next, logText) => {
    const log = logText ? [{ at: new Date().toISOString(), by: teamUser.name, text: logText }, ...(next.log || [])] : next.log
    upsert({ ...next, log })
  }

  const start = (p) => {
    const r = newELRequest({
      proposalId: p.id, client: p.client, firm: p.auditor, requestedBy: teamUser.name,
      clientProfile: { auditType: normalizeAuditType(p.auditType) || undefined },
    })
    // Everything entered on the proposal is fetched from the client profile.
    r.profileId = p.id
    r.fields = applyProfile(r.fields, p)
    r.docs = { proposal: { fileName: p.proposalReference ? `Proposal ${p.proposalReference} (from client profile)` : 'Proposal (from client profile)', size: 0, uploadedAt: r.createdAt, read: 'profile' } }
    r.log = [{ at: r.createdAt, by: teamUser.name, text: 'EL request started; proposal details fetched from the client profile' }]
    upsert(r); setSelectedId(r.id); setPicking(false)
  }

  const fillSample = (withIssues) => {
    const type = normalizeAuditType(req.clientProfile?.auditType) || 'Proper Audit'
    const docs = {}
    ;[...new Set([...requiredDocs(type), 'proposal', 'cr', 'aoa'])].forEach((d) => { docs[d] = { fileName: `sample-${d}.pdf`, size: 0, uploadedAt: new Date().toISOString(), read: 'manual', demo: true } })
    const profile = getClientProfile(req.profileId)
    let fields = sampleFields(req.client, type, withIssues)
    if (profile) {
      fields = applyProfile(fields, profile)   // the profile stays the source of the proposal details
      if (profile.revenueCategoryLabel) fields = setPath(fields, 'proposal.revenue', '')   // revenue stays the profile's category
    }
    docs.proposal = req.docs?.proposal || docs.proposal
    update({ ...req, docs, fields }, `Demo sample data loaded${withIssues ? ' (with issues)' : ''}`)
  }

  const send = () => {
    upsert({ ...req, sentAt: new Date().toISOString(), draft: result.draft, status: 'Sent to auditor, awaiting EL',
      log: [{ at: new Date().toISOString(), by: teamUser.name, text: 'EL request sent to the auditor through Monday.com (demo: nothing was posted)' }, ...(req.log || [])] })
    showToast('EL request recorded as sent (Monday.com demo mode)')
  }

  const docTypes = req ? requiredDocs(result.values.auditType) : []
  const openFlags = result?.flags || []

  return (
    <AuditTeamLayout title="EL Requests">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-navy">EL Requests</h1>
              <p className="mt-1 text-sm text-slate-500">Process 2.1 Step 1. Prepare the request for the engagement letter from the signed proposal, CR and AOA.</p>
            </div>
            <button onClick={() => setPicking((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D12C35]">
              <Plus className="h-4 w-4" /> New EL request
            </button>
          </div>

          {picking && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-navy">Choose the client (from the client profiles)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {profiles.map((p) => (
                  <button key={p.id} onClick={() => start(p)} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-navy">
                    <span className="font-medium text-navy">{p.client}</span>
                    <span className="text-xs text-slate-500">{p.auditor} · {p.auditType || 'audit type not set'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="space-y-2">
              {requests.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-400">No EL requests yet. Start one from a proposal.</p>}
              {requests.map((r) => {
                const n = evaluateELRequest({ ...r, requestedBy: teamUser.name }).flags.length
                return (
                  <button key={r.id} onClick={() => setSelectedId(r.id)} className={`w-full rounded-xl border p-3 text-left shadow-sm ${r.id === selectedId ? 'border-navy bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <p className="text-sm font-semibold text-navy">{r.client}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{r.firm} · {r.elStatus ? `EL ${r.elStatus.toLowerCase()}` : r.sentAt ? 'Sent to auditor, awaiting EL' : n ? `${n} open ${n === 1 ? 'flag' : 'flags'}` : r.docs && Object.keys(r.docs).length ? 'Ready to send' : 'Draft'}</p>
                  </button>
                )
              })}
            </div>

            {!req ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">Select or start an EL request.</p>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-bold text-navy">{req.client}</p>
                      <p className="text-xs text-slate-500">{FIRMS[req.firm]?.legalName} ({req.firm}) · requested by {req.requestedBy}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button onClick={() => fillSample(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">Fill demo sample</button>
                        <button onClick={() => fillSample(true)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">Fill demo sample with issues</button>
                      </div>
                    )}
                  </div>
                  {!canEdit && (
                    <p className="mt-3 rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber">
                      {req.sentAt ? 'This request has been sent and is locked.' : `Only the project coordinator for ${req.firm}, assigned by the audit manager (${coordinator || 'nobody assigned'}), can edit this request.`}
                    </p>
                  )}
                </div>

                <ProfileCard req={req} canEdit={canEdit} onUpdate={update} />

                <div className="grid gap-4 xl:grid-cols-2">
                  {docTypes.map((t) => <DocCard key={t} type={t} req={req} canEdit={canEdit} onUpdate={update} />)}
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-navy">Open flags {openFlags.length > 0 && <span className="ml-1 rounded-full bg-alert-red/10 px-2 py-0.5 text-[11px] text-alert-red">{openFlags.length}</span>}</h2>
                  {openFlags.length === 0 && <p className="flex items-center gap-2 rounded-xl border border-emerald/30 bg-emerald/5 px-4 py-3 text-sm text-emerald"><CheckCircle2 className="h-4 w-4" />No open flags.</p>}
                  {openFlags.map((fl) => (
                    <FlagCard key={fl.key} flag={fl} fields={req.fields} disabled={!canEdit} onChange={(path, v) => update({ ...req, fields: setPath(req.fields, path, v) })} />
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="mb-2 text-sm font-semibold text-navy">Checked against the CR, AOA and proposal</h2>
                  <table className="w-full text-sm">
                    <tbody>
                      {result.sources.map((s) => (
                        <tr key={s.field} className="border-b border-slate-50 last:border-0">
                          <td className="py-1.5 pr-3 text-xs font-semibold text-slate-500">{s.field}</td>
                          <td className="py-1.5 pr-3 text-navy">{s.value}</td>
                          <td className="py-1.5 text-xs text-slate-400">{s.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.sources.length === 0 && <p className="text-xs text-slate-400">Nothing verified yet.</p>}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="mb-1 text-sm font-semibold text-navy">Services in the proposal</h2>
                  <p className="mb-2 text-xs text-slate-500">Fees exclude VAT. Only audit and translation go into the EL request to the auditor.</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                        <th className="py-1.5 pr-3 font-medium">Service</th><th className="py-1.5 pr-3 font-medium">Opted</th>
                        <th className="py-1.5 pr-3 text-right font-medium">Fee (SR)</th><th className="py-1.5 pl-3 font-medium">In EL request</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.services.map((x) => (
                        <tr key={x.key} className="border-b border-slate-50 last:border-0">
                          <td className="py-1.5 pr-3 text-navy">{x.label}</td>
                          <td className="py-1.5 pr-3 text-xs">{x.opted ? 'Yes' : <span className="text-slate-400">No</span>}</td>
                          <td className="py-1.5 pr-3 text-right text-navy">{x.opted && x.fee !== null ? fmtAmount(x.fee) : '—'}</td>
                          <td className="py-1.5 pl-3 text-xs">{x.opted && x.inRequest ? <span className="font-semibold text-emerald">Yes</span> : <span className="text-slate-400">No</span>}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-slate-200">
                        <td className="py-1.5 pr-3 text-xs font-semibold text-slate-500" colSpan={2}>Total of the proposal</td>
                        <td className="py-1.5 pr-3 text-right font-semibold text-navy">{fmtAmount(result.proposalTotal)}</td><td />
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-navy"><Sparkles className="h-4 w-4 text-amber" />EL request draft</h2>
                    {result.ready && <span className="rounded-full bg-emerald/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald">Ready</span>}
                  </div>
                  {result.ready || req.sentAt ? (
                    <>
                      <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm text-navy">{req.sentAt ? req.draft : result.draft}</pre>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => navigator.clipboard?.writeText(req.sentAt ? req.draft : result.draft).then(() => showToast('Draft copied'), () => showToast('Could not copy'))}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"><ClipboardCopy className="h-3.5 w-3.5" />Copy text</button>
                        {!req.sentAt && (
                          <button onClick={send} disabled={!canEdit} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90 disabled:opacity-40">
                            <Send className="h-3.5 w-3.5" />Send to auditor via Monday.com (demo)
                          </button>
                        )}
                      </div>
                      {req.sentAt && <p className="mt-2 text-xs text-slate-500">Sent {fmtDate(req.sentAt.slice(0, 10))}. Waiting for the EL from the auditor (Step 2).</p>}
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">The draft is generated once every document is in and every flag is resolved. The request cannot be finalised while a mandatory field is missing or a flag is open.</p>
                  )}
                </div>

                {req.sentAt && <ELVerificationPanel req={req} canAct={isCoord} onUpdate={update} />}

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="mb-2 text-sm font-semibold text-navy">Activity</h2>
                  <ul className="space-y-1 text-xs text-slate-500">
                    {(req.log || []).map((l, i) => <li key={i}>{new Date(l.at).toLocaleString('en-GB')} · {l.by} · {l.text}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
