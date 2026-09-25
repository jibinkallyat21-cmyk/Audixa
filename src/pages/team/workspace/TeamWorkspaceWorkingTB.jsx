import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Plus, Minus, CheckCircle2, XCircle, Calculator, ChevronDown, RefreshCw, Download } from 'lucide-react'
import AuditTeamLayout from '../../../components/team/AuditTeamLayout'
import WorkspaceHeader from '../../../components/team/WorkspaceHeader'
import PageTransition from '../../../components/shared/PageTransition'
import { useToast } from '../../../components/shared/Toast'
import { useTB } from '../../../context/TBContext'
import { calculateZakat, ZAKAT_CLASSIFICATIONS, formatSAR } from '../../../utils/zakatCalculator'

function getClosingBalance(line) {
  return (
    line.openingBalance +
    line.currentYearDebit -
    line.currentYearCredit +
    (line.adjustmentDebit || 0) -
    (line.adjustmentCredit || 0)
  )
}

function fmt(n) {
  if (n === 0 || n === undefined) return '—'
  const abs = Math.abs(n)
  const str = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `(${str})` : str
}

const CATEGORIES = ['All', 'Assets', 'Liabilities', 'Equity', 'Income', 'Expenses']

function categorizeFilter(cat) {
  if (['Current Assets', 'Non-Current Assets'].includes(cat)) return 'Assets'
  if (['Current Liabilities', 'Non-Current Liabilities'].includes(cat)) return 'Liabilities'
  if (['Equity'].includes(cat)) return 'Equity'
  if (['Revenue'].includes(cat)) return 'Income'
  if (['Cost of Sales', 'Operating Expenses', 'Finance Costs'].includes(cat)) return 'Expenses'
  return 'Other'
}

