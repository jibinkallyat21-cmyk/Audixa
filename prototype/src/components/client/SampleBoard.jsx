import { useState } from 'react'
import { Upload, ChevronDown, Check, Clock } from 'lucide-react'
import StatusPill from '../shared/StatusPill'
import RemarkThread from '../shared/RemarkThread'
import { useToast } from '../shared/Toast'
import { PORTAL_CLIENT, setItemStatus, setAap } from '../../utils/requirementsStore'

const D = { card: 'var(--c-card)', border: 'var(--c-border)', text: 'var(--c-text)', muted: 'var(--c-muted)', subtle: 'var(--c-subtle)', page: 'var(--c-page)' }
const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt = (d) => { if (!d) return ''; const t = new Date(`${d}T00:00:00Z`); return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) }
const DONE = ['Uploaded Processing', 'Under Review', 'Accepted']

// Shown on a customer or supplier balance confirmation: the client says it cannot get one and gives the reason, which switches on the alternative procedure.
function CannotConfirm({ it }) {
  const showToast = useToast(); const [on, setOn] = useState(false); const [reason, setReason] = useState('')
  const send = () => { const side = /payab/i.test(it.data.category || it.row?.ledger || '') ? 'payables' : 'receivables'; const n = setAap(PORTAL_CLIENT.slug, it.ref, true, { by: 'Client', reason: reason.trim(), side, party: it.data.party, balance: it.row?.amount || 0 }); setOn(false); showToast(`Sent. ${n} other documents are now needed instead of the confirmation`) }
  if (!on) return <button onClick={() => setOn(true)} className="mt-3 text-sm font-semibold underline">We cannot get a confirmation from this party</button>
  return <div className="mt-3 space-y-2"><textarea aria-label="Why the confirmation cannot be obtained" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Tell us why a confirmation cannot be obtained" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy" /><div className="flex gap-2"><button disabled={!reason.trim()} onClick={send} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Send</button><button onClick={() => setOn(false)} className="text-sm font-semibold underline">Cancel</button></div></div>
}

function ItemRow({ it, wide }) {
  const showToast = useToast(); const [open, setOpen] = useState(false)
  const r = it.row || {}; const canUpload = ['Pending Client', 'Rejected', 'Action Required'].includes(it.status)
  return (
    <>
      <tr style={{ borderTop: `1px solid ${D.border}` }}>
        <td className="px-4 py-3.5 text-xs font-semibold" style={{ color: D.muted }}>{it.ref}</td>
        <td className="px-4 py-3.5 text-sm" style={{ color: D.text }}>{fmt(r.date) || '—'}</td>
        <td className="px-4 py-3.5 text-sm" style={{ color: D.text }}>{r.ledger || '—'}</td>
        <td className="px-4 py-3.5 text-sm" style={{ color: D.text }}>{r.description || '—'}{wide && r.ref ? <span className="block text-xs" style={{ color: D.muted }}>Ref. {r.ref}</span> : null}</td>
        {!wide && <td className="px-4 py-3.5 text-sm" style={{ color: D.text }}>{r.ref || '—'}</td>}
        <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums" style={{ color: D.text }}>{r.amount !== undefined ? money(r.amount) : '—'}</td>
        <td className="px-4 py-3.5"><StatusPill status={it.status} />{it.remindedAt && canUpload ? <span className="mt-1 block text-xs text-amber">Reminder from the audit team, {fmt(it.remindedAt.slice(0, 10))}</span> : null}</td>
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="What is needed" className="rounded-md p-1.5 hover:bg-slate-100" style={{ color: D.muted }}><ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
            {canUpload ? (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#D12C35]">
                <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { setItemStatus(PORTAL_CLIENT.slug, it.ref, { status: 'Uploaded Processing', filename: f.name, alert: '' }); showToast(`${f.name} uploaded`) } }} />
                <Upload className="h-3.5 w-3.5" />{it.status === 'Rejected' ? 'Re-upload' : 'Upload'}
              </label>
            ) : <span className="inline-flex items-center gap-1 text-xs" style={{ color: D.muted }}>{it.status === 'Accepted' ? <Check className="h-3.5 w-3.5 text-emerald" /> : <Clock className="h-3.5 w-3.5" />}{it.explanationOnly ? 'Explanation sent' : it.filename || 'Received'}</span>}
          </div>
        </td>
      </tr>
      {open && <tr style={{ background: D.page }}><td colSpan={wide ? 7 : 8} className="px-4 py-4 text-sm leading-relaxed" style={{ color: D.text }}><b>What is needed: </b>{it.text.replace(/^(Sample|Item) \d+: /, '')}{it.alert ? <p className="mt-2 text-alert-red">Rejected: {it.alert}</p> : null}{it.data?.kind === 'party' && !it.aap?.enabled && canUpload ? <CannotConfirm it={it} /> : null}{it.aap?.enabled ? <p className="mt-3 text-amber">The balance confirmation was not possible. The documents listed under this party are needed instead.</p> : null}<div className="mt-4"><RemarkThread slug={PORTAL_CLIENT.slug} item={it} by="Client" /></div></td></tr>}
    </>
  )
}

