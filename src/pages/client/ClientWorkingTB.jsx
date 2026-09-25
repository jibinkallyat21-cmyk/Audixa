import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Download, CheckCircle2, XCircle, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, Calculator } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { useTB } from '../../context/TBContext'
import { calculateZakat } from '../../utils/zakatCalculator'
import { useClientFY } from '../../context/ClientFYContext'
import { useTheme } from '../../context/ThemeContext'

function fmt(n) {
  if (n === 0 || n === undefined) return '—'
  const abs = Math.abs(n)
  const str = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `(${str})` : str
}

function getClosingBalance(line) {
  return (
    line.openingBalance +
    line.currentYearDebit -
    line.currentYearCredit +
    (line.adjustmentDebit || 0) -
    (line.adjustmentCredit || 0)
  )
}

function TBTable({ lines }) {
  const [showHint, setShowHint] = useState(true)
  const { isDark } = useTheme()

  const categories = [...new Set(lines.map((l) => l.category))]

  return (
    <div className="relative">
      <div
        className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm"
        onScroll={() => setShowHint(false)}
      >
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2.5 text-left font-medium w-20">Code</th>
              <th className="px-3 py-2.5 text-left font-medium">Ledger Name</th>
              <th className="px-3 py-2.5 text-right font-medium w-32">Opening Balance</th>
              <th className="px-3 py-2.5 text-right font-medium w-28 text-emerald">Transactions In</th>
              <th className="px-3 py-2.5 text-right font-medium w-28 text-alert-red">Transactions Out</th>
              <th className="px-3 py-2.5 text-right font-medium w-24" style={{ color: '#7C3AED' }}>Auditor Additions</th>
              <th className="px-3 py-2.5 text-right font-medium w-24" style={{ color: '#7C3AED' }}>Auditor Reductions</th>
              <th className="px-3 py-2.5 text-right font-medium w-32 text-navy">Your Balance</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const catLines = lines.filter((l) => l.category === cat)
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
                <tr key={`cat-${cat}`} className={isDark ? 'bg-slate-800' : 'bg-slate-200'}>
                  <td colSpan={7} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-700'}`}>{cat}</td>
                  <td className={`px-3 py-2 text-right font-bold font-mono text-[10px] ${isDark ? 'text-white' : 'text-slate-700'}`}>{fmt(subtotals.cl)}</td>
                </tr>,
                ...catLines.map((line) => {
                  const cb = getClosingBalance(line)
                  const hasAdj = (line.adjustmentDebit || 0) + (line.adjustmentCredit || 0) > 0
                  return (
                    <tr key={line.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 ${hasAdj ? 'border-l-2 border-l-purple-500' : ''}`}>
                      <td className="px-3 py-3 font-mono text-slate-400">{line.ledgerCode}</td>
                      <td className="px-3 py-3 font-medium text-navy">
                        {line.ledgerName}
                        {hasAdj && (
                          <span className="ml-2 rounded-sm bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-600">ADJ</span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-right font-mono ${line.openingBalance < 0 ? 'text-alert-red' : 'text-navy'}`}>{fmt(line.openingBalance)}</td>
                      <td className="px-3 py-3 text-right font-mono text-emerald">{fmt(line.currentYearDebit)}</td>
                      <td className="px-3 py-3 text-right font-mono text-alert-red">{fmt(line.currentYearCredit)}</td>
                      <td className="px-3 py-3 text-right font-mono" style={{ color: '#7C3AED' }}>{fmt(line.adjustmentDebit || 0)}</td>
                      <td className="px-3 py-3 text-right font-mono italic" style={{ color: '#7C3AED' }}>{fmt(line.adjustmentCredit || 0)}</td>
                      <td className={`px-3 py-3 text-right font-mono font-bold ${cb < 0 ? 'text-alert-red' : 'text-navy'}`}>{fmt(cb)}</td>
                    </tr>
                  )
                }),
              ]
            })}
            {/* Grand total */}
            <tr className={isDark ? 'bg-navy text-white' : 'bg-slate-600 text-white'}>
              <td colSpan={7} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">TOTAL</td>
              <td className="px-3 py-3 text-right font-mono font-bold">
                {fmt(lines.reduce((s, l) => s + getClosingBalance(l), 0))}
                <span className="ml-2 rounded-sm bg-emerald/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald">Balanced ✓</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {showHint && (
        <p className="mt-1 text-center text-[11px] text-slate-400 sm:hidden">← scroll to see all columns →</p>
      )}
    </div>
  )
}

