import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../../components/shared/PageTransition'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'
import { useTheme } from '../../context/ThemeContext'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'

const DEMO_ROLES = ROLE_ORDER.map((id) => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

const EASE = [0.16, 1, 0.3, 1]

function FloatingInput({ id, label, type = 'text', value, onChange, trailing, isDark }) {
  const [focused, setFocused] = useState(false)
  const filled = value.length > 0
  const labelColor = focused
    ? '#E8323C'
    : isDark
      ? (focused || filled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.35)')
      : (focused || filled ? '#475569' : '#94A3B8')

  return (
    <div className="relative pt-4">
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-0 origin-left transition-all duration-150"
        style={
          focused || filled
            ? { top: '-2px', fontSize: '11px', color: labelColor }
            : { top: '16px', fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8' }
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
          className="w-full border-0 border-b bg-transparent pb-2 pt-5 text-sm outline-none"
          style={{
            borderColor: focused ? '#E8323C' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            caretColor: '#E8323C',
            color: isDark ? '#fff' : '#0D1B2A',
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

function Background({ isDark }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #E8323C 0%, transparent 70%)' }} />
      <div className="absolute -bottom-48 right-0 h-[600px] w-[600px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-lg" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none"
              stroke={isDark ? 'white' : '#0D1B2A'} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-lg)" />
      </svg>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [accountType, setAccountType] = useState('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [demoRole, setDemoRole] = useState(DEMO_ROLES[0].value)
  const canGoBack = typeof window !== 'undefined' && window.history.length > 2

  const bgPage    = isDark ? '#080C18' : '#F0F4F8'
  const bgPanel   = isDark ? 'linear-gradient(135deg, #0D1B2A 0%, #080C18 100%)' : 'linear-gradient(135deg, #EEF2F8 0%, #E2E8F0 100%)'
  const textPrimary   = isDark ? '#FFFFFF' : '#0D1B2A'
  const textSecondary = isDark ? 'rgba(255,255,255,0.4)' : '#64748B'
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

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
      <div className="flex min-h-screen w-full transition-colors duration-300" style={{ background: bgPage }}>

        {/* ── Left brand panel ── */}
        <div
          className="relative hidden min-h-screen w-[52%] flex-col overflow-hidden lg:flex"
          style={{ background: bgPanel }}
        >
          <Background isDark={isDark} />
          <div className="relative z-10 flex flex-1 flex-col items-start justify-center px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              {/* Logo mark + brand name */}
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  whileHover={{ scale: 1.08, rotateY: 8 }}
                  transition={{ duration: 0.3 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <AnalytixMark size={44} />
                </motion.div>
                <div>
                  <p className="text-2xl font-black tracking-[0.12em]" style={{ color: textPrimary }}>
                    AUDIT <span className="text-brand">360</span>
                  </p>
                  <p className="text-[11px] tracking-widest" style={{ color: textSecondary }}>by Analytix</p>
                </div>
              </div>

              <h2 className="text-[38px] font-black leading-tight tracking-tight" style={{ color: textPrimary }}>
                Audit. Manage.<br />
                <span style={{ color: '#E8323C' }}>Deliver.</span>
              </h2>
              <p className="mt-4 max-w-[320px] text-sm leading-relaxed" style={{ color: textSecondary }}>
                The unified intelligence platform for audit firms — from engagement to sign-off.
              </p>

              <div className="mt-10 space-y-3">
                {[
                  'AI-verified document processing',
                  'Real-time engagement tracking',
                  'Seamless client collaboration',
                ].map((item) => (
                  <motion.div
                    key={item}
                    className="flex items-center gap-3"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span className="text-sm" style={{ color: textSecondary }}>{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
          <p className="relative z-10 px-16 pb-8 text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.25)' }}>
            © 2026 Analytix. All rights reserved.
          </p>
        </div>

        {/* ── Right login panel ── */}
        <div className="relative flex w-full flex-1 flex-col transition-colors duration-300" style={{ background: bgPage }}>
          <Background isDark={isDark} />

          {canGoBack && (
            <button type="button" onClick={() => navigate(-1)}
              className="absolute left-6 top-6 z-10 text-xs transition-colors hover:opacity-100 lg:left-12 lg:top-12"
              style={{ color: textSecondary }}>
              ← Back
            </button>
          )}

          <div className="relative z-10 flex flex-1 items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-[360px]">

              {/* Mobile logo */}
              <div className="mb-8 flex items-center gap-2 lg:hidden">
                <AnalytixMark size={24} />
                <span className="text-sm font-extrabold tracking-[0.12em]" style={{ color: textPrimary }}>
                  AUDIT <span className="text-brand">360</span>
                </span>
              </div>

              <div className="mb-8">
                <h2 className="text-[22px] font-bold leading-tight tracking-tight" style={{ color: textPrimary }}>
                  Welcome back
                </h2>
                <p className="mt-1 text-sm" style={{ color: textSecondary }}>
                  Sign in to your AUDIT 360 workspace
                </p>
              </div>

              {/* Account type tabs */}
              <div className="relative mb-8 flex gap-6" style={{ borderBottom: `1px solid ${border}` }}>
                {[
                  { value: 'client', label: 'Client Portal' },
                  { value: 'team', label: 'Analytix Team' },
                ].map((tab) => (
                  <button key={tab.value} type="button" onClick={() => setAccountType(tab.value)}
                    className="relative pb-3 text-sm transition-colors">
                    <span style={{
                      color: accountType === tab.value ? textPrimary : textSecondary,
                      fontWeight: accountType === tab.value ? 700 : 400,
                    }}>
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
                <FloatingInput isDark={isDark} id="email" label="Work Email" type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
                <FloatingInput isDark={isDark} id="password" label="Password"
                  type={showPassword ? 'text' : 'password'}
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
                <div className="pt-4 text-center" style={{ borderTop: `1px solid ${border}` }}>
                  <p className="text-sm" style={{ color: textSecondary }}>
                    Need partner access?{' '}
                    <Link to="/signup" className="font-semibold text-brand hover:underline">Create account</Link>
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,0.25)' : '#94A3B8' }}>
                    Team accounts require Audit Manager approval.
                  </p>
                </div>
              </motion.div>

              {/* Demo access */}
              <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${border}` }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: isDark ? 'rgba(255,255,255,0.25)' : '#94A3B8' }}>
                  Demo Access
                </p>
                <label htmlFor="demo-role" className="mb-1.5 block text-[11px] font-semibold"
                  style={{ color: textSecondary }}>
                  Preview as Role
                </label>
                <select id="demo-role" value={demoRole} onChange={(e) => setDemoRole(e.target.value)}
                  className="w-full border-0 py-2 text-sm outline-none"
                  style={{
                    background: 'transparent',
                    borderBottom: `1px solid ${border}`,
                    color: textPrimary,
                  }}>
                  {DEMO_ROLES.map((role) => (
                    <option key={role.value} value={role.value}
                      style={{ background: isDark ? '#0D1B2A' : '#fff', color: isDark ? '#fff' : '#0D1B2A' }}>
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
