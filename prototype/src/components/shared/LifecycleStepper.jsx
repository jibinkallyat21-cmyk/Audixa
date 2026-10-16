import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

// Generic engagement-lifecycle stepper. Logic adapted from the Audit360
// console's lifecycleBar()/engDone() pattern: every stage is pre-classified
// as 'completed' | 'active' | 'upcoming' (see getLifecycleStages() in
// sampleData.js) and this component only renders that classification — it
// never re-derives status itself, so the same component works for the
// client-facing 6-stage engagement tracker and the internal 8-stage
// lead-to-execution lifecycle alike.

const LABEL_STYLE = {
  completed: 'text-[#0D1B2A] font-medium',
  active: 'text-brand font-semibold',
  upcoming: 'text-slate-400',
}

export default function LifecycleStepper({ stages }) {
  const activeIndex = stages.findIndex((s) => s.status === 'active')
  const lastCompletedIndex = (() => {
    let idx = -1
    stages.forEach((s, i) => {
      if (s.status === 'completed') idx = i
    })
    return idx
  })()
  const progressIndex = activeIndex >= 0 ? activeIndex : lastCompletedIndex
  const progressPercent = stages.length > 1 ? (Math.max(progressIndex, 0) / (stages.length - 1)) * 100 : 0

  return (
    <div className="relative flex justify-between px-2">
      <svg className="absolute left-0 top-5 h-1 w-full overflow-visible" preserveAspectRatio="none">
        <line x1="0" y1="2" x2="100%" y2="2" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        <motion.line
          x1="0"
          y1="2"
          x2={`${progressPercent}%`}
          y2="2"
          stroke="#059669"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </svg>

      {stages.map((stage, idx) => (
        <div key={stage.id} className="relative z-10 flex w-full flex-col items-center">
          {stage.status === 'completed' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 14, delay: idx * 0.1 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald text-white"
              style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.3)' }}
            >
              <Check className="h-5 w-5" />
            </motion.div>
          )}

          {stage.status === 'active' && (
            <div className="relative flex h-10 w-10 items-center justify-center">
              <motion.div
                className="absolute h-10 w-10 rounded-full"
                animate={{
                  boxShadow: [
                    '0 0 0 4px rgba(232,50,60,0.15), 0 0 0 8px rgba(232,50,60,0.08)',
                    '0 0 0 6px rgba(232,50,60,0.08), 0 0 0 12px rgba(232,50,60,0.03)',
                    '0 0 0 4px rgba(232,50,60,0.15), 0 0 0 8px rgba(232,50,60,0.08)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"
                style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.3)' }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
              </div>
            </div>
          )}

          {stage.status === 'upcoming' && (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 text-slate-400"
              style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <span className="text-xs font-semibold">{idx + 1}</span>
            </div>
          )}

          <span className={`mt-2 text-center text-[11px] leading-tight ${LABEL_STYLE[stage.status]}`}>
            {stage.label}
          </span>

          {/* Optional reference chip — only ever shown once this stage is
              completed (e.g. the Filed stage's Qawaem filing reference). */}
          {stage.status === 'completed' && stage.qawaemRef && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.25 }}
              className="mt-1 rounded-full border border-teal-300 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700"
            >
              {stage.qawaemRef}
            </motion.span>
          )}
        </div>
      ))}
    </div>
  )
}
