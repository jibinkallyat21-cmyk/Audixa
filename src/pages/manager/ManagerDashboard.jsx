import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import {
  Clock, Users, PauseCircle, Banknote, ArrowRight, ChevronDown, ChevronUp,
  Download, AlertTriangle, Video, CalendarDays, X, ArrowUp,
} from 'lucide-react'
import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
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
  statusBoardFiles,
  statusBoardFilterCounts,
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

const STATUS_BOARD_FILTERS = ['All', 'Active', 'With Reviewer', 'On Hold', 'Parked']

/* ── Escalation data (recent 5 from client portal) ── */
const CLIENT_ESCALATIONS = [
  { id: 'e1', client: 'Al-Yamamah Steel', level: 1, levelLabel: 'Team Lead', message: 'No document update for 5 days', ts: '2 hours ago', unread: true },
  { id: 'e2', client: 'Dammam Hospitality', level: 2, levelLabel: 'Assistant Manager', message: 'Client unresponsive for 8 days', ts: '5 hours ago', unread: true },
  { id: 'e3', client: 'Al-Marai Co.', level: 1, levelLabel: 'Team Lead', message: 'Urgent query awaiting response', ts: '1 day ago', unread: false },
  { id: 'e4', client: 'Riyadh Pharma', level: 3, levelLabel: 'Audit Manager', message: 'Critical SLA breach — 15 days overdue', ts: '1 day ago', unread: true },
  { id: 'e5', client: 'Saudi Cables', level: 2, levelLabel: 'Assistant Manager', message: 'Document rejected by reviewer', ts: '2 days ago', unread: false },
]

const LEVEL_STYLE = {
  1: 'bg-amber/10 text-amber border-amber/30',
  2: 'bg-orange-100 text-orange-600 border-orange-200',
  3: 'bg-alert-red/10 text-alert-red border-alert-red/30',
  4: 'bg-purple-100 text-purple-700 border-purple-200',
}