function Table({ items, wide }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead><tr className="text-xs font-semibold uppercase tracking-wide" style={{ color: D.subtle }}>
          {['No.', 'Date', 'Ledger / account', 'Description'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}{!wide && <th className="px-4 py-3">Reference</th>}<th className="px-4 py-3 text-right">Amount (SAR)</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
        <tbody>{items.map((it) => <ItemRow key={it.ref} it={it} wide={wide} />)}</tbody>
      </table>
    </div>
  )
}

// Samples and cut-off items, one block per area, with the sub-groups inside (above / below materiality, debits / credits, before / after the year end).
export default function SampleBoard({ categories, emptyText }) {
  if (!categories.length) return <div className="rounded-2xl border border-dashed p-12 text-center text-sm" style={{ borderColor: D.border, color: D.muted }}>{emptyText}</div>
  return (
    <div className="space-y-6">
      {categories.map((c) => {
        const done = c.items.filter((i) => DONE.includes(i.status)).length; const pct = Math.round((done / c.items.length) * 100)
        const ORDER = ['Debits', 'Credits', 'Before year end', 'After year end', 'Above materiality', 'Selected below materiality', 'Trade Receivable', 'Trade Payable']
        const subs = [...new Set(c.items.map((i) => i.subgroup || ''))].sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99))
        return (
          <section key={c.id} className="overflow-hidden rounded-2xl shadow-sm" style={{ background: D.card, border: `1px solid ${D.border}` }}>
            <div className="px-6 py-5" style={{ borderBottom: `1px solid ${D.border}` }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-bold" style={{ color: D.text }}>{c.title.replace(/^(Samples|Cut-off): /, '')}</h3>
                <div className="flex items-center gap-3"><span className="text-sm font-semibold" style={{ color: D.text }}>{done} of {c.items.length} uploaded</span><div className="h-2 w-32 overflow-hidden rounded-full" style={{ background: D.page }}><div className="h-full rounded-full bg-emerald" style={{ width: `${pct}%` }} /></div></div>
              </div>
              <p className="mt-2 text-sm" style={{ color: D.muted }}>{c.reason}</p>
            </div>
            {subs.map((s) => {
              const items = c.items.filter((i) => (i.subgroup || '') === s)
              return (
                <div key={s || 'all'}>
                  {s && <div className="flex items-center justify-between px-6 py-3 text-sm font-semibold" style={{ background: D.page, color: D.text, borderBottom: `1px solid ${D.border}` }}><span>{s}</span><span className="text-xs font-normal" style={{ color: D.muted }}>{items.filter((i) => DONE.includes(i.status)).length} of {items.length} uploaded</span></div>}
                  <Table items={items} wide={c.group === 'cutoff'} />
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
