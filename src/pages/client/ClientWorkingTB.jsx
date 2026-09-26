import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Download, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertTriangle, X } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { useTB } from '../../context/TBContext'
import { useClientFY } from '../../context/ClientFYContext'
import { useTheme } from '../../context/ThemeContext'

const D = {
  card: 'var(--c-card)',
  border: 'var(--c-border)',
  text: 'var(--c-text)',
  muted: 'var(--c-muted)',
  subtle: 'var(--c-subtle)',
  page: 'var(--c-page)',
}

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

/* ─── WTB Table with proper column headers ─── */
function TBTable({ lines }) {
  const [showHint, setShowHint] = useState(true)
  const { isDark } = useTheme()

  const categories = [...new Set(lines.map((l) => l.category))]
  const headerBg = isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC'
  const catBg = isDark ? 'rgba(255,255,255,0.06)' : '#EFF6FF'
  const catText = isDark ? 'rgba(255,255,255,0.7)' : '#1E40AF'
  const rowHover = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'

  return (
    <div className="relative">
      <div
        className="overflow-x-auto rounded-xl shadow-sm"
        style={{ border: `1px solid ${D.border}` }}
        onScroll={() => setShowHint(false)}
      >
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide" style={{ background: headerBg, borderBottom: `1px solid ${D.border}` }}>
              <th className="px-3 py-2.5 text-left font-medium w-20" style={{ color: D.subtle }}>Code</th>
              <th className="px-3 py-2.5 text-left font-medium" style={{ color: D.subtle }}>Ledger Name</th>
              <th className="px-3 py-2.5 text-right font-medium w-32" style={{ color: D.text }}>Opening Balance</th>
              <th className="px-3 py-2.5 text-right font-medium w-28 text-emerald">Debit</th>
              <th className="px-3 py-2.5 text-right font-medium w-28 text-alert-red">Credit</th>
              <th className="px-3 py-2.5 text-right font-medium w-24" style={{ color: '#7C3AED' }}>Adjusted Debit</th>
              <th className="px-3 py-2.5 text-right font-medium w-24" style={{ color: '#7C3AED' }}>Adjusted Credit</th>
              <th className="px-3 py-2.5 text-right font-medium w-32" style={{ color: D.text }}>Closing Balance</th>
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
                <tr key={`cat-${cat}`} style={{ background: catBg }}>
                  <td colSpan={7} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: catText }}>{cat}</td>
                  <td className="px-3 py-2 text-right font-bold font-mono text-[10px]" style={{ color: catText }}>{fmt(subtotals.cl)}</td>
                </tr>,
                ...catLines.map((line) => {
                  const cb = getClosingBalance(line)
                  const hasAdj = (line.adjustmentDebit || 0) + (line.adjustmentCredit || 0) > 0
                  return (
                    <tr key={line.id} className={`border-b last:border-0 ${hasAdj ? 'border-l-2 border-l-purple-500' : ''}`}
                      style={{ borderColor: D.border }}
                      onMouseEnter={e => e.currentTarget.style.background = rowHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-3 py-3 font-mono" style={{ color: D.subtle }}>{line.ledgerCode}</td>
                      <td className="px-3 py-3 font-medium" style={{ color: D.text }}>
                        {line.ledgerName}
                        {hasAdj && (
                          <span className="ml-2 rounded-sm bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-600">ADJ</span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-right font-mono ${line.openingBalance < 0 ? 'text-alert-red' : ''}`} style={{ color: line.openingBalance < 0 ? undefined : D.text }}>{fmt(line.openingBalance)}</td>
                      <td className="px-3 py-3 text-right font-mono text-emerald">{fmt(line.currentYearDebit)}</td>
                      <td className="px-3 py-3 text-right font-mono text-alert-red">{fmt(line.currentYearCredit)}</td>
                      <td className="px-3 py-3 text-right font-mono" style={{ color: '#7C3AED' }}>{fmt(line.adjustmentDebit || 0)}</td>
                      <td className="px-3 py-3 text-right font-mono italic" style={{ color: '#7C3AED' }}>{fmt(line.adjustmentCredit || 0)}</td>
                      <td className={`px-3 py-3 text-right font-mono font-bold ${cb < 0 ? 'text-alert-red' : ''}`} style={{ color: cb < 0 ? undefined : D.text }}>{fmt(cb)}</td>
                    </tr>
                  )
                }),
              ]
            })}
            {/* Grand total */}
            {(() => {
              const totalCB = lines.reduce((s, l) => s + getClosingBalance(l), 0)
              const isBalanced = Math.abs(totalCB) < 0.01
              return (
                <tr className="bg-navy text-white">
                  <td colSpan={2} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">TOTAL</td>
                  <td colSpan={6} className="px-3 py-3 text-center">
                    {isBalanced ? (
                      <span className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold tracking-widest bg-emerald/20 text-emerald" style={{ letterSpacing: '0.12em' }}>
                        Balanced ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold tracking-widest bg-red-500/20 text-red-400" style={{ letterSpacing: '0.12em' }}>
                        Imbalanced ✗
                      </span>
                    )}
                  </td>
                </tr>
              )
            })()}
          </tbody>
        </table>
      </div>
      {showHint && (
        <p className="mt-1 text-center text-[11px] sm:hidden" style={{ color: D.subtle }}>← scroll to see all columns →</p>
      )}
    </div>
  )
}

/* ─── Rejection reason modal ─── */
function RejectReasonModal({ onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--c-card)', border: `1px solid ${D.border}` }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${D.border}` }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: D.text }}>Reason for Rejection</h2>
            <p className="text-xs mt-0.5" style={{ color: D.muted }}>This reason will be shared with your audit team</p>
          </div>
          <button onClick={onClose} style={{ color: D.subtle }} className="hover:text-alert-red transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: D.muted }}>
              Rejection Reason <span className="text-alert-red">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Please explain why you are rejecting this adjustment entry..."
              className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${D.border}`,
                color: D.text,
              }}
            />
            {!reason.trim() && (
              <p className="mt-1 text-xs text-alert-red">A reason is required before rejecting.</p>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors"
              style={{ border: `1px solid ${D.border}`, color: D.muted }}
            >
              Cancel
            </button>
            <button
              onClick={() => reason.trim() && onConfirm(reason)}
              disabled={!reason.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-alert-red py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-red-700 transition-colors"
            >
              <XCircle className="h-4 w-4" /> Confirm Rejection
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Adjustment card — collapsed list row, expands on hover ─── */
function AdjustmentCard({ adj, onApprove, onReject }) {
  const [hovered, setHovered] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const { isDark } = useTheme()

  const handleRejectConfirm = (reason) => {
    onReject(adj.id, reason)
    setRejectModal(false)
  }

  const rowBg = isDark
    ? hovered ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)'
    : hovered ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.03)'

  return (
    <>
      <div
        className="rounded-xl transition-all"
        style={{ border: `1px solid rgba(124,58,237,0.3)`, background: rowBg }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Always-visible compact header */}
        <div className="flex items-center gap-3 px-5 py-3">
          <span className="font-mono text-sm font-bold text-purple-500">{adj.adjustmentRef}</span>
          <p className="flex-1 min-w-0 text-sm truncate" style={{ color: D.text }}>{adj.description}</p>
          <span className="shrink-0 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 text-xs font-semibold text-amber">
            Awaiting Review
          </span>
          {/* Approve / Reject buttons — right end */}
          <div className="flex shrink-0 gap-2 ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(adj.id, '') }}
              className="flex items-center gap-1.5 rounded-lg bg-emerald px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald/80 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setRejectModal(true) }}
              className="flex items-center gap-1.5 rounded-lg border border-alert-red px-3 py-1.5 text-xs font-semibold text-alert-red hover:bg-alert-red/10 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        </div>

        {/* Expanded detail — visible on hover */}
        <AnimatePresence initial={false}>
          {hovered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden"
              style={{ borderTop: `1px solid rgba(124,58,237,0.2)` }}
            >
              <div className="px-5 py-4">
                <p className="text-xs mb-3" style={{ color: D.muted }}>
                  {adj.date} · Posted by {adj.postedBy}
                </p>
                {/* Journal mini-table */}
                <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${D.border}` }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderBottom: `1px solid ${D.border}` }}>
                        <th className="px-3 py-2 text-left font-medium" style={{ color: D.subtle }}>Account</th>
                        <th className="px-3 py-2 text-right font-medium text-emerald">Debit</th>
                        <th className="px-3 py-2 text-right font-medium text-alert-red">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adj.entries.map((e, i) => (
                        <tr key={i} style={{ borderBottom: i < adj.entries.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                          <td className="px-3 py-2 font-medium" style={{ color: D.text }}>{e.ledgerName}</td>
                          <td className="px-3 py-2 text-right font-mono text-emerald">{e.debit > 0 ? `SAR ${e.debit.toLocaleString()}` : '—'}</td>
                          <td className="px-3 py-2 text-right font-mono text-alert-red">{e.credit > 0 ? `SAR ${e.credit.toLocaleString()}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs" style={{ color: D.subtle }}>
                  Once approved or rejected, your audit team will be notified immediately.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {rejectModal && (
          <RejectReasonModal
            onConfirm={handleRejectConfirm}
            onClose={() => setRejectModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default function ClientWorkingTB() {
  const showToast = useToast()
  const { tbLines, adjustments, pendingAdjustments, approveAdjustment, rejectAdjustment } = useTB()
  const { selectedFY } = useClientFY()
  const [reviewedExpanded, setReviewedExpanded] = useState(false)
  const { isDark } = useTheme()

  const reviewedAdjustments = adjustments.filter((a) => a.status !== 'Pending Client Approval')

  const handleApprove = (id, note) => {
    approveAdjustment(id, note)
    showToast('Adjustment approved — your trial balance has been updated')
  }

  const handleReject = (id, reason) => {
    rejectAdjustment(id, reason)
    showToast('Adjustment rejected — your auditor has been notified with your reason')
  }

  return (
    <ClientLayout title="Working Trial Balance">
      <PageTransition>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold" style={{ color: D.text }}>Working Trial Balance</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: D.muted }}>Al-Marai Logistics JSC — {selectedFY}</span>
              <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: D.subtle }}>Last updated: Today 09:15 AM</span>
            </div>
          </div>

          {/* ── Pending Adjustments — TOP of page ── */}
          {pendingAdjustments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: D.text }}>
                  Proposed Adjustments — Awaiting Your Approval
                  <span className="ml-2 rounded-full bg-amber/20 px-2 py-0.5 text-sm text-amber">{pendingAdjustments.length}</span>
                </h2>
                <p className="text-xs" style={{ color: D.subtle }}>Hover each entry to see details</p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-xl border border-amber/30 bg-amber/10 px-5 py-3"
              >
                <AlertTriangle className="h-4 w-4 text-amber shrink-0" />
                <p className="text-sm font-medium text-amber">
                  Your auditor has proposed {pendingAdjustments.length} adjustment {pendingAdjustments.length === 1 ? 'entry' : 'entries'} for your review.
                  Hover each entry below to view the journal details before approving or rejecting.
                </p>
              </motion.div>
              <div className="space-y-2" id="adjustments">
                {pendingAdjustments.map((adj) => (
                  <AdjustmentCard key={adj.id} adj={adj} onApprove={handleApprove} onReject={handleReject} />
                ))}
              </div>
            </div>
          )}

          {/* Download button */}
          <div className="flex justify-end">
            <button
              onClick={() => showToast('Downloading trial balance as Excel...')}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              style={{ border: `1px solid ${D.border}`, color: D.text }}
            >
              <Download className="h-4 w-4" /> Download as Excel
            </button>
          </div>

          {/* TB Table */}
          <TBTable lines={tbLines} />

          {/* Reviewed Adjustments (collapsed) */}
          {reviewedAdjustments.length > 0 && (
            <div>
              <button
                onClick={() => setReviewedExpanded((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold transition-colors"
                style={{ color: D.muted }}
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
                    className="overflow-hidden mt-3 space-y-2"
                  >
                    {reviewedAdjustments.map((adj) => (
                      <div
                        key={adj.id}
                        className="flex items-center gap-3 rounded-xl px-5 py-3"
                        style={{
                          border: `1px solid ${adj.status === 'Approved by Client' ? 'rgba(16,185,129,0.3)' : D.border}`,
                          background: adj.status === 'Approved by Client' ? 'rgba(16,185,129,0.06)' : 'transparent',
                        }}
                      >
                        {adj.status === 'Approved by Client' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0" style={{ color: D.subtle }} />
                        )}
                        <span className="font-mono text-sm font-bold" style={{ color: D.text }}>{adj.adjustmentRef}</span>
                        <span className="text-xs font-semibold" style={{ color: adj.status === 'Approved by Client' ? '#10B981' : D.subtle }}>{adj.status}</span>
                        <p className="text-xs ml-2 flex-1 truncate" style={{ color: D.muted }}>{adj.description}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Note: Tax & Zakat calculators are available in the Deliverables section */}
          <div className="rounded-xl px-5 py-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p className="text-sm font-medium" style={{ color: D.text }}>
              💡 <strong>Zakat & CIT Calculators</strong> are available in the{' '}
              <a href="/client/deliverables" className="text-indigo-400 underline hover:text-indigo-300">Deliverables section</a>
              {' '}— calculated from this trial balance data.
            </p>
          </div>
        </div>
      </PageTransition>
    </ClientLayout>
  )
}
