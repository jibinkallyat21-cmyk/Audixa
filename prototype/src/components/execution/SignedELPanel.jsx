import { useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Send, Upload } from 'lucide-react'
import { FieldInput, readDocument } from './elShared'
import { fmtDate, setPath } from '../../utils/elRequest.js'
import { evaluateSignedEL, emptySignedData, CORRECT, FAILED, MANUAL, CLARIFY, NA } from '../../utils/signedEL'
import { getClientUpload } from '../../data/clientUploads'
import { teamUser } from '../../data/sampleData'
import { useCoordinators } from '../../utils/elStore'

const CHIP = {
  [CORRECT]: 'bg-emerald/10 text-emerald border-emerald/30',
  [FAILED]: 'bg-alert-red/10 text-alert-red border-alert-red/30',
  [MANUAL]: 'bg-amber/10 text-amber border-amber/30',
  [CLARIFY]: 'bg-amber/10 text-amber border-amber/30',
  [NA]: 'bg-slate-100 text-slate-500 border-slate-300',
}
const BANNER = {
  'VERIFIED AND COMPLETED': ['border-emerald/30 bg-emerald/5 text-emerald', 'Every applicable item is correct and the employee has confirmed the checklist.'],
  FAILED: ['border-alert-red/30 bg-alert-red/5 text-alert-red', 'One or more items failed. The responsible employee must take corrective action; the signed EL cannot be accepted.'],
  PENDING: ['border-amber/30 bg-amber/10 text-amber', 'Pending: a manual check, a missing document or clarification, or the employee confirmation is outstanding.'],
}

const triSelect = (id, label, value, onChange, disabled) => (
  <div key={id}>
    <label htmlFor={id} className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</label>
    <select id={id} disabled={disabled} value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'true')}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy disabled:bg-slate-50">
      <option value="">Not established</option><option value="true">Yes</option><option value="false">No</option>
    </select>
  </div>
)

function sample(firm, withIssues) {
  const d = { ...emptySignedData(), totalPages: '4', lastPageStamp: true, lastPageSignature: true, signedBy: 'Mr. Khalid Al-Bashir', signatoryCapacity: 'Shareholder' }
  d.stampedPages = firm === 'MISCPA' ? '4' : '1-4'
  if (withIssues) {
    if (firm === 'MISCPA') { d.lastPageSignature = null }
    else { d.stampedPages = '1,2,4'; d.lastPageSignature = null; d.thirdPartySigner = true; d.authLetterReceived = false }
  }
  return d
}

