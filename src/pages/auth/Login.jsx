import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../../components/shared/PageTransition'
import AuthLeftPanel from '../../components/shared/AuthLeftPanel'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'
import PasswordField from '../../components/shared/PasswordField'
import Footer from '../../components/shared/Footer'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'

// Demo Role options are derived from the ROLES registry (single source of
// truth for role -> label/route), adapted from the Audit360 console's
// `roles` keyed-object + `role` switch-state pattern — switching role there
// reconfigures the whole app's nav/labels from one place; here it picks
// which dashboard the demo lands on.
const DEMO_ROLES = ROLE_ORDER.map((id) => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

const CARD_SHADOW = {
  boxShadow:
    'rgba(0, 0, 0, 0.04) 0px 2px 4px, rgba(0, 0, 0, 0.08) 0px 8px 24px, rgba(0, 0, 0, 0.06) 0px 24px 48px, rgba(255, 255, 255, 0.9) 0px 1px 0px inset',
}

export default function Login() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [demoRole, setDemoRole] = useState(DEMO_ROLES[0].value)

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
      <div className="flex min-h-screen w-full bg-background">
        <AuthLeftPanel />

        <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-1/2 lg:p-16">
          <div
            className="w-full max-w-[440px] rounded-xl border border-slate-200 bg-white p-8 transition-shadow duration-300 hover:shadow-xl hover:shadow-[#0D1B2A]/5 md:p-10"
            style={CARD_SHADOW}
          >
            <div className="mb-6 flex justify-center">
              <div className="flex items-center justify-center rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm">
                <AnalytixMark size={28} />
              </div>
            </div>

            <div className="mb-7 text-center">
              <h2 className="text-[28px] font-bold leading-9 tracking-tight text-[#1B2A4A]">
                Welcome Back
              </h2>
              <p className="mt-1 text-sm text-[#525f71]">Sign in to your AUDIXA workspace</p>
            </div>

            <div className="relative mb-6 grid grid-cols-2 rounded-lg border border-slate-200 bg-[#f2f4f6] p-1">
              {[
                { value: 'client', label: 'Client Portal' },
                { value: 'team', label: 'Analytix Team' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setAccountType(tab.value)}
                  className="relative rounded-md py-2 text-sm font-semibold transition-colors"
                >
                  {accountType === tab.value && (
                    <motion.div
                      layoutId="login-tab-indicator"
                      className="absolute inset-0 rounded-md bg-brand-red shadow-sm"
                      style={{
                        boxShadow:
                          'rgba(232, 50, 60, 0.25) 0px 2px 6px, rgba(255, 255, 255, 0.2) 0px 1px 0px inset',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span
                    className={`relative ${accountType === tab.value ? 'text-white' : 'text-[#525f71] hover:text-[#1B2A4A]'}`}
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#525f71]"
                >
                  Work Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0D1B2A] outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/20"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-semibold uppercase tracking-wide text-[#525f71]"
                  >
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-[11px] font-semibold text-brand-red hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <PasswordField
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ y: -1, boxShadow: '0 12px 24px -8px rgba(232,50,60,0.45)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-red/20 transition-shadow"
              >
                Sign In
              </motion.button>
            </form>

            <motion.div
              initial={false}
              animate={
                accountType === 'team'
                  ? { height: 'auto', opacity: 1, marginTop: 16 }
                  : { height: 0, opacity: 0, marginTop: 0 }
              }
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-100 pt-3 text-center">
                <p className="text-sm text-[#525f71]">
                  Need partner access?{' '}
                  <Link to="/signup" className="font-semibold text-brand-red hover:underline">
                    Create account
                  </Link>
                </p>
                <p className="mt-1 text-[11px] text-[#525f71]">
                  Team accounts require Audit Manager approval.
                </p>
              </div>
            </motion.div>

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <p className="text-sm text-[#525f71]">
                Need help?{' '}
                <span className="cursor-pointer font-medium text-[#525f71] underline transition-colors hover:text-[#1B2A4A]">
                  Contact support
                </span>
              </p>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Demo Access
              </p>
              <label
                htmlFor="demo-role"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#525f71]"
              >
                Preview as Role
              </label>
              <select
                id="demo-role"
                value={demoRole}
                onChange={(e) => setDemoRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0D1B2A] outline-none transition-all duration-150 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/20"
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
                className="mt-3 w-full rounded-lg bg-brand-red py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-red/20"
              >
                Enter Demo
              </motion.button>
            </div>
          </div>
          <div className="mt-6 w-full max-w-[440px]">
            <Footer />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
