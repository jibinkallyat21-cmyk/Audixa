import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, TrendingUp, Briefcase, Banknote, AlertTriangle,
  ChevronRight, ExternalLink, Users, CheckCircle2, Clock,
  AlertCircle, Building2, Phone, Mail, BarChart2,
} from 'lucide-react'
import ManagementLayout from '../../components/management/ManagementLayout'
import { useToast } from '../../components/shared/Toast'
import {
  mgmtUser,
  mgmtFOFiles,
  mgmtARPending,
  mgmtAllEscalations,
  mgmtRevenueTiles,
  mgmtTotalTurnover,
  mgmtClientDirectory,
  mgmtLeadConversion,
  mgmtConversionRate,
} from '../../data/sampleData'

/* ─── helpers ─── */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const numeric = typeof target === 'number' ? target : parseInt(String(target).replace(/[^\d]/g, ''), 10) || 0
    let frame
    const start = performance.now()
    const step = (t) => {
      const progress = Math.min((t - start) / duration, 1)
      setValue(Math.round(numeric * progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

const STATUS_STYLE = {
  ok:   { bg: 'rgba(5,150,105,0.12)', color: '#059669', label: 'On Track' },
  warn: { bg: 'rgba(217,119,6,0.12)', color: '#D97706', label: 'Needs Attention' },
  crit: { bg: 'rgba(220,38,38,0.12)', color: '#DC2626', label: 'Critical' },
}
const ESC_STATUS = {
  'Open':         { bg: 'rgba(220,38,38,0.12)', color: '#DC2626' },
  'Under Review': { bg: 'rgba(217,119,6,0.12)', color: '#D97706' },
  'Resolved':     { bg: 'rgba(5,150,105,0.12)', color: '#059669' },
}
const TIER_COLOR = { 3: '#DC2626', 2: '#D97706', 1: '#2563EB' }

/* ─── Client Quick-Summary modal ─── */
function ClientQuickSummary({ client, onClose }) {
  if (!client) return null
  const ss = STATUS_STYLE[client.status] || STATUS_STYLE.warn
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="absolute right-0 top-full z-[200] mt-2 w-[380px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      style={{ border: '1px solid #E5E7EB' }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-sm font-bold text-navy">{client.name}</p>
          <p className="text-[11px] text-slate-400">{client.code} · {client.dept} · {client.city}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: ss.bg, color: ss.color }}>
            {ss.label}
          </span>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-500">Audit Progress — {client.phase}</p>
          <p className="text-[11px] font-bold text-navy">{client.progress}%</p>
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
          { label: 'Exceptions', value: client.exceptions },
          { label: 'Due Date', value: client.dueDate },
        ].map((f, i) => (
          <div key={f.label} className={`px-5 py-2.5 ${i % 2 === 0 ? 'border-r border-slate-100' : ''} ${i < 4 ? 'border-b border-slate-100' : ''}`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{f.label}</p>
            <p className="mt-0.5 text-xs font-bold text-navy">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Engagement Team</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[10px] font-semibold text-navy">Lead: {client.lead}</span>
          <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber">FO: {client.fo}</span>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">Sector: {client.sector}</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Global Client Search (top-right) ─── */
function ClientSearch() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const results = query.trim().length >= 2
    ? mgmtClientDirectory.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.sector.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  useEffect(() => {
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false); setActive(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
        <Search className="h-3.5 w-3.5 shrink-0 text-white/50" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(null) }}
          onFocus={() => setOpen(true)}
          placeholder="Search clients..."
          className="w-40 bg-transparent text-xs text-white placeholder-white/40 outline-none lg:w-52"
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
            className="absolute right-0 top-full z-[200] mt-2 w-[420px] rounded-2xl bg-white shadow-2xl overflow-hidden"
            style={{ border: '1px solid #E5E7EB' }}
          >
            {!active ? (
              <>
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                </div>
                {results.map(c => {
                  const ss = STATUS_STYLE[c.status] || STATUS_STYLE.warn
                  return (
                    <button key={c.code} onClick={() => setActive(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 text-left">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">
                        {c.name.split(' ').map(w => w[0]).slice(0,2).join('')}
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
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
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

/* ─── AR Pending modal ─── */
function ARModal({ onClose }) {
  const totalBalance = mgmtARPending.reduce((s, c) => s + c.balance, 0)
  const overdueCount = mgmtARPending.filter(c => c.daysOverdue > 0).length
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.22 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <h3 className="text-base font-bold text-navy">Accounts Receivable — Pending Payments</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              SAR {totalBalance.toLocaleString()} outstanding · {overdueCount} overdue
            </p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
              <tr>
                {['Client', 'Dept', 'Fee', 'Paid', 'Balance', 'Status', 'Contact'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mgmtARPending.map((row, i) => {
                const st = row.status === 'Overdue'
                  ? { bg: 'rgba(220,38,38,0.1)', color: '#DC2626' }
                  : row.status === 'Due Today'
                  ? { bg: 'rgba(217,119,6,0.12)', color: '#D97706' }
                  : { bg: 'rgba(5,150,105,0.1)', color: '#059669' }
                return (
                  <tr key={row.code} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{row.client}</p>
                      <p className="text-slate-400">{row.code}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.dept}</td>
                    <td className="px-4 py-3 font-semibold text-navy">SAR {row.fee.toLocaleString()}</td>
                    <td className="px-4 py-3 text-emerald font-semibold">SAR {row.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: st.color }}>SAR {row.balance.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 font-bold text-[10px]" style={{ background: st.bg, color: st.color }}>
                        {row.status}{row.daysOverdue > 0 ? ` · ${row.daysOverdue}d` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.contact}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-6 py-3 shrink-0 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-500">Total outstanding: <span className="font-bold text-navy">SAR {totalBalance.toLocaleString()}</span></p>
          <p className="text-xs text-slate-400">SAR 84K marked overdue &gt;30 days</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Full Escalations modal ─── */
function EscalationsModal({ onClose }) {
  const [filter, setFilter] = useState('All')
  const filtered = filter === 'All' ? mgmtAllEscalations : mgmtAllEscalations.filter(e => e.status === filter)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ duration: 0.22 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <h3 className="text-base font-bold text-navy">Full Escalation Centre</h3>
            <p className="text-xs text-slate-400 mt-0.5">{mgmtAllEscalations.length} escalations on record — current period</p>
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
            {mgmtAllEscalations.filter(e => e.status === 'Open').length} open · {mgmtAllEscalations.filter(e => e.status === 'Under Review').length} under review
          </span>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          {filtered.map((e, i) => {
            const es = ESC_STATUS[e.status]
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-slate-100 p-4 hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${TIER_COLOR[e.tier]}15`, color: TIER_COLOR[e.tier] }}>
                      Tier {e.tier}
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
                  <span>Lead: <span className="font-semibold text-navy">{e.lead}</span></span>
                  <span>·</span>
                  <span>Raised by: <span className="font-semibold text-navy">{e.raisedBy}</span></span>
                  <span>·</span>
                  <span className="font-semibold" style={{ color: TIER_COLOR[e.tier] }}>{e.daysOverdue}d overdue</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, iconColor, label, value, sub, onClick, delay = 0 }) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all ${onClick ? 'cursor-pointer' : ''}`}
      style={{ transform: hov && onClick ? 'translateY(-2px)' : 'none', boxShadow: hov && onClick ? '0 8px 24px rgba(0,0,0,0.1)' : undefined }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${iconColor}15` }}>
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        {onClick && (
          <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-slate-300 transition-transform" style={{ transform: hov ? 'translateX(2px)' : 'none' }} />
        )}
      </div>
      <p className="mt-3 text-xl font-black text-navy">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
    </motion.div>
  )
}

export default function ManagementDashboard() {
  const showToast = useToast()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null) // 'files' | 'ar' | 'escalations'

  const totalBalance = mgmtARPending.reduce((s, c) => s + c.balance, 0)
  const openEscalations = mgmtAllEscalations.filter(e => e.status === 'Open').length
  const recent5 = mgmtAllEscalations.slice(0, 5)

  return (
    <ManagementLayout title="Dashboard" fullHeight>
      {/* ─── Client Search (injected into header zone) ─── */}
      <div className="pointer-events-none fixed right-[72px] top-0 z-[100] flex h-[52px] items-center pointer-events-auto">
        <ClientSearch />
      </div>

      <div className="flex h-full flex-col gap-4 overflow-hidden">

        {/* ── Row 1: Greeting + 4 stat cards ── */}
        <div className="flex shrink-0 items-end justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-navy">Good morning, {mgmtUser.name.split(' ')[0]}.</h1>
            <p className="text-xs text-slate-400">Firm-Wide View — ABCPA + MISCPA · 25 Sep 2026</p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Briefcase} iconColor="#0D1B2A"
            label="Total Files Engaged" value="148"
            sub="ABCPA: 89 · MISCPA: 59"
            onClick={() => setModal('files')}
            delay={0}
          />
          <StatCard
            icon={TrendingUp} iconColor="#059669"
            label="Total Client Turnover" value={mgmtTotalTurnover.value}
            sub={mgmtTotalTurnover.note}
            delay={0.06}
          />
          <StatCard
            icon={Banknote} iconColor="#DC2626"
            label="AR — Pending Payments" value={`SAR ${(totalBalance / 1000).toFixed(0)}K`}
            sub={`${mgmtARPending.filter(c => c.daysOverdue > 0).length} clients overdue`}
            onClick={() => setModal('ar')}
            delay={0.12}
          />
          <StatCard
            icon={AlertTriangle} iconColor="#D97706"
            label="Open Escalations" value={`${openEscalations} Open`}
            sub={`${mgmtAllEscalations.length} total on record`}
            onClick={() => setModal('escalations')}
            delay={0.18}
          />
        </div>

        {/* ── Row 2: main content (left + right) ── */}
        <div className="flex min-h-0 flex-1 gap-4">

          {/* ── LEFT: Escalation Centre ── */}
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

            <div className="flex-1 overflow-y-auto">
              {recent5.map((e, i) => {
                const es = ESC_STATUS[e.status]
                return (
                  <motion.div key={e.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, duration: 0.25 }}
                    className="flex items-start gap-3 border-b border-slate-50 px-5 py-3.5 last:border-0 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
                      style={{ background: TIER_COLOR[e.tier] }}>
                      T{e.tier}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-navy truncate">{e.client}</p>
                        <span className="text-[10px] text-slate-400">{e.dept}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed line-clamp-1">{e.reason}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Lead: {e.lead}</span>
                        <span>·</span>
                        <span className="font-semibold" style={{ color: TIER_COLOR[e.tier] }}>{e.daysOverdue}d overdue</span>
                        <span>·</span>
                        <span>{e.date}</span>
                      </div>
                    </div>
                    <span className="shrink-0 mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: es.bg, color: es.color }}>
                      {e.status}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            <div className="shrink-0 border-t border-slate-100 px-5 py-3 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">Showing latest 5 of {mgmtAllEscalations.length} escalations</p>
              <button onClick={() => setModal('escalations')}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* ── RIGHT: Revenue + FO summary + Lead Funnel ── */}
          <div className="flex w-[280px] shrink-0 flex-col gap-3 min-h-0 overflow-y-auto">

            {/* Revenue tiles */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shrink-0">
              <h2 className="mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Revenue & Billing</h2>
              <div className="space-y-2">
                {mgmtRevenueTiles.map(tile => {
                  const TONE = { navy: '#0D1B2A', emerald: '#059669', amber: '#D97706', 'alert-red': '#DC2626' }
                  return (
                    <div key={tile.label} className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate">{tile.label}</p>
                      <p className="text-xs font-bold ml-2 shrink-0" style={{ color: TONE[tile.tone] }}>{tile.display}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* FO quick summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">FO Managers</h2>
                <button onClick={() => setModal('files')} className="text-[10px] font-semibold text-brand hover:underline">Details</button>
              </div>
              <div className="space-y-2.5">
                {mgmtFOFiles.map(fo => (
                  <div key={fo.fo} className="flex items-center gap-2">
                    <div className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: fo.color }}>
                      {fo.name[0]}
                    </div>
                    <p className="text-xs text-navy flex-1 truncate">{fo.name}</p>
                    <span className="text-xs font-bold text-navy">{fo.total}</span>
                    <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(fo.total / 36) * 100}%`, background: fo.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead funnel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lead Funnel</h2>
                <span className="text-[10px] font-bold text-amber">{mgmtConversionRate}% Conv.</span>
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

      {/* ─── Modals ─── */}
      <AnimatePresence>
        {modal === 'files' && <FilesModal onClose={() => setModal(null)} />}
        {modal === 'ar' && <ARModal onClose={() => setModal(null)} />}
        {modal === 'escalations' && <EscalationsModal onClose={() => setModal(null)} />}
      </AnimatePresence>
    </ManagementLayout>
  )
}
