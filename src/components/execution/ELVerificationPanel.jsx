import { useMemo, useState } from 'react'
import { CheckCircle2, Loader2, MessageSquarePlus, Upload } from 'lucide-react'
import { FieldInput, readDocument } from './elShared'
import { fmtDate, fmtAmount, setPath } from '../../utils/elRequest.js'
import { evaluateELVerification, expectedFromRequest, emptyELData, PASS, FAIL, REVIEW } from '../../utils/elVerification.js'
import { getClientProfile } from '../../utils/clientProfiles'
import { FIRMS } from '../../data/firms.js'
import { teamUser } from '../../data/sampleData'

const CHIP = {
  [PASS]: 'bg-emerald/10 text-emerald border-emerald/30',
  [FAIL]: 'bg-alert-red/10 text-alert-red border-alert-red/30',
  [REVIEW]: 'bg-amber/10 text-amber border-amber/30',
}
const OVERALL = {
  VERIFIED: 'border-emerald/30 bg-emerald/5 text-emerald',
  'NOT VERIFIED': 'border-alert-red/30 bg-alert-red/5 text-alert-red',
  PENDING: 'border-amber/30 bg-amber/10 text-amber',
}
const OVERALL_NOTE = {
  VERIFIED: 'All five checks passed and a reviewer has confirmed them.',
  'NOT VERIFIED': 'One or more checks failed. Request a corrected EL from the auditor or escalate. Do not mark the EL as verified.',
  PENDING: 'Human review is required before the EL can be accepted.',
}

const EL_FIELDS = [
  { path: 'companyName', label: 'Company name in the EL' },
  { path: 'periodStart', label: 'Audit period start', type: 'date' },
  { path: 'periodEnd', label: 'Audit period end', type: 'date' },
  { path: 'fees.audit', label: 'Audit fee (SR, excl. VAT)', type: 'number' },
  { path: 'fees.translation', label: 'Translation fee (SR, if shown)', type: 'number' },
  { path: 'feesIncludeVat', label: 'EL fees include VAT', type: 'checkbox' },
  { path: 'auditorName', label: 'Auditor named in the EL' },
  { path: 'letterheadFirmName', label: 'Firm name found on the letterhead' },
]
const PAGE_FIELDS = [['companyName', 'Name page'], ['period', 'Period page'], ['fee', 'Fee page'], ['auditor', 'Auditor page'], ['letterhead', 'Letterhead page']]

function applyExtraction(el, f) {
  const s = (v) => (v === null || v === undefined ? '' : String(v))
  return {
    ...el,
    companyName: s(f.companyName) || el.companyName, periodStart: s(f.periodStart) || el.periodStart, periodEnd: s(f.periodEnd) || el.periodEnd,
    fees: { audit: s(f.auditFee), translation: s(f.translationFee) },
    feesIncludeVat: !!f.feesIncludeVat, auditorName: s(f.auditorName) || el.auditorName,
    letterheadPresent: f.letterheadPresent ?? el.letterheadPresent, letterheadFirmName: s(f.letterheadFirmName) || el.letterheadFirmName,
    pages: { companyName: s(f.companyNamePage), period: s(f.periodPage), fee: s(f.feePage), auditor: s(f.auditorPage), letterhead: s(f.letterheadPage) },
  }
}

// Demo EL built from what the request approved, with or without deliberate discrepancies.
function sampleEL(expected, firm, withIssues) {
  const fees = { audit: '', translation: '' }
  expected.services.forEach((x) => { if ((x.key === 'audit' || x.key === 'translation') && x.opted && x.fee !== null) fees[x.key] = String(x.fee) })
  const el = {
    ...emptyELData(), companyName: expected.companyName || '', periodStart: expected.period?.start || '', periodEnd: expected.period?.end || '',
    fees, auditorName: FIRMS[firm].legalName, letterheadPresent: true, letterheadFirmName: FIRMS[firm].legalName,
    pages: { companyName: '1', period: '1', fee: '2', auditor: '1', letterhead: '1' },
  }
  if (withIssues) {
    el.periodEnd = '2025-06-30'
    if (fees.audit) el.fees = { ...fees, audit: String(Number(fees.audit) - 500) }
    el.auditorName = firm === 'ABCPA' ? FIRMS.MISCPA.legalName : FIRMS.ABCPA.legalName
  }
  return el
}

