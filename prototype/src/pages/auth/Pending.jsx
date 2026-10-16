import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Check, ArrowLeft } from 'lucide-react'
import PageTransition from '../../components/shared/PageTransition'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'

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

        <div className="mt-5 grid w-full max-w-[500px] grid-cols-1 items-start gap-3 md:grid-cols-12 md:gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-4">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
              <Check className="h-3 w-3" /> Request Submitted
            </span>
            <p className="mt-2 text-[11px] text-slate-400">05 Nov 2024, 09:14 AM</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-4">
            <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
              <Clock className="h-3 w-3" /> Manager Review
            </span>
            <p className="mt-2 text-[11px] text-slate-400">Usually within 24 hours.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-4">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
              Account Activated
            </span>
            <p className="mt-2 text-[11px] text-slate-400">Email notification sent.</p>
          </div>
        </div>

        <p className="mt-6 text-xs text-[#525f71]">
          AUDIT 360 by Analytix — © 2026 Analytix. All rights reserved.
        </p>
      </div>
    </PageTransition>
  )
}
