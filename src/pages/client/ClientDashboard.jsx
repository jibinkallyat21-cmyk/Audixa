import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, TrendingUp, CheckCircle2, AlertCircle, FileText, ChevronRight,
  Calendar, ChevronDown, X, Send,
} from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import LifecycleStepper from '../../components/shared/LifecycleStepper'
import { clientPortal } from '../../data/sampleData'
import { useClientFY, ENGAGEMENT_REFS } from '../../context/ClientFYContext'
import { getActivityEvents } from '../../data/activityLog'
import { useToast } from '../../components/shared/Toast'

function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)
  useEffect(() => {
    setValue(0)
    startRef.current = null
    let frame
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts
      const p = Math.min((ts - startRef.current) / duration, 1)
      setValue(Math.round(p * target))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

function getFYData(fy) {
  if (fy === 'FY2023') {
    return {
      stats: { totalRequirements: 78, documentsAccepted: 78, pendingAction: 0, pendingDueThisWeek: 0, openQueries: 0, criticalQueries: 0 },
      engagementRef: ENGAGEMENT_REFS['FY2023'],
      stages: [
        { id: 'acceptance', label: 'Engagement Acceptance', status: 'completed' },
        { id: 'pbc', label: 'PBC Submission', status: 'completed' },
        { id: 'fieldwork', label: 'Audit Field Work', status: 'completed' },
        { id: 'draft', label: 'Draft FS Review', status: 'completed' },
        { id: 'signoff', label: 'Sign-off & Completion', status: 'completed' },
        { id: 'filing', label: 'Regulatory Filing', status: 'completed', qawaemRef: 'QAW-2023-77203' },
      ],
    }
  }
  if (fy === 'FY2022') {
    return {
      stats: { totalRequirements: 72, documentsAccepted: 72, pendingAction: 0, pendingDueThisWeek: 0, openQueries: 0, criticalQueries: 0 },
      engagementRef: ENGAGEMENT_REFS['FY2022'],
      stages: [
        { id: 'acceptance', label: 'Engagement Acceptance', status: 'completed' },
        { id: 'pbc', label: 'PBC Submission', status: 'completed' },
        { id: 'fieldwork', label: 'Audit Field Work', status: 'completed' },
        { id: 'draft', label: 'Draft FS Review', status: 'completed' },
        { id: 'signoff', label: 'Sign-off & Completion', status: 'completed' },
        { id: 'filing', label: 'Regulatory Filing', status: 'completed', qawaemRef: 'QAW-2022-62018' },
      ],
    }
  }
  return {
    stats: clientPortal.stats,
    engagementRef: ENGAGEMENT_REFS['FY2024'],
    stages: [
      { id: 'acceptance', label: 'Engagement Acceptance', status: 'completed' },
      { id: 'pbc', label: 'PBC Submission', status: 'completed' },
      { id: 'fieldwork', label: 'Audit Field Work', status: 'active' },
      { id: 'draft', label: 'Draft FS Review', status: 'upcoming' },
      { id: 'signoff', label: 'Sign-off & Completion', status: 'upcoming' },
      { id: 'filing', label: 'Regulatory Filing', status: 'upcoming', qawaemRef: 'QAW-2024-88412' },
    ],
  }
}

const STAGE_TOOLTIPS = {
  'Engagement Acceptance': 'Engagement letter issued and agreed; audit terms confirmed.',
  'PBC Submission': 'Client submits Prepared by Client (PBC) documents and records.',
  'Audit Field Work': 'Audit team performs substantive procedures and testing.',
  'Draft FS Review': 'Client reviews draft financial statements and confirms accuracy.',
  'Sign-off & Completion': 'Engagement partner signs off; audit report finalised.',
  'Regulatory Filing': 'Audited financials filed with the relevant authority (ZATCA / MISA).',
}

const EVENT_ICONS = { emerald: CheckCircle2, red: AlertCircle, amber: AlertCircle, blue: FileText, navy: TrendingUp }
const ICON_COLOR = { emerald: 'text-emerald', red: 'text-alert-red', amber: 'text-amber', blue: 'text-blue-500', navy: 'text-navy' }

function StatCard({ label, sub, value, color, icon: Icon, className = '' }) {
  const count = useCountUp(value)
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <div className="mt-1.5 flex items-end gap-1.5">
        <span className={`text-2xl font-black ${color}`}>{count}</span>
        {Icon && <Icon className={`mb-0.5 h-4 w-4 ${color}`} />}
      </div>
      {sub && <p className="mt-1 text-[11px] font-medium text-slate-500">{sub}</p>}
    </div>
  )
}

function PBCRing({ total, accepted, fy }) {
  const count = useCountUp(accepted)
  const pct = total > 0 ? Math.round((accepted / total) * 100) : 0
  const r = 36
  const circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
        <svg viewBox="0 0 88 88" className="h-20 w-20 -rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#F1F5F9" strokeWidth="7" />
          <motion.circle
            key={fy} cx="44" cy="44" r={r} fill="none"
            stroke="#059669" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute text-xs font-bold text-emerald">{pct}%</span>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">PBC Completion</p>
        <p className="mt-0.5 text-2xl font-black text-navy">{count} <span className="text-sm font-medium text-slate-400">/ {total}</span></p>
        <p className="text-[11px] text-slate-500">PBC items submitted</p>
      </div>
    </div>
  )
}

