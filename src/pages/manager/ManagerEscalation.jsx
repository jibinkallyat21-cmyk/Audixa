import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { useModal } from '../../components/shared/Modal'
import {
  escalationTier1,
  escalationTier2,
  escalationTier3,
  predictiveRisk,
  REVENUE_BANDS,
} from '../../data/sampleData'

const TIER_STYLE = {
  1: { border: 'border-l-amber', header: 'bg-amber/10 text-amber', chip: 'bg-amber/10 text-amber border-amber/30' },
  2: { border: 'border-l-orange-500', header: 'bg-orange-50 text-orange-600', chip: 'bg-orange-50 text-orange-600 border-orange-200' },
  3: { border: 'border-l-alert-red', header: 'bg-alert-red/10 text-alert-red', chip: 'bg-alert-red/10 text-alert-red border-alert-red/30' },
}

export default function ManagerEscalation() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [band, setBand] = useState(REVENUE_BANDS[0])
  const [tier2, setTier2] = useState(escalationTier2)
  const [tier3, setTier3] = useState(escalationTier3)

  const filterBand = (list) => (band === REVENUE_BANDS[0] ? list : list.filter((f) => f.band === band))

  const handleEscalateToTier3 = (file) => {
    openModal({
      title: 'Escalate to Tier 3',
      body: <p className="text-sm text-slate-600">Escalate {file.client} to Tier 3? This will notify Management.</p>,
      confirmLabel: 'Confirm',
      onConfirm: () => {
        setTier2((prev) => prev.filter((f) => f.client !== file.client))
        setTier3((prev) => [{ ...file, daysOverdue: file.daysOverdue, note: null }, ...prev])
        showToast(`${file.client} escalated to Tier 3`)
      },
    })
  }

  const handleEscalateToManagement = (file) => {
    showToast(`Management has been notified. A Tier-3 escalation alert has been sent to Mohammed Al-Rashid — Partner.`)
  }

  return (
    <ManagerLayout title="Escalation Monitor">
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-navy">Escalation Monitor — Deadline Tracking</h1>
            <p className="text-sm text-slate-500">ABCPA Department</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-amber/10 px-3 py-1.5 text-xs font-semibold text-amber">Tier 1 Approaching: {escalationTier1.length} Files</span>
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">Tier 2 Overdue: {tier2.length} Files</span>
              <span className="rounded-full bg-alert-red/10 px-3 py-1.5 text-xs font-semibold text-alert-red">Tier 3 Critical: {tier3.length} Files</span>
            </div>
            <select value={band} onChange={(e) => setBand(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-navy outline-none focus:border-navy">
              {REVENUE_BANDS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Tier 1 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`overflow-hidden rounded-xl border-l-4 ${TIER_STYLE[1].border} border-y border-r border-slate-200 bg-white shadow-sm`}>
            <div className={`px-5 py-3 text-sm font-bold ${TIER_STYLE[1].header}`}>Tier 1 — Approaching Deadline — Within 5 Days</div>
            <div className="divide-y divide-slate-50">
              {filterBand(escalationTier1).map((f) => (
                <div key={f.client} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-navy">{f.client}</p>
                    <p className="text-xs text-slate-400">
                      {f.band} · Due {f.due} · Lead: {f.lead}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TIER_STYLE[1].chip}`}>{f.daysRemaining} days remaining</span>
                    <button onClick={() => navigate('/manager/status-board')} className="rounded-lg border border-navy/30 px-3.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Tier 2 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }} className={`overflow-hidden rounded-xl border-l-4 ${TIER_STYLE[2].border} border-y border-r border-slate-200 bg-white shadow-sm`}>
            <div className={`px-5 py-3 text-sm font-bold ${TIER_STYLE[2].header}`}>Tier 2 — Overdue — Past Deadline</div>
            <div className="divide-y divide-slate-50">
              <AnimatePresence>
                {filterBand(tier2).map((f) => (
                  <motion.div
                    key={f.client}
                    layout
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-navy">{f.client}</p>
                      <p className="text-xs text-slate-400">
                        {f.band} · Due {f.due} · Lead: {f.lead}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TIER_STYLE[2].chip}`}>{f.daysOverdue} days overdue</span>
                      <button
                        onClick={() => handleEscalateToTier3(f)}
                        className="rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
                      >
                        Escalate
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Tier 3 */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.16 }} className={`overflow-hidden rounded-xl border-l-4 ${TIER_STYLE[3].border} border-y border-r border-slate-200 bg-white shadow-sm`}>
            <div className={`px-5 py-3 text-sm font-bold ${TIER_STYLE[3].header}`}>Tier 3 — Critical — Escalated to Management</div>
            <div className="divide-y divide-slate-50">
              <AnimatePresence>
                {filterBand(tier3).map((f) => (
                  <motion.div
                    key={f.client}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-navy">{f.client}</p>
                      <p className="text-xs text-slate-400">
                        {f.band} · Due {f.due} · Lead: {f.lead}
                      </p>
                      {f.note && <p className="mt-0.5 text-xs font-semibold text-alert-red">{f.note}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TIER_STYLE[3].chip}`}>{f.daysOverdue} days overdue</span>
                      <button
                        onClick={() => handleEscalateToManagement(f)}
                        className="rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
                      >
                        Escalate to Management
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Predictive risk */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-navy">Predictive Risk — Likely to Slip</h2>
              <span className="flex items-center gap-1 rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-semibold text-amber">
                <Sparkles className="h-3 w-3" /> AI
              </span>
            </div>
            <div className="space-y-2">
              {filterBand(predictiveRisk.map((r) => ({ ...r, band: 'All Revenue Bands' }))).map((r) => (
                <div key={r.client} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 py-2.5 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-navy">{r.client}</p>
                    <p className="text-xs text-slate-400">
                      Lead: {r.lead} · Projected breach: {r.projectedBreach}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/manager/status-board')}
                    className="rounded-lg border border-amber/40 px-3.5 py-1.5 text-xs font-semibold text-amber hover:bg-amber/5"
                  >
                    Monitor
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Based on current document submission pace and open query volume. Not yet overdue.
            </p>
          </div>
        </div>
      </PageTransition>
    </ManagerLayout>
  )
}