function AdjustmentCard({ adj, onApprove, onReject }) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')

  const impactEntry = adj.entries[1] // credit side = usually the impacted account

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <span className="font-mono text-sm font-bold text-purple-700">{adj.adjustmentRef}</span>
          <p className="text-xs text-slate-500 mt-0.5">{adj.date} · Posted by {adj.postedBy}</p>
        </div>
        <span className="rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 text-xs font-semibold text-amber">Awaiting Your Review</span>
      </div>

      <p className="text-sm text-navy mb-3">{adj.description}</p>

      {/* Journal entry mini table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2 text-left font-medium">Account</th>
              <th className="px-3 py-2 text-right font-medium text-emerald">Additions</th>
              <th className="px-3 py-2 text-right font-medium text-alert-red">Reductions</th>
            </tr>
          </thead>
          <tbody>
            {adj.entries.map((e, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0">
                <td className="px-3 py-2 font-medium text-navy">{e.ledgerName}</td>
                <td className="px-3 py-2 text-right font-mono text-emerald">{e.debit > 0 ? `SAR ${e.debit.toLocaleString()}` : '—'}</td>
                <td className="px-3 py-2 text-right font-mono text-alert-red">{e.credit > 0 ? `SAR ${e.credit.toLocaleString()}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional comment */}
      {!noteOpen && (
        <button onClick={() => setNoteOpen(true)} className="mb-3 text-xs text-slate-400 underline hover:text-navy">Add a comment (optional)</button>
      )}
      {noteOpen && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a comment for your auditor..."
          rows={2}
          className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy resize-none"
        />
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onApprove(adj.id, note)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald py-2.5 text-sm font-semibold text-white hover:bg-emerald/90"
        >
          <CheckCircle2 className="h-4 w-4" /> Approve This Adjustment
        </button>
        <button
          onClick={() => onReject(adj.id, note)}
          className="flex items-center gap-2 rounded-lg border border-alert-red px-4 py-2.5 text-sm font-semibold text-alert-red hover:bg-red-50"
        >
          <XCircle className="h-4 w-4" /> Reject
        </button>
      </div>
    </div>
  )
}

