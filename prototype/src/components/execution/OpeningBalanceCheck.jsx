import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { useToast } from '../shared/Toast'
import { readDocument } from './elShared'
import { readTBWorkbook } from '../../utils/tbExcel'
import { toLedgers, groupOf } from '../../utils/tbCore'
import { compactLedgers } from '../../utils/tbFormat'
import { openingCheck } from '../../utils/openingCheck'
import { flagsFromCheck, reviewOpening } from '../../utils/openingReview'
import { requestReview } from '../../utils/openingReviewClient'
import { setPYTB, setOpeningReview } from '../../utils/tbSubmissionStore'
import { demoPYPayload, useDemoExisting } from '../../utils/demoData'

const BTN = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold'
const n0 = (n) => Number(n).toLocaleString()

// Opening balances against the previous year audited trial balance, in two steps so the AI is only used when the code finds something:
// 1. code compares the opening balances with the audited closing balances; 2. only the flagged ledgers go to the AI review, whose proposals are
// verified by adding the amounts. The audit team still confirms the result before the trial balance is accepted.
export default function OpeningBalanceCheck({ file, sub, onChange }) {
  const showToast = useToast()
  const existing = useDemoExisting()
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [note, setNote] = useState('')
  const asked = useRef('')
  const py = sub.pyLedgers || []
  const hasPY = py.length > 0
  const oc = useMemo(() => (hasPY ? openingCheck(py, sub.ledgers) : null), [py, sub.ledgers, hasPY])
  const flags = useMemo(() => (oc && !oc.aligned ? flagsFromCheck(py, sub.ledgers, oc) : []), [oc, py, sub.ledgers])
  const review = sub.openingReview || null
  const final = useMemo(() => (review && hasPY ? reviewOpening({ py, cy: sub.ledgers, proposals: review.proposals }) : null), [review, py, sub.ledgers, hasPY])
  const ocFinal = final ? final.after : oc
  const open = sub.status === 'Submitted'

  const run = async () => {
    setBusy('review')
    const r = await requestReview(flags)
    const res = reviewOpening({ py, cy: sub.ledgers, proposals: r.proposals })
    setOpeningReview(file, { source: r.source, reason: r.reason || '', notes: r.notes || [], proposals: r.proposals, flagCount: flags.length, verifiedCount: res.verified.length, at: new Date().toISOString() })
    setBusy('')
  }
  // Step 2 starts by itself, once per previous year file, and only when step 1 left something flagged.
  useEffect(() => {
    if (!open || !hasPY || !flags.length || review) return
    const key = `${sub.pyFileName}|${flags.length}`
    if (asked.current === key) return
    asked.current = key; run()
  }, [open, hasPY, flags.length, review]) // eslint-disable-line react-hooks/exhaustive-deps

  const needsNote = !!sub.firstYear || (!!ocFinal && !ocFinal.aligned)
  const ready = !open || (confirmed && (!needsNote || note.trim().length > 0) && (hasPY || !!sub.firstYear) && !busy)
  const summary = useMemo(() => ({ differences: ocFinal?.differences || 0, flagged: flags.length, resolvedByReview: final?.verified.length || 0, reviewSource: review?.source || null, firstYear: !!sub.firstYear, note: note.trim() }), [ocFinal, flags.length, final, review, sub.firstYear, note])
  useEffect(() => { onChange({ ready, summary }) }, [ready, summary]) // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = async (f) => {
    if (!f) return
    setBusy('file'); setErr('')
    try {
      let ledgers = []
      if (f.name.toLowerCase().endsWith('.pdf')) {
        const r = await readDocument('pyTb', f)
        if (r.source !== 'claude') throw new Error(`${r.reason || 'The PDF could not be read'}. Upload the Excel file instead.`)
        ledgers = (r.fields.ledgers || []).filter((l) => l.name).map((l) => { const opening = l.opening ?? 0, debit = l.debit ?? 0, credit = Math.abs(l.credit ?? 0); return { code: l.code || '', name: l.name, group: groupOf(l.name), opening, debit, credit, closing: l.closing ?? opening + debit - credit, branch: '' } })
      } else {
        const sheets = await readTBWorkbook(await f.arrayBuffer())
        if (!sheets.length) throw new Error('No trial balance was found in the file. It needs a ledger name column and at least two of opening, debit, credit and closing.')
        ledgers = compactLedgers(toLedgers(sheets[0].rows, sheets[0].mapping, { fileName: sheets[0].sheetName }))
      }
      if (!ledgers.length) throw new Error('No ledgers were found in the file.')
      setPYTB(file, { fileName: f.name, ledgers }); setConfirmed(false); showToast('Previous year audited trial balance added')
    } catch (e) { setErr(e.message || 'The file could not be read.') }
    setBusy('')
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <p className="font-semibold text-navy">Opening balances against the previous year audited trial balance</p>
      {open && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className={`${BTN} cursor-pointer border border-slate-300 text-navy hover:bg-slate-50`}>{busy === 'file' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}{hasPY ? 'Replace the audited trial balance' : "Upload last year's audited trial balance (PDF or Excel)"}
            <input type="file" accept=".xlsx,.pdf" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} /></label>
          {!hasPY && <button onClick={() => { setPYTB(file, demoPYPayload()); setConfirmed(false) }} className={`${BTN} border border-slate-300 text-navy hover:bg-slate-50`}>Use demo audited trial balance</button>}
        </div>
      )}
      {err && <p className="mt-2 text-alert-red" role="alert">{err}</p>}
      {existing && !hasPY && open && <p className="mt-2 text-amber">This is an existing client: add last year's audited trial balance to run the opening balance check.</p>}
      {!existing && sub.firstYear && <p className="mt-1 text-amber">The client says this is their first audit, so no previous year audited trial balance was supplied.</p>}
      {!hasPY && !sub.firstYear && !existing && <p className="mt-1 text-alert-red">No previous year audited trial balance was supplied. Add it above or return the trial balance to the client.</p>}

      {oc && (
        <div className="mt-2 overflow-x-auto">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Step 1 · Code check of {sub.pyFileName}</p>
          <p className={`mt-1 ${oc.aligned ? 'text-emerald' : 'text-alert-red'}`}>{oc.aligned ? 'All opening balances agree. The AI is not used.' : `${oc.differences} area${oc.differences === 1 ? '' : 's'} flagged (${flags.length} ledger${flags.length === 1 ? '' : 's'} sent for review).`}</p>
          <table className="mt-2 w-full text-left"><thead><tr className="text-slate-400"><th className="py-1 pr-3 font-semibold">Area</th><th className="pr-3 text-right font-semibold">PY audited closing</th><th className="pr-3 text-right font-semibold">CY opening</th><th className="pr-3 text-right font-semibold">Difference</th><th className="font-semibold">Result</th></tr></thead>
            <tbody>{oc.lines.map((l) => <tr key={l.label} className="border-t border-slate-100"><td className="py-1 pr-3">{l.label}</td><td className="pr-3 text-right">{n0(l.pyClosing)}</td><td className="pr-3 text-right">{n0(l.cyOpening)}</td><td className={`pr-3 text-right ${l.status === 'Difference' ? 'font-semibold text-alert-red' : ''}`}>{n0(l.difference)}</td><td className={l.status === 'Difference' ? 'font-semibold text-alert-red' : 'text-emerald'}>{l.status === 'Difference' ? 'Flagged' : 'Agrees'}</td></tr>)}</tbody></table>
        </div>
      )}

      {oc && !oc.aligned && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Step 2 · {review?.source === 'ai' ? 'AI review of the flagged ledgers' : review ? 'Amount matching of the flagged ledgers (AI not available)' : 'Review of the flagged ledgers'}{busy === 'review' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}</p>
          {busy === 'review' && <p className="mt-1 text-slate-500">Reviewing {flags.length} flagged ledger{flags.length === 1 ? '' : 's'}…</p>}
          {review && review.source !== 'ai' && <p className="mt-1 text-amber">{review.reason}. Only exact amount matches are proposed here; connect the AI key to let it read the names too.</p>}
          {final && (
            <div className="mt-1 space-y-1">
              {final.verified.map((v, i) => <p key={i} className="rounded-md bg-emerald/5 px-2 py-1.5 text-slate-700"><b className="text-emerald">Resolved:</b> {v.py.join(' + ')} (last year {n0(v.pySum)}) = {v.cy.join(' + ')} (this year {n0(v.cySum)}). {v.reason}</p>)}
              {final.rejected.map((v, i) => <p key={i} className="rounded-md bg-amber/10 px-2 py-1.5 text-slate-700"><b className="text-amber">Not accepted:</b> {(v.py || []).join(' + ')} and {(v.cy || []).join(' + ')}. {v.why}</p>)}
              {final.verified.length === 0 && final.rejected.length === 0 && <p className="text-slate-500">No ledgers could be paired.</p>}
              <p className={final.resolved ? 'font-semibold text-emerald' : 'font-semibold text-alert-red'}>{final.resolved ? 'After the review every opening balance agrees.' : `${final.after.differences} area${final.after.differences === 1 ? '' : 's'} still differ after the review.`}</p>
              {(review.notes || []).map((x, i) => <p key={i} className="text-slate-500">Note: {x}</p>)}
            </div>
          )}
          {open && review && !busy && <button onClick={run} className={`${BTN} mt-2 border border-slate-300 text-navy hover:bg-slate-50`}><RefreshCw className="h-3.5 w-3.5" />Run the review again</button>}
        </div>
      )}

      {open ? (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-2">
          <label className="flex items-start gap-2 text-slate-700"><input type="checkbox" className="mt-0.5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />I have checked the opening balances against the previous year audited trial balance{needsNote ? ' and recorded the explanation below' : ''}.</label>
          {needsNote && <input aria-label="Opening balance explanation" value={note} onChange={(e) => setNote(e.target.value)} placeholder={sub.firstYear ? 'How the opening balances were verified (first-year audit)' : 'Explanation for the differences that remain'} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-navy" />}
        </div>
      ) : sub.openingCheck && <p className="mt-2 text-emerald">Confirmed by {sub.approvedBy}{sub.openingCheck.note ? `: ${sub.openingCheck.note}` : '.'}</p>}
    </div>
  )
}
