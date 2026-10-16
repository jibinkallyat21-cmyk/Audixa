import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Field, FieldGrid, Section, Toggle, Flags, Stat, Empty, PrimaryButton, SecondaryButton, INPUT } from './ReviewParts'
import CutOffTool from './CutOffTool'
import { useIssuedLists, setItemStatus, requestBankDocuments, requestReconciliation } from '../../utils/requirementsStore'
import { bankAccountsFrom, bankDocs, docStatus, received, accountStatus } from '../../utils/bankAccounts'
import { clientBankStatement } from '../../utils/clientSamplingData'
import { clientBankTxns } from '../../utils/clientCutoffData'
import { CONF_TESTS, confirmationTests, confirmationOverall, bankStatementRecon } from '../../utils/vouching'
import { standardName } from '../../utils/evidence'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'

const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
const TONE = { green: 'bg-emerald/10 text-emerald', amber: 'bg-amber/10 text-amber', red: 'bg-alert-red/10 text-alert-red', grey: 'bg-slate-100 text-slate-500' }
const DOC_LABEL = { conf: 'Confirmation', cy: 'Statement: current period', sub: 'Statement: subsequent period', recon: 'Bank reconciliation' }
const FILE_LABEL = { conf: 'Confirmation', cy: 'Bank statement (current period)', sub: 'Bank statement (subsequent period)', recon: 'Bank reconciliation' }
const Pill = ({ s }) => <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[s.tone]}`}>{s.text}</span>
const overallTone = (t) => (t === 'Agreed' || t === 'Reconciled' ? 'green' : /needed|needs|rejected/i.test(t) ? 'red' : /review|Waiting/i.test(t) ? 'amber' : 'grey')

// Every cash and bank account on one page: what the client has sent for it (confirmation, statement for the year, statement for the subsequent period),
// the trial balance against the statement, a reconciliation only where they differ, and the cut-off for that account.
export default function CashBankTool({ dc, mode = 'accounts' }) {
  const showToast = useToast(); const me = currentUser(); const rec = useIssuedLists()[dc.slug]
  const accounts = useMemo(() => bankAccountsFrom(dc.ledgers), [dc.ledgers]); const txns = useMemo(() => clientBankTxns(dc.ledgers).byCode, [dc.ledgers])
  const [yearEnd, setYearEnd] = useState('2025-12-31'); const [open, setOpen] = useState(accounts.length === 1 ? accounts[0].code : null); const [tabs, setTabs] = useState({}); const [view, setView] = useState({}); const [edit, setEdit] = useState({}); const [rejecting, setRejecting] = useState(''); const [reason, setReason] = useState('')
  const patch = (code, p) => setEdit((e) => ({ ...e, [code]: { ...e[code], ...p } }))
  const requested = (rec?.categories || []).some((c) => c.id === 'BANKACC')

  const rows = accounts.map((a, idx) => {
    const e = edit[a.code] || {}; const docs = bankDocs(rec, a.code)
    const stmt = a.type === 'Bank' && received(docs.cy) ? clientBankStatement(a.ledger) : null
    const closing = stmt ? (e.closing !== undefined && e.closing !== '' ? Number(e.closing) : stmt.closing) : null
    const diff = stmt ? r2(closing - a.tb) : null
    const conf = { type: a.type, available: received(docs.conf), amount: e.amount ?? a.tb, asAt: e.asAt ?? yearEnd, clientName: e.clientName ?? dc.client, bankName: e.bankName ?? a.name, tbBank: a.name, sealPresent: e.sealPresent ?? true, signaturePresent: e.signaturePresent ?? true, letterhead: e.letterhead ?? true, eGenerated: !!e.eGenerated, digitalMark: !!e.digitalMark, sigIllegible: !!e.sigIllegible, clientProvided: e.clientProvided ?? true }
    const t = conf.available ? confirmationTests({ ...conf, amount: Number(conf.amount) }, { tbAmount: a.tb, yearEnd, legalName: dc.client, tbBank: a.name }) : null
    const overall = t ? confirmationOverall(t.tests, { available: true, c: conf }) : null
    const status = accountStatus({ docs, diff, confOverall: overall, reconOk: !!e.reconOk })
    const cut = (rec?.categories || []).filter((c) => c.group === 'cutoff').flatMap((c) => c.items).filter((i) => i.row?.ledger === a.name)
    return { ...a, idx, e, docs, stmt, closing, diff, conf, t, overall, status, cut }
  })
  const request = () => { const n = requestBankDocuments(dc.slug, accounts, yearEnd); showToast(n < 0 ? 'The requirement list has not been issued yet. Approve the trial balance first.' : n ? `${n} documents requested from the client, account by account` : 'These documents were already requested.'); if (n > 0) logEvent({ client: dc.slug, clientName: dc.client, category: 'doc-request', title: 'Bank documents requested', description: `${n} documents for ${accounts.length} accounts`, user: me }) }
  const decide = (it, status) => { setItemStatus(dc.slug, it.ref, status === 'Accepted' ? { status, alert: '' } : { status, alert: reason }); setRejecting(''); setReason(''); showToast(`${it.ref} ${status === 'Accepted' ? 'accepted' : 'rejected'}`) }

  if (!accounts.length) return <Empty>This trial balance has no cash or bank balance.</Empty>
  if (mode === 'cutoff') return (
    <div className="space-y-6">
      <p className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">The cut-off is done for each cash and bank account on its own. For each account, enter how many items you want ({dc.auditor === 'ABCPA' ? 'debits and credits from the subsequent statement' : 'the same number before and after the year end'}), pick them, then approve to send them to the client. Each account gets its own block on the client's list.</p>
      {rows.map((r) => <CutOffTool key={r.code} area={r.type === 'Cash' ? 'cash' : 'bank'} client={dc.slug} firm={dc.auditor} txnsOverride={txns[r.code] || null} sub={`${r.type} ${r.code}`} label={`${r.type}: ${r.name}`} />)}
    </div>
  )
  const agreed = rows.filter((r) => r.status === 'Agreed' || r.status === 'Reconciled').length
  return (
    <div className="space-y-6">
      <Card title="Cash and bank accounts" subtitle="Every account in one list: its documents, the trial balance against the statement, and its cut-off. Open an account to work on it."
        right={requested ? <span className="rounded-full bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald">Documents requested</span> : <PrimaryButton onClick={request}>Ask the client for the documents</PrimaryButton>}>
        <div className="grid gap-3 sm:grid-cols-4"><Stat label="Accounts" value={accounts.length} /><Stat label="Agreed" value={agreed} tone="green" /><Stat label="Need attention" value={rows.filter((r) => r.diff !== null && r.diff !== 0).length} tone={rows.some((r) => r.diff) ? 'red' : 'green'} /><Stat label="Year-end" value={yearEnd.split('-').reverse().join('-')} /></div>
        <div className="max-w-xs"><Field label="Year-end"><input aria-label="Year-end" type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className={INPUT} /></Field></div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">{['Account', 'Trial balance', 'Confirmation', 'Statement: current period', 'Statement: subsequent period', 'Statement closing', 'Difference', 'Cut-off', 'Status', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, k) => {
              const cell = (doc) => { const it = r.docs[doc]; if (doc !== 'conf' && r.type === 'Cash') return <span className="text-xs text-slate-400">Not needed</span>; return <div className="space-y-1"><Pill s={docStatus(it)} />{it && received(it) && <button onClick={() => { setOpen(r.code); setTabs((t) => ({ ...t, [r.code]: 'docs' })); setView((v) => ({ ...v, [r.code]: doc })) }} className="flex items-center gap-1 text-xs font-semibold text-navy hover:underline"><Eye className="h-3 w-3" />View</button>}</div> }
              const cutDone = r.cut.filter((i) => received(i)).length
              return (
                <tr key={r.code} className={`border-t border-slate-100 align-top ${k % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className="px-4 py-3"><p className="font-semibold text-navy">{r.name}</p><p className="text-xs text-slate-400">{r.type} · {r.code}</p></td>
                  <td className="px-4 py-3 tabular-nums text-navy">{money(r.tb)}</td>
                  <td className="px-4 py-3">{cell('conf')}</td><td className="px-4 py-3">{cell('cy')}</td><td className="px-4 py-3">{cell('sub')}</td>
                  <td className="px-4 py-3 tabular-nums text-navy">{r.closing === null ? '—' : money(r.closing)}</td>
                  <td className={`px-4 py-3 font-semibold tabular-nums ${r.diff === null ? 'text-slate-400' : r.diff === 0 ? 'text-emerald' : 'text-alert-red'}`}>{r.diff === null ? '—' : r.diff === 0 ? 'None' : money(r.diff)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.cut.length ? `${cutDone} of ${r.cut.length} uploaded` : 'Not started'}<Link to="?area=cash&proc=cash-cutoff" className="mt-1 block font-semibold text-navy hover:underline">Do the cut-off</Link></td>
                  <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[overallTone(r.status)]}`}>{r.status}</span></td>
                  <td className="px-4 py-3"><button aria-label={`Open ${r.name}`} onClick={() => setOpen(open === r.code ? null : r.code)} className="text-slate-400 hover:text-navy">{open === r.code ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</button></td>
                </tr>) })}</tbody>
          </table>
        </div>
        {!requested && <p className="text-xs text-slate-500">The client has not been asked for these documents yet. Press the button to ask for them account by account; a bank reconciliation is asked for only where a statement differs from the books.</p>}
      </Card>

      {rows.filter((r) => open === r.code).map((r) => {
        const kinds = r.type === 'Cash' ? ['conf'] : ['conf', 'cy', 'sub', ...(r.diff ? ['recon'] : [])]
        const tab = tabs[r.code] || 'docs'; const tabList = [['docs', 'Documents'], ['conf', 'Confirmation checks'], ...(r.type === 'Bank' ? [['bal', 'Balances']] : []), ...(r.diff ? [['recon', 'Reconciliation']] : [])]
        const cur = view[r.code]; const vit = cur && r.docs[cur]
        return (
          <Card key={r.code} title={r.name} subtitle={`${r.type} account ${r.code} · trial balance ${money(r.tb)}`}>
            <div className="flex flex-wrap gap-2" role="tablist">{tabList.map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTabs((t) => ({ ...t, [r.code]: id }))} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${tab === id ? 'bg-navy text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{l}</button>)}</div>

            {tab === 'docs' && (
              <div className="space-y-3">
                {kinds.map((k) => { const it = r.docs[k]; const st = docStatus(it); return (
                  <div key={k} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-[220px] flex-1"><p className="text-sm font-semibold text-navy">{DOC_LABEL[k]}</p>{it && received(it) ? <p className="text-xs text-slate-500">{standardName('Cash and bank', r.name, k, it.filename || 'file.pdf', FILE_LABEL[k])} <span className="text-slate-400">· uploaded as {it.filename || 'file.pdf'}</span></p> : <p className="text-xs text-slate-400">{it ? 'The client has not uploaded it yet' : 'Not requested yet'}</p>}</div>
                      <Pill s={st} />
                      {it && received(it) && <SecondaryButton onClick={() => setView((v) => ({ ...v, [r.code]: cur === k ? '' : k }))}><Eye className="h-4 w-4" />{cur === k ? 'Hide' : 'View'}</SecondaryButton>}
                      {it && ['Uploaded Processing', 'Under Review'].includes(it.status) && <><button onClick={() => decide(it, 'Accepted')} className="inline-flex items-center gap-1 rounded-lg bg-emerald px-3 py-2 text-xs font-semibold text-white"><Check className="h-3.5 w-3.5" />Accept</button><button onClick={() => setRejecting(rejecting === it.ref ? '' : it.ref)} className="inline-flex items-center gap-1 rounded-lg border border-alert-red/40 px-3 py-2 text-xs font-semibold text-alert-red"><X className="h-3.5 w-3.5" />Reject</button></>}
                    </div>
                    {rejecting === it?.ref && <div className="mt-3 flex flex-wrap items-center gap-3"><input aria-label="Reason for rejecting" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is it being returned?" className="min-w-[240px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-navy" /><button disabled={!reason.trim()} onClick={() => decide(it, 'Rejected')} className="rounded-lg bg-alert-red px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Send back to the client</button></div>}
                    {cur === k && vit && received(vit) && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-navy">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">What the document shows</p>
                        {k === 'conf' && <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">{[['Client', r.conf.clientName], [r.type === 'Bank' ? 'Bank' : 'Custodian', r.conf.bankName], ['As at', r.conf.asAt], ['Confirmed balance', money(r.conf.amount)]].map(([a, b]) => <div key={a} className="flex justify-between gap-3"><dt className="text-slate-500">{a}</dt><dd className="font-medium">{b}</dd></div>)}</dl>}
                        {k === 'cy' && r.stmt && <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">{[['Opening balance', r.stmt.opening], ['Money in', r.stmt.credits], ['Money out', r.stmt.debits], ['Closing balance', r.closing]].map(([a, b]) => <div key={a} className="flex justify-between gap-3"><dt className="text-slate-500">{a}</dt><dd className="font-medium tabular-nums">{money(b)}</dd></div>)}</dl>}
                        {k === 'sub' && <p>One month after the year end. {(txns[r.code] || []).filter((t) => t.date > yearEnd).length} transactions after the year end are available for the cut-off test.</p>}
                        {k === 'recon' && <p>The client's reconciliation of the {money(Math.abs(r.diff))} difference. Check that every reconciling item is explained, then mark it on the Reconciliation tab.</p>}
                        <p className="mt-2 text-xs text-slate-400">Demo placeholder: the prototype shows the figures a reader would take from the uploaded file.</p>
                      </div>)}
                  </div>) })}
              </div>
            )}

            {tab === 'conf' && (
              !r.conf.available ? <Empty>The confirmation has not been uploaded yet.</Empty> : (
                <div className="space-y-5">
                  <FieldGrid>
                    <Field label="Amount confirmed"><input aria-label="Confirmed amount" type="number" value={r.conf.amount} onChange={(e) => patch(r.code, { amount: e.target.value })} className={INPUT} /></Field>
                    <Field label="As at date"><input aria-label="As at date" type="date" value={r.conf.asAt} onChange={(e) => patch(r.code, { asAt: e.target.value })} className={INPUT} /></Field>
                    <Field label="Client name on the confirmation"><input aria-label="Client name on the confirmation" value={r.conf.clientName} onChange={(e) => patch(r.code, { clientName: e.target.value })} className={INPUT} /></Field>
                    {r.type === 'Bank' && <Field label="Bank on the confirmation"><input aria-label="Bank on the confirmation" value={r.conf.bankName} onChange={(e) => patch(r.code, { bankName: e.target.value })} className={INPUT} /></Field>}
                  </FieldGrid>
                  <Section title="Check the document" hint="Tick what you can see on the letter.">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Toggle label={r.type === 'Cash' ? 'Company seal present' : 'Bank stamp present'} checked={r.conf.sealPresent} onChange={(v) => patch(r.code, { sealPresent: v })} />
                      <Toggle label="Authorised signature present" checked={r.conf.signaturePresent} onChange={(v) => patch(r.code, { signaturePresent: v })} />
                      <Toggle label={r.type === 'Cash' ? 'On client letterhead' : 'On bank letterhead / official form'} checked={r.conf.letterhead} onChange={(v) => patch(r.code, { letterhead: v })} />
                      {r.type === 'Bank' && <Toggle label="e-generated, no signature required" checked={r.conf.eGenerated} onChange={(v) => patch(r.code, { eGenerated: v })} />}
                      {r.type === 'Bank' && <Toggle label="Digital verification mark" checked={r.conf.digitalMark} onChange={(v) => patch(r.code, { digitalMark: v })} />}
                      <Toggle label="Signature / seal illegible or covered" tone="red" checked={r.conf.sigIllegible} onChange={(v) => patch(r.code, { sigIllegible: v })} />
                      <Toggle label="Provided by the client (not direct from the bank)" tone="red" checked={r.conf.clientProvided} onChange={(v) => patch(r.code, { clientProvided: v })} />
                    </div>
                  </Section>
                  <Section title="Result"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{CONF_TESTS.map((t) => <div key={t} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{t}<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[r.t.tests[t] === 'Yes' ? 'green' : r.t.tests[t] === 'No' ? 'red' : 'grey']}`}>{r.t.tests[t] === 'Not Applicable' ? 'Not needed' : r.t.tests[t]}</span></div>)}</div>
                    <p className="mt-3 text-sm font-semibold text-navy">{r.overall}</p>
                    {Object.keys(r.t.reasons).length > 0 && <div className="mt-3"><Flags flags={Object.entries(r.t.reasons).map(([k, v]) => `${k}: ${v}`)} /></div>}
                    {r.conf.clientProvided && <p className="mt-3 text-xs text-slate-500">Client-provided confirmation: weaker evidence than one obtained directly from the bank.</p>}
                  </Section>
                </div>)
            )}

            {tab === 'bal' && (
              !r.stmt ? <Empty>The statement for the current period has not been uploaded yet. The figures appear here once it is.</Empty> : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-4"><Stat label="Opening balance" value={money(r.stmt.opening)} /><Stat label="Money in" value={money(r.stmt.credits)} /><Stat label="Money out" value={money(r.stmt.debits)} /><Stat label="Trial balance" value={money(r.tb)} /></div>
                  <div className="max-w-sm"><Field label="Closing balance per the statement" hint="Taken from the statement; change it only if the reader got it wrong"><input aria-label="Closing balance per the statement" type="number" value={r.e.closing ?? r.stmt.closing} onChange={(e) => patch(r.code, { closing: e.target.value })} className={INPUT} /></Field></div>
                  <p className={`rounded-xl border px-4 py-3 text-sm ${r.diff === 0 ? 'border-emerald/30 bg-emerald/5 text-emerald' : 'border-alert-red/30 bg-alert-red/5 text-alert-red'}`}>Statement closing {money(r.closing)} against trial balance {money(r.tb)}: {r.diff === 0 ? 'no difference.' : `difference ${money(r.diff)}. A bank reconciliation is needed.`}</p>
                  {(() => { const c = bankStatementRecon({ ...r.stmt, closing: r.closing }); return <p className="text-xs text-slate-500">Opening + money in − money out = {money(c.calculated)}; {c.ok ? 'agrees to the closing balance.' : `differs from the closing balance by ${money(c.diff)}.`}</p> })()}
                </div>)
            )}

            {tab === 'recon' && r.diff !== null && r.diff !== 0 && (
              <div className="space-y-4">
                <p className="rounded-xl border border-alert-red/30 bg-alert-red/5 px-4 py-3 text-sm text-alert-red">The statement closing balance differs from the trial balance by {money(r.diff)}. The client explains it with a bank reconciliation.</p>
                {!r.docs.recon ? <PrimaryButton onClick={() => { const n = requestReconciliation(dc.slug, r, r.idx, r.diff, yearEnd); showToast(n > 0 ? 'The bank reconciliation was requested from the client' : n < 0 ? 'The requirement list has not been issued yet.' : 'Already requested.') }}>Ask the client for the bank reconciliation</PrimaryButton>
                  : <p className="text-sm text-navy">Bank reconciliation: <Pill s={docStatus(r.docs.recon)} /> <span className="text-xs text-slate-500">Open it on the Documents tab.</span></p>}
                <Toggle label="Every reconciling item is explained and adds up to the difference" checked={!!r.e.reconOk} onChange={(v) => patch(r.code, { reconOk: v })} />
              </div>
            )}

          </Card>
        )
      })}
    </div>
  )
}
