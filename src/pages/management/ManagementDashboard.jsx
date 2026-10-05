import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import {
  Search, X, Briefcase, Banknote, Users, CalendarClock,
  ChevronRight, ExternalLink, AlertCircle, ShieldAlert, Calendar, MessageSquare, Phone, CheckCircle2,
} from 'lucide-react'
import ManagementLayout from '../../components/management/ManagementLayout'
import { useMgmtScope } from '../../hooks/useMgmtScope'
import MeetingRequestModal from '../../components/client/MeetingRequestModal'
import { useTheme } from '../../context/ThemeContext'
import { useManagementRaisedEscalations } from '../../utils/escalations'
import { sendDirectMessage } from '../../utils/directMessages'
import { useToast } from '../../components/shared/Toast'
import {
  mgmtFOFiles,
  mgmtAllEscalations,
  mgmtClientDirectory,
  mgmtAbcpaPortfolio,
  mgmtMiscpaPortfolio,
  auditors,
  mgmtFOContacts,
  mgmtLeadConversion,
  mgmtConversionRate,
  mgmtDeadlineBreaches,
} from '../../data/sampleData'

/* ─── helpers ─── */
const STATUS_STYLE = {
  ok:   { bg: 'rgba(5,150,105,0.12)',  color: '#059669', label: 'On Track' },
  warn: { bg: 'rgba(217,119,6,0.12)',  color: '#D97706', label: 'Needs Attention' },
  crit: { bg: 'rgba(220,38,38,0.12)', color: '#DC2626', label: 'Critical' },
}
const ESC_STATUS = {
  'Open':         { bg: 'rgba(220,38,38,0.12)', color: '#DC2626' },
  'Under Review': { bg: 'rgba(217,119,6,0.12)', color: '#D97706' },
  'Resolved':     { bg: 'rgba(5,150,105,0.12)', color: '#059669' },
}
const TIER_COLOR = { 3: '#DC2626', 2: '#D97706', 1: '#2563EB' }

