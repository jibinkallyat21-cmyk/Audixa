import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'

const ROLE_OPTIONS = [
  'Associate',
  'Audit Lead',
  'Assistant Manager',
  'Audit Manager',
  'Front Office',
  'Management',
]

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

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const IconEnvelope = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
  </svg>
)
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
)
const IconBriefcase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
)
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(140,170,220,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(ROLE_OPTIONS[0])
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
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
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    particlesRef.current = []
    LINES.forEach(({ from, to }) => {
      const a = NODES.find(n => n.id === from)
      const b = NODES.find(n => n.id === to)
      if (!a || !b) return
      for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
        particlesRef.current.push({ from: a, to: b, t: Math.random(), speed: 0.00022 + Math.random() * 0.00035, alpha: 0.5 + Math.random() * 0.5, size: 1.5 + Math.random() * 2 })
      }
    })
    let start = null
    const draw = ts => {
      if (!start) start = ts
      const elapsed = ts - start
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      LINES.forEach(({ from, to }) => {
        const a = NODES.find(n => n.id === from), b = NODES.find(n => n.id === to)
        if (!a || !b) return
        ctx.beginPath(); ctx.moveTo(a.x / 100 * W, a.y / 100 * H); ctx.lineTo(b.x / 100 * W, b.y / 100 * H)
        ctx.strokeStyle = 'rgba(80,150,255,0.08)'; ctx.lineWidth = 0.6; ctx.stroke()
      })
      particlesRef.current.forEach(p => {
        p.t += p.speed; if (p.t > 1) p.t = 0
        const ax = p.from.x / 100 * W, ay = p.from.y / 100 * H
        const bx = p.to.x / 100 * W, by = p.to.y / 100 * H
        const x = ax + (bx - ax) * p.t, y = ay + (by - ay) * p.t
        const grd = ctx.createRadialGradient(x, y, 0, x, y, p.size * 3)
        grd.addColorStop(0, `rgba(180,220,255,${p.alpha * 0.8})`); grd.addColorStop(1, 'rgba(180,220,255,0)')
        ctx.beginPath(); ctx.arc(x, y, p.size * 3, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill()
        ctx.beginPath(); ctx.arc(x, y, p.size * 0.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(230,245,255,${p.alpha})`; ctx.fill()
      })
      const scanY = (elapsed * 0.025) % (H * 1.6) - H * 0.3
      const sg = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      sg.addColorStop(0, 'rgba(80,140,255,0)'); sg.addColorStop(0.5, 'rgba(80,140,255,0.02)'); sg.addColorStop(1, 'rgba(80,140,255,0)')
      ctx.fillStyle = sg; ctx.fillRect(0, scanY - 40, W, 80)
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect() }
  }, [reducedMotion])

  const handleMouseMove = useCallback(e => {
    if (reducedMotion) return
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    stage.style.setProperty('--px', String((e.clientX - rect.left) / rect.width - 0.5))
    stage.style.setProperty('--py', String((e.clientY - rect.top) / rect.height - 0.5))
  }, [reducedMotion])

  const handleSubmit = e => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password) { setError('Please fill in all required fields.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setError('')
    navigate('/pending')
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

  const lbl = {
    fontSize: 'clamp(9px,0.85vw,12px)',
    color: 'rgba(170,200,235,0.85)',
    fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    fontWeight: 500,
    display: 'block',
    marginBottom: 5,
  }

  const iconWrap = {
    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', display: 'flex', alignItems: 'center',
  }

  const onFocus = e => { e.target.style.borderColor = 'rgba(80,130,220,0.6)'; e.target.style.background = 'rgba(255,255,255,0.10)' }
  const onBlur = e => { e.target.style.borderColor = 'rgba(80,120,200,0.30)'; e.target.style.background = 'rgba(255,255,255,0.07)' }

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

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
              transform: reducedMotion ? 'none' : 'translate(calc(var(--px,0)*5px),calc(var(--py,0)*5px))',
              transition: 'transform 0.18s ease-out',
            }}
          />

          {/* ── Create Account Card ── */}
          <div style={{
            position: 'absolute',
            right: '2.2%',
            top: '3%',
            bottom: '3%',
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
            gap: 'clamp(6px,0.8vw,11px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}>

            {/* Header */}
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(15px,1.9vw,28px)', fontWeight: 800, color: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', lineHeight: 1.2 }}>
                Request Team Access
              </h1>
              <p style={{ margin: 'clamp(3px,0.4vw,5px) 0 0', fontSize: 'clamp(9px,0.85vw,12px)', color: 'rgba(175,200,240,0.72)', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif', lineHeight: 1.4 }}>
                Your account will be activated after Audit Manager approval.
              </p>
            </div>

            {/* Org badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(80,120,200,0.22)',
              borderRadius: 8, padding: 'clamp(6px,0.7vw,10px) clamp(8px,1vw,14px)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'clamp(9px,0.85vw,12px)', fontWeight: 700, color: '#e8f0fc', fontFamily: 'system-ui, sans-serif' }}>Analytix Fintech International</div>
                <div style={{ fontSize: 'clamp(8px,0.72vw,10px)', color: 'rgba(150,180,230,0.65)', fontFamily: 'system-ui, sans-serif', marginTop: 2 }}>Certified audit network · 13 global offices</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['ABCPA','MISCPA'].map(t => (
                  <span key={t} style={{ fontSize: 'clamp(7px,0.68vw,9px)', fontWeight: 700, color: 'rgba(180,210,255,0.8)', background: 'rgba(80,130,220,0.15)', border: '1px solid rgba(80,130,220,0.25)', borderRadius: 4, padding: '2px 5px', fontFamily: 'monospace' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div style={{ height: 1, background: 'rgba(65,105,200,0.18)' }} />

            {/* Full Name */}
            <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
              <div>
                <label style={lbl}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><IconUser /></span>
                  <input type="text" value={fullName} placeholder="e.g. Sara Al-Qahtani" onChange={e => setFullName(e.target.value)} style={inp} onFocus={onFocus} onBlur={onBlur} autoComplete="name" />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label style={lbl}>Work Email</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><IconEnvelope /></span>
                  <input type="email" value={email} placeholder="sara@analytix.sa" onChange={e => setEmail(e.target.value)} style={inp} onFocus={onFocus} onBlur={onBlur} autoComplete="email" />
                </div>
              </div>

              {/* Role */}
              <div>
                <label style={lbl}>Role</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><IconBriefcase /></span>
                  <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inp, paddingRight: 'clamp(28px,2.8vw,38px)', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}>
                    {ROLE_OPTIONS.map(o => <option key={o} value={o} style={{ background: '#061026', color: '#e8f0fc' }}>{o}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><IconChevron /></span>
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><IconLock /></span>
                  <input type={showPassword ? 'text' : 'password'} value={password} placeholder="••••••••" onChange={e => setPassword(e.target.value)} style={{ ...inp, paddingRight: 'clamp(44px,4.5vw,62px)' }} onFocus={onFocus} onBlur={onBlur} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'clamp(9px,0.9vw,13px)', fontWeight: 600, color: '#e8192c', fontFamily: 'system-ui, sans-serif' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={lbl}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><IconLock /></span>
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} placeholder="Re-enter password" onChange={e => setConfirmPassword(e.target.value)} style={{ ...inp, paddingRight: 'clamp(44px,4.5vw,62px)' }} onFocus={onFocus} onBlur={onBlur} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'clamp(9px,0.9vw,13px)', fontWeight: 600, color: '#e8192c', fontFamily: 'system-ui, sans-serif' }}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div role="alert" style={{ background: 'rgba(160,20,30,0.8)', border: '1px solid rgba(255,90,100,0.35)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 'clamp(9px,0.85vw,12px)', fontFamily: 'system-ui, sans-serif' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #ff1f3d 0%, #c8102a 100%)',
                  border: 'none', borderRadius: 8,
                  padding: 'clamp(9px,1.1vw,14px)',
                  color: '#fff', fontWeight: 700,
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
                <IconArrow />
                Request Account
              </button>
            </form>

            {/* Back to sign in */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderTop: '1px solid rgba(65,105,200,0.18)', paddingTop: 'clamp(6px,0.8vw,10px)' }}>
              <span style={{ fontSize: 'clamp(9px,0.85vw,12px)', color: 'rgba(175,200,240,0.7)', fontFamily: 'system-ui, sans-serif' }}>
                Already have an account?
              </span>
              <Link to="/login" style={{ fontSize: 'clamp(9px,0.85vw,12px)', color: '#e8192c', fontFamily: 'system-ui, sans-serif', textDecoration: 'none', fontWeight: 600 }}>
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <style>{`
          @keyframes lan-pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 6px #4ade80; }
            50% { opacity: 0.45; box-shadow: 0 0 12px #4ade80; transform: scale(1.3); }
          }
        `}</style>
      </div>
    </PageTransition>
  )
}
