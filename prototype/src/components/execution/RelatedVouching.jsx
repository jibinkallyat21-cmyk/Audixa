import { useMemo, useState } from 'react'
import { Card, Empty, Stat } from './ReviewParts'
import EvidenceDocs from './EvidenceDocs'
import SentItems from './SentItems'
import { useIssuedLists } from '../../utils/requirementsStore'
import { checkEvidence, demoDocs } from '../../utils/evidence'
import { fmtDate } from '../../utils/sampleItems'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'

const RECEIVED = ['Uploaded Processing', 'Under Review', 'Accepted']
const PARTS = [{ part: 'agreement', need: 'If applicable', label: 'Related party agreement' }, { part: 'invoice', need: 'Required', label: 'Invoice or contract' }, { part: 'payment', need: 'Required', label: 'Payment or receipt proof' }]
const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Vouching of the related party transactions that were picked and sent to the client: what the client sent for each one, checked against the transaction.
export default function RelatedVouching({ dc }) {
  const me = currentUser(); const rec = useIssuedLists()[dc.slug]; const [decisions, setDecisions] = useState({})
  const items = useMemo(() => (rec?.categories || []).filter((c) => c.group === 'samples' && c.area === 'Related parties').flatMap((c) => c.items), [rec])
  const lines = useMemo(() => items.map((i) => ({ amount: Math.abs(Number(i.row?.amount) || 0), vatPct: 0, date: i.row?.date || '', vendor: String(i.row?.description || '').split(':')[0], payMode: 'upto' })), [items])
  const got = items.map((i) => RECEIVED.includes(i.status)); const gotKey = got.join(',')
  const docs = useMemo(() => { const sent = demoDocs(lines.filter((_, k) => got[k]), dc.client, () => PARTS); let n = -1; return lines.map((_, k) => (got[k] ? sent[++n] : [])) }, [lines, gotKey, dc.client]) // eslint-disable-line react-hooks/exhaustive-deps
  const results = items.map((_, k) => checkEvidence(lines[k], docs[k], dc.client, PARTS))
  return (
    <div className="space-y-6">
      <SentItems slug={dc.slug} area="Related parties" group="samples" />
      {!items.length ? <Empty>No related party transactions have been sent to the client yet. Pick and send them under Sampling of transactions.</Empty> : (
        <Card title="Vouching of the related party transactions" subtitle="For each transaction the client was asked for: the agreement or invoice, and the payment or receipt proof. The figures are matched to the transaction; a person accepts it or raises it with the client.">
          <div className="grid gap-3 sm:grid-cols-4"><Stat label="Transactions sent" value={items.length} /><Stat label="Received" value={got.filter(Boolean).length} /><Stat label="Supported" value={results.filter((r) => /^Supported/.test(r.status)).length} tone="green" /><Stat label="Mismatch" value={results.filter((r) => r.status === 'Mismatch').length} tone={results.some((r) => r.status === 'Mismatch') ? 'red' : 'green'} /></div>
          <div className="space-y-5">{items.map((it, k) => (
            <div key={it.ref} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-navy">{it.ref} · {it.row?.description}</p><p className="text-sm text-slate-600">{it.row?.date ? fmtDate(`${it.row.date}T00:00:00Z`) : ''} · <b className="tabular-nums text-navy">{money(it.row?.amount || 0)}</b></p></div>
              <EvidenceDocs area="Related parties" subject={it.row?.ref || it.ref} parts={PARTS} docs={docs[k]} result={results[k]} decision={decisions[it.ref]} onDecide={(d) => { setDecisions((x) => ({ ...x, [it.ref]: d })); logEvent({ client: dc.slug, clientName: dc.client, category: 'work', title: `Related party transaction evidence ${d === 'Accepted' ? 'accepted' : 'raised with the client'}`, description: it.ref, extra: { auditArea: 'Related parties', performedBy: me.name }, user: me }) }} />
            </div>))}</div>
        </Card>)}
    </div>
  )
}
