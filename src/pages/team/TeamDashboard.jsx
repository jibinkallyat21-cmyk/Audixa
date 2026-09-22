import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, MessageCircle, ShieldAlert, Clock, ArrowRight } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditorChip from '../../components/shared/AuditorChip'
import AuditTypeChip from '../../components/shared/AuditTypeChip'
import {
  teamUser,
  teamPortfolioStats,
  teamActionCards,
  teamFiles,
  teamTasks,
  teamRecentActivity,
} from '../../data/sampleData'

const ICONS = { FileText, MessageCircle, ShieldAlert, Clock }

const TONE = {
  'alert-red': { border: 'border-alert-red/30', glow: 'shadow-[0_0_0_1px_rgba(220,38,38,0.08)]', icon: 'bg-alert-red/10 text-alert-red', btn: 'bg-alert-red hover:bg-red-700' },
  amber: { border: 'border-amber/30', glow: 'shadow-[0_0_0_1px_rgba(217,119,6,0.08)]', icon: 'bg-amber/10 text-amber', btn: 'bg-amber hover:bg-amber-600' },
}

const AUDIT_TYPE_LABEL = { Proper: 'Proper Audit', Disclaimer: 'Disclaimer' }

const PRIORITY_STYLE = {
  URGENT: 'bg-alert-red/10 text-alert-red border-alert-red/30',
  HIGH: 'bg-amber/10 text-amber border-amber/30',
  NORMAL: 'bg-slate-100 text-slate-600 border-slate-300',
}

export default function TeamDashboard() {
  const navigate = useNavigate()
  const urgentFiles = teamFiles.filter((f) => f.urgent).concat(teamFiles.filter((f) => !f.urgent)).slice(0, 5)
  const topTasks = teamTasks.slice(0, 4)

  return (
    <AuditTeamLayout title="Dashboard">
      <PageTransition>
        <div className="space-y-6">
          {/* Greeting strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy">Good morning, {teamUser.name.split(' ')[0]}.</h1>
              <p className="text-sm text-slate-500">05 Nov 2024</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">
                {teamPortfolioStats.totalActive} Active Files
              </span>
              <motion.span
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-full bg-alert-red/10 px-3 py-1.5 text-xs font-semibold text-alert-red"
              >
                {teamPortfolioStats.pendingActionsToday} Pending Actions Today
              </motion.span>
              <span className="rounded-full bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald">
                Avg Turnaround: {teamPortfolioStats.avgTurnaround}
              </span>
            </div>
          </div>

          {/* Action-required cards — bento: AI Verification Flags is the
              largest card (most important human-in-the-loop action) */}
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12">
            {['ai-flags', 'review', 'queries', 'deadlines'].map((id, idx) => {
              const card = teamActionCards.find((c) => c.id === id)
              if (!card) return null
              const Icon = ICONS[card.icon]
              const tone = TONE[card.tone]

              if (id === 'ai-flags') {
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                    whileHover={{ y: -2 }}
                    className="rounded-xl bg-navy p-6 text-white shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-6 md:row-span-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="rounded-full bg-alert-red px-2.5 py-1 text-[11px] font-bold text-white"
                      >
                        3 Flags
                      </motion.span>
                    </div>
                    <p className="mt-4 text-base font-bold">AI Verification Flags — Awaiting Your Approval</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      AI has drafted rejections awaiting your approval. Nothing is sent until you approve.
                    </p>
                    <button
                      onClick={() => navigate(card.route)}
                      className="mt-6 w-full rounded-md bg-alert-red py-3 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Review Flags
                    </button>
                  </motion.div>
                )
              }

              const span = id === 'review' ? 'md:col-span-6' : 'md:col-span-3'

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                  whileHover={{ y: -2 }}
                  className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg ${tone.border} ${tone.glow} ${span}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-navy">{card.title}</p>
                      {card.note && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{card.note}</p>}
                      <button
                        onClick={() => navigate(card.route)}
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

          {/* Portfolio summary strip — full-width bento of 5 stat pills */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Total', value: teamPortfolioStats.totalActive, color: 'text-navy' },
              { label: 'Urgent', value: teamPortfolioStats.urgent, color: 'text-alert-red' },
              { label: 'On Track', value: teamPortfolioStats.onTrack, color: 'text-emerald' },
              { label: 'With Reviewer', value: teamPortfolioStats.withReviewer, color: 'text-blue-600' },
              { label: 'Parked', value: teamPortfolioStats.parked, color: 'text-amber' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm transition-shadow duration-200 hover:shadow-lg"
              >
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* File table (col-span 8) + Today's Tasks (col-span 4) */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8">
            <h2 className="text-sm font-semibold text-navy">My Active Files — Portfolio Overview</h2>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="py-2 font-medium">Client</th>
                    <th className="py-2 font-medium">Auditor</th>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">Stage</th>
                    <th className="py-2 font-medium">Attention</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {urgentFiles.map((f, idx) => (
                    <motion.tr
                      key={f.code}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.25 }}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-3 font-medium text-navy">{f.client}</td>
                      <td className="py-3">
                        <AuditorChip auditor={f.auditor} />
                      </td>
                      <td className="py-3">
                        <AuditTypeChip type={AUDIT_TYPE_LABEL[f.auditType] || f.auditType} />
                      </td>
                      <td className="py-3 text-slate-500">{f.stage}</td>
                      <td className="py-3">
                        <span
                          className={`text-xs font-medium ${f.attentionLevel === 'URGENT' ? 'text-alert-red' : f.attentionLevel === 'FINAL' ? 'text-emerald' : 'text-amber'}`}
                        >
                          {f.shortAttention}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => navigate('/team/workspace/requirements')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                        >
                          Open Workspace <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => navigate('/team/files')}
              className="mt-4 w-full rounded-lg border border-navy/30 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              View All 28 Files
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Today's Priority Tasks</h2>
              <button onClick={() => navigate('/team/tasks')} className="text-xs font-semibold text-brand hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {topTasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_STYLE[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {task.client}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-navy">{task.description}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{task.deadline}</p>
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* Bottom row — Recent Activity + Quick Stats bento */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy">Recent Activity on My Files</h2>
                <button
                  onClick={() => navigate('/team/workspace/audit-trail')}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  View Full Audit Log
                </button>
              </div>
              <div className="space-y-3">
                {teamRecentActivity.map((a) => (
                  <div key={a.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs font-semibold text-navy">{a.client}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{a.event}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{a.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 rounded-xl bg-navy p-6 text-white shadow-sm lg:col-span-4">
              <div>
                <p className="text-lg font-bold leading-none">{teamPortfolioStats.avgTurnaround}</p>
                <p className="mt-1 text-[11px] text-white/50">Avg Turnaround</p>
              </div>
              <div>
                <p className="text-lg font-bold leading-none">92%</p>
                <p className="mt-1 text-[11px] text-white/50">Firm Accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
