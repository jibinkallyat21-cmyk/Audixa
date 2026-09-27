import { useState, useRef, useCallback } from 'react'
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
  const bgRef = useRef(null)

  const handleMouseMove = useCallback(e => {
    const el = bgRef.current
    if (!el) return
    const rx = (e.clientX / window.innerWidth  - 0.5) * 8
    const ry = (e.clientY / window.innerHeight - 0.5) * 5
    el.style.transform = `scale(1.06) translate(${-rx}px, ${-ry}px)`
  }, [])

  const handleSubmit = e => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password) { setError('Please fill in all required fields.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setError('')
    navigate('/pending')
  }

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.055)',
    border: '1px solid rgba(80,120,200,0.25)',
    borderRadius: 7,
    padding: 'clamp(7px,0.8vw,10px) 12px clamp(7px,0.8vw,10px) 40px',
    color: '#e8f0fc',
    fontSize: 'clamp(10px,0.9vw,13px)',
    fontFamily: 'Inter, system-ui, sans-serif',
    caretColor: '#4a9eff',
    outline: 'none',
    transition: 'border-color 0.18s, background 0.18s',
  }
  const lbl = {
    fontSize: 'clamp(9px,0.78vw,11px)',
    color: 'rgba(170,200,235,0.78)',
    fontWeight: 600, letterSpacing: '0.04em',
    display: 'block', marginBottom: 4,
    fontFamily: 'Inter, system-ui, sans-serif',
  }
  const iconWrap = {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', display: 'flex', alignItems: 'center',
  }
  const onFocus = e => { e.target.style.borderColor = 'rgba(80,130,220,0.55)'; e.target.style.background = 'rgba(255,255,255,0.09)' }
  const onBlur  = e => { e.target.style.borderColor = 'rgba(80,120,200,0.25)'; e.target.style.background = 'rgba(255,255,255,0.055)' }

  return (
    <PageTransition>
      <div
        style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#020914' }}
        onMouseMove={handleMouseMove}
      >
        {/* Architectural background */}
        <img
          ref={bgRef}
          src="/arch-bg.webp"
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
            transform: 'scale(1.06)',
            transition: 'transform 0.12s ease-out',
            pointerEvents: 'none',
          }}
        />

        {/* Dark overlays — identical to Login */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(2,9,20,0.92) 0%, rgba(2,9,20,0.72) 38%, rgba(2,9,20,0.38) 62%, rgba(2,9,20,0.72) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(2,9,20,0.75) 0%, transparent 28%, transparent 72%, rgba(2,9,20,0.82) 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '38%', pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent 0%, rgba(6,20,38,0.65) 40%, rgba(6,20,38,0.88) 100%)',
        }} />

        {/* Page content */}
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'stretch',
          padding: 'clamp(24px,3vh,44px) clamp(20px,2.5vw,52px)',
          boxSizing: 'border-box',
          gap: '3%',
        }}>
          {/* Left branding column */}
          <div style={{
            flex: '0 0 62%', width: '62%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-start',
            paddingTop: 'clamp(4px,0.6vh,10px)',
          }}>
            {/* ANALYTIX + AUDIT 360 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 'clamp(12px,1.8vh,26px)' }}>
              <div style={{ width: 42, height: 20, overflow: 'hidden', flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(247,25,61,0.3))' }}>
                <img src="/analytix-logo.png" alt="Analytix" style={{ width: 42, height: 'auto', display: 'block' }} />
              </div>
              <span style={{
                fontSize: 'clamp(11px,1.1vw,16px)', fontWeight: 600,
                letterSpacing: '0.3em', color: 'rgba(235,242,250,0.88)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>ANALYTIX</span>
            </div>
            <div style={{
              fontSize: 'clamp(32px,4.6vw,72px)',
              fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              <span style={{ color: '#F5F7FA' }}>AUDIT </span>
              <span style={{ color: '#F7193D' }}>360</span>
            </div>
          </div>

          {/* Right: Signup card */}
          <div style={{ flex: '0 0 35%', width: '35%', display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '100%',
              background: 'rgba(8, 24, 42, 0.78)',
              border: '1px solid rgba(100,150,190,0.18)',
              borderRadius: 'clamp(8px,0.9vw,14px)',
              backdropFilter: 'blur(20px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
              boxShadow: '0 8px 48px rgba(0,5,18,0.55), inset 0 1px 0 rgba(255,255,255,0.045)',
              display: 'flex', flexDirection: 'column',
              padding: 'clamp(16px,2vw,28px)',
              gap: 'clamp(8px,0.9vw,13px)',
              overflowY: 'auto', overflowX: 'hidden',
              maxHeight: 'calc(100vh - clamp(24px,3vh,44px) * 2)',
            }}>

              {/* Back button */}
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 'clamp(9px,0.78vw,11px)', fontWeight: 500,
                  color: 'rgba(160,190,235,0.72)', fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'color 0.15s', alignSelf: 'flex-start',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F7193D' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,190,235,0.72)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M11 6l-6 6 6 6"/>
                </svg>
                Back to Sign In
              </button>

              {/* Header */}
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: 'clamp(16px,1.9vw,26px)', fontWeight: 800, color: '#F5F7FA',
                  fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.15,
                }}>Request Team Access</h2>
                <p style={{
                  margin: 'clamp(2px,0.3vw,5px) 0 0',
                  fontSize: 'clamp(9px,0.8vw,12px)', color: 'rgba(145,164,184,0.82)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>Your account will be activated after Audit Manager approval.</p>
              </div>

              {/* Separator */}
              <div style={{ height: 1, background: 'rgba(65,105,200,0.18)' }} />

              <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                {/* Full Name */}
                <div>
                  <label style={lbl}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><IconUser /></span>
                    <input type="text" value={fullName} placeholder="e.g. Sara Al-Qahtani"
                      onChange={e => setFullName(e.target.value)}
                      style={inp} onFocus={onFocus} onBlur={onBlur} autoComplete="name" />
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label style={lbl}>Work Email</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><IconEnvelope /></span>
                    <input type="email" value={email} placeholder="sara@analytix.sa"
                      onChange={e => setEmail(e.target.value)}
                      style={inp} onFocus={onFocus} onBlur={onBlur} autoComplete="email" />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label style={lbl}>Role</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><IconBriefcase /></span>
                    <select value={role} onChange={e => setRole(e.target.value)}
                      style={{ ...inp, paddingRight: 'clamp(28px,2.8vw,38px)', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}>
                      {ROLE_OPTIONS.map(o => <option key={o} value={o} style={{ background: '#08182A', color: '#e8f0fc' }}>{o}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><IconChevron /></span>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={lbl}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><IconLock /></span>
                    <input type={showPassword ? 'text' : 'password'} value={password} placeholder="••••••••"
                      onChange={e => setPassword(e.target.value)}
                      style={{ ...inp, paddingRight: 'clamp(42px,4.2vw,58px)' }}
                      onFocus={onFocus} onBlur={onBlur} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'clamp(9px,0.78vw,11px)', fontWeight: 600, color: '#F7193D', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={lbl}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><IconLock /></span>
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} placeholder="Re-enter password"
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{ ...inp, paddingRight: 'clamp(42px,4.2vw,58px)' }}
                      onFocus={onFocus} onBlur={onBlur} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'clamp(9px,0.78vw,11px)', fontWeight: 600, color: '#F7193D', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {showConfirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div role="alert" style={{
                    background: 'rgba(140,15,25,0.82)',
                    border: '1px solid rgba(255,80,90,0.3)',
                    borderRadius: 6, padding: '5px 10px',
                    color: '#fff', fontSize: 'clamp(9px,0.78vw,11px)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}>{error}</div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #F7193D 0%, #C9102F 100%)',
                    border: 'none', borderRadius: 7,
                    padding: 'clamp(9px,1vw,13px)',
                    color: '#fff', fontWeight: 700,
                    fontSize: 'clamp(11px,1vw,14px)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: '0 4px 20px rgba(247,25,61,0.38)',
                    transition: 'opacity 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(247,25,61,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.boxShadow = '0 4px 20px rgba(247,25,61,0.38)' }}
                >
                  <IconArrow /> Request Account
                </button>
              </form>

              {/* Footer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                borderTop: '1px solid rgba(65,105,200,0.14)',
                paddingTop: 'clamp(5px,0.6vw,8px)',
              }}>
                <span style={{ fontSize: 'clamp(9px,0.78vw,11px)', color: 'rgba(145,164,184,0.65)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Already have an account?
                </span>
                <Link to="/login" style={{
                  fontSize: 'clamp(9px,0.78vw,11px)', color: '#F7193D',
                  fontFamily: 'Inter, system-ui, sans-serif', textDecoration: 'none', fontWeight: 600,
                }}>Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
