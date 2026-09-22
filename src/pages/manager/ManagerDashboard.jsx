import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Clock, Users, PauseCircle, Banknote, ArrowRight } from 'lucide-react'
import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import {
  managerUser,
  departmentStats,
  managerActionCards,
  abcpaPortfolio,
  abcpaDeptManagers,
  abcpaUrgentFiles,
  firmPerformanceSummary,
  leadWorkload,
  capacityTone,
  parkedFilesReview,
  managerTodaysActivity,
  managerEscalationAlerts,
} from '../../data/sampleData'

const ICONS = { Clock, Users, PauseCircle, Banknote }
const TONE = {
  'alert-red': { border: 'border-alert-red/30', icon: 'bg-alert-red/10 text-alert-red', btn: 'bg-alert-red hover:bg-red-700' },
  amber: { border: 'border-amber/30', icon: 'bg-amber/10 text-amber', btn: 'bg-amber hover:bg-amber-600' },
}

const STAT_CHIPS = [
  { label: 'Total Active Files', value: departmentStats.totalActive, tone: 'bg-navy/10 text-navy' },
  { label: 'On Track', value: departmentStats.onTrack, tone: 'bg-emerald/10 text-emerald' },
  { label: 'At Risk', value: departmentStats.atRisk, tone: 'bg-amber/10 text-amber' },
  { label: 'Critical', value: departmentStats.critical, tone: 'bg-alert-red/10 text-alert-red' },
  { label: 'Unallocated', value: departmentStats.unallocated, tone: 'bg-yellow-100 text-yellow-700' },
]

const STATUS_TONE = { Active: 'text-emerald', 'On Hold': 'text-amber', Parked: 'text-violet-600' }
const REASON_STYLE = {
  Capacity: 'bg-navy/10 text-navy border-navy/30',
  'Reviewer Busy': 'bg-slate-100 text-slate-600 border-slate-300',
  'Awaiting Internal Input': 'bg-amber/10 text-amber border-amber/30',
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const showToast = useToast()

  return (
    <ManagerLayout title="Dashboard">
      <PageTransition>
        <div className="space-y-6">
          {/* Greeting strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy">Good morning, {managerUser.name.split(' ')[0]}.</h1>
              <p className="text-sm text-slate-500">05 Nov 2024</p>
            </div>
            <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">
              My Department — ABCPA ({departmentStats.abcpaFiles} Files)
            </span>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-2">
            {STAT_CHIPS.map((c, idx) => (
              <motion.span
                key={c.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${c.tone}`}
              >
                {c.value} {c.label}
              </motion.span>
            ))}
          </div>

          {/* Action-required cards */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-navy">Requires Your Attention</h2>
              <span className="rounded-full bg-alert-red/10 px-2 py-0.5 text-[11px] font-bold text-alert-red">4</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {managerActionCards.map((card, idx) => {
                const Icon = ICONS[card.icon]
                const tone = TONE[card.tone]
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                    whileHover={{ y: -2 }}
                    className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg ${tone.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-navy">{card.title}</p>
                        <button
                          onClick={() => (card.route ? navigate(card.route) : showToast('Redirecting to billing — connect billing module.'))}
                          className={`mt-3 rounded-md px-3.5 py-1.5 text-xs font-semibold text-white ${tone.btn}`}
                        >
                          {card.action}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* ABCPA portfolio */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-navy">My Department — ABCPA</h2>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <motion.div
                initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-48 w-48 shrink-0"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={abcpaPortfolio} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {abcpaPortfolio.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              <div className="flex-1">
                <div className="flex flex-wrap gap-4">
                  {abcpaPortfolio.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-500">{d.name}</span>
                      <span className="font-semibold text-navy">{d.value}</span>
                    </div>
                  ))}
                  <span className="text-xs font-semibold text-navy">Total {departmentStats.abcpaFiles}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    Department Manager: {abcpaDeptManagers.manager}
                  </span>
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    AM: {abcpaDeptManagers.assistantManager}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {abcpaUrgentFiles.map((f) => (
                    <div key={f.client} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm last:border-0">
                      <span className="font-medium text-navy">{f.client}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{f.days}d</span>
                        <span className={`text-xs font-semibold ${STATUS_TONE[f.status]}`}>{f.status}</span>
                        <button
                          onClick={() => navigate('/manager/status-board')}
                          className="text-xs font-semibold text-brand hover:underline"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="rounded-full bg-amber/10 px-3 py-1.5 text-xs font-semibold text-amber">
                Firm Average Turnaround: {firmPerformanceSummary.avgTurnaround}
              </span>
              <span className="rounded-full bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald">
                Firm Average Accuracy Rate: {firmPerformanceSummary.avgAccuracy}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Detailed performance analytics available in the Performance section.</p>
          </div>

          {/* Team workload snapshot */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Team Workload — Lead Capacity</h2>
              <button onClick={() => navigate('/manager/workload')} className="text-xs font-semibold text-navy hover:underline">
                View Full Workload
              </button>
            </div>
            <div className="space-y-3">
              {leadWorkload.map((lead, idx) => {
                const tone = capacityTone(lead.files)
                const toneClass = { emerald: 'bg-emerald', amber: 'bg-amber', 'alert-red': 'bg-alert-red' }[tone]
                return (
                  <div key={lead.name} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-xs font-medium text-navy">{lead.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${(lead.files / 16) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                        className={`h-full rounded-full ${toneClass}`}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs font-bold text-navy">{lead.files}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Parked files review */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-navy">Parked Files — Review Required</h2>
            <div className="space-y-2">
              {parkedFilesReview.map((f) => (
                <div key={f.client} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 py-2.5 last:border-0">
                  <span className="text-sm font-medium text-navy">{f.client}</span>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${REASON_STYLE[f.reason]}`}>{f.reason}</span>
                    <span className={`text-xs font-semibold ${f.days > 10 ? 'text-alert-red' : 'text-slate-500'}`}>{f.days}d</span>
                    <button onClick={() => navigate('/manager/status-board')} className="text-xs font-semibold text-brand hover:underline">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom two columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Today's Activity</h2>
              <div className="space-y-3">
                {managerTodaysActivity.map((a) => (
                  <div key={a.client + a.event} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-navy">{a.client}</p>
                      <button onClick={() => navigate('/manager/status-board')} className="shrink-0 text-[11px] font-semibold text-brand hover:underline">
                        Open
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{a.event}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{a.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Escalation Alerts</h2>
              <div className="space-y-3">
                {managerEscalationAlerts.map((e) => (
                  <div key={e.client} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-navy">{e.client}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {e.daysOverdue}d overdue · {e.lead}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/manager/escalation')}
                      className="flex shrink-0 items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#D12C35]"
                    >
                      Escalate <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </ManagerLayout>
  )
}
