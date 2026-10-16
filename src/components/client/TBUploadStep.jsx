import { useState } from 'react'
import { Download, Loader2, Upload, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { readTBWorkbook } from '../../utils/tbExcel'
import { checkTBFormat, compactLedgers, PRESCRIBED_COLUMNS } from '../../utils/tbFormat'
import { buildTBTemplate } from '../../utils/tbTemplate'
import { useTBSubmissions, submitTB } from '../../utils/tbSubmissionStore'
import { demoCY, demoPY } from '../../data/demoTB'
import { DEMO_FILE } from '../../utils/demoData'

// The client's first requirement: upload the trial balance in the prescribed format. The requirement list appears only after the audit team approves it.
export default function TBUploadStep({ D }) {
  const showToast = useToast()
  const sub = useTBSubmissions()[DEMO_FILE.slug]
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const card = { background: D.card, border: `1px solid ${D.border}` }

  const onFile = async (f) => {
    if (!f) return
    setBusy(true); setErr('')
    try {
      const r = checkTBFormat(await readTBWorkbook(await f.arrayBuffer()))
      if (!r.ok) setErr(`${r.reason} Please use the prescribed format and upload again.`)
      else { submitTB(DEMO_FILE, { fileName: f.name, ledgers: compactLedgers(r.ledgers), warnings: r.warnings, sheetName: r.sheetName }); showToast('Trial balance sent to the audit team') }
    } catch { setErr('This file could not be read. Please upload an Excel (.xlsx) file in the prescribed format.') }
    setBusy(false)
  }
  const useDemo = () => { submitTB(DEMO_FILE, { fileName: 'Demo trial balance.xlsx', ledgers: compactLedgers(demoCY(demoPY())), sheetName: 'Trial Balance' }); showToast('Demo trial balance sent to the audit team') }
  const template = async () => { const url = URL.createObjectURL(await buildTBTemplate()); const a = document.createElement('a'); a.href = url; a.download = 'Trial_Balance_Format.xlsx'; a.click(); URL.revokeObjectURL(url) }

  if (sub?.status === 'Submitted') return (
    <div className="rounded-xl p-6" style={card}>
      <p className="flex items-center gap-2 text-sm font-semibold text-amber"><Clock className="h-4 w-4" />Trial balance received. Waiting for the audit team to approve it.</p>
      <p className="mt-2 text-xs" style={{ color: D.muted }}>{sub.fileName} · {sub.ledgers.length} ledgers · sent {new Date(sub.submittedAt).toLocaleString()}. Your requirement list will appear here once it is approved.</p>
    </div>
  )

  return (
    <div className="rounded-xl p-6" style={card}>
      <p className="text-base font-bold" style={{ color: D.text }}>Step 1: Upload your trial balance</p>
      <p className="mt-1 text-xs" style={{ color: D.muted }}>Your audit requirement list is prepared from your trial balance, so only the documents relevant to you are requested. Please upload it in the prescribed format. The audit team reviews it before your list is released.</p>
      {sub?.status === 'Returned' && (
        <p className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs text-alert-red" style={{ background: 'rgba(230,57,70,0.08)' }}><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Returned by the audit team: {sub.returnReason}. Please correct it and upload again.</p>
      )}
      <ul className="mt-4 grid gap-1 text-xs sm:grid-cols-2" style={{ color: D.muted }}>
        {PRESCRIBED_COLUMNS.map((c) => <li key={c.key} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald" />{c.label}{c.required ? '' : ' (recommended)'}</li>)}
      </ul>
      {err && <p className="mt-3 flex items-start gap-2 text-xs text-alert-red"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{err}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Upload trial balance (Excel)
          <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        <button onClick={template} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ border: `1px solid ${D.border}`, color: D.text }}><Download className="h-4 w-4" />Download the format</button>
        <button onClick={useDemo} className="rounded-lg px-4 py-2 text-sm font-semibold underline" style={{ color: D.muted }}>Use demo trial balance</button>
      </div>
    </div>
  )
}