function RequestMeetingModal({ onClose }) {
  const showToast = useToast()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!date || !topic) return
    showToast('Meeting request submitted — your engagement team will confirm shortly')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        ref={ref}
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-navy">Request a Meeting</h2>
            <p className="text-xs text-slate-400 mt-0.5">Your engagement team will confirm availability</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-navy"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Meeting Topic <span className="text-alert-red">*</span></label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-navy">
              <option value="">Select topic...</option>
              <option>PBC Document Requirements</option>
              <option>Audit Progress & Status Update</option>
              <option>Draft Financial Statements Review</option>
              <option>Zakat & Tax Matters</option>
              <option>Audit Query Clarification</option>
              <option>Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Preferred Date <span className="text-alert-red">*</span></label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Preferred Time</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-navy">
                <option value="">Flexible</option>
                <option>09:00 – 10:00</option>
                <option>10:00 – 11:00</option>
                <option>11:00 – 12:00</option>
                <option>13:00 – 14:00</option>
                <option>14:00 – 15:00</option>
                <option>15:00 – 16:00</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Additional Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any specific agenda items or background information..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-navy resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">
              <Send className="h-4 w-4" /> Submit Request
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function ClientDashboard() {
  const { selectedFY, setSelectedFY, availableFYs } = useClientFY()
  const fyData = getFYData(selectedFY)
  const isAuthorisedSignatory = clientPortal.clientRole === 'Authorised Signatory'
  const recentEvents = getActivityEvents().slice(0, 8)
  const [meetingModal, setMeetingModal] = useState(false)

  return (
    <ClientLayout title="Engagement Dashboard" fullHeight>
      <PageTransition>
        <div className="flex h-full gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedFY}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-4"
              >
                {/* Header row — client name + FY dropdown + ref */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Engagement Dashboard</p>
                    <p className="mt-0.5 text-base font-bold text-navy">{clientPortal.clientName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-mono font-medium text-slate-600">{fyData.engagementRef}</span>
                    {/* FY Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedFY}
                        onChange={(e) => setSelectedFY(e.target.value)}
                        className="appearance-none cursor-pointer rounded-lg border border-navy/20 bg-navy/5 py-1.5 pl-3 pr-7 text-xs font-bold text-navy outline-none focus:border-navy"
                      >
                        {availableFYs.map((fy) => (
                          <option key={fy} value={fy}>{fy}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy/60" />
                    </div>
                  </div>
                </div>

                {/* On Hold banner */}
                {selectedFY === 'FY2024' && clientPortal.onHold.active && (
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-amber/30 bg-amber/5 px-4 py-3">
                    <p className="text-sm font-medium text-amber">{clientPortal.onHold.message}</p>
                    {isAuthorisedSignatory && (
                      <div className="flex shrink-0 items-center gap-1.5 text-amber/80">
                        <Lock className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-semibold">Authorised Signatory notice</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Audit lifecycle stepper */}
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Engagement Phase</p>
                  <LifecycleStepper stages={fyData.stages} tooltips={STAGE_TOOLTIPS} />
                </div>

                {/* Stats grid: PBC ring + 4 tiles */}
                <div className="grid grid-cols-2 gap-3">
                  {/* PBC ring spans full width on small, col-span-2 */}
                  <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <PBCRing total={fyData.stats.totalRequirements} accepted={fyData.stats.documentsAccepted} fy={selectedFY} />
                  </div>
                  <StatCard
                    label="Accepted PBC Items"
                    value={fyData.stats.documentsAccepted}
                    color="text-emerald"
                    icon={CheckCircle2}
                    sub="Received & verified"
                  />
                  <StatCard
                    label="Outstanding Items"
                    value={fyData.stats.pendingAction}
                    color="text-amber"
                    icon={null}
                    sub={fyData.stats.pendingDueThisWeek > 0 ? `${fyData.stats.pendingDueThisWeek} overdue` : 'No overdue items'}
                  />
                  <StatCard
                    label="Open Audit Queries"
                    value={fyData.stats.openQueries}
                    color="text-alert-red"
                    icon={null}
                    sub={fyData.stats.criticalQueries > 0 ? `${fyData.stats.criticalQueries} require urgent response` : 'No urgent queries'}
                  />
                  <StatCard
                    label="Days to Statutory Deadline"
                    value={clientPortal.daysRemaining}
                    color="text-navy"
                    sub={clientPortal.statutoryDeadline}
                  />
                </div>

                {/* Request Meeting */}
                <button
                  onClick={() => setMeetingModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy/20 bg-navy/5 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy/10"
                >
                  <Calendar className="h-4 w-4" />
                  Request a Meeting with Your Engagement Team
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">
            {/* Engagement team */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Engagement Team</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">TA</div>
                <div>
                  <p className="text-sm font-semibold text-navy">Tariq Al-Harbi</p>
                  <p className="text-xs text-slate-500">Engagement Partner</p>
                  <p className="text-xs text-slate-400">Analytix Audit & Assurance</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">Statutory Audit</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">{selectedFY}</span>
                <span className="rounded-full bg-emerald/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald">Active</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Recent Activity</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {recentEvents.map((event) => {
                  const Icon = EVENT_ICONS[event.icon] || FileText
                  return (
                    <div key={event.id} className="flex items-start gap-3 border-b border-slate-50 py-2.5 last:border-0">
                      <span className={`mt-0.5 shrink-0 ${ICON_COLOR[event.icon] || 'text-navy'}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-navy leading-snug">{event.description}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{event.timestamp}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-slate-100 px-4 py-2.5">
                <Link to="/client/activity" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                  Full Activity Log <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>

      <AnimatePresence>
        {meetingModal && <RequestMeetingModal onClose={() => setMeetingModal(false)} />}
      </AnimatePresence>
    </ClientLayout>
  )
}
