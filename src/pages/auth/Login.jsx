import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../../components/shared/PageTransition'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'
import ThemeToggle from '../../components/shared/ThemeToggle'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'

const DEMO_ROLES = ROLE_ORDER.map((id) => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

const EASE = [0.16, 1, 0.3, 1]

/* Floating label input — dark themed */
function FloatingInput({ id, label, type = 'text', value, onChange, trailing }) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0
  return (
    <div className="relative pt-4">
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 origin-left transition-all duration-150"
        style={
          focused || filled
            ? { top: '-2px', fontSize: '11px', color: focused ? '#E8323C' : 'rgba(255,255,255,0.4)' }
            : { top: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.35)' }
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
          className="w-full border-0 border-b bg-transparent pb-2 pt-5 text-sm text-white outline-none"
          style={{
            borderColor: focused ? '#E8323C' : 'rgba(255,255,255,0.12)',
            caretColor: '#E8323C',
          }}
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

/* Particle / grid background */
function DarkBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* gradient orbs */}
      <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #E8323C 0%, transparent 70%)' }} />
      <div className="absolute -bottom-48 right-0 h-[600px] w-[600px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />
      {/* subtle grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
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
      <div className="flex min-h-screen w-full" style={{ background: '#080C18' }}>
        {/* ── Left brand panel ── */}
        <div className="relative hidden min-h-screen w-[52%] flex-col overflow-hidden lg:flex"
          style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #080C18 100%)' }}>
          <DarkBackground />

          {/* center content */}
          <div className="relative z-10 flex flex-1 flex-col items-start justify-center px-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
              <div className="flex items-center gap-3 mb-6">
                <AnalytixMark size={36} />
                <div>
                  <p className="text-2xl font-black tracking-[0.12em] text-white">AUDIXA</p>
                  <p className="text-[11px] tracking-widest text-white/30">by Analytix</p>
                </div>
              </div>

              <h2 className="text-[38px] font-black leading-tight tracking-tight text-white">
                Audit. Manage.<br />
                <span style={{ color: '#E8323C' }}>Deliver.</span>
              </h2>
              <p className="mt-4 max-w-[320px] text-sm leading-relaxed text-white/40">
                The unified intelligence platform for audit firms — from engagement to sign-off.
              </p>

              <div className="mt-10 space-y-3">
                {[
                  'AI-verified document processing',
                  'Real-time engagement tracking',
                  'Seamless client collaboration',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span className="text-sm text-white/50">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <p className="relative z-10 px-16 pb-8 text-[11px] text-white/15">© 2026 Analytix. All rights reserved.</p>
        </div>

        {/* ── Right login panel ── */}
        <div className="relative flex w-full flex-1 flex-col" style={{ background: '#080C18' }}>
          <DarkBackground />

          {canGoBack && (
            <button type="button" onClick={() => navigate(-1)}
              className="absolute left-6 top-6 z-10 text-xs text-white/30 transition-colors hover:text-white lg:left-12 lg:top-12">
              ← Back
            </button>
          )}

          <div className="absolute right-6 top-6 z-10 lg:right-12 lg:top-12">
            <ThemeToggle variant="dark" />
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-[360px]">

              {/* Mobile logo */}
              <div className="mb-8 flex items-center gap-2 lg:hidden">
                <AnalytixMark size={24} />
                <span className="text-sm font-extrabold tracking-[0.12em] text-white">AUDIXA</span>
              </div>

              <div className="mb-8">
                <h2 className="text-[22px] font-bold leading-tight tracking-tight text-white">Welcome back</h2>
                <p className="mt-1 text-sm text-white/40">Sign in to your AUDIXA workspace</p>
              </div>

              {/* Account type tabs */}
              <div className="relative mb-8 flex gap-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { value: 'client', label: 'Client Portal' },
                  { value: 'team', label: 'Analytix Team' },
                ].map((tab) => (
                  <button key={tab.value} type="button" onClick={() => setAccountType(tab.value)}
                    className="relative pb-3 text-sm transition-colors">
                    <span className={accountType === tab.value ? 'font-bold text-white' : 'font-normal text-white/35'}>
                      {tab.label}
                    </span>
                    {accountType === tab.value && (
                      <motion.div layoutId="login-underline"
                        className="absolute -bottom-px left-0 right-0 h-[2px] bg-brand"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                    )}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <FloatingInput id="email" label="Work Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <FloatingInput id="password" label="Password" type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  trailing={
                    <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                      className="cursor-pointer text-[11px] font-semibold text-brand hover:text-brand-hover hover:underline">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  }
                />

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-[11px] font-semibold text-brand hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <motion.button type="submit"
                  whileHover={{ y: -1, backgroundColor: '#D12C35', boxShadow: '0 4px 16px rgba(232,50,60,0.35)' }}
                  whileTap={{ y: 0, scale: 0.99 }}
                  transition={{ duration: 0.15, ease: EASE }}
                  className="h-11 w-full rounded-md bg-brand text-[13px] font-semibold text-white">
                  Sign In
                </motion.button>
              </form>

              <motion.div initial={false}
                animate={accountType === 'team'
                  ? { height: 'auto', opacity: 1, marginTop: 20 }
                  : { height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm text-white/40">
                    Need partner access?{' '}
                    <Link to="/signup" className="font-semibold text-brand hover:underline">Create account</Link>
                  </p>
                  <p className="mt-1 text-[11px] text-white/25">Team accounts require Audit Manager approval.</p>
                </div>
              </motion.div>

              {/* Demo access */}
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">Demo Access</p>
                <label htmlFor="demo-role" className="mb-1.5 block text-[11px] font-semibold text-white/40">
                  Preview as Role
                </label>
                <select id="demo-role" value={demoRole} onChange={(e) => setDemoRole(e.target.value)}
                  className="w-full border-0 py-2 text-sm text-white outline-none"
                  style={{ background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                  {DEMO_ROLES.map((role) => (
                    <option key={role.value} value={role.value} style={{ background: '#0D1B2A', color: '#fff' }}>
                      {role.label}
                    </option>
                  ))}
                </select>

                <motion.button type="button" onClick={handleEnterDemo}
                  whileHover={{ y: -1, boxShadow: '0 4px 20px rgba(232,50,60,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 h-11 w-full rounded-md bg-brand text-[13px] font-semibold text-white shadow-sm">
                  Enter Demo
                </motion.button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
