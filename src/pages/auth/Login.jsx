import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../../components/shared/PageTransition'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'
import WorldMapBackground from '../../components/shared/WorldMapBackground'

const DEMO_ROLES = ROLE_ORDER.map((id) => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

const EASE = [0.16, 1, 0.3, 1]

/* ── Boxed input with leading icon ── */
function BoxInput({ id, label, type = 'text', value, onChange, placeholder, icon, trailing }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600,
        color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? '#E8323C' : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 8, padding: '10px 12px',
        transition: 'border-color 0.18s',
      }}>
        {icon && <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0, display: 'flex' }}>{icon}</span>}
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 13, color: '#ffffff',
            caretColor: '#E8323C',
          }}
        />
        {trailing}
      </div>
    </div>
  )
}

/* ── SVG icons ── */
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
)
const IconDemo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
)

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
      <div className="relative min-h-screen w-full overflow-hidden" style={{ background: '#04091e' }}>

        {/* ── Full-screen world map background ── */}
        <div className="absolute inset-0 z-0">
          <WorldMapBackground className="w-full h-full" />
        </div>

        {/* ── Right-side vignette so card is readable ── */}
        <div className="pointer-events-none absolute inset-0 z-1"
          style={{ background: 'linear-gradient(to right, transparent 40%, rgba(4,9,30,0.72) 65%, rgba(4,9,30,0.88) 100%)' }} />

        {/* ── Branding — top-left floating over map ── */}
        <motion.div
          className="pointer-events-none absolute left-8 top-8 z-10 lg:left-12 lg:top-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {/* Logo + ANALYTIX inline */}
          <div className="flex items-center gap-3 mb-4">
            <AnalytixMark size={40} />
            <span style={{
              fontSize: 13, fontWeight: 800, letterSpacing: '0.20em',
              color: 'rgba(255,255,255,0.85)',
            }}>
              ANALYTIX
            </span>
          </div>

          {/* AUDIT 360 */}
          <h1 style={{
            fontSize: 'clamp(52px, 7vw, 96px)',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: '0 4px 32px rgba(0,0,0,0.7)',
            marginBottom: 14,
          }}>
            AUDIT <span style={{ color: '#E8323C' }}>360</span>
          </h1>

          {/* Taglines — single row with separators */}
          <div className="flex items-center gap-3 flex-wrap">
            {['Intelligent Audits', 'Seamless Engagements', 'Trusted Outcomes'].map((phrase, i) => (
              <div key={phrase} className="flex items-center gap-3">
                {i > 0 && (
                  <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.25)', display: 'block' }} />
                )}
                <motion.span
                  style={{
                    fontSize: 'clamp(13px, 1.6vw, 17px)',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.78)',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: EASE }}
                >
                  {phrase}
                </motion.span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Back button ── */}
        {canGoBack && (
          <button type="button" onClick={() => navigate(-1)}
            className="absolute left-8 bottom-8 z-20 text-xs transition-opacity hover:opacity-100"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            ← Back
          </button>
        )}

        {/* ── Login card — right side, vertically centered ── */}
        <div className="absolute inset-y-0 right-0 z-20 flex items-center justify-end pr-6 lg:pr-10 xl:pr-16 w-full sm:w-auto">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: EASE }}
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'rgba(7,11,28,0.88)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '32px 32px 28px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* Heading */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: 6 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)' }}>
                Sign in to your AUDIT 360 workspace
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
              {[
                { value: 'client', label: 'Client Portal' },
                { value: 'team',   label: 'Analytix Team' },
              ].map((tab) => (
                <button key={tab.value} type="button" onClick={() => setAccountType(tab.value)}
                  style={{
                    position: 'relative', paddingBottom: 12, background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 13,
                    fontWeight: accountType === tab.value ? 700 : 400,
                    color: accountType === tab.value ? '#ffffff' : 'rgba(255,255,255,0.38)',
                    transition: 'color 0.18s',
                  }}>
                  {tab.label}
                  {accountType === tab.value && (
                    <motion.div layoutId="login-tab-line"
                      style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: '#E8323C', borderRadius: 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <BoxInput
                id="email" label="Work email" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@analytix.com"
                icon={<IconMail />}
              />
              <BoxInput
                id="password" label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<IconLock />}
                trailing={
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, color: '#E8323C', padding: 0, flexShrink: 0 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                }
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link to="/forgot-password"
                  style={{ fontSize: 11, fontWeight: 600, color: '#E8323C', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <motion.button type="submit"
                whileHover={{ backgroundColor: '#c82831', boxShadow: '0 6px 24px rgba(232,50,60,0.45)', y: -1 }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', height: 44, borderRadius: 8, border: 'none',
                  background: '#E8323C', color: '#ffffff',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(232,50,60,0.30)',
                }}>
                <IconArrow />
                Sign In
              </motion.button>
            </form>

            {/* Team only: signup link */}
            <motion.div
              initial={false}
              animate={accountType === 'team' ? { height: 'auto', opacity: 1, marginTop: 16 } : { height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  Need partner access?{' '}
                  <Link to="/signup" style={{ fontWeight: 700, color: '#E8323C', textDecoration: 'none' }}>
                    Create account
                  </Link>
                </p>
                <p style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>
                  Team accounts require Audit Manager approval.
                </p>
              </div>
            </motion.div>

            {/* Demo access */}
            <div style={{ marginTop: 22, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)', marginBottom: 12,
              }}>
                Demo Access
              </p>

              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.50)', marginBottom: 6 }}>
                Preview as role
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 8, padding: '9px 12px',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0, display: 'flex' }}><IconUser /></span>
                <select value={demoRole} onChange={(e) => setDemoRole(e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 13, color: '#ffffff', cursor: 'pointer',
                    appearance: 'none', WebkitAppearance: 'none',
                  }}>
                  {DEMO_ROLES.map((role) => (
                    <option key={role.value} value={role.value}
                      style={{ background: '#0b1530', color: '#fff' }}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <span style={{ color: 'rgba(255,255,255,0.35)', display: 'flex', pointerEvents: 'none' }}><IconChevron /></span>
              </div>

              <motion.button type="button" onClick={handleEnterDemo}
                whileHover={{ borderColor: 'rgba(255,255,255,0.35)', y: -1 }}
                whileTap={{ scale: 0.98, y: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 12, width: '100%', height: 44, borderRadius: 8, cursor: 'pointer',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600,
                }}>
                <IconDemo />
                Enter Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
