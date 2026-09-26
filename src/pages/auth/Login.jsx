import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'

const DEMO_ROLES = ROLE_ORDER.map(id => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

const NODES = [
  { id: 'us', x: 18.5, y: 44.0 },
  { id: 'gb', x: 46.5, y: 30.5 },
  { id: 'fr', x: 47.8, y: 36.0 },
  { id: 'kw', x: 57.5, y: 38.5 },
  { id: 'bh', x: 58.5, y: 41.0 },
  { id: 'sa', x: 56.0, y: 43.0 },
  { id: 'qa', x: 59.0, y: 42.0 },
  { id: 'ae', x: 60.0, y: 43.5 },
  { id: 'om', x: 61.0, y: 47.5 },
  { id: 'in', x: 67.0, y: 47.5 },
  { id: 'cn', x: 76.5, y: 33.5 },
  { id: 'hk', x: 79.0, y: 42.5 },
  { id: 'sg', x: 75.5, y: 55.5 },
]

const LINES = NODES.filter(n => n.id !== 'sa').map(n => ({ from: 'sa', to: n.id }))

function useReducedMotion() {
  const [rm, setRm] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const h = e => setRm(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return rm
}

// SVG icons as components
const IconEnvelope = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M2 7l10 7 10-7"/>
  </svg>
)

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="11" rx="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
)

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)

