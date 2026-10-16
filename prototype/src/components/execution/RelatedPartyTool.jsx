import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, ExternalLink } from 'lucide-react'
import { Card, Empty, Field, FieldGrid, PrimaryButton, Stat } from './ReviewParts'
import SendSamples from './SendSamples'
import { useIssuedLists } from '../../utils/requirementsStore'
import { clientRelatedTransactions, pickRelated, testedElsewhere, RELATED_PARTIES } from '../../utils/relatedParty'
import { materialityFromRevenue } from '../../utils/sampling'
import { useMateriality } from '../../utils/materialityStore'
import { sampleMateriality } from '../../utils/materiality'
import { fmtDate } from '../../utils/sampleItems'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'

const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Table({ rows, rec }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm">
      <thead><tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">{['Ref', 'Date', 'Party', 'Ledger', 'Description', 'Amount', 'Why it is here', 'Tested elsewhere'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
      <tbody>{rows.map((t, k) => { const seen = testedElsewhere(t, rec); return (
        <tr key={t.ref} className={`border-t border-slate-100 align-top ${k % 2 ? 'bg-slate-50' : ''}`}>
          <td className="px-4 py-3 text-xs font-semibold text-slate-500">{t.ref}</td><td className="px-4 py-3 text-navy">{fmtDate(t.date)}</td><td className="px-4 py-3 text-navy">{t.party}</td><td className="px-4 py-3 text-navy">{t.ledger}</td><td className="px-4 py-3 text-navy">{t.description}</td>
          <td className="px-4 py-3 text-right font-semibold tabular-nums text-navy">{money(t.amount)}</td>
          <td className="px-4 py-3 text-xs">{t.why && <span className={`font-semibold ${t.flagged ? 'text-alert-red' : 'text-slate-600'}`}>{t.why}</span>}{t.flags.map((f) => <span key={f.label} className="mt-1 flex items-center gap-1 text-amber"><Flag className="h-3 w-3" />{f.label}</span>)}</td>
          <td className="px-4 py-3 text-xs">{seen.length ? seen.map((s) => <Link key={s.itemRef} to={`/team/workspace/requirements?tab=${s.kind === 'cut-off' ? 'cutoff' : 'samples'}&item=${s.itemRef}`} className="mb-1 flex items-center gap-1 font-semibold text-navy hover:underline">Already tested in {s.area} ({s.itemRef}) <ExternalLink className="h-3 w-3" /></Link>) : <span className="text-slate-400">Not tested elsewhere</span>}</td>
        </tr>) })}</tbody></table></div>
  )
}

