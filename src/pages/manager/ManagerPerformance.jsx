import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Download, ChevronDown, Info } from 'lucide-react'
import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import { useToast } from '../../components/shared/Toast'
import {
  performanceSummary,
  leadPerformance,
  associatePerformance,
  performanceReviewPoints,
  performanceTrend,
} from '../../data/sampleData'

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame
    const start = performance.now()
    const step = (t) => {
      const progress = Math.min((t - start) / duration, 1)
      setValue(target * progress)
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

const SUMMARY_CHIPS = [
  { key: 'totalActiveFiles', label: 'Total Active Files', tone: 'bg-navy/10 text-navy', decimals: 0 },
  { key: 'avgTurnaround', label: 'Avg Turnaround', suffix: ' Days', tone: 'bg-amber/10 text-amber', decimals: 1 },
  { key: 'avgAccuracy', label: 'Avg Accuracy Rate', suffix: '%', tone: 'bg-emerald/10 text-emerald', decimals: 0 },
  { key: 'reviewPointsRaised', label: 'Total Review Points Raised', tone: 'bg-alert-red/10 text-alert-red', decimals: 0 },
]

const STATUS_CHIP = { 'On Track': 'bg-emerald/10 text-emerald border-emerald/30', Excellent: 'bg-emerald/10 text-emerald border-emerald/30' }

function LeadRow({ lead, expanded, onToggle }) {
  const associates = associatePerformance.filter((a) => a.lead === lead.name)
  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onToggle}
        className="cursor-pointer border-b border-slate-50 hover:bg-slate-50"
      >
        <td className="px-4 py-3 font-semibold text-navy">
          <span className="mr-1 inline-block">
            <motion.span animate={{ rotate: expanded ? 90 : 0 }} className="inline-block">
              <ChevronDown className="h-3.5 w-3.5 rotate-[-90deg]" />
            </motion.span>
          </span>
          {lead.name}
        </td>
        <td className="px-4 py-3">{lead.activeFiles}</td>
        <td className="px-4 py-3">{lead.avgTurnaround} days</td>
        <td className="px-4 py-3">
          <span className={lead.reviewPoints > 0 ? 'font-semibold text-amber' : 'text-slate-500'}>{lead.reviewPoints}</span>
        </td>
        <td className="px-4 py-3">{lead.queriesPerFile}</td>
        <td className="px-4 py-3">{lead.docAcceptance}%</td>
        <td className="px-4 py-3">{lead.completed}</td>
        <td className="px-4 py-3">
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CHIP[lead.status]}`}>{lead.status}</span>
        </td>
      </motion.tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-slate-50 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Associates under {lead.name}</p>
            <table className="w-full text-xs">
              <tbody>
                {associates.map((a) => (
                  <tr key={a.name} className="border-b border-slate-100 last:border-0">
                    <td className="py-1.5 font-medium text-navy">{a.name}</td>
                    <td className="py-1.5 text-slate-500">{a.filesAssigned} files</td>
                    <td className="py-1.5 text-slate-500">{a.procedureCompletion}% procedures</td>
                    <td className="py-1.5 text-slate-500">{a.docAcceptance}% acceptance</td>
                  </tr>
                ))}
                {associates.length === 0 && <tr><td className="py-1.5 text-slate-400">No associates found.</td></tr>}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}

export default function ManagerPerformance() {
  const showToast = useToast()
  const [expandedLead, setExpandedLead] = useState(null)
  const totalFiles = useCountUp(performanceSummary.totalActiveFiles)
  const avgTurnaround = useCountUp(performanceSummary.avgTurnaround)
  const avgAccuracy = useCountUp(performanceSummary.avgAccuracy)
  const reviewPoints = useCountUp(performanceSummary.reviewPointsRaised)
  const counted = { totalActiveFiles: totalFiles, avgTurnaround, avgAccuracy, reviewPointsRaised: reviewPoints }

  return (
    <ManagerLayout title="Performance Analysis">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">Performance Analysis — ABCPA Department</h1>
            <button
              onClick={() => showToast('Performance report exported')}
              className="rounded-lg bg-brand-red px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
            >
              Export Performance Report
            </button>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/10 px-5 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <p className="text-sm text-amber">
              Showing performance data for ABCPA Department only. Data is captured from procedure
              assignments onward and updates as files are completed.
            </p>
          </div>

          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy outline-none focus:border-navy">
            <option>Current Period — FY2026</option>
          </select>

          <div className="flex flex-wrap gap-2">
            {SUMMARY_CHIPS.map((c) => (
              <span key={c.key} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${c.tone}`}>
                {c.label}: {counted[c.key].toFixed(c.decimals)}
                {c.suffix || ''}
              </span>
            ))}
          </div>

          {/* Lead performance table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Audit Lead Performance — ABCPA Department</h2>
              <button onClick={() => showToast('Lead report exported')} className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">
                Export Lead Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2 font-medium">Lead</th>
                    <th className="px-4 py-2 font-medium">Active Files</th>
                    <th className="px-4 py-2 font-medium">Avg Turnaround</th>
                    <th className="px-4 py-2 font-medium">Review Points</th>
                    <th className="px-4 py-2 font-medium">Queries/File</th>
                    <th className="px-4 py-2 font-medium">Doc Acceptance</th>
                    <th className="px-4 py-2 font-medium">Completed</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leadPerformance.map((lead) => (
                    <LeadRow
                      key={lead.name}
                      lead={lead}
                      expanded={expandedLead === lead.name}
                      onToggle={() => setExpandedLead((prev) => (prev === lead.name ? null : lead.name))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Associate performance table */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Associate Performance — ABCPA Department</h2>
              <button onClick={() => showToast('Associate report exported')} className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">
                Export Associate Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2 font-medium">Associate</th>
                    <th className="px-4 py-2 font-medium">Lead</th>
                    <th className="px-4 py-2 font-medium">Files Assigned</th>
                    <th className="px-4 py-2 font-medium">Procedure Completion</th>
                    <th className="px-4 py-2 font-medium">Doc Acceptance</th>
                    <th className="px-4 py-2 font-medium">Review Points</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {associatePerformance.map((a, idx) => (
                    <motion.tr
                      key={a.name}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.25 }}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-4 py-3 font-semibold text-navy">{a.name}</td>
                      <td className="px-4 py-3 text-slate-500">{a.lead}</td>
                      <td className="px-4 py-3">{a.filesAssigned}</td>
                      <td className="px-4 py-3">{a.procedureCompletion}%</td>
                      <td className="px-4 py-3">{a.docAcceptance}%</td>
                      <td className="px-4 py-3">{a.reviewPoints}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CHIP[a.status]}`}>{a.status}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Review points log */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-navy">Review Points Raised — This Period</h2>
            <div className="space-y-2">
              {performanceReviewPoints.map((rp) => (
                <div key={rp.ref} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 py-2.5 text-sm last:border-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{rp.ref}</span>
                    <span className="font-medium text-navy">{rp.file}</span>
                    <span className="text-xs text-slate-400">
                      {rp.raisedBy} → {rp.raisedAgainst} · {rp.date}
                    </span>
                  </div>
                  <StatusPill status={rp.status === 'Cleared' ? 'Accepted' : 'Pending'} />
                </div>
              ))}
            </div>
          </div>

          {/* Trend chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-navy">Department Performance Trend — Last 6 Months</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="turnaround"
                    name="Avg Turnaround Days"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    animationDuration={1200}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Avg Accuracy Rate %"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </PageTransition>
    </ManagerLayout>
  )
}
