import { useMemo, useState } from 'react'
import AutoDemo from './AutoDemo'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Card, Chip, Flags } from './ReviewParts'
import { useToast } from '../shared/Toast'
import { logEvent } from '../../utils/auditLog'
import { currentUser } from '../../utils/currentUser'
import { workbookToBlob } from '../../utils/eosbExcel'
import { CONF_TESTS, confirmationTests, confirmationOverall, bankStatementRecon, denominationCheck, confirmationCompletion, overallColour, nextRef } from '../../utils/vouching'
import { buildConfirmationWorkbook } from '../../utils/vouchingExcel'

const INP = 'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-navy'
const blank = (type) => ({ id: Math.random().toString(36).slice(2), type, available: true, label: '', fileName: '', tbAmount: '', amount: '', asAt: '', clientName: '', bankName: '', tbBank: '', sealPresent: false, signaturePresent: false, eGenerated: false, digitalMark: false, letterhead: false, sigIllegible: false, letterheadIllegible: false, clientProvided: true, statement: { has: false, fileName: '', opening: '', credits: '', debits: '', closing: '', bankMatches: true }, denominations: [{ denomination: 500, quantity: '' }, { denomination: 100, quantity: '' }, { denomination: 50, quantity: '' }], remarks: '' })
const DEMO = [
  { ...blank('Bank'), label: 'Al Rajhi Bank – current account', fileName: 'alrajhi_conf.pdf', tbAmount: 482500.5, amount: 482500.5, asAt: '2025-12-31', clientName: 'Demo Trading Company', bankName: 'Al Rajhi Bank', tbBank: 'Al Rajhi Bank – current account', sealPresent: true, signaturePresent: true, letterhead: true, statement: { has: true, fileName: 'alrajhi_stmt.pdf', opening: 400000, credits: 120000.5, debits: 37500, closing: 482500.5, bankMatches: true } },
  { ...blank('Bank'), label: 'SNB – savings', fileName: 'snb.pdf', tbAmount: 90000, amount: 88500, asAt: '2025-11-30', clientName: 'Demo Trading Co.', bankName: 'SNB', tbBank: 'SNB savings', sealPresent: true, signaturePresent: false, letterhead: true },
  { ...blank('Cash'), label: 'Cash on hand', fileName: 'cash_count.pdf', tbAmount: 12600, amount: 12600, asAt: '2025-12-31', clientName: 'Demo Trading Company', sealPresent: true, signaturePresent: true, letterhead: true, denominations: [{ denomination: 500, quantity: 20 }, { denomination: 100, quantity: 25 }, { denomination: 50, quantity: 2 }] },
]
const Check = ({ label, checked, onChange }) => <label className="flex items-center gap-1 text-xs text-navy"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 accent-navy" />{label}</label>

