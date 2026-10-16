import { useState } from 'react'
import { Download, Loader2, Upload, CheckCircle2, AlertCircle, Clock, FileSpreadsheet } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { readTBWorkbook } from '../../utils/tbExcel'
import { checkTBFormat, compactLedgers, PRESCRIBED_COLUMNS } from '../../utils/tbFormat'
import { readGLWorkbook, checkGLAgainstTB, demoGLRows } from '../../utils/partyBreakdown'
import { buildTBTemplate, buildGLTemplate } from '../../utils/tbTemplate'
import { useTBSubmissions, submitTB } from '../../utils/tbSubmissionStore'
import { demoCY, demoPY } from '../../data/demoTB'
import { DEMO_FILE } from '../../utils/demoData'

const save = async (blob, name) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url) }

// The client's first requirement: the trial balance and the detailed general ledger, both in the prescribed format. The general ledger gives the
// party-wise balances that replace the receivable, payable and advance lines. The requirement list appears only after the audit team approves them.
export default function TBUploadStep({ D }) {
  const showToast = useToast()
  const sub = useTBSubmissions()[DEMO_FILE.slug]
  const [busy, setBusy] = useState('')
  const [tb, setTb] = useState(null)   // { fileName, ledgers, warnings, sheetName }
  const [gl, setGl] = useState(null)   // { fileName, rows }
  const [tbErr, setTbErr] = useState([])
  const [glErr, setGlErr] = useState([])
  const card = { background: D.card, border: `1px solid ${D.border}` }

  // The general ledger must back the trial balance, so it is checked whenever both are present.
  const crossCheck = (t, g) => {
    if (!t || !g) return { rows: g?.rows || [], errors: [] }
    const r = checkGLAgainstTB(t.ledgers, g.rows)
    return { rows: r.rows, errors: r.errors }
  }
  const setBoth = (t, g) => { setTb(t); setGl(g); setGlErr(g ? crossCheck(t, g).errors : []) }

  const onTB = async (f) => {
    if (!f) return
    setBusy('tb'); setTbErr([])
    try {
      const r = checkTBFormat(await readTBWorkbook(await f.arrayBuffer()))
      if (!r.ok) { setTbErr(r.errors); setBoth(null, gl) }
      else setBoth({ fileName: f.name, ledgers: compactLedgers(r.ledgers), warnings: r.warnings, sheetName: r.sheetName }, gl)
    } catch { setTbErr(['This file could not be read. Please upload an Excel (.xlsx) file in the prescribed format.']) }
    setBusy('')
  }
  const onGL = async (f) => {
    if (!f) return
    setBusy('gl'); setGlErr([])
    try {
      const r = await readGLWorkbook(await f.arrayBuffer())
      if (!r.ok) { setGlErr([`The general ledger needs these columns: ${r.missing.join(', ')}.`]); setGl(null) }
      else if (!r.rows.length) { setGlErr(['The general ledger has no rows.']); setGl(null) }
      else { const g = { fileName: f.name, rows: r.rows }; setGl(g); setGlErr(crossCheck(tb, g).errors) }
    } catch { setGlErr(['This file could not be read. Please upload an Excel (.xlsx) file in the prescribed format.']); setGl(null) }
    setBusy('')
  }
  const ready = !!tb && !!gl && glErr.length === 0
  const send = () => {
    const { rows } = crossCheck(tb, gl)
    submitTB(DEMO_FILE, { fileName: tb.fileName, ledgers: tb.ledgers, warnings: tb.warnings, sheetName: tb.sheetName, glFileName: gl.fileName, glRows: rows })
    showToast('Trial balance and general ledger sent to the audit team')
  }
  const useDemo = () => {
    const ledgers = compactLedgers(demoCY(demoPY()).map((l) => ({ ...l, closing: l.opening + l.debit - l.credit })))
    submitTB(DEMO_FILE, { fileName: 'Demo trial balance.xlsx', ledgers, sheetName: 'Trial Balance', glFileName: 'Demo general ledger.xlsx', glRows: demoGLRows(ledgers) })
    showToast('Demo trial balance and general ledger sent to the audit team')
  }

  if (sub?.status === 'Submitted') return (
    <div className="rounded-xl p-6" style={card}>
      <p className="flex items-center gap-2 text-sm font-semibold text-amber"><Clock className="h-4 w-4" />Trial balance and general ledger received. Waiting for the audit team to approve them.</p>
      <p className="mt-2 text-xs" style={{ color: D.muted }}>{sub.fileName} · {sub.ledgers.length} ledgers{sub.glFileName ? ` · ${sub.glFileName}` : ''} · sent {new Date(sub.submittedAt).toLocaleString()}. Your requirement list will appear here once they are approved.</p>
    </div>
  )

  const slot = ({ title, hint, file, errs, onPick, kind, template, templateName, builder }) => (
    <div className="rounded-lg p-4" style={{ border: `1px solid ${D.border}` }}>
      <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: D.text }}>{file && errs.length === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald" /> : <FileSpreadsheet className="h-4 w-4" style={{ color: D.muted }} />}{title}</p>
      <p className="mt-1 text-xs" style={{ color: D.muted }}>{hint}</p>
      {file && <p className="mt-2 text-xs text-emerald">{file}</p>}
      {errs.length > 0 && (
        <div className="mt-2 rounded-lg px-3 py-2 text-xs text-alert-red" style={{ background: 'rgba(230,57,70,0.08)' }} role="alert">
          <p className="flex items-center gap-2 font-semibold"><AlertCircle className="h-3.5 w-3.5 shrink-0" />This file was not accepted. Please correct the following and upload again.</p>
          <ul className="mt-1 list-disc space-y-1 pl-6">{errs.map((e) => <li key={e} className="break-words">{e}</li>)}</ul>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]">
          {busy === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{file ? 'Replace file' : 'Upload Excel file'}
          <input aria-label={title} type="file" accept=".xlsx" className="hidden" onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        <button onClick={async () => save(await builder(), templateName)} className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold" style={{ border: `1px solid ${D.border}`, color: D.text }}><Download className="h-4 w-4" />{template}</button>
      </div>
    </div>
  )

  return (
    <div className="rounded-xl p-6" style={card}>
      <p className="text-base font-bold" style={{ color: D.text }}>Step 1: Upload your trial balance and general ledger</p>
      <p className="mt-1 text-xs" style={{ color: D.muted }}>Your audit requirement list is prepared from your trial balance, so only the documents relevant to you are requested. The general ledger gives the party-wise balances for receivables, payables and advances, so the trial balance can be kept at ledger level. Both must be in the prescribed format. The audit team reviews them before your list is released.</p>
      {sub?.status === 'Returned' && (
        <p className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs text-alert-red" style={{ background: 'rgba(230,57,70,0.08)' }}><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Returned by the audit team: {sub.returnReason}. Please correct it and upload again.</p>
      )}
      <ul className="mt-4 grid gap-1 text-xs sm:grid-cols-2" style={{ color: D.muted }}>
        {PRESCRIBED_COLUMNS.map((c) => <li key={c.key} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald" />{c.label}{c.required ? '' : ' (recommended)'}</li>)}
      </ul>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {slot({ title: 'Trial balance', hint: 'Ledger level, no group or sub-group balances. Receivables, payables and the two advance accounts may be one line each.', file: tb && `${tb.fileName} · ${tb.ledgers.length} ledgers`, errs: tbErr, onPick: onTB, kind: 'tb', template: 'Download the trial balance format', templateName: 'Trial_Balance_Format.xlsx', builder: buildTBTemplate })}
        {slot({ title: 'Detailed general ledger', hint: 'One row per party for trade receivables, trade payables, advances from customers and advances to suppliers. Their totals must agree with your trial balance.', file: gl && `${gl.fileName} · ${gl.rows.length} rows`, errs: glErr, onPick: onGL, kind: 'gl', template: 'Download the general ledger format', templateName: 'General_Ledger_Format.xlsx', builder: buildGLTemplate })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={!ready} onClick={send} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Send to the audit team</button>
        {!ready && <span className="text-xs" style={{ color: D.muted }}>Both files are needed.</span>}
        <button onClick={useDemo} className="rounded-lg px-4 py-2 text-sm font-semibold underline" style={{ color: D.muted }}>Use demo trial balance and general ledger</button>
      </div>
    </div>
  )
}
