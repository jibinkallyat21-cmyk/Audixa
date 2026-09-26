import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'

const DEMO_ROLES = ROLE_ORDER.map(id => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

// Country nodes — x/y as % of the 1600×840 stage (equirectangular approximation)
// Used only for canvas particle animation lines
const NODES = [
  { id: 'us', x: 18.5, y: 31.5 },
  { id: 'gb', x: 49.0, y: 19.8 },
  { id: 'fr', x: 50.5, y: 23.2 },
  { id: 'kw', x: 63.0, y: 33.8 },
  { id: 'bh', x: 63.8, y: 35.5 },
  { id: 'sa', x: 61.5, y: 36.8 },
  { id: 'qa', x: 64.2, y: 35.1 },
  { id: 'ae', x: 65.0, y: 37.2 },
  { id: 'om', x: 66.1, y: 39.0 },
  { id: 'in', x: 71.8, y: 39.8 },
  { id: 'cn', x: 79.5, y: 28.8 },
  { id: 'hk', x: 81.8, y: 37.5 },
  { id: 'sg', x: 79.3, y: 49.8 },
]

// Connection lines from Saudi Arabia hub to all other nodes
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

  // Canvas animation — pulsing nodes + traveling particles
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

    // Seed particles along each connection line
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
          speed: 0.00025 + Math.random() * 0.0004,
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

      // Faint connection lines
      ctx.save()
      LINES.forEach(({ from, to }) => {
        const a = NODES.find(n => n.id === from)
        const b = NODES.find(n => n.id === to)
        if (!a || !b) return
        ctx.beginPath()
        ctx.moveTo(a.x / 100 * W, a.y / 100 * H)
        ctx.lineTo(b.x / 100 * W, b.y / 100 * H)
        ctx.strokeStyle = 'rgba(80, 150, 255, 0.10)'
        ctx.lineWidth = 0.7
        ctx.stroke()
      })
      ctx.restore()

      // Traveling particles
      particlesRef.current.forEach(p => {
        p.t += p.speed
        if (p.t > 1) p.t = 0
        const ax = p.from.x / 100 * W, ay = p.from.y / 100 * H
        const bx = p.to.x / 100 * W, by = p.to.y / 100 * H
        const x = ax + (bx - ax) * p.t
        const y = ay + (by - ay) * p.t

        // Glow halo
        const grd = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3)
        grd.addColorStop(0, `rgba(180, 220, 255, ${p.alpha * 0.8})`)
        grd.addColorStop(1, 'rgba(180, 220, 255, 0)')
        ctx.beginPath()
        ctx.arc(x, y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Bright core
        ctx.beginPath()
        ctx.arc(x, y, p.size * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(230, 245, 255, ${p.alpha})`
        ctx.fill()
      })

      // Slow atmospheric scan sweep
      const scanY = (elapsed * 0.03) % (H * 1.6) - H * 0.3
      const sg = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      sg.addColorStop(0, 'rgba(80, 140, 255, 0)')
      sg.addColorStop(0.5, 'rgba(80, 140, 255, 0.025)')
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

  // Parallax on mouse move within the stage
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

  const handleKeyDown = e => {
    if (e.key === 'Enter') doSignIn()
  }

  const handleEnterDemo = () => {
    const role = DEMO_ROLES.find(r => r.value === demoRole) || DEMO_ROLES[0]
    navigate(role.route)
  }

  return (
    <PageTransition>
      {/* ── Viewport ── */}
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          background: '#020817',
        }}
        onMouseMove={handleMouseMove}
      >
        {/* ── Stage — preserves 1600:840 aspect ratio ── */}
        <section
          ref={stageRef}
          style={{
            position: 'relative',
            width: 'min(100vw, calc(100vh * 1600 / 840))',
            aspectRatio: '1600 / 840',
            maxHeight: '100vh',
            overflow: 'hidden',
          }}
        >
          {/* ── Background JPEG — single source of truth ── */}
          <img
            src="/login-bg.jpg"
            alt="AUDIT 360 login background"
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
              display: 'block',
              userSelect: 'none',
              transform: reducedMotion
                ? 'none'
                : 'translate(calc(var(--px,0) * -3px), calc(var(--py,0) * -3px))',
              transition: 'transform 0.12s ease-out',
            }}
          />

          {/* ── Animation canvas layer ── */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              transform: reducedMotion
                ? 'none'
                : 'translate(calc(var(--px,0) * 5px), calc(var(--py,0) * 5px))',
              transition: 'transform 0.18s ease-out',
            }}
          />

          {/* ── LIVE AUDIT NETWORK status indicator ── */}
          <div style={{
            position: 'absolute',
            left: '1.5%',
            bottom: '2.8%',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'rgba(2, 10, 30, 0.68)',
            border: '1px solid rgba(80, 150, 255, 0.18)',
            borderRadius: 20,
            padding: '4px 10px 4px 7px',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#4ade80',
              boxShadow: '0 0 6px #4ade80',
              flexShrink: 0,
              animation: reducedMotion ? 'none' : 'lan-pulse 2.2s ease-in-out infinite',
            }} />
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.10em',
              color: 'rgba(180, 220, 180, 0.92)',
              fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            }}>
              LIVE AUDIT NETWORK
            </span>
            <span style={{
              fontSize: 8,
              fontFamily: '"SF Mono", "Fira Code", monospace',
              color: 'rgba(140, 190, 140, 0.65)',
              letterSpacing: '0.02em',
            }}>
              13 NODES
            </span>
          </div>

          {/* ── Controls overlay — all positioned by % matching the background image ── */}
          <div style={{ position: 'absolute', inset: 0 }}>

            {/* Client Portal tab */}
            <button
              type="button"
              onClick={() => setAccountType('client')}
              aria-label="Client Portal"
              aria-pressed={accountType === 'client'}
              title="Client Portal"
              style={{
                position: 'absolute',
                left: '69.85%', top: '28.25%',
                width: '9.2%', height: '5.3%',
                background: 'transparent',
                border: accountType === 'client' ? '1px solid rgba(120,170,230,0.25)' : '1px solid transparent',
                cursor: 'pointer',
                borderRadius: 4,
                outline: 'none',
              }}
            />

            {/* Analytix Team tab */}
            <button
              type="button"
              onClick={() => setAccountType('team')}
              aria-label="Analytix Team"
              aria-pressed={accountType === 'team'}
              title="Analytix Team"
              style={{
                position: 'absolute',
                left: '80.1%', top: '28.25%',
                width: '9.2%', height: '5.3%',
                background: 'transparent',
                border: accountType === 'team' ? '1px solid rgba(120,170,230,0.25)' : '1px solid transparent',
                cursor: 'pointer',
                borderRadius: 4,
                outline: 'none',
              }}
            />

            {/* Email input */}
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              aria-label="Work email"
              style={{
                position: 'absolute',
                left: '69.875%', top: '39.05%',
                width: '24.75%', height: '5.12%',
                padding: '0 16px 0 58px',
                background: 'transparent',
                border: '1px solid transparent',
                outline: 'none',
                color: '#dbe7f7',
                fontSize: 'clamp(10px, 1.05vw, 15px)',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                caretColor: 'rgba(140, 200, 255, 0.9)',
                transition: 'border-color 0.18s, background 0.18s',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(120, 170, 230, 0.45)'
                e.target.style.background = 'rgba(7, 24, 48, 0.12)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'transparent'
                e.target.style.background = 'transparent'
              }}
            />

            {/* Password input */}
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              aria-label="Password"
              style={{
                position: 'absolute',
                left: '69.875%', top: '50.35%',
                width: '24.75%', height: '5.12%',
                padding: '0 70px 0 58px',
                letterSpacing: showPassword ? 'normal' : '2px',
                background: 'transparent',
                border: '1px solid transparent',
                outline: 'none',
                color: '#dbe7f7',
                fontSize: 'clamp(10px, 1.05vw, 15px)',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                caretColor: 'rgba(140, 200, 255, 0.9)',
                transition: 'border-color 0.18s, background 0.18s',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(120, 170, 230, 0.45)'
                e.target.style.background = 'rgba(7, 24, 48, 0.12)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'transparent'
                e.target.style.background = 'transparent'
              }}
            />

            {/* Show/hide password toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                left: '90.0%', top: '50.35%',
                width: '4.6%', height: '5.12%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            />

            {/* Forgot password link */}
            <Link
              to="/forgot-password"
              aria-label="Forgot password"
              style={{
                position: 'absolute',
                left: '86.2%', top: '56.5%',
                width: '8.4%', height: '3.0%',
                display: 'block',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            />

            {/* Sign in button */}
            <button
              type="button"
              onClick={doSignIn}
              aria-label="Sign in"
              style={{
                position: 'absolute',
                left: '69.85%', top: '61.55%',
                width: '24.75%', height: '5.95%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                borderRadius: 4,
              }}
            />

            {/* Role selector (demo) */}
            <select
              id="role"
              value={demoRole}
              onChange={e => setDemoRole(e.target.value)}
              aria-label="Preview as role"
              style={{
                position: 'absolute',
                left: '69.85%', top: '77.15%',
                width: '24.75%', height: '5.15%',
                padding: '0 45px 0 55px',
                background: 'transparent',
                border: '1px solid transparent',
                outline: 'none',
                color: 'rgba(0,0,0,0)',
                fontSize: 'clamp(10px, 1.05vw, 15px)',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                transition: 'color 0.15s, background 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.color = '#dbe7f7'
                e.target.style.background = 'rgba(4, 14, 40, 0.88)'
                e.target.style.borderColor = 'rgba(120, 170, 230, 0.35)'
              }}
              onBlur={e => {
                e.target.style.color = 'rgba(0,0,0,0)'
                e.target.style.background = 'transparent'
                e.target.style.borderColor = 'transparent'
              }}
            >
              {DEMO_ROLES.map(r => (
                <option key={r.value} value={r.value} style={{ background: '#071830', color: '#dbe7f7' }}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Enter demo button */}
            <button
              type="button"
              onClick={handleEnterDemo}
              aria-label="Enter demo"
              style={{
                position: 'absolute',
                left: '69.85%', top: '84.45%',
                width: '24.75%', height: '5.15%',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
                borderRadius: 4,
              }}
            />
          </div>

          {/* ── Error overlay ── */}
          {error && (
            <div
              role="alert"
              style={{
                position: 'absolute',
                left: '69.875%',
                top: '68%',
                width: '24.75%',
                background: 'rgba(160, 20, 30, 0.88)',
                border: '1px solid rgba(255, 100, 110, 0.4)',
                borderRadius: 4,
                padding: '4px 8px',
                color: '#fff',
                fontSize: 'clamp(9px, 0.9vw, 12px)',
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                backdropFilter: 'blur(6px)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              {error}
            </div>
          )}
        </section>

        {/* Mobile fallback: if stage is very small, show a minimal vertical layout */}
      </div>

      <style>{`
        @keyframes lan-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #4ade80; }
          50% { opacity: 0.45; box-shadow: 0 0 12px #4ade80; transform: scale(1.3); }
        }
        @media (max-width: 600px) {
          /* On very small screens let the stage scroll */
          div[style*="100vw"][style*="100vh"] {
            overflow: auto !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </PageTransition>
  )
}
