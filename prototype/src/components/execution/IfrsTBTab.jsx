import { useMemo, useState } from 'react'
import { DEMO_DATA } from '../../utils/features'
import AutoDemo from './AutoDemo'
import { useDemoClient, demoLabel } from '../../utils/useDemoClient'
import { clientBis } from '../../utils/clientFsData'
import { Download, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { Card, Chip, DataTable, Flags, Field, FieldGrid, Section, Toggle, Stat, Empty, PrimaryButton, SecondaryButton } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob } from '../../utils/eosbExcel'
import { readTBWorkbook } from '../../utils/tbExcel'
import { toLedgers } from '../../utils/tbCore'
import { IFRS, buildIfrsTB, statements, cogsSchedule, vatReconciliation, verification, salesVsVat, pendingList, proposeBalancing } from '../../utils/ifrs'
import { buildIfrsWorkbook } from '../../utils/ifrsExcel'
import { buildSchedules, scheduleOwner } from '../../utils/fsSchedules'
import { useAuditLog } from '../../utils/auditLog'
import { demoClientTB, demoBIS } from '../../data/demoFS'

const SEL = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const INP = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10'
const money = (n) => (n === null || n === undefined || n === '' ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }))
const MAP = [['code', 'Code'], ['name', 'Name'], ['opening', 'Opening'], ['debit', 'Debit'], ['credit', 'Credit'], ['closing', 'Closing']]

export function TBSource({ file, setFile, onLedgers, label = 'Client trial balance (Excel)' }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const load = async (f) => { if (!f) return; setBusy(true); setErr(''); try { const sheets = await readTBWorkbook(await f.arrayBuffer()); if (!sheets.length) setErr('No trial balance columns were found.'); else { const s = sheets[0]; setFile({ name: f.name, ...s }); onLedgers(toLedgers(s.rows, s.mapping)) } } catch (e) { setErr(e.message) } setBusy(false) }
  const remap = (k, h) => { const mapping = { ...file.mapping, [k]: h || null }; setFile({ ...file, mapping }); onLedgers(toLedgers(file.rows, mapping)) }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"><FileSpreadsheet className="h-4 w-4" />{busy ? 'Reading…' : label}<input type="file" accept=".xlsx" className="hidden" onChange={(e) => { load(e.target.files?.[0]); e.target.value = '' }} /></label>
        {file && <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">{file.name} · {file.rows.length} accounts</span>}{err && <span className="text-sm text-alert-red">{err}</span>}
      </div>
      {file?.headers && (
        <details className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"><summary className="cursor-pointer text-sm font-semibold text-navy">How the columns were read <span className="font-normal text-slate-500">(found automatically; change only if one is wrong)</span></summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">{MAP.map(([k, l]) => <Field key={k} label={l}><select aria-label={`${l} column`} value={file.mapping[k] || ''} onChange={(e) => remap(k, e.target.value)} className={`${SEL} w-full`}><option value="">not found</option>{file.headers.map((h) => <option key={h}>{h}</option>)}</select></Field>)}</div>
        </details>
      )}
    </div>
  )
}
const blankEntry = (n) => ({ id: `ADJ-${String(n).padStart(2, '0')}`, part: 'A', kind: 'Adjustment', description: '', support: '', legs: [{ code: 'P103', dr: '', cr: '' }, { code: 'L102', dr: '', cr: '' }] })

