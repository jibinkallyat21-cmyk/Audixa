import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, TrendingUp, Send, CalendarDays } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import LifecycleStepper from '../../components/shared/LifecycleStepper'
import MeetingRequestModal from '../../components/client/MeetingRequestModal'
import { clientPortal } from '../../data/sampleData'

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)

  useEffect(() => {
    let frame
    const step = (timestamp) => {
      if (startRef.current === null) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

function StatCard({ label, value, color, sub, icon: Icon, delay, className = '', suffix = '' }) {
  const count = useCountUp(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -2 }}
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className={`text-3xl font-bold ${color}`}>
          {count}
          {suffix}
        </span>
        {Icon && <Icon className={`mb-1 h-4 w-4 ${color}`} />}
      </div>
      {sub && <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p>}
    </motion.div>
  )
}

function TotalRequirementsHeroCard({ value, percent, delay }) {
  const count = useCountUp(value)
  const radius = 42
  const circumference = 2 * Math.PI * radius

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -2 }}
      className="flex items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-6 md:row-span-2"
    >
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#059669"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
            transition={{ duration: 1, ease: 'easeOut', delay }}
          />
        </svg>
        <span className="absolute text-xs font-bold text-emerald">{percent}%</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Requirements</p>
        <p className="mt-1 text-[48px] font-black leading-none text-navy">{count}</p>
      </div>
    </motion.div>
  )
}

export default function ClientDashboard() {
  const [threadMessages, setThreadMessages] = useState(clientPortal.engagementThread)
  const [draft, setDraft] = useState('')
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const isAuthorisedSignatory = clientPortal.clientRole === 'Authorised Signatory'

  const handleSend = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    setThreadMessages((prev) => [
      ...prev,
      { author: 'You', timestamp: 'Just now', text: draft.trim() },
    ])
    setDraft('')
  }

  return (
    <ClientLayout title="Dashboard">
      <PageTransition>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* Greeting card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-navy">
                  Welcome, {clientPortal.clientName}
                </h1>
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {clientPortal.fiscalYear}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {clientPortal.engagementRef}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-500">
                  Statutory Filing Deadline: <span className="font-medium text-navy">{clientPortal.statutoryDeadline}</span>
                </p>
                <span className="rounded-full bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">
                  {clientPortal.daysRemaining} Days Remaining
                </span>
              </div>

            </div>

            {/* Stage stepper — its own dedicated progress module */}
            <div
              className="rounded-xl border border-slate-200 p-6 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)' }}
            >
              <LifecycleStepper stages={clientPortal.stages} />
            </div>

            {/* On Hold banner */}
            {clientPortal.onHold.active && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-amber/30 bg-amber/10 px-5 py-4"
              >
                <p className="text-sm font-medium text-amber">{clientPortal.onHold.message}</p>
                {/* Addition 2: fully removed from the DOM for Standard Users —
                    not just visually hidden. */}
                {isAuthorisedSignatory && (
                  <div className="flex shrink-0 items-center gap-2 text-amber/80">
                    <Lock className="h-4 w-4" />
                    <span className="max-w-[140px] text-[11px] leading-tight">
                      Pending Payment Notice — Authorised Signatory only.
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Stat cards — bento: hero completion ring + 4 supporting metrics */}
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12">
              <TotalRequirementsHeroCard
                value={clientPortal.stats.totalRequirements}
                percent={Math.round((clientPortal.stats.documentsAccepted / clientPortal.stats.totalRequirements) * 100)}
                delay={0}
              />
              <StatCard
                label="Documents Accepted"
                value={clientPortal.stats.documentsAccepted}
                color="text-emerald"
                icon={TrendingUp}
                delay={0.05}
                className="md:col-span-3"
              />
              <StatCard
                label="Pending Action"
                value={clientPortal.stats.pendingAction}
                color="text-amber"
                sub={`${clientPortal.stats.pendingDueThisWeek} Due This Week`}
                delay={0.1}
                className="md:col-span-3"
              />
              <StatCard
                label="Open Queries"
                value={clientPortal.stats.openQueries}
                color="text-alert-red"
                sub={`${clientPortal.stats.criticalQueries} Critical Audits`}
                delay={0.15}
                className="md:col-span-3"
              />
              <StatCard
                label="Filing Deadline"
                value={clientPortal.daysRemaining}
                suffix=" Days"
                color="text-navy"
                sub={clientPortal.statutoryDeadline}
                delay={0.2}
                className="md:col-span-3"
              />
            </div>

            {/* Recent submissions table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-navy">Recent Submissions &amp; Stage Milestones</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-2 font-medium">Document Name</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                    <th className="px-5 py-2 font-medium">File Name</th>
                    <th className="px-5 py-2 font-medium">Timestamp</th>
                    <th className="px-5 py-2 font-medium">Reviewer</th>
                  </tr>
                </thead>
                <tbody>
                  {clientPortal.recentSubmissions.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-5 py-3 font-medium text-navy">{row.name}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500">{row.fileName}</td>
                      <td className="px-5 py-3 text-slate-500">{row.timestamp}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {row.actionRequired ? (
                          <button className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]">
                            Upload Now
                          </button>
                        ) : (
                          row.reviewer
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Engagement Team</h2>
              <div className="space-y-3">
                {clientPortal.engagementTeam.map((member) => (
                  <div key={member.name} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/10 text-xs font-semibold text-navy">
                        {member.initials}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          member.online ? 'bg-emerald' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">{member.name}</p>
                      <p className="truncate text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMeetingModalOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-brand px-3 py-2.5 text-xs font-semibold text-brand hover:bg-brand/5"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Request Meeting with Audit Team
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-navy">Direct Engagement Thread</h2>
              <div className="space-y-3">
                {threadMessages.map((msg, idx) => (
                  <div key={idx} className={msg.author === 'You' ? 'text-right' : 'text-left'}>
                    <div
                      className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                        msg.author === 'You' ? 'bg-navy text-white' : 'bg-slate-100 text-navy'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {msg.author} · {msg.timestamp}
                    </p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Reply or attach reference..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-navy"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white hover:bg-[#D12C35]"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </PageTransition>

      <MeetingRequestModal open={meetingModalOpen} onClose={() => setMeetingModalOpen(false)} />
    </ClientLayout>
  )
}
