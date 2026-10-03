import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ManagementLayout from '../../components/management/ManagementLayout'
import PageTransition from '../../components/shared/PageTransition'
import { mgmtLeadLeaderboard, mgmtFirmPerformanceTrend, mgmtFOFiles } from '../../data/sampleData'

const DEPT_TONE = {
  ABCPA: 'border-navy/30 bg-navy/10 text-navy',
  MISCPA: 'border-amber/30 bg-amber/10 text-amber',
}

function initials(name) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}

export default function ManagementPerformance() {
  const [sortBy, setSortBy] = useState('filesClosed')

  const sortedLeads = useMemo(
    () => [...mgmtLeadLeaderboard].sort((a, b) => (sortBy === 'avgTurnaround' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy])),
    [sortBy]
  )

  const avgOnTime = Math.round(mgmtLeadLeaderboard.reduce((s, l) => s + l.onTimeRate, 0) / mgmtLeadLeaderboard.length)
  const avgTurnaround = (mgmtLeadLeaderboard.reduce((s, l) => s + l.avgTurnaround, 0) / mgmtLeadLeaderboard.length).toFixed(1)
  const avgSatisfaction = (mgmtLeadLeaderboard.reduce((s, l) => s + l.satisfaction, 0) / mgmtLeadLeaderboard.length).toFixed(1)

  return (
    <ManagementLayout title="Performance">
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-navy">Partner & Team Performance</h1>
            <p className="mt-1 text-sm text-slate-500">Firm-wide execution metrics — ABCPA + MISCPA Combined</p>
          </div>

          {/* Firm-wide summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Avg. Turnaround</p>
              <p className="mt-1 text-2xl font-black text-navy">{avgTurnaround}d</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald"><TrendingDown className="h-3 w-3" /> -0.8d vs last period</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">On-Time Delivery Rate</p>
              <p className="mt-1 text-2xl font-black text-navy">{avgOnTime}%</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald"><TrendingUp className="h-3 w-3" /> +4% vs last period</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Avg. Client Satisfaction</p>
              <p className="mt-1 text-2xl font-black text-navy">{avgSatisfaction} / 5</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald"><TrendingUp className="h-3 w-3" /> +0.2 vs last period</p>
            </div>
          </div>

          {/* Trend chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-navy">Turnaround & On-Time Rate Trend</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mgmtFirmPerformanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line yAxisId="left" type="monotone" dataKey="turnaround" name="Avg Turnaround (d)" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="onTime" name="On-Time Rate (%)" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audit lead leaderboard */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber" />
                <h3 className="text-sm font-bold text-navy">Audit Lead Leaderboard</h3>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-navy outline-none"
              >
                <option value="filesClosed">Sort: Files Closed</option>
                <option value="onTimeRate">Sort: On-Time Rate</option>
                <option value="avgTurnaround">Sort: Fastest Turnaround</option>
                <option value="satisfaction">Sort: Client Satisfaction</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 font-semibold">Lead</th>
                    <th className="px-4 py-3 font-semibold">Dept</th>
                    <th className="px-4 py-3 font-semibold">Files Closed</th>
                    <th className="px-4 py-3 font-semibold">Avg Turnaround</th>
                    <th className="px-4 py-3 font-semibold">On-Time Rate</th>
                    <th className="px-4 py-3 font-semibold">Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeads.map((l, idx) => (
                    <motion.tr
                      key={l.lead}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.2 }}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/10 text-[11px] font-bold text-navy">
                            {initials(l.lead)}
                          </div>
                          <span className="font-medium text-navy">{l.lead}</span>
                          {idx === 0 && sortBy === 'filesClosed' && <Trophy className="h-3.5 w-3.5 text-amber" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${DEPT_TONE[l.dept]}`}>{l.dept}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy">{l.filesClosed}</td>
                      <td className="px-4 py-3 text-slate-600">{l.avgTurnaround}d</td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                          style={{ background: l.onTimeRate >= 85 ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.12)', color: l.onTimeRate >= 85 ? '#059669' : '#D97706' }}
                        >
                          {l.onTimeRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy">{l.satisfaction.toFixed(1)} / 5</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FO manager performance */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-navy">Front Office Manager — Conversion Performance</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {mgmtFOFiles.map((fo) => {
                const conv = Math.round((fo.won / fo.total) * 100)
                return (
                  <div key={fo.fo} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: fo.color }}>
                      {fo.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy">{fo.name}</p>
                      <p className="text-[11px] text-slate-400">{fo.role}</p>
                    </div>
                    <div className="hidden w-24 sm:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full" style={{ width: `${conv}%`, background: fo.color }} />
                      </div>
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs font-bold text-navy">{conv}%</span>
                    <span className="w-20 shrink-0 text-right text-[11px] text-slate-400">{fo.won}/{fo.total} won</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </PageTransition>
    </ManagementLayout>
  )
}
