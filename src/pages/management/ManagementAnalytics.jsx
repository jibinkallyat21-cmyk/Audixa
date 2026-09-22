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
  mgmtParkingReasons,
  mgmtThroughput,
  mgmtAtRiskFiles,
} from '../../data/sampleData'

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
  const valueTone = stat.tone === 'alert-red' ? 'text-alert-red' : stat.tone === 'emerald' ? 'text-emerald' : 'text-navy'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <p className={`text-2xl font-bold ${valueTone}`}>{isNumeric ? count.toLocaleString() : stat.value}</p>
      <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
      {stat.sub && (
        <p className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${stat.subTone === 'emerald' ? 'text-emerald' : 'text-alert-red'}`}>
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
        <p className="text-sm text-slate-600">
          Board Pack will include all firm analytics for the selected period. Format: <span className="font-semibold text-navy">PDF</span>.
        </p>
      ),
      confirmLabel: 'Download',
      onConfirm: () => {
        closeModal()
        showToast(`Board pack downloaded — ${period.split(' (')[0]}`)
      },
    })
  }

  const handleEscalate = (client) => {
    openModal({
      title: 'Escalate to Management',
      body: (
        <p className="text-sm text-slate-600">
          Notify Management team of <span className="font-semibold text-navy">{client}</span> escalation?
        </p>
      ),
      confirmLabel: 'Confirm',
      onConfirm: () => {
        showToast(`Management notified — ${client}`)
        closeModal()
      },
    })
  }

  const totalStage = mgmtStageBreakdown.reduce((s, x) => s + x.value, 0)
  const totalHealth = mgmtHealthBreakdown.reduce((s, x) => s + x.value, 0)
  const totalParked = mgmtParkingReasons.reduce((s, x) => s + x.value, 0)
  const maxThroughput = Math.max(...mgmtThroughput.map((t) => t.value))

  return (
    <ManagementLayout title="Firm Analytics">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-navy">Firm Analytics — ABCPA + MISCPA Combined</h1>
              <span className="mt-1 inline-block rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-semibold text-navy">Firm-Wide View</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              >
                {mgmtReportingPeriods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button onClick={handleDownload} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]">
                <Download className="h-4 w-4" /> Download Board Pack
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {mgmtAnalyticsStats.map((s, idx) => (
              <StatTile key={s.label} stat={s} idx={idx} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-navy">Files by Auditor Department</h3>
              <div className="relative mx-auto h-52 w-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mgmtDeptSplit} dataKey="value" nameKey="label" innerRadius={64} outerRadius={90} startAngle={90} endAngle={450} animationDuration={900}>
                      {mgmtDeptSplit.map((seg) => (
                        <Cell key={seg.label} fill={seg.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-navy">148</p>
                  <p className="text-[10px] text-slate-400">Active</p>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-6">
                {mgmtDeptSplit.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-slate-500">
                      {seg.label} {seg.value} ({seg.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-navy">Files by Stage</h3>
              <div className="space-y-3">
                {mgmtStageBreakdown.map((s, idx) => (
                  <div key={s.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{s.label}</span>
                      <span className="font-semibold text-navy">{s.value}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-navy">Files by Audit Type</h3>
              <div className="mx-auto h-52 w-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mgmtAuditTypeBreakdown} dataKey="value" nameKey="label" innerRadius={0} outerRadius={90} startAngle={90} endAngle={450} animationDuration={900}>
                      {mgmtAuditTypeBreakdown.map((seg) => (
                        <Cell key={seg.label} fill={seg.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {mgmtAuditTypeBreakdown.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-slate-500">
                      {seg.label} — {seg.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy">On Track vs At Risk vs Critical</h3>
                <span className="text-xs font-semibold text-slate-400">Total {totalHealth}</span>
              </div>
              <div className="flex h-8 w-full overflow-hidden rounded-lg bg-slate-100">
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
                    <span className="text-slate-500">
                      {seg.label} {seg.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy">Parking Reason Analysis</h3>
              <span className="text-xs font-semibold text-slate-400">Total {totalParked} parked</span>
            </div>
            <div className="space-y-3">
              {mgmtParkingReasons.map((r, idx) => (
                <div key={r.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{r.label}</span>
                    <span className="font-semibold text-navy">{r.value} files</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.value / totalParked) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.06 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-navy">Throughput — Files Completed</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mgmtThroughput}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#059669" radius={[6, 6, 0, 0]} animationDuration={800} label={{ position: 'top', fontSize: 12, fill: '#0D1B2A', fontWeight: 700 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-navy">At-Risk Files — Requiring Partner Review</h3>
            <div className="space-y-3">
              {mgmtAtRiskFiles.map((f, idx) => (
                <motion.div
                  key={f.client}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.25 }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-navy">{f.client}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          f.dept === 'ABCPA' ? 'border-navy/30 bg-navy/10 text-navy' : 'border-amber/30 bg-amber/10 text-amber'
                        }`}
                      >
                        {f.dept}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${f.status.startsWith('OVERDUE') ? 'bg-alert-red/10 text-alert-red' : 'bg-amber/10 text-amber'}`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{f.blocker}</p>
                  </div>
                  {f.action === 'escalate' ? (
                    <button onClick={() => handleEscalate(f.client)} className="shrink-0 rounded-md bg-alert-red px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                      Escalate
                    </button>
                  ) : (
                    <button className="shrink-0 rounded-md border border-navy px-3.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5">Review</button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    </ManagementLayout>
  )
}
