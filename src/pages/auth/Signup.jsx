import { useState, useRef, useCallback, useEffect } from 'react'
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
const COUNTRY_CODES = ['United States', 'United Kingdom', 'France', 'Kuwait', 'Bahrain', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Oman', 'China', 'Hong Kong', 'India', 'Singapore']

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@300;400;500;600;700;800&display=swap');
  .su-inp { transition: border-color 0.18s, background 0.18s; }
  .su-inp:focus { border-color: rgba(80,130,220,0.55) !important; background: rgba(255,255,255,0.09) !important; outline: none; }
  .su-btn:hover { opacity: 0.88; box-shadow: 0 8px 28px rgba(247,25,61,0.5) !important; }
  @keyframes a360-ring {
    from { transform: perspective(480px) rotateX(68deg) rotateZ(0deg); }
    to   { transform: perspective(480px) rotateX(68deg) rotateZ(360deg); }
  }
  .a360-ring-svg { animation: a360-ring 26s linear infinite; }
  @media (prefers-reduced-motion: reduce) { .a360-ring-svg { animation: none !important; } }

  @keyframes a360-ambient {
    0%   { transform: translate(0px, 0px); }
    30%  { transform: translate(16px, -10px); }
    65%  { transform: translate(-12px, 14px); }
    100% { transform: translate(0px, 0px); }
  }
  .a360-ambient { animation: a360-ambient 28s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) { .a360-ambient { animation: none !important; } }

  @keyframes a360-ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .a360-ticker-track { animation: a360-ticker 35s linear infinite; display: inline-flex; white-space: nowrap; }
  @media (prefers-reduced-motion: reduce) { .a360-ticker-track { animation: none !important; } }

  @keyframes a360-bgwarp {
    0%, 100% { transform: perspective(1200px) rotateX(0deg); }
    50%       { transform: perspective(1200px) rotateX(0.85deg); }
  }
  .a360-bgwarp { animation: a360-bgwarp 40s ease-in-out infinite; transform-origin: center 62%; }
  @media (prefers-reduced-motion: reduce) { .a360-bgwarp { animation: none !important; } }

  @keyframes a360-breathe {
    0%, 100% { transform: scale(1);    opacity: 0.7; }
    50%       { transform: scale(1.1); opacity: 1;   }
  }
  .a360-ring-breathe { animation: a360-breathe 8s ease-in-out infinite; transform-origin: 0 0; }
  @media (prefers-reduced-motion: reduce) { .a360-ring-breathe { animation: none !important; } }

  @media (max-width: 900px) {
    .a360-root   { overflow-y: auto !important; height: auto !important; min-height: 100vh !important; }
    .a360-layout { flex-direction: column !important; height: auto !important;
                   padding: clamp(20px,5vw,32px) !important; align-items: center !important; }
    .a360-left   { display: none !important; }
    .a360-right  { flex: none !important; width: 100% !important; max-width: 420px !important; }
    .a360-card   { max-height: none !important; }
  }
`

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
  const bgRef       = useRef(null)
  const cardTiltRef = useRef(null)
  const deepRef     = useRef(null)
  const nearRef     = useRef(null)
  const ghost1Ref   = useRef(null)
  const ghost2Ref   = useRef(null)
  const geoRef      = useRef(null)
  const mouseTarget = useRef({ x: 0, y: 0 })
  const mouseCurr   = useRef({ x: 0, y: 0 })
  const rafId       = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const tick = () => {
      const t = mouseTarget.current, c = mouseCurr.current
      c.x += (t.x - c.x) * 0.1
      c.y += (t.y - c.y) * 0.1
      if (bgRef.current) bgRef.current.style.transform = `scale(1.06) translate(${-c.x * 2}px, ${-c.y * 2}px)`
      if (cardTiltRef.current) cardTiltRef.current.style.transform = `perspective(1400px) rotateX(${c.y * 2}deg) rotateY(${-c.x * 2}deg)`
      if (ghost1Ref.current) ghost1Ref.current.style.transform = `perspective(1400px) rotateX(${c.y*1.5}deg) rotateY(${-c.x*1.5}deg) translate(6px,8px)`
      if (ghost2Ref.current) ghost2Ref.current.style.transform = `perspective(1400px) rotateX(${c.y*0.9}deg) rotateY(${-c.x*0.9}deg) translate(12px,16px)`
      if (deepRef.current)  deepRef.current.style.transform  = `translate(${-c.x * 1}px, ${-c.y * 1}px)`
      if (nearRef.current)  nearRef.current.style.transform  = `translate(${-c.x * 7}px, ${-c.y * 4}px)`
      if (geoRef.current)   geoRef.current.style.transform   = `translate(${-c.x * 14}px, ${-c.y * 8}px)`
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [])

  const handleMouseMove = useCallback(e => {
    mouseTarget.current.x = e.clientX / window.innerWidth  - 0.5
    mouseTarget.current.y = e.clientY / window.innerHeight - 0.5
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

  return (
    <PageTransition>
      <style>{CSS}</style>
      <div
        className="a360-root"
        style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#020914', fontFamily: 'Inter, system-ui, sans-serif' }}
        onMouseMove={handleMouseMove}
      >
        {/* Architectural background — wrapped in bgwarp for slow perspective tilt */}
        <div className="a360-bgwarp" style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <img ref={bgRef} src="/arch-bg.webp" alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', transform: 'scale(1.06)', willChange: 'transform', pointerEvents: 'none' }}
          />
        </div>
        <div ref={deepRef} style={{ position: 'absolute', inset: '-6px', background: 'linear-gradient(155deg, rgba(8,20,46,0.055) 0%, transparent 42%, transparent 58%, rgba(3,10,26,0.04) 100%)', pointerEvents: 'none', willChange: 'transform' }} />
        <div ref={nearRef} style={{ position: 'absolute', inset: '-12px', background: 'radial-gradient(ellipse 52% 34% at 36% 54%, rgba(12,28,58,0.055) 0%, transparent 66%)', pointerEvents: 'none', willChange: 'transform' }} />

        {/* Ambient atmospheric gradient */}
        <div className="a360-ambient" style={{
          position: 'absolute', inset: '-32px',
          background: [
            'radial-gradient(ellipse 65% 50% at 38% 32%, rgba(10,24,52,0.16) 0%, transparent 65%)',
            'radial-gradient(ellipse 50% 38% at 68% 72%, rgba(3,10,26,0.12) 0%, transparent 60%)',
            'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(6,16,42,0.08) 0%, transparent 80%)',
          ].join(', '),
          pointerEvents: 'none', willChange: 'transform',
        }} />

        {/* Dark overlays */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(2,9,20,0.92) 0%, rgba(2,9,20,0.72) 38%, rgba(2,9,20,0.38) 62%, rgba(2,9,20,0.72) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(2,9,20,0.75) 0%, transparent 28%, transparent 72%, rgba(2,9,20,0.82) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '38%', pointerEvents: 'none', background: 'linear-gradient(90deg, transparent 0%, rgba(6,20,38,0.65) 40%, rgba(6,20,38,0.88) 100%)' }} />

        {/* Page content */}
        <div
          className="a360-layout"
          style={{
            position: 'relative', zIndex: 10,
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'stretch',
            padding: 'clamp(24px,3vh,44px) clamp(20px,2.5vw,52px)',
            boxSizing: 'border-box', gap: '3%',
          }}>

          {/* ══ LEFT PANEL ══ */}
          <div className="a360-left" style={{ flex: '0 0 62%', width: '62%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div ref={geoRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', willChange: 'transform' }}>
              <div style={{ position: 'absolute', left: '4%', top: '16%', width: '46%', height: '30%', border: '0.5px solid rgba(175,205,238,0.052)', borderRadius: 3, transform: 'perspective(900px) rotateY(15deg) rotateX(4deg)', transformOrigin: 'left center' }} />
              <div style={{ position: 'absolute', left: '26%', top: '46%', width: '42%', height: '34%', border: '0.5px solid rgba(247,25,61,0.036)', borderRadius: 3, transform: 'perspective(900px) rotateY(-9deg) rotateX(-3deg)', transformOrigin: 'right center' }} />
            </div>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 'clamp(12px,1.8vh,26px)' }}>
                <div style={{ width: 42, height: 20, overflow: 'hidden', flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(247,25,61,0.3))' }}>
                  <img src="/analytix-logo.png" alt="Analytix" style={{ width: 42, height: 'auto', display: 'block' }} />
                </div>
                <span style={{ fontSize: 'clamp(11px,1.1vw,16px)', fontWeight: 600, letterSpacing: '0.3em', color: 'rgba(235,242,250,0.88)', fontFamily: 'Inter, system-ui, sans-serif' }}>ANALYTIX</span>
              </div>
              <div style={{ fontSize: 'clamp(32px,4.6vw,72px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'Inter, system-ui, sans-serif', marginBottom: 'clamp(10px,1.4vh,20px)' }}>
                <span style={{ color: '#F5F7FA' }}>AUDIT </span>
                <span style={{ color: '#F7193D', position: 'relative', display: 'inline-block' }}>
                  360
                  <svg className="a360-ring-svg" viewBox="-70 -70 140 140" overflow="visible" aria-hidden="true"
                    style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
                    <circle cx="0" cy="0" r="60" fill="none" stroke="rgba(52,86,148,0.13)" strokeWidth="1.5"/>
                    <circle cx="0" cy="0" r="51" fill="none" stroke="rgba(247,25,61,0.038)" strokeWidth="0.9"/>
                  </svg>
                  <svg className="a360-ring-breathe" viewBox="-90 -90 180 180" overflow="visible" aria-hidden="true"
                    style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
                    <circle cx="0" cy="0" r="76" fill="none" stroke="rgba(52,86,148,0.07)" strokeWidth="0.7"/>
                  </svg>
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(20px,2.3vw,36px)', fontWeight: 400, lineHeight: 1.28, color: '#F5F7FA', fontFamily: "'Playfair Display', Georgia, serif", whiteSpace: 'nowrap' }}>
                Clarity across every dimension of your audit.
              </h1>
              <div style={{ marginTop: 'clamp(12px,1.6vh,22px)' }}>
                <span style={{ fontSize: 'clamp(9px,0.82vw,12px)', color: 'rgba(200,215,235,0.65)', letterSpacing: '0.12em', fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Audit &nbsp;·&nbsp; Assurance &nbsp;·&nbsp; Risk &nbsp;·&nbsp; Compliance
                </span>
              </div>
            </div>

            {/* Global Presence */}
            <div>
              <div style={{ textAlign: 'center', marginBottom: 'clamp(6px,0.8vh,10px)' }}>
                <span style={{ fontSize: 'clamp(10px,0.9vw,13px)', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(200,215,235,0.88)', fontFamily: 'Inter, system-ui, sans-serif' }}>GLOBAL PRESENCE</span>
              </div>
              <div style={{ overflow: 'hidden', width: '100%', WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)', maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
                <div className="a360-ticker-track">
                  {[...COUNTRY_CODES, ...COUNTRY_CODES].map((c, i) => (
                    <span key={i} style={{ fontSize: 'clamp(9px,0.78vw,11px)', color: 'rgba(145,164,184,0.72)', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.06em', paddingRight: 'clamp(20px,2.2vw,36px)' }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ══ RIGHT PANEL — SIGNUP CARD ══ */}
          <div className="a360-right" style={{ flex: '0 0 35%', width: '35%', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <div ref={ghost2Ref} style={{ position: 'absolute', inset: 0, background: 'rgba(5,16,34,0.36)', border: '1px solid rgba(118,158,205,0.06)', borderTop: '1px solid rgba(158,196,238,0.09)', borderRadius: 'clamp(8px,0.9vw,14px)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', willChange: 'transform', pointerEvents: 'none', transform: 'translate(12px,16px)' }} />
              <div ref={ghost1Ref} style={{ position: 'absolute', inset: 0, background: 'rgba(5,16,34,0.52)', border: '1px solid rgba(118,158,205,0.08)', borderTop: '1px solid rgba(158,196,238,0.12)', borderRadius: 'clamp(8px,0.9vw,14px)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', willChange: 'transform', pointerEvents: 'none', transform: 'translate(6px,8px)' }} />
            <div ref={cardTiltRef} style={{ width: '100%', willChange: 'transform', transformOrigin: 'center center' }}>
            <div className="a360-card" style={{
              width: '100%',
              background: 'rgba(5,16,34,0.82)',
              border: '1px solid rgba(118,158,205,0.12)',
              borderTop: '1px solid rgba(158,196,238,0.17)',
              borderRadius: 'clamp(8px,0.9vw,14px)',
              backdropFilter: 'blur(13px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(13px) saturate(1.4)',
              boxShadow: ['0 2px 6px rgba(0,4,14,0.44)', '0 14px 44px rgba(0,5,18,0.52)', '0 38px 88px rgba(0,3,12,0.30)', 'inset 0 1px 0 rgba(205,228,255,0.058)', 'inset 1px 0 0 rgba(182,210,242,0.022)'].join(', '),
              display: 'flex', flexDirection: 'column',
              padding: 'clamp(16px,2vw,28px)',
              gap: 'clamp(8px,0.9vw,13px)',
              overflowY: 'auto', overflowX: 'hidden',
              maxHeight: 'calc(100vh - clamp(24px,3vh,44px) * 2)',
            }}>

              {/* Back button */}
              <button type="button" onClick={() => navigate('/login')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'clamp(9px,0.78vw,11px)', fontWeight: 500, color: 'rgba(160,190,235,0.72)', fontFamily: 'Inter, system-ui, sans-serif', transition: 'color 0.15s', alignSelf: 'flex-start' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F7193D' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(160,190,235,0.72)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
                Back to Sign In
              </button>

              {/* Header */}
              <div>
                <h2 style={{ margin: 0, fontSize: 'clamp(16px,1.9vw,26px)', fontWeight: 800, color: '#F5F7FA', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.15 }}>Request Team Access</h2>
                <p style={{ margin: 'clamp(2px,0.3vw,5px) 0 0', fontSize: 'clamp(9px,0.8vw,12px)', color: 'rgba(145,164,184,0.82)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Your account will be activated after Audit Manager approval.
                </p>
              </div>

              <div style={{ height: 1, background: 'rgba(65,105,200,0.18)' }} />

              <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                {/* Full Name */}
                <div>
                  <label style={lbl}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><IconUser /></span>
                    <input type="text" value={fullName} placeholder="e.g. Sara Al-Qahtani" onChange={e => setFullName(e.target.value)} className="su-inp" style={inp} autoComplete="name" />
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label style={lbl}>Work Email</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><IconEnvelope /></span>
                    <input type="email" value={email} placeholder="sara@analytix.sa" onChange={e => setEmail(e.target.value)} className="su-inp" style={inp} autoComplete="email" />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label style={lbl}>Role</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><IconBriefcase /></span>
                    <select value={role} onChange={e => setRole(e.target.value)} className="su-inp" style={{ ...inp, paddingRight: 'clamp(28px,2.8vw,38px)', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}>
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
                    <input type={showPassword ? 'text' : 'password'} value={password} placeholder="••••••••" onChange={e => setPassword(e.target.value)} className="su-inp" style={{ ...inp, paddingRight: 'clamp(42px,4.2vw,58px)' }} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'clamp(9px,0.78vw,11px)', fontWeight: 600, color: '#F7193D', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={lbl}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><IconLock /></span>
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} placeholder="Re-enter password" onChange={e => setConfirmPassword(e.target.value)} className="su-inp" style={{ ...inp, paddingRight: 'clamp(42px,4.2vw,58px)' }} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'clamp(9px,0.78vw,11px)', fontWeight: 600, color: '#F7193D', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {showConfirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div role="alert" style={{ background: 'rgba(140,15,25,0.82)', border: '1px solid rgba(255,80,90,0.3)', borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 'clamp(9px,0.78vw,11px)', fontFamily: 'Inter, system-ui, sans-serif' }}>{error}</div>
                )}

                <button type="submit" className="su-btn"
                  style={{ background: 'linear-gradient(135deg, #F7193D 0%, #C9102F 100%)', border: 'none', borderRadius: 7, padding: 'clamp(9px,1vw,13px)', color: '#fff', fontWeight: 700, fontSize: 'clamp(11px,1vw,14px)', fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 20px rgba(247,25,61,0.38)', transition: 'opacity 0.15s, box-shadow 0.15s' }}
                >
                  <IconArrow /> Request Account
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderTop: '1px solid rgba(65,105,200,0.14)', paddingTop: 'clamp(5px,0.6vw,8px)' }}>
                <span style={{ fontSize: 'clamp(9px,0.78vw,11px)', color: 'rgba(145,164,184,0.65)', fontFamily: 'Inter, system-ui, sans-serif' }}>Already have an account?</span>
                <Link to="/login" style={{ fontSize: 'clamp(9px,0.78vw,11px)', color: '#F7193D', fontFamily: 'Inter, system-ui, sans-serif', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
              </div>
            </div>
            </div>{/* /tilt wrapper */}
            </div>{/* /card stack */}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
