import { Fragment, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'
import { ROLES, ROLE_ORDER } from '../../data/sampleData'
import { fxCss, fxClass, initFx, morph, dolly } from './loginFx'
import { setPortal } from '../../utils/portalSession'

const PLACES = ['Kuwait', 'Bahrain', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Oman', 'India', 'Singapore', 'Hong Kong', 'China']

// Sign-in tab → portal. Demo options come from the app's role list.
const TAB_ROLES = { client: ROLES.client, team: ROLES['execution-team'] }
const DEMO_ROLES = ROLE_ORDER.map(id => ({
  value: ROLES[id].id,
  label: id === 'managerial' ? 'Partner' : ROLES[id].label,
  route: ROLES[id].route,
  portal: ROLES[id].route.split('/')[1],
}))

function Letters({ text, from = 0 }) {
  return [...text].map((c, i) => <span key={i} className="ch" style={{ '--i': from + i }} aria-hidden="true">{c}</span>)
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500&display=swap');
#l360,#l360 *,#l360 *::before,#l360 *::after{box-sizing:border-box}
#l360{background:#060b1a;color:#e9ecf5;font-family:'Inter',system-ui,sans-serif;font-size:16px;line-height:normal;min-height:100vh;-webkit-font-smoothing:auto}
#l360 button{font:inherit;cursor:pointer;transition:none}
#l360 button:not(:disabled):active{transform:none}
#l360 .page{position:relative;height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden}
#l360 .bg{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;object-position:62% 50%;animation:l360-drift 30s ease-in-out infinite alternate}
#l360 .shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,9,22,.94) 0%,rgba(5,9,22,.78) 34%,rgba(5,9,22,.2) 68%,rgba(5,9,22,.35) 100%),linear-gradient(180deg,rgba(5,9,22,.55) 0%,rgba(5,9,22,0) 22%,rgba(5,9,22,0) 55%,rgba(5,9,22,.92) 100%)}
#l360 header{position:relative;display:flex;align-items:center;gap:14px;padding:clamp(14px,3.2vh,28px) clamp(20px,5vw,72px)}
#l360 header img{height:40px;width:auto;display:block}
#l360 header span{font-size:18px;letter-spacing:.38em;font-weight:500;color:#fff}
#l360 main{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:clamp(8px,5.4vh,48px) clamp(20px,5vw,72px) clamp(12px,7.2vh,64px)}
#l360 .hero{max-width:720px;animation:l360-up .8s ease both}
#l360 .kicker{display:flex;align-items:center;gap:14px;margin-bottom:clamp(10px,2.9vh,26px)}
#l360 .kicker i{width:36px;height:2px;background:#f2434f}
#l360 .kicker span{font-size:13px;letter-spacing:.2em;color:#c9d0e4;white-space:nowrap}
#l360 h1{margin:0;font-size:clamp(44px,min(9vw,14.5vh),128px);line-height:.95;font-weight:700;letter-spacing:-.035em;color:#fff}
#l360 h1 em{font-style:normal;color:#f2434f}
#l360 .tag{margin:clamp(10px,3.1vh,28px) 0 0;font-family:'Playfair Display',Georgia,serif;font-size:clamp(20px,min(3vw,4.8vh),42px);line-height:1.2;color:#eef1f9;max-width:520px}
#l360 .cta{margin-top:clamp(16px,4.9vh,44px);display:flex;align-items:center;gap:28px;flex-wrap:wrap}
#l360 .btn-main{font-weight:600;font-size:17px;color:#fff;background:#e5303d;border:0;border-radius:10px;padding:16px 32px;white-space:nowrap;flex-shrink:0;display:flex;align-items:center;gap:12px;box-shadow:0 14px 40px rgba(229,48,61,.4)}
#l360 .btn-main:hover{background:#f2434f}
#l360 .link{font-size:16px;color:#dfe4f2;background:none;border:0;padding:8px 0;white-space:nowrap;flex-shrink:0;text-decoration:underline;text-underline-offset:5px;text-decoration-color:rgba(255,255,255,.35)}
#l360 .link:hover{color:#fff}
#l360 :focus-visible{outline:2px solid #ff6b7a;outline-offset:3px;box-shadow:none}
#l360 .link:focus-visible,#l360 .quiet:focus-visible,#l360 .back:focus-visible,#l360 .row button:focus-visible{border-radius:0}
#l360 .strip{position:relative;padding:0 clamp(20px,5vw,72px) clamp(10px,3.1vh,28px);animation:l360-up 1s .2s ease both}
#l360 .services{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:clamp(10px,2.7vh,24px) 32px}
#l360 .svc{border-top:1px solid rgba(255,255,255,.22);padding-top:clamp(6px,1.8vh,16px)}
#l360 .svc small{display:block;font-size:13px;letter-spacing:.16em;color:#ff6b7a}
#l360 .svc b{display:block;margin-top:8px;font-size:17px;font-weight:600;color:#fff}
#l360 .svc p{margin:4px 0 0;font-size:15px;color:#c3cadf;line-height:1.4}
#l360 .presence{margin-top:clamp(10px,3.1vh,28px);display:flex;align-items:center;gap:32px;font-size:14px;color:#aab3cc}
#l360 .presence>span{flex-shrink:0;font-size:12px;letter-spacing:.22em;color:#c9d0e4;white-space:nowrap}
#l360 .mqwrap{flex:1;min-width:0;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
#l360 .mq{display:inline-flex;white-space:nowrap;animation:l360-marquee 32s linear infinite}
#l360 .mq span.sep{margin:0 20px;color:#ff6b7a}
#l360 .backdrop{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(4,8,20,.66);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
#l360 .backdrop.open{display:flex;animation:l360-fade .25s ease both}
#l360 .card{position:relative;width:min(100%,440px);max-height:calc(100vh - 40px);overflow:auto;background:linear-gradient(180deg,rgba(18,30,64,.92),rgba(10,18,40,.94));border:1px solid rgba(190,205,240,.2);border-radius:16px;padding:36px;box-shadow:0 40px 100px rgba(0,0,0,.6);animation:l360-rise .35s cubic-bezier(.2,.8,.2,1) both}
#l360 .card.shake{animation:l360-shake .4s}
#l360 .x{position:absolute;top:14px;right:14px;width:36px;height:36px;color:#b4bbd0;background:none;border:0;border-radius:8px;font-size:22px;line-height:1;padding:0}
#l360 .picks{display:flex;flex-direction:column;gap:14px}
#l360 .pick{display:flex;align-items:center;gap:16px;width:100%;text-align:left;color:#fff;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid rgba(180,195,235,.28);border-radius:12px;padding:16px 18px;box-shadow:0 12px 30px rgba(0,0,0,.35);transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease}
#l360 .pick:hover{transform:translateY(-3px);border-color:#f2434f;background:rgba(242,67,79,.12);box-shadow:0 18px 40px rgba(229,48,61,.25)}
#l360 .pick .ico{flex-shrink:0;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ff6b7a;background:rgba(242,67,79,.14);border:1px solid rgba(242,67,79,.4)}
#l360 .pick .txt{flex:1;min-width:0}
#l360 .pick b{display:block;font-size:17px;font-weight:600}
#l360 .pick small{display:block;margin-top:3px;font-size:13px;color:#b4bbd0;line-height:1.35}
#l360 .pick .go-ar{flex-shrink:0;font-size:20px;color:#ff6b7a}
#l360 .x:hover{background:rgba(255,255,255,.08);color:#fff}
#l360 .view{display:none;animation:l360-swap .3s ease both}
#l360 .view.on{display:block}
#l360 h2{margin:0;font-size:30px;font-weight:600;color:#fff;letter-spacing:-.01em}
#l360 .sub{margin:4px 0 22px;font-size:15px;color:#b4bbd0;line-height:1.45}
#l360 label{display:block;font-size:14px;font-weight:500;color:#dfe3ef;margin-bottom:8px}
#l360 .row{display:flex;justify-content:space-between;align-items:baseline;margin:16px 0 8px}
#l360 .row label{margin:0}
#l360 .row button{font-size:14px;color:#ff6b7a;background:none;border:0;padding:0}
#l360 .row button:hover{color:#ffb3b8;text-decoration:underline}
#l360 input,#l360 select{width:100%;height:48px;padding:0 14px;font:inherit;font-size:16px;color:#fff!important;background:rgba(255,255,255,.05)!important;border:1px solid rgba(180,195,235,.28)!important;border-radius:8px;outline:none}
#l360 input::placeholder{color:revert!important}
#l360 select{background:#18254f!important;padding:0 12px}
#l360 input:focus{border-color:#f2434f!important;box-shadow:0 0 0 3px rgba(242,67,79,.25)}
#l360 .pw{position:relative}
#l360 .pw input{padding-right:64px}
#l360 .show{position:absolute;right:6px;top:6px;height:36px;padding:0 10px;font-size:14px;color:#ff6b7a;background:none;border:0;border-radius:6px}
#l360 .show:hover{background:rgba(255,255,255,.08)}
#l360 .err{display:none;margin-top:14px;font-size:14px;color:#ff9aa1;line-height:1.4}
#l360 .err.on{display:block}
#l360 .go{margin-top:22px;width:100%;height:52px;font-size:16px;font-weight:600;color:#fff;background:#e5303d;border:0;border-radius:8px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 28px rgba(229,48,61,.35)}
#l360 .go:hover{background:#f2434f}
#l360 .go:disabled{opacity:.7;cursor:default}
#l360 .go.ghost{background:transparent;border:1px solid #f2434f;box-shadow:none}
#l360 .go.ghost:hover{background:rgba(242,67,79,.2)}
#l360 .spin{display:none;width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;animation:l360-spin .7s linear infinite}
#l360 .loading .spin{display:block}
#l360 .create{display:none;align-items:center;justify-content:center;gap:6px;margin-top:16px;padding-top:12px;border-top:1px solid rgba(180,195,235,.2);font-size:14px;color:#b4bbd0}
#l360 .create.on{display:flex}
#l360 .create a{color:#ff6b7a;font-weight:600;text-decoration:none}
#l360 .create a:hover{color:#ffb3b8;text-decoration:underline}
#l360 .quiet{margin-top:14px;width:100%;font-size:15px;color:#b4bbd0;background:none;border:0;padding:6px}
#l360 .quiet:hover{color:#fff}
#l360 .back{margin-top:16px;font-size:15px;color:#ff6b7a;background:none;border:0;padding:6px 0}
#l360 .change{margin:-6px 0 14px;display:block}
#l360 .secure{margin-top:10px;text-align:center;font-size:13px;color:#a2abc4}
#l360 .done{padding:28px 0;text-align:center}
#l360 .done .ok{width:56px;height:56px;margin:0 auto 18px;border-radius:50%;border:2px solid #f2434f;display:flex;align-items:center;justify-content:center;font-size:26px;color:#f2434f}
#l360 .done b{display:block;font-size:24px;font-weight:500;color:#fff}
#l360 .done p{margin:6px 0 0;font-size:15px;color:#b4bbd0}
@media (max-height:760px){#l360 .svc p{display:none}#l360 .svc b{margin-top:4px}}
@media (max-width:760px){#l360 .kicker{gap:10px}#l360 .kicker i{flex-shrink:0;width:24px}#l360 .kicker span{font-size:11px;letter-spacing:.1em}#l360 .services{grid-template-columns:1fr 1fr;gap:10px 16px}#l360 .svc p,#l360 .svc small{display:none}#l360 .svc b{margin-top:0;font-size:14px}#l360 .presence{gap:14px}#l360 .btn-main{padding:14px 22px;font-size:16px}}
@media (max-width:360px){#l360 .kicker span{font-size:10px;letter-spacing:.06em}}
@media (max-height:520px){#l360 .services{display:none}}
@media (max-height:680px){#l360 .card{padding:20px 24px}#l360 h2{font-size:24px}#l360 .sub{margin:2px 0 12px;font-size:14px}#l360 label{margin-bottom:4px}#l360 .row{margin:8px 0 4px}#l360 input,#l360 select{height:40px}#l360 .show{top:2px}#l360 .go{margin-top:12px;height:44px}#l360 .create{margin-top:8px;padding-top:6px}#l360 .quiet{margin-top:6px;padding:4px}#l360 .secure{margin-top:4px}#l360 .err{margin-top:8px}#l360 .x{top:8px;right:8px}#l360 .picks{gap:10px}#l360 .pick{padding:10px 14px}#l360 .pick .ico{width:38px;height:38px}#l360 .pick small{display:none}}
@media (max-height:430px){#l360 .secure{display:none}#l360 .card{padding:10px 22px}#l360 h2{font-size:22px}#l360 input,#l360 select{height:36px}#l360 .show{top:0}#l360 .sub{margin-bottom:8px}#l360 .go{margin-top:8px;height:40px}#l360 .create{margin-top:6px;padding-top:4px;font-size:13px}}
@media (max-height:380px){#l360 .sub{display:none}#l360 h2{margin-bottom:8px}}
@keyframes l360-rise{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
@keyframes l360-fade{from{opacity:0}to{opacity:1}}
@keyframes l360-shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
@keyframes l360-spin{to{transform:rotate(360deg)}}
@keyframes l360-swap{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes l360-drift{from{transform:scale(1.06) translateX(0)}to{transform:scale(1.06) translateX(-1.5%)}}
@keyframes l360-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
@keyframes l360-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){#l360 .mq,#l360 .bg,#l360 .hero,#l360 .strip{animation:none!important}}
`

export default function Login() {
  const navigate = useNavigate()
  const root = useRef(null)
  const timers = useRef([])

  useEffect(() => initFx(root.current), [])

  useEffect(() => {
    const rootEl = root.current
    const $ = id => rootEl.querySelector('#' + id)
    const backdrop = $('backdrop')
    const card = $('card')
    let lastFocus = null
    let tab = 'client'
    let timer = null

    function later(fn, ms) {
      const t = setTimeout(fn, ms)
      timers.current.push(t)
      return t
    }
    function view(name, focusId) {
      morph(card, () => {
        ;['choose', 'signin', 'forgot', 'demo', 'done'].forEach(n => $('v-' + n).classList.toggle('on', n === name))
        card.dataset.view = name
      })
      $('err').classList.remove('on')
      if (focusId) later(() => { const el = $(focusId); if (el) el.focus() }, 80)
    }
    function setTab(t) {
      tab = t
      $('create').classList.toggle('on', t === 'team')
      $('si-sub').textContent = t === 'team' ? 'Sign in to your Analytix team workspace' : 'Sign in to your AUDIT 360 client portal'
    }
    function open(name, t) {
      lastFocus = document.activeElement
      if (t) setTab(t)
      backdrop.classList.add('open')
      view(name, name === 'demo' ? 'dr' : name === 'choose' ? 'pick-client' : 'em')
    }
    function close() {
      clearTimeout(timer)
      backdrop.classList.remove('open')
      $('go').classList.remove('loading')
      $('go').disabled = false
      $('go-label').textContent = 'Sign in'
      if (lastFocus && lastFocus.focus) lastFocus.focus()
    }
    function fail(msg, id) {
      const e = $('err')
      e.textContent = msg
      e.classList.add('on')
      card.classList.remove('shake')
      void card.offsetWidth
      card.classList.add('shake')
      $(id).focus()
    }
    function enter(route, portal) {
      setPortal(portal)
      view('done')
      dolly(rootEl)
      later(() => navigate(route), 1100)
    }

    $('open-signin').onclick = () => open('choose')
    $('open-demo').onclick = () => open('demo')
    $('pick-client').onclick = () => { setTab('client'); view('signin', 'em') }
    $('pick-team').onclick = () => { setTab('team'); view('signin', 'em') }
    $('close').onclick = close
    const onBackdrop = e => { if (e.target === backdrop) close() }
    backdrop.addEventListener('click', onBackdrop)
    const onKey = e => { if (e.key === 'Escape' && backdrop.classList.contains('open')) close() }
    document.addEventListener('keydown', onKey)
    rootEl.querySelectorAll('[data-go]').forEach(b => {
      b.onclick = () => {
        const g = b.dataset.go
        view(g, g === 'forgot' ? 'fe' : g === 'demo' ? 'dr' : 'em')
      }
    })
    $('change').onclick = () => view('choose', tab === 'team' ? 'pick-team' : 'pick-client')

    $('show').onclick = function () {
      const p = $('pw')
      const hide = p.type === 'password'
      p.type = hide ? 'text' : 'password'
      this.textContent = hide ? 'Hide' : 'Show'
    }

    const onSubmit = e => {
      e.preventDefault()
      const email = $('em').value.trim()
      const pw = $('pw').value
      if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid work email address.', 'em')
      if (!pw) return fail('Enter your password.', 'pw')
      $('err').classList.remove('on')
      $('go').classList.add('loading')
      $('go').disabled = true
      $('go-label').textContent = 'Signing in…'
      timer = later(() => {
        const n = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        $('welcome').textContent = 'Welcome, ' + n
        enter(TAB_ROLES[tab].route, TAB_ROLES[tab].route.split('/')[1])
      }, 1400)
    }
    $('v-signin').addEventListener('submit', onSubmit)

    $('send-reset').onclick = () => {
      const email = $('fe').value.trim()
      if (!/^\S+@\S+\.\S+$/.test(email)) { $('fe').focus(); return }
      $('forgot-text').textContent = 'If an account exists for ' + email + ', a reset link is on its way.'
      $('forgot-form').style.display = 'none'
    }

    $('enter-demo').onclick = () => {
      const sel = $('dr')
      $('welcome').textContent = 'Welcome, ' + sel.options[sel.selectedIndex].text
      const role = DEMO_ROLES.find(r => r.value === sel.value)
      enter(role.route, role.portal)
    }

    const pending = timers.current
    return () => {
      document.removeEventListener('keydown', onKey)
      backdrop.removeEventListener('click', onBackdrop)
      $('v-signin').removeEventListener('submit', onSubmit)
      pending.forEach(clearTimeout)
    }
  }, [navigate])

  return (
    <PageTransition>
      <style>{CSS + fxCss}</style>
      <div id="l360" className={fxClass} ref={root}>
        <div className="page">
          <img className="bg" src="/arch-bg.webp" alt="" />
          <div className="shade"></div>

          <header><img src="/analytix-icon.png" alt="" /><span>ANALYTIX</span></header>

          <main>
            <div className="hero">
              <div className="kicker rv" style={{ '--d': '.05s' }}><i></i><span>AUDIT · ASSURANCE · RISK · COMPLIANCE</span></div>
              <h1 aria-label="AUDIT 360"><Letters text="AUDIT" /> <em><Letters text="360" from={6} /></em></h1>
              <p className="tag rv" style={{ '--d': '.85s' }}>Clarity across every dimension of your audit.</p>
              <div className="cta rv" style={{ '--d': '1.05s' }}>
                <button className="btn-main" id="open-signin">Sign in to your workspace <span aria-hidden="true">→</span></button>
                <button className="link" id="open-demo">Explore the demo</button>
              </div>
            </div>
          </main>

          <section className="strip">
            <div className="services">
              <div className="svc"><small>01</small><b>Audit &amp; Assurance</b><p>Independent insight. Greater confidence.</p></div>
              <div className="svc"><small>02</small><b>Advisory &amp; Strategy</b><p>Practical guidance. Lasting value.</p></div>
              <div className="svc"><small>03</small><b>Accounting &amp; Tax</b><p>Financial clarity. Regulatory confidence.</p></div>
              <div className="svc"><small>04</small><b>Business Compliance</b><p>Stay compliant. Move forward.</p></div>
              <div className="svc"><small>05</small><b>Global Business Services</b><p>Expand. Establish. Thrive.</p></div>
            </div>
            <div className="presence">
              <span>GLOBAL PRESENCE</span>
              <div className="mqwrap">
                <div className="mq" id="mq">
                  {PLACES.concat(PLACES).map((p, i) => (
                    <Fragment key={i}><span>{p}</span><span className="sep">·</span></Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="backdrop" id="backdrop">
            <div className="card" id="card" role="dialog" aria-modal="true" aria-label="Sign in">
              <button className="x" id="close" aria-label="Close">×</button>

              <div className="view on" id="v-choose">
                <h2>Choose your portal</h2>
                <p className="sub">Select how you'll be signing in to AUDIT 360</p>
                <div className="picks">
                  <button type="button" className="pick" id="pick-client">
                    <span className="ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg></span>
                    <span className="txt"><b>I'm a Client</b><small>Engagement tracker, documents and audit queries</small></span>
                    <span className="go-ar" aria-hidden="true">→</span>
                  </button>
                  <button type="button" className="pick" id="pick-team">
                    <span className="ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2 .8 3.5 2.6 3.5 5.6"/></svg></span>
                    <span className="txt"><b>I'm a Team Member</b><small>Audit, advisory and operations professionals</small></span>
                    <span className="go-ar" aria-hidden="true">→</span>
                  </button>
                </div>
              </div>

              <form className="view" id="v-signin" noValidate>
                <h2>Welcome back</h2>
                <p className="sub" id="si-sub">Sign in to your AUDIT 360 client portal</p>
                <button type="button" className="back change" id="change">← Change portal</button>
                <label htmlFor="em">Work email</label>
                <input id="em" type="email" autoComplete="username" placeholder="you@analytix.com" />
                <div className="row"><label htmlFor="pw">Password</label><button type="button" data-go="forgot">Forgot password?</button></div>
                <div className="pw">
                  <input id="pw" type="password" autoComplete="current-password" placeholder="Enter your password" />
                  <button type="button" className="show" id="show">Show</button>
                </div>
                <div className="err" id="err" role="alert"></div>
                <button type="submit" className="go" id="go"><span className="spin"></span><span id="go-label">Sign in</span></button>
                <div className="create" id="create">
                  <span>New to Analytix Team?</span>
                  <Link to="/signup">Create account <span aria-hidden="true">→</span></Link>
                </div>
                <button type="button" className="quiet" data-go="demo">Explore the demo</button>
                <div className="secure">Secure encrypted connection</div>
              </form>

              <div className="view" id="v-forgot">
                <h2 style={{ fontSize: 26 }}>Reset password</h2>
                <p className="sub" id="forgot-text">Enter your work email and we'll send a reset link.</p>
                <div id="forgot-form">
                  <label htmlFor="fe">Work email</label>
                  <input id="fe" type="email" placeholder="you@analytix.com" />
                  <button type="button" className="go" id="send-reset">Send reset link</button>
                </div>
                <button type="button" className="back" data-go="signin">← Back to sign in</button>
              </div>

              <div className="view" id="v-demo">
                <h2 style={{ fontSize: 26 }}>Explore the demo</h2>
                <p className="sub">Preview AUDIT 360 with sample data. No account needed.</p>
                <label htmlFor="dr">Preview as role</label>
                <select id="dr" defaultValue={DEMO_ROLES[0].value}>
                  {DEMO_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button type="button" className="go ghost" id="enter-demo">Enter demo →</button>
                <button type="button" className="back" data-go="signin">← Back to sign in</button>
              </div>

              <div className="view" id="v-done">
                <div className="done"><div className="ok">✓</div><b id="welcome">Welcome</b><p>Opening your AUDIT 360 workspace…</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
