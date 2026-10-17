import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { PLACEABLE, unplaced, checkProposals, applyGroups, ledgerKey } from '../../utils/ledgerReview'
import { requestPlacement } from '../../utils/ledgerReviewClient'
import { setLedgerReview, setTBLedgers } from '../../utils/tbSubmissionStore'

const BTN = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold'
const n0 = (n) => Number(n).toLocaleString()

// Ledgers whose names the rules could not place (other names, Arabic, abbreviations). The AI suggests a group for each, only after the code has failed;
// the audit team chooses the group. Only the group changes, never an amount, and the requirement list is built from the groups.
export default function LedgerPlacement({ file, sub }) {
  const showToast = useToast()
  const list = useMemo(() => unplaced(sub.ledgers), [sub.ledgers])
  const review = sub.ledgerReview || null
  const [busy, setBusy] = useState(false)
  const [pick, setPick] = useState({})
  const asked = useRef('')
  const open = sub.status === 'Submitted'
  const proposals = useMemo(() => (review ? checkProposals(review.items, sub.ledgers) : []), [review, sub.ledgers])

  useEffect(() => {
    if (!open || !list.length || review) return
    const k = `${sub.fileName}|${list.length}`; if (asked.current === k) return
    asked.current = k
    ;(async () => { setBusy(true); const r = await requestPlacement(sub.ledgers); setLedgerReview(file, { source: r.source, reason: r.reason || '', engine: r.engine || '', items: r.items, count: list.length, at: new Date().toISOString() }); setBusy(false) })()
  }, [open, list.length, review]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!list.length) return null
  const choice = (l) => pick[ledgerKey(l)] ?? proposals.find((p) => p.key === ledgerKey(l))?.group ?? ''
  const apply = () => {
    const chosen = Object.fromEntries(list.map((l) => [ledgerKey(l), choice(l)]).filter(([, g]) => g))
    if (!Object.keys(chosen).length) return
    setTBLedgers(file, applyGroups(sub.ledgers, chosen)); setPick({}); showToast(`${Object.keys(chosen).length} ledger group${Object.keys(chosen).length === 1 ? '' : 's'} set; the requirement list is built from them`)
  }
  return (
    <div className="mt-3 rounded-lg border border-amber/40 bg-amber/5 p-3">
      <p className="font-semibold text-navy">{list.length} ledger{list.length === 1 ? '' : 's'} the name rules could not place</p>
      <p className="mt-1 text-slate-600">The requirement list is built from the group of each ledger. {busy ? 'The AI is looking at these names…' : review?.source === 'ai' ? `AI suggestions below${review.engine ? ` (${review.engine})` : ''}; you choose the group. No amount changes.` : review ? `No AI suggestion (${review.reason || 'not available'}). Choose the group yourself.` : ''}</p>
      {busy && <p className="mt-2 flex items-center gap-2 text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Please wait</p>}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left"><thead><tr className="text-slate-400"><th className="py-1 pr-3 font-semibold">Ledger</th><th className="pr-3 text-right font-semibold">Closing balance</th><th className="pr-3 font-semibold">Suggested</th><th className="font-semibold">Group</th></tr></thead>
          <tbody>{list.map((l) => { const p = proposals.find((x) => x.key === ledgerKey(l)); return (
            <tr key={ledgerKey(l)} className="border-t border-slate-100 align-top">
              <td className="py-1.5 pr-3 text-navy">{l.name}{l.code ? <span className="text-slate-400"> · {l.code}</span> : null}</td>
              <td className="pr-3 text-right tabular-nums">{n0(Math.round(l.closing * 100) / 100)}</td>
              <td className="pr-3 text-slate-600">{p ? <>{p.label}<span className="block text-slate-400">{p.reason}</span></> : '—'}</td>
              <td><select aria-label={`Group for ${l.name}`} value={choice(l)} disabled={!open} onChange={(e) => setPick({ ...pick, [ledgerKey(l)]: e.target.value })} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-navy"><option value="">Leave unplaced</option>{PLACEABLE.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></td>
            </tr>) })}</tbody></table>
      </div>
      {open && <button onClick={apply} className={`${BTN} mt-2 bg-navy text-white`}>Set these groups</button>}
    </div>
  )
}