export default function ConfirmationTab({ client, clientName, legalName: initialLegal = '' }) {
  const showToast = useToast(); const me = currentUser()
  const [legalName, setLegalName] = useState(initialLegal || clientName || ''); const [yearEnd, setYearEnd] = useState('2025-12-31')
  const [items, setItems] = useState([]); const patch = (id, p) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const rows = useMemo(() => {
    const issued = []
    return items.map((c) => {
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
  }, [items, legalName, yearEnd])
  const completion = confirmationCompletion({ confirmations: rows, logComplete: rows.length > 0 })
  const docLog = rows.flatMap((c) => [{ ref: c.ref, fileName: c.fileName, description: `${c.type} confirmation`, amount: c.amount === '' ? null : Number(c.amount), comparedWith: c.tbAmount === '' ? null : Number(c.tbAmount), check: c.type === 'Cash' ? 'Denominations re-added' : 'Cross-verified with bank statement' }, ...(c.type === 'Bank' && c.statement.has ? [{ ref: `${c.ref}-A`, fileName: c.statement.fileName, description: 'Bank statement', amount: Number(c.statement.closing), comparedWith: Number(c.amount), check: `Opening + credits − debits = ${c.stm?.calculated?.toFixed(2)}` }] : [])])
  const download = async () => {
    const wb = await buildConfirmationWorkbook({ confirmations: rows, docLog, client: clientName, yearEnd: yearEnd.split('-').reverse().join('-'), prepared: { preparedBy: me.name } })
    const url = URL.createObjectURL(await workbookToBlob(wb)); const a = document.createElement('a'); a.href = url; a.download = 'Cash_Bank_Confirmation.xlsx'; a.click(); URL.revokeObjectURL(url); showToast('Workbook downloaded')
    logEvent({ client, clientName, category: 'work', title: 'Cash and bank confirmation workbook prepared', description: `${rows.length} confirmations, status ${completion.status}`, extra: { auditArea: 'Cash and bank', performedBy: me.name }, user: me })
  }
  return (
    <div className="space-y-3">
      <Card title="Engagement">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-[11px] font-semibold uppercase text-slate-500">Client legal name (tested exactly, ignoring case and spaces)<input aria-label="Client legal name" value={legalName} onChange={(e) => setLegalName(e.target.value)} className={`${INP} mt-1 w-full font-normal normal-case`} /></label>
          <label className="text-[11px] font-semibold uppercase text-slate-500">Year-end (from the TB, or the engagement letter)<input aria-label="Year-end" type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} className={`${INP} mt-1 w-full font-normal`} /></label>
        </div>
      </Card>
      <Card title="Confirmations" right={<div className="flex gap-3"><button onClick={() => setItems(DEMO.map((d) => ({ ...d, id: Math.random().toString(36).slice(2) })))} className="text-xs font-semibold text-slate-500 underline">Use demo data</button><button onClick={() => setItems((l) => [...l, blank('Bank')])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><Plus className="h-3 w-3" />Bank</button><button onClick={() => setItems((l) => [...l, blank('Cash')])} className="inline-flex items-center gap-1 text-xs font-semibold text-navy"><Plus className="h-3 w-3" />Cash</button></div>}><AutoDemo run={() => setItems(DEMO.map((d) => ({ ...d, id: Math.random().toString(36).slice(2) })))} />
        {rows.length === 0 && <p className="text-xs text-slate-400">No confirmations yet. Ref. Nos. are assigned in the order they are added: 5001.xx for cash, 5002.xx for bank.</p>}
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">{c.ref || 'No Ref. No.'}</span><span className="text-xs font-semibold text-slate-500">{c.type}</span>
                <input aria-label="Description" placeholder="Description" value={c.label} onChange={(e) => patch(c.id, { label: e.target.value })} className={`${INP} w-48`} />
                <input aria-label="Client file name" placeholder="Client file name" value={c.fileName} onChange={(e) => patch(c.id, { fileName: e.target.value })} className={`${INP} w-44`} />
                <Check label="Confirmation received" checked={c.available} onChange={(v) => patch(c.id, { available: v })} />
                <Chip value={c.overall === 'Confirmed / Matched' ? 'Pass' : /Unable|Not Available/.test(c.overall) ? 'Unclear' : 'Fail'} /><span className="text-xs font-semibold text-navy">{c.overall}</span>
                <button aria-label="Remove confirmation" onClick={() => setItems((l) => l.filter((x) => x.id !== c.id))} className="ml-auto rounded p-1 text-slate-400 hover:text-alert-red"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {c.available && (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input aria-label="TB amount" type="number" placeholder="TB amount" value={c.tbAmount} onChange={(e) => patch(c.id, { tbAmount: e.target.value })} className={`${INP} w-36`} />
                    <input aria-label="Confirmed amount" type="number" placeholder="Confirmed amount" value={c.amount} onChange={(e) => patch(c.id, { amount: e.target.value })} className={`${INP} w-40`} />
                    <input aria-label="As at date" type="date" value={c.asAt} onChange={(e) => patch(c.id, { asAt: e.target.value })} className={`${INP} w-40`} />
                    <input aria-label="Client name on the confirmation" placeholder="Client name on the confirmation" value={c.clientName} onChange={(e) => patch(c.id, { clientName: e.target.value })} className={`${INP} w-60`} />
                    {c.type === 'Bank' && <><input aria-label="Bank on the confirmation" placeholder="Bank on the confirmation" value={c.bankName} onChange={(e) => patch(c.id, { bankName: e.target.value })} className={`${INP} w-44`} /><input aria-label="Bank in the TB description" placeholder="Bank in the TB description" value={c.tbBank} onChange={(e) => patch(c.id, { tbBank: e.target.value })} className={`${INP} w-52`} /></>}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Check label={c.type === 'Cash' ? 'Company seal present' : 'Bank stamp present'} checked={c.sealPresent} onChange={(v) => patch(c.id, { sealPresent: v })} />
                    <Check label="Authorised signature present" checked={c.signaturePresent} onChange={(v) => patch(c.id, { signaturePresent: v })} />
                    {c.type === 'Bank' && <><Check label="e-generated, no signature required" checked={c.eGenerated} onChange={(v) => patch(c.id, { eGenerated: v })} /><Check label="Digital verification mark" checked={c.digitalMark} onChange={(v) => patch(c.id, { digitalMark: v })} /></>}
                    <Check label={c.type === 'Cash' ? 'On client letterhead' : 'On bank letterhead / official form'} checked={c.letterhead} onChange={(v) => patch(c.id, { letterhead: v })} />
                    <Check label="Signature / seal illegible or covered" checked={c.sigIllegible} onChange={(v) => patch(c.id, { sigIllegible: v })} />
                    <Check label="Provided by the client" checked={c.clientProvided} onChange={(v) => patch(c.id, { clientProvided: v })} />
                  </div>
                  <div className="flex flex-wrap gap-2">{CONF_TESTS.map((t) => <span key={t} className="text-[11px] text-slate-500">{t}: <Chip value={c.tests[t] === 'Not Applicable' ? 'Not provided' : c.tests[t]} /></span>)}</div>
                  {Object.entries(c.reasons).length > 0 && <Flags flags={Object.entries(c.reasons).map(([k, v]) => `${k}: ${v}`)} />}
                  {c.type === 'Bank' && (
                    <details><summary className="cursor-pointer text-xs font-semibold text-navy">Bank statement cross-verification (supporting document {c.ref}-A)</summary>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Check label="Statement available" checked={c.statement.has} onChange={(v) => patch(c.id, { statement: { ...c.statement, has: v } })} />
                        {c.statement.has && <>{[['fileName', 'Statement file name', 'text'], ['opening', 'Opening balance', 'number'], ['credits', 'Credits', 'number'], ['debits', 'Debits', 'number'], ['closing', 'Closing balance', 'number']].map(([k, l, t]) => <input key={k} aria-label={l} type={t} placeholder={l} value={c.statement[k]} onChange={(e) => patch(c.id, { statement: { ...c.statement, [k]: e.target.value } })} className={`${INP} w-36`} />)}
                          <Check label="Bank, account and details match the confirmation" checked={c.statement.bankMatches} onChange={(v) => patch(c.id, { statement: { ...c.statement, bankMatches: v } })} /></>}
                      </div>
                      {c.stm && <p className="mt-1 text-xs text-navy">Opening + credits − debits = {c.stm.calculated.toFixed(2)} (difference {c.stm.diff.toFixed(2)}); closing agrees to confirmation: {c.stm.closeToConfirm ? 'Yes' : 'No'}; to TB: {c.stm.closeToTb ? 'Yes' : 'No'}.</p>}
                    </details>
                  )}
                  {c.type === 'Cash' && (
                    <details open><summary className="cursor-pointer text-xs font-semibold text-navy">Cash denominations</summary>
                      <div className="mt-2 flex flex-wrap items-center gap-2">{c.denominations.map((d, i) => <span key={i} className="flex items-center gap-1 text-xs text-slate-500">{d.denomination} ×<input aria-label={`Quantity of ${d.denomination}`} type="number" value={d.quantity} onChange={(e) => patch(c.id, { denominations: c.denominations.map((x, k) => (k === i ? { ...x, quantity: e.target.value } : x)) })} className={`${INP} w-20`} /></span>)}
                        <span className="text-xs text-navy">Total {c.den.total.toFixed(2)} · difference {c.den.diff.toFixed(2)}</span></div>
                    </details>
                  )}
                  {c.flags.length > 0 && <Flags flags={c.flags} />}
                </div>
              )}
            </div>
          ))}
        </div>
        {rows.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-navy">Review status: <Chip value={completion.complete ? 'Pass' : 'Fail'} /> <b>{completion.status}</b></span>
            <button onClick={download} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white"><Download className="h-3.5 w-3.5" />Download the workbook</button>
          </div>
        )}
        {!completion.complete && rows.length > 0 && <div className="mt-2"><Flags flags={completion.blockers} /></div>}
        <p className="mt-2 text-xs text-slate-400">PDF stamping of the Ref. No. on audit copies and renaming to "Ref. No. - Description.pdf" are not done in the app yet; the client's originals are never changed.</p>
        {overallColour('x') && null}
      </Card>
    </div>
  )
}
