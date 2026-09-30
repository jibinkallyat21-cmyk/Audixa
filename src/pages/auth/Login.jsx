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
    box-shadow: 0 0 20px rgba(220,40,60,0.50), inset 0 0 10px rgba(220,40,60,0.12) !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .eco-orb-g { animation: none !important; }
  }
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

        {/* ── LAYER 1: Distant/background architecture ──────────── */}
        {/* bgwarp wrapper adds slow perspective tilt — 40s ease-in-out cycle */}
        <div className="a360-bgwarp" style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
          <img
            ref={bgRef}
            src="/arch-bg.webp"
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 30%',
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

        {/* ── Dark overlays ──────────────────────────────────────────── */}
        {/* Left darkening — brand area */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(2,9,20,0.92) 0%, rgba(2,9,20,0.72) 38%, rgba(2,9,20,0.38) 62%, rgba(2,9,20,0.72) 100%)',
        }} />
        {/* Top fade */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(2,9,20,0.75) 0%, transparent 28%, transparent 72%, rgba(2,9,20,0.82) 100%)',
        }} />
        {/* Right darkening — behind card */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '38%', pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent 0%, rgba(6,20,38,0.65) 40%, rgba(6,20,38,0.88) 100%)',
        }} />

        {/* ── Red diagonal accent line ───────────────────────────── */}
        <svg
          className="a360-diag"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          style={{ position: 'absolute', left: 0, top: 0, width: '65%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}
          aria-hidden="true"
        >
          <line x1="0.02" y1="0.98" x2="0.98" y2="0.02"
            stroke="#F7193D" strokeWidth="0.8"
            strokeDasharray="2400" strokeDashoffset="2400"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

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

          {/* ══ LEFT PANEL ══════════════════════════════════════════ */}
          <div className="a360-left" style={{
            flex: '0 0 66%', width: '66%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}>
            {/* Brand block */}
            <div className="a360-brand">
              {/* ANALYTIX mark + text */}
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

              {/* AUDIT 360 */}
              <div style={{
                fontSize: 'clamp(32px,4.6vw,72px)',
                fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,
                fontFamily: 'Inter, system-ui, sans-serif',
                marginBottom: 'clamp(10px,1.4vh,20px)',
              }}>
                <span style={{ color: '#F5F7FA' }}>AUDIT </span>
                <span style={{ color: '#F7193D', position: 'relative', display: 'inline-block' }}>
                  360
                  {/* Dimensional ring — rotates 26s, edge-on 68° perspective */}
                  <svg className="a360-ring-svg" viewBox="-70 -70 140 140" overflow="visible" aria-hidden="true"
                    style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
                    <circle cx="0" cy="0" r="60" fill="none" stroke="rgba(52,86,148,0.13)" strokeWidth="1.5"/>
                    <circle cx="0" cy="0" r="51" fill="none" stroke="rgba(247,25,61,0.038)" strokeWidth="0.9"/>
                  </svg>
                  {/* Breathing outer ring */}
                  <svg className="a360-ring-breathe" viewBox="-90 -90 180 180" overflow="visible" aria-hidden="true"
                    style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
                    <circle cx="0" cy="0" r="76" fill="none" stroke="rgba(52,86,148,0.28)" strokeWidth="2"/>
                  </svg>
                </span>
              </div>

              {/* Headline */}
              <div className="a360-hl">
                <h1 style={{
                  margin: 0,
                  fontSize: 'clamp(20px,2.3vw,36px)',
                  fontWeight: 400, lineHeight: 1.28,
                  color: '#F5F7FA',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  whiteSpace: 'nowrap',
                }}>
                  Clarity across every dimension of your audit.
                </h1>

                {/* Tagline */}
                <div className="a360-sep" style={{ marginTop: 'clamp(12px,1.6vh,22px)' }}>
                  <span style={{
                    fontSize: 'clamp(9px,0.82vw,12px)', color: 'rgba(200,215,235,0.65)',
                    letterSpacing: '0.12em', fontWeight: 500,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}>
                    Audit &nbsp;·&nbsp; Assurance &nbsp;·&nbsp; Risk &nbsp;·&nbsp; Compliance
                  </span>
                </div>
              </div>
            </div>

            {/* ── CENTRAL SERVICES GRAPHIC — SVG replica ── */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: 0,
              overflow: 'hidden',
            }}>
              <svg
                viewBox="0 0 720 490"
                width="100%"
                style={{ display: 'block', overflow: 'visible' }}
                aria-label="Analytix service ecosystem"
              >
                <defs>
                  <radialGradient id="csg-glob" cx="36%" cy="30%" r="68%">
                    <stop offset="0%"   stopColor="#223870"/>
                    <stop offset="40%"  stopColor="#0e2048"/>
                    <stop offset="100%" stopColor="#03091c"/>
                  </radialGradient>
                  <radialGradient id="csg-atm" cx="50%" cy="50%" r="50%">
                    <stop offset="72%" stopColor="rgba(0,0,0,0)"/>
                    <stop offset="90%" stopColor="rgba(80,140,240,0.12)"/>
                    <stop offset="100%" stopColor="rgba(110,170,255,0.26)"/>
                  </radialGradient>
                  <radialGradient id="csg-shd" cx="72%" cy="68%" r="60%">
                    <stop offset="0%"  stopColor="rgba(0,0,10,0.30)"/>
                    <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
                  </radialGradient>
                  <filter id="csg-rg" x="-120%" y="-120%" width="340%" height="340%">
                    <feGaussianBlur stdDeviation="6" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="csg-sg" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="2.5" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="csg-ng" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="2" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <clipPath id="csg-gc">
                    <circle cx={360} cy={245} r={103}/>
                  </clipPath>
                  <path id="csg-op" fill="none"
                    d="M 552,245 A 192,68 0 0 1 168,245 A 192,68 0 0 1 552,245"/>
                </defs>

                {/* Globe body */}
                <circle cx={360} cy={245} r={105} fill="url(#csg-glob)"/>

                {/* Rotating continents — outer group holds the clip, inner group spins */}
                <g clipPath="url(#csg-gc)">
                  <g fill="rgba(50,108,72,0.42)" stroke="rgba(70,140,92,0.24)" strokeWidth="0.65">
                    {!ecoReducedMotion && (
                      <animateTransform attributeName="transform" type="translate"
                        from="0 0" to="-210 0" dur="28s" repeatCount="indefinite"/>
                    )}
                    {/* Three tiled copies so the seam never shows */}
                    {[-210, 0, 210].map(ox => (
                      <g key={ox} transform={`translate(${ox},0)`}>
                        {/* North America — 22 points: west coast, Gulf, Florida, east coast, arctic */}
                        <polygon points="261,183 271,179 281,180 288,189 290,202 296,218 310,233 312,236 315,224 313,217 317,204 317,198 323,194 329,190 327,183 319,171 315,172 312,168 302,160 290,160 281,164 279,166"/>
                        {/* Greenland */}
                        <polygon points="333,148 347,151 350,155 345,160 333,162 329,156"/>
                        {/* South America — Pacific coast, Cape Horn, Atlantic, Amazon */}
                        <polygon points="315,243 313,247 313,251 318,280 320,297 321,310 326,306 326,291 327,285 330,279 334,272 340,255 340,251 331,245 326,238 320,232"/>
                        {/* Europe — Iberian, Britain, Scandinavia, Mediterranean */}
                        <polygon points="355,202 357,201 355,195 357,193 360,187 365,181 366,177 369,163 375,162 376,163 375,179 371,181 368,194 369,201 373,202 378,201 378,204 369,203 365,202"/>
                        {/* Africa — Gulf of Guinea, Cape, Horn of Africa, Sahara */}
                        <polygon points="357,204 353,208 350,229 353,235 358,239 363,239 368,240 367,266 371,286 376,285 380,274 390,231 385,227 382,219 380,209 368,202"/>
                        {/* Asia — Turkey, Siberia, SE Asia, Indian subcontinent, Arabia */}
                        <polygon points="376,201 378,195 390,196 404,184 407,163 424,159 448,160 455,184 438,195 435,204 431,219 423,231 420,244 408,236 406,238 402,222 400,219 396,216 394,219 393,227 386,230 382,227 379,210 380,203"/>
                        {/* Australia — detailed coastal outline */}
                        <polygon points="427,282 428,286 436,283 442,291 445,290 448,285 449,277 445,258 439,265 436,259 427,271"/>
                      </g>
                    ))}
                  </g>
                </g>

                {/* Grid lines clipped to globe */}
                <g clipPath="url(#csg-gc)">
                  {[-3,-2,-1,0,1,2,3].map(i => {
                    const ly = 245 + i*35;
                    const lrx = Math.sqrt(Math.max(0, 105**2 - (i*35)**2));
                    return lrx > 5 ? (
                      <ellipse key={i} cx={360} cy={ly} rx={lrx} ry={lrx*0.17}
                        fill="none" stroke="rgba(100,140,200,0.13)" strokeWidth="0.5"/>
                    ) : null;
                  })}
                  {[36,72,108,144].map(a => {
                    const lrx = 105 * Math.abs(Math.sin(a*Math.PI/180));
                    return lrx > 5 ? (
                      <ellipse key={a} cx={360} cy={245} rx={lrx} ry={105}
                        fill="none" stroke="rgba(100,140,200,0.13)" strokeWidth="0.5"
                        transform={`rotate(${a} 360 245)`}/>
                    ) : null;
                  })}
                </g>

                {/* Atmosphere + terminator */}
                <circle cx={360} cy={245} r={105} fill="url(#csg-atm)"/>
                <circle cx={360} cy={245} r={105} fill="url(#csg-shd)"/>

                {/* Globe rim glow */}
                <circle cx={360} cy={245} r={105} fill="none" stroke="rgba(40,80,160,0.30)" strokeWidth="4"/>
                <circle cx={360} cy={245} r={105} fill="none" stroke="rgba(60,100,180,0.08)" strokeWidth="16"/>

                {/* Connecting lines — globe edge → node edge, drawn behind the ring */}
                <g fill="none" stroke="rgba(100,145,210,0.38)" strokeWidth="0.85" strokeDasharray="4.5 5">
                  {/* top */}   <line x1={360} y1={140} x2={360} y2={82}/>
                  {/* left */}  <line x1={255} y1={237} x2={147} y2={230}/>
                  {/* right */} <line x1={465} y1={237} x2={573} y2={230}/>
                  {/* bot-L */} <line x1={275} y1={307} x2={170} y2={385}/>
                  {/* bot-R */} <line x1={444} y1={308} x2={545} y2={385}/>
                </g>

                {/* Orbital ring — dim full ellipse */}
                <ellipse cx={360} cy={245} rx={192} ry={68}
                  fill="none" stroke="rgba(190,28,48,0.20)" strokeWidth="1"/>
                {/* Orbital ring — front half brighter */}
                <ellipse cx={360} cy={245} rx={192} ry={68}
                  fill="none" stroke="#c81428" strokeWidth="1.4"
                  strokeDasharray="432 432" filter="url(#csg-sg)"/>

                {/* Bottom arc neon glow */}
                <ellipse cx={360} cy={245} rx={192} ry={68}
                  fill="none" stroke="#ff0022" strokeWidth="5"
                  strokeDasharray="152 712" strokeDashoffset="-75"
                  filter="url(#csg-rg)"/>
                <ellipse cx={360} cy={245} rx={192} ry={68}
                  fill="none" stroke="#ff4455" strokeWidth="1.6"
                  strokeDasharray="152 712" strokeDashoffset="-75"/>

                {/* Static dots */}
                <circle cx={168} cy={245} r={4} fill="#e01030" filter="url(#csg-sg)"/>
                <circle cx={552} cy={245} r={4} fill="#e01030" filter="url(#csg-sg)"/>

                {/* 3 animated dots on orbit */}
                {!ecoReducedMotion && [0, -3.5, -7].map((begin, i) => (
                  <circle key={i} r={3.5} fill="#e8001a" filter="url(#csg-sg)">
                    <animateMotion dur="10s" begin={`${begin}s`} repeatCount="indefinite">
                      <mpath href="#csg-op"/>
                    </animateMotion>
                  </circle>
                ))}

                {/* Globe centre text */}
                <text x={360} y={230} textAnchor="middle" fill="white"
                  fontSize="14" fontWeight="700" letterSpacing="6.5"
                  fontFamily="Inter,'Helvetica Neue',Arial,sans-serif">ANALYTIX</text>
                <text x={360} y={242} textAnchor="middle" fill="rgba(190,210,235,0.80)"
                  fontSize="5.5" letterSpacing="2.5" fontWeight="500"
                  fontFamily="Inter,'Helvetica Neue',Arial,sans-serif">GLOBAL PROFESSIONAL</text>
                <text x={360} y={251} textAnchor="middle" fill="rgba(190,210,235,0.80)"
                  fontSize="5.5" letterSpacing="2.5" fontWeight="500"
                  fontFamily="Inter,'Helvetica Neue',Arial,sans-serif">SERVICES</text>
                <line x1={330} y1={257} x2={390} y2={257}
                  stroke="rgba(200,40,60,0.6)" strokeWidth="0.7"/>
                <text x={360} y={268} textAnchor="middle" fill="rgba(185,205,232,0.76)"
                  fontSize="7.5" fontStyle="italic"
                  fontFamily="Georgia,'Times New Roman',serif">Smarter Strategies.</text>
                <text x={360} y={279} textAnchor="middle" fill="rgba(185,205,232,0.76)"
                  fontSize="7.5" fontStyle="italic"
                  fontFamily="Georgia,'Times New Roman',serif">Stronger Tomorrow.</text>

                {/* 5 Service nodes */}
                {[
                  { x:360, y:60,  n1:'AUDIT &',         n2:'ASSURANCE',  d1:'Independent insight.',       d2:'Greater confidence.',    icon:'shield' },
                  { x:125, y:228, n1:'ADVISORY &',       n2:'STRATEGY',   d1:'Practical guidance.',        d2:'Lasting value.',          icon:'gear'   },
                  { x:595, y:228, n1:'ACCOUNTING',       n2:'& TAX',      d1:'Financial clarity.',         d2:'Regulatory confidence.',  icon:'coins'  },
                  { x:152, y:398, n1:'BUSINESS &',       n2:'COMPLIANCE', d1:'Stay compliant.',            d2:'Move forward.',           icon:'doc'    },
                  { x:562, y:398, n1:'GLOBAL BUSINESS',  n2:'SERVICES',   d1:'Expand. Establish. Thrive.', d2:null,                      icon:'world'  },
                ].map(nd => (
                  <g key={`${nd.x}-${nd.y}`} transform={`translate(${nd.x},${nd.y})`}>
                    <circle cx={0} cy={0} r={22} fill="rgba(4,10,24,0.92)"/>
                    <circle cx={0} cy={0} r={22} fill="none" stroke="#b81224" strokeWidth="1.3" filter="url(#csg-ng)"/>

                    {nd.icon === 'shield' && (
                      <g fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M0,-10 C-5.5,-10 -10,-5.5 -10,0 C-10,5.5 -4.5,10 0,13 C4.5,10 10,5.5 10,0 C10,-5.5 5.5,-10 0,-10Z"/>
                        <polyline points="-4,1 -1.5,5 6,-3"/>
                      </g>
                    )}
                    {nd.icon === 'gear' && (
                      <g fill="none" stroke="white" strokeLinecap="round">
                        <circle cx={0} cy={0} r={4.5} strokeWidth="1.3"/>
                        {[0,45,90,135,180,225,270,315].map(a => {
                          const ar = a*Math.PI/180;
                          return <line key={a}
                            x1={5.2*Math.cos(ar)} y1={5.2*Math.sin(ar)}
                            x2={8.8*Math.cos(ar)} y2={8.8*Math.sin(ar)}
                            strokeWidth="2.1"/>;
                        })}
                      </g>
                    )}
                    {nd.icon === 'coins' && (
                      <g fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round">
                        {[-5.5,0,5.5].map(yy => <ellipse key={yy} cx={0} cy={yy} rx={7.5} ry={2.6}/>)}
                        <line x1={-7.5} y1={-5.5} x2={-7.5} y2={5.5}/>
                        <line x1={7.5}  y1={-5.5} x2={7.5}  y2={5.5}/>
                      </g>
                    )}
                    {nd.icon === 'doc' && (
                      <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
                        <rect x={-6.5} y={-10} width={13} height={19} rx={1.8} strokeWidth="1.2"/>
                        <line x1={-3} y1={-4.5} x2={4.5} y2={-4.5} strokeWidth="0.85"/>
                        <line x1={-3} y1={-0.5} x2={4.5} y2={-0.5} strokeWidth="0.85"/>
                        <line x1={-3} y1={3.5}  x2={2}   y2={3.5}  strokeWidth="0.85"/>
                      </g>
                    )}
                    {nd.icon === 'world' && (
                      <g fill="none" stroke="white" strokeLinecap="round">
                        <circle cx={0} cy={0} r={9.5} strokeWidth="1.3"/>
                        <ellipse cx={0} cy={0} rx={5} ry={9.5} strokeWidth="0.85"/>
                        <ellipse cx={0} cy={0} rx={9.5} ry={4.2} strokeWidth="0.85"/>
                      </g>
                    )}

                    <text x={0} y={36} textAnchor="middle" fill="white"
                      fontSize="9" fontWeight="700" letterSpacing="0.4"
                      fontFamily="Inter,'Helvetica Neue',Arial,sans-serif">{nd.n1}</text>
                    <text x={0} y={46} textAnchor="middle" fill="white"
                      fontSize="9" fontWeight="700" letterSpacing="0.4"
                      fontFamily="Inter,'Helvetica Neue',Arial,sans-serif">{nd.n2}</text>
                    <text x={0} y={58} textAnchor="middle" fill="rgba(175,198,225,0.76)"
                      fontSize="7" fontFamily="Inter,'Helvetica Neue',Arial,sans-serif">{nd.d1}</text>
                    {nd.d2 && (
                      <text x={0} y={67} textAnchor="middle" fill="rgba(175,198,225,0.76)"
                        fontSize="7" fontFamily="Inter,'Helvetica Neue',Arial,sans-serif">{nd.d2}</text>
                    )}
                  </g>
                ))}
              </svg>
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
          <div className="a360-right" style={{ flex: '0 0 31%', width: '31%', display: 'flex', alignItems: 'center' }}>
            {/* Card stack — ghost layers behind give physical depth on tilt */}
            <div style={{ position: 'relative', width: '100%' }}>
              {/* Ghost card 2 — furthest back */}
              <div ref={ghost2Ref} style={{
                position: 'absolute', inset: 0,
                background: 'rgba(5,16,34,0.5)',
                border: '1px solid rgba(118,158,205,0.18)',
                borderTop: '1px solid rgba(158,196,238,0.26)',
                borderRadius: 'clamp(8px,0.9vw,14px)',
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                boxShadow: '0 8px 40px rgba(0,4,14,0.55)',
                willChange: 'transform', pointerEvents: 'none',
                transform: 'translate(20px,28px)',
              }} />
              {/* Ghost card 1 — mid depth */}
              <div ref={ghost1Ref} style={{
                position: 'absolute', inset: 0,
                background: 'rgba(5,16,34,0.65)',
                border: '1px solid rgba(118,158,205,0.15)',
                borderTop: '1px solid rgba(158,196,238,0.22)',
                borderRadius: 'clamp(8px,0.9vw,14px)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 6px 30px rgba(0,4,14,0.45)',
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
                // Translucent dark glass — slightly deeper than before
                background: 'rgba(5,16,34,0.82)',
                // Physical border: brighter on top edge where light catches, dimmer on sides
                border: '1px solid rgba(118,158,205,0.12)',
                borderTop: '1px solid rgba(158,196,238,0.17)',
                borderRadius: 'clamp(8px,0.9vw,14px)',
                // Reduced blur — see more architecture through, genuine glass not frosted glass
                backdropFilter: 'blur(13px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(13px) saturate(1.4)',
                // Layered shadow: contact → mid-depth → ambient + inner highlights
                boxShadow: [
                  '0 2px 6px rgba(0,4,14,0.44)',
                  '0 14px 44px rgba(0,5,18,0.52)',
                  '0 38px 88px rgba(0,3,12,0.30)',
                  'inset 0 1px 0 rgba(205,228,255,0.058)',
                  'inset 1px 0 0 rgba(182,210,242,0.022)',
                ].join(', '),
                display: 'flex', flexDirection: 'column',
                padding: 'clamp(16px,2vw,28px)',
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
