import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, CheckCircle2, AlertCircle, FileText, ChevronRight,
  Calendar, ChevronDown, X, Send, TrendingUp, Search,
} from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import ClientGreeting from '../../components/client/ClientGreeting'
import PageTransition from '../../components/shared/PageTransition'
import LifecycleStepper from '../../components/shared/LifecycleStepper'
import { clientPortal } from '../../data/sampleData'
import { useClientFY, ENGAGEMENT_REFS } from '../../context/ClientFYContext'
import { getActivityEvents } from '../../data/activityLog'
import { useToast } from '../../components/shared/Toast'

/* dark palette */
const D = {
  card: '#0F1629',
  cardHov: '#162040',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  text: '#F1F5F9',
  muted: '#94A3B8',
  subtle: '#475569',
}

function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)
  useEffect(() => {
    setValue(0); startRef.current = null
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
  if (fy === 'FY2023') return {
    stats: { totalRequirements: 78, documentsAccepted: 78, pendingAction: 0, openQueries: 0, underVerification: 0 },
    engagementRef: ENGAGEMENT_REFS['FY2023'],
    stages: [
      { id: 'acceptance', label: 'Engagement Acceptance', status: 'completed' },
      { id: 'pbc', label: 'PBC Submission', status: 'completed' },
      { id: 'fieldwork', label: 'Audit Field Work', status: 'completed' },
      { id: 'draft', label: 'Draft FS Review', status: 'completed' },
      { id: 'signoff', label: 'Sign-off & Completion', status: 'completed' },
      { id: 'filing', label: 'Regulatory Filing', status: 'completed' },
    ],
  }
  if (fy === 'FY2022') return {
    stats: { totalRequirements: 72, documentsAccepted: 72, pendingAction: 0, openQueries: 0, underVerification: 0 },
    engagementRef: ENGAGEMENT_REFS['FY2022'],
    stages: [
      { id: 'acceptance', label: 'Engagement Acceptance', status: 'completed' },
      { id: 'pbc', label: 'PBC Submission', status: 'completed' },
      { id: 'fieldwork', label: 'Audit Field Work', status: 'completed' },
      { id: 'draft', label: 'Draft FS Review', status: 'completed' },
      { id: 'signoff', label: 'Sign-off & Completion', status: 'completed' },
      { id: 'filing', label: 'Regulatory Filing', status: 'completed' },
    ],
  }
  return {
    stats: { totalRequirements: clientPortal.stats.totalRequirements, documentsAccepted: clientPortal.stats.documentsAccepted, pendingAction: clientPortal.stats.pendingAction, openQueries: clientPortal.stats.openQueries, underVerification: 11 },
    engagementRef: ENGAGEMENT_REFS['FY2024'],
    stages: [
      { id: 'acceptance', label: 'Engagement Acceptance', status: 'completed' },
      { id: 'pbc', label: 'PBC Submission', status: 'completed' },
      { id: 'fieldwork', label: 'Audit Field Work', status: 'active' },
      { id: 'draft', label: 'Draft FS Review', status: 'upcoming' },
      { id: 'signoff', label: 'Sign-off & Completion', status: 'upcoming' },
      { id: 'filing', label: 'Regulatory Filing', status: 'upcoming' },
    ],
  }
}

const STAGE_TOOLTIPS = {
  'Engagement Acceptance': 'Engagement letter issued and agreed; audit terms confirmed.',
  'PBC Submission': 'Client submits Prepared by Client (PBC) documents.',
  'Audit Field Work': 'Audit team performs substantive procedures and testing.',
  'Draft FS Review': 'Client reviews draft financial statements for accuracy.',
  'Sign-off & Completion': 'Partner signs off; audit report finalised.',
  'Regulatory Filing': 'Audited financials filed with ZATCA / MISA.',
}

const AUDIT_TEAM = [
  { initials: 'TA', name: 'Tariq Al-Harbi',   role: 'Engagement Partner',  online: true },
  { initials: 'SR', name: 'Sana Rashid',       role: 'Audit Manager',       online: true },
  { initials: 'FM', name: 'Faisal Mahmoud',    role: 'Senior Auditor',      online: false },
  { initials: 'LK', name: 'Layla Khalid',      role: 'Audit Associate',     online: false },
  { initials: 'NJ', name: 'Nour Jabir',        role: 'Tax Specialist',      online: true },
]

const EVENT_ICON = { emerald: CheckCircle2, red: AlertCircle, amber: AlertCircle, blue: FileText, navy: TrendingUp }
const EVENT_COLOR = { emerald: '#10B981', red: '#E63946', amber: '#F59E0B', blue: '#3B82F6', navy: '#6366F1' }

/* ─── Stat card ─── */
function StatCard({ label, value, sub, accent, className = '' }) {
  const count = useCountUp(value)
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: D.card, border: `1px solid ${D.border}` }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>{label}</p>
      <p className="mt-2 text-4xl font-black" style={{ color: accent }}>{count}</p>
      {sub && <p className="mt-1 text-sm font-medium" style={{ color: D.muted }}>{sub}</p>}
    </div>
  )
}