/* ─── Client Quick-Summary card ─── */
function ClientQuickSummary({ client, onClose }) {
  if (!client) return null
  const ss = STATUS_STYLE[client.status] || STATUS_STYLE.warn
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="absolute right-0 top-full z-50 mt-1 w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      style={{ border: '1px solid #E5E7EB' }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-navy">{client.name}</p>
          <p className="text-[10px] text-slate-400">{client.code} · {client.dept} · {client.city}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: ss.bg, color: ss.color }}>
            {ss.label}
          </span>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-slate-500">Audit Progress — {client.phase}</p>
          <p className="text-[10px] font-bold text-navy">{client.progress}%</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div initial={{ width: 0 }} animate={{ width: `${client.progress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full" style={{ background: ss.color }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0 border-t border-slate-100">
        {[
          { label: 'Turnover', value: client.turnover },
          { label: 'Audit Fee', value: client.fee },
          { label: 'Fee Paid', value: client.feePaid },
          { label: 'Balance', value: client.balance },
        ].map((f, i) => (
          <div key={f.label} className={`px-4 py-2.5 ${i % 2 === 0 ? 'border-r border-slate-100' : ''} border-b border-slate-100`}>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">{f.label}</p>
            <p className="mt-0.5 text-xs font-bold text-navy">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[9px] font-semibold text-amber">FO: {client.fo}</span>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[9px] font-semibold text-blue-700">{client.sector}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-semibold text-slate-500">{client.exceptions} exceptions</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Client Search (lives in the header) ─── */
export function ClientSearch() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const [scope] = useMgmtScope()

  const results = query.trim().length >= 2
    ? mgmtClientDirectory.filter(c => (scope === 'Combined' || c.dept === scope) && (
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.sector.toLowerCase().includes(query.toLowerCase())
      )).slice(0, 6)
    : []

  const handleBlur = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      setOpen(false)
      setActive(null)
    }
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
        <Search className="h-3.5 w-3.5 shrink-0 text-white/50" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(null) }}
          onFocus={() => setOpen(true)}
          placeholder="Search clients..."
          className="w-36 bg-transparent text-xs text-white placeholder-white/40 outline-none lg:w-48"
        />
        {query && (
          <button onClick={() => { setQuery(''); setActive(null); setOpen(false) }} className="text-white/40 hover:text-white/80">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (results.length > 0 || active) && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[400px] rounded-2xl bg-white shadow-2xl overflow-hidden"
            style={{ border: '1px solid #E5E7EB' }}
          >
            {!active ? (
              <>
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                </div>
                {results.map(c => {
                  const ss = STATUS_STYLE[c.status] || STATUS_STYLE.warn
                  return (
                    <button key={c.code} onClick={() => setActive(c)} tabIndex={0}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 text-left">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[9px] font-bold text-navy">
                        {c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-navy truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.code} · {c.sector} · {c.city}</p>
                      </div>
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                    </button>
                  )
                })}
              </>
            ) : (
              <ClientQuickSummary client={active} onClose={() => setActive(null)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Files by FO modal ─── */
function FilesModal({ onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.22 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-navy">Files by Front Office Manager</h3>
            <p className="text-xs text-slate-400 mt-0.5">148 total active engagements — FY2025</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {mgmtFOFiles.map(fo => (
            <div key={fo.fo}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: fo.color }}>
                    {fo.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{fo.name}</p>
                    <p className="text-[10px] text-slate-400">{fo.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-navy">{fo.total} files</span>
                  <span className="text-emerald font-semibold">{fo.won} won</span>
                  <span className="text-amber font-semibold">{fo.pipeline} pipeline</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(fo.active / 36) * 100}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full" style={{ background: fo.color }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Full Escalations modal ─── */
function EscalationsModal({ onClose, onMessage }) {
  const [filter, setFilter] = useState('All')
  const [scope] = useMgmtScope()
  const raised = useManagementRaisedEscalations()
  const scoped = [...raised, ...mgmtAllEscalations].filter(e => scope === 'Combined' || e.dept === scope)
  const filtered = filter === 'All' ? scoped : scoped.filter(e => e.status === filter)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.22 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <h3 className="text-base font-bold text-navy">Full Escalation Centre</h3>
            <p className="text-xs text-slate-400 mt-0.5">{scoped.length} escalations on record</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex gap-1.5 px-6 py-3 border-b border-slate-100 shrink-0">
          {['All', 'Open', 'Under Review', 'Resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-full px-3 py-1 text-[10px] font-semibold transition-colors"
              style={{ background: filter === f ? '#0D1B2A' : '#F1F5F9', color: filter === f ? '#fff' : '#64748B' }}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-[10px] font-semibold text-slate-400 self-center">
            {scoped.filter(e => e.status === 'Open').length} open
          </span>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          {filtered.map((e, i) => {
            const es = ESC_STATUS[e.status]
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${TIER_COLOR[e.tier]}15`, color: TIER_COLOR[e.tier] }}>
                      FO Level
                    </span>
                    <p className="text-sm font-bold text-navy">{e.client}</p>
                    <span className="text-[10px] text-slate-400">{e.dept}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">{e.date}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: es.bg, color: es.color }}>{e.status}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{e.reason}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="font-semibold" style={{ color: TIER_COLOR[e.tier] }}>{daysLabel(e)}</span>
                  <span>·</span>
                  <span>Auditor group: {auditorGroup(e.dept)}</span>
                  <span>·</span>
                  <span>FO manager: {e.fo}</span>
                  <FoContactActions fo={e.fo} onMessage={() => onMessage(e)} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Portfolio Health — status banner + progress ring ─── */
