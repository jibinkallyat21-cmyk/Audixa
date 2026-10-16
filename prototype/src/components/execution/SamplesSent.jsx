import { useMemo, useState } from 'react'
import { Check, X, BellRing } from 'lucide-react'
import { Card, Chip, Stat, Empty, PrimaryButton, INPUT } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { setItemStatus, sendReminders } from '../../utils/requirementsStore'
import { sampleBlocks, countsOf, overdueItems } from '../../utils/sampleTracking'

const money = (n) => (n === undefined || n === null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const fmt = (d) => { if (!d) return '—'; const t = new Date(d); return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
const ORDER = ['Debits', 'Credits', 'Before year end', 'After year end', 'Above materiality', 'Selected below materiality']

function Row({ it, slug, odd }) {
  const showToast = useToast(); const [rejecting, setRejecting] = useState(false); const [reason, setReason] = useState('')
  const r = it.row || {}; const canReview = ['Uploaded Processing', 'Under Review'].includes(it.status)
  return (
    <>
      <tr className={`border-t border-slate-100 align-top ${odd ? 'bg-slate-50' : ''}`}>
        <td className="px-4 py-3 text-xs font-semibold text-slate-500">{it.ref}</td>
        <td className="px-4 py-3 text-sm text-navy">{r.date ? fmt(`${r.date}T00:00:00Z`) : '—'}</td>
        <td className="px-4 py-3 text-sm text-navy">{r.ledger || '—'}</td>
        <td className="px-4 py-3 text-sm text-navy">{r.description || '—'}{r.ref ? <span className="block text-xs text-slate-400">Ref. {r.ref}</span> : null}</td>
        <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-navy">{money(r.amount)}</td>
        <td className="px-4 py-3 text-xs text-slate-500">{it.sentBy || '—'}<span className="block">{fmt(it.sentAt)}</span></td>
        <td className="px-4 py-3"><Chip value={it.status === 'Uploaded Processing' ? 'Uploaded' : it.status} />{it.remindedAt ? <span className="mt-1 block text-xs text-amber">Reminded {fmt(it.remindedAt)}{it.reminders > 1 ? ` (${it.reminders}×)` : ''}</span> : null}</td>
        <td className="px-4 py-3 text-xs text-slate-500">{it.filename || '—'}</td>
        <td className="px-4 py-3 text-right">{canReview ? (
          <div className="flex justify-end gap-2">
            <button onClick={() => { setItemStatus(slug, it.ref, { status: 'Accepted', alert: '' }); showToast(`${it.ref} accepted`) }} className="inline-flex items-center gap-1 rounded-lg bg-emerald px-3 py-2 text-xs font-semibold text-white"><Check className="h-3.5 w-3.5" />Accept</button>
            <button onClick={() => setRejecting((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-alert-red/40 px-3 py-2 text-xs font-semibold text-alert-red"><X className="h-3.5 w-3.5" />Reject</button>
          </div>) : null}</td>
      </tr>
      {rejecting && <tr className="bg-slate-50"><td colSpan={9} className="px-4 py-4"><div className="flex flex-wrap items-center gap-3"><input aria-label="Reason for rejecting" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is it rejected? The client sees this." className={`${INPUT} min-w-[280px] flex-1`} /><PrimaryButton disabled={!reason.trim()} onClick={() => { setItemStatus(slug, it.ref, { status: 'Rejected', alert: reason.trim() }); setRejecting(false); showToast(`${it.ref} rejected: reason sent to the client`) }}>Reject and tell the client</PrimaryButton></div></td></tr>}
    </>
  )
}

// What was sent to the client from the sampling and cut-off tools: by area, who approved it and when, what came back, what is overdue, and the reminders.
export default function SamplesSent({ rec, slug, group }) {
  const showToast = useToast(); const [after, setAfter] = useState('3')
  const blocks = useMemo(() => sampleBlocks(rec, group), [rec, group])
  const all = blocks.flatMap((b) => b.items); const c = countsOf(all)
  const overdue = useMemo(() => overdueItems(rec, new Date(), Number(after) || 0).filter((i) => blocks.some((b) => b.items.some((x) => x.ref === i.ref))), [rec, after, blocks])
  if (!blocks.length) return <Empty>{group === 'cutoff' ? 'No cut-off items have been sent to the client yet. Pick them in Audit areas, under the cut-off of an area.' : 'No samples have been sent to the client yet. Select a sample in a sampling tool and approve it.'}</Empty>
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Stat label="Sent to the client" value={c.total} /><Stat label="Waiting for the client" value={c.waiting} tone={c.waiting ? 'amber' : 'green'} /><Stat label="Uploaded: to review" value={c.uploaded} tone={c.uploaded ? 'amber' : 'navy'} /><Stat label="Accepted" value={c.accepted} tone="green" /><Stat label="Rejected" value={c.rejected} tone={c.rejected ? 'red' : 'navy'} /></div>
      <Card title="Reminders" subtitle="Remind the client about items they still owe. A reminder restarts the waiting time for those items.">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block"><span className="text-xs font-medium text-slate-600">Remind when an item has waited at least (days)</span><input aria-label="Days before a reminder" type="number" min="0" value={after} onChange={(e) => setAfter(e.target.value)} className={`${INPUT} mt-1.5 w-40`} /></label>
          <p className="pb-2.5 text-sm text-slate-600"><b className="text-navy">{overdue.length}</b> item{overdue.length === 1 ? '' : 's'} due for a reminder</p>
          <PrimaryButton disabled={!overdue.length} onClick={() => { const n = sendReminders(slug, overdue.map((i) => i.ref)); showToast(`Reminder sent for ${n} item${n === 1 ? '' : 's'}`) }}><BellRing className="h-4 w-4" />Send a reminder</PrimaryButton>
        </div>
      </Card>
      {blocks.map((b) => {
        const subs = [...new Set(b.items.map((i) => i.subgroup || ''))].sort((x, y) => (ORDER.indexOf(x) + 1 || 99) - (ORDER.indexOf(y) + 1 || 99))
        return (
          <Card key={b.id} title={b.title.replace(/^(Samples|Cut-off): /, '')} subtitle={`${b.counts.total} item${b.counts.total === 1 ? '' : 's'} · ${b.counts.accepted} accepted · ${b.counts.uploaded} to review · ${b.counts.waiting + b.counts.rejected} waiting for the client`}>
            {subs.map((s) => (
              <div key={s || 'all'}>
                {s && <p className="mb-2 text-sm font-semibold text-navy">{s}</p>}
                <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">{['No.', 'Date', 'Ledger', 'Description', 'Amount (SAR)', 'Sent by', 'Status', 'File', ''].map((h, i) => <th key={i} className={`px-4 py-3 ${h.startsWith('Amount') ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
                  <tbody>{b.items.filter((i) => (i.subgroup || '') === s).map((i, k) => <Row key={i.ref} it={i} slug={slug} odd={k % 2 === 1} />)}</tbody></table></div>
              </div>
            ))}
          </Card>
        )
      })}
    </div>
  )
}