export default function IfrsTBTab({ mode, client, clientName }) {
  const showToast = useToast(); const me = currentUser()
  const [file, setFile] = useState(null); const [ledgers, setLedgers] = useState([]); const [bis, setBis] = useState([]); const [source, setSource] = useState('tb')
  const [overrides, setOverrides] = useState({}); const [entries, setEntries] = useState([]); const [capital, setCapital] = useState([{ name: '', amount: '' }])
  const [ver, setVer] = useState({ salary: '', fees: '', capital: '', vatBase: '', closing: '' }); const [bal, setBal] = useState({ code: 'L103', support: '' })
  const [meta, setMeta] = useState({ vatReg: '', from: '01 Jan 2025', to: '31 Dec 2025' }); const [out, setOut] = useState(null)
  const bisLedgers = useMemo(() => bis.filter((b) => b.name && b.amount !== '').map((b, i) => { const a = Math.abs(Number(b.amount)) * (b.side === 'Cr' ? -1 : 1); return { code: `BIS${i + 1}`, name: b.name, opening: 0, debit: a > 0 ? a : 0, credit: a < 0 ? -a : 0, closing: a, closingSupplied: true } }), [bis])
  const active = mode === 'disclaimer' && source === 'bis' ? bisLedgers : ledgers
  const live = useMemo(() => (active.length ? buildIfrsTB({ ledgers: active, overrides, entries }) : null), [active, overrides, entries])
  // Supporting schedules (proper audit, the client's own trial balance): each one is checked against the trial balance; a difference is flagged and sent to whoever prepared it.
  const dcs = useDemoClient(); const auditLog = useAuditLog(); const [notified, setNotified] = useState({})
  const fromClient = mode === 'proper' && dcs.ready && active.length > 0 && active.length === dcs.ledgers.length
  const schedules = useMemo(() => {
    if (!fromClient) return null
    const sc = buildSchedules(active); return { ...sc, checks: sc.checks.map((c) => ({ ...c, owner: scheduleOwner(c.area, auditLog, clientName, dcs.file?.associate || '') })) }
  }, [fromClient, active, auditLog, clientName, dcs.file])
  const notify = (c) => { logEvent({ client, clientName, category: 'work', title: `Schedule does not agree to the trial balance: ${c.label}`, description: `Schedule ${money(c.schedule)} · trial balance ${money(c.tb)} · difference ${money(c.diff)}. Sent to ${c.owner} to explain or correct.`, extra: { auditArea: 'Financial statements', assignedTo: c.owner, performedBy: me.name }, user: me }); setNotified((x) => ({ ...x, [c.id]: true })); showToast(`${c.owner} has been told`) }
  const setEntry = (i, p) => setEntries((l) => l.map((e, k) => (k === i ? { ...e, ...p } : e)))
  const setLeg = (i, j, p) => setEntries((l) => l.map((e, k) => (k === i ? { ...e, legs: e.legs.map((g, m) => (m === j ? { ...g, ...p } : g)) } : e)))
  const proposal = live && live.diff !== 0 ? proposeBalancing(live.diff, bal.code, bal.support) : null
  const run = () => {
    let allEntries = entries.map((e) => ({ ...e, legs: e.legs.map((g) => ({ ...g, dr: Number(g.dr) || 0, cr: Number(g.cr) || 0 })) }))
    if (proposal?.entry) allEntries = [...allEntries, proposal.entry]
    const tb = buildIfrsTB({ ledgers: active, overrides, entries: allEntries })
    const cogs = cogsSchedule(active, tb, { closingStock: ver.closing }); const vat = vatReconciliation(active, tb)
    const verif = verification([{ label: 'Salary (salary schedule total)', code: 'P103', schedule: ver.salary }, { label: 'Audit and consultation fees (engagement letter)', code: 'P103', schedule: ver.fees }, { label: 'Capital (AOA / CR)', code: 'E101', schedule: ver.capital || capital.reduce((n, c) => n + (Number(c.amount) || 0), 0) || '' }], tb)
    const sv = salesVsVat(tb.rows.find((r) => r.code === 'P101')?.final ?? 0, ver.vatBase)
    const extra = [...verif.filter((v) => v.pending).map((v) => v.pending), ...(sv.pending ? [sv.pending] : []), ...(proposal?.pending ? [proposal.pending] : [])]
    const schedExtra = (schedules?.checks || []).filter((c) => !c.ok).map((c) => ({ category: 'Schedule difference', area: c.label, observation: `Schedule ${c.schedule} against the trial balance ${c.tb}: difference ${c.diff}.`, needed: 'Explain or correct the schedule or the trial balance', owner: c.owner, priority: 'High', amount: c.diff, sheet: 'Schedule checks' }))
    const pending = pendingList({ tb, ledgers: active, adj: tb.adj, extra: [...extra, ...schedExtra], mode })
    const st = statements(tb); setOut({ tb, cogs, vat, verif, sv, pending, st, entries: allEntries })
    logEvent({ client, clientName, category: 'work', title: `IFRS TB prepared (${mode === 'disclaimer' ? 'disclaimer audit' : 'proper audit'})`, description: `${tb.status}; ${pending.length} pending items`, extra: { auditArea: 'Financial statements', performedBy: me.name }, user: me })
  }
  const download = async () => {
    const wb = await buildIfrsWorkbook({ tb: out.tb, ledgers: active, cogs: out.cogs, vat: out.vat, verification: out.verif, salesVat: out.sv, pending: out.pending, st: out.st, client: clientName || 'Company Name', period: { from: meta.from, to: meta.to }, mode, capital: capital.filter((c) => c.name || c.amount), vatReg: meta.vatReg, schedules, unresolvedNote: out.tb.diff !== 0 ? `NOT BALANCED - REVIEW REQUIRED. Unresolved difference ${money(out.tb.diff)} is shown as it is and listed as pending.` : '' })
    const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = mode === 'disclaimer' ? 'IFRS_TB_Disclaimer_Audit.xlsx' : 'IFRS_Financial_Statements_Proper_Audit.xlsx'; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
  }
  const dc = useDemoClient()
  // For the demo client the source is its own trial balance; otherwise the generic demo data.
  const useDemo = () => { if (mode === 'disclaimer' && source === 'bis') setBis((dc.ready ? clientBis(dc.ledgers) : demoBIS).map(([name, amount, side]) => ({ name, amount, side }))); else { setLedgers(dc.ready ? dc.ledgers.map((l) => ({ ...l })) : demoClientTB()); setFile(null) } setOut(null) }
  const diffBanner = live && live.diff !== 0
  return (
    <div className="space-y-6">
      {mode === 'disclaimer' && <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">Disclaimer audit: the IFRS TB is prepared from what the client provides, either a Trial Balance or a Basic Information Sheet (BIS). An unbalanced TB is documented as an unresolved difference and referred for review; a related-party / partner account is used only with support.</div>}

      <Card title="Step 1 · The client's figures" subtitle="Load the trial balance and set the period."
        right={DEMO_DATA ? <SecondaryButton onClick={useDemo}>{demoLabel(dc)}</SecondaryButton> : null}><AutoDemo run={useDemo} />
        {mode === 'disclaimer' && <div className="grid gap-3 sm:grid-cols-2">{[['tb', 'Client trial balance'], ['bis', 'Basic Information Sheet (BIS)']].map(([v, l]) => <Toggle key={v} label={l} checked={source === v} onChange={() => { setSource(v); setOut(null) }} />)}</div>}
        {source === 'tb' || mode !== 'disclaimer' ? <TBSource file={file} setFile={setFile} onLedgers={(l) => { setLedgers(l); setOut(null) }} /> : (
          <div className="space-y-4">{bis.map((b, i) => (
            <div key={i} className="grid items-end gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_180px_120px_auto]">
              <Field label="Item"><input aria-label="BIS item" value={b.name} onChange={(e) => setBis((l) => l.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className={`${INP} w-full`} /></Field>
              <Field label="Amount"><input aria-label="BIS amount" type="number" value={b.amount} onChange={(e) => setBis((l) => l.map((x, k) => (k === i ? { ...x, amount: e.target.value } : x)))} className={`${INP} w-full`} /></Field>
              <Field label="Side"><select aria-label="BIS side" value={b.side} onChange={(e) => setBis((l) => l.map((x, k) => (k === i ? { ...x, side: e.target.value } : x)))} className={`${SEL} w-full`}><option>Dr</option><option>Cr</option></select></Field>
              <button aria-label="Remove BIS item" onClick={() => setBis((l) => l.filter((_, k) => k !== i))} className="pb-3 text-slate-400 hover:text-alert-red"><Trash2 className="h-4 w-4" /></button></div>))}
            <SecondaryButton onClick={() => setBis((l) => [...l, { name: '', amount: '', side: 'Dr' }])}><Plus className="h-4 w-4" />Add item</SecondaryButton></div>)}
        <FieldGrid>
          <Field label="Period from"><input aria-label="Period from" value={meta.from} onChange={(e) => setMeta({ ...meta, from: e.target.value })} className={`${INP} w-full`} /></Field>
          <Field label="Period to"><input aria-label="Period to" value={meta.to} onChange={(e) => setMeta({ ...meta, to: e.target.value })} className={`${INP} w-full`} /></Field>
          <Field label="VAT registration number"><input aria-label="VAT registration" value={meta.vatReg} onChange={(e) => setMeta({ ...meta, vatReg: e.target.value })} className={`${INP} w-full`} /></Field>
        </FieldGrid>
      </Card>

      {live && (
        <>
          <Card title={`Step 2 · Match each account to an IFRS account (${live.mapped.length} accounts)`} subtitle="Each account maps to one IFRS account by its nature, not by the client's label.">
            {live.unmapped.length > 0 ? <Flags flags={[`${live.unmapped.length} account(s) could not be classified. Choose an IFRS account for each one below.`]} /> : <p className="rounded-xl border border-emerald/30 bg-emerald/5 px-4 py-3 text-sm font-medium text-emerald">All accounts are mapped.</p>}
            <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm"><thead className="sticky top-0"><tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Code</th><th className="px-4 py-3">Client account</th><th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3">IFRS account</th></tr></thead>
                <tbody>{live.mapped.map((m, k) => (
                  <tr key={m.id} className={`border-t border-slate-100 align-top ${k % 2 ? 'bg-slate-50' : ''}`}><td className="px-4 py-3 text-xs text-slate-400">{m.id}</td><td className="px-4 py-3 text-navy">{m.name}{m.flag && <span className="mt-1 block text-xs text-amber">{m.flag}</span>}</td><td className="px-4 py-3 text-right text-navy">{money(m.closing)}</td>
                    <td className="px-4 py-3"><select aria-label={`IFRS account for ${m.name}`} value={overrides[m.key] || m.ifrs || ''} onChange={(e) => setOverrides({ ...overrides, [m.key]: e.target.value })} className={`${SEL} w-full min-w-[260px]`}><option value="">Unmapped</option>{IFRS.map((a) => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}</select></td></tr>))}</tbody></table>
            </div>
          </Card>

          <Card title="Step 3 · Adjustments" subtitle="Booked only with an amount and support. Part A is booked. Part B is what the client already posted (audit trail only). Part C stays pending."
            right={<SecondaryButton onClick={() => setEntries((l) => [...l, blankEntry(l.length + 1)])}><Plus className="h-4 w-4" />Add entry</SecondaryButton>}>
            {entries.length === 0 && <Empty>No adjustments. Opposite-sign receivable / payable balances are grossed up automatically.</Empty>}
            {entries.map((e, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-navy">Entry {e.id}</p><button aria-label="Remove entry" onClick={() => setEntries((l) => l.filter((_, k) => k !== i))} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-alert-red"><Trash2 className="h-4 w-4" />Remove</button></div>
                <FieldGrid cols={4}>
                  <Field label="Reference"><input aria-label="Entry ref" value={e.id} onChange={(x) => setEntry(i, { id: x.target.value })} className={`${INP} w-full`} /></Field>
                  <Field label="Part"><select aria-label="Entry part" value={e.part} onChange={(x) => setEntry(i, { part: x.target.value })} className={`${SEL} w-full`}><option value="A">A – book</option><option value="B">B – client already posted</option><option value="C">C – pending</option></select></Field>
                  <Field label="Description"><input aria-label="Entry description" value={e.description} onChange={(x) => setEntry(i, { description: x.target.value })} className={`${INP} w-full`} /></Field>
                  <Field label="Support" hint="Document or schedule"><input aria-label="Entry support" value={e.support} onChange={(x) => setEntry(i, { support: x.target.value })} className={`${INP} w-full`} /></Field>
                </FieldGrid>
                <div className="mt-5 space-y-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lines</p>
                  {e.legs.map((g, j) => <div key={j} className="grid gap-3 sm:grid-cols-[1fr_160px_160px]"><select aria-label="Leg account" value={g.code} onChange={(x) => setLeg(i, j, { code: x.target.value })} className={`${SEL} w-full`}>{IFRS.map((a) => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}</select><input aria-label="Leg debit" type="number" placeholder="Debit" value={g.dr} onChange={(x) => setLeg(i, j, { dr: x.target.value })} className={`${INP} w-full`} /><input aria-label="Leg credit" type="number" placeholder="Credit" value={g.cr} onChange={(x) => setLeg(i, j, { cr: x.target.value })} className={`${INP} w-full`} /></div>)}
                  <SecondaryButton onClick={() => setEntry(i, { legs: [...e.legs, { code: 'P103', dr: '', cr: '' }] })}><Plus className="h-4 w-4" />Add a line</SecondaryButton></div>
              </div>))}
            {live.adj.booked.filter((e) => e.kind === 'Reclassification').map((e) => <p key={e.id} className="text-sm text-slate-600">Automatic {e.id}: {e.description}</p>)}
          </Card>

          <Card title="Step 4 · Schedule checks" subtitle="If a schedule figure differs and the cause is unknown, the IFRS TB keeps the client figure and the gap goes to the pending list.">
            <FieldGrid>{[['salary', 'Salary schedule total'], ['fees', 'Audit and consultation fees'], ['capital', 'Capital per AOA / CR (or the table below)'], ['vatBase', 'VAT return sales base'], ['closing', 'Closing stock (client figure)']].map(([k, l]) => <Field key={k} label={l} hint={k === 'closing' ? 'Shown as "client figure, support pending"' : undefined}><input aria-label={l} type="number" value={ver[k]} onChange={(e) => setVer({ ...ver, [k]: e.target.value })} className={`${INP} w-full`} /></Field>)}</FieldGrid>
            <Section title="Capital by shareholder">
              <div className="space-y-3">{capital.map((c, i) => <div key={i} className="grid gap-3 sm:grid-cols-[1fr_200px]"><input aria-label="Shareholder" placeholder="Shareholder (AOA / CR)" value={c.name} onChange={(e) => setCapital((l) => l.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className={`${INP} w-full`} /><input aria-label="Shareholder capital" type="number" placeholder="Capital" value={c.amount} onChange={(e) => setCapital((l) => l.map((x, k) => (k === i ? { ...x, amount: e.target.value } : x)))} className={`${INP} w-full`} /></div>)}
                <SecondaryButton onClick={() => setCapital((l) => [...l, { name: '', amount: '' }])}><Plus className="h-4 w-4" />Add a shareholder</SecondaryButton></div>
            </Section>
          </Card>

          {schedules && (
            <Card title="Schedule checks" subtitle="Each schedule must agree to the trial balance. A difference is flagged, listed as pending in the workbook, and sent to the team member who prepared that schedule. Nothing is adjusted to force an agreement.">
              <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm">
                <thead><tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">{['Schedule', 'Schedule', 'Trial balance', 'Difference', 'Result', 'Prepared by', ''].map((h, i) => <th key={i} className={`px-4 py-3 ${i > 0 && i < 4 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
                <tbody>{schedules.checks.map((c, k) => (
                  <tr key={c.id} className={`border-t border-slate-100 ${k % 2 ? 'bg-slate-50' : ''}`}>
                    <td className="px-4 py-3 text-navy">{c.label}</td><td className="px-4 py-3 text-right tabular-nums text-navy">{money(c.schedule)}</td><td className="px-4 py-3 text-right tabular-nums text-navy">{money(c.tb)}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${c.ok ? 'text-emerald' : 'text-alert-red'}`}>{c.ok ? 'None' : money(c.diff)}</td>
                    <td className="px-4 py-3"><Chip value={c.ok ? 'Pass' : 'Fail'} /></td><td className="px-4 py-3 text-slate-600">{c.owner}</td>
                    <td className="px-4 py-3 text-right">{!c.ok && (notified[c.id] ? <span className="text-xs font-semibold text-emerald">Told {c.owner}</span> : <button onClick={() => notify(c)} className="rounded-lg border border-alert-red/40 px-3 py-1.5 text-xs font-semibold text-alert-red hover:bg-alert-red/5">Tell {c.owner}</button>)}</td>
                  </tr>))}</tbody></table></div>
              {schedules.mismatches.length === 0 ? <p className="text-sm font-medium text-emerald">Every schedule agrees to the trial balance.</p> : <Flags flags={[`${schedules.mismatches.length} schedule${schedules.mismatches.length === 1 ? '' : 's'} do not agree to the trial balance.`]} />}
            </Card>)}

          {diffBanner && (
            <Card title={`Unresolved difference: ${money(live.diff)}`} subtitle={`The IFRS TB does not balance. It is never forced: no suspense, rounding or plug account.${mode === 'disclaimer' ? ' In a disclaimer audit the difference may relate to a related-party or partner current account, but only with support.' : ''}`}>
              <FieldGrid cols={2}>
                <Field label="Balancing account"><select aria-label="Balancing account" value={bal.code} onChange={(e) => setBal({ ...bal, code: e.target.value })} className={`${SEL} w-full`}>{IFRS.filter((a) => ['L103', 'A106', 'L202', 'A206'].includes(a.code)).map((a) => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}</select></Field>
                <Field label="Support" hint="Confirmation or document. Leave empty to keep it pending"><input aria-label="Balancing support" value={bal.support} onChange={(e) => setBal({ ...bal, support: e.target.value })} className={`${INP} w-full`} /></Field>
              </FieldGrid>
            </Card>)}
        </>
      )}

      <div className="flex items-center gap-4"><PrimaryButton onClick={run} disabled={!live}>Prepare the IFRS TB</PrimaryButton>{!live && <span className="text-sm text-slate-500">Load the client's trial balance first.</span>}</div>

      {out && (
        <div className="space-y-6">
          <div className={`rounded-2xl border px-6 py-5 ${out.tb.balanced ? 'border-emerald/30 bg-emerald/5' : 'border-amber/30 bg-amber/5'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p><p className={`mt-1 text-2xl font-bold ${out.tb.balanced ? 'text-emerald' : 'text-amber'}`}>{out.tb.status}</p></div>
              <PrimaryButton onClick={download}><Download className="h-4 w-4" />Download the workbook</PrimaryButton></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3"><Stat label="Client trial balance" value={money(out.tb.totals.clientDr)} /><Stat label="Adjustments" value={money(out.tb.totals.adjDr)} /><Stat label="IFRS trial balance" value={money(out.tb.totals.finalDr)} tone="green" /></div>
          <Card title="Checks"><DataTable columns={[{ key: 'check', label: 'Check' }, { key: 'pass', label: 'Result', render: (c) => <Chip value={c.pass ? 'Pass' : 'Fail'} /> }, { key: 'detail', label: 'Detail' }]} rows={out.tb.checks} /></Card>
          <Card title="IFRS TB bridge" subtitle="From the client's figures, through the adjustments, to the IFRS figures."><DataTable columns={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Account' }, { key: 'clientDr', label: 'Client Dr', render: (r) => money(r.clientDr) }, { key: 'clientCr', label: 'Client Cr', render: (r) => money(r.clientCr) }, { key: 'adjDr', label: 'Adj Dr', render: (r) => money(r.adjDr) }, { key: 'adjCr', label: 'Adj Cr', render: (r) => money(r.adjCr) }, { key: 'finalDr', label: 'Final Dr', render: (r) => money(r.finalDr) }, { key: 'finalCr', label: 'Final Cr', render: (r) => money(r.finalCr) }]} rows={out.tb.rows.filter((r) => r.count || r.adjDr || r.adjCr)} /></Card>
          <Card title="Cost of sales, VAT and verification">
            <div className="grid gap-3 sm:grid-cols-2"><Stat label={`Cost of sales: schedule ${money(out.cogs.total)} vs IFRS TB ${money(out.cogs.ifrs)}`} value={out.cogs.diff === 0 ? 'No difference' : money(out.cogs.diff)} tone={out.cogs.diff === 0 ? 'green' : 'red'} /><Stat label={`Net VAT: ${money(out.vat.net)} vs IFRS TB ${money(out.vat.ifrs)}`} value={out.vat.diff === 0 ? 'No difference' : money(out.vat.diff)} tone={out.vat.diff === 0 ? 'green' : 'red'} /></div>
            <p className="text-sm text-slate-600">Closing stock: {out.cogs.closingLabel}. Sales against the VAT base: {out.sv.status}{out.sv.diff ? ` (${money(out.sv.diff)})` : ''}.</p>
            <DataTable columns={[{ key: 'label', label: 'Verification' }, { key: 'schedule', label: 'Schedule', render: (r) => money(r.schedule) }, { key: 'ifrsFigure', label: 'IFRS TB', render: (r) => money(r.ifrsFigure) }, { key: 'diff', label: 'Difference', render: (r) => money(r.diff) }, { key: 'status', label: 'Status' }]} rows={out.verif} />
          </Card>
          <Card title={`Pending items (${out.pending.length})`} subtitle="Things still to be resolved or supported."><DataTable columns={[{ key: 'ref', label: 'Ref' }, { key: 'category', label: 'Category' }, { key: 'area', label: 'Area' }, { key: 'observation', label: 'Observation' }, { key: 'priority', label: 'Priority' }, { key: 'amount', label: 'Amount', render: (r) => money(r.amount) }]} rows={out.pending} /></Card>
          {out.tb.adj.errors.length > 0 && <Flags flags={out.tb.adj.errors} />}
        </div>
      )}
    </div>
  )
}
