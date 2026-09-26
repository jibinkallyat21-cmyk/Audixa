import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, CheckCircle2, AlertCircle, FileText, ChevronRight,
  Calendar, ChevronDown, X, Send, TrendingUp, Search, LineChart,
  AlertTriangle, ChevronUp, Clock, Eye,
} from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import ClientGreeting from '../../components/client/ClientGreeting'
import PageTransition from '../../components/shared/PageTransition'
import LifecycleStepper from '../../components/shared/LifecycleStepper'
import { clientPortal } from '../../data/sampleData'
import { useClientFY, ENGAGEMENT_REFS } from '../../context/ClientFYContext'
import { getActivityEvents } from '../../data/activityLog'
import { useToast } from '../../components/shared/Toast'

/* palette tokens (CSS vars from ThemeContext) */
const D = {
  card: 'var(--c-card)',
  cardHov: 'var(--c-cardhov)',
  border: 'var(--c-border)',
  border2: 'var(--c-border2)',
  text: 'var(--c-text)',
  muted: 'var(--c-muted)',
  subtle: 'var(--c-subtle)',
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
    partner: { initials: 'MI', name: 'Man Ibrahim Alshinqiti', firm: 'Man Ibrahim Alshinqiti CPA Firm' },
    team: AUDIT_TEAM_FY2023,
    stages: [
      { id: 'acceptance', label: 'Engagement Acceptance', status: 'completed' },
      { id: 'reqs', label: 'Requirements Submission', status: 'completed' },
      { id: 'fieldwork', label: 'Audit Field Work', status: 'completed' },
      { id: 'draft', label: 'Draft FS Review', status: 'completed' },
      { id: 'signoff', label: 'Sign-off & Completion', status: 'completed' },
      { id: 'filing', label: 'Regulatory Filing', status: 'completed' },
    ],
  }
  if (fy === 'FY2022') return {
    stats: { totalRequirements: 72, documentsAccepted: 72, pendingAction: 0, openQueries: 0, underVerification: 0 },
    engagementRef: ENGAGEMENT_REFS['FY2022'],
    partner: { initials: 'AB', name: 'Ashraf Bassas', firm: 'Ashraf Bassas CPA Firm' },
    team: AUDIT_TEAM_FY2022,
    stages: [
      { id: 'acceptance', label: 'Engagement Acceptance', status: 'completed' },
      { id: 'reqs', label: 'Requirements Submission', status: 'completed' },
      { id: 'fieldwork', label: 'Audit Field Work', status: 'completed' },
      { id: 'draft', label: 'Draft FS Review', status: 'completed' },
      { id: 'signoff', label: 'Sign-off & Completion', status: 'completed' },
      { id: 'filing', label: 'Regulatory Filing', status: 'completed' },
    ],
  }
  return {
    stats: { totalRequirements: clientPortal.stats.totalRequirements, documentsAccepted: clientPortal.stats.documentsAccepted, pendingAction: clientPortal.stats.pendingAction, openQueries: clientPortal.stats.openQueries, underVerification: 11 },
    engagementRef: ENGAGEMENT_REFS['FY2024'],
    partner: { initials: 'AB', name: 'Ashraf Bassas', firm: 'Ashraf Bassas CPA Firm' },
    team: AUDIT_TEAM_FY2024,
    stages: [
      { id: 'acceptance', label: 'Engagement Acceptance', status: 'completed' },
      { id: 'reqs', label: 'Requirements Submission', status: 'active' },
      { id: 'fieldwork', label: 'Audit Field Work', status: 'active' },
      { id: 'draft', label: 'Draft FS Review', status: 'upcoming' },
      { id: 'signoff', label: 'Sign-off & Completion', status: 'upcoming' },
      { id: 'filing', label: 'Regulatory Filing', status: 'upcoming' },
    ],
  }
}

const STAGE_TOOLTIPS = {
  'Engagement Acceptance': 'Engagement letter issued and agreed; audit terms confirmed.',
  'Requirements Submission': 'Client submits required documents — audit field work may begin in parallel as documents are received.',
  'Audit Field Work': 'Audit team performs substantive procedures and testing.',
  'Draft FS Review': 'Client reviews draft financial statements for accuracy.',
  'Sign-off & Completion': 'Partner signs off; audit report finalised.',
  'Regulatory Filing': 'Audited financials filed with ZATCA / MISA.',
}

