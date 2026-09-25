import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, TrendingUp, CheckCircle2, AlertCircle, HelpCircle, FileText, ChevronRight } from 'lucide-react'
import ClientLayout from '../../components/client/ClientLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import LifecycleStepper from '../../components/shared/LifecycleStepper'
import { clientPortal } from '../../data/sampleData'
import { useClientFY, ENGAGEMENT_REFS } from '../../context/ClientFYContext'
import { getActivityEvents } from '../../data/activityLog'

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)

  useEffect(() => {
    setValue(0)
    startRef.current = null
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

// FY-specific data for demo
function getFYData(fy) {
  if (fy === 'FY2023') {
    return {
      stats: { totalRequirements: 78, documentsAccepted: 78, pendingAction: 0, pendingDueThisWeek: 0, openQueries: 0, criticalQueries: 0 },
      engagementRef: ENGAGEMENT_REFS['FY2023'],
      stages: [
        { id: 'onboarding', label: 'Getting Started', status: 'completed' },
        { id: 'data-collection', label: 'Sending Your Documents', status: 'completed' },
        { id: 'under-audit', label: 'Audit in Progress', status: 'completed' },
        { id: 'draft-issued', label: 'Review Your Draft', status: 'completed' },
        { id: 'finalized', label: 'Audit Complete', status: 'completed' },
        { id: 'filed', label: 'Submitted to Authority', status: 'completed', qawaemRef: 'QAW-2023-77203' },
      ],
    }
  }
  if (fy === 'FY2022') {
    return {
      stats: { totalRequirements: 72, documentsAccepted: 72, pendingAction: 0, pendingDueThisWeek: 0, openQueries: 0, criticalQueries: 0 },
      engagementRef: ENGAGEMENT_REFS['FY2022'],
      stages: [
        { id: 'onboarding', label: 'Getting Started', status: 'completed' },
        { id: 'data-collection', label: 'Sending Your Documents', status: 'completed' },
        { id: 'under-audit', label: 'Audit in Progress', status: 'completed' },
        { id: 'draft-issued', label: 'Review Your Draft', status: 'completed' },
        { id: 'finalized', label: 'Audit Complete', status: 'completed' },
        { id: 'filed', label: 'Submitted to Authority', status: 'completed', qawaemRef: 'QAW-2022-62018' },
      ],
    }
  }
  return {
    stats: clientPortal.stats,
    engagementRef: ENGAGEMENT_REFS['FY2024'],
    stages: [
      { id: 'onboarding', label: 'Getting Started', status: 'completed' },
      { id: 'data-collection', label: 'Sending Your Documents', status: 'completed' },
      { id: 'under-audit', label: 'Audit in Progress', status: 'active' },
      { id: 'draft-issued', label: 'Review Your Draft', status: 'upcoming' },
      { id: 'finalized', label: 'Audit Complete', status: 'upcoming' },
      { id: 'filed', label: 'Submitted to Authority', status: 'upcoming', qawaemRef: 'QAW-2024-88412' },
    ],
  }
}

const STAGE_TOOLTIPS = {
  'Getting Started': 'We set up your audit file and you sign the engagement letter.',
  'Sending Your Documents': 'You upload documents and records we need for the audit.',
  'Audit in Progress': 'Our team reviews your documents and performs audit testing.',
  'Review Your Draft': 'You review and confirm the draft financial statements.',
  'Audit Complete': 'All reviews are done and the final report is signed.',
  'Submitted to Authority': 'Your audit report is filed with the relevant authority.',
}

const ICON_COLOR = {
  emerald: 'text-emerald',
  red: 'text-alert-red',
  amber: 'text-amber',
  blue: 'text-blue-500',
  navy: 'text-navy',
}

const EVENT_ICONS = {
  emerald: CheckCircle2,
  red: AlertCircle,
  amber: AlertCircle,
  blue: FileText,
  navy: TrendingUp,
}

function ActivityEventRow({ event }) {
  const Icon = EVENT_ICONS[event.icon] || FileText
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className={`mt-0.5 shrink-0 ${ICON_COLOR[event.icon] || 'text-navy'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-navy">{event.description}</p>
        <p className="text-xs text-slate-400 mt-0.5">{event.timestamp}</p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
        {event.section}
      </span>
    </div>
  )
}

function AuditProgressHero({ total, accepted, delay, fy }) {
  const count = useCountUp(accepted)
  const percent = total > 0 ? Math.round((accepted / total) * 100) : 0
  const radius = 42
  const circumference = 2 * Math.PI * radius

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="flex items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-6"
    >
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" />
          <motion.circle
            key={fy}
            cx="50" cy="50" r={radius} fill="none"
            stroke="#059669" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
            transition={{ duration: 1, ease: 'easeOut', delay }}
          />
        </svg>
        <span className="absolute text-xs font-bold text-emerald">{percent}%</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit Progress</p>
        <p className="mt-1 text-3xl font-black text-navy">
          {count} <span className="text-lg font-medium text-slate-400">of {total}</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">documents submitted</p>
      </div>
    </motion.div>
  )
}

function StatCard({ label, sub, value, color, icon: Icon, delay, className = '', suffix = '' }) {
  const count = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -2 }}
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className={`text-3xl font-bold ${color}`}>{count}{suffix}</span>
        {Icon && <Icon className={`mb-1 h-4 w-4 ${color}`} />}
      </div>
      {sub && <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p>}
    </motion.div>
  )
}

export default function ClientDashboard() {
  const { selectedFY, setSelectedFY, availableFYs } = useClientFY()
  const fyData = getFYData(selectedFY)
  const isAuthorisedSignatory = clientPortal.clientRole === 'Authorised Signatory'
  const recentEvents = getActivityEvents().slice(0, 5)

  return (
    <ClientLayout title="Dashboard">
      <PageTransition>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFY}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Greeting */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-navy">Welcome, {clientPortal.clientName}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Statutory Filing Deadline: <span className="font-medium text-navy">{clientPortal.statutoryDeadline}</span>
                <span className="ml-3 rounded-full bg-amber/10 px-3 py-0.5 text-xs font-semibold text-amber">
                  {clientPortal.daysRemaining} Days Remaining
                </span>
              </p>
            </div>

            {/* FY Selector row */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-500">You are viewing:</span>
                <div className="flex gap-1">
                  {availableFYs.map((fy) => (
                    <button
                      key={fy}
                      onClick={() => setSelectedFY(fy)}
                      className={`relative px-4 py-1.5 text-sm font-semibold transition-colors ${
                        selectedFY === fy
                          ? 'text-navy'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {fy}
                      {selectedFY === fy && (
                        <motion.div
                          layoutId="fy-underline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {fyData.engagementRef}
              </span>
            </div>

            {/* Stage stepper */}
            <div className="rounded-xl border border-slate-200 p-6 shadow-sm" style={{ background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)' }}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-navy">Your Audit Journey</h2>
              </div>
              <LifecycleStepper stages={fyData.stages} tooltips={STAGE_TOOLTIPS} />
            </div>

            {/* On Hold banner */}
            {selectedFY === 'FY2024' && clientPortal.onHold.active && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between gap-4 rounded-xl border border-amber/30 bg-amber/10 px-5 py-4"
              >
                <p className="text-sm font-medium text-amber">{clientPortal.onHold.message}</p>
                {isAuthorisedSignatory && (
                  <div className="flex shrink-0 items-center gap-2 text-amber/80">
                    <Lock className="h-4 w-4" />
                    <span className="text-[11px]">Account Owner notice</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Stat tiles */}
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-12">
              <AuditProgressHero
                total={fyData.stats.totalRequirements}
                accepted={fyData.stats.documentsAccepted}
                delay={0}
                fy={selectedFY}
              />
              <StatCard label="Approved Documents" value={fyData.stats.documentsAccepted} color="text-emerald" icon={CheckCircle2} delay={0.05} className="md:col-span-3" />
              <StatCard label="Still Needed from You" value={fyData.stats.pendingAction} color="text-amber" sub={fyData.stats.pendingDueThisWeek > 0 ? `${fyData.stats.pendingDueThisWeek} due this week` : 'All uploaded'} delay={0.1} className="md:col-span-3" />
              <StatCard label="Questions from Your Auditor" value={fyData.stats.openQueries} color="text-alert-red" sub={fyData.stats.criticalQueries > 0 ? `${fyData.stats.criticalQueries} need urgent reply` : 'All answered'} delay={0.15} className="md:col-span-3" />
              <StatCard label="Days to Deadline" value={clientPortal.daysRemaining} color="text-navy" sub={clientPortal.statutoryDeadline} delay={0.2} className="md:col-span-3" />
            </div>

            {/* Audit team strip */}
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-navy">Your Audit Team</h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-sm font-bold text-navy">TA</div>
                  <div>
                    <p className="text-sm font-semibold text-navy">Tariq Al-Harbi</p>
                    <p className="text-xs text-slate-500">Lead Auditor — Analytix Audit Team</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 ml-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Analytix Audit Team</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Proper Audit</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{selectedFY}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-navy">Recent Activity</h2>
              </div>
              <div className="px-5 py-2">
                {recentEvents.map((event) => (
                  <ActivityEventRow key={event.id} event={event} />
                ))}
              </div>
              <div className="border-t border-slate-100 px-5 py-3">
                <Link to="/client/activity" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                  View Full Activity Log <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </PageTransition>
    </ClientLayout>
  )
}