const IconLogin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
)

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const rafRef = useRef(null)
  const particlesRef = useRef([])
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    particlesRef.current = []
    LINES.forEach(({ from, to }) => {
      const a = NODES.find(n => n.id === from)
      const b = NODES.find(n => n.id === to)
      if (!a || !b) return
      const count = 1 + Math.floor(Math.random() * 2)
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          from: a, to: b,
          t: Math.random(),
          speed: 0.00022 + Math.random() * 0.00035,
          alpha: 0.5 + Math.random() * 0.5,
          size: 1.5 + Math.random() * 2,
        })
      }
    })

    let start = null
    const draw = ts => {
      if (!start) start = ts
      const elapsed = ts - start
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      ctx.save()
      LINES.forEach(({ from, to }) => {
        const a = NODES.find(n => n.id === from)
        const b = NODES.find(n => n.id === to)
        if (!a || !b) return
        ctx.beginPath()
        ctx.moveTo(a.x / 100 * W, a.y / 100 * H)
        ctx.lineTo(b.x / 100 * W, b.y / 100 * H)
        ctx.strokeStyle = 'rgba(80, 150, 255, 0.08)'
        ctx.lineWidth = 0.6
        ctx.stroke()
      })
      ctx.restore()

      particlesRef.current.forEach(p => {
        p.t += p.speed
        if (p.t > 1) p.t = 0
        const ax = p.from.x / 100 * W, ay = p.from.y / 100 * H
        const bx = p.to.x / 100 * W, by = p.to.y / 100 * H
        const x = ax + (bx - ax) * p.t
        const y = ay + (by - ay) * p.t

        const grd = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3)
        grd.addColorStop(0, `rgba(180, 220, 255, ${p.alpha * 0.8})`)
        grd.addColorStop(1, 'rgba(180, 220, 255, 0)')
        ctx.beginPath()
        ctx.arc(x, y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, p.size * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(230, 245, 255, ${p.alpha})`
        ctx.fill()
      })

      const scanY = (elapsed * 0.025) % (H * 1.6) - H * 0.3
      const sg = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      sg.addColorStop(0, 'rgba(80, 140, 255, 0)')
      sg.addColorStop(0.5, 'rgba(80, 140, 255, 0.02)')
      sg.addColorStop(1, 'rgba(80, 140, 255, 0)')
      ctx.fillStyle = sg
      ctx.fillRect(0, scanY - 40, W, 80)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [reducedMotion])

  const handleMouseMove = useCallback(e => {
    if (reducedMotion) return
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const cx = (e.clientX - rect.left) / rect.width - 0.5
    const cy = (e.clientY - rect.top) / rect.height - 0.5
    stage.style.setProperty('--px', String(cx))
    stage.style.setProperty('--py', String(cy))
  }, [reducedMotion])

  const doSignIn = () => {
    if (!email.trim() || !password) {
      setError('Please enter your work email and password.')
      return
    }
    setError('')
    const role = DEMO_ROLES.find(r => r.value === demoRole) || DEMO_ROLES[0]
    navigate(role.route)
  }

  const handleKeyDown = e => { if (e.key === 'Enter') doSignIn() }

  const handleEnterDemo = () => {
    const role = DEMO_ROLES.find(r => r.value === demoRole) || DEMO_ROLES[0]
    navigate(role.route)
  }

  const inp = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(80,120,200,0.30)',
    borderRadius: 8,
    padding: 'clamp(7px,0.85vw,11px) 12px clamp(7px,0.85vw,11px) 42px',
    color: '#e8f0fc',
    fontSize: 'clamp(10px,1vw,14px)',
    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    caretColor: '#4a9eff',
    transition: 'border-color 0.18s, background 0.18s',
  }

  const label = {
    fontSize: 'clamp(9px,0.85vw,12px)',
    color: 'rgba(170,200,235,0.85)',
    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    fontWeight: 500,
    display: 'block',
    marginBottom: 5,
  }

  const iconWrap = {
    position: 'absolute',
    left: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
  }

  return (
    <PageTransition>
      <div
        style={{ width: '100vw', height: '100vh', display: 'grid', placeItems: 'center', overflow: 'hidden', background: '#020817' }}
        onMouseMove={handleMouseMove}
      >
        <section
          ref={stageRef}
          style={{ position: 'relative', width: 'min(100vw, calc(100vh * 1600/840))', aspectRatio: '1600/840', maxHeight: '100vh', overflow: 'hidden' }}
        >
          {/* Background */}
          <img
            src="/login-bg.jpg"
            alt="AUDIT 360 world network"
            draggable={false}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              pointerEvents: 'none', userSelect: 'none', display: 'block',
              transform: reducedMotion ? 'none' : 'translate(calc(var(--px,0)*-3px),calc(var(--py,0)*-3px))',
              transition: 'transform 0.12s ease-out',
            }}
          />

          {/* Canvas animation */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
              transform: reducedMotion ? 'none' : 'translate(calc(var(--px,0)*5px),calc(var(--py,0)*5px))',
              transition: 'transform 0.18s ease-out',
            }}
          />

          {/* LIVE AUDIT NETWORK indicator */}
          <div style={{
            position: 'absolute', left: '1.5%', bottom: '2.8%',
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(2,10,30,0.68)', border: '1px solid rgba(80,150,255,0.18)',
            borderRadius: 20, padding: '4px 10px 4px 7px', backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 6px #4ade80', flexShrink: 0,
              animation: reducedMotion ? 'none' : 'lan-pulse 2.2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', color: 'rgba(180,220,180,0.92)', fontFamily: 'system-ui, sans-serif' }}>
              LIVE AUDIT NETWORK
            </span>
            <span style={{ fontSize: 8, fontFamily: 'monospace', color: 'rgba(140,190,140,0.65)', letterSpacing: '0.02em' }}>
              13 NODES
            </span>
          </div>

          {/* ── Login Card ── */}
          <div style={{
            position: 'absolute',
            right: '2.2%',
            top: '4.5%',
            bottom: '4.5%',
            width: '33.5%',
            background: 'rgba(4, 10, 28, 0.42)',
            border: '1px solid rgba(80, 130, 220, 0.22)',
            borderRadius: 'clamp(8px,0.9vw,14px)',
            backdropFilter: 'blur(14px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(14px) saturate(1.4)',
            boxShadow: '0 4px 32px rgba(0,0,20,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            padding: 'clamp(14px,2vw,26px)',
            gap: 'clamp(7px,0.9vw,13px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}>

            {/* Header */}
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(16px,2.1vw,30px)',
                fontWeight: 800,
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                lineHeight: 1.2,
              }}>
                Welcome back
              </h1>
              <p style={{
                margin: 'clamp(3px,0.4vw,6px) 0 0',
                fontSize: 'clamp(9px,0.9vw,13px)',
                color: 'rgba(175,200,240,0.78)',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                lineHeight: 1.4,
              }}>
                Sign in to your AUDIT 360 workspace
              </p>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid rgba(65,105,200,0.22)', display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {[
                { key: 'client', label: 'Client Portal' },
                { key: 'team',   label: 'Analytix Team' },
              ].map((tab, i) => (
                <>
                  {i === 1 && (
                    <span key="sep" style={{ color: 'rgba(90,120,180,0.38)', fontSize: 'clamp(10px,1vw,14px)', paddingBottom: 'clamp(4px,0.55vw,8px)', userSelect: 'none' }}>|</span>
                  )}
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAccountType(tab.key)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: `clamp(4px,0.55vw,7px) clamp(4px,0.5vw,7px)`,
                      fontSize: 'clamp(10px,1vw,14px)',
                      fontWeight: accountType === tab.key ? 700 : 400,
                      color: accountType === tab.key ? '#ffffff' : 'rgba(155,182,228,0.62)',
                      borderBottom: accountType === tab.key ? '2px solid #e8192c' : '2px solid transparent',
                      marginBottom: -1,
                      fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                      outline: 'none',
                      transition: 'color 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.label}
                  </button>
                </>
              ))}
            </div>

            {/* Work email */}
            <div>
              <label style={label}>Work email</label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><IconEnvelope /></span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="you@analytix.com"
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={handleKeyDown}
                  autoComplete="username"
                  aria-label="Work email"
                  style={inp}
                  onFocus={e => { e.target.style.borderColor = 'rgba(80,130,220,0.6)'; e.target.style.background = 'rgba(255,255,255,0.10)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(80,120,200,0.30)'; e.target.style.background = 'rgba(255,255,255,0.07)' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={label}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><IconLock /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  placeholder="••••••••"
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  aria-label="Password"
                  style={{ ...inp, paddingRight: 'clamp(44px,4.5vw,62px)', letterSpacing: showPassword ? 'normal' : '2px' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(80,130,220,0.6)'; e.target.style.background = 'rgba(255,255,255,0.10)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(80,120,200,0.30)'; e.target.style.background = 'rgba(255,255,255,0.07)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontSize: 'clamp(9px,0.9vw,13px)', fontWeight: 600,
                    color: '#e8192c', fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: -4 }}>
              <Link
                to="/forgot-password"
                style={{
                  color: '#e8192c', fontSize: 'clamp(9px,0.85vw,12px)',
                  fontFamily: 'system-ui, sans-serif', textDecoration: 'none', fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In button */}
            <button
              type="button"
              onClick={doSignIn}
              style={{
                background: 'linear-gradient(135deg, #ff1f3d 0%, #c8102a 100%)',
                border: 'none', borderRadius: 8,
                padding: 'clamp(9px,1.1vw,14px)',
                color: '#ffffff', fontWeight: 700,
                fontSize: 'clamp(11px,1.1vw,16px)',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 18px rgba(232,25,44,0.35)',
                transition: 'opacity 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(232,25,44,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(232,25,44,0.35)' }}
            >
              <IconArrowRight />
              Sign In
            </button>

            {/* Error */}
            {error && (
              <div role="alert" style={{
                background: 'rgba(160,20,30,0.85)', border: '1px solid rgba(255,90,100,0.35)',
                borderRadius: 6, padding: '6px 10px',
                color: '#fff', fontSize: 'clamp(9px,0.85vw,12px)',
                fontFamily: 'system-ui, sans-serif',
              }}>
                {error}
              </div>
            )}

            {/* Create account — Analytix Team only */}
            {accountType === 'team' && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: 'clamp(6px,0.8vw,10px) 0',
                borderTop: '1px solid rgba(65,105,200,0.18)',
              }}>
                <span style={{
                  fontSize: 'clamp(9px,0.85vw,12px)',
                  color: 'rgba(175,200,240,0.7)',
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  New to Analytix Team?
                </span>
                <Link
                  to="/signup"
                  style={{
                    fontSize: 'clamp(9px,0.85vw,12px)',
                    color: '#e8192c',
                    fontFamily: 'system-ui, sans-serif',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  Create account
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </Link>
              </div>
            )}

            {/* DEMO ACCESS divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(65,105,200,0.22)' }} />
              <span style={{
                fontSize: 'clamp(7px,0.72vw,10px)', letterSpacing: '0.14em',
                color: 'rgba(115,148,205,0.62)', fontFamily: 'system-ui, sans-serif', fontWeight: 600,
              }}>
                DEMO ACCESS
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(65,105,200,0.22)' }} />
            </div>

            {/* Preview as role */}
            <div>
              <label style={label}>Preview as role</label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}><IconUser /></span>
                <select
                  id="role"
                  value={demoRole}
                  onChange={e => setDemoRole(e.target.value)}
                  aria-label="Preview as role"
                  style={{
                    ...inp,
                    paddingRight: 'clamp(28px,2.8vw,38px)',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {DEMO_ROLES.map(r => (
                    <option key={r.value} value={r.value} style={{ background: '#061026', color: '#e8f0fc' }}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <IconChevron />
                </span>
              </div>
            </div>

            {/* Enter Demo button */}
            <button
              type="button"
              onClick={handleEnterDemo}
              style={{
                background: 'transparent',
                border: '1px solid rgba(215,55,75,0.45)',
                borderRadius: 8,
                padding: 'clamp(9px,1.1vw,14px)',
                color: '#e8f0fc', fontWeight: 600,
                fontSize: 'clamp(11px,1.1vw,16px)',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(215,55,75,0.08)'; e.currentTarget.style.borderColor = 'rgba(215,55,75,0.7)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(215,55,75,0.45)' }}
            >
              <IconLogin />
              Enter Demo
            </button>
          </div>
        </section>

        <style>{`
          @keyframes lan-pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 6px #4ade80; }
            50% { opacity: 0.45; box-shadow: 0 0 12px #4ade80; transform: scale(1.3); }
          }
          #email::placeholder, #password::placeholder { color: rgba(120,150,200,0.5); letter-spacing: normal; }
          @media (max-width: 600px) {
            div[style*="100vw"][style*="100vh"] { overflow: auto !important; align-items: flex-start !important; }
          }
        `}</style>
      </div>
    </PageTransition>
  )
}
