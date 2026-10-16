import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Send, Undo2, Plus, Minus } from 'lucide-react'
import AuditorChip from '../shared/AuditorChip'
import { useToast } from '../shared/Toast'
import { requirementsFor } from '../../data/firmRequirements'
import { detectBranches } from '../../utils/tbCore'
import { buildIssuedList, presetList } from '../../utils/requirementsEngine'
import { useIssuedLists, issueList, withdrawList } from '../../utils/requirementsStore'
import { applyPartyBreakdown } from '../../utils/partyBreakdown'
import { partyKindOf } from '../../utils/tbFormat'
import OpeningBalanceCheck from './OpeningBalanceCheck'
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
  const [overrides, setOverrides] = useState({})
  const [err, setErr] = useState('')
  const sub = useTBSubmissions()[file.slug]
  const clientTB = sub && ['Submitted', 'Approved'].includes(sub.status) && sub.ledgers?.length ? sub : null
  const [reason, setReason] = useState('')
  const [adjust, setAdjust] = useState(false)

  const effLedgers = clientTB ? clientTB.ledgers : null
  const effMulti = clientTB ? detectBranches(clientTB.ledgers, 1).multi : false
  const built = useMemo(() => (effLedgers ? buildIssuedList(requirementsFor(file.auditor), effLedgers, { consolidated: effMulti, overrides }) : null), [effLedgers, effMulti, overrides])
  const toggle = (c) => setOverrides((o) => {
    const next = { ...o }; const want = !c.include
    if (want === c.applies) delete next[c.id]; else next[c.id] = want
    return next
  })
  const issue = () => {
    if (glResult) applyGL()
    // The client's approved trial balance is the detailed trial balance requirement (item 1 of the Trial Balance category).
    const withTB = { ...built, categories: built.categories.map((c) => (c.id === 'TB' ? { ...c, items: c.items.map((i, n) => (n === 0 ? { ...i, status: 'Accepted', filename: clientTB.fileName } : i)) } : c)) }
    const r = issueList(file, withTB, { source: `Client TB: ${clientTB.fileName}` }); if (clientTB) approveTB(file, 'Audit team', { confirmed: true, ...(opening.summary || {}) }); showToast(`${r.itemCount} requirements issued to ${file.client}`)
  }
  // The client supplies the general ledger with the trial balance; the party-wise balances are worked out from it.
  const glResult = useMemo(() => (clientTB?.glRows?.length && !clientTB.partyWise ? applyPartyBreakdown(clientTB.ledgers, clientTB.glRows) : null), [clientTB])
  const [opening, setOpening] = useState({ ready: false, summary: null })
  const openingOk = !clientTB || clientTB.status === 'Approved' || opening.ready
  const applyGL = () => { setTBLedgers(file, glResult.ledgers, { partyWise: { file: clientTB.glFileName, summary: glResult.summary, appliedAt: new Date().toISOString() } }); showToast('Party-wise balances applied to the trial balance') }
  const sendBack = () => { if (!reason.trim()) { setErr('Give the client a reason for returning the trial balance.'); return }; returnTB(file, reason.trim()); withdrawList(file.slug); setReason(''); setErr(''); showToast('Trial balance returned to the client') }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-navy">{file.auditor} general audit requirements <AuditorChip auditor={file.auditor} /></p>
            <p className="mt-0.5 text-xs text-slate-500">{file.client}. The requirement list is prepared from the client's approved trial balance: only the relevant requirements are kept.</p>
          </div>

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
                    : <p className="mt-1">{left ? `The client's general ledger (${clientTB.glFileName || 'not supplied'}${clientTB.glStats ? `, ${clientTB.glStats.transactions} transactions in ${clientTB.glStats.accounts} accounts, agreed to the trial balance` : ''}) gives the party-wise balances for ${left} line${left === 1 ? '' : 's'} that are still one balance in the trial balance. They are applied when you approve, or you can apply them now.` : 'No receivable, payable or advance lines to break down.'}</p>}
                  {glResult && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-left"><thead><tr className="text-slate-400"><th className="py-1 pr-3 font-semibold">Line</th><th className="pr-3 font-semibold">Parties</th><th className="pr-3 text-right font-semibold">General ledger</th><th className="pr-3 text-right font-semibold">Trial balance</th><th className="text-right font-semibold">Difference</th></tr></thead>
                        <tbody>{glResult.summary.map((s) => <tr key={s.line} className="border-t border-slate-100"><td className="py-1 pr-3">{s.line}</td><td className="pr-3">{s.parties || 'not in the general ledger'}</td><td className="pr-3 text-right">{s.glTotal === null ? '' : s.glTotal.toLocaleString()}</td><td className="pr-3 text-right">{s.tbClosing.toLocaleString()}</td><td className={`text-right ${s.difference ? 'font-semibold text-alert-red' : ''}`}>{s.difference === null ? '' : s.difference.toLocaleString()}</td></tr>)}</tbody></table>
                      <button onClick={applyGL} className={`${BTN} mt-2 bg-navy text-white`}>Apply party-wise balances now</button>
                    </div>
                  )}
                </div>
              )
            })()}
            <OpeningBalanceCheck file={file} sub={clientTB} onChange={setOpening} />
            {clientTB.status === 'Submitted' && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input aria-label="Reason for returning" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, if the trial balance is to be returned" className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-navy" />
                <button onClick={sendBack} className={`${BTN} border border-slate-300 text-navy hover:bg-white`}><Undo2 className="h-3.5 w-3.5" />Return to client</button>
              </div>
            )}
          </div>
        )}
        {!clientTB && sub?.status === 'Returned' && <p className="mt-2 text-xs text-amber">Returned to the client: {sub.returnReason}. Waiting for a new upload.</p>}
        {!clientTB && !sub && <p className="mt-2 text-xs text-slate-500">Waiting for the client to upload the trial balance.</p>}
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

      {!clientTB && !issued && (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No requirement list yet. It is prepared from the client's trial balance, so nothing is requested until the client uploads one and you approve it.
        </div>
      )}

      {built && (!issued || !renderIssued || adjust) && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-navy">{built.itemCount} requirements in {built.categories.length} of {built.analysis.length} categories apply to this client</p>
            <button onClick={issue} disabled={!openingOk} title={openingOk ? '' : 'Confirm the opening balance check first'} className={`${BTN} bg-brand text-white shadow-sm hover:bg-[#D12C35] disabled:opacity-40`}><Send className="h-3.5 w-3.5" />{clientTB?.status === 'Submitted' ? 'Approve trial balance and issue list' : issued ? 'Re-issue to client' : 'Issue to client'}</button>
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
  if (!requirementsFor(file.auditor).length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">No general requirement list is set up for {file.auditor || 'this auditor'}.</p>
      </div>
    )
  }
  return <MisList key={`${file.slug}-${file.auditor}`} file={file} renderIssued={renderIssued} />
}