function PortfolioHealthCard({ total, onTrack, needsAttention, onViewAttention }) {
  const pct = total > 0 ? Math.round((onTrack / total) * 100) : 0
  const healthy = needsAttention === 0
  const accent = healthy ? '#059669' : '#D97706'
  const data = [
    { name: 'On Track', value: onTrack || 0, color: '#059669' },
    { name: 'Needs Attention', value: needsAttention || 0, color: '#D97706' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}
      className="flex shrink-0 flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${accent}1F` }}>
          {healthy
            ? <CheckCircle2 className="h-6 w-6" style={{ color: accent }} />
            : <AlertCircle className="h-6 w-6" style={{ color: accent }} />}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Portfolio Health</p>
          <p className="mt-1 text-base font-bold text-navy">
            {healthy ? `All ${total} clients in scope are on track` : `${needsAttention} of ${total} clients need attention`}
          </p>
          <p className="mt-1 text-xs text-slate-400">Derived from current engagement status across the portfolio.</p>
          <button type="button" onClick={onViewAttention} className="mt-2 text-xs font-semibold text-brand hover:underline">
            View Escalation Centre →
          </button>
        </div>
      </div>
      <div className="relative mx-auto h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={38} outerRadius={54} startAngle={90} endAngle={450} stroke="none" animationDuration={700}>
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-black text-navy">{pct}%</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">On Track</p>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, iconColor, label, value, sub, onClick, delay = 0 }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left w-full transition-all"
      style={{ transform: hov && onClick ? 'translateY(-2px)' : 'none', boxShadow: hov && onClick ? '0 8px 24px rgba(0,0,0,0.1)' : undefined }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${iconColor}15` }}>
          <Icon className="h-6 w-6" style={{ color: iconColor }} />
        </div>
        {onClick && (
          <ChevronRight className="h-4 w-4 mt-0.5 text-slate-300 transition-transform" style={{ transform: hov ? 'translateX(2px)' : 'none' }} />
        )}
      </div>
      <p className="mt-4 text-3xl font-black text-navy">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      {sub && <p className="mt-1.5 text-xs text-slate-400">{sub}</p>}
    </motion.button>
  )
}

const daysLabel = (e) => (e.daysOverdue > 0 ? `${e.daysOverdue}d overdue` : 'Raised today')
const auditorGroup = (code) => {
  const a = auditors.find((x) => x.code === code)
  return a ? `${a.code} — ${a.name}` : code
}

/* ─── Message / Teams-call icons for an FO manager ─── */
function FoContactActions({ fo, onMessage }) {
  const showToast = useToast()
  const contact = mgmtFOContacts[fo]
  const call = () => {
    if (!contact) return
    window.open(`https://teams.microsoft.com/l/call/0/0?users=${encodeURIComponent(contact.email)}`, '_blank', 'noopener,noreferrer')
    showToast(`Starting Teams call with ${fo}…`)
  }
  const btn = 'flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-brand hover:bg-brand/10 hover:text-brand'
  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" aria-label={`Message ${fo}`} title={`Message ${fo}`} onClick={onMessage} className={btn}>
        <MessageSquare className="h-3.5 w-3.5" />
      </button>
      <button type="button" aria-label={`Teams call ${fo}`} title={`Teams call ${fo}`} onClick={call} className={btn}>
        <Phone className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}

