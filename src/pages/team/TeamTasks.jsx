import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import { teamTasks } from '../../data/sampleData'

const SECTIONS = [
  { priority: 'URGENT', heading: 'Urgent', tone: 'alert-red', note: 'Immediate partner sign-off impact', badgeStyle: 'bg-alert-red/10 text-alert-red border-alert-red/30' },
  { priority: 'HIGH', heading: 'High', tone: 'amber', note: 'Engagement milestone priority', badgeStyle: 'bg-amber/10 text-amber border-amber/30' },
  { priority: 'NORMAL', heading: 'Normal', tone: 'navy', note: '', badgeStyle: 'bg-slate-100 text-slate-600 border-slate-300' },
]

const HEADER_BG = { 'alert-red': 'bg-alert-red/10 border-alert-red/30', amber: 'bg-amber/10 border-amber/30', navy: 'bg-navy/5 border-navy/20' }
const HEADER_TEXT = { 'alert-red': 'text-alert-red', amber: 'text-amber', navy: 'text-navy' }

const TASKS_STORAGE_KEY = 'audixa-team-tasks-done'

function loadDone() {
  try {
    return JSON.parse(sessionStorage.getItem(TASKS_STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export default function TeamTasks() {
  const navigate = useNavigate()
  const [done, setDone] = useState(loadDone)

  const toggleTask = (id) => {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        sessionStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // sessionStorage unavailable — state still updates for this session
      }
      return next
    })
  }

  const doneCount = Object.values(done).filter(Boolean).length
  const total = teamTasks.length

  return (
    <AuditTeamLayout title="My Tasks">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-navy">My Tasks — Today (05 Nov 2024)</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1.5 text-xs font-semibold text-amber">
              <Sparkles className="h-3.5 w-3.5" />
              AI Prioritised — Tasks ranked by deadline proximity and engagement risk
            </span>
          </div>

          {SECTIONS.map((section) => {
            const tasks = teamTasks.filter((t) => t.priority === section.priority)
            return (
              <div key={section.priority} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className={`flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b px-5 py-3 ${HEADER_BG[section.tone]}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${HEADER_TEXT[section.tone]}`}>{section.heading}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${section.badgeStyle}`}>
                      {tasks.length} Tasks {section.priority === 'NORMAL' ? 'Scheduled' : section.priority === 'HIGH' ? 'Due Soon' : 'Pending'}
                    </span>
                  </div>
                  {section.note && <span className="text-[11px] text-slate-500">{section.note}</span>}
                </div>

                <div>
                  <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    <span className="w-4 shrink-0" />
                    <span className="w-20 shrink-0 text-center">Priority</span>
                    <span className="hidden w-28 shrink-0 text-center md:block">Client</span>
                    <span className="min-w-0 flex-1">Task</span>
                    <span className="hidden w-36 shrink-0 sm:block">Deadline</span>
                    <span className="w-20 shrink-0 text-right">Action</span>
                  </div>
                  {tasks.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.25 }}
                      className="flex min-h-[56px] items-center gap-4 border-b border-slate-50 px-5 py-3 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={!!done[task.id]}
                        onChange={() => toggleTask(task.id)}
                        className="h-4 w-4 shrink-0 rounded border-slate-300"
                      />
                      <div className="w-20 shrink-0">
                        <span className={`inline-flex w-full justify-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${section.badgeStyle}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="hidden w-28 shrink-0 md:block">
                        <span className="inline-flex w-full justify-center truncate rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {task.client}
                        </span>
                      </div>
                      <p className={`min-w-0 flex-1 text-sm ${done[task.id] ? 'text-slate-400 line-through' : 'text-navy'}`}>
                        {task.description}
                      </p>
                      <p className="hidden w-36 shrink-0 text-[11px] font-medium text-slate-400 sm:block">{task.deadline}</p>
                      <button
                        onClick={() => navigate('/team/workspace/requirements')}
                        className="w-20 shrink-0 whitespace-nowrap text-right text-xs font-semibold text-brand hover:underline"
                      >
                        Go to File
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-navy">
              {total} tasks today — 3 Urgent / 3 High / 3 Normal. {doneCount} completed.
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                animate={{ width: `${(doneCount / total) * 100}%` }}
                transition={{ duration: 0.4 }}
                className="h-full rounded-full bg-alert-red"
              />
            </div>
          </div>
        </div>
      </PageTransition>
    </AuditTeamLayout>
  )
}
