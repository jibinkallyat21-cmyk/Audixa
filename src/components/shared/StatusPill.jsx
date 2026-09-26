import { motion } from 'framer-motion'
import { Star, Sparkles } from 'lucide-react'

// Exact hex pairs per the AUDIXA status-pill spec (Pass 3). bg/text are inline
// styles rather than Tailwind classes so every screen renders the precise
// signed-off colors regardless of which Tailwind color scale name is closest.
const STATUS_STYLES = {
  Accepted: { bg: '#D1FAE5', text: '#059669' },
  Confirmed: { bg: '#D1FAE5', text: '#059669' },
  Active: { bg: '#D1FAE5', text: '#059669' },
  'On Track': { bg: '#D1FAE5', text: '#059669' },
  Completed: { bg: '#D1FAE5', text: '#059669' },
  Excellent: { bg: '#D1FAE5', text: '#059669', icon: Star },
  'Sent to Client': { bg: '#D1FAE5', text: '#059669' },
  'Signed Captured': { bg: '#D1FAE5', text: '#059669' },

  Rejected: { bg: '#FEE2E2', text: '#DC2626' },
  Critical: { bg: '#FEE2E2', text: '#DC2626' },
  'Tier 3': { bg: '#FEE2E2', text: '#DC2626' },
  Overdue: { bg: '#FEE2E2', text: '#DC2626' },

  Pending: { bg: '#F3F4F6', text: '#6B7280' },
  'Pending Client': { bg: '#F3F4F6', text: '#6B7280' },
  'Not Started': { bg: '#F3F4F6', text: '#6B7280' },

  'Under Review': { bg: '#FEF3C7', text: '#D97706', pulse: true },
  'On Hold': { bg: '#FEF3C7', text: '#D97706' },
  'Awaiting Approval': { bg: '#FEF3C7', text: '#D97706' },
  'Awaiting from Auditor': { bg: '#FEF3C7', text: '#D97706' },
  Approaching: { bg: '#FEF3C7', text: '#D97706' },
  'Tier 1': { bg: '#FEF3C7', text: '#D97706' },
  'Needs Attention': { bg: '#FEF3C7', text: '#D97706' },
  'In Progress': { bg: '#FEF3C7', text: '#D97706' },
  'Action Required': { bg: '#FEF3C7', text: '#D97706' },

  'Uploaded Processing': { bg: '#DBEAFE', text: '#2563EB', pulse: true },
  'With Reviewer': { bg: '#DBEAFE', text: '#2563EB' },
  'Received Ready to Forward': { bg: '#DBEAFE', text: '#2563EB' },
  Answered: { bg: '#DBEAFE', text: '#2563EB' },

  Parked: { bg: '#EDE9FE', text: '#7C3AED' },

  'Forwarded Awaiting Signature': { bg: '#FEF9C3', text: '#CA8A04' },

  Open: { bg: '#FEF3C7', text: '#D97706' },
  Closed: { bg: '#D1FAE5', text: '#059669' },

  'AI Verified': { bg: '#FEF3C7', text: '#D97706', border: '#D97706', icon: Sparkles },
  'Odoo Generated': { bg: '#CCFBF1', text: '#0F766E' },
}

const BADGE_STYLES = {
  URGENT: { bg: '#DC2626', text: '#FFFFFF' },
  HIGH: { bg: '#D97706', text: '#FFFFFF' },
  NORMAL: { bg: '#6B7280', text: '#FFFFFF' },
}

export default function StatusPill({ status, type }) {
  if (BADGE_STYLES[status]) {
    const b = BADGE_STYLES[status]
    return (
      <span
        data-type={type}
        style={{ backgroundColor: b.bg, color: b.text }}
        className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap min-w-[9rem]"
      >
        {status}
      </span>
    )
  }

  const style = STATUS_STYLES[status] || STATUS_STYLES.Pending
  const Icon = style.icon

  return (
    <motion.span
      data-type={type}
      initial={style.pulse ? false : { opacity: 0, scale: 0.9 }}
      animate={style.pulse ? { opacity: [0.8, 1, 0.8] } : { opacity: 1, scale: 1 }}
      transition={style.pulse ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: style.border ? `1px solid ${style.border}` : undefined,
      }}
      className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap min-w-[9rem]"
    >
      {Icon ? <Icon className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {status}
    </motion.span>
  )
}
