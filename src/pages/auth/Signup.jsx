import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../../components/shared/PageTransition'
import AuthLeftPanel from '../../components/shared/AuthLeftPanel'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'
import PasswordField from '../../components/shared/PasswordField'
import PasswordStrengthBar from '../../components/shared/PasswordStrengthBar'
import Footer from '../../components/shared/Footer'

const ROLE_OPTIONS = [
  'Associate',
  'Audit Lead',
  'Assistant Manager',
  'Audit Manager',
  'Front Office',
  'Management',
]

const CARD_SHADOW = {
  boxShadow:
    'rgba(0, 0, 0, 0.04) 0px 2px 4px, rgba(0, 0, 0, 0.08) 0px 8px 24px, rgba(0, 0, 0, 0.06) 0px 24px 48px, rgba(255, 255, 255, 0.9) 0px 1px 0px inset',
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3, ease: 'easeOut' },
  }),
}

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-600'
const inputClass =
  'w-full h-11 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-lg text-sm text-[#0D1B2A] placeholder-slate-400 hover:border-slate-400 focus:bg-white focus:outline-none focus:border-[#E8323C] focus:ring-2 focus:ring-[#E8323C]/15 transition-all duration-150'

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLE_OPTIONS[0])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/pending')
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen w-full bg-background">
        <AuthLeftPanel />

        <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-1/2 lg:p-12">
          <div
            className="w-full max-w-[460px] rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-9"
            style={CARD_SHADOW}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
                <AnalytixMark size={26} />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 items-start gap-3 md:grid-cols-12 md:gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-8 md:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-[#0D1B2A]">Request Team Access</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#525f71]">
                  Your account will be activated after Audit Manager approval.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-xl bg-navy p-4 text-white md:col-span-4">
                <p className="text-sm font-bold leading-tight">Analytix Fintech International</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
                    ABCPA
                  </span>
                  <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
                    MISCPA
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div custom={0} initial="hidden" animate="visible" variants={fieldVariants}>
                <label htmlFor="fullName" className={labelClass}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sara Al-Qahtani"
                  className={inputClass}
                />
              </motion.div>

              <motion.div custom={1} initial="hidden" animate="visible" variants={fieldVariants}>
                <label htmlFor="signupEmail" className={labelClass}>
                  Work Email
                </label>
                <input
                  id="signupEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sara.alqahtani@analytix.sa"
                  className={inputClass}
                />
              </motion.div>

              <motion.div custom={2} initial="hidden" animate="visible" variants={fieldVariants}>
                <label htmlFor="role" className={labelClass}>
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`${inputClass} cursor-pointer appearance-none`}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </motion.div>

              <motion.div custom={3} initial="hidden" animate="visible" variants={fieldVariants}>
                <PasswordField
                  id="signupPassword"
                  label="Password"
                  uppercaseLabel
                  focusColor="red"
                  placeholder="Enter account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <PasswordStrengthBar password={password} />
              </motion.div>

              <motion.div custom={4} initial="hidden" animate="visible" variants={fieldVariants}>
                <PasswordField
                  id="confirmPassword"
                  label="Confirm Password"
                  uppercaseLabel
                  focusColor="red"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </motion.div>

              <motion.div custom={5} initial="hidden" animate="visible" variants={fieldVariants} className="pt-2">
                <motion.button
                  type="submit"
                  whileHover={{ y: -1, boxShadow: '0 12px 24px -8px rgba(232, 50, 60,0.45)' }}
                  whileTap={{ scale: 0.98 }}
                  className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white shadow-md shadow-brand/20 transition-shadow"
                >
                  Request Account
                </motion.button>
              </motion.div>
            </form>

            <p className="mt-6 text-center text-xs text-[#525f71]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#0D1B2A] hover:text-brand hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          <div className="mt-6 w-full max-w-[460px]">
            <Footer />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
