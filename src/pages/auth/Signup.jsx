import { useState, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'
import WorldMapBg from '../../components/shared/WorldMapBg'

const ROLE_OPTIONS = [
  'Associate',
  'Audit Lead',
  'Assistant Manager',
  'Audit Manager',
  'Front Office',
  'Management',
]

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

  const stageRef = useRef(null)

  const handleMouseMove = useCallback(e => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    stage.style.setProperty('--px', String((e.clientX - rect.left) / rect.width - 0.5))
    stage.style.setProperty('--py', String((e.clientY - rect.top) / rect.height - 0.5))
  }, [])

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
        style={{ width: '100vw', height: '100vh', display: 'grid', placeItems: 'center', overflow: 'hidden', background: '#020b16' }}
        onMouseMove={handleMouseMove}
      >
        <section
          ref={stageRef}
          style={{ position: 'relative', width: 'min(100vw, calc(100vh * 1600/840))', aspectRatio: '1600/840', maxHeight: '100vh', overflow: 'hidden' }}
        >
          {/* Background gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 85%, rgba(15,60,95,0.28) 0%, transparent 55%), linear-gradient(180deg,#020a14 0%,#071827 48%,#030c17 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 40%, rgba(35,91,135,0.11), transparent 55%), radial-gradient(ellipse at 10% 50%, rgba(20,60,95,0.09), transparent 45%)' }} />

          {/* D3 World Map */}
          <WorldMapBg style={{ transform: 'translate(calc(var(--px,0)*-4px),calc(var(--py,0)*-4px))', transition: 'transform 0.14s ease-out' }} />

          {/* Bottom glow */}
          <div style={{ position: 'absolute', left: '-5%', right: '-5%', bottom: '-15%', height: '40%', background: 'radial-gradient(ellipse at center, rgba(26,81,122,0.22), transparent 65%)', filter: 'blur(14px)', pointerEvents: 'none' }} />

          {/* Header branding */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: '35%',
            paddingTop: 'clamp(18px,2.8vh,32px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            pointerEvents: 'none', zIndex: 10,
            transform: 'translate(calc(var(--px,0)*2px),calc(var(--py,0)*2px))',
            transition: 'transform 0.18s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
              <div style={{ width: 30, height: 38, background: '#ef233c', clipPath: 'polygon(50% 0%,100% 22%,82% 100%,50% 83%,18% 100%,0% 22%)', filter: 'drop-shadow(0 0 8px rgba(239,35,60,0.3))', flexShrink: 0 }} />
              <span style={{ fontSize: 'clamp(15px,1.5vw,22px)', fontWeight: 600, letterSpacing: '0.28em', color: '#f2f5f8', fontFamily: 'Inter, system-ui, sans-serif' }}>ANALYTIX</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(38px,5.5vw,86px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.92, color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              AUDIT <span style={{ color: '#ef233c' }}>360</span>
            </h1>
            <p style={{ marginTop: 'clamp(10px,1.4vh,18px)', fontSize: 'clamp(10px,1vw,15px)', fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(216,224,232,0.85)', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Intelligent Audits <span style={{ color: '#ef233c', margin: '0 14px', fontWeight: 700 }}>|</span> Seamless Engagements <span style={{ color: '#ef233c', margin: '0 14px', fontWeight: 700 }}>|</span> Trusted Outcomes
            </p>
          </div>

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

            {/* Back button + Header */}
            <div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 clamp(6px,0.7vw,10px)',
                  fontSize: 'clamp(9px,0.82vw,11.5px)', fontWeight: 500,
                  color: 'rgba(160,190,235,0.72)', fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e8192c' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,190,235,0.72)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M11 6l-6 6 6 6"/>
                </svg>
                Back to Sign In
              </button>
              <h1 style={{ margin: 0, fontSize: 'clamp(15px,1.9vw,27px)', fontWeight: 800, color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.15 }}>
                Request Team Access
              </h1>
              <p style={{ margin: 'clamp(2px,0.35vw,5px) 0 0', fontSize: 'clamp(9px,0.82vw,12px)', color: 'rgba(175,200,240,0.70)', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.4 }}>
                Your account will be activated after Audit Manager approval.
              </p>
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

      </div>
    </PageTransition>
  )
}
