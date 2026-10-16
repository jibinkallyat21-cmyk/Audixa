import { useMemo, useState } from 'react'
import { Eye, Check, X, FolderTree, Download, Send } from 'lucide-react'
import { Card, Chip, Empty, Stat, PrimaryButton, SecondaryButton } from './ReviewParts'
import RemarkThread from '../shared/RemarkThread'
import { useIssuedLists, setItemStatus, setAap, patchAap } from '../../utils/requirementsStore'
import { sampleArea } from '../../utils/requirementAreas'
import { traceSettlement, failureText, demoAapData, words } from '../../utils/aap'
import { buildAapWorkbook, buildAapZip, folderPlan } from '../../utils/aapExcel'
import { newQuery } from '../../utils/queriesCore'
import { useQueries } from '../../utils/queriesStore'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { useToast } from '../shared/Toast'

const RECEIVED = ['Uploaded Processing', 'Under Review', 'Accepted']
const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt = (d) => { const t = new Date(`${d}T00:00:00Z`); return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) }
const TONE = { green: 'bg-emerald/10 text-emerald', amber: 'bg-amber/10 text-amber', red: 'bg-alert-red/10 text-alert-red', grey: 'bg-slate-100 text-slate-500' }
const Pill = ({ tone, children }) => <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[tone]}`}>{children}</span>
const confStatus = (it) => (it.aap?.by === 'Client' ? { t: 'Client cannot confirm', tone: 'amber' } : it.status === 'Accepted' ? { t: 'Confirmation accepted', tone: 'green' } : RECEIVED.includes(it.status) ? { t: 'Confirmation to review', tone: 'amber' } : it.status === 'Rejected' ? { t: 'Confirmation rejected', tone: 'red' } : { t: 'Waiting for the confirmation', tone: 'grey' })

// The sampled customers or suppliers in one list. Each one is asked for the balance confirmation first. The alternative audit procedure is switched on when the client
// says it cannot confirm, or by the tick box here; its documents are then requested automatically, tested, and filed in the client folder.
export default function PartySamples({ dc, side }) {
  const me = currentUser(); const showToast = useToast(); const rec = useIssuedLists()[dc.slug]; const { queries, setQueries } = useQueries()
  const w = words(side); const area = side === 'receivables' ? 'Trade receivables' : 'Trade payables'
  const [open, setOpen] = useState(''); const [rejecting, setRejecting] = useState(''); const [reason, setReason] = useState(''); const [unticking, setUnticking] = useState(''); const [tree, setTree] = useState('')
  const samples = useMemo(() => (rec?.categories || []).filter((c) => c.group === 'samples').flatMap((c) => c.items.filter((i) => i.data?.kind === 'party' && sampleArea(c, i) === side)), [rec, side])
  const aapOf = (ref) => (rec?.categories || []).flatMap((c) => c.items).filter((i) => i.data?.parentRef === ref)
  const associate = dc.file?.associate || 'the associate'

  const decide = (it, status) => { setItemStatus(dc.slug, it.ref, status === 'Accepted' ? { status, alert: '' } : { status, alert: reason }); setRejecting(''); setReason(''); showToast(`${it.ref} ${status === 'Accepted' ? 'accepted' : 'rejected'}`) }
  const tick = (it, on) => { const party = it.data.party; const balance = it.row?.amount || 0; if (on) { const n = setAap(dc.slug, it.ref, true, { by: me.name, side, party, balance }); showToast(`${n} alternative procedure requirements were added for ${party}`) } else { const n = setAap(dc.slug, it.ref, false, { side, party, force: true }); setUnticking(''); showToast(`Alternative procedure off: ${n} requirements removed`) } }
  const notifyClient = (it, result, party, balance) => {
    const today = new Date().toISOString().slice(0, 10); const due = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
    const q = { ...newQuery({ queries, client: dc.slug, clientName: dc.client, area, description: failureText({ result, side, party, balance }), owner: me.name, dueDate: due, priority: 'High', raisedAt: today, raisedBy: me.name }), sampleKey: `AAPFAIL:${it.ref}` }
    setQueries([q, ...queries]); patchAap(dc.slug, it.ref, { result: 'Unable to verify', notifiedAt: new Date().toISOString() }); logEvent({ client: dc.slug, clientName: dc.client, category: 'query', title: `Alternative procedure: unable to verify ${party}`, description: 'The exact reason was sent to the client as a query', user: me }); showToast('The client has been told the exact reason')
  }
  const askBuild = (it, party) => { patchAap(dc.slug, it.ref, { result: 'Can be performed', buildAskedAt: new Date().toISOString() }); logEvent({ client: dc.slug, clientName: dc.client, category: 'work', title: `Build the alternative procedure workbook: ${party}`, description: `The alternative procedure can be performed. ${it.aap?.by && it.aap.by !== 'Client' ? it.aap.by : associate} to build the workbook.`, extra: { auditArea: area, assignedTo: it.aap?.by && it.aap.by !== 'Client' ? it.aap.by : associate, performedBy: me.name }, user: me }); showToast(`${associate} has been asked to build the workbook`) }
  const build = async (it, ctx) => {
    const wb = await buildAapWorkbook({ client: dc.client, side, party: ctx.party, balance: ctx.balance, data: ctx.data, result: ctx.result, plan: ctx.plan, preparedBy: me.name })
    const blob = await buildAapZip({ wb, plan: ctx.plan }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${ctx.party} - alternative audit procedure.zip`; a.click(); URL.revokeObjectURL(url)
    patchAap(dc.slug, it.ref, { result: 'Can be performed', workbookBuiltAt: new Date().toISOString() }); logEvent({ client: dc.slug, clientName: dc.client, category: 'work', title: `Alternative procedure workbook built: ${ctx.party}`, description: `Filed under ${ctx.plan.root}`, extra: { auditArea: area, performedBy: me.name }, user: me }); showToast('Workbook built and the client folder prepared')
  }

  if (!samples.length) return <Empty>No {w.party} balances have been sampled and sent yet. Pick them on the other tab; each one is then asked for its balance confirmation first.</Empty>
  const on = samples.filter((s) => s.aap?.enabled).length
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4"><Stat label={`${w.party[0].toUpperCase()}${w.party.slice(1)}s sampled`} value={samples.length} /><Stat label="Confirmed" value={samples.filter((s) => s.status === 'Accepted' && !s.aap?.enabled).length} tone="green" /><Stat label="Alternative procedure" value={on} tone={on ? 'amber' : 'navy'} /><Stat label="Unable to verify" value={samples.filter((s) => s.aap?.result === 'Unable to verify').length} tone={samples.some((s) => s.aap?.result === 'Unable to verify') ? 'red' : 'green'} /></div>
      {samples.map((it, idx) => {
        const party = it.data.party; const balance = it.row?.amount || 0; const cs = confStatus(it); const items = aapOf(it.ref); const isOpen = open === it.ref
        const got = (doc) => items.find((x) => x.data.doc === doc && RECEIVED.includes(x.status))
        const ready = !!(got('ledger') && got('settlements'))
        const data = it.aap?.enabled && ready ? demoAapData({ side, party, balance, index: idx * 2 + 1 }) : null
        const result = data ? traceSettlement({ ...data, side }) : null
        const orig = (doc) => items.find((x) => x.data.doc === doc)?.filename || ''
        const plan = data ? folderPlan({ client: dc.client, side, party, invoices: data.invoices.map((i) => ({ ...i, original: orig('invoices') })), settlements: data.settlements.map((s) => ({ ...s, original: orig('settlements') })), ledgerOriginal: orig('ledger') || 'ledger.xlsx' }) : null
        return (
          <Card key={it.ref} title={`${party}`} subtitle={`${it.ref} · balance ${money(balance)} · ${it.subgroup || ''}`} right={<><Pill tone={cs.tone}>{cs.t}</Pill>{it.aap?.result && <Pill tone={it.aap.result === 'Unable to verify' ? 'red' : 'green'}>{it.aap.result}</Pill>}</>}>
            <div className="flex flex-wrap items-center gap-3">
              {!it.aap?.enabled && ['Uploaded Processing', 'Under Review'].includes(it.status) && <><button onClick={() => decide(it, 'Accepted')} className="inline-flex items-center gap-1 rounded-lg bg-emerald px-3 py-2 text-xs font-semibold text-white"><Check className="h-3.5 w-3.5" />Accept the confirmation</button><button onClick={() => setRejecting(rejecting === it.ref ? '' : it.ref)} className="inline-flex items-center gap-1 rounded-lg border border-alert-red/40 px-3 py-2 text-xs font-semibold text-alert-red"><X className="h-3.5 w-3.5" />Reject</button></>}
              {unticking === it.ref ? <span className="flex items-center gap-2 text-xs"><span className="font-semibold text-alert-red">Turn off and remove all its requirements?</span><button onClick={() => tick(it, false)} className="rounded-lg bg-alert-red px-3 py-1.5 font-semibold text-white">Yes, turn off</button><button onClick={() => setUnticking('')} className="font-semibold text-slate-500">Keep</button></span>
                : <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy"><input type="checkbox" aria-label={`Enable alternative audit procedure for ${party}`} checked={!!it.aap?.enabled} onChange={(e) => (e.target.checked ? tick(it, true) : setUnticking(it.ref))} className="h-4 w-4 accent-navy" />Enable the alternative audit procedure</label>}
              <SecondaryButton onClick={() => setOpen(isOpen ? '' : it.ref)}>{isOpen ? 'Hide remarks' : 'Remarks'}{(it.remarks || []).length ? ` (${it.remarks.length})` : ''}</SecondaryButton>
            </div>
            {rejecting === it.ref && <div className="flex flex-wrap items-center gap-3"><input aria-label="Reason for rejecting" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is it being returned?" className="min-w-[240px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-navy" /><button disabled={!reason.trim()} onClick={() => decide(it, 'Rejected')} className="rounded-lg bg-alert-red px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Send back to the client</button></div>}
            {it.aap?.by === 'Client' && <p className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm text-navy">The client cannot obtain a confirmation: <b>{it.aap.reason}</b></p>}
            {isOpen && <RemarkThread slug={dc.slug} item={it} by="Audit team" />}

            {it.aap?.enabled && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-navy">Alternative audit procedure {it.aap.by === 'Client' ? '(client could not confirm)' : `(enabled by ${it.aap.by})`}</p>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">{items.map((x) => <div key={x.ref} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm"><span className="min-w-[200px] flex-1 text-navy">{x.row?.description?.split(': ')[1] || x.text}{x.filename ? <span className="block text-xs text-slate-400">uploaded as {x.filename}</span> : null}</span><Chip value={x.status === 'Uploaded Processing' ? 'Uploaded' : x.status} /></div>)}</div>
                {!ready && <p className="text-sm text-slate-500">The test runs once the ledger and the {w.inPl} after the year end are received.</p>}
                {result && (
                  <div className="space-y-4">
                    <div className={`rounded-xl border px-5 py-4 ${result.status === 'Can be performed' ? 'border-emerald/30 bg-emerald/5' : 'border-alert-red/30 bg-alert-red/5'}`}>
                      <p className={`text-base font-bold ${result.status === 'Can be performed' ? 'text-emerald' : 'text-alert-red'}`}>{result.status === 'Can be performed' ? 'The alternative procedure can be performed' : 'Unable to verify'}</p>
                      <p className="mt-1 text-sm text-slate-600">{result.invoices.length} open invoice{result.invoices.length === 1 ? '' : 's'} · {result.settlements.filter((d) => d.traced).length} of {result.settlements.length} {w.inPl} traced · {result.unsettled.length} invoice{result.unsettled.length === 1 ? '' : 's'} not settled</p>
                      {result.status !== 'Can be performed' && <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-navy">{failureText({ result, side, party, balance })}</pre>}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead><tr className="bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">{['Open invoice', 'Date', 'Amount', 'Settled by', 'Not settled'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
                      <tbody>{result.invoices.map((i) => <tr key={i.no} className="border-t border-slate-100 bg-white"><td className="px-4 py-3 font-medium text-navy">{i.no}</td><td className="px-4 py-3 text-navy">{fmt(i.date)}</td><td className="px-4 py-3 tabular-nums text-navy">{money(i.amount)}</td><td className="px-4 py-3 text-xs text-slate-600">{result.allocations.filter((a) => a.invoiceNo === i.no).map((a) => `${a.settlementId}: ${a.method}`).join('; ') || '—'}</td><td className={`px-4 py-3 font-semibold tabular-nums ${i.settled ? 'text-emerald' : 'text-alert-red'}`}>{i.settled ? 'None' : money(i.remaining)}</td></tr>)}</tbody></table></div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead><tr className="bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">{[w.in[0].toUpperCase() + w.in.slice(1), 'Date', 'Amount', 'Traced', 'How or why not'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
                      <tbody>{result.settlements.map((d) => <tr key={d.id} className="border-t border-slate-100 bg-white"><td className="px-4 py-3 font-medium text-navy">{d.ref || d.id}</td><td className="px-4 py-3 text-navy">{fmt(d.date)}</td><td className="px-4 py-3 tabular-nums text-navy">{money(d.amount)}</td><td className="px-4 py-3"><Chip value={d.traced ? 'Pass' : 'Fail'} /></td><td className="px-4 py-3 text-xs text-slate-600">{d.traced ? d.method : d.why}</td></tr>)}</tbody></table></div>
                    <div className="flex flex-wrap items-center gap-3">
                      {result.status === 'Unable to verify' && (it.aap.notifiedAt ? <span className="text-sm font-semibold text-emerald">The client was told the exact reason</span> : <PrimaryButton onClick={() => notifyClient(it, result, party, balance)}><Send className="h-4 w-4" />Tell the client the exact reason</PrimaryButton>)}
                      {result.status === 'Can be performed' && <>{!it.aap.buildAskedAt && <SecondaryButton onClick={() => askBuild(it, party)}>Ask {associate} to build the workbook</SecondaryButton>}<PrimaryButton onClick={() => build(it, { party, balance, data, result, plan })}><Download className="h-4 w-4" />Build the workbook and the client folder</PrimaryButton></>}
                      <SecondaryButton onClick={() => setTree(tree === it.ref ? '' : it.ref)}><FolderTree className="h-4 w-4" />{tree === it.ref ? 'Hide the client folder' : 'Show the client folder'}</SecondaryButton>
                    </div>
                    {tree === it.ref && <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600"><p className="mb-2 font-semibold text-navy">{plan.root}</p><ul className="space-y-1">{plan.files.map((f) => <li key={f.path}><Eye className="mr-1.5 inline h-3 w-3 text-slate-400" />{f.path.replace(`${plan.root}/`, '')}{f.original ? <span className="text-slate-400">  ← {f.original}</span> : null}</li>)}</ul></div>}
                  </div>)}
              </div>)}
          </Card>)
      })}
    </div>
  )
}
