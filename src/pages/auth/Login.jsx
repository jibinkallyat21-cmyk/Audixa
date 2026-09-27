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
  @media (max-width: 900px) {
    .a360-root   { overflow-y: auto !important; height: auto !important; min-height: 100vh !important; }
    .a360-layout { flex-direction: column !important; height: auto !important;
                   padding: clamp(20px,5vw,32px) !important; align-items: center !important; }
    .a360-left   { display: none !important; }
    .a360-right  { flex: none !important; width: 100% !important; max-width: 420px !important; }
    .a360-card   { max-height: none !important; }
    .a360-diag   { display: none !important; }
  }

  /* ── Service Ecosystem ──────────────────────────────────── */
  @keyframes eco-orb-glow {
    0%,100% { opacity: 0.52; }
    50%     { opacity: 0.96; }
  }
  @keyframes eco-ring-pulse {
    0%,100% { opacity: 0.48; }
    50%     { opacity: 0.92; }
  }
  @keyframes eco-orb-scale {
    0%,100% { transform: scale(1); }
    50%     { transform: scale(1.055); }
  }
  .eco-orb-halo { animation: eco-orb-glow 12s ease-in-out infinite; }
  .eco-ring1    { animation: eco-ring-pulse 15s ease-in-out infinite; }
  .eco-ring2    { animation: eco-ring-pulse 10s -5s ease-in-out infinite; }
  .eco-orb-core { animation: eco-orb-scale 10s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .eco-node-card {
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
  }
  .eco-node:hover .eco-node-card {
    transform: translateY(-2px);
    border-color: rgba(100,152,222,0.48) !important;
    box-shadow: 0 5px 22px rgba(30,72,185,0.32) !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .eco-orb-halo,.eco-ring1,.eco-ring2,.eco-orb-core { animation: none !important; }
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
            flex: '0 0 62%', width: '62%',
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

            {/* ── SERVICE ECOSYSTEM ──────────────────────────── */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: 0,
              overflow: 'visible',
            }}>
              <div style={{
                position: 'relative',
                width: 'min(100%, clamp(260px,36vw,420px))',
                aspectRatio: '1',
                overflow: 'visible',
              }}>
                {/* SVG — orbital rings, orb, travelling dot, connector lines */}
                <svg viewBox="-220 -220 440 440" width="100%" height="100%"
                  style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
                  <defs>
                    <radialGradient id="eco-orb-grad" cx="38%" cy="32%" r="68%" gradientUnits="objectBoundingBox">
                      <stop offset="0%" stopColor="rgba(18,44,86,0.98)"/>
                      <stop offset="55%" stopColor="rgba(6,20,48,0.99)"/>
                      <stop offset="100%" stopColor="rgba(2,9,20,1)"/>
                    </radialGradient>
                    <radialGradient id="eco-halo-grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(52,98,205,0.26)"/>
                      <stop offset="62%" stopColor="rgba(52,98,205,0.05)"/>
                      <stop offset="100%" stopColor="rgba(52,98,205,0)"/>
                    </radialGradient>
                    <filter id="eco-dot-glow" x="-300%" y="-300%" width="700%" height="700%">
                      <feGaussianBlur stdDeviation="4" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Ambient halo behind orb */}
                  <circle className="eco-orb-halo" cx="0" cy="0" r="108" fill="url(#eco-halo-grad)"/>

                  {/* Orbital ring 1 — outer */}
                  <ellipse className="eco-ring1" cx="0" cy="0" rx="178" ry="50"
                    fill="none" stroke="rgba(72,114,188,0.24)" strokeWidth="1.2"/>
                  {/* Orbital ring 2 — mid */}
                  <ellipse className="eco-ring2" cx="0" cy="0" rx="132" ry="37"
                    fill="none" stroke="rgba(72,114,188,0.15)" strokeWidth="0.8"/>
                  {/* Orbital ring 3 — inner accent */}
                  <ellipse cx="0" cy="0" rx="88" ry="25"
                    fill="none" stroke="rgba(72,114,188,0.08)" strokeWidth="0.6"/>

                  {/* Travelling red dot on outer ring */}
                  {!ecoReducedMotion && (<>
                    <circle r="6.5" fill="rgba(247,25,61,0.18)">
                      <animateMotion dur="7s" repeatCount="indefinite"
                        path="M 178,0 A 178,50 0 1,1 -178,0 A 178,50 0 1,1 178,0"/>
                    </circle>
                    <circle r="3.2" fill="#F7193D" filter="url(#eco-dot-glow)">
                      <animateMotion dur="7s" repeatCount="indefinite"
                        path="M 178,0 A 178,50 0 1,1 -178,0 A 178,50 0 1,1 178,0"/>
                    </circle>
                  </>)}

                  {/* Connector lines — orb edge toward each node */}
                  <line x1="0" y1="-65" x2="0" y2="-168"
                    stroke="rgba(72,114,188,0.22)" strokeWidth="0.8" strokeDasharray="3,5"/>
                  <line x1="-58" y1="-25" x2="-175" y2="-38"
                    stroke="rgba(72,114,188,0.22)" strokeWidth="0.8" strokeDasharray="3,5"/>
                  <line x1="58" y1="-25" x2="175" y2="-38"
                    stroke="rgba(72,114,188,0.22)" strokeWidth="0.8" strokeDasharray="3,5"/>
                  <line x1="-43" y1="46" x2="-148" y2="138"
                    stroke="rgba(72,114,188,0.22)" strokeWidth="0.8" strokeDasharray="3,5"/>
                  <line x1="43" y1="46" x2="148" y2="138"
                    stroke="rgba(72,114,188,0.22)" strokeWidth="0.8" strokeDasharray="3,5"/>

                  {/* Node anchor dots */}
                  <circle cx="0"    cy="-168" r="2.2" fill="rgba(247,25,61,0.58)"/>
                  <circle cx="-175" cy="-38"  r="2.2" fill="rgba(247,25,61,0.58)"/>
                  <circle cx="175"  cy="-38"  r="2.2" fill="rgba(247,25,61,0.58)"/>
                  <circle cx="-148" cy="138"  r="2.2" fill="rgba(247,25,61,0.58)"/>
                  <circle cx="148"  cy="138"  r="2.2" fill="rgba(247,25,61,0.58)"/>

                  {/* Core orb */}
                  <g className="eco-orb-core">
                    <circle cx="0" cy="0" r="65" fill="url(#eco-orb-grad)"/>
                    <circle cx="0" cy="0" r="65" fill="none" stroke="rgba(100,150,220,0.32)" strokeWidth="1.2"/>
                    <circle cx="0" cy="0" r="65" fill="none" stroke="rgba(200,226,255,0.055)" strokeWidth="0.4"/>
                    <ellipse cx="-14" cy="-20" rx="20" ry="13" fill="rgba(148,188,242,0.055)"/>
                    <text x="0" y="-12" textAnchor="middle"
                      fill="rgba(232,242,254,0.92)" fontSize="9.5" fontWeight="700"
                      letterSpacing="0.24em" fontFamily="Inter,system-ui,sans-serif">ANALYTIX</text>
                    <text x="0" y="0" textAnchor="middle"
                      fill="rgba(165,192,230,0.62)" fontSize="5.8" fontWeight="400"
                      letterSpacing="0.07em" fontFamily="Inter,system-ui,sans-serif">Global Professional</text>
                    <text x="0" y="10" textAnchor="middle"
                      fill="rgba(165,192,230,0.62)" fontSize="5.8" fontWeight="400"
                      letterSpacing="0.07em" fontFamily="Inter,system-ui,sans-serif">Services</text>
                    <text x="0" y="24" textAnchor="middle"
                      fill="rgba(118,148,182,0.42)" fontSize="5.2" fontStyle="italic"
                      fontFamily="Playfair Display,Georgia,serif">for a Stronger Tomorrow</text>
                  </g>
                </svg>

                {/* Service nodes — glass cards positioned around the orb */}
                {[
                  { key:'top', title:'AUDIT &\nASSURANCE',        sub:'Independent insight. Greater confidence.',   l:'50%',    t:'11.8%' },
                  { key:'lft', title:'ADVISORY &\nSTRATEGY',      sub:'Practical guidance. Lasting value.',         l:'10.2%',  t:'41.4%' },
                  { key:'rgt', title:'ACCOUNTING\n& TAX',         sub:'Financial clarity. Regulatory confidence.', l:'89.8%',  t:'41.4%' },
                  { key:'btl', title:'BUSINESS &\nCOMPLIANCE',    sub:'Stay compliant. Move forward.',              l:'16.4%',  t:'81.4%' },
                  { key:'btr', title:'GLOBAL BUSINESS\nSERVICES', sub:'Expand. Establish. Thrive.',                 l:'83.6%',  t:'81.4%' },
                ].map(n => (
                  <div key={n.key} className="eco-node" style={{
                    position: 'absolute', left: n.l, top: n.t,
                    transform: 'translateX(-50%) translateY(-50%)',
                  }}>
                    <div className="eco-node-card" style={{
                      background: 'rgba(5,18,44,0.82)',
                      border: '1px solid rgba(72,114,188,0.28)',
                      borderTop: '1px solid rgba(118,160,222,0.38)',
                      borderRadius: 7,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      padding: 'clamp(5px,0.55vw,8px) clamp(7px,0.8vw,11px)',
                      width: 'clamp(82px,8.5vw,116px)',
                      boxShadow: '0 3px 16px rgba(0,5,20,0.5)',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontSize: 'clamp(6.5px,0.62vw,9px)', fontWeight: 700,
                        letterSpacing: '0.1em', color: 'rgba(218,234,252,0.92)',
                        fontFamily: 'Inter,system-ui,sans-serif', lineHeight: 1.3,
                        marginBottom: 3, whiteSpace: 'pre-line',
                      }}>{n.title}</div>
                      <div style={{
                        fontSize: 'clamp(5.5px,0.5vw,7px)', fontWeight: 400,
                        color: 'rgba(138,162,190,0.7)',
                        fontFamily: 'Inter,system-ui,sans-serif', lineHeight: 1.45,
                      }}>{n.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
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
          <div className="a360-right" style={{ flex: '0 0 35%', width: '35%', display: 'flex', alignItems: 'center' }}>
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
                }}>Welcome back</h2>
                <p style={{
                  margin: 'clamp(2px,0.3vw,5px) 0 0',
                  fontSize: 'clamp(9px,0.8vw,12px)', color: 'rgba(145,164,184,0.82)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>Sign in to your AUDIT 360 workspace</p>
              </div>

              {/* Tabs */}
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

              {/* Forgot password */}
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <Link to="/forgot-password" style={{
                  color: '#F7193D', fontSize: 'clamp(9px,0.78vw,11px)',
                  fontFamily: 'Inter, system-ui, sans-serif', textDecoration: 'none', fontWeight: 500,
                }}>Forgot password?</Link>
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
