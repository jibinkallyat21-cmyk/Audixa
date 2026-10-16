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

const TONE_CLASS = { navy: 'text-navy', emerald: 'text-emerald', amber: 'text-amber', 'alert-red': 'text-alert-red' }

function SummaryTile({ tile, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, duration: 0.3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <p className={`text-2xl font-black ${TONE_CLASS[tile.tone]}`}>{tile.value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{tile.label}</p>
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
              <h1 className="text-xl font-bold text-navy">Financials & Revenue — ABCPA + MISCPA</h1>
              <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                Firm-Wide View
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              >
                {mgmtReportingPeriods.map((p) => (
                  <option key={p} value={p}>{p}</option>
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
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Revenue Summary</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {mgmtPnlSummary.map((tile, idx) => (
                <SummaryTile key={tile.label} tile={tile} idx={idx} />
              ))}
            </div>
          </div>

          {/* Realization + WIP aging */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy">Fee Realization Rate</h3>
                <TrendingUp className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-3xl font-black text-navy">{mgmtRealization.rate}%</p>
              <p className="mt-1 text-xs text-slate-400">{mgmtRealization.note}</p>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mgmtRealization.rate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: mgmtRealization.rate >= mgmtRealization.target ? '#059669' : '#D97706' }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Target: {mgmtRealization.target}%</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy">WIP Aging</h3>
                <span className="text-xs font-semibold text-slate-400">SAR {totalWip.toLocaleString()}</span>
              </div>
              <div className="space-y-3">
                {mgmtWipAging.map((b, idx) => (
                  <div key={b.bucket}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{b.bucket}</span>
                      <span className="font-semibold text-navy">SAR {b.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-navy">Revenue by Department</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {mgmtRevenueByDept.map((d) => (
                <div key={d.dept} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-navy">{d.dept}</p>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                      {Math.round((d.revenue / totalDeptRevenue) * 100)}% of revenue
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">Revenue</p>
                      <p className="mt-0.5 font-bold text-navy">SAR {d.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Files</p>
                      <p className="mt-0.5 font-bold text-navy">{d.files}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Front Office manager */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-bold text-navy">Revenue by Front Office Manager</h3>
            <p className="mb-4 text-[11px] text-slate-400">
              Billed fees attributed to each FO manager's client portfolio — the business-development engine behind firm revenue.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-2 pr-4 font-semibold uppercase tracking-wide">FO Manager</th>
                    <th className="pb-2 pr-4 font-semibold uppercase tracking-wide">Files</th>
                    <th className="pb-2 pr-4 font-semibold uppercase tracking-wide">Won</th>
                    <th className="pb-2 pr-4 font-semibold uppercase tracking-wide">Revenue</th>
                    <th className="pb-2 font-semibold uppercase tracking-wide">Avg / File</th>
                  </tr>
                </thead>
                <tbody>
                  {mgmtFOFiles.map((f) => (
                    <tr key={f.fo} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pr-4">
                        <span className="flex items-center gap-2 font-semibold text-navy">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: f.color }}>{f.name[0]}</span>
                          {f.name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500">{f.total}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{f.won}</td>
                      <td className="py-2.5 pr-4 text-navy">SAR {f.revenue.toLocaleString()}</td>
                      <td className="py-2.5 text-slate-500">SAR {Math.round(f.revenue / f.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly revenue trend */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-slate-300" />
              <h3 className="text-sm font-bold text-navy">Monthly Revenue Trend</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mgmtMonthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
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
