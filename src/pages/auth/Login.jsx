import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'

const DEMO_ROLES = ROLE_ORDER.map(id => ({
  value: ROLES[id].id,
  label: ROLES[id].label,
  route: ROLES[id].route,
}))

// ── Overlay CSS ───────────────────────────────────────────────────
const CSS = `
  .ov-inp {
    background: transparent;
    border: none;
    outline: none;
    color: rgba(232,240,252,0.92);
    font-family: Inter, system-ui, sans-serif;
    font-size: 13px;
    width: 100%;
    height: 100%;
    padding: 0 56px 0 38px;
    caret-color: #4a9eff;
    position: absolute;
    left: 0; top: 0;
    box-sizing: border-box;
  }
  .ov-inp::placeholder { color: transparent; }
  .ov-inp:focus { outline: none; }

  .ov-sel {
    background: transparent;
    border: none;
    outline: none;
    color: rgba(232,240,252,0.90);
    font-family: Inter, system-ui, sans-serif;
    font-size: 13px;
    width: 100%;
    height: 100%;
    padding: 0 36px 0 38px;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    position: absolute;
    left: 0; top: 0;
    box-sizing: border-box;
  }
  .ov-sel option { background: #08182A; color: #e8f0fc; }

  .ov-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    position: absolute;
    left: 0; top: 0;
    width: 100%; height: 100%;
    padding: 0;
  }

  .ov-link {
    display: block;
    position: absolute;
    left: 0; top: 0;
    width: 100%; height: 100%;
  }
`

