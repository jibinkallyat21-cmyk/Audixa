import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Clock, UserCog, PauseCircle, Banknote } from 'lucide-react'
import ManagementLayout from '../../components/management/ManagementLayout'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { useModal } from '../../components/shared/Modal'
import {
  mgmtUser,
  mgmtStatChips,
  mgmtActionCards,
  mgmtAbcpaPortfolio,
  mgmtMiscpaPortfolio,
  mgmtFirmPerformance,
  mgmtRevenueTiles,
  mgmtLeadConversion,
  mgmtConversionRate,
  mgmtEscalationsToday,
  mgmtRecentActivity,
} from '../../data/sampleData'

const ICONS = { Clock, UserCog, PauseCircle, Banknote }
const TONE = {
  'alert-red': { border: 'border-alert-red/30 shadow-alert-red/10', icon: 'bg-alert-red/10 text-alert-red', btn: 'bg-alert-red hover:bg-red-700' },
  amber: { border: 'border-amber/30 shadow-amber/10', icon: 'bg-amber/10 text-amber', btn: 'bg-amber hover:bg-amber-600' },
}

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const numeric = typeof target === 'number' ? target : parseInt(String(target).replace(/[^\d]/g, ''), 10) || 0
    let frame
    const start = performance.now()
    const step = (t) => {
      const progress = Math.min((t - start) / duration, 1)
      setValue(Math.round(numeric * progress))
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

function DeptDonut({ portfolio }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-32 w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={portfolio.breakdown}
              dataKey="value"
              nameKey="label"
              innerRadius={38}
              outerRadius={58}
              startAngle={90}
              endAngle={450}
              animationDuration={900}
              animationBegin={100}
            >
              {portfolio.breakdown.map((seg) => (
                <Cell key={seg.label} fill={seg.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {portfolio.breakdown.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
              {seg.label}
            </span>
            <span className="font-semibold text-navy">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeptColumn({ portfolio }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-navy">{portfolio.label}</h3>
      <DeptDonut portfolio={portfolio} />
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-navy/20 bg-navy/5 px-2.5 py-1 text-[11px] font-semibold text-navy">Manager: {portfolio.manager}</span>
        <span className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-[11px] font-semibold text-amber">AM: {portfolio.am}</span>
      </div>
      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
        {portfolio.urgentFiles.map((f) => (
          <div key={f.client} className="flex items-center justify-between text-xs">
            <div>
              <p className="font-medium text-navy">{f.client}</p>
              <p className="text-slate-400">
                {f.days}d · {f.status}
              </p>
            </div>
            <button onClick={() => navigate('/manager/status-board')} className="font-semibold text-brand hover:underline">
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ManagementDashboard() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { openModal, closeModal } = useModal()

  const handleEscalate = (client) => {
    openModal({
      title: 'Escalate to Management',
      body: (
        <p className="text-sm text-slate-600">
          Notify Management team of <span className="font-semibold text-navy">{client}</span> escalation?
        </p>
      ),
      confirmLabel: 'Confirm',
      onConfirm: () => {
        showToast(`Management notified — ${client}`)
        closeModal()
      },
    })
  }

  return (
    <ManagementLayout title="Dashboard">
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-navy">Good morning, {mgmtUser.name.split(' ')[0]}.</h1>
            <p className="text-sm text-slate-500">05 Nov 2024</p>
            <span className="mt-2 inline-block rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">
              Firm-Wide View — ABCPA + MISCPA Combined
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {mgmtStatChips.map((c, idx) => (
              <StatChip key={c.label} chip={c} idx={idx} />
            ))}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-navy">Requires Partner Attention</h2>
              <span className="rounded-full bg-alert-red/10 px-2 py-0.5 text-[11px] font-bold text-alert-red">4</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {mgmtActionCards.map((card, idx) => {
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
                          onClick={() => (card.route ? navigate(card.route) : showToast('Redirecting to billing module'))}
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

          <div>
            <h2 className="mb-3 text-sm font-semibold text-navy">Firm Portfolio Split</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DeptColumn portfolio={mgmtAbcpaPortfolio} />
              <DeptColumn portfolio={mgmtMiscpaPortfolio} />
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-2 text-xs font-semibold text-slate-500">Total Firm Files: 148 — ABCPA: 89 (60%) / MISCPA: 59 (40%)</p>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-emerald" />
                <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }} className="h-full bg-navy" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-amber/10 px-4 py-2 text-sm font-semibold text-amber">
              Firm Average Turnaround: {mgmtFirmPerformance.turnaround}
            </span>
            <span className="rounded-full bg-emerald/10 px-4 py-2 text-sm font-semibold text-emerald">
              Firm Average Accuracy Rate: {mgmtFirmPerformance.accuracy}
            </span>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-navy">Revenue & Billing Overview</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {mgmtRevenueTiles.map((tile, idx) => (
                <RevenueTile key={tile.label} tile={tile} idx={idx} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Lead Conversion — This Month</h2>
              <button onClick={() => navigate('/fo/leads')} className="text-xs font-semibold text-brand hover:underline">
                View Full Pipeline
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {mgmtLeadConversion.map((stage, idx) => (
                <div key={stage.label} className="flex items-center gap-4">
                  <FunnelValue stage={stage} idx={idx} />
                  {idx < mgmtLeadConversion.length - 1 && <span className="text-slate-300">→</span>}
                </div>
              ))}
              <span className="text-slate-300">→</span>
              <span className="rounded-full bg-amber/10 px-3 py-1.5 text-sm font-bold text-amber">Conversion Rate {mgmtConversionRate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Today's Escalations — Tier 2 & Tier 3</h2>
              <div className="space-y-3">
                {mgmtEscalationsToday.map((e) => (
                  <div key={e.client} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-navy">{e.client}</p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            e.dept === 'ABCPA' ? 'border-navy/30 bg-navy/10 text-navy' : 'border-amber/30 bg-amber/10 text-amber'
                          }`}
                        >
                          {e.dept}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {e.daysOverdue}d overdue · Lead: {e.lead} · Tier {e.tier}
                      </p>
                    </div>
                    <button onClick={() => handleEscalate(e.client)} className="rounded-md bg-alert-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                      Escalate
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-navy">Recent Firm Activity</h2>
              <div className="space-y-3">
                {mgmtRecentActivity.map((a, idx) => (
                  <motion.div
                    key={a.client + a.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.25 }}
                    className="flex items-center justify-between gap-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-navy">
                        {a.title} — {a.client}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${
                            a.dept === 'ABCPA' ? 'border-navy/30 bg-navy/10 text-navy' : 'border-amber/30 bg-amber/10 text-amber'
                          }`}
                        >
                          {a.dept}
                        </span>
                        <span className="text-[10px] text-slate-400">{a.user}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400">{a.timestamp}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </ManagementLayout>
  )
}

function StatChip({ chip, idx }) {
  const match = chip.label.match(/[\d,]+/)
  const target = match ? parseInt(match[0].replace(/,/g, ''), 10) : 0
  const value = useCountUp(target)
  const before = match ? chip.label.slice(0, match.index) : chip.label
  const after = match ? chip.label.slice(match.index + match[0].length) : ''
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      animate={chip.pulse ? { opacity: [1, 0.6, 1], y: 0 } : { opacity: 1, y: 0 }}
      transition={chip.pulse ? { y: { delay: idx * 0.08, duration: 0.3 }, opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' } } : { delay: idx * 0.08, duration: 0.3 }}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${chip.tone}`}
    >
      {before}
      {value}
      {after}
    </motion.span>
  )
}

function RevenueTile({ tile, idx }) {
  const value = useCountUp(tile.value)
  const TONE_TEXT = { navy: 'text-navy', emerald: 'text-emerald', amber: 'text-amber', 'alert-red': 'text-alert-red' }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <p className={`text-xl font-bold ${TONE_TEXT[tile.tone]}`}>SAR {value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-slate-500">{tile.label}</p>
    </motion.div>
  )
}

function FunnelValue({ stage, idx }) {
  const value = useCountUp(stage.value)
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-navy">{value.toLocaleString()}</p>
      <p className="text-[11px] text-slate-500">{stage.label}</p>
    </div>
  )
}
