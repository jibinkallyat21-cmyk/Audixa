import { motion } from 'framer-motion'

function getScore(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password) && /\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

function getLevel(score) {
  if (score <= 1) return { label: 'Weak', width: '30%', color: '#ef4444' }
  if (score <= 3) return { label: 'Moderate', width: '65%', color: '#D97706' }
  return { label: 'Strong', width: '100%', color: '#059669' }
}

export default function PasswordStrengthBar({ password }) {
  if (!password) return null

  const level = getLevel(getScore(password))

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500">Password Strength:</span>
        <span className="text-[11px] font-semibold" style={{ color: level.color }}>
          {level.label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: level.color }}
          animate={{ width: level.width }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
