import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, CheckCircle2, AlertCircle, FileText, ChevronRight,
  Calendar, ChevronDown, X, Send, TrendingUp, Search, LineChart,
  AlertTriangle, ChevronUp, Clock, Eye,
} from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
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
      { id: 'tb-acceptance', label: 'TB Acceptance', status: 'completed' },
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
      { id: 'tb-acceptance', label: 'TB Acceptance', status: 'completed' },
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
      { id: 'tb-acceptance', label: 'TB Acceptance', status: 'completed' },
      { id: 'fieldwork', label: 'Audit Field Work', status: 'active' },
      { id: 'draft', label: 'Draft FS Review', status: 'upcoming' },
      { id: 'signoff', label: 'Sign-off & Completion', status: 'upcoming' },
      { id: 'filing', label: 'Regulatory Filing', status: 'upcoming' },
    ],
  }
}

const STAGE_TOOLTIPS = {
  'Engagement Acceptance': 'Engagement letter issued and agreed; audit terms confirmed.',
  'TB Acceptance': 'Trial balance submitted in prescribed format and formally accepted by the audit team as fit for audit procedures.',
  'Audit Field Work': 'Audit team performs substantive procedures and analytical testing.',
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

const OUTSTANDING_ITEMS = [
  { ref: 'BNK-03', name: 'Bank Statement October 2024' },
  { ref: 'TAX-07', name: 'ZATCA VAT Return Q3 2024' },
  { ref: 'PPE-10', name: 'Fixed Asset Register (Updated)' },
  { ref: 'REV-08', name: 'Revenue Reconciliation Schedule' },
  { ref: 'PAY-04', name: 'Payroll Summary September 2024' },
  { ref: 'COG-14', name: 'Inventory Count Sheets (Sep)' },
  { ref: 'BNK-04', name: 'Bank Statement November 2024' },
]

const OPEN_QUERIES = [
  { ref: 'Q-041', name: 'Explain variance in COGS vs prior year' },
  { ref: 'Q-038', name: 'Confirm related party transaction terms' },
  { ref: 'Q-035', name: 'Provide aging analysis for receivables' },
  { ref: 'Q-033', name: 'Clarify depreciation method change' },
  { ref: 'Q-029', name: 'Upload signed lease agreement' },
  { ref: 'Q-027', name: 'Reconcile revenue to ZATCA filings' },
  { ref: 'Q-024', name: 'Confirm write-off approval authority' },
  { ref: 'Q-021', name: 'Provide board resolution for dividend' },
]

/* ─── Expandable stat card ─── */
function ExpandableStatCard({ label, value, sub, accent, items, linkTo }) {
  const count = useCountUp(value)
  const [open, setOpen] = useState(false)
  const hasItems = items?.length > 0
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: D.card, border: `1px solid ${D.border}` }}>
      <button
        className="w-full text-left px-5 pt-5 pb-4 flex items-start justify-between gap-3 transition-colors"
        style={{ background: 'transparent' }}
        onClick={() => hasItems && setOpen(v => !v)}
        onMouseEnter={e => hasItems && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>{label}</p>
          <p className="mt-2 text-4xl font-black leading-none" style={{ color: accent }}>{count}</p>
          {sub && <p className="mt-1.5 text-sm" style={{ color: D.muted }}>{sub}</p>}
        </div>
        {hasItems && (
          <motion.div className="mt-1 shrink-0" animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronRight className="h-4 w-4" style={{ color: D.muted }} />
          </motion.div>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && hasItems && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div style={{ borderTop: `1px solid ${D.border}` }}>
              {items.slice(0, 6).map((item, i) => (
                <Link key={i} to={linkTo}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/5"
                  style={{ borderBottom: i < Math.min(items.length, 6) - 1 ? `1px solid ${D.border}` : 'none' }}
                >
                  <span className="text-[10px] font-mono font-bold shrink-0 w-12 truncate" style={{ color: accent }}>{item.ref}</span>
                  <span className="text-xs flex-1 truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.name}</span>
                  <ChevronRight className="h-3 w-3 shrink-0" style={{ color: D.muted }} />
                </Link>
              ))}
              {items.length > 6 && (
                <Link to={linkTo} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors hover:opacity-80" style={{ color: accent }}>
                  View all {items.length} items <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Requirements ring with optional On Hold slot ─── */
function PBCRing({ total, accepted, fy, hold }) {
  const count = useCountUp(accepted)
  const pct = total > 0 ? Math.round((accepted / total) * 100) : 0
  const r = 38; const circ = 2 * Math.PI * r
  return (
    <div className="flex items-stretch gap-0 rounded-2xl overflow-hidden" style={{ background: D.card, border: `1px solid ${D.border}` }}>
      {/* Left slot — On Hold callout */}
      {hold?.active ? (
        <div className="flex flex-col justify-center px-5 py-4 flex-1 min-w-0" style={{ borderRight: `1px solid ${hold.reason === 'payment' ? 'rgba(230,57,70,0.2)' : 'rgba(245,158,11,0.2)'}`, background: hold.reason === 'payment' ? 'rgba(230,57,70,0.06)' : 'rgba(245,158,11,0.05)' }}>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: hold.reason === 'payment' ? '#F87171' : '#FCD34D' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: hold.reason === 'payment' ? '#F87171' : '#FCD34D' }}>On Hold</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {hold.reason === 'payment'
              ? 'Your file is on hold due to payment.'
              : hold.reason === 'no-response'
              ? 'Your file is on hold — no response & documents are pending.'
              : 'Your file is on hold — documents are pending.'}
          </p>
          <Link
            to={hold.reason === 'no-response' ? '/client/queries' : '/client/documents'}
            className="flex items-center gap-1 text-[11px] font-semibold mt-3 hover:opacity-75 transition-opacity"
            style={{ color: hold.reason === 'payment' ? '#F87171' : '#FCD34D' }}
          >
            View full pending list <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="flex-1" />
      )}
      {/* Ring + count */}
      <div className="flex items-center gap-6 px-5 py-5 shrink-0">
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
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Requirements</p>
          <p className="mt-1 text-4xl font-black" style={{ color: 'var(--c-text)' }}>{count} <span className="text-xl font-medium" style={{ color: D.muted }}>/ {total}</span></p>
          <p className="mt-1 text-sm" style={{ color: D.muted }}>accepted</p>
        </div>
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
function RequestMeetingModal({ onClose, onRecord }) {
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
    onRecord?.(`Meeting requested: "${topic}" on ${date}${time ? ' at ' + time : ''}`, 'blue')
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

/* ─── Escalation Modal (3-level) ─── */
const ESCALATION_LEVELS = [
  {
    level: 1,
    label: 'Audit Lead',
    description: 'Direct escalation to your assigned Audit Lead. They will be notified immediately and are expected to respond within 24 hours.',
    locked: false,
    waitHours: 0,
    managementVisible: false,
    icon: '👤',
  },
  {
    level: 2,
    label: 'Audit Manager',
    description: 'Escalate to the Audit Manager if your Audit Lead has not resolved the issue within 24 hours. The Audit Manager will be notified immediately.',
    locked: true,
    waitHours: 24,
    managementVisible: false,
    icon: '👔',
  },
  {
    level: 3,
    label: 'Front Office Manager',
    description: 'Executive-level escalation to the Front Office Manager responsible for your file. This escalation is also visible to management. Available after 48 hours with no resolution.',
    locked: true,
    waitHours: 48,
    managementVisible: true,
    icon: '🏢',
  },
]

function EscalationModal({ onClose, onRecord }) {
  const showToast = useToast()
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [issue, setIssue] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!selectedLevel || !issue.trim()) return showToast('Please select a level and describe the issue')
    setSubmitted(true)
    setTimeout(() => {
      const mgmtNote = selectedLevel.managementVisible ? ' This has also been flagged in the management portal.' : ''
      showToast(`Escalation submitted to ${selectedLevel.label} — your team has been notified.${mgmtNote}`)
      onRecord?.(`Issue escalated to ${selectedLevel.label}: "${issue.trim().slice(0, 60)}${issue.length > 60 ? '…' : ''}"`, 'amber')
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber" />
            <h3 className="text-base font-bold text-white">Escalate an Issue</h3>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-white/40" /></button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Intro */}
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <p className="text-xs text-amber/90 leading-relaxed">
              Escalations follow a structured path — <strong>one level at a time</strong>. Higher levels unlock only after the waiting period with no resolution. Front Office Manager escalations are visible to management.
            </p>
          </div>

          {/* Level steps */}
          <div className="relative">
            {/* connector line */}
            <div className="absolute left-[18px] top-6 bottom-6 w-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

            <div className="space-y-2">
              {ESCALATION_LEVELS.map((lvl, idx) => {
                const isSelected = selectedLevel?.level === lvl.level
                const prevAvail  = idx === 0 || !ESCALATION_LEVELS[idx - 1]?.locked
                return (
                  <motion.button
                    key={lvl.level}
                    whileHover={!lvl.locked ? { x: 2 } : {}}
                    onClick={() => !lvl.locked && setSelectedLevel(lvl)}
                    disabled={lvl.locked}
                    className={`relative w-full rounded-xl pl-12 pr-4 py-3.5 text-left transition-all ${
                      lvl.locked ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
                    }`}
                    style={{
                      border: isSelected
                        ? '1px solid rgba(230,57,70,0.45)'
                        : '1px solid rgba(255,255,255,0.07)',
                      background: isSelected
                        ? 'rgba(230,57,70,0.10)'
                        : lvl.locked
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    {/* Step circle */}
                    <div
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-[26px] w-[26px] items-center justify-center rounded-full text-xs font-bold z-10"
                      style={{
                        background: isSelected
                          ? '#E63946'
                          : lvl.locked
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.12)',
                        color: lvl.locked ? 'rgba(255,255,255,0.25)' : '#fff',
                        border: isSelected ? '2px solid rgba(230,57,70,0.6)' : '2px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {lvl.level}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${lvl.locked ? 'text-white/35' : 'text-white'}`}>{lvl.label}</p>
                          {lvl.managementVisible && (
                            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber"
                              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                              Management Visible
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-1.5 text-xs text-white/60 leading-relaxed"
                          >
                            {lvl.description}
                          </motion.p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {lvl.locked ? (
                          <div className="flex items-center gap-1 text-[10px] text-white/25">
                            <Clock className="h-3 w-3" />
                            After {lvl.waitHours}h
                          </div>
                        ) : isSelected ? (
                          <CheckCircle2 className="h-4 w-4 text-brand" />
                        ) : null}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Issue description */}
          {selectedLevel && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <label className="block text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
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
              {selectedLevel.managementVisible && (
                <p className="text-[11px] text-amber/80 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  This escalation will be visible to management and the Front Office Manager.
                </p>
              )}
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

/* ─── Auto-scrolling activity ticker ─── */
function ActivityTicker({ events }) {
  const trackRef = useRef(null)
  const posRef   = useRef(0)
  const rafRef   = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const SPEED = 0.4 // px per frame
    const step = () => {
      posRef.current += SPEED
      const half = track.scrollHeight / 2
      if (posRef.current >= half) posRef.current = 0
      track.style.transform = `translateY(-${posRef.current}px)`
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [events])

  const rows = [...events, ...events] // duplicate for seamless loop

  return (
    <div className="relative flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      {/* fade edges */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6" style={{ background: 'linear-gradient(to bottom, var(--c-card), transparent)' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6" style={{ background: 'linear-gradient(to top, var(--c-card), transparent)' }} />
      <div ref={trackRef} className="will-change-transform">
        {rows.map((event, i) => {
          const Icon = EVENT_ICON[event.icon] || FileText
          const color = EVENT_COLOR[event.icon] || '#6366F1'
          return (
            <div key={`${event.id}-${i}`} className="flex items-start gap-3 px-4 py-2.5" style={{ borderBottom: 'rgba(255,255,255,0.04) 1px solid' }}>
              <span className="mt-0.5 shrink-0" style={{ color }}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-white/80 leading-snug">{event.description}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--c-subtle)' }}>{event.timestamp}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─── */
export default function ClientDashboard() {
  const { selectedFY, setSelectedFY, availableFYs } = useClientFY()
  const fyData = getFYData(selectedFY)
  const baseEvents = getActivityEvents(selectedFY).slice(0, 8)
  const [liveEvents, setLiveEvents] = useState([])
  const recentEvents = [...liveEvents, ...baseEvents]
  const [meetingModal, setMeetingModal] = useState(false)
  const [escalationModal, setEscalationModal] = useState(false)
  const [underReviewModal, setUnderReviewModal] = useState(false)

  const recordEvent = (description, icon = 'blue') => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' · Just now'
    setLiveEvents(prev => [{ id: `live-${Date.now()}`, description, icon, timestamp, section: 'Milestones' }, ...prev])
  }

  return (
    <ClientLayout title="Engagement Dashboard" fullHeight>
      <PageTransition className="flex-1 min-h-0 h-full">
        <div className="flex h-full gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              <motion.div key={selectedFY} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex flex-col gap-4">

                {/* Lifecycle stepper */}
                <div className="rounded-2xl px-5 py-4" style={{ background: D.card, border: `1px solid ${D.border}` }}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Engagement Phase</p>
                  <LifecycleStepper stages={fyData.stages} tooltips={STAGE_TOOLTIPS} />
                </div>

                {/* Ring card with optional On Hold slot */}
                <PBCRing
                  total={fyData.stats.totalRequirements}
                  accepted={fyData.stats.documentsAccepted}
                  fy={selectedFY}
                  hold={selectedFY === 'FY2024' ? clientPortal.onHold : null}
                />

                {/* 2×2 expandable stat grid */}
                <div className="grid grid-cols-2 gap-3">
                  <ExpandableStatCard
                    label="Accepted"
                    value={fyData.stats.documentsAccepted}
                    sub={`of ${fyData.stats.totalRequirements} requirements`}
                    accent="#10B981"
                    items={null}
                    linkTo="/client/documents"
                  />
                  <ExpandableStatCard
                    label="Outstanding"
                    value={fyData.stats.pendingAction}
                    sub={fyData.stats.pendingAction > 0 ? 'Action needed' : 'All clear'}
                    accent="#F59E0B"
                    items={OUTSTANDING_ITEMS.slice(0, fyData.stats.pendingAction)}
                    linkTo="/client/documents"
                  />
                  <ExpandableStatCard
                    label="Under Review"
                    value={fyData.stats.underVerification}
                    sub="By audit team"
                    accent="#818CF8"
                    items={UNDER_REVIEW_DOCS.slice(0, fyData.stats.underVerification).map(d => ({ ref: d.ref, name: d.name }))}
                    linkTo="/client/documents"
                  />
                  <ExpandableStatCard
                    label="Audit Queries"
                    value={fyData.stats.openQueries}
                    sub="Open queries"
                    accent="#E63946"
                    items={OPEN_QUERIES.slice(0, fyData.stats.openQueries)}
                    linkTo="/client/queries"
                  />
                </div>

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

            {/* Assigned Audit Team — top of right column */}
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

            {/* Request a Meeting — between team and activity */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMeetingModal(true)}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
            >
              <Calendar className="h-4 w-4 text-indigo-400" />
              Request a Meeting
            </motion.button>

            {/* Recent Activity — auto-scrolling ticker */}
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl overflow-hidden" style={{ background: D.card, border: `1px solid ${D.border}` }}>
              <div className="px-4 py-3 shrink-0 flex items-center justify-between" style={{ borderBottom: `1px solid ${D.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Recent Activity</p>
                {liveEvents.length > 0 && (
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold text-emerald" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse inline-block" />
                    Live
                  </span>
                )}
              </div>
              <ActivityTicker events={recentEvents} />
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
        {meetingModal && <RequestMeetingModal onClose={() => setMeetingModal(false)} onRecord={recordEvent} />}
        {escalationModal && <EscalationModal onClose={() => setEscalationModal(false)} onRecord={recordEvent} />}
        {underReviewModal && <UnderReviewModal docs={UNDER_REVIEW_DOCS} onClose={() => setUnderReviewModal(false)} />}
      </AnimatePresence>
    </ClientLayout>
  )
}
