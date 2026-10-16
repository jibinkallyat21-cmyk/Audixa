import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Card, Chip, SecondaryButton } from './ReviewParts'
import { useIssuedLists, removeSampleItems } from '../../utils/requirementsStore'
import { sentCategoryId } from '../../utils/sampleRequests'
import { fmtDate } from '../../utils/sampleItems'
import { useToast } from '../shared/Toast'

const money = (n) => (n === undefined || n === null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
const RECEIVED = ['Uploaded Processing', 'Under Review', 'Accepted']

// What has already been sent to the client for this area, shown whenever the tool is opened, with a way to delete items. More are added by picking again below:
// items already sent are never sent twice.
export default function SentItems({ slug, area, sub = '', group = 'samples' }) {
  const rec = useIssuedLists()[slug]; const showToast = useToast(); const [confirm, setConfirm] = useState('')
  const cat = rec?.categories.find((c) => c.id === sentCategoryId(group, area, sub))
  if (!cat) return null
  const done = cat.items.filter((i) => RECEIVED.includes(i.status)).length
  const remove = (refs) => { const n = removeSampleItems(slug, cat.id, refs); setConfirm(''); showToast(`${n} item${n === 1 ? '' : 's'} removed`) }
  const subs = [...new Set(cat.items.map((i) => i.subgroup || ''))]
  return (
    <Card title={`Already sent to the client (${cat.items.length})`} subtitle={`${done} uploaded · ${cat.items.length - done} waiting. This stays here each time you open the tool. To add more, pick again below; what was already sent is not sent twice.`}
      right={confirm === 'all' ? <span className="flex items-center gap-2"><span className="text-xs font-semibold text-alert-red">Delete all {cat.items.length}?</span><button onClick={() => remove(cat.items.map((i) => i.ref))} className="rounded-lg bg-alert-red px-3 py-1.5 text-xs font-semibold text-white">Yes, delete</button><button onClick={() => setConfirm('')} className="text-xs font-semibold text-slate-500">Keep</button></span> : <SecondaryButton onClick={() => setConfirm('all')}><Trash2 className="h-4 w-4" />Delete all</SecondaryButton>}>
      {subs.map((sg) => (
        <div key={sg || 'all'}>
          {sg && <p className="mb-2 text-sm font-semibold text-navy">{sg}</p>}
          <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">{['No.', 'Date', 'Description', 'Amount (SAR)', 'Status', ''].map((h, i) => <th key={i} className={`px-4 py-3 ${i === 3 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
            <tbody>{cat.items.filter((i) => (i.subgroup || '') === sg).map((i, k) => (
              <tr key={i.ref} className={`border-t border-slate-100 ${k % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                <td className="px-4 py-3 text-xs font-semibold text-slate-500">{i.ref}</td><td className="px-4 py-3 text-navy">{i.row?.date ? fmtDate(`${i.row.date}T00:00:00Z`) : '—'}</td>
                <td className="px-4 py-3 text-navy">{i.row?.description || i.text}{i.row?.ref ? <span className="block text-xs text-slate-400">Ref. {i.row.ref}</span> : null}</td>
                <td className="px-4 py-3 text-right tabular-nums text-navy">{money(i.row?.amount)}</td><td className="px-4 py-3"><Chip value={i.status === 'Uploaded Processing' ? 'Uploaded' : i.status} /></td>
                <td className="px-4 py-3 text-right">{confirm === i.ref ? <span className="flex items-center justify-end gap-2 text-xs"><button onClick={() => remove([i.ref])} className="rounded-lg bg-alert-red px-2.5 py-1 font-semibold text-white">{RECEIVED.includes(i.status) ? 'Delete (already uploaded)' : 'Delete'}</button><button onClick={() => setConfirm('')} className="font-semibold text-slate-500">Keep</button></span> : <button aria-label={`Delete ${i.ref}`} onClick={() => setConfirm(i.ref)} className="text-slate-400 hover:text-alert-red"><Trash2 className="h-4 w-4" /></button>}</td>
              </tr>))}</tbody></table></div>
        </div>))}
    </Card>
  )
}
