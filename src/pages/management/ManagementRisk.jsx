import { motion } from 'framer-motion'
import { ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import ManagementLayout from '../../components/management/ManagementLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { useMgmtScope } from '../../hooks/useMgmtScope'
import {
  mgmtRiskHeatmap,
  mgmtComplianceChecks,
  mgmtDeadlineBreaches,
  mgmtIndependenceFlags,
  mgmtAtRiskFiles,
} from '../../data/sampleData'

const D = {
  card: '#0F1629',
  cardBorder: 'rgba(255,255,255,0.07)',
  heading: '#F1F5F9',
  muted: '#94A3B8',
  subtle: '#475569',
}

const CRITICAL_COLOR = '#DC2626'
const SEVERITY = {
  crit: { bg: 'rgba(220,38,38,0.15)', color: '#E8323C', label: 'Critical' },
  warn: { bg: 'rgba(217,119,6,0.15)', color: '#D97706', label: 'At Risk' },
}
const CHECK_STATUS = {
  ok: { icon: CheckCircle2, color: '#059669' },
  warn: { icon: AlertTriangle, color: '#D97706' },
}

export default function ManagementRisk() {
  const showToast = useToast()
  const [scope] = useMgmtScope()
  const atRiskFiles = mgmtAtRiskFiles.filter((f) => scope === 'Combined' || f.dept === scope)

  return (
    <ManagementLayout title="Risk & Compliance">
      <PageTransition>
        <div className="space-y-6">

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold" style={{ color: D.heading }}>Risk & Compliance — ABCPA + MISCPA</h1>
              <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.08)', color: D.muted }}>
                Firm-Wide View
              </span>
            </div>
          </div>

          {/* Deadline breaches — most urgent */}
          <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: '#E8323C' }} />
              <h3 className="text-sm font-bold" style={{ color: D.heading }}>Statutory Deadline Breaches</h3>
            </div>
            <div className="space-y-2.5">
              {mgmtDeadlineBreaches.map((b, idx) => {
                const sv = SEVERITY[b.severity]
                return (
                  <motion.div
                    key={b.code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.25 }}
                    className="flex items-center justify-between gap-3 rounded-lg p-3"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: D.heading }}>{b.client}</p>
                      <p className="text-[11px]" style={{ color: D.muted }}>{b.code} · {b.dept} · Deadline {b.deadline}</p>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: sv.bg, color: sv.color }}>
                      {b.daysLeft < 0 ? `${Math.abs(b.daysLeft)}d overdue` : `${b.daysLeft}d left`}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Critical files by department */}
            <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" style={{ color: D.muted }} />
                <h3 className="text-sm font-bold" style={{ color: D.heading }}>Critical Files by Department</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {mgmtRiskHeatmap.map((row) => (
                  <div key={row.dept} className="rounded-lg p-4 text-center" style={{ background: `${CRITICAL_COLOR}18` }}>
                    <p className="text-2xl font-black" style={{ color: CRITICAL_COLOR }}>{row.critical}</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>{row.dept} · Critical</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance checklist */}
            <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" style={{ color: D.muted }} />
                <h3 className="text-sm font-bold" style={{ color: D.heading }}>Firm Compliance Checklist</h3>
              </div>
              <div className="space-y-3">
                {mgmtComplianceChecks.map((c) => {
                  const cs = CHECK_STATUS[c.status]
                  const Icon = cs.icon
                  return (
                    <div key={c.id} className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: cs.color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold" style={{ color: D.heading }}>{c.label}</p>
                          <span className="shrink-0 text-xs font-bold" style={{ color: cs.color }}>{c.value}</span>
                        </div>
                        <p className="mt-0.5 text-[11px]" style={{ color: D.muted }}>{c.note}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Independence flags */}
          <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
            <h3 className="mb-4 text-sm font-bold" style={{ color: D.heading }}>Independence & Conflict Flags</h3>
            <div className="space-y-3">
              {mgmtIndependenceFlags.map((f, idx) => (
                <div key={f.client} className="flex items-start justify-between gap-3 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: D.heading }}>{f.client} <span className="font-normal" style={{ color: D.muted }}>· {f.dept}</span></p>
                    <p className="mt-1 text-[11px] leading-relaxed" style={{ color: D.muted }}>{f.issue}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ background: f.status === 'Cleared' ? 'rgba(5,150,105,0.15)' : 'rgba(217,119,6,0.15)', color: f.status === 'Cleared' ? '#059669' : '#D97706' }}
                  >
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* At-risk files, with action */}
          <div className="rounded-xl p-6" style={{ background: D.card, border: `1px solid ${D.cardBorder}` }}>
            <h3 className="mb-4 text-sm font-bold" style={{ color: D.heading }}>At-Risk Files — Blockers</h3>
            <div className="space-y-3">
              {atRiskFiles.length === 0 && <p className="text-xs" style={{ color: D.muted }}>No at-risk files for {scope}.</p>}
              {atRiskFiles.map((f) => (
                <div key={f.client} className="flex items-start justify-between gap-3 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: D.heading }}>{f.client} <span className="font-normal" style={{ color: D.muted }}>· {f.dept}</span></p>
                    <p className="mt-1 text-[11px] leading-relaxed" style={{ color: D.muted }}>{f.blocker}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: 'rgba(220,38,38,0.15)', color: '#E8323C' }}>{f.status}</span>
                    <button
                      onClick={() => showToast(f.action === 'escalate' ? `Escalated — ${f.client}` : `Flagged for review — ${f.client}`)}
                      className="rounded-md bg-brand px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-[#D12C35]"
                    >
                      {f.action === 'escalate' ? 'Escalate' : 'Review'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </PageTransition>
    </ManagementLayout>
  )
}
