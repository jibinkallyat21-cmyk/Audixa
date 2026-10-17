import { useState } from 'react'
import AutoDemo from './AutoDemo'
import { Plus, Trash2 } from 'lucide-react'
import { Card, Field, FieldGrid, Chip } from './ReviewParts'
import EvidenceDocs from './EvidenceDocs'
import { useDemoClient, demoLabel } from '../../utils/useDemoClient'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { clientAccruals, accrualTie } from '../../utils/accruals'
import { accrualParts, checkEvidence, demoDocs } from '../../utils/evidence'

const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const blank = () => ({ id: Math.random().toString(36).slice(2), description: '', vendor: '', amount: '', vatPct: 15, start: '', end: '', docs: [] })

export default function AccrualsTab({ client, clientName }) {
  const showToast = useToast(); const me = currentUser(); const dc = useDemoClient()
  const company = dc.ready ? dc.client : clientName
  const [lines, setLines] = useState([]); const patch = (id, p) => setLines((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const load = () => { const l = clientAccruals(dc.ledgers); const docs = demoDocs(l, company, accrualParts); setLines(l.map((x, i) => ({ ...blank(), ...x, docs: docs[i] }))); if (!l.length) showToast('This trial balance has no accrual balance.') }
  const tie = dc.ready && lines.length ? accrualTie(lines, dc.ledgers) : null
  return (
    <div className="space-y-4">
      <Card title="Accrued expenses" subtitle="Each accrual is backed by the invoice or contract and the payment made after the year end." right={<div className="flex gap-3"><button onClick={load} className="text-xs font-semibold text-slate-500 underline">{demoLabel(dc)}</button><button onClick={() => setLines((l) => [...l, blank()])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><Plus className="h-3 w-3" />Add accrual</button></div>}>
        <AutoDemo run={load} />
        {tie && <p className="mb-3 text-sm text-navy">Accruals listed <b>{money(tie.sum)}</b> · Trial balance <b>{money(tie.tb)}</b> · Difference <b>{money(tie.difference)}</b> <Chip value={tie.difference === 0 ? 'Pass' : 'Fail'} /></p>}
        {lines.length === 0 && <p className="text-xs text-slate-400">No accruals yet. Add each cost owed at the year end, or load the client's data.</p>}
        <div className="space-y-5">{lines.map((x) => (
          <div key={x.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-navy">{x.description || 'New accrual'}</p><button aria-label="Remove accrual" onClick={() => setLines((l) => l.filter((y) => y.id !== x.id))} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-alert-red"><Trash2 className="h-4 w-4" />Remove</button></div>
            <FieldGrid cols={4}>
              <Field label="Description"><input aria-label="Description" value={x.description} onChange={(e) => patch(x.id, { description: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Supplier"><input aria-label="Supplier" value={x.vendor} onChange={(e) => patch(x.id, { vendor: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Amount (excluding VAT)"><input aria-label="Amount" type="number" value={x.amount} onChange={(e) => patch(x.id, { amount: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="VAT %"><input aria-label="VAT percent" type="number" value={x.vatPct} onChange={(e) => patch(x.id, { vatPct: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Service from"><input aria-label="Service from" type="date" value={x.start} onChange={(e) => patch(x.id, { start: e.target.value })} className={INP + ' w-full'} /></Field>
              <Field label="Service to"><input aria-label="Service to" type="date" value={x.end} onChange={(e) => patch(x.id, { end: e.target.value })} className={INP + ' w-full'} /></Field>
            </FieldGrid>
            <EvidenceDocs area="Accruals" subject={x.description || 'Accrual'} parts={accrualParts()} docs={x.docs} result={checkEvidence({ amount: Number(x.amount) || 0, vatPct: x.vatPct, start: x.start, end: x.end, vendor: x.vendor }, x.docs, company, accrualParts())} decision={x.decision} onDecide={(d) => { patch(x.id, { decision: d }); logEvent({ client, clientName, category: 'work', title: `Accrual evidence ${d === 'Accepted' ? 'accepted' : 'raised with the client'}`, description: x.description, extra: { auditArea: 'Accruals', performedBy: me.name }, user: me }) }} />
          </div>))}</div>
      </Card>
    </div>
  )
}
