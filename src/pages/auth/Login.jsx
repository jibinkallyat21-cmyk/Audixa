import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../../components/shared/PageTransition'
import AuthLeftPanel from '../../components/shared/AuthLeftPanel'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'
import Footer from '../../components/shared/Footer'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'

const DEMO_ROLES = ROLE_ORDER.map((id) => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

const EASE = [0.16, 1, 0.3, 1]

function FloatingInput({ id, label, type = 'text', value, onChange, trailing }) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0

  return (
    <div className="relative pt-4">
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 origin-left text-[#94A3B8] transition-all duration-150"
        style={
          focused || filled
            ? { top: '-2px', fontSize: '11px', color: focused ? '#E8323C' : '#94A3B8' }
            : { top: '16px', fontSize: '14px' }
        }
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full border-0 border-b border-[#E2E8F0] bg-transparent pb-2 pt-5 text-sm text-[#0D1B2A] outline-none ${
            trailing ? 'pr-12' : ''
          }`}
        />
        {trailing && (
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center">{trailing}</div>
        )}
      </div>
      <div className="relative h-[1px] w-full bg-transparent">
        <motion.div
          className="absolute inset-0 origin-left bg-brand"
          style={{ height: '2px', top: '-0.5px' }}
          initial={false}
          animate={{ scaleX: focused ? 1 : 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        />
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [demoRole, setDemoRole] = useState(DEMO_ROLES[0].value)
  const canGoBack = typeof window !== 'undefined' && window.history.length > 2

  const handleSubmit = (e) => {
    e.preventDefault()
    const role = DEMO_ROLES.find((r) => r.value === demoRole) || DEMO_ROLES[0]
    navigate(role.route)
  }

  const handleEnterDemo = () => {
    const role = DEMO_ROLES.find((r) => r.value === demoRole) || DEMO_ROLES[0]
    navigate(role.route)
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen w-full">
        <AuthLeftPanel />

        <div
          className="relative flex w-full flex-1 flex-col lg:w-[45%]"
          style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)' }}
        >
          {canGoBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="absolute left-6 top-6 text-xs text-[#9CA3AF] transition-colors hover:text-[#0D1B2A] lg:left-12 lg:top-12"
            >
              ← Back
            </button>
          )}

          <div className="flex flex-1 items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-[360px]">
              <div className="mb-8 flex items-center gap-2">
                <AnalytixMark size={24} />
                <span className="text-[14px] font-extrabold tracking-[0.12em] text-[#0D1B2A]">ANALYTIX</span>
              </div>

              <div className="mb-8">
                <h2 className="text-[22px] font-bold leading-tight tracking-tight text-[#0D1B2A]">Welcome back</h2>
                <p className="mt-1 text-sm text-[#525f71]">Sign in to your AUDIXA workspace</p>
              </div>

              <div className="relative mb-8 flex gap-6 border-b border-[#E2E8F0]">
                {[
                  { value: 'client', label: 'Client Portal' },
                  { value: 'team', label: 'Analytix Team' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setAccountType(tab.value)}
                    className="relative pb-3 text-sm transition-colors"
                  >
                    <span
                      className={accountType === tab.value ? 'font-bold text-[#0D1B2A]' : 'font-normal text-[#94A3B8]'}
                    >
                      {tab.label}
                    </span>
                    {accountType === tab.value && (
                      <motion.div
                        layoutId="login-underline"
                        className="absolute -bottom-px left-0 right-0 h-[2px] bg-brand"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <FloatingInput id="email" label="Work Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <FloatingInput
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="cursor-pointer text-[11px] font-semibold text-brand hover:text-[#D12C35] hover:underline"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  }
                />

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-[11px] font-semibold text-brand hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ y: -1, backgroundColor: '#D12C35', boxShadow: '0 4px 16px rgba(232,50,60,0.35)' }}
                  whileTap={{ y: 0, scale: 0.99 }}
                  transition={{ duration: 0.15, ease: EASE }}
                  className="h-11 w-full rounded-md bg-brand text-[13px] font-semibold text-white"
                >
                  Sign In
                </motion.button>
              </form>

              <motion.div
                initial={false}
                animate={
                  accountType === 'team'
                    ? { height: 'auto', opacity: 1, marginTop: 20 }
                    : { height: 0, opacity: 0, marginTop: 0 }
                }
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-[#E2E8F0] pt-4 text-center">
                  <p className="text-sm text-[#525f71]">
                    Need partner access?{' '}
                    <Link to="/signup" className="font-semibold text-brand hover:underline">
                      Create account
                    </Link>
                  </p>
                  <p className="mt-1 text-[11px] text-[#525f71]">Team accounts require Audit Manager approval.</p>
                </div>
              </motion.div>

              <div className="mt-8 border-t border-[#E2E8F0] pt-6">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">Demo Access</p>
                <label htmlFor="demo-role" className="mb-1.5 block text-[11px] font-semibold text-[#525f71]">
                  Preview as Role
                </label>
                <select
                  id="demo-role"
                  value={demoRole}
                  onChange={(e) => setDemoRole(e.target.value)}
                  className="w-full border-0 border-b border-[#E2E8F0] bg-transparent py-2 text-sm text-[#0D1B2A] outline-none focus:border-brand"
                >
                  {DEMO_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>

                <motion.button
                  type="button"
                  onClick={handleEnterDemo}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 h-11 w-full rounded-md bg-brand text-[13px] font-semibold text-white shadow-sm shadow-brand/20"
                >
                  Enter Demo
                </motion.button>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </PageTransition>
  )
}
