import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, FileSpreadsheet, Loader2, Send, Undo2, Plus, Minus } from 'lucide-react'
import AuditorChip from '../shared/AuditorChip'
import { useToast } from '../shared/Toast'
import { MIS_REQUIREMENTS } from '../../data/misRequirements'
import { demoPY, demoCY } from '../../data/demoTB'
import { toLedgers, detectBranches, consolidate } from '../../utils/tbCore'
import { readTBWorkbook } from '../../utils/tbExcel'
import { buildIssuedList, presetList } from '../../utils/requirementsEngine'
import { useIssuedLists, issueList, withdrawList } from '../../utils/requirementsStore'
import { applyPartyBreakdown, readGLWorkbook, demoGLRows } from '../../utils/partyBreakdown'
import { partyKindOf } from '../../utils/tbFormat'
import { useTBSubmissions, approveTB, returnTB, setTBLedgers } from '../../utils/tbSubmissionStore'

const BTN = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold'

function Items({ items }) {
  return (
    <ul className="divide-y divide-slate-100 border-t border-slate-100">
      {items.map((i) => (
        <li key={i.ref} className="flex gap-3 px-4 py-2.5 text-xs text-slate-600">
          <span className="w-16 shrink-0 font-mono font-semibold text-navy">{i.ref}</span>
          <span className="min-w-0 flex-1 break-words">{i.text}</span>
          {i.status && <span className="shrink-0 rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[11px] font-bold text-amber">{i.status}</span>}
        </li>
      ))}
    </ul>
  )
}

function Cat({ title, count, note, tone, right, children, open: o0 = false }) {
  const [open, setOpen] = useState(o0)
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-start gap-2 text-left" aria-expanded={open}>
          {open ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
          <span className="min-w-0"><span className={`block text-sm font-semibold ${tone || 'text-navy'}`}>{title} <span className="font-normal text-slate-400">· {count} item{count === 1 ? '' : 's'}</span></span>
            {note && <span className="mt-0.5 block text-xs text-slate-500">{note}</span>}</span>
        </button>
        {right}
      </div>
      {open && children}
    </div>
  )
}

