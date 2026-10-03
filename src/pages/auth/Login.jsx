import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'

const DEMO_ROLES = ROLE_ORDER.map(id => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

// ── Inline SVG icons ─────────────────────────────────────────────
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
const IconLockSecure = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(110,160,210,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
)

const COUNTRY_CODES = ['United States', 'United Kingdom', 'France', 'Kuwait', 'Bahrain', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Oman', 'China', 'Hong Kong', 'India', 'Singapore']

// ── Styles injected once ─────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap');

  .a360-root { font-family: 'Inter', system-ui, sans-serif; }

  @keyframes a360-fadein {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes a360-cardslide {
    from { opacity: 0; transform: translateX(28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes a360-diag {
    0%   { stroke-dashoffset: 2400; opacity: 0.55; }
    60%  { stroke-dashoffset: 0;    opacity: 0.75; }
    100% { stroke-dashoffset: 0;    opacity: 0.55; }
  }
  @keyframes a360-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(247,25,61,0.18), 0 4px 20px rgba(0,0,18,0.6); }
    50%       { box-shadow: 0 0 0 6px rgba(247,25,61,0), 0 4px 20px rgba(0,0,18,0.6); }
  }

  .a360-brand  { animation: a360-fadein 0.7s ease both; }
  .a360-hl     { animation: a360-fadein 0.75s 0.12s ease both; }
  .a360-sep    { animation: a360-fadein 0.6s 0.22s ease both; }
  .a360-gp     { animation: a360-fadein 0.6s 0.32s ease both; }
  .a360-card   { animation: a360-cardslide 0.75s 0.1s ease both; }
  .a360-diag   { animation: a360-diag 2.4s 0.5s ease-out forwards, a360-diag 5s 2.9s ease-in-out infinite; }
  .a360-ai     { animation: a360-pulse 2.8s 1s ease-in-out infinite; }

  .a360-inp { transition: border-color 0.18s, background 0.18s; }
  .a360-inp:focus { border-color: rgba(80,130,220,0.55) !important; background: rgba(255,255,255,0.09) !important; outline: none; }

  .a360-signin:hover { opacity: 0.88; box-shadow: 0 8px 28px rgba(247,25,61,0.5) !important; }
  .a360-signin:hover .a360-arrow { transform: translateX(3px); }
  .a360-arrow { transition: transform 0.15s ease; }

  .a360-demo:hover { background: rgba(247,25,61,0.08) !important; border-color: rgba(247,25,61,0.65) !important; }

  .a360-tab { transition: color 0.15s; }
  .a360-tab:hover { color: rgba(220,235,255,0.9) !important; }

  /* ── Dimensional 360 ring ─────────────────────────────────────── */
  @keyframes a360-ring {
    from { transform: perspective(480px) rotateX(68deg) rotateZ(0deg); }
    to   { transform: perspective(480px) rotateX(68deg) rotateZ(360deg); }
  }
  .a360-ring-svg { animation: a360-ring 26s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .a360-ring-svg { animation: none !important; }
  }

  /* ── Ambient atmospheric gradient ───────────────────────────── */
  @keyframes a360-ambient {
    0%   { transform: translate(0px, 0px); }
    30%  { transform: translate(16px, -10px); }
    65%  { transform: translate(-12px, 14px); }
    100% { transform: translate(0px, 0px); }
  }
  .a360-ambient { animation: a360-ambient 28s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .a360-ambient { animation: none !important; }
  }

  /* ── Environmental lighting ──────────────────────────────────── */
  /* Cool horizontal band drifting slowly upward */
  @keyframes a360-env1 {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-28px); }
  }
  /* Diagonal reflection sweeping left-to-right */
  @keyframes a360-env2 {
    0%, 100% { transform: translate(0, 0); }
    50%       { transform: translate(22px, -10px); }
  }
  /* Warm lower-city glow shifting gently */
  @keyframes a360-env3 {
    0%, 100% { transform: translateX(0); }
    50%       { transform: translateX(-18px); }
  }
  .a360-env1 { animation: a360-env1 14s ease-in-out infinite; }
  .a360-env2 { animation: a360-env2 18s -3.5s ease-in-out infinite; }
  .a360-env3 { animation: a360-env3 15s -6.2s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .a360-env1, .a360-env2, .a360-env3 { animation: none !important; }
  }

  /* ── Background perspective warp ────────────────────────────── */
  @keyframes a360-bgwarp {
    0%, 100% { transform: perspective(1200px) rotateX(0deg); }
    50%       { transform: perspective(1200px) rotateX(3deg); }
  }
  .a360-bgwarp { animation: a360-bgwarp 40s ease-in-out infinite; transform-origin: center 62%; }
  @media (prefers-reduced-motion: reduce) { .a360-bgwarp { animation: none !important; } }

  /* ── Breathing outer ring ────────────────────────────────────── */
  @keyframes a360-breathe {
    0%, 100% { transform: scale(1);    opacity: 0.5; }
    50%       { transform: scale(1.18); opacity: 1;   }
  }
  .a360-ring-breathe { animation: a360-breathe 6s ease-in-out infinite; transform-origin: 0 0; }
  @media (prefers-reduced-motion: reduce) { .a360-ring-breathe { animation: none !important; } }

  /* ── Country ticker ─────────────────────────────────────────── */
  @keyframes a360-ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .a360-ticker-track { animation: a360-ticker 35s linear infinite; display: inline-flex; white-space: nowrap; }
  @media (prefers-reduced-motion: reduce) { .a360-ticker-track { animation: none !important; } }

  /* ── Responsive ─────────────────────────────────────────────── */
  @media (max-width: 480px) {
    .a360-root   { overflow-y: auto !important; height: auto !important; min-height: 100vh !important; }
    .a360-layout { flex-direction: column !important; height: auto !important;
                   padding: clamp(20px,5vw,32px) !important; align-items: center !important; }
    .a360-left   { display: none !important; }
    .a360-right  { flex: none !important; width: 100% !important; max-width: 420px !important; }
    .a360-card   { max-height: none !important; }
    .a360-diag   { display: none !important; }
  }

  /* ── Service Ecosystem ──────────────────────────────────── */
  @keyframes eco-orb-breathe {
    0%,100% { opacity: 0.92; }
    50%     { opacity: 1; }
  }
  .eco-orb-g { animation: eco-orb-breathe 9s ease-in-out infinite; }
  .eco-node  { transition: opacity 0.2s ease; }
  .eco-node:hover { opacity: 0.9; }
  .eco-icon-ring { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
  .eco-node:hover .eco-icon-ring {
    border-color: rgba(240,55,75,0.90) !important;
    box-shadow: 0 0 22px rgba(220,40,60,0.52), inset 0 0 10px rgba(220,40,60,0.14) !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .eco-orb-g { animation: none !important; }
  }

  /* ── Globe float + particle pulse ───────────────────────── */
  @keyframes csg-float {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-9px); }
  }
  @keyframes csg-particle {
    0%,100% { transform: translate(-50%,-50%) scale(0.72); opacity: 0.42; }
    50%     { transform: translate(-50%,-50%) scale(1.32); opacity: 1; }
  }
  .csg-float-anim { animation: csg-float 7s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) { .csg-float-anim { animation: none !important; } }
`

export default function Login() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [demoRole, setDemoRole] = useState(DEMO_ROLES[0].value)
  const [error, setError] = useState('')
  const [fpMode, setFpMode] = useState(false)
  const [fpEmail, setFpEmail] = useState('')
  const [fpSent, setFpSent] = useState(false)
  const bgRef       = useRef(null)
  const midRef      = useRef(null)
  const fgRef       = useRef(null)
  const atmRef      = useRef(null)
  const cardTiltRef = useRef(null)
  const deepRef     = useRef(null)   // deep bg plane  0.5× speed
  const nearRef     = useRef(null)   // near-mid plane 1.5× speed
  const ghost1Ref   = useRef(null)   // stacked card layer 1
  const ghost2Ref   = useRef(null)   // stacked card layer 2
  const geoRef      = useRef(null)   // geometric planes in left panel

  // Normalized mouse target and smoothed current position for lerp
  const mouseTarget = useRef({ x: 0, y: 0 })
  const mouseCurr   = useRef({ x: 0, y: 0 })
  const rafId       = useRef(null)

  // rAF-based smooth parallax — 4 depth layers at different speeds
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const tick = () => {
      const t = mouseTarget.current
      const c = mouseCurr.current
      // lerp factor: ~0.1 → ~30 frames to settle, physical camera feel
      c.x += (t.x - c.x) * 0.1
      c.y += (t.y - c.y) * 0.1
      const cx = c.x  // normalized [-0.5, +0.5]
      const cy = c.y
      // Layer 1: distant/background image — ~1px at edge
      if (bgRef.current)  bgRef.current.style.transform  = `scale(1.06) translate(${-cx * 2}px, ${-cy * 2}px)`
      // Layer 2: midground architectural plane — ~2.5px at edge
      if (midRef.current) midRef.current.style.transform = `translate(${-cx * 5}px, ${-cy * 3}px)`
      // Layer 3: foreground atmospheric depth — ~4.5px at edge
      if (fgRef.current)  fgRef.current.style.transform  = `translate(${-cx * 9}px, ${-cy * 5}px)`
      // Layer 4: atmospheric city-light bloom — same plane as fg
      if (atmRef.current) atmRef.current.style.transform = `translate(${-cx * 9}px, ${-cy * 5}px)`
      // Card tilt — physical glass panel feel
      if (cardTiltRef.current) {
        const rx =  cy * 6
        const ry = -cx * 6
        cardTiltRef.current.style.transform = `perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg)`
      }
      // Ghost cards — same tilt at lower rates, base translate stays fixed
      if (ghost1Ref.current) ghost1Ref.current.style.transform = `perspective(1400px) rotateX(${cy*4}deg) rotateY(${-cx*4}deg) translate(10px,14px)`
      if (ghost2Ref.current) ghost2Ref.current.style.transform = `perspective(1400px) rotateX(${cy*2.5}deg) rotateY(${-cx*2.5}deg) translate(20px,28px)`
      // Extra parallax depth planes
      if (deepRef.current)  deepRef.current.style.transform  = `translate(${-cx * 1}px, ${-cy * 1}px)`
      if (nearRef.current)  nearRef.current.style.transform  = `translate(${-cx * 7}px, ${-cy * 4}px)`
      // Geometric planes in left panel — faster parallax, creates foreground feel
      if (geoRef.current)   geoRef.current.style.transform   = `translate(${-cx * 14}px, ${-cy * 8}px)`
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [])

  const handleMouseMove = useCallback(e => {
    mouseTarget.current.x = e.clientX / window.innerWidth  - 0.5
    mouseTarget.current.y = e.clientY / window.innerHeight - 0.5
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

  // ── shared input style ──────────────────────────────────────────
  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.055)',
    border: '1px solid rgba(80,120,200,0.25)',
    borderRadius: 7,
    padding: 'clamp(7px,0.8vw,10px) 12px clamp(7px,0.8vw,10px) 38px',
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
    position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', display: 'flex', alignItems: 'center',
  }

  const ecoReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <PageTransition>
      <style>{CSS}</style>
      <div
        className="a360-root"
        style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#020914' }}
        onMouseMove={handleMouseMove}
      >

        {/* ── LAYER 1: Background photo ────────────────────────────── */}
        <div className="a360-bgwarp" style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <img
            ref={bgRef}
            src="/bg/audit360.webp"
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center center',
              transform: 'scale(1.06)',
              willChange: 'transform',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* ── LAYER 1b: Deep background plane — 0.5× parallax speed ─ */}
        <div ref={deepRef} style={{
          position: 'absolute', inset: '-6px',
          background: 'linear-gradient(155deg, rgba(8,20,46,0.055) 0%, transparent 42%, transparent 58%, rgba(3,10,26,0.04) 100%)',
          pointerEvents: 'none', willChange: 'transform',
        }} />

        {/* ── LAYER 2b: Near-mid plane — 1.5× parallax speed ────── */}
        <div ref={nearRef} style={{
          position: 'absolute', inset: '-12px',
          background: 'radial-gradient(ellipse 52% 34% at 36% 54%, rgba(12,28,58,0.055) 0%, transparent 66%)',
          pointerEvents: 'none', willChange: 'transform',
        }} />

        {/* ── Ambient atmospheric gradient — slow 28s drift ──────── */}
        <div className="a360-ambient" style={{
          position: 'absolute', inset: '-32px',
          background: [
            'radial-gradient(ellipse 65% 50% at 38% 32%, rgba(10,24,52,0.16) 0%, transparent 65%)',
            'radial-gradient(ellipse 50% 38% at 68% 72%, rgba(3,10,26,0.12) 0%, transparent 60%)',
            'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(6,16,42,0.08) 0%, transparent 80%)',
          ].join(', '),
          pointerEvents: 'none', willChange: 'transform',
        }} />

        {/* ── LAYER 2: Middle architectural plane ───────────────── */}
        {/* Nearly invisible gradient — moves 2-3px, creates depth against bg */}
        <div
          ref={midRef}
          style={{
            position: 'absolute', inset: '-10px',
            background: 'linear-gradient(135deg, rgba(15,35,60,0.07) 0%, transparent 45%, transparent 55%, rgba(5,15,30,0.05) 100%)',
            pointerEvents: 'none', willChange: 'transform',
          }}
        />

        {/* ── LAYER 3: Foreground atmospheric depth ─────────────── */}
        {/* Subtle edge vignette — moves 4-5px, anchors depth in foreground */}
        <div
          ref={fgRef}
          style={{
            position: 'absolute', inset: '-10px',
            background: 'radial-gradient(ellipse 88% 72% at 48% 44%, transparent 28%, rgba(2,9,20,0.06) 100%)',
            pointerEvents: 'none', willChange: 'transform',
          }}
        />

        {/* ── LAYER 4: Atmospheric city-light bloom ─────────────── */}
        {/* Faint warm glow from city lights — moves with foreground plane */}
        <div
          ref={atmRef}
          style={{
            position: 'absolute', inset: '-10px',
            background: 'radial-gradient(ellipse 42% 28% at 42% 64%, rgba(190,140,60,0.022) 0%, transparent 68%)',
            pointerEvents: 'none', willChange: 'transform',
          }}
        />

        {/* ── Environmental lighting — natural city-light reflections ── */}
        {/* Cool horizontal band across mid-building glass — drifts vertically */}
        <div className="a360-env1" style={{
          position: 'absolute', inset: '-32px',
          background: 'linear-gradient(180deg, transparent 43%, rgba(182,208,238,0.028) 50%, transparent 57%)',
          pointerEvents: 'none', willChange: 'transform',
        }} />
        {/* Diagonal reflection — wide soft band sweeping across tower faces */}
        <div className="a360-env2" style={{
          position: 'absolute', inset: '-32px',
          background: 'linear-gradient(128deg, transparent 30%, rgba(198,218,242,0.022) 44%, transparent 58%)',
          pointerEvents: 'none', willChange: 'transform',
        }} />
        {/* Warm lower glow — city-light bounce off lower facades */}
        <div className="a360-env3" style={{
          position: 'absolute', inset: '-32px',
          background: 'radial-gradient(ellipse 58% 24% at 40% 74%, rgba(208,168,92,0.024) 0%, transparent 68%)',
          pointerEvents: 'none', willChange: 'transform',
        }} />

        {/* ── Overlays on top of photo ───────────────────────────── */}
        {/* Subtle edge vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 110% 90% at 42% 50%, transparent 55%, rgba(1,6,16,0.55) 100%)',
        }} />
        {/* Top & bottom fade */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(1,6,16,0.18) 0%, transparent 14%, transparent 82%, rgba(1,6,16,0.50) 100%)',
        }} />
        {/* Right darkening — behind login card */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '42%', pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent 0%, rgba(2,9,22,0.60) 30%, rgba(2,9,22,0.84) 70%, rgba(1,6,16,0.92) 100%)',
        }} />

        {/* Red diagonal removed — image supplies it */}

        {/* ── LAYER 5: Page content ─────────────────────────────── */}
        <div
          className="a360-layout"
          style={{
            position: 'relative', zIndex: 10,
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'stretch',
            padding: 'clamp(24px,3vh,44px) clamp(20px,2.5vw,52px)',
            boxSizing: 'border-box',
            gap: '3%',
          }}>

          {/* ══ LEFT PANEL — transparent spacer; photo supplies visuals ══ */}
          <div className="a360-left" style={{
            flex: '0 0 66%', width: '66%',
            position: 'relative',
            visibility: 'hidden',
            pointerEvents: 'none',
          }}>
            {/* Brand + title block */}
            <div>
              {/* Brand */}
              <div className="a360-brand" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'clamp(14px,2vh,24px)' }}>
                <div style={{ width:18, height:17, background:'#F7193D', clipPath:'polygon(50% 0,100% 100%,72% 100%,50% 52%,28% 100%,0 100%)', flexShrink:0 }}/>
                <span style={{ fontSize:13, fontWeight:700, letterSpacing:'0.38em', color:'#f4f7fb', fontFamily:'Inter,sans-serif' }}>ANALYTIX</span>
              </div>

              {/* AUDIT 360 */}
              <div style={{
                fontSize: 'clamp(40px,5.2vw,82px)',
                fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 0.92,
                fontFamily: 'Inter, system-ui, sans-serif',
                marginBottom: 'clamp(10px,1.4vh,18px)',
              }}>
                <span style={{ color: '#F5F7FA' }}>AUDIT </span>
                <span style={{ color: '#F7193D' }}>360</span>
              </div>

              {/* Headline */}
              <div className="a360-hl">
                <h1 style={{
                  margin: 0,
                  fontSize: 'clamp(18px,2.0vw,32px)',
                  fontWeight: 400, lineHeight: 1.25,
                  color: '#F0F4FA',
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}>
                  Clarity across every<br/>dimension of your audit.
                </h1>

                {/* Tagline */}
                <div className="a360-sep" style={{ marginTop: 'clamp(10px,1.4vh,18px)' }}>
                  <span style={{
                    fontSize: 'clamp(9px,0.82vw,12px)', color: 'rgba(200,215,235,0.65)',
                    letterSpacing: '0.12em', fontWeight: 600,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}>
                    AUDIT &nbsp;·&nbsp; ASSURANCE &nbsp;·&nbsp; RISK &nbsp;·&nbsp; COMPLIANCE
                  </span>
                  <div style={{ width:48, height:2, background:'#F7193D', marginTop:10 }}/>
                </div>
              </div>
            </div>

            {/* ── CENTRAL SERVICES GRAPHIC — CSS/SVG hybrid ── */}
            <div style={{
              flex: 1,
              position: 'relative',
              minHeight: 0,
              overflow: 'hidden',
            }}>

              {/* 3D perspective orbital rings */}
              <div style={{
                position:'absolute', left:'50%', top:'48%',
                width:'min(58%,390px)', aspectRatio:'1',
                transform:'translate(-50%,-50%)',
                perspective:'900px', perspectiveOrigin:'50% 48%',
                pointerEvents:'none',
              }}>
                {/* ring 1 — main outer ring, tilted ~71° */}
                <div style={{
                  position:'absolute', inset:0, borderRadius:'50%',
                  border:'1.5px solid rgba(55,138,221,0.44)',
                  boxShadow:'0 0 18px rgba(40,118,210,0.10)',
                  transform:'rotateX(71deg) rotateZ(-14deg)',
                }}/>
                {/* ring 2 — red-tinted ring, shallower tilt */}
                <div style={{
                  position:'absolute', inset:'-12%',
                  borderRadius:'50%',
                  border:'1.4px solid rgba(255,23,66,0.22)',
                  transform:'rotateX(54deg) rotateZ(34deg)',
                }}/>
                {/* ring 3 — inner accent ring */}
                <div style={{
                  position:'absolute', inset:'22%',
                  borderRadius:'50%',
                  border:'1px solid rgba(72,152,226,0.24)',
                  transform:'rotateX(18deg) rotateZ(66deg)',
                }}/>
              </div>

              {/* Connecting lines — full-size SVG overlay, behind globe/nodes */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
                aria-hidden="true"
              >
                <g fill="none" strokeLinecap="round">
                  <g stroke="rgba(100,160,255,0.18)" strokeWidth="0.6">
                    {!ecoReducedMotion && (
                      <animate attributeName="opacity" values="0.45;1;0.45" dur="3s" repeatCount="indefinite"/>
                    )}
                    <line x1="50" y1="33" x2="50" y2="14"/>
                    <line x1="38" y1="46" x2="16" y2="43"/>
                    <line x1="62" y1="46" x2="84" y2="43"/>
                    <line x1="41" y1="60" x2="24" y2="80"/>
                    <line x1="59" y1="60" x2="76" y2="80"/>
                  </g>
                  <g stroke="rgba(75,135,220,0.60)" strokeWidth="0.22">
                    <line x1="50" y1="33" x2="50" y2="14"/>
                    <line x1="38" y1="46" x2="16" y2="43"/>
                    <line x1="62" y1="46" x2="84" y2="43"/>
                    <line x1="41" y1="60" x2="24" y2="80"/>
                    <line x1="59" y1="60" x2="76" y2="80"/>
                  </g>
                </g>
                {[['50','33'],['38','46'],['62','46'],['41','60'],['59','60']].map(([x,y],i) => (
                  <circle key={i} cx={x} cy={y} r="0.85" fill="rgba(110,165,230,0.78)"/>
                ))}
              </svg>

              {/* Globe glow halo — behind globe */}
              <div style={{
                position:'absolute', left:'50%', top:'48%',
                width:'min(44%,300px)', aspectRatio:'1',
                transform:'translate(-50%,-50%)',
                borderRadius:'50%', pointerEvents:'none', zIndex:4,
                background:'radial-gradient(circle, rgba(30,100,220,0.22) 0%, rgba(15,70,170,0.10) 45%, transparent 72%)',
                filter:'blur(18px)',
              }}/>
              {/* Globe — CSS div with floating animation, continent SVG inside */}
              <div style={{
                position:'absolute', left:'50%', top:'48%',
                width:'min(36%,240px)', aspectRatio:'1',
                transform:'translate(-50%,-50%)',
                animation: ecoReducedMotion ? 'none' : 'csg-float 7s ease-in-out infinite',
                zIndex:5,
              }}>
                <div style={{
                  width:'100%', height:'100%', borderRadius:'50%',
                  position:'relative', overflow:'hidden',
                  background:[
                    'radial-gradient(circle at 36% 31%, rgba(75,166,255,0.92) 0 1%, transparent 1.8%)',
                    'radial-gradient(circle at 48% 40%, #163d67 0%, #0a2343 42%, #031124 72%, #010914 100%)',
                  ].join(', '),
                  boxShadow:[
                    '0 0 0 1.5px rgba(75,159,241,0.28)',
                    '0 0 22px rgba(40,139,241,0.50)',
                    '0 0 75px rgba(19,105,197,0.26)',
                    'inset -18px -14px 42px rgba(0,0,0,0.66)',
                  ].join(', '),
                }}>
                  {/* Continent SVG inside globe */}
                  <svg viewBox="0 0 200 200" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
                    <defs><clipPath id="csg-gc3"><circle cx="100" cy="100" r="97"/></clipPath></defs>
                    <g clipPath="url(#csg-gc3)">
                      <g>
                        {!ecoReducedMotion && (
                          <animateTransform attributeName="transform" type="translate"
                            from="0 0" to="-200 0" dur="28s" repeatCount="indefinite"/>
                        )}
                        {/* copy 1 */}
                        <g fill="rgba(45,106,68,0.60)" stroke="rgba(58,128,82,0.26)" strokeWidth="0.5">
                          <polygon points="72,83 76,81 80,82 83,87 83,92 86,100 91,107 92,108 93,103 93,101 94,96 94,94 97,92 99,91 98,88 96,83 94,84 93,82 90,79 85,79 82,80 81,81"/>
                          <polygon points="95,72 101,73 102,75 100,77 95,78 94,74"/>
                          <polygon points="93,100 92,102 92,104 93,114 95,120 95,124 97,122 97,117 97,115 98,113 99,110 101,104 101,102 98,100 97,97 95,95"/>
                          <polygon points="102,90 103,89 102,87 103,87 104,85 106,82 107,81 108,76 110,75 110,76 110,82 109,82 108,87 108,90 109,90 111,89 111,91 109,90 107,90"/>
                          <polygon points="102,90 101,92 100,100 101,103 103,105 105,105 107,106 107,116 108,122 110,122 111,118 114,103 112,101 111,97 110,93 107,90"/>
                          <polygon points="110,90 111,87 114,88 118,84 119,76 122,75 128,76 130,84 124,88 123,90 122,95 120,100 119,105 115,101 115,102 113,96 113,95 112,94 112,95 111,98 109,99 108,97 107,93 108,90"/>
                          <polygon points="122,112 122,114 124,113 126,117 126,116 127,114 128,112 126,106 124,108 124,106 122,110"/>
                        </g>
                        {/* city lights copy 1 */}
                        <g fill="rgba(255,195,90,0.92)">
                          <circle cx="127" cy="64" r="1.6"/>
                          <circle cx="121" cy="68" r="1.2"/>
                          <circle cx="133" cy="70" r="1.1"/>
                          <circle cx="116" cy="72" r="1.4"/>
                          <circle cx="143" cy="79" r="1.5"/>
                          <circle cx="161" cy="88" r="1.3"/>
                          <circle cx="170" cy="70" r="1.3"/>
                          <circle cx="174" cy="61" r="1.4"/>
                          <circle cx="183" cy="55" r="1.6"/>
                          <circle cx="90"  cy="36" r="1.4"/>
                          <circle cx="97"  cy="39" r="1.2"/>
                          <circle cx="106" cy="65" r="1.3"/>
                          <circle cx="88"  cy="90" r="1.2"/>
                          <circle cx="104" cy="126" r="1.3"/>
                          <circle cx="15"  cy="52" r="1.5"/>
                        </g>
                        {/* copy 2 — offset 200px for seamless loop */}
                        <g fill="rgba(45,106,68,0.60)" stroke="rgba(58,128,82,0.26)" strokeWidth="0.5" transform="translate(200,0)">
                          <polygon points="72,83 76,81 80,82 83,87 83,92 86,100 91,107 92,108 93,103 93,101 94,96 94,94 97,92 99,91 98,88 96,83 94,84 93,82 90,79 85,79 82,80 81,81"/>
                          <polygon points="95,72 101,73 102,75 100,77 95,78 94,74"/>
                          <polygon points="93,100 92,102 92,104 93,114 95,120 95,124 97,122 97,117 97,115 98,113 99,110 101,104 101,102 98,100 97,97 95,95"/>
                          <polygon points="102,90 103,89 102,87 103,87 104,85 106,82 107,81 108,76 110,75 110,76 110,82 109,82 108,87 108,90 109,90 111,89 111,91 109,90 107,90"/>
                          <polygon points="102,90 101,92 100,100 101,103 103,105 105,105 107,106 107,116 108,122 110,122 111,118 114,103 112,101 111,97 110,93 107,90"/>
                          <polygon points="110,90 111,87 114,88 118,84 119,76 122,75 128,76 130,84 124,88 123,90 122,95 120,100 119,105 115,101 115,102 113,96 113,95 112,94 112,95 111,98 109,99 108,97 107,93 108,90"/>
                          <polygon points="122,112 122,114 124,113 126,117 126,116 127,114 128,112 126,106 124,108 124,106 122,110"/>
                        </g>
                        <g fill="rgba(255,195,90,0.92)" transform="translate(200,0)">
                          <circle cx="127" cy="64" r="1.6"/>
                          <circle cx="121" cy="68" r="1.2"/>
                          <circle cx="133" cy="70" r="1.1"/>
                          <circle cx="116" cy="72" r="1.4"/>
                          <circle cx="143" cy="79" r="1.5"/>
                          <circle cx="161" cy="88" r="1.3"/>
                          <circle cx="170" cy="70" r="1.3"/>
                          <circle cx="174" cy="61" r="1.4"/>
                          <circle cx="183" cy="55" r="1.6"/>
                          <circle cx="90"  cy="36" r="1.4"/>
                          <circle cx="97"  cy="39" r="1.2"/>
                          <circle cx="106" cy="65" r="1.3"/>
                          <circle cx="88"  cy="90" r="1.2"/>
                          <circle cx="104" cy="126" r="1.3"/>
                          <circle cx="15"  cy="52" r="1.5"/>
                        </g>
                      </g>
                    </g>
                  </svg>

                  {/* Globe grid overlay */}
                  <div style={{
                    position:'absolute', inset:'9%', borderRadius:'50%', overflow:'hidden',
                    background:[
                      'repeating-linear-gradient(0deg, transparent 0 37%, rgba(91,173,239,0.17) 37% calc(37% + 1px), transparent calc(37% + 1px) 74%)',
                      'repeating-linear-gradient(90deg, transparent 0 48%, rgba(91,173,239,0.14) 48% calc(48% + 1px), transparent calc(48% + 1px) 96%)',
                    ].join(', '),
                    transform:'rotate(-12deg)',
                  }}/>

                  {/* Atmosphere */}
                  <div style={{
                    position:'absolute', inset:0, borderRadius:'50%',
                    background:[
                      'radial-gradient(circle at 72% 68%, rgba(0,0,10,0.28) 0%, transparent 56%)',
                      'radial-gradient(circle at 50% 50%, transparent 72%, rgba(80,140,240,0.12) 90%, rgba(110,170,255,0.22) 100%)',
                    ].join(', '),
                  }}/>

                  {/* Globe centre text */}
                  <div style={{
                    position:'absolute', inset:0, display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', textAlign:'center',
                    zIndex:2, gap:'1.5%',
                  }}>
                    <span style={{ fontSize:'clamp(7px,0.90vw,12px)', fontWeight:700, letterSpacing:'0.32em', color:'white', fontFamily:'Inter,sans-serif' }}>ANALYTIX</span>
                    <span style={{ fontSize:'clamp(3.5px,0.44vw,6px)', letterSpacing:'0.16em', color:'rgba(190,210,235,0.78)', fontFamily:'Inter,sans-serif' }}>GLOBAL PROFESSIONAL</span>
                    <span style={{ fontSize:'clamp(3.5px,0.44vw,6px)', letterSpacing:'0.16em', color:'rgba(190,210,235,0.78)', fontFamily:'Inter,sans-serif' }}>SERVICES</span>
                    <div style={{ width:'48%', height:1, background:'rgba(200,40,60,0.50)' }}/>
                    <span style={{ fontSize:'clamp(3.5px,0.48vw,6.5px)', color:'rgba(185,205,232,0.68)', fontFamily:'Georgia,serif', fontStyle:'italic' }}>Smarter Strategies.</span>
                    <span style={{ fontSize:'clamp(3.5px,0.48vw,6.5px)', color:'rgba(185,205,232,0.68)', fontFamily:'Georgia,serif', fontStyle:'italic' }}>Stronger Tomorrow.</span>
                  </div>
                </div>
              </div>

              {/* Ambient pulsing particles */}
              {!ecoReducedMotion && [[18,28],[82,26],[10,60],[90,57],[50,85]].map(([lp,tp],i) => (
                <div key={i} style={{
                  position:'absolute', left:`${lp}%`, top:`${tp}%`,
                  width:7, height:7, borderRadius:'50%',
                  background:'#e8001a', boxShadow:'0 0 10px rgba(232,0,26,0.9)',
                  transform:'translate(-50%,-50%)',
                  animation:`csg-particle ${2.7}s ${i*0.52}s ease-in-out infinite`,
                }}/>
              ))}

              {/* 5 Service nodes — CSS absolute positioned */}
              {[
                { l:'50%', t:'6%',  xf:'translateX(-50%)',     n1:'AUDIT &',        n2:'ASSURANCE',  d1:'Independent insight.',       d2:'Greater confidence.',   icon:'shield' },
                { l:'5%',  t:'41%', xf:'translateY(-50%)',     n1:'ADVISORY &',      n2:'STRATEGY',   d1:'Practical guidance.',        d2:'Lasting value.',         icon:'gear'   },
                { r:'5%',  t:'41%', xf:'translateY(-50%)',     n1:'ACCOUNTING',      n2:'& TAX',      d1:'Financial clarity.',         d2:'Regulatory confidence.', icon:'coins'  },
                { l:'16%', b:'8%',  xf:'translateX(-50%)',     n1:'BUSINESS &',      n2:'COMPLIANCE', d1:'Stay compliant.',            d2:'Move forward.',          icon:'doc'    },
                { r:'16%', b:'8%',  xf:'translateX(50%)',      n1:'GLOBAL BUSINESS', n2:'SERVICES',   d1:'Expand. Establish. Thrive.', d2:null,                     icon:'world'  },
              ].map((nd, idx) => {
                const posStyle = {
                  position:'absolute', textAlign:'center', zIndex:10,
                  width:'clamp(72px,12%,115px)',
                  ...(nd.l ? { left:nd.l } : {}),
                  ...(nd.r ? { right:nd.r } : {}),
                  ...(nd.t ? { top:nd.t } : {}),
                  ...(nd.b ? { bottom:nd.b } : {}),
                  transform: nd.xf,
                };
                return (
                  <div key={idx} className="eco-node" style={posStyle}>
                    <div className="eco-icon-ring" style={{
                      width:'clamp(44px,6.2vw,64px)', height:'clamp(44px,6.2vw,64px)',
                      borderRadius:'50%', border:'1.5px solid rgba(184,18,36,0.72)',
                      background:'rgba(3,9,24,0.90)',
                      boxShadow:'0 0 16px rgba(220,20,50,0.26), inset 0 0 12px rgba(35,95,195,0.12)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      margin:'0 auto clamp(5px,0.7vh,9px)',
                    }}>
                      {nd.icon === 'shield' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6z"/>
                          <polyline points="9 12 11 14 15 10"/>
                        </svg>
                      )}
                      {nd.icon === 'gear' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" strokeWidth="1.5"/>
                          {[0,45,90,135,180,225,270,315].map(a => {
                            const ar = a*Math.PI/180;
                            return <line key={a}
                              x1={12+5.2*Math.cos(ar)} y1={12+5.2*Math.sin(ar)}
                              x2={12+8.5*Math.cos(ar)} y2={12+8.5*Math.sin(ar)}
                              strokeWidth="2"/>;
                          })}
                        </svg>
                      )}
                      {nd.icon === 'coins' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                          {[-3,0,3].map(yy => <ellipse key={yy} cx="12" cy={12+yy} rx="7" ry="2.4"/>)}
                          <line x1="5" y1="9" x2="5" y2="15"/>
                          <line x1="19" y1="9" x2="19" y2="15"/>
                        </svg>
                      )}
                      {nd.icon === 'doc' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="1.5"/>
                          <line x1="9" y1="8"  x2="15" y2="8"  strokeWidth="1"/>
                          <line x1="9" y1="12" x2="15" y2="12" strokeWidth="1"/>
                          <line x1="9" y1="16" x2="13" y2="16" strokeWidth="1"/>
                        </svg>
                      )}
                      {nd.icon === 'world' && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                          <ellipse cx="12" cy="12" rx="4" ry="10" strokeWidth="1"/>
                          <line x1="2" y1="12" x2="22" y2="12" strokeWidth="1"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ fontSize:'clamp(8px,0.86vw,11px)', fontWeight:700, letterSpacing:'0.04em', color:'white', fontFamily:'Inter,sans-serif', lineHeight:1.15 }}>{nd.n1}</div>
                    <div style={{ fontSize:'clamp(8px,0.86vw,11px)', fontWeight:700, letterSpacing:'0.04em', color:'white', fontFamily:'Inter,sans-serif', lineHeight:1.15 }}>{nd.n2}</div>
                    <div style={{ fontSize:'clamp(6.5px,0.70vw,9px)', color:'rgba(175,198,225,0.72)', fontFamily:'Inter,sans-serif', marginTop:'clamp(3px,0.4vh,5px)', lineHeight:1.3 }}>{nd.d1}</div>
                    {nd.d2 && <div style={{ fontSize:'clamp(6.5px,0.70vw,9px)', color:'rgba(175,198,225,0.72)', fontFamily:'Inter,sans-serif', lineHeight:1.3 }}>{nd.d2}</div>}
                  </div>
                );
              })}
            </div>

            {/* Company tagline */}
            <div style={{
              textAlign: 'center',
              padding: 'clamp(4px,0.6vh,8px) clamp(8px,1vw,16px)',
              width: '100%',
            }}>
              <span style={{
                fontSize: 'clamp(9px,0.82vw,12px)',
                color: 'rgba(180,200,225,0.62)',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontStyle: 'italic',
                letterSpacing: '0.02em',
                display: 'block',
                textAlign: 'center',
              }}>
                Analytix helps businesses navigate financial, regulatory and strategic complexity across markets.
              </span>
            </div>

            {/* Global Presence */}
            <div className="a360-gp">
              <div style={{ textAlign: 'center', marginBottom: 'clamp(6px,0.8vh,10px)' }}>
                <span style={{
                  fontSize: 'clamp(10px,0.9vw,13px)', fontWeight: 700, letterSpacing: '0.18em',
                  color: 'rgba(200,215,235,0.88)', fontFamily: 'Inter, system-ui, sans-serif',
                }}>GLOBAL PRESENCE</span>
              </div>
              <div style={{
                overflow: 'hidden', width: '100%',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
                maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
              }}>
                <div className="a360-ticker-track">
                  {[...COUNTRY_CODES, ...COUNTRY_CODES].map((c, i) => (
                    <span key={i} style={{
                      fontSize: 'clamp(9px,0.78vw,11px)', color: 'rgba(145,164,184,0.72)',
                      fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.06em',
                      paddingRight: 'clamp(20px,2.2vw,36px)',
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ══ RIGHT PANEL — LOGIN CARD ═════════════════════════════ */}
          <div className="a360-right" style={{ flex: '0 0 31%', width: '31%', display: 'flex', alignItems: 'center', paddingLeft: '1%' }}>
            {/* Card stack — ghost layers behind give physical depth on tilt */}
            <div style={{ position: 'relative', width: '100%' }}>
              {/* Ghost card 2 — furthest back */}
              <div ref={ghost2Ref} style={{
                position: 'absolute', inset: 0,
                background: 'rgba(2,8,20,0.48)',
                border: '1px solid rgba(130,170,220,0.14)',
                borderTop: '1px solid rgba(180,215,255,0.20)',
                borderRadius: 'clamp(10px,1vw,16px)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 10px 50px rgba(0,4,14,0.62)',
                willChange: 'transform', pointerEvents: 'none',
                transform: 'translate(20px,28px)',
              }} />
              {/* Ghost card 1 — mid depth */}
              <div ref={ghost1Ref} style={{
                position: 'absolute', inset: 0,
                background: 'rgba(3,10,24,0.60)',
                border: '1px solid rgba(130,170,220,0.16)',
                borderTop: '1px solid rgba(180,215,255,0.24)',
                borderRadius: 'clamp(10px,1vw,16px)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 8px 36px rgba(0,4,14,0.52)',
                willChange: 'transform', pointerEvents: 'none',
                transform: 'translate(10px,14px)',
              }} />
            {/* 3D tilt wrapper — perspective container, never affects layout */}
            <div
              ref={cardTiltRef}
              style={{ width: '100%', willChange: 'transform', transformOrigin: 'center center' }}
            >
            <div
              className="a360-card"
              style={{
                width: '100%',
                background: 'rgba(3,11,26,0.72)',
                border: '1px solid rgba(130,170,220,0.18)',
                borderTop: '1px solid rgba(180,215,255,0.28)',
                borderLeft: '1px solid rgba(140,180,230,0.14)',
                borderRadius: 'clamp(10px,1vw,16px)',
                backdropFilter: 'blur(22px) saturate(1.6) brightness(1.05)',
                WebkitBackdropFilter: 'blur(22px) saturate(1.6) brightness(1.05)',
                boxShadow: [
                  '0 0 0 1px rgba(100,150,220,0.07)',
                  '0 4px 12px rgba(0,4,14,0.55)',
                  '0 18px 55px rgba(0,6,22,0.60)',
                  '0 48px 100px rgba(0,3,14,0.38)',
                  'inset 0 1px 0 rgba(220,238,255,0.10)',
                  'inset 1px 0 0 rgba(200,220,255,0.05)',
                  'inset 0 -1px 0 rgba(0,0,0,0.25)',
                ].join(', '),
                display: 'flex', flexDirection: 'column',
                padding: 'clamp(18px,2.2vw,32px)',
                gap: 'clamp(8px,0.9vw,13px)',
                overflowY: 'auto', overflowX: 'hidden',
                maxHeight: 'calc(100vh - clamp(24px,3vh,44px) * 2)',
              }}
            >
              {/* Card header */}
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: 'clamp(16px,1.9vw,26px)', fontWeight: 800, color: '#F5F7FA',
                  fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.15,
                }}>{fpMode ? 'Reset Password' : 'Welcome back'}</h2>
                <p style={{
                  margin: 'clamp(2px,0.3vw,5px) 0 0',
                  fontSize: 'clamp(9px,0.8vw,12px)', color: 'rgba(145,164,184,0.82)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>{fpMode ? 'Enter your work email to receive a reset link' : 'Sign in to your AUDIT 360 workspace'}</p>
              </div>

              {/* ── FORGOT PASSWORD INLINE VIEW ── */}
              {fpMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px,0.9vw,13px)' }}>
                  <div>
                    <label style={lbl}>Work email</label>
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}><IconEnvelope /></span>
                      <input
                        type="email" value={fpEmail} placeholder="you@analytix.com"
                        onChange={e => setFpEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && fpEmail) setFpSent(true); }}
                        autoComplete="email"
                        className="a360-inp"
                        style={inp}
                      />
                    </div>
                  </div>

                  {fpSent ? (
                    <div style={{
                      background: 'rgba(20,60,30,0.7)',
                      border: '1px solid rgba(60,200,100,0.3)',
                      borderRadius: 6, padding: 'clamp(8px,0.9vw,12px)',
                      color: 'rgba(140,220,160,0.95)', fontSize: 'clamp(9px,0.8vw,12px)',
                      fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center',
                    }}>
                      Reset link sent — check your inbox.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { if (fpEmail) setFpSent(true); }}
                      className="a360-signin"
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
                    >
                      Send reset link
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setFpMode(false); setFpEmail(''); setFpSent(false); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#F7193D', fontSize: 'clamp(9px,0.78vw,11px)',
                      fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
                    Back to sign in
                  </button>
                </div>
              )}

              {/* Tabs + login form — hidden when in forgot-password mode */}
              {!fpMode && (<>

              <div style={{ borderBottom: '1px solid rgba(65,105,200,0.18)', display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                {[{ key: 'client', label: 'Client Portal' }, { key: 'team', label: 'Analytix Team' }].map((tab, i) => (
                  <span key={tab.key} style={{ display: 'contents' }}>
                    {i === 1 && <span style={{ color: 'rgba(90,120,180,0.3)', fontSize: 'clamp(10px,0.9vw,13px)', paddingBottom: 6, userSelect: 'none' }}>|</span>}
                    <button
                      type="button"
                      onClick={() => setAccountType(tab.key)}
                      className="a360-tab"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 'clamp(4px,0.5vw,7px) clamp(4px,0.45vw,7px)',
                        fontSize: 'clamp(10px,0.9vw,13px)',
                        fontWeight: accountType === tab.key ? 700 : 400,
                        color: accountType === tab.key ? '#F5F7FA' : 'rgba(145,164,184,0.55)',
                        borderBottom: accountType === tab.key ? '2px solid #F7193D' : '2px solid transparent',
                        marginBottom: -1,
                        fontFamily: 'Inter, system-ui, sans-serif',
                        outline: 'none', whiteSpace: 'nowrap',
                      }}
                    >{tab.label}</button>
                  </span>
                ))}
              </div>

              {/* Work email */}
              <div>
                <label style={lbl}>Work email</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><IconEnvelope /></span>
                  <input
                    type="email" value={email} placeholder="you@analytix.com"
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && doSignIn()}
                    autoComplete="username"
                    className="a360-inp"
                    style={inp}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><IconLock /></span>
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} placeholder="••••••••"
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && doSignIn()}
                    autoComplete="current-password"
                    className="a360-inp"
                    style={{ ...inp, paddingRight: 'clamp(38px,3.8vw,54px)' }}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontSize: 'clamp(9px,0.82vw,12px)', fontWeight: 600, color: '#F7193D',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >{showPassword ? 'Hide' : 'Show'}</button>
                </div>
              </div>

              {/* Forgot password — inline toggle, no route */}
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <button
                  type="button"
                  onClick={() => { setFpMode(true); setFpSent(false); setFpEmail(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: '#F7193D', fontSize: 'clamp(9px,0.78vw,11px)',
                    fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500,
                  }}
                >Forgot password?</button>
              </div>

              {/* Sign In */}
              <button
                type="button" onClick={doSignIn}
                className="a360-signin"
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
              >
                <span className="a360-arrow"><IconArrow /></span> Sign In
              </button>

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

              {/* Create account — team tab only */}
              {accountType === 'team' && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  borderTop: '1px solid rgba(65,105,200,0.14)',
                  paddingTop: 'clamp(5px,0.6vw,8px)',
                }}>
                  <span style={{ fontSize: 'clamp(9px,0.78vw,11px)', color: 'rgba(145,164,184,0.65)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    New to Analytix Team?
                  </span>
                  <Link to="/signup" style={{
                    fontSize: 'clamp(9px,0.78vw,11px)', color: '#F7193D',
                    fontFamily: 'Inter, system-ui, sans-serif', textDecoration: 'none', fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}>
                    Create account
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </Link>
                </div>
              )}

              </>)}

              {/* DEMO ACCESS divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(65,105,200,0.16)' }} />
                <span style={{
                  fontSize: 'clamp(7px,0.65vw,9px)', letterSpacing: '0.16em',
                  color: 'rgba(97,117,139,0.65)', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600,
                }}>DEMO ACCESS</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(65,105,200,0.16)' }} />
              </div>

              {/* Preview as role */}
              <div>
                <label style={lbl}>Preview as role</label>
                <div style={{ position: 'relative' }}>
                  <span style={iconWrap}><IconUser /></span>
                  <select
                    value={demoRole} onChange={e => setDemoRole(e.target.value)}
                    className="a360-inp"
                    style={{ ...inp, paddingRight: 'clamp(26px,2.5vw,36px)', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
                  >
                    {DEMO_ROLES.map(r => (
                      <option key={r.value} value={r.value} style={{ background: '#08182A', color: '#e8f0fc' }}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <IconChevron />
                  </span>
                </div>
              </div>

              {/* Enter Demo */}
              <button
                type="button" onClick={handleEnterDemo}
                className="a360-demo"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(247,25,61,0.38)',
                  borderRadius: 7,
                  padding: 'clamp(9px,1vw,13px)',
                  color: '#e8f0fc', fontWeight: 600,
                  fontSize: 'clamp(11px,1vw,14px)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              ><IconLogin /> Enter Demo</button>

              {/* Secure footer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                paddingTop: 2,
              }}>
                <IconLockSecure />
                <span style={{
                  fontSize: 'clamp(8px,0.68vw,10px)', color: 'rgba(97,117,139,0.6)',
                  fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.04em',
                }}>Secure encrypted connection</span>
              </div>
            </div>
            </div>{/* /tilt wrapper */}
            </div>{/* /card stack */}
          </div>
        </div>

        {/* ── LAYER 6: Floating AI assistant ─────────────────────── */}
        <button
          type="button"
          className="a360-ai"
          style={{
            position: 'absolute', bottom: 24, right: 24, zIndex: 50,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(5,16,34,0.88)',
            border: '1px solid rgba(247,25,61,0.22)',
            boxShadow: '0 0 0 0 rgba(247,25,61,0.18), 0 4px 20px rgba(0,0,18,0.6)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(180,205,235,0.35)" strokeWidth="1.2"/>
            <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4" stroke="rgba(200,218,242,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="2" fill="rgba(185,210,240,0.5)"/>
          </svg>
        </button>
      </div>
    </PageTransition>
  )
}
