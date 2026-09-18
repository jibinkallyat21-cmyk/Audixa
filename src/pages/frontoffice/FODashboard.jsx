import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, Mail, Star, User, Eye, CheckCircle2 } from 'lucide-react'
import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import StatusPill from '../../components/shared/StatusPill'
import { useToast } from '../../components/shared/Toast'
import {
  foUser,
  foStatChips,
  foActionCards,
  foPipelineFunnel,
  foRecentActivity,
  foFollowUpLeads,
  foExpiringProposals,
  SCORE_TONE,
} from '../../data/sampleData'

const ICONS = { FileText, Mail, Star, User, Eye, CheckCircle2 }
const TONE = {
  'alert-red': { border: 'border-alert-red/30', icon: 'bg-alert-red/10 text-alert-red', btn: 'bg-alert-red hover:bg-red-700' },
  amber: { border: 'border-amber/30', icon: 'bg-amber/10 text-amber', btn: 'bg-amber hover:bg-amber-600' },
}

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

function FunnelStage({ stage, index }) {
  const value = useCountUp(stage.value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="flex flex-1 flex-col items-center"
    >
      <p className="text-2xl font-bold" style={{ color: stage.color }}>
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-500">{stage.label}</p>
    </motion.div>
  )
}

export default function FODashboard() {
  const navigate = useNavigate()
  const showToast = useToast()

  return (
    <FrontOfficeLayout title="Dashboard">
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy">Good morning, {foUser.name.split(' ')[0]}.</h1>
              <p className="text-sm text-slate-500">05 Nov 2024</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {foStatChips.map((c, idx) => (
              <motion.span
                key={c.label}
                initial={{ opacity: 0, y: 8 }}
                animate={c.pulse ? { opacity: [1, 0.6, 1], y: 0 } : { opacity: 1, y: 0 }}
                transition={c.pulse ? { y: { delay: idx * 0.08, duration: 0.3 }, opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' } } : { delay: idx * 0.08, duration: 0.3 }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${c.tone}`}
              >
                {c.label}
              </motion.span>
            ))}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-navy">Needs Your Attention</h2>
              <span className="rounded-full bg-alert-red/10 px-2 py-0.5 text-[11px] font-bold text-alert-red">9</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {foActionCards.map((card, idx) => {
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
                          onClick={() => (card.route ? navigate(card.route) : showToast('Opening conversion workflow'))}
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

          {/* Pipeline funnel */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Lead Pipeline — Today's View</h2>
              <button onClick={() => navigate('/fo/leads')} className="text-xs font-semibold text-brand-red hover:underline">
                View Full Pipeline
              </button>
            </div>
            <div className="flex items-center">
              {foPipelineFunnel.map((stage, idx) => (
                <div key={stage.label} className="flex flex-1 items-center">
                  <FunnelStage stage={stage} index={idx} />
                  {idx < foPipelineFunnel.length - 1 && <div className="mx-1 h-px flex-1 bg-slate-200 sm:mx-2" />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/fo/registration')}
                  className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
                >
                  Register New Client
                </button>
                <button
                  onClick={() => navigate('/fo/proposals')}
                  className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
                >
                  Generate Proposal
                </button>
                <button
                  onClick={() => navigate('/fo/proposals?tab=el')}
                  className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
                >
                  Capture Signed EL
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-navy">Leads Due for Follow-Up Today — 12 Leads</h2>
                <button onClick={() => navigate('/fo/leads')} className="text-xs font-semibold text-brand-red hover:underline">
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

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Proposals Expiring Soon — 3 Proposals</h2>
              <div className="space-y-3">
                {foExpiringProposals.map((p) => (
                  <div key={p.company} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-navy">{p.company}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Sent {p.sentDate} · Expires {p.expiryDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${p.daysRemaining < 3 ? 'bg-alert-red/10 text-alert-red border-alert-red/30' : 'bg-amber/10 text-amber border-amber/30'}`}>
                        {p.daysRemaining}d left
                      </span>
                      <button
                        onClick={() => showToast(`Reminder sent to ${p.company}`)}
                        className="rounded-md bg-amber px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        Send Reminder
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
