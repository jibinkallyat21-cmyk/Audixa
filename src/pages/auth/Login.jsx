import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'
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
const IconLockSecure = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(110,160,210,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
  </svg>
)

const BG_SVG = `<svg viewBox="0 0 1708 921" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" aria-hidden="true">
  <defs>
    <pattern id="win" width="9" height="12" patternUnits="userSpaceOnUse">
      <rect x="2" y="3" width="3" height="4" fill="#ffb86b" opacity=".75"/>
      <rect x="6" y="8" width="2" height="3" fill="#8fb4ff" opacity=".5"/>
    </pattern>
    <linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#16294f"/><stop offset="1" stop-color="#0a1530"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#10306a" stop-opacity=".55"/>
      <stop offset=".4" stop-color="#0a1c44" stop-opacity=".6"/>
      <stop offset="1" stop-color="#040916"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5">
      <stop offset=".6" stop-color="#2f7bff" stop-opacity="0"/>
      <stop offset=".85" stop-color="#2f7bff" stop-opacity=".35"/>
      <stop offset="1" stop-color="#2f7bff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="globe" cx=".38" cy=".3" r=".8">
      <stop offset="0" stop-color="#2b6fd6"/>
      <stop offset=".35" stop-color="#123a85"/>
      <stop offset=".75" stop-color="#071636"/>
      <stop offset="1" stop-color="#040b1e"/>
    </radialGradient>
    <radialGradient id="rim" cx=".5" cy=".5" r=".5">
      <stop offset=".9" stop-color="#4fa0ff" stop-opacity="0"/>
      <stop offset=".985" stop-color="#6fb4ff" stop-opacity=".9"/>
      <stop offset="1" stop-color="#4fa0ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="redg" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ff2a45" stop-opacity=".9"/>
      <stop offset="1" stop-color="#ff2a45" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="shade" cx=".4" cy=".35" r=".75">
      <stop offset=".45" stop-color="#040b1e" stop-opacity="0"/>
      <stop offset="1" stop-color="#040b1e" stop-opacity=".75"/>
    </radialGradient>
    <clipPath id="gc"><circle cx="697" cy="485" r="205"/></clipPath>
    <filter id="bl"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <circle cx="697" cy="485" r="205" fill="url(#globe)"/>
  <g clip-path="url(#gc)">
    <g>
      <animateTransform attributeName="transform" type="translate" from="0 0" to="-520 0" dur="28s" repeatCount="indefinite"/>
      <g fill="#4a86d8" opacity=".6">
        <path d="M520 400q30-40 90-35 40-5 70 15l-20 25-40 5-30 40-35-10-30-20z"/>
        <path d="M700 380q50-30 110-5 40 20 30 60l-50 20-30 50-40-30-30-60z" fill="#7aa8e8" opacity=".8"/>
        <path d="M780 470q40 0 60 30l-10 50-40 10-20-40z"/>
        <path d="M600 560q30 20 50 60l-10 40-40-30z"/>
      </g>
      <g fill="#ffc46b">
        <circle cx="740" cy="400" r="1.6"/><circle cx="755" cy="410" r="1.4"/>
        <circle cx="728" cy="395" r="1.2"/><circle cx="770" cy="420" r="1.5"/>
        <circle cx="560" cy="385" r="1.4"/><circle cx="590" cy="375" r="1.2"/>
        <circle cx="800" cy="440" r="1.3"/><circle cx="710" cy="430" r="1.2"/>
        <circle cx="640" cy="372" r="1.3"/>
      </g>
      <g transform="translate(520 0)">
        <g fill="#4a86d8" opacity=".6">
          <path d="M520 400q30-40 90-35 40-5 70 15l-20 25-40 5-30 40-35-10-30-20z"/>
          <path d="M700 380q50-30 110-5 40 20 30 60l-50 20-30 50-40-30-30-60z" fill="#7aa8e8" opacity=".8"/>
          <path d="M780 470q40 0 60 30l-10 50-40 10-20-40z"/>
          <path d="M600 560q30 20 50 60l-10 40-40-30z"/>
        </g>
        <g fill="#ffc46b">
          <circle cx="740" cy="400" r="1.6"/><circle cx="755" cy="410" r="1.4"/>
          <circle cx="728" cy="395" r="1.2"/><circle cx="770" cy="420" r="1.5"/>
          <circle cx="560" cy="385" r="1.4"/><circle cx="590" cy="375" r="1.2"/>
          <circle cx="800" cy="440" r="1.3"/><circle cx="710" cy="430" r="1.2"/>
          <circle cx="640" cy="372" r="1.3"/>
        </g>
      </g>
    </g>
  </g>
  <circle cx="697" cy="485" r="205" fill="url(#shade)"/>
  <path d="M702 152Q900 180 1019 388" fill="none" stroke="#5a8fe0" stroke-opacity=".3" stroke-width="1.2"/>
  <path d="M702 152Q900 180 1019 388" fill="none" stroke="#ff2a45" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="6 14"><animate attributeName="stroke-dashoffset" from="40" to="0" dur="2s" repeatCount="indefinite"/></path>
  <circle r="4" fill="#ff5a70"><animateMotion dur="4s" begin="0s" repeatCount="indefinite" path="M702 152Q900 180 1019 388"/></circle>
  <path d="M1019 388Q1010 540 912 661" fill="none" stroke="#5a8fe0" stroke-opacity=".3" stroke-width="1.2"/>
  <path d="M1019 388Q1010 540 912 661" fill="none" stroke="#ff2a45" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="6 14"><animate attributeName="stroke-dashoffset" from="40" to="0" dur="2s" repeatCount="indefinite"/></path>
  <circle r="4" fill="#ff5a70"><animateMotion dur="4.6s" begin="-1s" repeatCount="indefinite" path="M1019 388Q1010 540 912 661"/></circle>
  <path d="M912 661Q687 780 461 661" fill="none" stroke="#5a8fe0" stroke-opacity=".3" stroke-width="1.2"/>
  <path d="M912 661Q687 780 461 661" fill="none" stroke="#ff2a45" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="6 14"><animate attributeName="stroke-dashoffset" from="40" to="0" dur="2s" repeatCount="indefinite"/></path>
  <circle r="4" fill="#ff5a70"><animateMotion dur="5.2s" begin="-2s" repeatCount="indefinite" path="M912 661Q687 780 461 661"/></circle>
  <path d="M461 661Q410 540 362 385" fill="none" stroke="#5a8fe0" stroke-opacity=".3" stroke-width="1.2"/>
  <path d="M461 661Q410 540 362 385" fill="none" stroke="#ff2a45" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="6 14"><animate attributeName="stroke-dashoffset" from="40" to="0" dur="2s" repeatCount="indefinite"/></path>
  <circle r="4" fill="#ff5a70"><animateMotion dur="5.8s" begin="-3s" repeatCount="indefinite" path="M461 661Q410 540 362 385"/></circle>
  <path d="M362 385Q440 190 702 152" fill="none" stroke="#5a8fe0" stroke-opacity=".3" stroke-width="1.2"/>
  <path d="M362 385Q440 190 702 152" fill="none" stroke="#ff2a45" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="6 14"><animate attributeName="stroke-dashoffset" from="40" to="0" dur="2s" repeatCount="indefinite"/></path>
  <circle r="4" fill="#ff5a70"><animateMotion dur="6.4s" begin="-4s" repeatCount="indefinite" path="M362 385Q440 190 702 152"/></circle>
  <g fill="#070f24" stroke="#ff2a45" stroke-width="1.6">
    <circle cx="702" cy="152" r="36"/>
    <circle cx="1019" cy="388" r="36" stroke="#e9e9ed" stroke-opacity=".8"/>
    <circle cx="362" cy="385" r="36" stroke="#e9e9ed" stroke-opacity=".8"/>
    <circle cx="461" cy="661" r="36"/>
    <circle cx="912" cy="661" r="36"/>
  </g>
  <g fill="none" stroke="#e9e9ed" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M702 135l17 6v13c0 10-8 18-17 21c-9-3-17-11-17-21v-13z"/>
    <path d="M693 153l7 7l13-13"/>
    <path d="M356 392c-5-3-8-7-8-12a14 14 0 0 1 28 0c0 5-3 9-8 12v4h-12zM357 400h10M359 404h6"/>
    <ellipse cx="1019" cy="376" rx="12" ry="5"/>
    <path d="M1007 376v12c0 3 5 5 12 5s12-2 12-5v-12M1007 382c0 3 5 5 12 5s12-2 12-5"/>
    <path d="M451 645h20a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3h-20a3 3 0 0 1-3-3v-26a3 3 0 0 1 3-3zM455 656h12M455 662h12M455 668h8"/>
    <circle cx="912" cy="661" r="16"/>
    <path d="M896 661h32M912 645c-8 8-8 24 0 32M912 645c8 8 8 24 0 32"/>
  </g>
  <g fill="none" stroke="#e9e9ed" stroke-width="1.5">
    <circle cx="78" cy="873" r="12"/>
    <ellipse cx="78" cy="873" rx="5" ry="12"/>
    <path d="M66 873h24"/>
  </g>
  <rect x="1360" y="32" width="33" height="33" rx="16.5" fill="#12224a"/>
  <g fill="none" stroke="#e9e9ed" stroke-width="1.6">
    <rect x="1370" y="48" width="13" height="9" rx="1.5" fill="#e9e9ed"/>
    <path d="M1373 48v-3a3.5 3.5 0 0 1 7 0v3"/>
  </g>
</svg>`

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap');

  .a360-root { font-family: 'Inter', system-ui, sans-serif; }

  @keyframes a360-cardslide {
    from { opacity: 0; transform: translateX(28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes a360-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(247,25,61,0.18), 0 4px 20px rgba(0,0,18,0.6); }
    50%       { box-shadow: 0 0 0 6px rgba(247,25,61,0), 0 4px 20px rgba(0,0,18,0.6); }
  }
  @keyframes a360marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  .a360-card { animation: a360-cardslide 0.75s 0.1s ease both; }
  .a360-ai   { animation: a360-pulse 2.8s 1s ease-in-out infinite; }

  .a360-inp { transition: border-color 0.18s, background 0.18s; }
  .a360-inp:focus { border-color: rgba(80,130,220,0.55) !important; background: rgba(255,255,255,0.09) !important; outline: none; }

  .a360-signin:hover { opacity: 0.88; box-shadow: 0 8px 28px rgba(247,25,61,0.5) !important; }
  .a360-signin:hover .a360-arrow { transform: translateX(3px); }
  .a360-arrow { transition: transform 0.15s ease; }

  .a360-demo:hover { background: rgba(247,25,61,0.08) !important; border-color: rgba(247,25,61,0.65) !important; }

  .a360-tab { transition: color 0.15s; }
  .a360-tab:hover { color: rgba(220,235,255,0.9) !important; }

  @media (max-width: 700px) {
    #bg-outer { aspect-ratio: auto !important; min-height: 100vh; }
    #login-slot {
      position: static !important;
      width: 100% !important;
      height: auto !important;
      padding: 24px 20px !important;
    }
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
  const cardTiltRef = useRef(null)
  const ghost1Ref   = useRef(null)
  const ghost2Ref   = useRef(null)

  const mouseTarget = useRef({ x: 0, y: 0 })
  const mouseCurr   = useRef({ x: 0, y: 0 })
  const rafId       = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const tick = () => {
      const t = mouseTarget.current
      const c = mouseCurr.current
      c.x += (t.x - c.x) * 0.1
      c.y += (t.y - c.y) * 0.1
      const cx = c.x
      const cy = c.y
      if (bgRef.current) bgRef.current.style.transform = `scale(1.06) translate(${-cx * 2}px, ${-cy * 2}px)`
      if (cardTiltRef.current) {
        cardTiltRef.current.style.transform = `perspective(1400px) rotateX(${cy * 6}deg) rotateY(${-cx * 6}deg)`
      }
      if (ghost1Ref.current) ghost1Ref.current.style.transform = `perspective(1400px) rotateX(${cy*4}deg) rotateY(${-cx*4}deg) translate(6px,9px)`
      if (ghost2Ref.current) ghost2Ref.current.style.transform = `perspective(1400px) rotateX(${cy*2.5}deg) rotateY(${-cx*2.5}deg) translate(12px,18px)`
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

  return (
    <PageTransition>
      <style>{CSS}</style>
      <div
        className="a360-root"
        style={{ width: '100vw', minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#050a18', overflow: 'hidden', position: 'relative' }}
        onMouseMove={handleMouseMove}
      >
        <div style={{ width: '100%', containerType: 'inline-size' }}>
          <div
            id="bg-outer"
            style={{
              '--u': 'calc(100cqw / 1708)',
              position: 'relative', width: '100%', aspectRatio: '1708/921', overflow: 'hidden',
              background: 'radial-gradient(ellipse 60% 70% at 40% 50%,#0c1d45 0%,#07122c 45%,#040916 100%)',
              fontFamily: "'Inter',system-ui,sans-serif", color: '#fff',
            }}
          >

            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(4,9,22,.8) 0%,rgba(4,9,22,.55) 30%,rgba(4,9,22,.25) 62%,rgba(4,9,22,.55) 100%),radial-gradient(ellipse 50% 60% at 40% 52%,rgba(4,9,22,.55),rgba(4,9,22,0) 100%)', pointerEvents: 'none' }} />

            {/* SVG: globe, network nodes, animated paths */}
            <div dangerouslySetInnerHTML={{ __html: BG_SVG }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

            {/* ── Text overlays ───────────────────────────────────── */}
            {/* Logo + company name row */}
            <div style={{ position: 'absolute', left: 'calc(60*var(--u))', top: 'calc(22*var(--u))', height: 'calc(72*var(--u))', display: 'flex', alignItems: 'center', gap: 'calc(10*var(--u))' }}>
              <img src="/analytix-icon.png" alt="Analytix" style={{ height: '100%', width: 'auto', pointerEvents: 'none' }} />
              <span style={{ fontSize: 'calc(22*var(--u))', fontWeight: 700, letterSpacing: '.38em', color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1, whiteSpace: 'nowrap' }}>ANALYTIX</span>
            </div>
            <div style={{ position: 'absolute', left: 'calc(60*var(--u))', top: 'calc(86*var(--u))', fontSize: 'calc(82*var(--u))', fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
              AUDIT <span style={{ color: '#ff2a45' }}>360</span>
            </div>
            <div style={{ position: 'absolute', left: 'calc(66*var(--u))', top: 'calc(180*var(--u))', fontFamily: "Georgia,'Times New Roman',serif", fontSize: 'calc(28*var(--u))', lineHeight: 1.2, width: 'calc(370*var(--u))', color: 'rgba(235,242,255,0.92)' }}>
              Clarity across every dimension of your audit.
            </div>
            <div style={{ position: 'absolute', left: 'calc(66*var(--u))', top: 'calc(286*var(--u))', fontSize: 'calc(13*var(--u))', letterSpacing: '.3em', whiteSpace: 'nowrap', color: '#d6d9e6' }}>
              AUDIT &nbsp;·&nbsp; ASSURANCE &nbsp;·&nbsp; RISK &nbsp;·&nbsp; COMPLIANCE
            </div>
            <div style={{ position: 'absolute', left: 'calc(66*var(--u))', top: 'calc(316*var(--u))', width: 'calc(52*var(--u))', height: 'calc(2*var(--u))', background: '#ff2a45' }} />
            <div style={{ position: 'absolute', left: 'calc(1406*var(--u))', top: 'calc(41*var(--u))', fontSize: 'calc(11*var(--u))', letterSpacing: '.25em', whiteSpace: 'nowrap', color: '#d6d9e6' }}>
              SECURE &nbsp;·&nbsp; RELIABLE &nbsp;·&nbsp; GLOBAL
            </div>

            {/* Globe centre label */}
            <div style={{ position: 'absolute', left: 'calc(552*var(--u))', top: 'calc(430*var(--u))', width: 'calc(290*var(--u))', textAlign: 'center' }}>
              <img src="/analytix-icon.png" alt="Analytix" style={{ height: 'calc(60*var(--u))', width: 'auto', margin: '0 auto calc(4*var(--u))', display: 'block' }} />
              <div style={{ fontSize: 'calc(12.5*var(--u))', letterSpacing: '.35em', color: '#c9d2ea', lineHeight: 1.55, marginTop: 'calc(4*var(--u))' }}>GLOBAL PROFESSIONAL SERVICES</div>
              <div style={{ width: 'calc(50*var(--u))', height: 'calc(2*var(--u))', background: '#ff2a45', margin: 'calc(10*var(--u)) auto calc(26*var(--u))' }} />
              <div style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontSize: 'calc(18*var(--u))', lineHeight: 1.3, color: '#e9e9ed' }}>
                Smarter Strategies.<br />Stronger Tomorrow.
              </div>
            </div>

            {/* Node service labels */}
            <div style={{ position: 'absolute', left: 'calc(582*var(--u))', top: 'calc(193*var(--u))', width: 'calc(240*var(--u))', textAlign: 'center', fontSize: 'calc(14*var(--u))', lineHeight: 1.15, color: '#d6d9e6' }}>
              <b style={{ display: 'block', fontSize: 'calc(16*var(--u))', color: '#fff', marginBottom: 'calc(5*var(--u))' }}>AUDIT &amp;<br />ASSURANCE</b>
              Independent insight.<br />Greater confidence.
            </div>
            <div style={{ position: 'absolute', left: 'calc(242*var(--u))', top: 'calc(430*var(--u))', width: 'calc(240*var(--u))', textAlign: 'center', fontSize: 'calc(14*var(--u))', lineHeight: 1.2, color: '#d6d9e6' }}>
              <b style={{ display: 'block', fontSize: 'calc(16*var(--u))', color: '#fff', marginBottom: 'calc(5*var(--u))' }}>ADVISORY &amp;<br />STRATEGY</b>
              Practical guidance.<br />Lasting value.
            </div>
            <div style={{ position: 'absolute', left: 'calc(899*var(--u))', top: 'calc(432*var(--u))', width: 'calc(240*var(--u))', textAlign: 'center', fontSize: 'calc(14*var(--u))', lineHeight: 1.2, color: '#d6d9e6' }}>
              <b style={{ display: 'block', fontSize: 'calc(16*var(--u))', color: '#fff', marginBottom: 'calc(5*var(--u))' }}>ACCOUNTING<br />&amp; TAX</b>
              Financial clarity.<br />Regulatory confidence.
            </div>
            <div style={{ position: 'absolute', left: 'calc(340*var(--u))', top: 'calc(703*var(--u))', width: 'calc(240*var(--u))', textAlign: 'center', fontSize: 'calc(14*var(--u))', lineHeight: 1.2, color: '#d6d9e6' }}>
              <b style={{ display: 'block', fontSize: 'calc(16*var(--u))', color: '#fff', marginBottom: 'calc(5*var(--u))' }}>BUSINESS<br />COMPLIANCE</b>
              Stay compliant.<br />Move forward.
            </div>
            <div style={{ position: 'absolute', left: 'calc(792*var(--u))', top: 'calc(708*var(--u))', width: 'calc(240*var(--u))', textAlign: 'center', fontSize: 'calc(14*var(--u))', lineHeight: 1.2, color: '#d6d9e6' }}>
              <b style={{ display: 'block', fontSize: 'calc(16*var(--u))', color: '#fff', marginBottom: 'calc(5*var(--u))' }}>GLOBAL BUSINESS<br />SERVICES</b>
              Expand. Establish. Thrive.
            </div>

            {/* Global presence ticker */}
            <div style={{ position: 'absolute', left: 'calc(66*var(--u))', top: 'calc(843*var(--u))', width: 'calc(36*var(--u))', height: 'calc(2*var(--u))', background: '#ff2a45' }} />
            <div style={{ position: 'absolute', left: 'calc(116*var(--u))', top: 'calc(839*var(--u))', fontSize: 'calc(10*var(--u))', letterSpacing: '.25em', color: '#c9d2ea' }}>GLOBAL PRESENCE</div>
            <div style={{ position: 'absolute', left: 'calc(116*var(--u))', top: 'calc(865*var(--u))', width: 'calc(900*var(--u))', overflow: 'hidden', fontSize: 'calc(13*var(--u))', color: '#e9e9ed', whiteSpace: 'nowrap', WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 4%,#000 92%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 4%,#000 92%,transparent)' }}>
              <div style={{ display: 'inline-flex', animation: 'a360marquee 30s linear infinite' }}>
                {['Kuwait','Bahrain','Saudi Arabia','United Arab Emirates','Qatar','Oman','India','Singapore','Hong Kong','China','Kuwait','Bahrain','Saudi Arabia','United Arab Emirates','Qatar','Oman','India','Singapore','Hong Kong','China'].map((c, i) => (
                  <span key={i} style={{ paddingRight: 'calc(28*var(--u))' }}>{c} ·</span>
                ))}
              </div>
            </div>
            <div style={{ position: 'absolute', left: 'calc(1390*var(--u))', top: 'calc(873*var(--u))', width: 'calc(28*var(--u))', height: 'calc(2*var(--u))', background: '#ff2a45' }} />
            <div style={{ position: 'absolute', left: 'calc(1432*var(--u))', top: 'calc(867*var(--u))', fontSize: 'calc(10*var(--u))', letterSpacing: '.25em', color: '#c9d2ea', whiteSpace: 'nowrap' }}>
              PEOPLE &nbsp;|&nbsp; INSIGHT &nbsp;|&nbsp; IMPACT
            </div>

            {/* ── LOGIN SLOT ──────────────────────────────────────── */}
            <div
              id="login-slot"
              style={{ position: 'absolute', left: 'calc(1135*var(--u))', top: 'calc(103*var(--u))', width: 'calc(519*var(--u))', height: 'calc(720*var(--u))', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>

                {/* Ghost card 2 — furthest back */}
                <div ref={ghost2Ref} style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(2,8,20,0.48)',
                  border: '1px solid rgba(130,170,220,0.14)',
                  borderTop: '1px solid rgba(180,215,255,0.20)',
                  borderRadius: 14,
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 50px rgba(0,4,14,0.62)',
                  willChange: 'transform', pointerEvents: 'none',
                  transform: 'translate(12px,18px)',
                }} />

                {/* Ghost card 1 — mid depth */}
                <div ref={ghost1Ref} style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(3,10,24,0.60)',
                  border: '1px solid rgba(130,170,220,0.16)',
                  borderTop: '1px solid rgba(180,215,255,0.24)',
                  borderRadius: 14,
                  backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 36px rgba(0,4,14,0.52)',
                  willChange: 'transform', pointerEvents: 'none',
                  transform: 'translate(6px,9px)',
                }} />

                {/* 3D tilt wrapper */}
                <div ref={cardTiltRef} style={{ width: '100%', height: '100%', willChange: 'transform', transformOrigin: 'center center' }}>
                  <div
                    className="a360-card"
                    style={{
                      width: '100%', height: '100%',
                      background: 'rgba(3,11,26,0.72)',
                      border: '1px solid rgba(130,170,220,0.18)',
                      borderTop: '1px solid rgba(180,215,255,0.28)',
                      borderLeft: '1px solid rgba(140,180,230,0.14)',
                      borderRadius: 14,
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
                      padding: 'clamp(18px,2.2vw,28px)',
                      gap: 'clamp(8px,0.9vw,13px)',
                      overflowY: 'auto', overflowX: 'hidden',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Card header */}
                    <div>
                      <h2 style={{
                        margin: 0,
                        fontSize: 'clamp(16px,1.9vw,24px)', fontWeight: 800, color: '#F5F7FA',
                        fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.15,
                      }}>{fpMode ? 'Reset Password' : 'Welcome back'}</h2>
                      <p style={{
                        margin: 'clamp(2px,0.3vw,5px) 0 0',
                        fontSize: 'clamp(9px,0.8vw,12px)', color: 'rgba(145,164,184,0.82)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}>{fpMode ? 'Enter your work email to receive a reset link' : 'Sign in to your AUDIT 360 workspace'}</p>
                    </div>

                    {/* ── FORGOT PASSWORD VIEW ── */}
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

                    {/* ── LOGIN FORM ── */}
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

                    {error && (
                      <div role="alert" style={{
                        background: 'rgba(140,15,25,0.82)',
                        border: '1px solid rgba(255,80,90,0.3)',
                        borderRadius: 6, padding: '5px 10px',
                        color: '#fff', fontSize: 'clamp(9px,0.78vw,11px)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}>{error}</div>
                    )}

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

                    {/* DEMO ACCESS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(65,105,200,0.16)' }} />
                      <span style={{
                        fontSize: 'clamp(7px,0.65vw,9px)', letterSpacing: '0.16em',
                        color: 'rgba(97,117,139,0.65)', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600,
                      }}>DEMO ACCESS</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(65,105,200,0.16)' }} />
                    </div>

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

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 2 }}>
                      <IconLockSecure />
                      <span style={{
                        fontSize: 'clamp(8px,0.68vw,10px)', color: 'rgba(97,117,139,0.6)',
                        fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.04em',
                      }}>Secure encrypted connection</span>
                    </div>
                  </div>
                </div>{/* /tilt wrapper */}
              </div>
            </div>{/* /login-slot */}

          </div>
        </div>

        {/* Floating AI assistant */}
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