const AUDIT_TEAM_FY2024 = [
  { initials: 'SR', name: 'Sana Rashid',    role: 'Audit Lead',      online: true,  fileHandler: false },
  { initials: 'LK', name: 'Layla Khalid',   role: 'Audit Associate', online: false, fileHandler: true  },
]
const AUDIT_TEAM_FY2023 = [
  { initials: 'AH', name: 'Ali Hussain',    role: 'Audit Lead',      online: false, fileHandler: false },
  { initials: 'FO', name: 'Fatima Omar',    role: 'Audit Associate', online: false, fileHandler: true  },
]
const AUDIT_TEAM_FY2022 = [
  { initials: 'KM', name: 'Khalid Mansour', role: 'Audit Lead',      online: false, fileHandler: false },
  { initials: 'NB', name: 'Noura Bilal',    role: 'Audit Associate', online: false, fileHandler: true  },
]

const UNDER_REVIEW_DOCS = [
  { ref: 'REV-02', name: 'Top 10 Customer Contracts', uploadedOn: '09 Oct 2024', reviewer: 'S. Rashid' },
  { ref: 'PPE-05', name: 'Asset Impairment Assessment', uploadedOn: '10 Oct 2024', reviewer: 'L. Khalid' },
  { ref: 'PPE-09', name: 'Right-of-Use Asset Schedule', uploadedOn: '10 Oct 2024', reviewer: 'S. Rashid' },
  { ref: 'TAX-06', name: 'Transfer Pricing Documentation', uploadedOn: '07 Oct 2024', reviewer: 'L. Khalid' },
  { ref: 'REV-05', name: 'ZATCA E-Invoicing Samples', uploadedOn: '06 Oct 2024', reviewer: 'S. Rashid' },
  { ref: 'COG-11', name: 'Related Party Declaration', uploadedOn: '05 Oct 2024', reviewer: 'L. Khalid' },
  { ref: 'PPE-03', name: 'Additions List (New Assets FY24)', uploadedOn: '04 Oct 2024', reviewer: 'S. Rashid' },
  { ref: 'TAX-03', name: 'Zakat Declaration Form', uploadedOn: '03 Oct 2024', reviewer: 'L. Khalid' },
  { ref: 'COG-09', name: 'Municipal License Renewal', uploadedOn: '02 Oct 2024', reviewer: 'S. Rashid' },
  { ref: 'REV-04', name: 'Year-end Cutoff Invoices (Partial)', uploadedOn: '01 Oct 2024', reviewer: 'L. Khalid' },
  { ref: 'PPE-08', name: 'Insurance Certificates (Major Assets)', uploadedOn: '30 Sep 2024', reviewer: 'S. Rashid' },
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

/* ─── Requirements ring ─── */
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
          <circle cx="48" cy="48" r={r} fill="none" style={{ stroke: 'var(--c-track)' }} strokeWidth="8" />
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
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Requirements Completion</p>
        <p className="mt-1 text-4xl font-black" style={{ color: 'var(--c-text)' }}>{count} <span className="text-xl font-medium" style={{ color: D.muted }}>/ {total}</span></p>
        <p className="mt-1 text-sm" style={{ color: D.muted }}>requirements accepted</p>
      </div>
    </div>
  )
}

