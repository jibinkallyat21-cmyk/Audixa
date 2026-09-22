import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Check, ArrowLeft } from 'lucide-react'
import PageTransition from '../../components/shared/PageTransition'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'

const STEPS = [
  { label: 'Request Submitted', state: 'completed' },
  { label: 'Manager Review', state: 'active' },
  { label: 'Account Activated', state: 'pending' },
]

const STEP_STYLES = {
  completed: { dot: 'bg-emerald-50 text-emerald-600 border border-emerald-200', label: 'text-[#0D1B2A]' },
  active: { dot: 'bg-brand/10 text-brand border border-brand/30 animate-pulse', label: 'text-brand' },
  pending: { dot: 'bg-slate-100 text-slate-400 border border-slate-200', label: 'text-slate-400' },
}

const CARD_SHADOW = {
  boxShadow:
    'rgba(0, 0, 0, 0.04) 0px 2px 4px, rgba(0, 0, 0, 0.08) 0px 8px 24px, rgba(0, 0, 0, 0.06) 0px 24px 48px, rgba(255, 255, 255, 0.9) 0px 1px 0px inset',
}

export default function Pending() {
  return (
    <PageTransition>
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-[500px] rounded-xl border border-slate-200 bg-white/95 p-8 text-center backdrop-blur-md sm:p-10"
          style={CARD_SHADOW}
        >
          <div className="mb-7 flex flex-col items-center justify-center">
            <div className="flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-1">
              <AnalytixMark size={22} />
            </div>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-[#525f71]">
              Enterprise Audit Suite
            </span>
          </div>

          <div className="relative mx-auto mb-7 flex h-20 w-20 items-center justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/10"
              style={{ boxShadow: 'rgba(232, 50, 60, 0.12) 0px 0px 18px' }}
            >
              <Clock className="h-9 w-9 text-brand" />
            </div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 14 }}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand shadow-md"
            >
              <Check className="h-4 w-4 text-white" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-[28px] font-bold leading-9 tracking-tight text-[#1B2A4A]"
          >
            Request Submitted
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mx-auto mt-3 max-w-[390px] text-sm leading-relaxed text-[#525f71]"
          >
            Your account request has been submitted and is awaiting Audit Manager approval. You
            will be notified by email once your access is activated.
          </motion.p>

          <div
            className="mt-6 space-y-3.5 rounded-xl border border-amber-400/30 bg-amber-50/30 p-4 text-left"
          >
            {STEPS.map((step, idx) => {
              const style = STEP_STYLES[step.state]
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${style.dot}`}>
                    {step.state === 'completed' ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-sm font-semibold ${style.label}`}>{step.label}</span>
                </div>
              )
            })}
          </div>

          <Link to="/login">
            <motion.button
              type="button"
              whileHover={{ y: -1, boxShadow: '0 12px 24px -8px rgba(232, 50, 60,0.45)' }}
              whileTap={{ scale: 0.98 }}
              className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white shadow-md shadow-brand/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </motion.button>
          </Link>
        </motion.div>

        <p className="mt-6 text-xs text-[#525f71]">
          AUDIXA by Analytix — © 2026 Analytix. All rights reserved.
        </p>
      </div>
    </PageTransition>
  )
}