function ZakatCard({ tbLines }) {
  const showToast = useToast()
  const { selectedFY } = useClientFY()
  const [ownership, setOwnership] = useState(100)
  const [result, setResult] = useState(() => calculateZakat(tbLines, { saudiGCCOwnershipPercentage: 100 }))

  const recalculate = () => {
    const r = calculateZakat(tbLines, { saudiGCCOwnershipPercentage: ownership })
    setResult(r)
    showToast(`Estimated Zakat calculated: SAR ${r.estimatedZakatPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  }

  const sarFormatted = result.estimatedZakatPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="rounded-xl border-l-4 border-l-emerald border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-emerald" />
        <h2 className="text-base font-bold text-navy">Estimated Zakat Payable — {selectedFY}</h2>
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Saudi / GCC Ownership Percentage
          <span className="ml-1 font-normal text-slate-400">— What percentage of your company is owned by Saudi or GCC nationals?</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={100}
            value={ownership}
            onChange={(e) => setOwnership(Math.min(100, Math.max(0, Number(e.target.value))))}
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-navy outline-none focus:border-emerald"
          />
          <span className="text-sm font-semibold text-slate-500">%</span>
          <button onClick={recalculate} className="flex items-center gap-1.5 rounded-lg border border-emerald px-4 py-2 text-sm font-semibold text-emerald hover:bg-emerald/5">
            <RefreshCw className="h-3.5 w-3.5" /> Recalculate
          </button>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs font-medium text-slate-400 mb-1">Estimated Zakat</p>
        <p className="text-4xl font-black text-emerald">SAR {sarFormatted}</p>
        <p className="text-xs text-slate-400 mt-1">Based on your {selectedFY} trial balance figures</p>
      </div>

      {/* Mandatory disclaimer */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber/30 bg-amber/5 px-4 py-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
        <div className="text-xs text-amber leading-relaxed">
          <strong>Important Notice —</strong> This is an estimated Zakat liability calculated from your working trial balance. This estimate is provided for planning purposes only. The actual Zakat payable is determined by the General Authority of Zakat and Tax (ZATCA) at the time of official filing and may differ significantly from this estimate based on ZATCA assessments, disallowances, and adjustments. Please consult your Analytix audit team for the final confirmed amount.
        </div>
      </div>
    </div>
  )
}

export default function ClientWorkingTB() {
  const showToast = useToast()
  const { tbLines, adjustments, pendingAdjustments, tbUploaded, approveAdjustment, rejectAdjustment, uploadTB } = useTB()
  const { selectedFY } = useClientFY()
  const [reviewedExpanded, setReviewedExpanded] = useState(false)

  const reviewedAdjustments = adjustments.filter((a) => a.status !== 'Pending Client Approval')

  const handleApprove = (id, note) => {
    approveAdjustment(id, note)
    showToast('Adjustment approved — your trial balance has been updated')
  }

  const handleReject = (id, note) => {
    rejectAdjustment(id, note)
    showToast('Adjustment rejected — your auditor has been notified')
  }

  return (
    <ClientLayout title="Working Trial Balance">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">Working Trial Balance</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Al-Marai Logistics JSC — {selectedFY}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Last updated: Today 09:15 AM</span>
            </div>
          </div>

          {/* Pending adjustment banner */}
          {pendingAdjustments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 rounded-xl border border-amber/30 bg-amber/10 px-5 py-4"
            >
              <p className="text-sm font-medium text-amber">
                Your auditor has proposed {pendingAdjustments.length} adjustment {pendingAdjustments.length === 1 ? 'entry' : 'entries'} for your review. Please review and approve or reject each one.
              </p>
              <a href="#adjustments" className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]">
                Review Adjustments
              </a>
            </motion.div>
          )}

          {/* Download button */}
          <div className="flex justify-end">
            <button onClick={() => showToast('Downloading trial balance as Excel...')} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50">
              <Download className="h-4 w-4" /> Download as Excel
            </button>
          </div>

          {/* TB Table */}
          <TBTable lines={tbLines} />

          {/* Adjustments section */}
          <div id="adjustments">
            {pendingAdjustments.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-bold text-navy">
                  Proposed Adjustments — Awaiting Your Approval
                  <span className="ml-2 rounded-full bg-amber/20 px-2 py-0.5 text-sm text-amber">{pendingAdjustments.length}</span>
                </h2>
                {pendingAdjustments.map((adj) => (
                  <AdjustmentCard key={adj.id} adj={adj} onApprove={handleApprove} onReject={handleReject} />
                ))}
              </div>
            )}

            {reviewedAdjustments.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setReviewedExpanded((v) => !v)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-navy"
                >
                  {reviewedExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  Reviewed Adjustments ({reviewedAdjustments.length})
                </button>
                <AnimatePresence>
                  {reviewedExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 space-y-3"
                    >
                      {reviewedAdjustments.map((adj) => (
                        <div key={adj.id} className={`rounded-xl border px-5 py-3 ${adj.status === 'Approved by Client' ? 'border-emerald/30 bg-emerald/5' : 'border-slate-200 bg-slate-50'}`}>
                          <div className="flex items-center gap-3">
                            {adj.status === 'Approved by Client' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald" />
                            ) : (
                              <XCircle className="h-4 w-4 text-slate-400" />
                            )}
                            <span className="font-mono text-sm font-bold text-slate-600">{adj.adjustmentRef}</span>
                            <span className={`text-xs font-semibold ${adj.status === 'Approved by Client' ? 'text-emerald' : 'text-slate-400'}`}>{adj.status}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 ml-7">{adj.description}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Zakat Calculator */}
          <ZakatCard tbLines={tbLines} />
        </div>
      </PageTransition>
    </ClientLayout>
  )
}
