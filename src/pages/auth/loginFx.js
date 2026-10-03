// Login page visual effects. Nothing here touches auth, routing or form logic.
// Disable an effect: set its flag to false. Remove one for good: delete its flag,
// its CSS entry in CSS, and its function / call in initFx (or morph / dolly).
export const FX = {
  parallax: true,     // mouse parallax: skyline, hero, service row
  cardTilt: true,     // portal buttons tilt toward cursor + light sheen
  glassDialog: true,  // dialog tilts with the mouse + moving edge highlight
  reveal: true,       // staggered hero text reveal
  scramble: true,     // service numbers 01-05 scramble in
  glow: true,         // pulsing glow on "360"
  sweep: true,        // glass reflection sweep + road light pulse
  morph: true,        // dialog height animates between views
  dolly: true,        // camera zoom on successful sign-in
}

const on = k => FX[k]
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

const CSS = {
  parallax: '',
  cardTilt: `
#l360.fx-cardTilt .pick{position:relative;overflow:hidden;transform:perspective(700px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(var(--ty,0px))}
#l360.fx-cardTilt .pick:hover{--ty:-3px}
#l360.fx-cardTilt .pick::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(220px circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.14),transparent 60%);transition:opacity .2s}
#l360.fx-cardTilt .pick:hover::after{opacity:1}`,
  glassDialog: `
#l360.fx-glassDialog .card{animation-fill-mode:backwards;transform:perspective(1000px) rotateX(var(--crx,0deg)) rotateY(var(--cry,0deg));transition:transform .2s ease-out}
#l360.fx-glassDialog .card::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(380px circle at var(--mx,50%) var(--my,0%),rgba(255,255,255,.09),transparent 65%)}`,
  reveal: `
#l360.fx-reveal .hero{animation:none}
#l360.fx-reveal .rv{animation:l360-up .7s ease both;animation-delay:var(--d,0s)}
#l360.fx-reveal .ch{display:inline-block;animation:l360-letter .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(.2s + var(--i,0)*.07s)}
@keyframes l360-letter{from{opacity:0;transform:translateY(.45em) rotateX(-70deg);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
@media (prefers-reduced-motion:reduce){#l360.fx-reveal .rv,#l360.fx-reveal .ch{animation:none!important}}`,
  scramble: '',
  glow: `
@keyframes l360-glow{0%,100%{text-shadow:0 0 0 rgba(242,67,79,0)}50%{text-shadow:0 0 36px rgba(242,67,79,.55)}}
#l360.fx-glow h1 em{animation:l360-glow 3.6s ease-in-out 1.4s infinite}
@media (prefers-reduced-motion:reduce){#l360.fx-glow h1 em{animation:none}}`,
  sweep: `
#l360 .fx-sweep{position:absolute;inset:0;pointer-events:none;overflow:hidden;mix-blend-mode:screen}
#l360 .fx-sweep::before{content:'';position:absolute;top:-20%;bottom:-20%;width:18%;left:-30%;background:linear-gradient(100deg,transparent,rgba(160,200,255,.12),transparent);transform:skewX(-14deg);animation:l360-sweep 9s ease-in-out 2s infinite}
#l360 .fx-sweep::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 28% 9% at 85% 79%,rgba(255,50,70,.22),transparent 70%);animation:l360-road 3.2s ease-in-out infinite}
@keyframes l360-sweep{0%{left:-30%}45%,100%{left:130%}}
@keyframes l360-road{0%,100%{opacity:.25}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){#l360 .fx-sweep::before,#l360 .fx-sweep::after{animation:none}}`,
  morph: '',
  dolly: `
#l360.fx-dolly .bg{transition:scale 1.1s cubic-bezier(.55,0,.25,1),filter 1.1s ease}
#l360.fx-dolly.dolly-go .bg{scale:1.4;filter:brightness(.7)}
#l360.fx-dolly.dolly-go .hero,#l360.fx-dolly.dolly-go .strip,#l360.fx-dolly.dolly-go header{animation:none;opacity:0;transition:opacity .6s ease}`,
}
export const fxCss = Object.keys(FX).filter(on).map(k => CSS[k] || '').join('\n')
export const fxClass = Object.keys(FX).filter(on).map(k => 'fx-' + k).join(' ')