export default function Login() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('client')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [demoRole, setDemoRole]       = useState(DEMO_ROLES[0].value)
  const [error, setError]             = useState('')
  const scaleRef = useRef(null)

  // Scale the 1790×879 canvas to fit the viewport uniformly
  useEffect(() => {
    const el = scaleRef.current
    if (!el) return
    const update = () => {
      const s = Math.min(window.innerWidth / 1790, window.innerHeight / 879)
      el.style.transform = `scale(${s})`
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const doSignIn = () => {
    if (!email.trim() || !password) {
      setError('Please enter your work email and password.')
      return
    }
    setError('')
    const role = DEMO_ROLES.find(r => r.value === demoRole) || DEMO_ROLES[0]
    navigate(role.route)
  }

  const handleEnterDemo = () => {
    const role = DEMO_ROLES.find(r => r.value === demoRole) || DEMO_ROLES[0]
    navigate(role.route)
  }

  // Absolute-position helper: returns style for a 1790×879-space element
  const at = (left, top, width, height, extra) => ({
    position: 'absolute', left, top, width, height, ...extra,
  })

  return (
    <PageTransition>
      <style>{CSS}</style>

      {/* Viewport shell — centers and clips the canvas */}
      <div style={{
        width: '100vw', height: '100vh',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#020914',
      }}>
        {/* ── 1790×879 master canvas — scales as one unit ── */}
        <div
          ref={scaleRef}
          style={{
            position: 'relative',
            width: 1790, height: 879,
            flexShrink: 0,
            transformOrigin: 'center center',
          }}
        >
          {/* ════════════════════════════════════════════════════════
              COMPLETE VISUAL LAYER — reference image, unmodified
              ════════════════════════════════════════════════════════ */}
          <img
            src="/login-bg.webp"
            alt="Analytix Audit 360"
            draggable={false}
            style={{
              position: 'absolute', left: 0, top: 0,
              width: 1790, height: 879,
              display: 'block',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />

          {/* ════════════════════════════════════════════════════════
              FUNCTIONAL OVERLAY LAYER — transparent, positioned
              over the corresponding visual elements in the image
              ════════════════════════════════════════════════════════ */}

          {/* ── Tabs ── */}
          <div style={at(1042, 208, 122, 30)}>
            <button
              type="button"
              className="ov-btn"
              onClick={() => setAccountType('client')}
              aria-label="Client Portal"
            />
          </div>
          <div style={at(1180, 208, 135, 30)}>
            <button
              type="button"
              className="ov-btn"
              onClick={() => setAccountType('team')}
              aria-label="Analytix Team"
            />
          </div>

          {/* ── Work email input ── */}
          <div style={at(1042, 263, 480, 40, { overflow: 'hidden' })}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && doSignIn()}
              autoComplete="username"
              className="ov-inp"
              aria-label="Work email"
            />
          </div>

          {/* ── Password input ── */}
          <div style={at(1042, 330, 480, 40, { overflow: 'hidden' })}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && doSignIn()}
              autoComplete="current-password"
              className="ov-inp"
              aria-label="Password"
            />
          </div>

          {/* ── Show/Hide password toggle ── */}
          <div style={at(1452, 330, 70, 40)}>
            <button
              type="button"
              className="ov-btn"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            />
          </div>

          {/* ── Forgot password link ── */}
          <div style={at(1418, 383, 126, 22)}>
            <Link
              to="/forgot-password"
              className="ov-link"
              aria-label="Forgot password"
            />
          </div>

          {/* ── Sign In button ── */}
          <div style={at(1042, 412, 480, 52)}>
            <button
              type="button"
              className="ov-btn"
              onClick={doSignIn}
              aria-label="Sign In"
            />
          </div>

          {/* ── Preview as role select ── */}
          <div style={at(1042, 496, 480, 44, { overflow: 'hidden' })}>
            <select
              value={demoRole}
              onChange={e => setDemoRole(e.target.value)}
              className="ov-sel"
              aria-label="Preview as role"
            >
              {DEMO_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* ── Enter Demo button ── */}
          <div style={at(1042, 549, 480, 52)}>
            <button
              type="button"
              className="ov-btn"
              onClick={handleEnterDemo}
              aria-label="Enter Demo"
            />
          </div>

          {/* ── Error message (shown when validation fails) ── */}
          {error && (
            <div style={{
              position: 'absolute', left: 1042, top: 476, width: 480, zIndex: 200,
              background: 'rgba(100,10,18,0.92)',
              border: '1px solid rgba(255,70,80,0.35)',
              borderRadius: 6, padding: '5px 10px',
              color: '#ffd0d5', fontSize: 12,
              fontFamily: 'Inter, system-ui, sans-serif',
              pointerEvents: 'none',
            }}>{error}</div>
          )}

          {/* ── Create account link (team tab) ── */}
          {accountType === 'team' && (
            <div style={at(1042, 615, 480, 24)}>
              <Link to="/signup" className="ov-link" aria-label="Create account" />
            </div>
          )}

          {/* ── Country links — transparent strip over ticker ── */}
          {/* United States */}
          <div style={at(228, 724, 96, 22)}>
            <a href="#" className="ov-link" aria-label="United States" onClick={e => e.preventDefault()} />
          </div>
          {/* United Kingdom */}
          <div style={at(336, 724, 94, 22)}>
            <a href="#" className="ov-link" aria-label="United Kingdom" onClick={e => e.preventDefault()} />
          </div>
          {/* France */}
          <div style={at(442, 724, 56, 22)}>
            <a href="#" className="ov-link" aria-label="France" onClick={e => e.preventDefault()} />
          </div>
          {/* Kuwait */}
          <div style={at(510, 724, 58, 22)}>
            <a href="#" className="ov-link" aria-label="Kuwait" onClick={e => e.preventDefault()} />
          </div>
          {/* Bahrain */}
          <div style={at(580, 724, 60, 22)}>
            <a href="#" className="ov-link" aria-label="Bahrain" onClick={e => e.preventDefault()} />
          </div>
          {/* Saudi Arabia */}
          <div style={at(652, 724, 82, 22)}>
            <a href="#" className="ov-link" aria-label="Saudi Arabia" onClick={e => e.preventDefault()} />
          </div>
          {/* United Arab Emirates */}
          <div style={at(746, 724, 136, 22)}>
            <a href="#" className="ov-link" aria-label="United Arab Emirates" onClick={e => e.preventDefault()} />
          </div>
          {/* Qatar */}
          <div style={at(894, 724, 52, 22)}>
            <a href="#" className="ov-link" aria-label="Qatar" onClick={e => e.preventDefault()} />
          </div>
          {/* Oman */}
          <div style={at(958, 724, 46, 22)}>
            <a href="#" className="ov-link" aria-label="Oman" onClick={e => e.preventDefault()} />
          </div>
          {/* China */}
          <div style={at(1016, 724, 48, 22)}>
            <a href="#" className="ov-link" aria-label="China" onClick={e => e.preventDefault()} />
          </div>
          {/* Hong Kong */}
          <div style={at(1076, 724, 76, 22)}>
            <a href="#" className="ov-link" aria-label="Hong Kong" onClick={e => e.preventDefault()} />
          </div>
          {/* India */}
          <div style={at(1164, 724, 46, 22)}>
            <a href="#" className="ov-link" aria-label="India" onClick={e => e.preventDefault()} />
          </div>
          {/* Singapore */}
          <div style={at(1222, 724, 72, 22)}>
            <a href="#" className="ov-link" aria-label="Singapore" onClick={e => e.preventDefault()} />
          </div>

          {/* ── Social media links (bottom right) ── */}
          <div style={at(1349, 706, 32, 32)}>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="ov-link" aria-label="LinkedIn" />
          </div>
          <div style={at(1397, 706, 32, 32)}>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="ov-link" aria-label="X / Twitter" />
          </div>
          <div style={at(1447, 706, 32, 32)}>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="ov-link" aria-label="YouTube" />
          </div>
          <div style={at(1497, 706, 32, 32)}>
            <a href="https://analytix.com" target="_blank" rel="noopener noreferrer" className="ov-link" aria-label="Website" />
          </div>

        </div>
      </div>
    </PageTransition>
  )
}
