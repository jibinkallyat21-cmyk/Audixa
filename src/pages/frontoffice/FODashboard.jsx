import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, Star, Eye, CheckCircle2, TrendingUp, Banknote, Briefcase, UserCheck } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import { useToast } from '../../components/shared/Toast'
import {
  foUser,
  foRecentActivity,
  foFollowUpLeads,
  foExpiringProposals,
  SCORE_TONE,
} from '../../data/sampleData'

const ICONS = { FileText, Star, Eye, CheckCircle2 }

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame
    const start = performance.now()
    const step = (t) => {
      const progress = Math.min((t - start) / duration, 1)
      setValue(Math.round(target * progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

function KpiCard({ icon: Icon, label, value, prefix, suffix, accent, idx }) {
  const n = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.3 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full`} style={{ background: `${accent}15` }}>
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <p className="text-2xl font-bold text-navy">
        {prefix}{n.toLocaleString()}{suffix}
      </p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </motion.div>
  )
}

const KPI_DATA = [
  { icon: Briefcase, label: 'Total Files Engaged', value: 148, prefix: '', suffix: '', accent: '#0D1B2A' },
  { icon: Banknote, label: 'Payments Received (Month)', value: 420000, prefix: 'SAR ', suffix: '', accent: '#059669' },
  { icon: FileText, label: 'Proposals Sent (Month)', value: 87, prefix: '', suffix: '', accent: '#D97706' },
  { icon: UserCheck, label: 'Proposals Signed (Month)', value: 14, prefix: '', suffix: '', accent: '#2563EB' },
  { icon: TrendingUp, label: 'Conversion Rate', value: 17, prefix: '', suffix: '%', accent: '#7C3AED' },
  { icon: Star, label: 'High-Priority Leads', value: 312, prefix: '', suffix: '', accent: '#E8323C' },
]

export default function FODashboard() {
  const navigate = useNavigate()
  const showToast = useToast()

  return (
    <FrontOfficeLayout title="Dashboard">
      <PageTransition>
        <div className="space-y-6">

          {/* ── Greeting ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy">Good morning, {foUser.name.split(' ')[0]}.</h1>
              <p className="text-sm text-slate-500">Sales & Front Office Overview</p>
            </div>
          </div>

          {/* ── KPI Grid ── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {KPI_DATA.map((kpi, idx) => (
              <KpiCard key={kpi.label} {...kpi} idx={idx} />
            ))}
          </div>

          {/* ── Needs Attention ── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-navy">Needs Your Attention</h2>
              <span className="rounded-full bg-alert-red/10 px-2 py-0.5 text-[11px] font-bold text-alert-red">7</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: '4 Proposals Awaiting FO Manager Approval', action: 'Review Now', route: '/fo/proposals', tone: 'alert-red' },
                { title: '8 High-Priority Leads Not Yet Contacted', action: 'View Leads', route: '/fo/leads', tone: 'amber' },
                { title: '3 Signed Proposals Not Yet Converted', action: 'Convert Now', route: null, tone: 'amber' },
              ].map((card, idx) => {
                const borderColor = card.tone === 'alert-red' ? 'border-alert-red/30' : 'border-amber/30'
                const btnColor = card.tone === 'alert-red' ? 'bg-alert-red hover:bg-red-700' : 'bg-amber hover:bg-amber-600'
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                    className={`rounded-xl border bg-white p-5 shadow-sm ${borderColor}`}
                  >
                    <p className="text-sm font-bold text-navy">{card.title}</p>
                    <button
                      onClick={() => card.route ? navigate(card.route) : showToast('Opening conversion workflow')}
                      className={`mt-3 rounded-md px-3.5 py-1.5 text-xs font-semibold text-white ${btnColor}`}
                    >
                      {card.action}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Recent Activity</h2>
              <div className="space-y-3">
                {foRecentActivity.map((a) => (
                  <div key={a.client + a.type} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{a.type}</span>
                        <p className="truncate text-xs font-semibold text-navy">{a.client}</p>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{a.timestamp}</p>
                    </div>
                    <StatusPill status={a.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/fo/leads')}
                  className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 hover:bg-[#D12C35]"
                >
                  Add New Lead
                </button>
                <button
                  onClick={() => navigate('/fo/proposals')}
                  className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
                >
                  View Proposals
                </button>
                <button
                  onClick={() => navigate('/fo/leads')}
                  className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
                >
                  Import Existing Clients
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Follow-Up Leads */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy">Leads Due for Follow-Up Today</h2>
                <button onClick={() => navigate('/fo/leads')} className="text-xs font-semibold text-brand hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {foFollowUpLeads.map((lead) => (
                  <div key={lead.company} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-navy">{lead.company}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SCORE_TONE[lead.score]}`}>{lead.score}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Last contact {lead.lastContact} · {lead.followUpType}
                      </p>
                    </div>
                    <button
                      onClick={() => showToast(`Contact logged for ${lead.company}`)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
                    >
                      Contact
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Expiring Proposals */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Proposals Expiring Soon</h2>
              <div className="space-y-3">
                {foExpiringProposals.map((p) => (
                  <div key={p.company} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-navy">{p.company}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">Sent {p.sentDate} · Expires {p.expiryDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${p.daysRemaining < 3 ? 'bg-alert-red/10 text-alert-red border-alert-red/30' : 'bg-amber/10 text-amber border-amber/30'}`}>
                        {p.daysRemaining}d left
                      </span>
                      <button
                        onClick={() => showToast(`Reminder sent to ${p.company}`)}
                        className="rounded-md bg-amber px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        Remind
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </FrontOfficeLayout>
  )
}