export function morph(card, change) {
  const from = card.offsetHeight
  change()
  if (!on('morph') || reduced() || !from) return
  const to = card.offsetHeight
  if (from === to) return
  card.style.overflow = 'hidden'
  card.style.height = from + 'px'
  void card.offsetHeight
  card.style.transition = 'height .3s cubic-bezier(.2,.8,.2,1)'
  card.style.height = to + 'px'
  setTimeout(() => { card.style.height = ''; card.style.transition = ''; card.style.overflow = '' }, 320)
}

export function dolly(root) {
  if (on('dolly') && !reduced()) root.classList.add('dolly-go')
}

export function initFx(root) {
  const page = root.querySelector('.page')
  const still = reduced()
  const fine = finePointer()
  const q = s => root.querySelector(s)
  const cleanups = []
  const m = { x: 0, y: 0, tx: 0, ty: 0 }

  const before = page.querySelector('header')
  if (on('sweep') && !still) {
    const d = document.createElement('div'); d.className = 'fx-sweep'; d.setAttribute('aria-hidden', 'true')
    page.insertBefore(d, before); cleanups.push(() => d.remove())
  }

  const par = on('parallax') && fine && !still
    ? [[q('.bg'), -14, -9], [q('.hero'), 7, 4], [q('.strip'), 3, 2]].filter(a => a[0]) : []
  cleanups.push(() => par.forEach(([el]) => { el.style.translate = '' }))

  const card = q('#card'), backdrop = q('#backdrop')
  function onMove(e) {
    m.tx = (e.clientX / window.innerWidth - 0.5) * 2
    m.ty = (e.clientY / window.innerHeight - 0.5) * 2
    const pk = e.target.closest && e.target.closest('.pick')
    if (on('cardTilt') && pk && fine && !still) {
      const r = pk.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
      pk.style.setProperty('--ry', ((px - 0.5) * 10).toFixed(2) + 'deg')
      pk.style.setProperty('--rx', (-(py - 0.5) * 8).toFixed(2) + 'deg')
      pk.style.setProperty('--mx', (px * 100).toFixed(1) + '%')
      pk.style.setProperty('--my', (py * 100).toFixed(1) + '%')
    }
    if (on('glassDialog') && fine && !still && backdrop.classList.contains('open')) {
      const r = card.getBoundingClientRect()
      card.style.setProperty('--cry', (m.tx * 3).toFixed(2) + 'deg')
      card.style.setProperty('--crx', (-m.ty * 3).toFixed(2) + 'deg')
      card.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%')
      card.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%')
    }
  }
  function onOut(e) {
    const pk = e.target.closest && e.target.closest('.pick')
    if (pk) ['--rx', '--ry'].forEach(p => pk.style.removeProperty(p))
  }
  function onLeave() { m.tx = 0; m.ty = 0; card.style.removeProperty('--crx'); card.style.removeProperty('--cry') }
  if (fine && !still) {
    window.addEventListener('pointermove', onMove)
    root.addEventListener('pointerout', onOut)
    document.documentElement.addEventListener('pointerleave', onLeave)
    cleanups.push(() => {
      window.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerout', onOut)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    })
  }

  if (on('scramble') && !still) {
    root.querySelectorAll('.svc small').forEach((el, i) => {
      const final = el.textContent
      let n = 0
      const start = setTimeout(() => {
        const iv = setInterval(() => {
          el.textContent = ++n > 12 ? final : String((Math.random() * 100) | 0).padStart(2, '0')
          if (n > 12) clearInterval(iv)
        }, 50)
        cleanups.push(() => clearInterval(iv))
      }, 700 + i * 140)
      cleanups.push(() => { clearTimeout(start); el.textContent = final })
    })
  }

  if (par.length) {
    let raf = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (document.hidden) return
      m.x += (m.tx - m.x) * 0.07; m.y += (m.ty - m.y) * 0.07
      par.forEach(([el, fx, fy]) => { el.style.translate = `${(m.x * fx).toFixed(2)}px ${(m.y * fy).toFixed(2)}px` })
    }
    raf = requestAnimationFrame(frame)
    cleanups.push(() => cancelAnimationFrame(raf))
  }

  return () => cleanups.forEach(f => f())
}