export default function ELVerificationPanel({ req, canAct, onUpdate }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [newQuery, setNewQuery] = useState('')
  const profile = getClientProfile(req.profileId)
  const elr = req.elReceived || { doc: null, data: emptyELData(), overrides: {}, review: {}, queries: [] }
  const data = useMemo(() => ({ ...emptyELData(), ...elr.data }), [elr.data])

  const expected = useMemo(() => expectedFromRequest(req), [req])
  const openQueries = (elr.queries || []).filter((q) => !q.resolved).length
  const v = useMemo(() => evaluateELVerification({ firm: req.firm, expected, el: data, overrides: elr.overrides, review: elr.review, openQueries }), [req.firm, expected, data, elr.overrides, elr.review, openQueries])

  const save = (next, log) => {
    const status = evaluateELVerification({ firm: req.firm, expected, el: next.data, overrides: next.overrides, review: next.review, openQueries: (next.queries || []).filter((q) => !q.resolved).length }).overall
    onUpdate({ ...req, elReceived: next, elStatus: status, status: status === 'VERIFIED' ? 'EL verified, ready to forward for signature' : req.status }, log)
  }
  const setData = (path, value) => save({ ...elr, data: setPath(data, path, value) })

  const onFile = async (file) => {
    if (!file) return
    setBusy(true); setMsg('')
    let next = { ...elr, doc: { fileName: file.name, size: file.size, uploadedAt: new Date().toISOString(), read: 'manual' }, data }
    const result = await readDocument('elReceived', file)
    if (result.source === 'claude') {
      next = { ...next, data: applyExtraction(data, result.fields), doc: { ...next.doc, read: 'claude' } }
      setMsg(`Read by Claude. Check every value against the EL itself.${result.notes?.length ? ` Notes: ${result.notes.join(' · ')}` : ''}`)
    } else setMsg(`${result.reason || 'Not read automatically'}. Enter the values from the EL by hand.`)
    save(next, `EL from the auditor uploaded (${file.name})`)
    setBusy(false)
  }
  const loadSample = (withIssues) => save({ ...elr, doc: { fileName: 'sample-engagement-letter.pdf', size: 0, uploadedAt: new Date().toISOString(), read: 'manual', demo: true }, data: sampleEL(expected, req.firm, withIssues), overrides: {}, review: {} }, `Demo EL loaded${withIssues ? ' (with issues)' : ''}`)

  const setOverride = (key, patch) => save({ ...elr, overrides: { ...elr.overrides, [key]: { ...(elr.overrides?.[key] || {}), ...patch } } })
  const setReview = (patch) => save({ ...elr, review: { ...elr.review, ...patch } }, patch.confirmed === true ? 'Reviewer confirmed the EL checklist' : undefined)
  const addQuery = () => {
    if (!newQuery.trim()) return
    save({ ...elr, queries: [{ id: `q-${Date.now()}`, text: newQuery.trim(), raisedAt: new Date().toISOString(), resolved: false }, ...(elr.queries || [])] }, 'Auditor query recorded (Monday.com)')
    setNewQuery('')
  }
  const toggleQuery = (id) => save({ ...elr, queries: elr.queries.map((q) => (q.id === id ? { ...q, resolved: !q.resolved, resolvedAt: new Date().toISOString() } : q)) })

  return (
    <div className="space-y-5 rounded-xl border-2 border-navy/20 p-4">
      <div>
        <h2 className="text-base font-bold text-navy">Step 2: EL received from the auditor</h2>
        <p className="mt-0.5 text-xs text-slate-500">Check the auditor's EL against the approved request and the proposal. The client's signature and stamp are checked later, once the client returns the signed EL.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-navy">Engagement letter from the auditor</p>
          <div className="flex flex-wrap gap-2">
            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 ${!canAct ? 'pointer-events-none opacity-50' : ''}`}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{elr.doc ? 'Replace and read' : 'Upload and read'}
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx" disabled={!canAct || busy} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            </label>
            {canAct && <>
              <button onClick={() => loadSample(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">Fill demo EL</button>
              <button onClick={() => loadSample(true)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">Fill demo EL with issues</button>
            </>}
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">{elr.doc ? `${elr.doc.fileName}${elr.doc.demo ? ' (demo sample)' : ''} · ${elr.doc.read === 'claude' ? 'values read by Claude' : 'values entered by hand'}` : 'Not uploaded yet'}</p>
        {msg && <p className="mt-1 text-xs text-amber">{msg}</p>}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {EL_FIELDS.map((f) => <FieldInput key={f.path} input={{ ...f, path: f.path }} fields={data} disabled={!canAct} onChange={(path, val) => setData(path, val)} />)}
          <div>
            <label htmlFor="lh" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">On firm letterhead?</label>
            <select id="lh" disabled={!canAct} value={data.letterheadPresent === null ? '' : String(data.letterheadPresent)} onChange={(e) => setData('letterheadPresent', e.target.value === '' ? null : e.target.value === 'true')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy disabled:bg-slate-50">
              <option value="">Not assessed</option><option value="true">Yes</option><option value="false">No</option>
            </select>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {PAGE_FIELDS.map(([k, l]) => <FieldInput key={k} input={{ path: `pages.${k}`, label: l }} fields={data} disabled={!canAct} onChange={(path, val) => setData(path, val)} />)}
        </div>
      </div>

      {v.notices.map((n) => (
        <div key={n.key} className="rounded-xl border border-slate-300 bg-slate-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy"><span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Low priority</span>{n.title}</p>
          <p className="mt-1 text-xs text-slate-600">{n.detail}</p>
          <p className="mt-1 text-[11px] text-slate-400">Shown on the FO dashboard (EL Queries) and to the project coordinator. Does not block verification.</p>
        </div>
      ))}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-navy">Verification checklist</h3>
        <div className="space-y-3">
          {v.checks.map((c, i) => (
            <div key={c.key} className="rounded-lg border border-slate-100 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-navy">{i + 1}. {c.label}</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${CHIP[c.result]}`}>{c.result}{c.overridden ? ' (reviewer)' : ''}</span>
              </div>
              <dl className="mt-1.5 grid gap-x-4 gap-y-0.5 text-xs sm:grid-cols-[110px_1fr]">
                <dt className="text-slate-500">Expected</dt><dd className="text-navy">{c.expected}</dd>
                <dt className="text-slate-500">Found in EL</dt><dd className="text-navy">{c.found}{c.page ? ` (page ${c.page})` : ''}</dd>
                <dt className="text-slate-500">Finding</dt><dd className="text-slate-600">{c.note}</dd>
              </dl>
              {c.key === 'fee' && c.lines && (
                <table className="mt-2 w-full text-xs">
                  <thead><tr className="text-left text-[10px] uppercase tracking-wide text-slate-400"><th className="py-1 font-medium">Service</th><th className="py-1 text-right font-medium">Proposal</th><th className="py-1 text-right font-medium">EL</th><th className="py-1 pl-3 font-medium">Result</th></tr></thead>
                  <tbody>{c.lines.map((l) => (
                    <tr key={l.key} className="border-t border-slate-50">
                      <td className="py-1 text-navy">{l.label}</td>
                      <td className="py-1 text-right text-navy">{l.expected !== null ? fmtAmount(l.expected) : '—'}</td>
                      <td className="py-1 text-right text-navy">{l.found !== null ? fmtAmount(l.found) : '—'}</td>
                      <td className="py-1 pl-3"><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${CHIP[l.status] || 'border-slate-300 bg-slate-100 text-slate-500'}`}>{l.status}</span>{l.status === 'N/A' && <span className="ml-1 text-[10px] text-slate-400">proposal only</span>}</td>
                    </tr>))}</tbody>
                </table>
              )}
              {canAct && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select aria-label={`Reviewer decision for ${c.label}`} value={elr.overrides?.[c.key]?.result || ''} onChange={(e) => setOverride(c.key, { result: e.target.value })}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-navy outline-none focus:border-navy">
                    <option value="">Reviewer: use the automatic result</option><option>{PASS}</option><option>{FAIL}</option><option>{REVIEW}</option>
                  </select>
                  {elr.overrides?.[c.key]?.result && (
                    <input aria-label={`Reviewer note for ${c.label}`} value={elr.overrides[c.key].note || ''} onChange={(e) => setOverride(c.key, { note: e.target.value })} placeholder="Reason (required for the decision to count)"
                      className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-navy outline-none focus:border-navy" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-navy">Final review summary</h3>
        <div className={`rounded-lg border px-4 py-3 ${OVERALL[v.overall]}`}>
          <p className="flex items-center gap-2 text-sm font-bold">{v.overall === 'VERIFIED' && <CheckCircle2 className="h-4 w-4" />}{v.overall}</p>
          <p className="mt-0.5 text-xs">{OVERALL_NOTE[v.overall]}</p>
        </div>
        <dl className="mt-3 grid gap-y-1 text-xs sm:grid-cols-[170px_1fr]">
          <dt className="text-slate-500">EL document</dt><dd className="text-navy">{elr.doc?.fileName || '—'}</dd>
          <dt className="text-slate-500">Signed proposal</dt><dd className="text-navy">{profile?.proposalReference || 'Proposal from the client profile'}</dd>
          <dt className="text-slate-500">Discrepancies / actions</dt>
          <dd className="text-navy">{v.discrepancies.length === 0 ? 'None' : <ul className="list-disc pl-4">{v.discrepancies.map((d) => <li key={d.key}><b>{d.label}</b> ({d.result}): {d.note}</li>)}</ul>}</dd>
        </dl>
        <p className="mt-3 text-[11px] text-slate-500">AI supports verification but does not prove the authenticity of a signature, seal, letterhead or document. The EL is not accepted on an AI result alone.</p>
        {canAct && (
          <div className="mt-2 space-y-2">
            <label className="flex items-start gap-2 text-sm text-navy">
              <input type="checkbox" checked={!!elr.review?.confirmed} onChange={(e) => setReview({ confirmed: e.target.checked, reviewedBy: e.target.checked ? teamUser.name : '', reviewedAt: e.target.checked ? new Date().toISOString() : '' })} className="mt-0.5 h-4 w-4 accent-navy" />
              <span>I have checked the EL against this checklist myself.</span>
            </label>
            {elr.review?.confirmed && <p className="text-xs text-slate-500">Reviewed by {elr.review.reviewedBy} on {fmtDate((elr.review.reviewedAt || '').slice(0, 10))}</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              <FieldInput input={{ path: 'approvedBy', label: 'Final approval by (if required)' }} fields={elr.review || {}} onChange={(path, val) => setReview({ [path]: val, approvedAt: val ? new Date().toISOString() : '' })} />
              <div className="text-xs text-slate-500 sm:pt-6">{elr.review?.approvedBy && elr.review?.approvedAt ? `Approved ${fmtDate(elr.review.approvedAt.slice(0, 10))}` : ''}</div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-navy">Queries raised by the auditor (Monday.com)</h3>
        <p className="mb-2 text-xs text-slate-500">The employee responsible for the EL request reviews each query, acts on it and marks it resolved. Entered by hand until the Monday.com link is connected.</p>
        {canAct && (
          <div className="mb-2 flex gap-2">
            <input aria-label="Auditor query" value={newQuery} onChange={(e) => setNewQuery(e.target.value)} placeholder="What did the auditor raise?"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy" />
            <button onClick={addQuery} disabled={!newQuery.trim()} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy/90 disabled:opacity-40"><MessageSquarePlus className="h-3.5 w-3.5" />Record</button>
          </div>
        )}
        <ul className="space-y-1">
          {(elr.queries || []).map((q) => (
            <li key={q.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" aria-label={`Resolved: ${q.text}`} checked={q.resolved} disabled={!canAct} onChange={() => toggleQuery(q.id)} className="h-4 w-4 accent-navy" />
              <span className={q.resolved ? 'text-slate-400 line-through' : 'text-navy'}>{q.text}</span>
            </li>
          ))}
          {(elr.queries || []).length === 0 && <li className="text-xs text-slate-400">No queries recorded.</li>}
        </ul>
        {(elr.queries || []).some((q) => !q.resolved) && <p className="mt-2 text-xs text-amber">Open auditor queries must be resolved before the EL is forwarded.</p>}
      </div>
    </div>
  )
}
