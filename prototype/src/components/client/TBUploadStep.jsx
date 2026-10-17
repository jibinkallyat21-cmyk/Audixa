import { useRef, useState } from 'react'
import { Download, Loader2, Upload, CheckCircle2, AlertCircle, Clock, FileSpreadsheet } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { readTBWorkbook } from '../../utils/tbExcel'
import { checkTBFormat, compactLedgers, PRESCRIBED_COLUMNS } from '../../utils/tbFormat'
import { readGLWorkbook, checkGL } from '../../utils/generalLedger'
import { buildTBTemplate, buildGLTemplate } from '../../utils/tbTemplate'
import { useTBSubmissions, submitTB } from '../../utils/tbSubmissionStore'
import { openingCheck } from '../../utils/openingCheck'
import { DEMO_FILE, demoPayload, useDemoExisting } from '../../utils/demoData'

const save = async (blob, name) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url) }

// The client's first requirement: the trial balance and the detailed general ledger, both in the prescribed format. The general ledger gives the
// party-wise balances that replace the receivable, payable and advance lines. The requirement list appears only after the audit team approves them.
export default function TBUploadStep({ D }) {
  const showToast = useToast()
  const sub = useTBSubmissions()[DEMO_FILE.slug]
  const existing = useDemoExisting()
  const [busy, setBusy] = useState('')
  const [tb, setTb] = useState(null)   // { fileName, ledgers, warnings, sheetName }
  const [gl, setGl] = useState(null)   // { fileName, rows }
  const [py, setPy] = useState(null)   // previous year audited trial balance
  const [firstYear, setFirstYear] = useState(false)
  const [pyErr, setPyErr] = useState([])
  const [tbErr, setTbErr] = useState([])
  const [glErr, setGlErr] = useState([])
  const card = { background: D.card, border: `1px solid ${D.border}` }

  // The general ledger must back the trial balance, so it is checked whenever both are present.
  const crossCheck = (t, g) => {
    if (!t || !g) return { rows: [], errors: [], stats: null }
    const r = checkGL(t.ledgers, g.txns)
    return { rows: r.partyRows, errors: r.errors, stats: r.stats }
  }
  // Uploads can finish in any order, so the latest values are kept in a ref instead of being read from a stale closure.
  const cur = useRef({ tb: null, gl: null })
  const setBoth = (t, g) => { cur.current = { tb: t, gl: g }; setTb(t); setGl(g); setGlErr(g ? crossCheck(t, g).errors : []) }

  const onTB = async (f) => {
    if (!f) return
    setBusy('tb'); setTbErr([])
    try {
      const r = checkTBFormat(await readTBWorkbook(await f.arrayBuffer()))
      if (!r.ok) { setTbErr(r.errors); setBoth(null, cur.current.gl) }
      else setBoth({ fileName: f.name, ledgers: compactLedgers(r.ledgers), warnings: r.warnings, sheetName: r.sheetName }, cur.current.gl)
    } catch { setTbErr(['This file could not be read. Please upload an Excel (.xlsx) file in the prescribed format.']) }
    setBusy('')
  }
  const onPY = async (f) => {
    if (!f) return
    setBusy('py'); setPyErr([])
    try {
      const r = checkTBFormat(await readTBWorkbook(await f.arrayBuffer()))
      if (!r.ok) { setPyErr(r.errors); setPy(null) } else setPy({ fileName: f.name, ledgers: compactLedgers(r.ledgers) })
    } catch { setPyErr(['This file could not be read. Please upload an Excel (.xlsx) file in the prescribed format.']); setPy(null) }
    setBusy('')
  }
  const onGL = async (f) => {
    if (!f) return
    setBusy('gl'); setGlErr([])
    try {
      const r = await readGLWorkbook(await f.arrayBuffer())
      if (!r.ok) { setGlErr([`The general ledger needs these columns: ${r.missing.join(', ')}. It must list every transaction recorded in the books.`]); cur.current.gl = null; setGl(null) }
      else if (!r.txns.length) { setGlErr(['The general ledger has no transactions.']); cur.current.gl = null; setGl(null) }
      else setBoth(cur.current.tb, { fileName: f.name, txns: r.txns })
    } catch { setGlErr(['This file could not be read. Please upload an Excel (.xlsx) file in the prescribed format.']); cur.current.gl = null; setGl(null) }
    setBusy('')
  }
  const ready = !!tb && !!gl && glErr.length === 0 && (existing || firstYear || !!py)
  const oc = tb && py && !firstYear && !existing ? openingCheck(py.ledgers, tb.ledgers) : null
  const send = () => {
    const { rows, stats } = crossCheck(tb, gl)
    const r = submitTB(DEMO_FILE, { fileName: tb.fileName, ledgers: tb.ledgers, warnings: tb.warnings, sheetName: tb.sheetName, glFileName: gl.fileName, glRows: rows, glStats: stats, pyFileName: existing || firstYear ? '' : py.fileName, pyLedgers: existing || firstYear ? [] : py.ledgers, firstYear: !existing && firstYear })
    if (!r.ok) { setTbErr(r.errors); setTb(null); cur.current.tb = null; return }
    showToast('Trial balance and general ledger sent to the audit team')
  }
  const useDemo = () => { const r = submitTB(DEMO_FILE, demoPayload(existing)); if (!r.ok) { setTbErr(r.errors); return }; showToast('Demo files sent to the audit team') }

  if (sub?.status === 'Submitted') return (
    <div className="rounded-xl p-6" style={card}>
      <p className="flex items-center gap-2 text-sm font-semibold text-amber"><Clock className="h-4 w-4" />Trial balance, general ledger and previous year audited trial balance received. Waiting for the audit team to approve them.</p>
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
      <p className="mt-1 text-xs" style={{ color: D.muted }}>Your audit requirement list is prepared from your trial balance, so only the documents relevant to you are requested. The detailed general ledger supports the trial balance and gives the party-wise balances for receivables, payables and advances, so the trial balance can be kept at ledger level. Both must be in the prescribed format. The audit team reviews them before your list is released.</p>
      {sub?.status === 'Returned' && (
        <p className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs text-alert-red" style={{ background: 'rgba(230,57,70,0.08)' }}><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Returned by the audit team: {sub.returnReason}. Please correct it and upload again.</p>
      )}
      <ul className="mt-4 grid gap-1 text-xs sm:grid-cols-2" style={{ color: D.muted }}>
        {PRESCRIBED_COLUMNS.map((c) => <li key={c.key} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald" />{c.label}{c.required ? '' : ' (recommended)'}</li>)}
      </ul>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {slot({ title: 'Trial balance', hint: 'Ledger level, no group or sub-group balances. Receivables, payables and the two advance accounts may be one line each.', file: tb && `${tb.fileName} · ${tb.ledgers.length} ledgers`, errs: tbErr, onPick: onTB, kind: 'tb', template: 'Download the trial balance format', templateName: 'Trial_Balance_Format.xlsx', builder: buildTBTemplate })}
        {slot({ title: 'Detailed general ledger', hint: 'Every transaction recorded in your books for the period, one row per entry, with the opening balance of each account as an "Opening balance" line. For receivables, payables and advances give the party name on each line. Movements must agree with your trial balance.', file: gl && `${gl.fileName} · ${gl.txns.length} transactions`, errs: glErr, onPick: onGL, kind: 'gl', template: 'Download the general ledger format', templateName: 'General_Ledger_Format.xlsx', builder: buildGLTemplate })}
      </div>
      <div className="mt-3">
        {existing && <p className="text-xs" style={{ color: D.muted }}>We audited you last year, so your audit team adds last year's audited trial balance themselves and checks your opening balances against it. You do not need to upload it.</p>}
        {!existing && !firstYear && slot({ title: 'Previous year audited trial balance', hint: 'The audited trial balance of last year, in the same format. Your opening balances are checked against its closing balances.', file: py && `${py.fileName} · ${py.ledgers.length} ledgers`, errs: pyErr, onPick: onPY, kind: 'py', template: 'Download the trial balance format', templateName: 'Trial_Balance_Format.xlsx', builder: buildTBTemplate })}
        {!existing && <label className="mt-2 flex items-center gap-2 text-xs" style={{ color: D.muted }}><input type="checkbox" checked={firstYear} onChange={(e) => setFirstYear(e.target.checked)} />This is our first audit, so there is no previous year audited trial balance</label>}
        {oc && !oc.aligned && <p className="mt-2 rounded-lg px-3 py-2 text-xs text-amber" style={{ background: 'rgba(245,158,11,0.1)' }}>{oc.differences} area{oc.differences === 1 ? '' : 's'} of your opening balances differ from last year's audited closing balances. You can still send; the audit team will ask you to explain the difference.</p>}
        {oc && oc.aligned && <p className="mt-2 text-xs text-emerald">Your opening balances agree with last year's audited trial balance.</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={!ready} onClick={send} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Send to the audit team</button>
        {!ready && <span className="text-xs" style={{ color: D.muted }}>{existing ? 'The trial balance and the general ledger are needed.' : "The trial balance, the general ledger and last year's audited trial balance are needed."}</span>}
        <button onClick={useDemo} className="rounded-lg px-4 py-2 text-sm font-semibold underline" style={{ color: D.muted }}>Use demo files</button>
      </div>
    </div>
  )
}
