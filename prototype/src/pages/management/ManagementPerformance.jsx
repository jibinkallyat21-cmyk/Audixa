import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ManagementLayout from '../../components/management/ManagementLayout'
import PageTransition from '../../components/shared/PageTransition'
import { mgmtFirmExecutionSummary, mgmtClientSatisfaction, mgmtFirmPerformanceTrend, mgmtFOFiles } from '../../data/sampleData'

export default function ManagementPerformance() {
  return (
    <ManagementLayout title="Performance">
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-navy">Firm & Front Office Performance</h1>
            <p className="mt-1 text-sm text-slate-500">
              Firm-wide execution metrics and business-development performance — ABCPA + MISCPA Combined
            </p>
          </div>

          {/* Firm-wide summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Avg. Turnaround</p>
              <p className="mt-1 text-2xl font-black text-navy">{mgmtFirmExecutionSummary.avgTurnaround}d</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald"><TrendingDown className="h-3 w-3" /> -0.8d vs last period</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">On-Time Delivery Rate</p>
              <p className="mt-1 text-2xl font-black text-navy">{mgmtFirmExecutionSummary.onTimeRate}%</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald"><TrendingUp className="h-3 w-3" /> +4% vs last period</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Client Satisfaction</p>
              <p className="mt-1 text-2xl font-black text-navy">{mgmtClientSatisfaction.score} / 5</p>
              <p className="mt-1 text-[11px] text-slate-400">{mgmtClientSatisfaction.note} · {mgmtClientSatisfaction.responses} responses</p>
            </div>
          </div>

          {/* Trend chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-navy">Firm-Wide Turnaround & On-Time Rate Trend</h3>
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

          {/* FO manager performance */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-navy">Front Office Manager — Conversion Performance</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">Lead-to-win conversion by business-development owner.</p>
            </div>
            <div className="divide-y divide-slate-50">
              {mgmtFOFiles.map((fo, idx) => {
                const conv = Math.round((fo.won / fo.total) * 100)
                return (
                  <motion.div
                    key={fo.fo}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                    className="flex items-center gap-3 px-5 py-3"
                  >
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
                  </motion.div>
                )
              })}
            </div>
          </div>

        </div>
      </PageTransition>
    </ManagementLayout>
  )
}