export default function SignedELPanel({ req, canAct, onUpdate }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const { coordinators } = useCoordinators()
  const s = req.signedEL || { doc: null, data: emptySignedData(), manual: {}, review: {} }
  const data = useMemo(() => ({ ...emptySignedData(), ...s.data }), [s.data])
  const v = useMemo(() => evaluateSignedEL({ firm: req.firm, data, manual: s.manual, review: s.review }), [req.firm, data, s.manual, s.review])
  const clientFile = getClientUpload('signedEngagementLetter')
  const abcpa = req.firm === 'ABCPA'

  const save = (next, log) => {
    const overall = evaluateSignedEL({ firm: req.firm, data: next.data, manual: next.manual, review: next.review }).overall
    onUpdate({ ...req, signedEL: next, signedStatus: overall, status: overall === 'VERIFIED AND COMPLETED' ? 'Signed EL verified and completed' : req.status }, log)
  }
  const setData = (path, value) => save({ ...s, data: setPath(data, path, value) })
  const setManual = (key, patch) => save({ ...s, manual: { ...s.manual, [key]: { ...(s.manual?.[key] || {}), ...patch } } })

  const onFile = async (file) => {
    if (!file) return
    setBusy(true); setMsg('')
    let next = { ...s, doc: { fileName: file.name, size: file.size, uploadedAt: new Date().toISOString(), uploadedBy: 'employee', read: 'manual' }, data }
    const r = await readDocument('signedEL', file)
    if (r.source === 'claude') {
      const f = r.fields
      next = { ...next, doc: { ...next.doc, read: 'claude' }, data: {
        ...data, totalPages: f.totalPages ? String(f.totalPages) : data.totalPages, stampedPages: (f.pagesWithStamp || []).join(',') || data.stampedPages,
        lastPageStamp: f.lastPageStamp ?? data.lastPageStamp, lastPageSignature: f.lastPageSignature ?? data.lastPageSignature,
        signedBy: f.signedBy || data.signedBy, signatoryCapacity: f.signatoryCapacity || data.signatoryCapacity,
      } }
      setMsg(`Read by Claude. Check stamps and signatures against the document yourself.${r.notes?.length ? ` Notes: ${r.notes.join(' · ')}` : ''}`)
    } else setMsg(`${r.reason || 'Not read automatically'}. Enter the values from the signed EL by hand.`)
    save(next, `Signed EL uploaded (${file.name})`)
    setBusy(false)
  }
  const importClient = () => save({ ...s, doc: { fileName: clientFile.name, size: 0, uploadedAt: new Date().toISOString(), uploadedBy: 'client', read: 'manual' }, data }, `Signed EL uploaded by the client (${clientFile.name})`)
  const loadSample = (issues) => save({ ...s, doc: { fileName: 'sample-signed-el.pdf', size: 0, uploadedAt: new Date().toISOString(), uploadedBy: 'employee', read: 'manual', demo: true }, data: sample(req.firm, issues), manual: {}, review: {} }, `Demo signed EL loaded${issues ? ' (with issues)' : ''}`)

  const [banner, bannerNote] = BANNER[v.overall]
  return (
    <div className="space-y-5 rounded-xl border-2 border-navy/20 p-4">
      <div>
        <h2 className="text-base font-bold text-navy">Step 4: signed EL and company stamp</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {abcpa ? 'ABCPA rule: company stamp on every page; on the last page the company stamp and the signature of the respective person.' : 'MISCPA rule: the client\'s stamp and signature on the last page.'}
        </p>
        {req.forwardedAt ? <p className="mt-1 text-xs text-slate-500">Forwarded to the client for signature on {fmtDate(req.forwardedAt.slice(0, 10))}.</p>
          : canAct && <button onClick={() => onUpdate({ ...req, forwardedAt: new Date().toISOString() }, 'Verified EL forwarded to the client for signature')} className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"><Send className="h-3.5 w-3.5" />Mark as forwarded to the client</button>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-navy">Signed engagement letter</p>
          <div className="flex flex-wrap gap-2">
            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 ${!canAct ? 'pointer-events-none opacity-50' : ''}`}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{s.doc ? 'Replace and read' : 'Upload and read'}
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif" disabled={!canAct || busy} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            </label>
            {canAct && <>
              <button onClick={() => loadSample(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">Fill demo signed EL</button>
              <button onClick={() => loadSample(true)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">Fill demo signed EL with issues</button>
            </>}
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">{s.doc ? `${s.doc.fileName}${s.doc.demo ? ' (demo sample)' : ''} · uploaded by the ${s.doc.uploadedBy} · ${s.doc.read === 'claude' ? 'values read by Claude' : 'values entered by hand'}` : 'Not received yet'}</p>
        {clientFile && !s.doc && canAct && (
          <p className="mt-2 rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber">The client has uploaded a signed EL ({clientFile.name}). <button onClick={importClient} className="font-semibold underline">Use this file</button> and enter the values below.</p>
        )}
        {msg && <p className="mt-1 text-xs text-amber">{msg}</p>}

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <FieldInput input={{ path: 'totalPages', label: 'Total pages in the EL', type: 'number' }} fields={data} disabled={!canAct} onChange={setData} />
          <FieldInput input={{ path: 'stampedPages', label: 'Pages carrying the company stamp (e.g. 1-4)' }} fields={data} disabled={!canAct} onChange={setData} />
          {triSelect('lps', 'Company stamp on the last page', data.lastPageStamp, (x) => setData('lastPageStamp', x), !canAct)}
          {triSelect('lpsig', 'Signature visible on the last page', data.lastPageSignature, (x) => setData('lastPageSignature', x), !canAct)}
          {abcpa && <>
            <FieldInput input={{ path: 'signedBy', label: 'Signed by (name)' }} fields={data} disabled={!canAct} onChange={setData} />
            <FieldInput input={{ path: 'signatoryCapacity', label: 'Capacity (shareholder, manager…)' }} fields={data} disabled={!canAct} onChange={setData} />
            <FieldInput input={{ path: 'shareholderIsCompany', label: 'The shareholder is a company', type: 'checkbox' }} fields={data} disabled={!canAct} onChange={setData} />
            {data.shareholderIsCompany && triSelect('gm', 'Signed by the General Manager of the parent company', data.parentGMSigned, (x) => setData('parentGMSigned', x), !canAct)}
            <FieldInput input={{ path: 'thirdPartySigner', label: 'Signed by an authorised third party', type: 'checkbox' }} fields={data} disabled={!canAct} onChange={setData} />
            {data.thirdPartySigner && <>
              {triSelect('al1', 'Authorisation letter received', data.authLetterReceived, (x) => setData('authLetterReceived', x), !canAct)}
              {triSelect('al2', 'Letter signed by the shareholder', data.authLetterSigned, (x) => setData('authLetterSigned', x), !canAct)}
              {triSelect('al3', 'Letter carries the company stamp', data.authLetterStamped, (x) => setData('authLetterStamped', x), !canAct)}
            </>}
          </>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-navy">Verification checklist</h3>
        <div className="space-y-3">
          {v.items.map((i) => (
            <div key={i.key} className="rounded-lg border border-slate-100 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-navy">{i.no}. {i.label}</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${CHIP[i.status]}`}>{i.status}{i.decided ? ' (employee)' : ''}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{i.note}</p>
              {canAct && i.status !== NA && i.auto !== CORRECT && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select aria-label={`Employee decision for ${i.label}`} value={s.manual?.[i.key]?.result || ''} onChange={(e) => setManual(i.key, { result: e.target.value })}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-navy outline-none focus:border-navy">
                    <option value="">Employee: use the automatic result</option><option>{CORRECT}</option><option>{FAILED}</option><option>{CLARIFY}</option>
                  </select>
                  {s.manual?.[i.key]?.result && (
                    <input aria-label={`Employee note for ${i.label}`} value={s.manual[i.key].note || ''} onChange={(e) => setManual(i.key, { note: e.target.value })} placeholder="What you checked (required for the decision to count)"
                      className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-navy outline-none focus:border-navy" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-navy">Tracking to completion</h3>
        <div className={`rounded-lg border px-4 py-3 ${banner}`}>
          <p className="flex items-center gap-2 text-sm font-bold">{v.overall === 'VERIFIED AND COMPLETED' && <CheckCircle2 className="h-4 w-4" />}{v.overall}</p>
          <p className="mt-0.5 text-xs">{bannerNote}</p>
        </div>
        {v.notifyEmployee && <p className="mt-2 text-xs text-slate-600">Notified: {coordinators[req.firm] || 'the responsible employee'} ({v.actions.map((a) => a.no).join(', ')}). {v.overall === 'FAILED' ? 'Corrective action is needed.' : ''}{v.needsManual ? ' Manual verification or clarification is needed before this can complete.' : ''}</p>}
        {v.actions.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs text-navy">{v.actions.map((a) => <li key={a.key}><b>{a.no}. {a.label}</b> ({a.status}): {a.note}</li>)}</ul>}
        <p className="mt-3 text-[11px] text-slate-500">AI supports verification but does not prove that a signature or stamp is genuine. The signed EL is completed only after the employee confirms it.</p>
        {canAct && (
          <label className="mt-2 flex items-start gap-2 text-sm text-navy">
            <input type="checkbox" checked={!!s.review?.confirmed} onChange={(e) => save({ ...s, review: { confirmed: e.target.checked, confirmedBy: e.target.checked ? teamUser.name : '', confirmedAt: e.target.checked ? new Date().toISOString() : '' } }, e.target.checked ? 'Employee confirmed the signed EL checklist' : undefined)} className="mt-0.5 h-4 w-4 accent-navy" />
            <span>I have checked the signed EL against this checklist myself.</span>
          </label>
        )}
        {s.review?.confirmed && <p className="mt-1 text-xs text-slate-500">Confirmed by {s.review.confirmedBy} on {fmtDate((s.review.confirmedAt || '').slice(0, 10))}</p>}
      </div>
    </div>
  )
}