/* ─── PBC ring ─── */
function PBCRing({ total, accepted, fy }) {
  const count = useCountUp(accepted)
  const pct = total > 0 ? Math.round((accepted / total) * 100) : 0
  const r = 38; const circ = 2 * Math.PI * r
  return (
    <div
      className="flex items-center gap-6 rounded-2xl p-5"
      style={{ background: D.card, border: `1px solid ${D.border}` }}
    >
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
        <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <motion.circle
            key={fy} cx="48" cy="48" r={r} fill="none"
            stroke="#10B981" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute text-lg font-black text-emerald">{pct}%</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>PBC Completion</p>
        <p className="mt-1 text-4xl font-black text-white">{count} <span className="text-xl font-medium" style={{ color: D.muted }}>/ {total}</span></p>
        <p className="mt-1 text-sm" style={{ color: D.muted }}>PBC items submitted</p>
      </div>
    </div>
  )
}

/* ─── Request Meeting modal ─── */
function RequestMeetingModal({ onClose }) {
  const showToast = useToast()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!date || !topic) return
    showToast('Meeting request submitted — your engagement team will confirm shortly')
    onClose()
  }

  const inputCls = 'w-full rounded-xl py-2.5 px-3 text-sm text-white/90 outline-none focus:border-brand/60'
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}` }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        ref={ref}
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: '#0F1629', border: `1px solid ${D.border}` }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${D.border}` }}>
          <div>
            <h2 className="text-base font-bold text-white">Request a Meeting</h2>
            <p className="text-xs mt-0.5" style={{ color: D.muted }}>Your engagement team will confirm availability</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: D.muted }}>Meeting Topic <span className="text-brand">*</span></label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} required className={inputCls} style={inputStyle}>
              <option value="" style={{ background: '#0F1629' }}>Select topic...</option>
              <option style={{ background: '#0F1629' }}>PBC Document Requirements</option>
              <option style={{ background: '#0F1629' }}>Audit Progress & Status Update</option>
              <option style={{ background: '#0F1629' }}>Draft Financial Statements Review</option>
              <option style={{ background: '#0F1629' }}>Zakat & Tax Matters</option>
              <option style={{ background: '#0F1629' }}>Audit Query Clarification</option>
              <option style={{ background: '#0F1629' }}>Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: D.muted }}>Preferred Date <span className="text-brand">*</span></label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: D.muted }}>Preferred Time</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} style={inputStyle}>
                <option style={{ background: '#0F1629' }} value="">Flexible</option>
                <option style={{ background: '#0F1629' }}>09:00 – 10:00</option>
                <option style={{ background: '#0F1629' }}>10:00 – 11:00</option>
                <option style={{ background: '#0F1629' }}>11:00 – 12:00</option>
                <option style={{ background: '#0F1629' }}>13:00 – 14:00</option>
                <option style={{ background: '#0F1629' }}>14:00 – 15:00</option>
                <option style={{ background: '#0F1629' }}>15:00 – 16:00</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: D.muted }}>Additional Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Agenda items or background context..." className={`${inputCls} resize-none`} style={{ ...inputStyle, color: 'rgba(255,255,255,0.7)' }} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white/60 hover:bg-white/5 transition-colors" style={{ border: `1px solid ${D.border}` }}>Cancel</button>
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">
              <Send className="h-4 w-4" /> Submit Request
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ─── Main Dashboard ─── */
export default function ClientDashboard() {
  const { selectedFY, setSelectedFY, availableFYs } = useClientFY()
  const fyData = getFYData(selectedFY)
  const recentEvents = getActivityEvents().slice(0, 10)
  const [meetingModal, setMeetingModal] = useState(false)

  return (
    <ClientLayout title="Engagement Dashboard" fullHeight>
      <ClientGreeting name="Karim Rahman" company="Kingdom Retail Holdings LLC" />
      <PageTransition>
        <div className="flex h-full gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              <motion.div key={selectedFY} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-4">

                {/* Header strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3.5" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Engagement Dashboard</p>
                    <p className="mt-0.5 text-lg font-bold text-white">{clientPortal.clientName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full px-3 py-1 text-xs font-mono font-semibold text-white/50" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}` }}>
                      {fyData.engagementRef}
                    </span>
                    <div className="relative">
                      <select
                        value={selectedFY}
                        onChange={(e) => setSelectedFY(e.target.value)}
                        className="appearance-none cursor-pointer rounded-lg py-1.5 pl-3 pr-7 text-xs font-bold text-white outline-none"
                        style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)' }}
                      >
                        {availableFYs.map((fy) => (
                          <option key={fy} value={fy} style={{ background: '#0F1629' }}>{fy}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                    </div>
                  </div>
                </div>

                {/* On Hold banner */}
                {selectedFY === 'FY2024' && clientPortal.onHold?.active && (
                  <div className="flex items-center gap-4 rounded-2xl px-4 py-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <p className="text-sm font-medium text-amber">{clientPortal.onHold.message}</p>
                    <Lock className="ml-auto h-4 w-4 shrink-0 text-amber/60" />
                  </div>
                )}

                {/* Lifecycle stepper */}
                <div className="rounded-2xl px-5 py-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Engagement Phase</p>
                  <LifecycleStepper stages={fyData.stages} tooltips={STAGE_TOOLTIPS} />
                </div>

                {/* Stats */}
                <PBCRing total={fyData.stats.totalRequirements} accepted={fyData.stats.documentsAccepted} fy={selectedFY} />

                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Accepted PBC Items" value={fyData.stats.documentsAccepted} accent="#10B981" sub="Received & verified" />
                  <StatCard label="Outstanding Items" value={fyData.stats.pendingAction} accent="#F59E0B" sub={fyData.stats.pendingAction > 0 ? 'Action required' : 'None outstanding'} />
                  <StatCard label="Open Audit Queries" value={fyData.stats.openQueries} accent="#E63946" sub="Pending your response" />
                </div>

                {/* Documents Under Verification — replaces old Days to Deadline */}
                <div className="flex items-center justify-between rounded-2xl px-5 py-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Documents Under Verification</p>
                    <p className="mt-1 text-4xl font-black text-indigo-400">{fyData.stats.underVerification}</p>
                    <p className="mt-1 text-sm" style={{ color: D.muted }}>Currently under review by the audit team</p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Search className="h-6 w-6 text-indigo-400" />
                  </div>
                </div>

                {/* Request Meeting */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setMeetingModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <Calendar className="h-4 w-4 text-brand" />
                  Request a Meeting with Your Engagement Team
                </motion.button>

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">

            {/* Assigned Engagement Team — all auditors */}
            <div className="rounded-2xl p-4 shrink-0" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Assigned Audit Team</p>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-emerald" style={{ background: 'rgba(16,185,129,0.15)' }}>{AUDIT_TEAM.filter(m => m.online).length} Online</span>
              </div>
              <div className="space-y-2">
                {AUDIT_TEAM.map((m) => (
                  <div key={m.initials} className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="relative shrink-0">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'rgba(255,255,255,0.1)' }}>{m.initials}</div>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2`} style={{ background: m.online ? '#10B981' : '#475569', borderColor: D.card }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white/90">{m.name}</p>
                      <p className="truncate text-[10px]" style={{ color: D.subtle }}>{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead partner highlight */}
            <div className="rounded-2xl p-4 shrink-0" style={{ background: 'rgba(230,57,70,0.07)', border: '1px solid rgba(230,57,70,0.18)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand/70 mb-2">Engagement Partner</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-brand/20 shrink-0">TA</div>
                <div>
                  <p className="text-sm font-bold text-white">Tariq Al-Harbi</p>
                  <p className="text-xs" style={{ color: D.muted }}>Analytix Audit & Assurance</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-white/40" style={{ background: 'rgba(255,255,255,0.06)' }}>Statutory Audit</span>
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-emerald" style={{ background: 'rgba(16,185,129,0.12)' }}>Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl overflow-hidden" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <div className="px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${D.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Recent Activity</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {recentEvents.map((event) => {
                  const Icon = EVENT_ICON[event.icon] || FileText
                  const color = EVENT_COLOR[event.icon] || '#6366F1'
                  return (
                    <div key={event.id} className="flex items-start gap-3 py-2.5" style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                      <span className="mt-0.5 shrink-0" style={{ color }}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white/80 leading-snug">{event.description}</p>
                        <p className="mt-0.5 text-[10px]" style={{ color: D.subtle }}>{event.timestamp}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Activity log link — always visible at bottom */}
              <div className="shrink-0 px-4 py-3" style={{ borderTop: `1px solid ${D.border}` }}>
                <Link to="/client/activity" className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand/80 transition-colors">
                  <Activity className="h-3.5 w-3.5" />
                  View Full Activity Log
                  <ChevronRight className="h-3.5 w-3.5" />
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