function MisList({ file, renderIssued }) {
  const showToast = useToast()
  const issuedAll = useIssuedLists()
  const issued = issuedAll[file.slug]
  const [ledgers, setLedgers] = useState(null)
  const [src, setSrc] = useState('')
  const [multi, setMulti] = useState(false)
  const [overrides, setOverrides] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const sub = useTBSubmissions()[file.slug]
  const clientTB = sub && ['Submitted', 'Approved'].includes(sub.status) && sub.ledgers?.length ? sub : null
  const [reason, setReason] = useState('')
  const [adjust, setAdjust] = useState(false)
  const [gl, setGl] = useState(null)

  const useDemo = () => { setLedgers(demoCY(demoPY())); setSrc('Demo trial balance'); setOverrides({}); setErr(''); setMulti(false) }
  const onFile = async (f) => {
    if (!f) return
    setBusy(true); setErr('')
    try {
      const sheets = await readTBWorkbook(await f.arrayBuffer())
      if (!sheets.length) throw new Error('No trial balance found. It needs a ledger name column and at least two of Opening, Debit, Credit, Closing.')
      const all = sheets.flatMap((s) => toLedgers(s.rows, s.mapping, { fileName: s.sheetName }))
      const b = detectBranches(all, sheets.length)
      setMulti(b.multi); setLedgers(b.multi ? consolidate(all).ledgers : all); setSrc(`${f.name} · ${all.length} ledgers`); setOverrides({})
    } catch (e) { setErr(e.message || 'Could not read the file.') }
    setBusy(false)
  }
  const effLedgers = clientTB ? clientTB.ledgers : ledgers
  const effMulti = clientTB ? detectBranches(clientTB.ledgers, 1).multi : multi
  const built = useMemo(() => (effLedgers ? buildIssuedList(MIS_REQUIREMENTS, effLedgers, { consolidated: effMulti, overrides }) : null), [effLedgers, effMulti, overrides])
  const preset = useMemo(() => presetList(MIS_REQUIREMENTS), [])
  const toggle = (c) => setOverrides((o) => {
    const next = { ...o }; const want = !c.include
    if (want === c.applies) delete next[c.id]; else next[c.id] = want
    return next
  })
  const issue = () => { const r = issueList(file, built, { source: clientTB ? `Client TB: ${clientTB.fileName}` : src }); if (clientTB) approveTB(file); showToast(`${r.itemCount} requirements issued to ${file.client}`) }
  const readGL = async (f) => {
    if (!f) return
    setBusy(true); setErr('')
    try { const r = await readGLWorkbook(await f.arrayBuffer()); if (!r.ok) setErr(`The general ledger needs these columns: ${r.missing.join(', ')}.`); else setGl({ name: f.name, ...applyPartyBreakdown(clientTB.ledgers, r.rows) }) } catch { setErr('The general ledger file could not be read.') }
    setBusy(false)
  }
  const demoGL = () => setGl({ name: 'Demo general ledger.xlsx', ...applyPartyBreakdown(clientTB.ledgers, demoGLRows(clientTB.ledgers)) })
  const applyGL = () => { setTBLedgers(file, gl.ledgers, { partyWise: { file: gl.name, summary: gl.summary, appliedAt: new Date().toISOString() } }); setGl(null); showToast('Party-wise balances applied to the trial balance') }
  const sendBack = () => { if (!reason.trim()) { setErr('Give the client a reason for returning the trial balance.'); return }; returnTB(file, reason.trim()); withdrawList(file.slug); setReason(''); setErr(''); showToast('Trial balance returned to the client') }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-navy">MISCPA general audit requirements <AuditorChip auditor="MISCPA" /></p>
            <p className="mt-0.5 text-xs text-slate-500">{file.client}. The full preset list is shown first; once the trial balance is read, only the relevant requirements are kept.</p>
          </div>
          {!clientTB && <div className="flex flex-wrap gap-2">
            <label className={`${BTN} cursor-pointer border border-slate-300 text-navy hover:bg-slate-50`}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}Analyse trial balance (Excel)
              <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} /></label>
            <button onClick={useDemo} className={`${BTN} border border-slate-300 text-navy hover:bg-slate-50`}>Use demo trial balance</button>
          </div>}
        </div>
        {err && <p className="mt-2 text-xs text-alert-red">{err}</p>}
        {clientTB && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-navy">Client trial balance: {clientTB.fileName} · {clientTB.ledgers.length} ledgers · {clientTB.status === 'Approved' ? `Approved by ${sub.approvedBy}` : 'Format check passed, waiting for your approval'}</p>
            {(clientTB.warnings || []).map((w) => <p key={w} className="mt-1 text-amber">{w}</p>)}
            {(() => {
              const left = clientTB.ledgers.filter((l) => partyKindOf(l.name)).length
              return (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="font-semibold text-navy">General ledger: party-wise balances</p>
                  {clientTB.partyWise ? <p className="mt-1 text-emerald">Applied from {clientTB.partyWise.file}: {clientTB.partyWise.summary.filter((s) => s.replaced).map((s) => `${s.line} (${s.parties} parties)`).join(', ')}.</p>
                    : <p className="mt-1">{left ? `${left} control line${left === 1 ? '' : 's'} (receivables, payables, advances) still show one group balance. Upload the general ledger dump to replace them with party-wise balances.` : 'No receivable, payable or advance lines to break down.'}</p>}
                  {left > 0 && !clientTB.partyWise && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <label className={`${BTN} cursor-pointer border border-slate-300 text-navy hover:bg-slate-50`}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}Upload general ledger (Excel)
                        <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { readGL(e.target.files?.[0]); e.target.value = '' }} /></label>
                      <button onClick={demoGL} className={`${BTN} border border-slate-300 text-navy hover:bg-slate-50`}>Use demo general ledger</button>
                    </div>
                  )}
                  {gl && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-left"><thead><tr className="text-slate-400"><th className="py-1 pr-3 font-semibold">Line</th><th className="pr-3 font-semibold">Parties</th><th className="pr-3 text-right font-semibold">General ledger</th><th className="pr-3 text-right font-semibold">Trial balance</th><th className="text-right font-semibold">Difference</th></tr></thead>
                        <tbody>{gl.summary.map((s) => <tr key={s.line} className="border-t border-slate-100"><td className="py-1 pr-3">{s.line}</td><td className="pr-3">{s.parties || 'not in the general ledger'}</td><td className="pr-3 text-right">{s.glTotal === null ? '' : s.glTotal.toLocaleString()}</td><td className="pr-3 text-right">{s.tbClosing.toLocaleString()}</td><td className={`text-right ${s.difference ? 'font-semibold text-alert-red' : ''}`}>{s.difference === null ? '' : s.difference.toLocaleString()}</td></tr>)}</tbody></table>
                      {gl.unmatched.length > 0 && <p className="mt-1 text-amber">General ledger accounts not matched to a trial balance line: {gl.unmatched.join(', ')}.</p>}
                      <button onClick={applyGL} className={`${BTN} mt-2 bg-navy text-white`}>Apply party-wise balances</button>
                    </div>
                  )}
                </div>
              )
            })()}
            {clientTB.status === 'Submitted' && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input aria-label="Reason for returning" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, if the trial balance is to be returned" className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-navy" />
                <button onClick={sendBack} className={`${BTN} border border-slate-300 text-navy hover:bg-white`}><Undo2 className="h-3.5 w-3.5" />Return to client</button>
              </div>
            )}
          </div>
        )}
        {!clientTB && sub?.status === 'Returned' && <p className="mt-2 text-xs text-amber">Returned to the client: {sub.returnReason}. Waiting for a new upload.</p>}
        {!clientTB && !sub && <p className="mt-2 text-xs text-slate-500">The client has not uploaded a trial balance yet. Their requirement list stays hidden until you approve one.</p>}
        {src && <p className="mt-2 text-xs text-slate-500">Trial balance: {src}{multi ? ' · several branches / entities, consolidated first' : ''}.</p>}
      </div>

      {issued && (
        <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald">Issued to the client: {issued.itemCount} requirements in {issued.categories.length} categories · {new Date(issued.issuedAt).toLocaleString()}</p>
            <button onClick={() => { withdrawList(file.slug); showToast('Issued list withdrawn') }} className={`${BTN} border border-slate-300 text-navy hover:bg-white`}><Undo2 className="h-3.5 w-3.5" />Withdraw</button>
          </div>
          <p className="mt-1 text-xs text-slate-500">The client sees this list under Requirement List in their portal. Re-issue after a change to replace it.</p>
        </div>
      )}

      {issued && renderIssued && renderIssued(issued)}
      {issued && renderIssued && <button onClick={() => setAdjust(!adjust)} className={`${BTN} border border-slate-300 text-navy hover:bg-slate-50`}>{adjust ? 'Hide category changes' : 'Change categories (re-issuing resets review progress)'}</button>}

      {(!issued || !renderIssued || adjust) && !built && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preset list · {preset.reduce((n, c) => n + c.items.length, 0)} items in {preset.length} categories (not yet filtered)</p>
          {preset.map((c) => <Cat key={c.id} title={c.title} count={c.items.length}><Items items={c.items} /></Cat>)}
        </>
      )}

      {built && (!issued || !renderIssued || adjust) && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-navy">{built.itemCount} requirements in {built.categories.length} of {built.analysis.length} categories apply to this client</p>
            <button onClick={issue} className={`${BTN} bg-brand text-white shadow-sm hover:bg-[#D12C35]`}><Send className="h-3.5 w-3.5" />{clientTB?.status === 'Submitted' ? 'Approve trial balance and issue list' : issued ? 'Re-issue to client' : 'Issue to client'}</button>
          </div>
          {built.analysis.filter((c) => c.include).map((c) => {
            const items = built.categories.find((x) => x.id === c.id).items
            return (
              <Cat key={c.id} title={c.title} count={items.length} note={c.overridden ? 'Added by the auditor.' : c.reason}
                right={c.id !== 'TB' && <button onClick={() => toggle(c)} className={`${BTN} border border-slate-300 text-slate-600 hover:bg-slate-50`}><Minus className="h-3.5 w-3.5" />Not needed</button>}>
                <Items items={items} />
              </Cat>
            )
          })}
          {built.analysis.some((c) => !c.include) && (
            <>
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Not requested ({built.analysis.filter((c) => !c.include).length})</p>
              {built.analysis.filter((c) => !c.include).map((c) => (
                <Cat key={c.id} title={c.title} count={c.items.length} tone="text-slate-500" note={c.overridden ? 'Removed by the auditor.' : c.reason}
                  right={<button onClick={() => toggle(c)} className={`${BTN} border border-slate-300 text-navy hover:bg-slate-50`}><Plus className="h-3.5 w-3.5" />Add anyway</button>}>
                  <Items items={presetList([c])[0].items} />
                </Cat>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function RequirementsListView({ file, renderIssued }) {
  if (file.auditor !== 'MISCPA') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-semibold text-navy">Requirement list <AuditorChip auditor={file.auditor} /></p>
        <p className="mt-2 text-sm text-slate-600">The ABCPA general requirement list will be provided later. Until then the list below is the sample ABCPA list.</p>
      </div>
    )
  }
  return <MisList key={file.slug} file={file} renderIssued={renderIssued} />
}