export default function RelatedPartyTool({ dc }) {
  const rec = useIssuedLists()[dc.slug]; const me = currentUser()
  const txs = useMemo(() => (dc.ready ? clientRelatedTransactions(dc.ledgers) : []), [dc.ready, dc.ledgers])
  const revenue = -dc.ledgers.filter((l) => l.group === 'revenue').reduce((n, l) => n + l.closing, 0)
  const [mat, setMat] = useState(''); const [nAbove, setNAbove] = useState(''); const [nBelow, setNBelow] = useState(''); const [res, setRes] = useState(null)
  const stored = useMateriality(dc.slug)
  const suggested = stored ? sampleMateriality(stored.materiality) : revenue > 0 ? materialityFromRevenue(revenue, 0.5).used : null
  const materiality = mat !== '' ? Number(mat) : suggested
  if (dc.auditor !== 'ABCPA') return <Empty>Related party transaction testing in this tool follows the ABCPA method. This file is audited under {dc.auditor}; record the work in your notes below.</Empty>
  const ok = materiality > 0 && nAbove !== '' && nBelow !== '' && Number(nAbove) >= 0 && Number(nBelow) >= 0
  const run = () => { const r = pickRelated(txs, { materiality, nAbove: Number(nAbove), nBelow: Number(nBelow) }); setRes(r); logEvent({ client: dc.slug, clientName: dc.client, category: 'work', title: 'Related party transactions picked', description: `${r.above.length} above and ${r.below.length} below materiality; ${r.counts.flagged} flagged in the listing`, extra: { auditArea: 'Related parties', performedBy: me.name }, user: me }) }
  const picked = res ? [...res.above.map((t) => ({ ...t, sub: 'Above materiality' })), ...res.below.map((t) => ({ ...t, sub: 'Selected below materiality' }))] : []
  const toSend = picked.filter((t) => !testedElsewhere(t, rec).length).map((t) => ({ key: `RP:${t.ref}`, nature: 'document', subgroup: t.sub, row: { ref: t.ref, date: t.date, ledger: t.ledger, description: `${t.party}: ${t.description}`, amount: t.amount }, text: `Related party transaction ${t.ref} with ${t.party} dated ${fmtDate(t.date)}, ${t.description}, SAR ${money(t.amount)}: upload the invoice or agreement, proof of payment or receipt, and a short explanation of the business reason` }))
  return (
    <div className="space-y-6">
      <Card title="Related party transactions" subtitle="From the client's related party listing (stands in for the client's declaration). Choose how many to test; unusual ones are picked first.">
        <p className="text-xs text-slate-500">Related parties on the file: {RELATED_PARTIES.map((p) => `${p.name} (${p.relation})`).join(', ')}.</p>
        <FieldGrid cols={3}>
          <Field label="Materiality" hint={stored ? `From the file summary: SR ${money(stored.materiality)}, 80% used` : suggested ? `Suggested ${money(suggested)}: 0.5% of revenue, 80% used. Set materiality in the file summary.` : 'Enter it'}><input aria-label="Materiality" type="number" value={mat} placeholder={suggested ? String(suggested) : ''} onChange={(e) => { setMat(e.target.value); setRes(null) }} className={INP + ' w-full'} /></Field>
          <Field label="How many above materiality"><input aria-label="Number above materiality" type="number" min="0" value={nAbove} onChange={(e) => { setNAbove(e.target.value); setRes(null) }} className={INP + ' w-full'} /></Field>
          <Field label="How many below materiality"><input aria-label="Number below materiality" type="number" min="0" value={nBelow} onChange={(e) => { setNBelow(e.target.value); setRes(null) }} className={INP + ' w-full'} /></Field>
        </FieldGrid>
        <div className="mt-3"><PrimaryButton disabled={!ok || !txs.length} onClick={run}>Pick the transactions</PrimaryButton></div>
      </Card>
      {res && (
        <Card title="Picked transactions" subtitle="Flagged by code from the listing: round amounts, just below materiality, duplicates, vague descriptions and the period end. They are indicators for you to look at; you decide.">
          <div className="grid gap-3 sm:grid-cols-4"><Stat label="Related party transactions" value={res.counts.population} /><Stat label="Above materiality" value={res.counts.above} /><Stat label="Below materiality" value={res.counts.below} /><Stat label="Flagged" value={res.counts.flagged} tone={res.counts.flagged ? 'amber' : 'green'} /></div>
          {[['Above materiality', res.above, nAbove], ['Selected below materiality', res.below, nBelow]].map(([t, rows, n]) => <div key={t}><p className="mb-2 text-sm font-semibold text-navy">{t} ({rows.length} of {n} asked{rows.length < Number(n) ? '; no more in this group' : ''})</p>{rows.length ? <Table rows={rows} rec={rec} /> : <p className="text-xs text-slate-400">None.</p>}</div>)}
          {res.otherFlagged.length > 0 && <div><p className="mb-2 text-sm font-semibold text-navy">Also flagged, not picked within your numbers ({res.otherFlagged.length})</p><Table rows={res.otherFlagged} rec={rec} /></div>}
          <p className="text-xs text-slate-500">{picked.length - toSend.length} picked transaction{picked.length - toSend.length === 1 ? ' is' : 's are'} already tested in another area and will not be asked from the client again.</p>
          <SendSamples area="Related parties" label="Related party transactions" items={toSend} client={dc.slug} group="samples" />
        </Card>
      )}
    </div>
  )
}
