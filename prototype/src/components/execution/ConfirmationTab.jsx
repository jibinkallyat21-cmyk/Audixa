import { useMemo, useState } from 'react'
import AutoDemo from './AutoDemo'
import { useDemoClient, demoLabel } from '../../utils/useDemoClient'
import { clientConfirmations, clientBankStatement } from '../../utils/clientSamplingData'
import { useIssuedLists } from '../../utils/requirementsStore'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Card, Chip, Flags, Field, FieldGrid, Section, Toggle, Stat, Empty, PrimaryButton, SecondaryButton, INPUT } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob } from '../../utils/eosbExcel'
import { CONF_TESTS, confirmationTests, confirmationOverall, bankStatementRecon, denominationCheck, confirmationCompletion, nextRef } from '../../utils/vouching'
import { buildConfirmationWorkbook } from '../../utils/vouchingExcel'

const blank = (type) => ({ id: Math.random().toString(36).slice(2), type, available: true, label: '', fileName: '', tbAmount: '', amount: '', asAt: '', clientName: '', bankName: '', tbBank: '', sealPresent: false, signaturePresent: false, eGenerated: false, digitalMark: false, letterhead: false, sigIllegible: false, letterheadIllegible: false, clientProvided: true, statement: { has: false, fileName: '', opening: '', credits: '', debits: '', closing: '', bankMatches: true }, denominations: [{ denomination: 500, quantity: '' }, { denomination: 100, quantity: '' }, { denomination: 50, quantity: '' }], remarks: '' })
const DEMO = [
  { ...blank('Bank'), label: 'Al Rajhi Bank – current account', fileName: 'alrajhi_conf.pdf', tbAmount: 482500.5, amount: 482500.5, asAt: '2025-12-31', clientName: 'Demo Trading Company', bankName: 'Al Rajhi Bank', tbBank: 'Al Rajhi Bank – current account', sealPresent: true, signaturePresent: true, letterhead: true, statement: { has: true, fileName: 'alrajhi_stmt.pdf', opening: 400000, credits: 120000.5, debits: 37500, closing: 482500.5, bankMatches: true } },
  { ...blank('Bank'), label: 'SNB – savings', fileName: 'snb.pdf', tbAmount: 90000, amount: 88500, asAt: '2025-11-30', clientName: 'Demo Trading Co.', bankName: 'SNB', tbBank: 'SNB savings', sealPresent: true, signaturePresent: false, letterhead: true },
  { ...blank('Cash'), label: 'Cash on hand', fileName: 'cash_count.pdf', tbAmount: 12600, amount: 12600, asAt: '2025-12-31', clientName: 'Demo Trading Company', sealPresent: true, signaturePresent: true, letterhead: true, denominations: [{ denomination: 500, quantity: 20 }, { denomination: 100, quantity: 25 }, { denomination: 50, quantity: 2 }] },
]

