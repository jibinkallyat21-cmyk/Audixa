import { useMemo, useState } from 'react'
import { Loader2, FileSpreadsheet } from 'lucide-react'
import { Card, DataTable, Flags, Field, FieldGrid, Section, Stat, Empty, PrimaryButton, INPUT } from './ReviewParts'
import SendSamples from './SendSamples'
import { useDemoClient } from '../../utils/useDemoClient'
import { selectCutoff, requestText, areaLabel } from '../../utils/cutoff'
import { clientCutoffTxns } from '../../utils/clientCutoffData'
import { readLedgerSheet, toNum, MAT_FIELDS } from '../../utils/samplingExcel'
import { isoDate } from '../../utils/sampleItems'

const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

// Cut-off for one area: the team says how many items, the app picks them by the firm's rule, a person approves, and the client is asked for each one.
export default function CutOffTool({ area, client, firm: firmProp }) {
  const dc = useDemoClient(); const firm = dc.isDemo(client) ? dc.auditor : firmProp
  const [yearEnd, setYearEnd] = useState('2025-12-31'); const [n, setN] = useState(''); const [nDebit, setNDebit] = useState(''); const [nCredit, setNCredit] = useState('')
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [picked, setPicked] = useState(null)
  const bankABC = firm === 'ABCPA' && area === 'bank'
  const demoTxns = useMemo(() => (dc.isDemo(client) && dc.ready ? clientCutoffTxns(dc.ledgers)[area] || [] : []), [dc, client, area])
  const uploaded = useMemo(() => {
    if (!file?.rows?.length || !file.mapping.date) return []; const m = file.mapping
    return file.rows.map((x) => ({ date: isoDate(x.values[m.date]), ref: m.ref ? String(x.values[m.ref] ?? '') : '', ledger: m.account ? String(x.values[m.account] ?? '') : areaLabel(area), description: m.description ? String(x.values[m.description] ?? '') : '', debit: toNum(x.values[m.debit]) ?? 0, credit: toNum(x.values[m.credit]) ?? 0 })).filter((t) => t.date)
  }, [file, area])
  const txns = uploaded.length ? uploaded : demoTxns
  const load = async (f) => { if (!f) return; setBusy(true); try { setFile({ ...(await readLedgerSheet(await f.arrayBuffer(), MAT_FIELDS)), name: f.name }) } catch (e) { setFile({ error: e.message, rows: [], headers: [], mapping: {}, name: f.name }) } setBusy(false); setPicked(null) }
  const ready = bankABC ? num(nDebit) !== null && num(nCredit) !== null : num(n) !== null
  const run = () => setPicked(selectCutoff({ firm, area, txns, yearEnd, n: num(n) ?? 0, nDebit: num(nDebit) ?? 0, nCredit: num(nCredit) ?? 0 }))
  const items = useMemo(() => (picked ? picked.picks.map((p) => ({ key: `C:${area}|${p.date}|${p.ref}|${p.description}|${p.amount}`, text: requestText(area, p), nature: 'document', subgroup: bankABC ? (p.side === 'Debit' ? 'Debits' : 'Credits') : p.period, row: { ref: p.ref, date: p.date, ledger: p.ledger, description: p.description, amount: p.amount } })) : []), [picked, area, bankABC])
  if (!firm) return <Card><p className="text-sm text-slate-500">Select a client first. The firm decides how the cut-off items are picked.</p></Card>
  const rule = firm === 'ABCPA'
    ? (bankABC ? 'ABCPA: from the subsequent bank statement, the number of debits and the number of credits you set, in date order. Bank charges are left out.' : 'ABCPA: from the subsequent period, the number you set, in date order (first after the year end).')
    : 'MISCPA: the last items before the year end and the first items after it, the number you set for each side.'
  return (
    <div className="space-y-6">
      <Card title={`${areaLabel(area)} cut-off`} subtitle={rule}>
        <Section title="1. Where the transactions come from">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}{area === 'bank' ? 'Upload the bank statement or ledger (Excel)' : 'Upload the ledger (Excel)'}<input type="file" accept=".xlsx" className="hidden" onChange={(e) => { load(e.target.files?.[0]); e.target.value = '' }} /></label>
            {uploaded.length > 0 ? <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">{file.name} · {uploaded.length} transactions</span> : demoTxns.length > 0 ? <span className="rounded-lg bg-emerald/10 px-3 py-2 text-sm text-emerald">The client's own {areaLabel(area).toLowerCase()} transactions are loaded ({demoTxns.length})</span> : <span className="text-sm text-slate-500">{dc.isDemo(client) ? `The trial balance has no ${areaLabel(area).toLowerCase()} transactions to pick from.` : 'Nothing loaded yet.'}</span>}
          </div>
          {file?.error && <p className="mt-2 text-sm text-alert-red">{file.error}</p>}
        </Section>
        <Section title="2. How many items?" hint="You decide the number; nothing is preset.">
          <FieldGrid cols={bankABC ? 3 : 2}>
            <Field label="Year-end"><input aria-label="Year-end" type="date" value={yearEnd} onChange={(e) => { setYearEnd(e.target.value); setPicked(null) }} className={INPUT} /></Field>
            {bankABC ? <>
              <Field label="Number of debits (money out)"><input aria-label="Number of debits" type="number" min="0" value={nDebit} onChange={(e) => { setNDebit(e.target.value); setPicked(null) }} className={INPUT} /></Field>
              <Field label="Number of credits (money in)"><input aria-label="Number of credits" type="number" min="0" value={nCredit} onChange={(e) => { setNCredit(e.target.value); setPicked(null) }} className={INPUT} /></Field></>
              : <Field label={firm === 'MISCPA' ? 'Number of items before and the same number after the year end' : 'Number of items'}><input aria-label="Number of items" type="number" min="0" value={n} onChange={(e) => { setN(e.target.value); setPicked(null) }} className={INPUT} /></Field>}
          </FieldGrid>
          <div className="mt-5"><PrimaryButton onClick={run} disabled={!ready || !txns.length}>Pick the items</PrimaryButton></div>
        </Section>
      </Card>

      {picked && (
        <Card title="3. The items picked" subtitle="Check them. Nothing goes to the client until you approve.">
          <div className="grid gap-3 sm:grid-cols-3"><Stat label="Items picked" value={picked.picks.length} tone="green" />{firm === 'MISCPA' ? <><Stat label="Before the year end" value={picked.picks.filter((p) => p.period === 'Before year end').length} /><Stat label="After the year end" value={picked.picks.filter((p) => p.period === 'After year end').length} /></> : bankABC ? <><Stat label="Debits" value={picked.picks.filter((p) => p.side === 'Debit').length} /><Stat label="Credits" value={picked.picks.filter((p) => p.side === 'Credit').length} /></> : <Stat label="After the year end" value={picked.picks.length} />}</div>
          {picked.notes.length > 0 && <Flags flags={picked.notes} />}
          {picked.picks.length === 0 ? <Empty>Nothing was picked. Check the year-end and the transactions.</Empty> : (
            <DataTable columns={[{ key: 'period', label: 'Period', render: (r) => <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${r.period === 'Before year end' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>{r.period}</span> }, { key: 'date', label: 'Date' }, { key: 'ref', label: 'Reference' }, { key: 'ledger', label: 'Ledger' }, { key: 'description', label: 'Description' }, { key: 'debit', label: 'Debit', render: (r) => (r.debit ? money(r.debit) : '') }, { key: 'credit', label: 'Credit', render: (r) => (r.credit ? money(r.credit) : '') }]} rows={picked.picks} />
          )}
          <SendSamples group="cutoff" area={area} label={areaLabel(area)} client={client} items={items} />
        </Card>
      )}
      {!picked && txns.length === 0 && <Empty>Upload the transactions to pick from.</Empty>}
    </div>
  )
}