/* ─── Escalation detail (what, which client, auditor group, responsible FO manager) ─── */
function EscalationDetail({ escalation, onClose }) {
  const e = escalation
  const es = ESC_STATUS[e.status]
  const showToast = useToast()
  const [composing, setComposing] = useState(!!e.compose)
  const [sent, setSent] = useState(false)
  const [text, setText] = useState(`Re ${e.id} — ${e.client}: please update me on this escalation as soon as possible.`)
  const send = () => {
    if (!text.trim()) return
    sendDirectMessage({ to: e.fo, text: text.trim(), ref: e.id })
    setSent(true)
    showToast(`Message sent to ${e.fo}`)
  }
  const rows = [
    ['Client', e.client],
    ['Auditor group', auditorGroup(e.dept)],
  ]
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.22 }} onClick={(ev) => ev.stopPropagation()}
        role="dialog" aria-label="Escalation details"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${TIER_COLOR[e.tier]}15`, color: TIER_COLOR[e.tier] }}>FO Level</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: es.bg, color: es.color }}>{e.status}</span>
            </div>
            <h3 className="mt-2 text-base font-bold text-navy">Escalation Details</h3>
            <p className="text-[11px] text-slate-400">{e.id} · {e.date} · {daysLabel(e)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-300 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">What it is about</p>
            <p className="mt-1 text-sm leading-relaxed text-navy">{e.reason}</p>
          </div>
          <dl className="space-y-3">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4 border-t border-slate-100 pt-3">
                <dt className="text-xs text-slate-400">{k}</dt>
                <dd className="text-right text-sm font-semibold text-navy">{v}</dd>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-xs text-slate-400">Responsible FO manager</dt>
                <dd className="flex items-center gap-3 text-sm font-semibold text-navy">
                  {e.fo}
                  <FoContactActions fo={e.fo} onMessage={() => { setComposing((v) => !v); setSent(false) }} />
                </dd>
              </div>
              {composing && (
                <div className="mt-3 rounded-xl border border-slate-200 p-3">
                  {sent ? (
                    <p className="flex items-center gap-2 text-xs font-semibold text-emerald">
                      <CheckCircle2 className="h-4 w-4" /> Sent to {e.fo} — delivered to their inbox
                    </p>
                  ) : (
                    <>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400" htmlFor="fo-msg">Message to {e.fo}</label>
                      <textarea
                        id="fo-msg" rows={3} value={text} onChange={(ev) => setText(ev.target.value)}
                        className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs text-navy outline-none focus:border-brand"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setComposing(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-navy">Cancel</button>
                        <button type="button" onClick={send} disabled={!text.trim()} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Send now</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </dl>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Auto-scrolling escalation ticker ─── */
function EscalationTicker({ items, onOpen }) {
  const { isDark } = useTheme()
  const boxRef = useRef(null)
  const trackRef = useRef(null)
  const posRef = useRef(0)

  useEffect(() => {
    const track = trackRef.current
    const box = boxRef.current
    if (!track || !box) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    posRef.current = 0
    track.style.transform = 'translateY(0)'
    const half = track.scrollHeight / 2
    if (half <= box.clientHeight) return undefined
    let raf
    const step = () => {
      if (!box.matches(':hover')) {
        posRef.current += 0.4
        if (posRef.current >= half) posRef.current = 0
        track.style.transform = `translateY(-${posRef.current}px)`
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [items])

  const rows = [...items, ...items]
  const fade = isDark ? '#0F1629' : '#FFFFFF'

  return (
    <div
      ref={boxRef}
      className="relative min-h-0 flex-1 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6" style={{ background: `linear-gradient(to bottom, ${fade}, transparent)` }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6" style={{ background: `linear-gradient(to top, ${fade}, transparent)` }} />
      <div ref={trackRef} className="will-change-transform">
        {rows.map((e, i) => {
          const es = ESC_STATUS[e.status]
          return (
            <button
              key={`${e.id}-${i}`}
              type="button"
              onClick={() => onOpen(e)}
              aria-label={`View escalation — ${e.client}`}
              className="flex w-full items-start gap-3 border-b border-slate-100 px-5 py-3.5 text-left transition-colors hover:bg-slate-500/10"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white" style={{ background: TIER_COLOR[e.tier] }}>
                FO
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-navy">{e.client}</p>
                  <span className="text-[10px] text-slate-400">{e.dept}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{e.reason}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400">
                  <span className="font-semibold" style={{ color: TIER_COLOR[e.tier] }}>{daysLabel(e)}</span>
                  <span>·</span>
                  <span>{e.date}</span>
                  <span>·</span>
                  <span>FO: {e.fo}</span>
                </div>
              </div>
              <span className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: es.bg, color: es.color }}>{e.status}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─── */
export default function ManagementDashboard() {
  const [modal, setModal] = useState(null)
  const [scope] = useMgmtScope()
  const portfolio = scope === 'ABCPA' ? mgmtAbcpaPortfolio : scope === 'MISCPA' ? mgmtMiscpaPortfolio : null
  const navigate = useNavigate()

  const raised = useManagementRaisedEscalations()
  const escalations = useMemo(() => [...raised, ...mgmtAllEscalations].filter(e => scope === 'Combined' || e.dept === scope), [scope, raised])
  const [detail, setDetail] = useState(null)
  const openEscalations = escalations.filter(e => e.status === 'Open').length
  const [meetingOpen, setMeetingOpen] = useState(false)

  const scopedClients = useMemo(() => mgmtClientDirectory.filter(c => scope === 'Combined' || c.dept === scope), [scope])
  const clientsOnTrack = scopedClients.filter(c => c.status === 'ok').length
  const clientsNeedingAttention = scopedClients.filter(c => c.status === 'warn' || c.status === 'crit').length

  const scopedDeadlines = useMemo(() => mgmtDeadlineBreaches.filter(b => scope === 'Combined' || b.dept === scope), [scope])
  const breachCount = scopedDeadlines.filter(b => b.daysLeft < 0).length
  const dueSoonCount = scopedDeadlines.filter(b => b.daysLeft >= 0 && b.daysLeft <= 7).length

  return (
    <ManagementLayout title="Dashboard" fullHeight headerSearch={<ClientSearch />}>
      <div className="flex h-full flex-col gap-4 overflow-hidden">

        {/* ── Header ── */}
        <div className="shrink-0 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-navy">Executive Overview</h1>
            <p className="text-xs text-slate-400">
              {portfolio ? `${scope} Department View` : 'Combined View — ABCPA + MISCPA'} · Business status, attention items and critical dates
            </p>
          </div>
          {breachCount > 0 && (
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-alert-red"
              style={{ background: 'rgba(220,38,38,0.1)' }}
            >
              <ShieldAlert className="h-3.5 w-3.5" /> {breachCount} deadline breach{breachCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {portfolio && (
          <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-navy">{portfolio.label}</p>
                <p className="text-[11px] text-slate-400">Manager {portfolio.manager} · Asst. Manager {portfolio.am}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {portfolio.breakdown.map((b) => (
                  <span key={b.label} className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: `${b.color}1F`, color: b.color }}>
                    {b.label} {b.value}
                  </span>
                ))}
              </div>
              <p className="min-w-0 text-[11px] text-slate-500">
                <span className="font-semibold text-navy">Urgent:</span>{' '}
                {portfolio.urgentFiles.map((f) => `${f.client} (${f.days}d · ${f.status})`).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Users} iconColor="#7C3AED"
            label="Clients in Scope" value={String(scopedClients.length)}
            sub={`${clientsOnTrack} currently on track`} delay={0} />
          <StatCard icon={Briefcase} iconColor="#2563EB"
            label="Active Engagements" value={portfolio ? String(portfolio.total) : '148'}
            sub={portfolio ? `${scope} Department` : 'Combined portfolio'}
            onClick={() => setModal('files')} delay={0.08} />
          <StatCard icon={CalendarClock} iconColor="#DC2626"
            label="Critical Dates" value={String(scopedDeadlines.length)}
            sub={`${breachCount} breached · ${dueSoonCount} due within 7 days`}
            delay={0.16} />
          <StatCard icon={AlertCircle} iconColor="#D97706"
            label="Open Escalations" value={`${openEscalations} Open`}
            sub={`${escalations.length} total on record`}
            onClick={() => setModal('escalations')} delay={0.24} />
        </div>

        {/* ── Portfolio Health ── */}
        <PortfolioHealthCard
          total={scopedClients.length}
          onTrack={clientsOnTrack}
          needsAttention={clientsNeedingAttention}
          onViewAttention={() => setModal('escalations')}
        />

        {/* ── Main content row ── */}
        <div className="flex min-h-0 flex-1 gap-4">

          {/* LEFT — Escalation Centre */}
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-alert-red" />
                <h2 className="text-sm font-bold text-navy">Escalation Centre</h2>
                <span className="rounded-full bg-alert-red/10 px-2 py-0.5 text-[10px] font-bold text-alert-red">{openEscalations} Open</span>
              </div>
              <button onClick={() => setModal('escalations')}
                className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                Full Escalation View <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <EscalationTicker items={escalations} onOpen={setDetail} />

            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-[11px] text-slate-400">{escalations.length} escalation{escalations.length !== 1 ? 's' : ''} on record</p>
              <button onClick={() => setModal('escalations')}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* RIGHT — Meeting + Revenue + Lead funnel */}
          <div className="flex w-[300px] shrink-0 flex-col gap-4 min-h-0 overflow-y-auto">

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMeetingOpen(true)}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <Calendar className="h-4 w-4 text-indigo-400" />
              Request a Meeting
            </motion.button>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shrink-0">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Business Dev.</h2>
                <span className="shrink-0 rounded-full bg-amber/10 px-2 py-1 text-[10px] font-bold text-amber">{mgmtConversionRate}% Conv.</span>
              </div>
              <div className="space-y-1.5">
                {mgmtLeadConversion.map((stage, i) => {
                  const max = mgmtLeadConversion[0].value
                  return (
                    <div key={stage.label}>
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-slate-500">{stage.label}</span>
                        <span className="font-bold text-navy">{stage.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(stage.value / max) * 100}%` }}
                          transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                          className="h-full rounded-full bg-navy" style={{ opacity: 1 - i * 0.18 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MeetingRequestModal open={meetingOpen} onClose={() => setMeetingOpen(false)} />

      <AnimatePresence>
        {modal === 'files' && <FilesModal onClose={() => setModal(null)} />}
        {modal === 'escalations' && <EscalationsModal onClose={() => setModal(null)} onMessage={(e) => { setModal(null); setDetail({ ...e, compose: true }) }} />}
        {detail && <EscalationDetail escalation={detail} onClose={() => setDetail(null)} />}
      </AnimatePresence>
    </ManagementLayout>
  )
}