/* ── Meeting request modal ── */
function MeetingModal({ onClose }) {
  const showToast = useToast()
  const [mode, setMode] = useState('request')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')

  const handleMeetNow = () => {
    showToast('Launching Teams call — opening meeting link...')
    onClose()
  }

  const handleRequest = () => {
    if (!subject.trim() || !date) return showToast('Please fill all fields')
    showToast(`Meeting request sent — "${subject}" scheduled for ${date}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Meeting</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-2">
          {[{ key: 'request', label: 'Request Meeting', icon: CalendarDays }, { key: 'now', label: 'Meet Now', icon: Video }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setMode(key)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 text-xs font-semibold transition-all ${mode === key ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
        {mode === 'request' ? (
          <div className="space-y-3">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Meeting subject" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy" />
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-navy" />
            <button onClick={handleRequest} className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-[#D12C35]">
              Send Meeting Request
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-500">Start an instant Teams call with your team</p>
            <button onClick={handleMeetNow} className="w-full rounded-lg bg-emerald py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
              <Video className="mr-2 inline h-4 w-4" />
              Launch Teams Call
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [sbFilter, setSbFilter] = useState('All')
  const [sbExpanded, setSbExpanded] = useState(false)
  const [escalExpanded, setEscalExpanded] = useState(false)
  const [meetingOpen, setMeetingOpen] = useState(false)

  const visibleFiles = sbFilter === 'All' ? statusBoardFiles : statusBoardFiles.filter((f) => f.status === sbFilter)
  const displayFiles = sbExpanded ? visibleFiles : visibleFiles.slice(0, 5)

  return (
    <ManagerLayout title="Dashboard">
      <PageTransition>
        <div className="space-y-6">

          {/* ── Greeting + quick actions ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy">Good morning, {managerUser.name.split(' ')[0]}.</h1>
              <p className="text-sm text-slate-500">05 Nov 2024</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">
                My Department — ABCPA ({departmentStats.abcpaFiles} Files)
              </span>
              <button
                onClick={() => setMeetingOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-navy/30 bg-navy/5 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/10"
              >
                <CalendarDays className="h-3.5 w-3.5" /> Meeting
              </button>
            </div>
          </div>

          {/* ── Stat chips ── */}
          <div className="flex flex-wrap gap-2">
            {STAT_CHIPS.map((c, idx) => (
              <motion.span
                key={c.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.3 }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${c.tone}`}
              >
                {c.value} {c.label}
              </motion.span>
            ))}
          </div>

          {/* ── Main grid: Execution Summary + Escalation Corner ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Execution summary + status board (spans 2/3) */}
            <div className="space-y-5 lg:col-span-2">

              {/* Action cards */}
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
                              onClick={() => (card.route ? navigate(card.route) : showToast('Redirecting to billing'))}
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

              {/* ── Merged File Status Board ── */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-navy">File Status Board — Execution Overview</h2>
                    <p className="text-xs text-slate-400 mt-0.5">ABCPA Department · SLA: 94.8%</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-alert-red/10 px-3 py-1 text-[11px] font-semibold text-alert-red">Senior Blocker: 12 Files</span>
                    <button onClick={() => showToast('CSV exported')} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50">
                      <Download className="h-3.5 w-3.5" /> Export
                    </button>
                  </div>
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-50">
                  {STATUS_BOARD_FILTERS.map((f) => (
                    <button key={f} onClick={() => setSbFilter(f)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${sbFilter === f ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {f} ({statusBoardFilterCounts[f]})
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3 font-medium">Client &amp; Engagement</th>
                        <th className="px-5 py-3 font-medium">Team</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Days in State</th>
                        <th className="px-5 py-3 font-medium">AI Bottleneck</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayFiles.map((f, idx) => (
                        <motion.tr
                          key={f.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.2 }}
                          onClick={() => navigate('/manager/status-board')}
                          className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <p className="font-semibold text-navy">{f.id} — {f.client}</p>
                            <p className="text-xs text-slate-400">{f.engagement}</p>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">{f.team}</td>
                          <td className="px-5 py-3"><StatusPill status={f.status} /></td>
                          <td className="px-5 py-3">
                            <span className={`flex items-center gap-1 text-xs font-semibold ${f.daysInState > 7 ? 'text-alert-red' : 'text-slate-500'}`}>
                              {f.daysInState}d
                              {f.daysInState > 7 && (
                                <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                                  <ArrowUp className="h-3 w-3" />
                                </motion.span>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-500">{f.note}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => setSbExpanded((v) => !v)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-xs font-semibold text-navy hover:bg-slate-50 transition-colors"
                >
                  {sbExpanded ? <><ChevronUp className="h-3.5 w-3.5" /> Show Less</> : <><ChevronDown className="h-3.5 w-3.5" /> View All {visibleFiles.length} Files</>}
                </button>
              </div>

              {/* Team workload snapshot */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-navy">Team Workload — Lead Capacity</h2>
                  <button onClick={() => navigate('/manager/workload')} className="text-xs font-semibold text-navy hover:underline">
                    Full View
                  </button>
                </div>
                <div className="space-y-3">
                  {leadWorkload.map((lead, idx) => {
                    const tone = capacityTone(lead.files)
                    const toneClass = { emerald: 'bg-emerald', amber: 'bg-amber', 'alert-red': 'bg-alert-red' }[tone]
                    return (
                      <motion.div
                        key={lead.name}
                        className="group flex items-center gap-3 cursor-default"
                        whileHover={{ x: 2 }}
                      >
                        <span className="w-32 shrink-0 truncate text-xs font-medium text-navy">{lead.name}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: `${(lead.files / 16) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                            className={`h-full rounded-full ${toneClass}`}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-xs font-bold text-navy">{lead.files} files</span>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Right column: Escalation Corner + Activity ── */}
            <div className="space-y-5">

              {/* Escalation Corner Widget */}
              <div className="rounded-xl border border-alert-red/20 bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setEscalExpanded((v) => !v)}
                  className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-alert-red" />
                    <h2 className="text-sm font-semibold text-navy">Client Escalations</h2>
                    <span className="rounded-full bg-alert-red text-white text-[10px] font-bold px-1.5 py-0.5">
                      {CLIENT_ESCALATIONS.filter((e) => e.unread).length}
                    </span>
                  </div>
                  {escalExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>

                <div className="space-y-0">
                  {(escalExpanded ? CLIENT_ESCALATIONS : CLIENT_ESCALATIONS.slice(0, 5)).map((e) => (
                    <motion.div
                      key={e.id}
                      layout
                      className={`border-t border-slate-100 px-5 py-3 hover:bg-slate-50 transition-colors ${e.unread ? 'bg-alert-red/[0.02]' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {e.unread && <span className="h-1.5 w-1.5 rounded-full bg-alert-red shrink-0" />}
                            <p className="truncate text-xs font-semibold text-navy">{e.client}</p>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500 truncate">{e.message}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{e.ts}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${LEVEL_STYLE[e.level]}`}>
                            L{e.level} · {e.levelLabel}
                          </span>
                          <button
                            onClick={() => navigate('/manager/escalation')}
                            className="text-[10px] font-semibold text-brand hover:underline"
                          >
                            Respond
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/manager/escalation')}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-xs font-semibold text-brand hover:bg-alert-red/5 transition-colors"
                >
                  All Escalations <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Today's Activity */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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

              {/* ABCPA portfolio mini */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-navy">ABCPA Portfolio</h2>
                <div className="flex items-center gap-4">
                  <div className="h-28 w-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={abcpaPortfolio} dataKey="value" innerRadius={30} outerRadius={52} paddingAngle={2}>
                          {abcpaPortfolio.map((d) => <Cell key={d.name} fill={d.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {abcpaPortfolio.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-slate-500">{d.name}</span>
                        </div>
                        <span className="font-semibold text-navy">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold text-emerald">{firmPerformanceSummary.avgTurnaround}</span>
                  <span className="rounded-full bg-amber/10 px-2.5 py-1 text-[10px] font-semibold text-amber">{firmPerformanceSummary.avgAccuracy} Accuracy</span>
                </div>
              </div>

              {/* Parked files review */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-navy">Parked Files — Review</h2>
                <div className="space-y-2">
                  {parkedFilesReview.slice(0, 3).map((f) => (
                    <div key={f.client} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 py-2 last:border-0">
                      <span className="text-xs font-medium text-navy truncate">{f.client}</span>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${REASON_STYLE[f.reason]}`}>{f.reason}</span>
                        <span className={`text-[10px] font-semibold ${f.days > 10 ? 'text-alert-red' : 'text-slate-500'}`}>{f.days}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>

      <AnimatePresence>
        {meetingOpen && <MeetingModal onClose={() => setMeetingOpen(false)} />}
      </AnimatePresence>
    </ManagerLayout>
  )
}