/* ─── Under Review modal ─── */
function UnderReviewModal({ docs, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        ref={ref}
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0F1629', border: `1px solid ${D.border}` }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${D.border}` }}>
          <div>
            <h2 className="text-base font-bold text-white">Documents Under Review</h2>
            <p className="text-xs mt-0.5" style={{ color: D.muted }}>Being verified by the audit team</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {docs.map((doc, i) => (
            <div key={doc.ref} className="flex items-center gap-4 px-6 py-3.5" style={{ borderBottom: i < docs.length - 1 ? `1px solid ${D.border}` : 'none' }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Eye className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/90">{doc.name}</p>
                <p className="text-[10px]" style={{ color: D.subtle }}>Uploaded {doc.uploadedOn} · Reviewer: {doc.reviewer}</p>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono" style={{ background: 'rgba(255,255,255,0.06)', color: D.muted }}>{doc.ref}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-4" style={{ borderTop: `1px solid ${D.border}` }}>
          <p className="text-xs" style={{ color: D.subtle }}>You will be notified once each document is accepted or if a re-upload is required.</p>
        </div>
      </motion.div>
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

/* ─── Escalation Modal (4-level) ─── */
const ESCALATION_LEVELS = [
  { level: 1, label: 'Team Lead', description: 'Direct escalation to your assigned audit team lead. Available immediately.', locked: false, waitHours: 0 },
  { level: 2, label: 'Assistant Manager', description: 'Escalate to Assistant Manager if no response from Team Lead within 24 hours.', locked: false, waitHours: 24 },
  { level: 3, label: 'Audit Manager', description: 'Critical escalation to Audit Manager. Also reflected in the management portal. Available after 48 hours of no resolution.', locked: true, waitHours: 48, managementVisible: true },
  { level: 4, label: 'FO Manager', description: 'Executive escalation. Notifies both FO Manager and management portal immediately. Available after 72 hours.', locked: true, waitHours: 72, managementVisible: true },
]

function EscalationModal({ onClose }) {
  const showToast = useToast()
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [issue, setIssue] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!selectedLevel || !issue.trim()) return showToast('Please select a level and describe the issue')
    setSubmitted(true)
    setTimeout(() => {
      showToast(`Escalation submitted to ${selectedLevel.label} — your team has been notified`)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber" />
            <h3 className="text-base font-bold text-white">Escalate an Issue</h3>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-white/40" /></button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-white/60 leading-relaxed">
            Select the appropriate escalation level. Higher levels are available only after the specified waiting period with no resolution.
          </p>

          {/* Level selector */}
          <div className="space-y-2">
            {ESCALATION_LEVELS.map((lvl) => (
              <motion.button
                key={lvl.level}
                whileHover={!lvl.locked ? { scale: 1.01 } : {}}
                onClick={() => !lvl.locked && setSelectedLevel(lvl)}
                disabled={lvl.locked}
                className={`w-full rounded-xl px-4 py-3.5 text-left transition-all ${
                  lvl.locked
                    ? 'opacity-40 cursor-not-allowed'
                    : selectedLevel?.level === lvl.level
                    ? 'bg-brand/20 border-brand/40'
                    : 'border-white/10 hover:border-white/20'
                }`}
                style={{
                  border: selectedLevel?.level === lvl.level ? '1px solid rgba(230,57,70,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: selectedLevel?.level === lvl.level ? 'rgba(230,57,70,0.12)' : 'rgba(255,255,255,0.03)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      lvl.locked ? 'bg-white/10 text-white/30' : selectedLevel?.level === lvl.level ? 'bg-brand text-white' : 'bg-white/10 text-white/70'
                    }`}>
                      L{lvl.level}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${lvl.locked ? 'text-white/40' : 'text-white'}`}>{lvl.label}</p>
                      {lvl.managementVisible && !lvl.locked && (
                        <span className="text-[10px] text-amber font-semibold">Visible in management portal</span>
                      )}
                    </div>
                  </div>
                  {lvl.locked ? (
                    <div className="flex items-center gap-1 text-[10px] text-white/30">
                      <Clock className="h-3 w-3" />
                      After {lvl.waitHours}h
                    </div>
                  ) : (
                    selectedLevel?.level === lvl.level && (
                      <CheckCircle2 className="h-4 w-4 text-brand" />
                    )
                  )}
                </div>
                {selectedLevel?.level === lvl.level && (
                  <p className="mt-2 text-xs text-white/60 leading-relaxed">{lvl.description}</p>
                )}
              </motion.button>
            ))}
          </div>

          {/* Issue description */}
          {selectedLevel && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Describe the issue <span className="text-brand">*</span>
              </label>
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                rows={3}
                placeholder="What needs to be resolved? Include any relevant context..."
                className="w-full resize-none rounded-xl px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/20"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </motion.div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white/50 hover:bg-white/5 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedLevel || !issue.trim() || submitted}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40 transition-all"
            >
              {submitted ? <><Clock className="h-4 w-4 animate-spin" /> Submitting...</> : <><AlertTriangle className="h-4 w-4" /> Submit Escalation</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Main Dashboard ─── */
export default function ClientDashboard() {
  const { selectedFY, setSelectedFY, availableFYs } = useClientFY()
  const fyData = getFYData(selectedFY)
  const recentEvents = getActivityEvents().slice(0, Math.max(5, 8))
  const [meetingModal, setMeetingModal] = useState(false)
  const [escalationModal, setEscalationModal] = useState(false)
  const [underReviewModal, setUnderReviewModal] = useState(false)

  return (
    <ClientLayout title="Engagement Dashboard" fullHeight>
      <ClientGreeting name="Karim Rahman" company="Kingdom Retail Holdings LLC" />
      <PageTransition className="flex-1 min-h-0 h-full">
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
                  <StatCard label="Accepted Requirements" value={fyData.stats.documentsAccepted} accent="#10B981" sub="Received & verified" />
                  <StatCard label="Outstanding Items" value={fyData.stats.pendingAction} accent="#F59E0B" sub={fyData.stats.pendingAction > 0 ? 'Action required' : 'None outstanding'} />
                  <StatCard label="Open Audit Queries" value={fyData.stats.openQueries} accent="#E63946" sub="Pending your response" />
                </div>

                {/* Documents Under Review — clickable */}
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  onClick={() => fyData.stats.underVerification > 0 && setUnderReviewModal(true)}
                  className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left"
                  style={{ background: D.card, border: `1px solid ${D.border}`, cursor: fyData.stats.underVerification > 0 ? 'pointer' : 'default' }}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Documents Under Review</p>
                    <p className="mt-1 text-4xl font-black text-indigo-400">{fyData.stats.underVerification}</p>
                    <p className="mt-1 text-sm" style={{ color: D.muted }}>
                      Being verified by the audit team
                      {fyData.stats.underVerification > 0 && <span className="ml-2 text-indigo-400 text-xs font-semibold">· Click to view list</span>}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Eye className="h-6 w-6 text-indigo-400" />
                  </div>
                </motion.button>

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

                {/* Escalate Issue */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setEscalationModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-colors"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Escalate an Issue
                </motion.button>

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">

            {/* Engagement Partner — top of right column */}
            <div className="rounded-2xl p-4 shrink-0" style={{ background: 'rgba(230,57,70,0.07)', border: '1px solid rgba(230,57,70,0.18)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand/70 mb-2">Engagement Partner</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-brand/20 shrink-0">{fyData.partner.initials}</div>
                <div>
                  <p className="text-sm font-bold text-white">{fyData.partner.firm}</p>
                  <p className="text-xs" style={{ color: D.muted }}>{fyData.partner.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-white/40" style={{ background: 'rgba(255,255,255,0.06)' }}>Statutory Audit</span>
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-emerald" style={{ background: 'rgba(16,185,129,0.12)' }}>Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Engagement Team */}
            <div className="rounded-2xl p-4 shrink-0" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Assigned Audit Team</p>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-emerald" style={{ background: 'rgba(16,185,129,0.15)' }}>{fyData.team.filter(m => m.online).length} Online</span>
              </div>
              <div className="space-y-2">
                {fyData.team.map((m) => (
                  <div key={m.initials} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors" style={{ background: 'rgba(255,255,255,0.03)', border: m.fileHandler ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent' }}>
                    <div className="relative shrink-0">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: m.fileHandler ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.1)' }}>{m.initials}</div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2" style={{ background: m.online ? '#10B981' : '#475569', borderColor: D.card }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white/90">{m.name}</p>
                      <p className="truncate text-[10px]" style={{ color: D.subtle }}>{m.role}</p>
                      {m.fileHandler && (
                        <span className="mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}>
                          Assigned to your file
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-semibold shrink-0" style={{ color: m.online ? '#10B981' : D.subtle }}>
                      {m.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
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
                  <LineChart className="h-3.5 w-3.5" />
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
        {escalationModal && <EscalationModal onClose={() => setEscalationModal(false)} />}
        {underReviewModal && <UnderReviewModal docs={UNDER_REVIEW_DOCS} onClose={() => setUnderReviewModal(false)} />}
      </AnimatePresence>
    </ClientLayout>
  )
}
