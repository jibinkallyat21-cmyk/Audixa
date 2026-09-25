import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import ManagementLayout from '../../components/management/ManagementLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { useModal } from '../../components/shared/Modal'
import {
  mgmtReportingPeriods,
  mgmtAnalyticsStats,
  mgmtDeptSplit,
  mgmtStageBreakdown,
  mgmtAuditTypeBreakdown,
  mgmtHealthBreakdown,
  mgmtThroughput,
} from '../../data/sampleData'

/* ── dark palette ── */
const D = {
  card: '#0F1629',
  cardBorder: 'rgba(255,255,255,0.07)',
  heading: '#F1F5F9',
  muted: '#94A3B8',
  subtle: '#475569',
}

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

function StatTile({ stat, idx }) {
  const isNumeric = typeof stat.value === 'number'
  const count = useCountUp(isNumeric ? stat.value : 0)
  const TrendIcon = stat.sub?.startsWith('-') ? TrendingDown : TrendingUp

  const accentColor =
    stat.tone === 'alert-red' ? '#E8323C'
    : stat.tone === 'emerald' ? '#059669'
    : '#F1F5F9'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="rounded-xl p-5"
      style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}
    >
      <p className="text-2xl font-bold" style={{ color: accentColor }}>
        {isNumeric ? count.toLocaleString() : stat.value}
      </p>
      <p className="mt-1 text-xs" style={{ color: D.muted }}>{stat.label}</p>
      {stat.sub && (
        <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold" style={{ color: stat.subTone === 'emerald' ? '#059669' : '#E8323C' }}>
          <TrendIcon className="h-3 w-3" /> {stat.sub}
        </p>
      )}
    </motion.div>
  )
}

export default function ManagementAnalytics() {
  const showToast = useToast()
  const { openModal, closeModal } = useModal()
  const [period, setPeriod] = useState(mgmtReportingPeriods[0])

  const handleDownload = () => {
    openModal({
      title: 'Download Board Pack',
      body: (
        <p className="text-sm" style={{ color: D.muted }}>
          Board Pack will include all firm analytics for the selected period. Format: <span className="font-semibold" style={{ color: D.heading }}>PDF</span>.
        </p>
      ),
      confirmLabel: 'Download',
      onConfirm: () => {
        closeModal()
        showToast(`Board pack downloaded — ${period.split(' (')[0]}`)
      },
    })
  }

  const totalStage = mgmtStageBreakdown.reduce((s, x) => s + x.value, 0)
  const totalHealth = mgmtHealthBreakdown.reduce((s, x) => s + x.value, 0)

  return (
    <ManagementLayout title="Firm Analytics">
      <PageTransition>
        <div className="space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold" style={{ color: D.heading }}>Firm Analytics — ABCPA + MISCPA Combined</h1>
              <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.08)', color: D.muted }}>
                Firm-Wide View
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: D.card, border: `1px solid ${D.cardBorder}`, color: D.heading }}
              >
                {mgmtReportingPeriods.map((p) => (
                  <option key={p} value={p} style={{ background: '#0F1629' }}>{p}</option>
                ))}
              </select>
              <button onClick={handleDownload} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]">
                <Download className="h-4 w-4" /> Download Board Pack
              </button>
            </div>
          </div>

          {/* ── Engagement Summary — Stat Tiles ── */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Engagement Summary</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {mgmtAnalyticsStats.map((s, idx) => (
                <StatTile key={s.label} stat={s} idx={idx} />
              ))}
            </div>
          </div>

          {/* ── Files by Department + Stage ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Dept split */}
            <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
              <h3 className="mb-4 text-sm font-bold" style={{ color: D.heading }}>Files by Auditor Department</h3>
              <div className="relative mx-auto h-52 w-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mgmtDeptSplit} dataKey="value" nameKey="label" innerRadius={64} outerRadius={90} startAngle={90} endAngle={450} animationDuration={900}>
                      {mgmtDeptSplit.map((seg) => (
                        <Cell key={seg.label} fill={seg.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold" style={{ color: D.heading }}>148</p>
                  <p className="text-[10px]" style={{ color: D.muted }}>Active</p>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-6">
                {mgmtDeptSplit.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span style={{ color: D.muted }}>{seg.label} {seg.value} ({seg.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Files by stage */}
            <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
              <h3 className="mb-4 text-sm font-bold" style={{ color: D.heading }}>Files by Stage</h3>
              <div className="space-y-3">
                {mgmtStageBreakdown.map((s, idx) => (
                  <div key={s.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span style={{ color: D.muted }}>{s.label}</span>
                      <span className="font-semibold" style={{ color: D.heading }}>{s.value}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.value / totalStage) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Execution Summary ── */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Execution Level Summary</p>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Audit type */}
              <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
                <h3 className="mb-4 text-sm font-bold" style={{ color: D.heading }}>Files by Audit Type</h3>
                <div className="mx-auto h-52 w-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={mgmtAuditTypeBreakdown} dataKey="value" nameKey="label" innerRadius={0} outerRadius={90} startAngle={90} endAngle={450} animationDuration={900}>
                        {mgmtAuditTypeBreakdown.map((seg) => (
                          <Cell key={seg.label} fill={seg.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {mgmtAuditTypeBreakdown.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span style={{ color: D.muted }}>{seg.label} — {seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health breakdown */}
              <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: D.heading }}>On Track vs At Risk vs Critical</h3>
                  <span className="text-xs font-semibold" style={{ color: D.subtle }}>Total {totalHealth}</span>
                </div>
                <div className="flex h-8 w-full overflow-hidden rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {mgmtHealthBreakdown.map((seg, idx) => (
                    <motion.div
                      key={seg.label}
                      initial={{ width: 0 }}
                      animate={{ width: `${(seg.value / totalHealth) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.06 }}
                      className="flex h-full items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: seg.color }}
                    >
                      {Math.round((seg.value / totalHealth) * 100)}%
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {mgmtHealthBreakdown.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span style={{ color: D.muted }}>{seg.label} {seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Throughput */}
          <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
            <h3 className="mb-4 text-sm font-bold" style={{ color: D.heading }}>Throughput — Files Completed</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mgmtThroughput}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', fontSize: 12 }} />
                  <Bar dataKey="value" fill="#059669" radius={[6, 6, 0, 0]} animationDuration={800} label={{ position: 'top', fontSize: 12, fill: '#94A3B8', fontWeight: 700 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </PageTransition>
    </ManagementLayout>
  )
}
