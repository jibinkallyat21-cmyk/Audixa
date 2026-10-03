import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, TrendingUp, Wallet } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ManagementLayout from '../../components/management/ManagementLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import {
  mgmtPnlSummary,
  mgmtRealization,
  mgmtRevenueByDept,
  mgmtFOFiles,
  mgmtWipAging,
  mgmtMonthlyRevenue,
  mgmtReportingPeriods,
} from '../../data/sampleData'

const D = {
  card: '#0F1629',
  cardBorder: 'rgba(255,255,255,0.07)',
  heading: '#F1F5F9',
  muted: '#94A3B8',
  subtle: '#475569',
}

const TONE = { navy: '#F1F5F9', emerald: '#059669', amber: '#D97706', 'alert-red': '#E8323C' }

function SummaryTile({ tile, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, duration: 0.3 }}
      className="rounded-xl p-5"
      style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}
    >
      <p className="text-2xl font-bold" style={{ color: TONE[tile.tone] }}>{tile.value}</p>
      <p className="mt-1 text-xs" style={{ color: D.muted }}>{tile.label}</p>
    </motion.div>
  )
}

export default function ManagementFinancials() {
  const showToast = useToast()
  const [period, setPeriod] = useState(mgmtReportingPeriods[0])
  const totalWip = mgmtWipAging.reduce((s, b) => s + b.value, 0)
  const totalDeptRevenue = mgmtRevenueByDept.reduce((s, d) => s + d.revenue, 0)

  return (
    <ManagementLayout title="Financials">
      <PageTransition>
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold" style={{ color: D.heading }}>Financials & Revenue — ABCPA + MISCPA</h1>
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
              <button
                onClick={() => showToast(`Financial statement exported — ${period.split(' (')[0]}`)}
                className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#D12C35]"
              >
                <Download className="h-4 w-4" /> Export Statement
              </button>
            </div>
          </div>

          {/* P&L summary tiles */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: D.subtle }}>Revenue Summary</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {mgmtPnlSummary.map((tile, idx) => (
                <SummaryTile key={tile.label} tile={tile} idx={idx} />
              ))}
            </div>
          </div>

          {/* Realization + WIP aging */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold" style={{ color: D.heading }}>Fee Realization Rate</h3>
                <TrendingUp className="h-4 w-4" style={{ color: D.muted }} />
              </div>
              <p className="text-3xl font-black" style={{ color: D.heading }}>{mgmtRealization.rate}%</p>
              <p className="mt-1 text-xs" style={{ color: D.muted }}>{mgmtRealization.note}</p>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mgmtRealization.rate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: mgmtRealization.rate >= mgmtRealization.target ? '#059669' : '#D97706' }}
                />
              </div>
              <p className="mt-2 text-[11px]" style={{ color: D.subtle }}>Target: {mgmtRealization.target}%</p>
            </div>

            <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold" style={{ color: D.heading }}>WIP Aging</h3>
                <span className="text-xs font-semibold" style={{ color: D.subtle }}>SAR {totalWip.toLocaleString()}</span>
              </div>
              <div className="space-y-3">
                {mgmtWipAging.map((b, idx) => (
                  <div key={b.bucket}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span style={{ color: D.muted }}>{b.bucket}</span>
                      <span className="font-semibold" style={{ color: D.heading }}>SAR {b.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(b.value / totalWip) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.06 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: b.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue by department */}
          <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
            <h3 className="mb-4 text-sm font-bold" style={{ color: D.heading }}>Revenue by Department</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {mgmtRevenueByDept.map((d) => (
                <div key={d.dept} className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold" style={{ color: D.heading }}>{d.dept}</p>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: 'rgba(37,99,235,0.15)', color: '#2563EB' }}>
                      {Math.round((d.revenue / totalDeptRevenue) * 100)}% of revenue
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p style={{ color: D.muted }}>Revenue</p>
                      <p className="mt-0.5 font-bold" style={{ color: D.heading }}>SAR {d.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{ color: D.muted }}>Files</p>
                      <p className="mt-0.5 font-bold" style={{ color: D.heading }}>{d.files}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Front Office manager */}
          <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
            <h3 className="mb-4 text-sm font-bold" style={{ color: D.heading }}>Revenue by Front Office Manager</h3>
            <p className="mb-4 -mt-2 text-[11px]" style={{ color: D.subtle }}>
              Billed fees attributed to each FO manager's client portfolio — the business-development engine behind firm revenue.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ color: D.subtle }}>
                    <th className="pb-2 pr-4 font-semibold uppercase tracking-wide">FO Manager</th>
                    <th className="pb-2 pr-4 font-semibold uppercase tracking-wide">Files</th>
                    <th className="pb-2 pr-4 font-semibold uppercase tracking-wide">Won</th>
                    <th className="pb-2 pr-4 font-semibold uppercase tracking-wide">Revenue</th>
                    <th className="pb-2 font-semibold uppercase tracking-wide">Avg / File</th>
                  </tr>
                </thead>
                <tbody>
                  {mgmtFOFiles.map((f) => (
                    <tr key={f.fo} style={{ borderTop: `1px solid ${D.cardBorder}` }}>
                      <td className="py-2.5 pr-4">
                        <span className="flex items-center gap-2 font-semibold" style={{ color: D.heading }}>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: f.color }}>{f.name[0]}</span>
                          {f.name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: D.muted }}>{f.total}</td>
                      <td className="py-2.5 pr-4" style={{ color: D.muted }}>{f.won}</td>
                      <td className="py-2.5 pr-4" style={{ color: D.heading }}>SAR {f.revenue.toLocaleString()}</td>
                      <td className="py-2.5" style={{ color: D.muted }}>SAR {Math.round(f.revenue / f.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly revenue trend */}
          <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4" style={{ color: D.muted }} />
              <h3 className="text-sm font-bold" style={{ color: D.heading }}>Monthly Revenue Trend</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mgmtMonthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                  <Tooltip
                    contentStyle={{ background: '#0F1629', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', fontSize: 12 }}
                    formatter={(v) => [`SAR ${v.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </PageTransition>
    </ManagementLayout>
  )
}