function TBStaffTable({ lines, onAddAdj, filter, search, reclassifyLine }) {
  const categories = [...new Set(lines.map((l) => l.category))]

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-xs whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
            <th className="px-3 py-2.5 text-left font-medium w-20">Code</th>
            <th className="px-3 py-2.5 text-left font-medium">Ledger Name</th>
            <th className="px-3 py-2.5 text-left font-medium w-36">Zakat Class</th>
            <th className="px-3 py-2.5 text-right font-medium w-28">Opening</th>
            <th className="px-3 py-2.5 text-right font-medium w-24 text-emerald">Debit</th>
            <th className="px-3 py-2.5 text-right font-medium w-24 text-alert-red">Credit</th>
            <th className="px-3 py-2.5 text-right font-medium w-20" style={{ color: '#7C3AED' }}>Adj Dr</th>
            <th className="px-3 py-2.5 text-right font-medium w-20" style={{ color: '#7C3AED' }}>Adj Cr</th>
            <th className="px-3 py-2.5 text-right font-medium w-28 text-navy font-bold">Closing</th>
            <th className="px-3 py-2.5 text-center w-16"></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const catFilter = categorizeFilter(cat)
            if (filter !== 'All' && catFilter !== filter) return null

            const catLines = lines.filter(
              (l) =>
                l.category === cat &&
                (search === '' || l.ledgerName.toLowerCase().includes(search.toLowerCase()) || l.ledgerCode.includes(search))
            )
            if (catLines.length === 0) return null

            const subtotals = catLines.reduce(
              (acc, l) => ({
                ob: acc.ob + l.openingBalance,
                dr: acc.dr + l.currentYearDebit,
                cr: acc.cr + l.currentYearCredit,
                adjDr: acc.adjDr + (l.adjustmentDebit || 0),
                adjCr: acc.adjCr + (l.adjustmentCredit || 0),
                cl: acc.cl + getClosingBalance(l),
              }),
              { ob: 0, dr: 0, cr: 0, adjDr: 0, adjCr: 0, cl: 0 }
            )

            return [
              <tr key={`cat-${cat}`} className="bg-slate-800">
                <td colSpan={8} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white">{cat}</td>
                <td className="px-3 py-2 text-right font-bold text-white font-mono">{fmt(subtotals.cl)}</td>
                <td />
              </tr>,
              ...catLines.map((line) => {
                const cb = getClosingBalance(line)
                const hasAdj = (line.adjustmentDebit || 0) + (line.adjustmentCredit || 0) > 0
                return (
                  <tr key={line.id} className={`group border-b border-slate-50 last:border-0 hover:bg-slate-50 ${hasAdj ? 'border-l-2 border-l-purple-500' : ''}`}>
                    <td className="px-3 py-3 font-mono text-slate-400">{line.ledgerCode}</td>
                    <td className="px-3 py-3 font-medium text-navy">
                      {line.ledgerName}
                      {hasAdj && <span className="ml-2 rounded-sm bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-600">ADJ</span>}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={line.zakatClassification}
                        onChange={(e) => reclassifyLine(line.ledgerCode, e.target.value)}
                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 outline-none"
                      >
                        {ZAKAT_CLASSIFICATIONS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`px-3 py-3 text-right font-mono ${line.openingBalance < 0 ? 'text-alert-red' : 'text-navy'}`}>{fmt(line.openingBalance)}</td>
                    <td className="px-3 py-3 text-right font-mono text-emerald">{fmt(line.currentYearDebit)}</td>
                    <td className="px-3 py-3 text-right font-mono text-alert-red">{fmt(line.currentYearCredit)}</td>
                    <td className="px-3 py-3 text-right font-mono" style={{ color: '#7C3AED' }}>{fmt(line.adjustmentDebit || 0)}</td>
                    <td className="px-3 py-3 text-right font-mono italic" style={{ color: '#7C3AED' }}>{fmt(line.adjustmentCredit || 0)}</td>
                    <td className={`px-3 py-3 text-right font-mono font-bold ${cb < 0 ? 'text-alert-red' : 'text-navy'}`}>{fmt(cb)}</td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => onAddAdj(line)}
                        className="rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-navy"
                        title="Add adjustment on this line"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              }),
            ]
          })}
          <tr className="bg-navy text-white">
            <td colSpan={8} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">TOTAL</td>
            <td className="px-3 py-3 text-right font-mono font-bold">
              {fmt(lines.reduce((s, l) => s + getClosingBalance(l), 0))}
              <span className="ml-2 rounded-sm bg-emerald/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald">Balanced ✓</span>
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function LedgerSearch({ value, ledgerName, onSelect, tbLines }) {
  const [query, setQuery] = useState(ledgerName || '')
  const [open, setOpen] = useState(false)

  const filtered = query.length >= 1
    ? tbLines.filter(
        (l) =>
          l.ledgerName.toLowerCase().includes(query.toLowerCase()) ||
          l.ledgerCode.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 7)
    : []

  const handleSelect = (l) => {
    setQuery(l.ledgerName)
    setOpen(false)
    onSelect(l.ledgerCode, l.ledgerName)
  }

  return (
    <div className="relative col-span-6">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search ledger name..."
        className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-navy"
      />
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 top-full z-20 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            {filtered.map((l) => (
              <button
                key={l.ledgerCode}
                onMouseDown={() => handleSelect(l)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50"
              >
                <span className="w-16 shrink-0 font-mono text-slate-400">{l.ledgerCode}</span>
                <span className="truncate text-navy">{l.ledgerName}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PostAdjModal({ prefillLine, onPost, onClose, tbLines }) {
  const showToast = useToast()
  const [description, setDescription] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState([
    { ledgerCode: prefillLine?.ledgerCode || '', ledgerName: prefillLine?.ledgerName || '', debit: '', credit: '' },
    { ledgerCode: '', ledgerName: '', debit: '', credit: '' },
  ])

  const adjRef = `ADJ-${String(Date.now()).slice(-3)}`

  function updateEntry(idx, field, value) {
    setEntries((prev) =>
      prev.map((e, i) => (i !== idx ? e : { ...e, [field]: value }))
    )
  }

  function setLedger(idx, code, name) {
    setEntries((prev) =>
      prev.map((e, i) => (i !== idx ? e : { ...e, ledgerCode: code, ledgerName: name }))
    )
  }

  const drTotal = entries.reduce((s, e) => s + (parseFloat(e.debit) || 0), 0)
  const crTotal = entries.reduce((s, e) => s + (parseFloat(e.credit) || 0), 0)
  const balanced = Math.abs(drTotal - crTotal) < 0.001 && drTotal > 0

  function handlePost() {
    if (!description || !balanced) return
    const newAdj = {
      id: `adj-${Date.now()}`,
      adjustmentRef: adjRef,
      date: new Date(entryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description,
      postedBy: 'Fahad Al-Otaibi',
      entries: entries
        .filter((e) => e.ledgerCode)
        .map((e) => ({
          ledgerCode: e.ledgerCode,
          ledgerName: e.ledgerName,
          debit: parseFloat(e.debit) || 0,
          credit: parseFloat(e.credit) || 0,
        })),
      status: 'Pending Client Approval',
      clientNote: '',
    }
    onPost(newAdj)
    showToast('Adjustment sent to client for approval')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Post Adjustment Entry</h2>
            <p className="mt-0.5 text-xs text-slate-400">Posted entry will be sent to client for approval before reflecting in WTB.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-navy"><Minus className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-6">
          {/* Ref + Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Adjustment Reference</label>
              <input value={adjRef} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Date of Entry</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Narration (plain language for client)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe this adjustment in plain language..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
            />
          </div>

          {/* Journal lines */}
          <div>
            <div className="mb-2 grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <span className="col-span-6">Ledger Name</span>
              <span className="col-span-2 text-emerald">Debit</span>
              <span className="col-span-2 text-alert-red">Credit</span>
              <span className="col-span-2" />
            </div>
            <div className="space-y-2">
              {entries.map((e, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <LedgerSearch
                    value={e.ledgerCode}
                    ledgerName={e.ledgerName}
                    onSelect={(code, name) => setLedger(i, code, name)}
                    tbLines={tbLines}
                  />
                  <input
                    value={e.debit}
                    onChange={(ev) => updateEntry(i, 'debit', ev.target.value)}
                    placeholder="0.00"
                    type="number"
                    className="col-span-2 rounded border border-emerald/40 px-2 py-1.5 text-xs text-emerald outline-none"
                  />
                  <input
                    value={e.credit}
                    onChange={(ev) => updateEntry(i, 'credit', ev.target.value)}
                    placeholder="0.00"
                    type="number"
                    className="col-span-2 rounded border border-alert-red/40 px-2 py-1.5 text-xs text-alert-red outline-none"
                  />
                  <button
                    onClick={() => setEntries((prev) => prev.filter((_, j) => j !== i))}
                    className="col-span-2 text-center text-slate-300 hover:text-red-400"
                  >
                    <Minus className="mx-auto h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEntries((prev) => [...prev, { ledgerCode: '', ledgerName: '', debit: '', credit: '' }])}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-navy hover:text-brand"
            >
              <Plus className="h-3 w-3" /> Add Line
            </button>
            <div className={`mt-2 text-xs font-semibold ${balanced ? 'text-emerald' : 'text-alert-red'}`}>
              {balanced ? '✓ Entry is balanced' : `Does not balance — Dr: ${drTotal.toLocaleString()}, Cr: ${crTotal.toLocaleString()}`}
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handlePost}
            disabled={!description || !balanced}
            className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35] disabled:opacity-50"
          >
            Post Adjustment
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ZakatStaffSection({ tbLines, reclassifyLine }) {
  const showToast = useToast()
  const [ownership, setOwnership] = useState(100)
  const [result, setResult] = useState(() => calculateZakat(tbLines, { saudiGCCOwnershipPercentage: 100 }))
  const [notesExpanded, setNotesExpanded] = useState(false)

  const recalculate = () => setResult(calculateZakat(tbLines, { saudiGCCOwnershipPercentage: ownership }))

  const sarFmt = (n) => `SAR ${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-5">
      {/* Ownership */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-navy mb-3">Ownership Structure</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Saudi / GCC Ownership %</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={100} value={ownership}
                onChange={(e) => setOwnership(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-navy"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Entity Type</label>
            <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">
              <option>Saudi LLC</option>
              <option>Mixed Company</option>
              <option>Branch</option>
            </select>
          </div>
          <button onClick={recalculate} className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]">
            <RefreshCw className="h-3.5 w-3.5" /> Calculate
          </button>
        </div>
      </div>

      {/* Sources table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-navy mb-3">Zakat Base — Sources</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
              <th className="pb-2 text-left font-medium">Component</th>
              <th className="pb-2 text-right font-medium">Amount (SAR)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Share Capital', result.sources.paidUpCapital],
              ['Retained Earnings', result.sources.retainedEarnings],
              ['Reserves', result.sources.reserves],
              ['Long-term Loans', result.sources.longTermLoans],
              ['Long-term Provisions', result.sources.longTermProvisions],
              ['Net Profit', result.sources.adjustedNetProfit],
            ].map(([label, val]) => (
              <tr key={label} className="border-b border-slate-50 last:border-0">
                <td className="py-2 text-slate-600">{label}</td>
                <td className="py-2 text-right font-mono font-medium text-navy">{sarFmt(val)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td className="py-2 font-bold text-navy">Total Sources</td>
              <td className="py-2 text-right font-mono font-bold text-navy">{sarFmt(result.sources.totalSources)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-navy mb-3">Zakat Base — Deductions</h3>
        <table className="w-full text-sm">
          <tbody>
            {[
              ['Fixed Assets (Net)', result.deductions.fixedAssetsNet],
              ['Long-term Investments', result.deductions.longTermInvestments],
              ['Intangibles', result.deductions.intangibles],
            ].map(([label, val]) => (
              <tr key={label} className="border-b border-slate-50 last:border-0">
                <td className="py-2 text-slate-600">{label}</td>
                <td className="py-2 text-right font-mono font-medium text-navy">{sarFmt(val)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td className="py-2 font-bold text-navy">Total Deductions</td>
              <td className="py-2 text-right font-mono font-bold text-navy">{sarFmt(result.deductions.totalDeductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Zakat Payable */}
      <div className="rounded-xl border-2 border-emerald/30 bg-emerald/5 p-5 shadow-sm">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-600">Full Zakat Base</span><span className="font-mono font-bold text-navy">{sarFmt(result.fullZakatBase)}</span></div>
          <div className="flex justify-between"><span className="text-slate-600">After Ownership ({ownership}%)</span><span className="font-mono font-bold text-navy">{sarFmt(result.zakatableBase)}</span></div>
          <div className="flex justify-between border-t border-emerald/20 pt-2"><span className="font-bold text-navy">Zakat Payable (× 2.5%)</span><span className="font-mono text-2xl font-black text-emerald">{sarFmt(result.estimatedZakatPayable)}</span></div>
        </div>
      </div>

      {/* Ledger Classification Review */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-navy mb-3">Ledger Classification Review</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="pb-2 text-left font-medium w-20">Code</th>
                <th className="pb-2 text-left font-medium">Ledger Name</th>
                <th className="pb-2 text-left font-medium w-44">Zakat Classification</th>
                <th className="pb-2 text-right font-medium w-28">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {tbLines.map((line) => (
                <tr key={line.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="py-2 font-mono text-slate-400">{line.ledgerCode}</td>
                  <td className="py-2 font-medium text-navy truncate max-w-[200px]">{line.ledgerName}</td>
                  <td className="py-2">
                    <select
                      value={line.zakatClassification}
                      onChange={(e) => reclassifyLine(line.ledgerCode, e.target.value)}
                      className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] outline-none"
                    >
                      {ZAKAT_CLASSIFICATIONS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className={`py-2 text-right font-mono ${getClosingBalance(line) < 0 ? 'text-alert-red' : 'text-navy'}`}>
                    {fmt(getClosingBalance(line))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export */}
      <button
        onClick={() => { showToast('Preparing workpaper...'); setTimeout(() => showToast('Zakat Workpaper exported successfully'), 2000) }}
        className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
      >
        <Download className="h-4 w-4" /> Export Zakat Workpaper (Excel)
      </button>

      {/* ZATCA Notes */}
      <div>
        <button onClick={() => setNotesExpanded((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-navy">
          <ChevronDown className={`h-4 w-4 transition-transform ${notesExpanded ? 'rotate-180' : ''}`} />
          ZATCA Reference Notes
        </button>
        <AnimatePresence>
          {notesExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2"
            >
              {[
                'Zakat rate: 2.5% per annum (Article 6, Saudi Zakat Bylaws)',
                'Zakat base uses net worth method per ZATCA standard assessment',
                'Mixed companies: Zakat applies to Saudi/GCC ownership percentage, income tax applies to foreign percentage',
                'Filing deadline: Within 3 months of fiscal year end (or 120 days for listed companies)',
                'Late filing penalty: SAR 1,000 minimum or 1% of Zakat due per month of delay',
                'This calculator does not account for ZATCA-specific disallowances which are assessed case by case',
              ].map((note, i) => (
                <p key={i} className="text-xs text-slate-600 flex gap-2"><span className="text-slate-400 shrink-0">·</span>{note}</p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const TABS = ['TB Table', 'Zakat Calculation']

export default function TeamWorkspaceWorkingTB() {
  const showToast = useToast()
  const { tbLines, adjustments, pendingAdjustments, postAdjustment, reclassifyLine } = useTB()
  const [activeTab, setActiveTab] = useState('TB Table')
  const [adjModal, setAdjModal] = useState(null) // null or prefill line
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  return (
    <AuditTeamLayout title="File Workspace">
      <PageTransition>
        <WorkspaceHeader fileSlug="al-marai" />

        <div className="space-y-5">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-slate-200">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === tab ? 'text-navy' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
                {tab === 'TB Table' && pendingAdjustments.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber/20 px-1.5 py-0.5 text-[10px] font-bold text-amber">{pendingAdjustments.length}</span>
                )}
                {activeTab === tab && (
                  <motion.div layoutId="staff-tb-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-brand" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'TB Table' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setFilter(c)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${filter === c ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{c}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ledger..."
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-navy w-44"
                  />
                  <button
                    onClick={() => setAdjModal({})}
                    className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]"
                  >
                    <Plus className="h-4 w-4" /> Post Adjustment Entry
                  </button>
                  <button onClick={() => showToast('Downloading trial balance...')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-navy hover:bg-slate-50">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Adjustment status summary */}
              {pendingAdjustments.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm">
                  <span className="text-amber font-semibold">{pendingAdjustments.length} adjustment{pendingAdjustments.length > 1 ? 's' : ''} pending client approval</span>
                  <span className="text-slate-400 text-xs ml-2">Client will see a notification on their portal</span>
                </div>
              )}

              <TBStaffTable lines={tbLines} onAddAdj={(line) => setAdjModal(line)} filter={filter} search={search} reclassifyLine={reclassifyLine} />

              {/* Adjustments list */}
              {adjustments.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-navy mb-3">Posted Adjustments</h3>
                  <div className="space-y-2">
                    {adjustments.map((adj) => (
                      <div key={adj.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${adj.status === 'Approved by Client' ? 'border-emerald/30 bg-emerald/5' : adj.status === 'Rejected by Client' ? 'border-slate-200 bg-slate-50' : 'border-amber/30 bg-amber/5'}`}>
                        {adj.status === 'Approved by Client' ? <CheckCircle2 className="h-4 w-4 text-emerald shrink-0" /> : adj.status === 'Rejected by Client' ? <XCircle className="h-4 w-4 text-slate-400 shrink-0" /> : <Upload className="h-4 w-4 text-amber shrink-0" />}
                        <span className="font-mono text-sm font-bold text-slate-600">{adj.adjustmentRef}</span>
                        <span className="text-sm text-slate-600 flex-1 truncate">{adj.description}</span>
                        <span className={`text-xs font-semibold ${adj.status === 'Approved by Client' ? 'text-emerald' : adj.status === 'Rejected by Client' ? 'text-slate-400' : 'text-amber'}`}>{adj.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Zakat Calculation' && (
            <ZakatStaffSection tbLines={tbLines} reclassifyLine={reclassifyLine} />
          )}
        </div>
      </PageTransition>

      <AnimatePresence>
        {adjModal !== null && (
          <PostAdjModal
            prefillLine={adjModal}
            tbLines={tbLines}
            onPost={postAdjustment}
            onClose={() => setAdjModal(null)}
          />
        )}
      </AnimatePresence>
    </AuditTeamLayout>
  )
}