export default function ConfirmationTab({ client, clientName, legalName: initialLegal = '' }) {
  const showToast = useToast(); const me = currentUser(); const dc = useDemoClient()
  // For the demo client the confirmations are the client's own cash and bank ledgers; the bank letters are demo documents that agree to the trial balance.
  const demoItems = () => (dc.ready ? clientConfirmations(dc.ledgers).map((c) => ({ ...blank(c.type), ...c, fileName: `${c.type.toLowerCase()}_confirmation_${c.label.replace(/\W+/g, '_')}.pdf`, amount: c.tbAmount, clientName: dc.client, bankName: c.type === 'Bank' ? c.label : '', sealPresent: true, signaturePresent: true, letterhead: true })) : DEMO)
  const [legalName, setLegalName] = useState(initialLegal || clientName || ''); const [yearEnd, setYearEnd] = useState('2025-12-31')
  const [items, setItems] = useState([]); const patch = (id, p) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))
  // The bank statements are a requirement the client uploads. For the demo client they are not typed in again: once the client has uploaded them the
  // opening, money in and out and closing balance come from the statement (here worked out from the bank ledger) and the file name from the upload.
  const issuedList = useIssuedLists()[dc.slug]
  const stmtItem = useMemo(() => (issuedList?.categories || []).find((c) => c.id === 'BANK')?.items.find((i) => /bank statements/i.test(i.text)), [issuedList])
  const stmtUploaded = !!stmtItem && ['Uploaded Processing', 'Under Review', 'Accepted'].includes(stmtItem.status)
  const auto = dc.isDemo(client)
  const effItems = useMemo(() => items.map((c) => {
    if (!auto || c.type !== 'Bank') return c
    const led = dc.ledgers.find((l) => l.name === c.label)
    return { ...c, statement: stmtUploaded && led ? { has: true, fileName: stmtItem.filename || '', ...clientBankStatement(led), bankMatches: c.statement.bankMatches !== false, auto: true } : { ...c.statement, has: false, auto: true } }
  }), [items, auto, stmtUploaded, stmtItem, dc.ledgers])
  const rows = useMemo(() => {
    const issued = []
    return effItems.map((c) => {
      const ref = c.available ? nextRef(c.type === 'Cash' ? '5001.01' : '5002.01', issued) : ''; if (ref) issued.push(ref)
      const ctx = { tbAmount: c.tbAmount === '' ? null : Number(c.tbAmount), yearEnd, legalName, tbBank: c.tbBank }
      const t = confirmationTests({ ...c, amount: c.amount === '' ? null : Number(c.amount) }, ctx)
      const overall = confirmationOverall(t.tests, { available: c.available, c })
      const stm = c.type === 'Bank' && c.statement.has ? { ...bankStatementRecon(c.statement), closeToConfirm: Number(c.statement.closing) === Number(c.amount), closeToTb: c.tbAmount !== '' && Number(c.statement.closing) === Number(c.tbAmount) } : null
      const den = c.type === 'Cash' ? denominationCheck(c.denominations, c.amount) : null
      const flags = []
      if (c.clientProvided) flags.push('Client-provided confirmation: weaker evidence than one obtained directly from the bank / custodian.')
      if (stm && (!stm.ok || !stm.closeToConfirm || !stm.closeToTb || !c.statement.bankMatches)) flags.push('Bank statement / confirmation difference – flag for manager review.')
      if (den && !den.ok) flags.push(`Denominations total ${den.total.toFixed(2)}; difference ${den.diff.toFixed(2)} from the confirmed amount.`)
      if (t.tests['Client Name'] === 'No') flags.push('Client name difference – flag for manager decision.')
      return { ...c, ref, tests: t.tests, reasons: t.reasons, overall, stm, den, flags, statementChecked: c.type === 'Bank' ? !!(c.statement.has && stm?.ok && stm.closeToConfirm) : undefined, denominationsChecked: c.type === 'Cash' ? !!den?.ok : undefined }
    })
  }, [effItems, legalName, yearEnd])
  const completion = confirmationCompletion({ confirmations: rows, logComplete: rows.length > 0 })
  const docLog = rows.flatMap((c) => [{ ref: c.ref, fileName: c.fileName, description: `${c.type} confirmation`, amount: c.amount === '' ? null : Number(c.amount), comparedWith: c.tbAmount === '' ? null : Number(c.tbAmount), check: c.type === 'Cash' ? 'Denominations re-added' : 'Cross-verified with bank statement' }, ...(c.type === 'Bank' && c.statement.has ? [{ ref: `${c.ref}-A`, fileName: c.statement.fileName, description: 'Bank statement', amount: Number(c.statement.closing), comparedWith: Number(c.amount), check: `Opening + credits − debits = ${c.stm?.calculated?.toFixed(2)}` }] : [])])
  const download = async () => {
    const wb = await buildConfirmationWorkbook({ confirmations: rows, docLog, client: clientName, yearEnd: yearEnd.split('-').reverse().join('-'), prepared: { preparedBy: me.name } })
    const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = 'Cash_Bank_Confirmation.xlsx'; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
    logEvent({ client, clientName, category: 'work', title: 'Cash and bank confirmation workbook prepared', description: `${rows.length} confirmations, status ${completion.status}`, extra: { auditArea: 'Cash and bank', performedBy: me.name }, user: me })
  }
  const [openId, setOpenId] = useState(null); const [tabs, setTabs] = useState({}); const tb = (c) => (c.available ? tabs[c.id] || 'amounts' : 'letter')
  const matched = rows.filter((c) => c.overall === 'Confirmed / Matched').length
  const attention = rows.length - matched
  const load = () => { const list = demoItems().map((d) => ({ ...d, id: Math.random().toString(36).slice(2) })); setItems(list); setOpenId(list[0]?.id || null) }
  const diffOf = (c) => (c.tbAmount === '' || c.amount === '' ? null : Math.round((Number(c.amount) - Number(c.tbAmount)) * 100) / 100)
  const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const add = (type) => { const b = blank(type); setItems((l) => [...l, b]); setOpenId(b.id) }
  return (
    <div className="space-y-6">
      <Card title="Cash and bank confirmations" subtitle="Compare each confirmation with the trial balance, check the document, and see the result. Open a confirmation to work on it."
        right={<><SecondaryButton onClick={load}>{demoLabel(dc)}</SecondaryButton><SecondaryButton onClick={() => add('Bank')}><Plus className="h-4 w-4" />Add bank</SecondaryButton><SecondaryButton onClick={() => add('Cash')}><Plus className="h-4 w-4" />Add cash</SecondaryButton></>}>
        <AutoDemo run={load} />
        <FieldGrid cols={2}>
          <Field label="Client legal name" hint="Compared exactly with the name on each confirmation (case and spaces ignored)"><input aria-label="Client legal name" value={legalName} onChange={(e) => setLegalName(e.target.value)} className={INPUT} /></Field>
          <Field label="Year-end" hint="From the trial balance or the engagement letter"><input aria-label="Year-end" type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className={INPUT} /></Field>
        </FieldGrid>
        {rows.length > 0 && <div className="grid gap-3 sm:grid-cols-3"><Stat label="Confirmations" value={rows.length} /><Stat label="Matched" value={matched} tone="green" /><Stat label="Need attention" value={attention} tone={attention ? 'red' : 'green'} /></div>}
      </Card>

      {rows.length === 0 && <Empty>No confirmations yet. Press “{demoLabel(dc)}” or add a bank or cash confirmation. Cash is numbered 5001.xx and bank 5002.xx in the order added.</Empty>}

      {rows.map((c) => {
        const open = openId === c.id; const d = diffOf(c); const good = c.overall === 'Confirmed / Matched'
        return (
          <div key={c.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${good ? 'border-emerald/30' : 'border-slate-200'}`}>
            <button onClick={() => setOpenId(open ? null : c.id)} aria-expanded={open} className="flex w-full flex-wrap items-center gap-4 px-6 py-5 text-left hover:bg-slate-50">
              <span className="rounded-md bg-navy/10 px-2.5 py-1 text-xs font-bold text-navy">{c.ref || 'No Ref. No.'}</span>
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${c.type === 'Bank' ? 'bg-blue-50 text-blue-700' : 'bg-amber/10 text-amber'}`}>{c.type}</span>
              <span className="min-w-[200px] flex-1"><span className="block text-base font-semibold text-navy">{c.label || 'Unnamed confirmation'}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{c.tbAmount !== '' ? `Trial balance ${money(c.tbAmount)}` : 'No trial balance amount'}{c.amount !== '' ? ` · confirmed ${money(c.amount)}` : ''}{d !== null && d !== 0 ? ` · difference ${money(d)}` : ''}</span></span>
              <Chip value={good ? 'Pass' : /Unable|Not Available/.test(c.overall) ? 'Unclear' : 'Fail'} /><span className="text-sm font-semibold text-navy">{c.overall}</span>
              <span className="text-slate-400">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
              <div className="space-y-6 border-t border-slate-100 bg-slate-50 px-6 py-6">
                <div className="flex flex-wrap gap-2" role="tablist">{[['letter', 'The letter'], ['amounts', 'Amounts'], ['checks', 'Document checks'], ['result', 'Result']].filter(([id]) => c.available || id === 'letter').map(([id, l]) => <button key={id} role="tab" aria-selected={tb(c) === id} onClick={() => setTabs((t) => ({ ...t, [c.id]: id }))} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${tb(c) === id ? 'bg-navy text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{l}</button>)}</div>
                  {tb(c) === 'letter' && (
                <Section title="The confirmation" hint="Which letter this is and whether it came in.">
                  <FieldGrid>
                    <Field label="Description"><input aria-label="Description" value={c.label} onChange={(e) => patch(c.id, { label: e.target.value })} className={INPUT} /></Field>
                    <Field label="Client file name"><input aria-label="Client file name" value={c.fileName} onChange={(e) => patch(c.id, { fileName: e.target.value })} className={INPUT} /></Field>
                    <div className="flex items-end"><Toggle label="Confirmation received" checked={c.available} onChange={(v) => patch(c.id, { available: v })} /></div>
                  </FieldGrid>
                </Section>
                  )}
                {c.available && (<>
                  {tb(c) === 'amounts' && (
                  <Section title="Compare the amounts" hint="The difference is worked out for you.">
                    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
                      <Field label="Amount in the trial balance"><input aria-label="TB amount" type="number" value={c.tbAmount} onChange={(e) => patch(c.id, { tbAmount: e.target.value })} className={INPUT} /></Field>
                      <Field label="Amount confirmed"><input aria-label="Confirmed amount" type="number" value={c.amount} onChange={(e) => patch(c.id, { amount: e.target.value })} className={INPUT} /></Field>
                      <div className={`rounded-xl border px-5 py-3 ${d === null ? 'border-slate-200 bg-white' : d === 0 ? 'border-emerald/30 bg-emerald/5' : 'border-alert-red/30 bg-alert-red/5'}`}><p className="text-xs font-medium text-slate-500">Difference</p><p className={`mt-1 text-xl font-bold ${d === null ? 'text-slate-400' : d === 0 ? 'text-emerald' : 'text-alert-red'}`}>{d === null ? '—' : d === 0 ? 'None' : money(d)}</p></div>
                    </div>
                  </Section>
                  )}
                  {tb(c) === 'letter' && (
                  <Section title="Names and date on the letter">
                    <FieldGrid>
                      <Field label="As at date"><input aria-label="As at date" type="date" value={c.asAt} onChange={(e) => patch(c.id, { asAt: e.target.value })} className={INPUT} /></Field>
                      <Field label="Client name on the confirmation"><input aria-label="Client name on the confirmation" value={c.clientName} onChange={(e) => patch(c.id, { clientName: e.target.value })} className={INPUT} /></Field>
                      {c.type === 'Bank' && <Field label="Bank on the confirmation"><input aria-label="Bank on the confirmation" value={c.bankName} onChange={(e) => patch(c.id, { bankName: e.target.value })} className={INPUT} /></Field>}
                      {c.type === 'Bank' && <Field label="Bank in the trial balance description"><input aria-label="Bank in the TB description" value={c.tbBank} onChange={(e) => patch(c.id, { tbBank: e.target.value })} className={INPUT} /></Field>}
                    </FieldGrid>
                  </Section>
                  )}
                  {tb(c) === 'checks' && (
                  <Section title="Check the document" hint="Tick what you can see on the letter.">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Toggle label={c.type === 'Cash' ? 'Company seal present' : 'Bank stamp present'} checked={c.sealPresent} onChange={(v) => patch(c.id, { sealPresent: v })} />
                      <Toggle label="Authorised signature present" checked={c.signaturePresent} onChange={(v) => patch(c.id, { signaturePresent: v })} />
                      <Toggle label={c.type === 'Cash' ? 'On client letterhead' : 'On bank letterhead / official form'} checked={c.letterhead} onChange={(v) => patch(c.id, { letterhead: v })} />
                      {c.type === 'Bank' && <Toggle label="e-generated, no signature required" checked={c.eGenerated} onChange={(v) => patch(c.id, { eGenerated: v })} />}
                      {c.type === 'Bank' && <Toggle label="Digital verification mark" checked={c.digitalMark} onChange={(v) => patch(c.id, { digitalMark: v })} />}
                      <Toggle label="Signature / seal illegible or covered" tone="red" checked={c.sigIllegible} onChange={(v) => patch(c.id, { sigIllegible: v })} />
                      <Toggle label="Provided by the client (not direct from the bank)" tone="red" checked={c.clientProvided} onChange={(v) => patch(c.id, { clientProvided: v })} />
                    </div>
                  </Section>
                  )}
                  {tb(c) === 'result' && (<>
                  <Section title="Result">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{CONF_TESTS.map((t) => <div key={t} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{t}<Chip value={c.tests[t] === 'Not Applicable' ? 'Not provided' : c.tests[t]} /></div>)}</div>
                    {Object.entries(c.reasons).length > 0 && <div className="mt-4"><Flags flags={Object.entries(c.reasons).map(([k, v]) => `${k}: ${v}`)} /></div>}
                  </Section>
                  {c.type === 'Bank' && (
                    <Section title={`Bank statement cross-check (supporting document ${c.ref}-A)`} hint="Optional: tick it when you have the statement.">
                      {c.statement.auto ? (c.statement.has ? (
                        <div className="space-y-4"><p className="rounded-xl border border-emerald/30 bg-emerald/5 px-4 py-3 text-sm text-emerald">Taken from the bank statement the client uploaded{c.statement.fileName ? ` (${c.statement.fileName})` : ''}. Nothing to type.</p>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Opening balance" value={money(c.statement.opening)} /><Stat label="Money in (credits)" value={money(c.statement.credits)} /><Stat label="Money out (debits)" value={money(c.statement.debits)} /><Stat label="Closing balance" value={money(c.statement.closing)} /></div>
                          <Toggle label="Bank, account and details match the confirmation" checked={c.statement.bankMatches} onChange={(v) => patch(c.id, { statement: { ...c.statement, bankMatches: v } })} /></div>
                      ) : <p className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm text-amber">The client has not uploaded the bank statements yet. They appear here by themselves once uploaded; nothing needs to be typed.</p>) : <>
                      <Toggle label="Statement available" checked={c.statement.has} onChange={(v) => patch(c.id, { statement: { ...c.statement, has: v } })} />
                      {c.statement.has && <div className="mt-4"><FieldGrid>
                        {[['fileName', 'Statement file name', 'text'], ['opening', 'Opening balance', 'number'], ['credits', 'Credits', 'number'], ['debits', 'Debits', 'number'], ['closing', 'Closing balance', 'number']].map(([k, l, t]) => <Field key={k} label={l}><input aria-label={l} type={t} value={c.statement[k]} onChange={(e) => patch(c.id, { statement: { ...c.statement, [k]: e.target.value } })} className={INPUT} /></Field>)}
                        <div className="flex items-end"><Toggle label="Bank, account and details match the confirmation" checked={c.statement.bankMatches} onChange={(v) => patch(c.id, { statement: { ...c.statement, bankMatches: v } })} /></div>
                      </FieldGrid></div>}</>}
                      {c.stm && <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy">Opening + credits − debits = {c.stm.calculated.toFixed(2)} (difference {c.stm.diff.toFixed(2)}). Closing agrees to the confirmation: <b>{c.stm.closeToConfirm ? 'Yes' : 'No'}</b>; to the trial balance: <b>{c.stm.closeToTb ? 'Yes' : 'No'}</b>.</p>}
                    </Section>
                  )}
                  {c.type === 'Cash' && (
                    <Section title="Cash count by denomination" hint="Enter how many notes of each kind were counted.">
                      <div className="flex flex-wrap items-end gap-4">{c.denominations.map((dn, i) => <Field key={i} label={`${dn.denomination} ×`}><input aria-label={`Quantity of ${dn.denomination}`} type="number" value={dn.quantity} onChange={(e) => patch(c.id, { denominations: c.denominations.map((x, k) => (k === i ? { ...x, quantity: e.target.value } : x)) })} className={`${INPUT} w-28`} /></Field>)}
                        <p className="pb-2.5 text-sm text-navy">Total <b>{c.den.total.toFixed(2)}</b> · difference <b>{c.den.diff.toFixed(2)}</b></p></div>
                    </Section>
                  )}
                  {c.flags.length > 0 && <Flags flags={c.flags} />}
                  </>)}
                </>)}
                <div className="flex justify-end"><button onClick={() => { setItems((l) => l.filter((x) => x.id !== c.id)); setOpenId(null) }} aria-label="Remove confirmation" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-alert-red"><Trash2 className="h-4 w-4" />Remove this confirmation</button></div>
              </div>
            )}
          </div>
        )
      })}

      {rows.length > 0 && (
        <Card title="Review status">
          <div className="flex flex-wrap items-center gap-4"><Chip value={completion.complete ? 'Pass' : 'Fail'} /><span className="text-base font-semibold text-navy">{completion.status}</span>
            <PrimaryButton onClick={download} className="ml-auto"><Download className="h-4 w-4" />Download the workbook</PrimaryButton></div>
          {!completion.complete && <Flags flags={completion.blockers} />}
          <p className="text-xs text-slate-400">PDF stamping of the Ref. No. on audit copies and renaming to "Ref. No. - Description.pdf" are not done in the app yet; the client's originals are never changed.</p>
        </Card>
      )}
    </div>
  )
}
