import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'
import WorldMapBg from '../../components/shared/WorldMapBg'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'

const DEMO_ROLES = ROLE_ORDER.map(id => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

const IconEnvelope = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
  </svg>
)
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
)
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)
const IconLogin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
)
const IconChevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.65)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [demoRole, setDemoRole] = useState(DEMO_ROLES[0].value)
  const [error, setError] = useState('')
  const stageRef = useRef(null)

  const handleMouseMove = useCallback(e => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    stage.style.setProperty('--px', String((e.clientX - rect.left) / rect.width - 0.5))
    stage.style.setProperty('--py', String((e.clientY - rect.top) / rect.height - 0.5))
  }, [])

  const doSignIn = () => {
    if (!email.trim() || !password) { setError('Please enter your work email and password.'); return }
    setError('')
    const role = DEMO_ROLES.find(r => r.value === demoRole) || DEMO_ROLES[0]
    navigate(role.route)
  }

  const handleEnterDemo = () => {
    const role = DEMO_ROLES.find(r => r.value === demoRole) || DEMO_ROLES[0]
    navigate(role.route)
  }

  const inp = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(80,120,200,0.28)',
    borderRadius: 8,
    padding: 'clamp(7px,0.85vw,11px) 12px clamp(7px,0.85vw,11px) 40px',
    color: '#e8f0fc',
    fontSize: 'clamp(10px,0.95vw,13px)',
    fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    caretColor: '#4a9eff',
    transition: 'border-color 0.18s, background 0.18s',
  }
  const lbl = {
    fontSize: 'clamp(9px,0.82vw,11.5px)',
    color: 'rgba(170,200,235,0.82)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
    display: 'block',
    marginBottom: 4,
    letterSpacing: '0.03em',
  }
  const iconWrap = {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', display: 'flex', alignItems: 'center',
  }
  const onFocus = e => { e.target.style.borderColor = 'rgba(80,130,220,0.55)'; e.target.style.background = 'rgba(255,255,255,0.09)' }
  const onBlur  = e => { e.target.style.borderColor = 'rgba(80,120,200,0.28)'; e.target.style.background = 'rgba(255,255,255,0.06)' }

  return (
    <PageTransition>
      <div
        style={{ width: '100vw', height: '100vh', display: 'grid', placeItems: 'center', overflow: 'hidden', background: '#020b16' }}
        onMouseMove={handleMouseMove}
      >
        {/* Stage: fixed 1600×840 aspect ratio, scales to viewport */}
        <section
          ref={stageRef}
          style={{ position: 'relative', width: 'min(100vw, calc(100vh * 1600/840))', aspectRatio: '1600/840', maxHeight: '100vh', overflow: 'hidden' }}
        >
          {/* Radial background gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 85%, rgba(15,60,95,0.28) 0%, transparent 55%), linear-gradient(180deg,#020a14 0%,#071827 48%,#030c17 100%)',
          }} />

          {/* Atmospheric overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 40%, rgba(35,91,135,0.11), transparent 55%), radial-gradient(ellipse at 10% 50%, rgba(20,60,95,0.09), transparent 45%), radial-gradient(ellipse at 90% 55%, rgba(20,60,95,0.09), transparent 45%)',
          }} />

          {/* D3 World Map */}
          <WorldMapBg style={{ transform: 'translate(calc(var(--px,0)*-4px),calc(var(--py,0)*-4px))', transition: 'transform 0.14s ease-out' }} />

          {/* Bottom glow */}
          <div style={{
            position: 'absolute', left: '-5%', right: '-5%', bottom: '-15%', height: '40%',
            background: 'radial-gradient(ellipse at center, rgba(26,81,122,0.22), transparent 65%)',
            filter: 'blur(14px)', pointerEvents: 'none',
          }} />

          {/* HEADER — centered on map */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: '35%',
            paddingTop: 'clamp(18px,2.8vh,32px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            pointerEvents: 'none',
            transform: 'translate(calc(var(--px,0)*2px),calc(var(--py,0)*2px))',
            transition: 'transform 0.18s ease-out',
            zIndex: 10,
          }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
              <div style={{
                width: 30, height: 38,
                background: '#ef233c',
                clipPath: 'polygon(50% 0%,100% 22%,82% 100%,50% 83%,18% 100%,0% 22%)',
                filter: 'drop-shadow(0 0 8px rgba(239,35,60,0.3))',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 'clamp(15px,1.5vw,22px)', fontWeight: 600, letterSpacing: '0.28em', color: '#f2f5f8', fontFamily: 'Inter, system-ui, sans-serif' }}>
                ANALYTIX
              </span>
            </div>
            {/* Title */}
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(38px,5.5vw,86px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 0.92,
              color: '#fff',
              fontFamily: 'Inter, system-ui, sans-serif',
              textShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              AUDIT <span style={{ color: '#ef233c' }}>360</span>
            </h1>
            {/* Tagline */}
            <p style={{
              marginTop: 'clamp(10px,1.4vh,18px)',
              fontSize: 'clamp(10px,1vw,15px)',
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: 'rgba(216,224,232,0.85)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              Intelligent Audits
              <span style={{ color: '#ef233c', margin: '0 14px', fontWeight: 700 }}>|</span>
              Seamless Engagements
              <span style={{ color: '#ef233c', margin: '0 14px', fontWeight: 700 }}>|</span>
              Trusted Outcomes
            </p>
          </div>

          {/* ── LOGIN CARD ── */}
          <div style={{
            position: 'absolute',
            right: '2%',
            top: '4%',
            bottom: '4%',
            width: '33%',
            background: 'rgba(3, 9, 24, 0.44)',
            border: '1px solid rgba(75, 120, 210, 0.22)',
            borderRadius: 'clamp(8px,0.9vw,14px)',
            backdropFilter: 'blur(16px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
            boxShadow: '0 4px 40px rgba(0,0,20,0.4), inset 0 1px 0 rgba(255,255,255,0.055)',
            display: 'flex',
            flexDirection: 'column',
            padding: 'clamp(14px,1.9vw,26px)',
            gap: 'clamp(6px,0.8vw,11px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            zIndex: 20,
            transform: 'translate(calc(var(--px,0)*3px),calc(var(--py,0)*3px))',
            transition: 'transform 0.18s ease-out',
          }}>

            {/* Header */}
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(15px,1.9vw,27px)', fontWeight: 800, color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.15 }}>
                Welcome back
              </h2>
              <p style={{ margin: 'clamp(2px,0.35vw,5px) 0 0', fontSize: 'clamp(9px,0.82vw,12px)', color: 'rgba(175,200,240,0.72)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                Sign in to your AUDIT 360 workspace
              </p>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid rgba(65,105,200,0.20)', display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {[{ key: 'client', label: 'Client Portal' }, { key: 'team', label: 'Analytix Team' }].map((tab, i) => (
                <span key={tab.key} style={{ display: 'contents' }}>
                  {i === 1 && <span style={{ color: 'rgba(90,120,180,0.35)', fontSize: 'clamp(10px,0.95vw,13px)', paddingBottom: 6, userSelect: 'none' }}>|</span>}
                  <button
                    type="button"
                    onClick={() => setAccountType(tab.key)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 'clamp(4px,0.5vw,7px) clamp(4px,0.45vw,6px)',
                      fontSize: 'clamp(10px,0.95vw,13px)',
                      fontWeight: accountType === tab.key ? 700 : 400,
                      color: accountType === tab.key ? '#fff' : 'rgba(150,178,225,0.58)',
                      borderBottom: accountType === tab.key ? '2px solid #e8192c' : '2px solid transparent',
                      marginBottom: -1,
                      fontFamily: 'Inter, system-ui, sans-serif',
                      outline: 'none',
                      transition: 'color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                  </button>
                </span>
              ))}
            </div>

            {/* Work email */}
            <div>
              <label style={lbl}>Work email</label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><IconEnvelope /></span>
                <input type="email" value={email} placeholder="you@analytix.com"
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && doSignIn()}
                  autoComplete="username" style={inp} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={lbl}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><IconLock /></span>
                <input type={showPassword ? 'text' : 'password'} value={password} placeholder="••••••••"
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && doSignIn()}
                  autoComplete="current-password"
                  style={{ ...inp, paddingRight: 'clamp(40px,4vw,56px)' }}
                  onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'clamp(9px,0.85vw,12px)', fontWeight: 600, color: '#e8192c', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: -2 }}>
              <Link to="/forgot-password" style={{ color: '#e8192c', fontSize: 'clamp(9px,0.82vw,11.5px)', fontFamily: 'Inter, system-ui, sans-serif', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            {/* Sign In */}
            <button type="button" onClick={doSignIn}
              style={{
                background: 'linear-gradient(135deg,#ff1f3d 0%,#c8102a 100%)',
                border: 'none', borderRadius: 8,
                padding: 'clamp(9px,1.05vw,13px)',
                color: '#fff', fontWeight: 700,
                fontSize: 'clamp(11px,1.05vw,15px)',
                fontFamily: 'Inter, system-ui, sans-serif',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: '0 4px 18px rgba(232,25,44,0.32)',
                transition: 'opacity 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(232,25,44,0.48)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(232,25,44,0.32)' }}
            >
              <IconArrow /> Sign In
            </button>

            {/* Error */}
            {error && (
              <div role="alert" style={{ background: 'rgba(140,15,25,0.82)', border: '1px solid rgba(255,80,90,0.32)', borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 'clamp(9px,0.82vw,11.5px)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {error}
              </div>
            )}

            {/* Create account — team tab only */}
            {accountType === 'team' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderTop: '1px solid rgba(65,105,200,0.16)', paddingTop: 'clamp(5px,0.7vw,9px)' }}>
                <span style={{ fontSize: 'clamp(9px,0.82vw,11.5px)', color: 'rgba(175,200,240,0.65)', fontFamily: 'Inter, system-ui, sans-serif' }}>New to Analytix Team?</span>
                <Link to="/signup" style={{ fontSize: 'clamp(9px,0.82vw,11.5px)', color: '#e8192c', fontFamily: 'Inter, system-ui, sans-serif', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  Create account
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </Link>
              </div>
            )}

            {/* DEMO ACCESS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 2 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(65,105,200,0.18)' }} />
              <span style={{ fontSize: 'clamp(7px,0.68vw,9.5px)', letterSpacing: '0.14em', color: 'rgba(110,145,205,0.58)', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}>
                DEMO ACCESS
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(65,105,200,0.18)' }} />
            </div>

            {/* Preview as role */}
            <div>
              <label style={lbl}>Preview as role</label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><IconUser /></span>
                <select value={demoRole} onChange={e => setDemoRole(e.target.value)}
                  style={{ ...inp, paddingRight: 'clamp(26px,2.6vw,36px)', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}>
                  {DEMO_ROLES.map(r => <option key={r.value} value={r.value} style={{ background: '#061026', color: '#e8f0fc' }}>{r.label}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><IconChevron /></span>
              </div>
            </div>

            {/* Enter Demo */}
            <button type="button" onClick={handleEnterDemo}
              style={{
                background: 'transparent', border: '1px solid rgba(215,55,75,0.42)', borderRadius: 8,
                padding: 'clamp(9px,1.05vw,13px)',
                color: '#e8f0fc', fontWeight: 600,
                fontSize: 'clamp(11px,1.05vw,15px)',
                fontFamily: 'Inter, system-ui, sans-serif',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(215,55,75,0.08)'; e.currentTarget.style.borderColor = 'rgba(215,55,75,0.65)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(215,55,75,0.42)' }}
            >
              <IconLogin /> Enter Demo
            </button>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
