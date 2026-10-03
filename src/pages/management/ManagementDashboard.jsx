import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, TrendingUp, Briefcase, Banknote, Wallet,
  ChevronRight, ExternalLink, AlertCircle, ShieldAlert, Calendar,
} from 'lucide-react'
import ManagementLayout from '../../components/management/ManagementLayout'
import { useMgmtScope } from '../../hooks/useMgmtScope'
import MeetingRequestModal from '../../components/client/MeetingRequestModal'
import { useTheme } from '../../context/ThemeContext'
import {
  mgmtUser,
  mgmtFOFiles,
  mgmtARPending,
  mgmtAllEscalations,
  mgmtRevenueTiles,
  mgmtTotalTurnover,
  mgmtClientDirectory,
  mgmtAbcpaPortfolio,
  mgmtMiscpaPortfolio,
  mgmtLeadConversion,
  mgmtConversionRate,
  mgmtRealization,
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

/* ─── AR Pending modal ─── */
function ARModal({ onClose }) {
  const totalBalance = mgmtARPending.reduce((s, c) => s + c.balance, 0)
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
            <h3 className="text-base font-bold text-navy">Accounts Receivable — Pending Payments</h3>
            <p className="text-xs text-slate-400 mt-0.5">SAR {totalBalance.toLocaleString()} outstanding</p>
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
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Full Escalations modal ─── */
function EscalationsModal({ onClose }) {
  const [filter, setFilter] = useState('All')
  const [scope] = useMgmtScope()
  const scoped = mgmtAllEscalations.filter(e => scope === 'Combined' || e.dept === scope)
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
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}
      onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-left w-full transition-all"
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
    </motion.button>
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
              onClick={onOpen}
              className="flex w-full items-start gap-3 border-b border-slate-100 px-5 py-3.5 text-left transition-colors hover:bg-slate-500/10"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white" style={{ background: TIER_COLOR[e.tier] }}>
                T{e.tier}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-navy">{e.client}</p>
                  <span className="text-[10px] text-slate-400">{e.dept}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{e.reason}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="font-semibold" style={{ color: TIER_COLOR[e.tier] }}>{e.daysOverdue}d overdue</span>
                  <span>·</span>
                  <span>{e.date}</span>
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

  const totalBalance = mgmtARPending.reduce((s, c) => s + c.balance, 0)
  const escalations = useMemo(() => mgmtAllEscalations.filter(e => scope === 'Combined' || e.dept === scope), [scope])
  const openEscalations = escalations.filter(e => e.status === 'Open').length
  const [meetingOpen, setMeetingOpen] = useState(false)
  const breachCount = mgmtDeadlineBreaches.filter(b => b.daysLeft < 0).length

  return (
    <ManagementLayout title="Dashboard" fullHeight headerSearch={<ClientSearch />}>
      <div className="flex h-full flex-col gap-4 overflow-hidden">

        {/* ── Greeting ── */}
        <div className="shrink-0 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-navy">Good morning, {mgmtUser.name.split(' ')[0]}.</h1>
            <p className="text-xs text-slate-400">{portfolio ? `${scope} Department View` : 'Combined View — ABCPA + MISCPA'} · 25 Sep 2026</p>
          </div>
          {breachCount > 0 && (
            <button
              onClick={() => navigate('/management/risk')}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-alert-red"
              style={{ background: 'rgba(220,38,38,0.1)' }}
            >
              <ShieldAlert className="h-3.5 w-3.5" /> {breachCount} deadline breach{breachCount !== 1 ? 'es' : ''}
            </button>
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

        {/* ── 5 Stat Cards ── */}
        <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Briefcase} iconColor="#0D1B2A"
            label="Total Files Engaged" value={portfolio ? String(portfolio.total) : '148'}
            sub={portfolio ? `${scope} Department` : 'ABCPA: 89 · MISCPA: 59'}
            onClick={() => setModal('files')} delay={0} />
          <StatCard icon={TrendingUp} iconColor="#059669"
            label="Total Client Turnover" value={mgmtTotalTurnover.value}
            sub={portfolio ? 'Firm-wide · FY2025' : mgmtTotalTurnover.note} delay={0.06} />
          <StatCard icon={Banknote} iconColor="#DC2626"
            label="AR — Pending Payments" value={`SAR ${(totalBalance / 1000).toFixed(0)}K`}
            sub={`${mgmtARPending.filter(c => c.daysOverdue > 0).length} clients overdue`}
            onClick={() => setModal('ar')} delay={0.12} />
          <StatCard icon={AlertCircle} iconColor="#D97706"
            label="Open Escalations" value={`${openEscalations} Open`}
            sub={`${escalations.length} total on record`}
            onClick={() => setModal('escalations')} delay={0.18} />
          <StatCard icon={Wallet} iconColor="#2563EB"
            label="Fee Realization Rate" value={`${mgmtRealization.rate}%`}
            sub={`Target ${mgmtRealization.target}% · View P&L`}
            onClick={() => navigate('/management/financials')} delay={0.24} />
        </div>

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

            <EscalationTicker items={escalations} onOpen={() => setModal('escalations')} />

            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-[11px] text-slate-400">{escalations.length} escalation{escalations.length !== 1 ? 's' : ''} on record</p>
              <button onClick={() => setModal('escalations')}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* RIGHT — Meeting + Revenue + Lead funnel */}
          <div className="flex w-[272px] shrink-0 flex-col gap-3 min-h-0 overflow-y-auto">

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMeetingOpen(true)}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <Calendar className="h-4 w-4 text-indigo-400" />
              Request a Meeting
            </motion.button>

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

      <MeetingRequestModal open={meetingOpen} onClose={() => setMeetingOpen(false)} />

      <AnimatePresence>
        {modal === 'files' && <FilesModal onClose={() => setModal(null)} />}
        {modal === 'ar' && <ARModal onClose={() => setModal(null)} />}
        {modal === 'escalations' && <EscalationsModal onClose={() => setModal(null)} />}
      </AnimatePresence>
    </ManagementLayout>
  )
}
