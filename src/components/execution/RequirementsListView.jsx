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

function MisList({ file }) {
  const showToast = useToast()
  const issuedAll = useIssuedLists()
  const issued = issuedAll[file.slug]
  const [ledgers, setLedgers] = useState(null)
  const [src, setSrc] = useState('')
  const [multi, setMulti] = useState(false)
  const [overrides, setOverrides] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

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
  const built = useMemo(() => (ledgers ? buildIssuedList(MIS_REQUIREMENTS, ledgers, { consolidated: multi, overrides }) : null), [ledgers, multi, overrides])
  const preset = useMemo(() => presetList(MIS_REQUIREMENTS), [])
  const toggle = (c) => setOverrides((o) => {
    const next = { ...o }; const want = !c.include
    if (want === c.applies) delete next[c.id]; else next[c.id] = want
    return next
  })
  const issue = () => { const r = issueList(file, built, { source: src }); showToast(`${r.itemCount} requirements issued to ${file.client}`) }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-navy">MISCPA general audit requirements <AuditorChip auditor="MISCPA" /></p>
            <p className="mt-0.5 text-xs text-slate-500">{file.client}. The full preset list is shown first; once the trial balance is read, only the relevant requirements are kept.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className={`${BTN} cursor-pointer border border-slate-300 text-navy hover:bg-slate-50`}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}Analyse trial balance (Excel)
              <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} /></label>
            <button onClick={useDemo} className={`${BTN} border border-slate-300 text-navy hover:bg-slate-50`}>Use demo trial balance</button>
          </div>
        </div>
        {err && <p className="mt-2 text-xs text-alert-red">{err}</p>}
        {src && <p className="mt-2 text-xs text-slate-500">Trial balance: {src}{multi ? ' · several branches / entities, consolidated first' : ''}.</p>}
      </div>

      {issued && (
        <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald">Issued to the client: {issued.itemCount} requirements in {issued.categories.length} categories · {new Date(issued.issuedAt).toLocaleString()}</p>
            <button onClick={() => { withdrawList(file.slug); showToast('Issued list withdrawn') }} className={`${BTN} border border-slate-300 text-navy hover:bg-white`}><Undo2 className="h-3.5 w-3.5" />Withdraw</button>
          </div>
          <p className="mt-1 text-xs text-slate-500">The client sees this list under Documents in their portal. Re-issue after a change to replace it.</p>
        </div>
      )}

      {!built && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preset list · {preset.reduce((n, c) => n + c.items.length, 0)} items in {preset.length} categories (not yet filtered)</p>
          {preset.map((c) => <Cat key={c.id} title={c.title} count={c.items.length}><Items items={c.items} /></Cat>)}
        </>
      )}

      {built && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-navy">{built.itemCount} requirements in {built.categories.length} of {built.analysis.length} categories apply to this client</p>
            <button onClick={issue} className={`${BTN} bg-brand text-white shadow-sm hover:bg-[#D12C35]`}><Send className="h-3.5 w-3.5" />{issued ? 'Re-issue to client' : 'Issue to client'}</button>
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

export default function RequirementsListView({ file }) {
  if (file.auditor !== 'MISCPA') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-semibold text-navy">Requirement list <AuditorChip auditor={file.auditor} /></p>
        <p className="mt-2 text-sm text-slate-600">The ABCPA general requirement list will be provided later. Until then the list below is the sample ABCPA list.</p>
      </div>
    )
  }
  return <MisList key={file.slug} file={file} />
}
