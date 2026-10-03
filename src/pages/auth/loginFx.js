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
  particles: true,    // drifting dust / bokeh / light streaks
  windows: true,      // flickering building windows
  sweep: true,        // glass reflection sweep + road light pulse
  morph: true,        // dialog height animates between views
  globe: true,        // 3D wireframe globe with route arcs
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
  particles: '',
  windows: '',
  sweep: `
#l360 .fx-sweep{position:absolute;inset:0;pointer-events:none;overflow:hidden;mix-blend-mode:screen}
#l360 .fx-sweep::before{content:'';position:absolute;top:-20%;bottom:-20%;width:18%;left:-30%;background:linear-gradient(100deg,transparent,rgba(160,200,255,.12),transparent);transform:skewX(-14deg);animation:l360-sweep 9s ease-in-out 2s infinite}
#l360 .fx-sweep::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 28% 9% at 85% 79%,rgba(255,50,70,.22),transparent 70%);animation:l360-road 3.2s ease-in-out infinite}
@keyframes l360-sweep{0%{left:-30%}45%,100%{left:130%}}
@keyframes l360-road{0%,100%{opacity:.25}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){#l360 .fx-sweep::before,#l360 .fx-sweep::after{animation:none}}`,
  morph: '',
  globe: '',
  dolly: `
#l360.fx-dolly .bg{transition:scale 1.1s cubic-bezier(.55,0,.25,1),filter 1.1s ease}
#l360.fx-dolly.dolly-go .bg{scale:1.4;filter:brightness(.7)}
#l360.fx-dolly.dolly-go .hero,#l360.fx-dolly.dolly-go .strip,#l360.fx-dolly.dolly-go header{animation:none;opacity:0;transition:opacity .6s ease}`,
}
// canvas layers shared by particles / windows / globe
const CANVAS_CSS = '#l360 .fx-canvas{position:absolute;pointer-events:none}'

export const fxCss = [CANVAS_CSS, ...Object.keys(FX).filter(on).map(k => CSS[k] || '')].join('\n')
export const fxClass = Object.keys(FX).filter(on).map(k => 'fx-' + k).join(' ')

const rnd = (a, b) => a + Math.random() * (b - a)

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

function makeCanvas(page, cls, before) {
  const cv = document.createElement('canvas')
  cv.className = 'fx-canvas ' + cls
  cv.setAttribute('aria-hidden', 'true')
  page.insertBefore(cv, before)
  return cv
}

function setupCanvas(cv, g, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  cv.style.width = w + 'px'
  cv.style.height = h + 'px'
  cv.width = Math.round(w * dpr)
  cv.height = Math.round(h * dpr)
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
}

// ── dust, bokeh, light streaks and building windows ─────────────────────────
function createParticles(page, before) {
  const cv = makeCanvas(page, 'fx-particles', before)
  cv.style.left = '0'; cv.style.top = '0'
  const g = cv.getContext('2d')
  let W = 0, H = 0, motes = [], streaks = [], wins = [], last = 0, lane = [0, 0]
  const laneY = () => rnd(lane[0], lane[1])
  const palette = ['255,255,255', '150,185,255', '255,107,122', '255,196,110']

  function resize() {
    const r = page.getBoundingClientRect()
    W = r.width; H = r.height
    const st = page.querySelector('.strip')
    const top = st ? st.offsetTop : H * 0.8
    lane = [Math.max(0, top - 120), Math.max(10, top - 16)]
    setupCanvas(cv, g, W, H)
    const n = Math.round(Math.min(90, Math.max(26, (W * H) / 16000)))
    motes = Array.from({ length: n }, (_, i) => ({
      x: rnd(0, W), y: rnd(0, H), z: rnd(0.3, 1), ph: rnd(0, 6.28),
      r: i % 15 === 0 ? rnd(8, 20) : rnd(0.6, 2.4),
      a: rnd(0.15, 0.6), c: palette[(Math.random() * palette.length) | 0],
    }))
    streaks = on('particles') ? Array.from({ length: 3 }, () => ({ x: rnd(-300, W), y: laneY(), len: rnd(120, 260), v: rnd(0.12, 0.3) })) : []
    wins = on('windows') && W >= 760
      ? Array.from({ length: 34 }, () => ({ x: rnd(0.56, 0.98) * W, y: rnd(0.08, 0.66) * H, w: rnd(2, 3.4), h: rnd(3, 4.4), ph: rnd(0, 6.28), per: rnd(500, 1500) }))
      : []
  }

  function draw(t, m) {
    const dt = Math.min(48, t - last || 16); last = t
    g.clearRect(0, 0, W, H)
    g.globalCompositeOperation = 'lighter'
    if (on('particles')) {
      for (const p of motes) {
        p.y -= (0.012 + 0.03 * p.z) * dt
        p.x += Math.sin(t / 4000 + p.ph) * 0.01 * dt
        if (p.y < -30) { p.y = H + 30; p.x = rnd(0, W) }
        const x = p.x + m.x * p.z * -26, y = p.y + m.y * p.z * -16
        const tw = 0.6 + 0.4 * Math.sin(t / 900 + p.ph)
        if (p.r > 6) {
          const gr = g.createRadialGradient(x, y, 0, x, y, p.r)
          gr.addColorStop(0, `rgba(${p.c},${(0.09 * tw).toFixed(3)})`); gr.addColorStop(1, `rgba(${p.c},0)`)
          g.fillStyle = gr
        } else g.fillStyle = `rgba(${p.c},${(p.a * tw).toFixed(3)})`
        g.beginPath(); g.arc(x, y, p.r, 0, 6.2832); g.fill()
      }
      for (const s of streaks) {
        s.x += s.v * dt
        if (s.x > W + 40) { s.x = -s.len; s.y = laneY() }
        const gr = g.createLinearGradient(s.x - s.len, 0, s.x, 0)
        gr.addColorStop(0, 'rgba(255,60,80,0)'); gr.addColorStop(1, 'rgba(255,90,110,.55)')
        g.strokeStyle = gr; g.lineWidth = 1.5
        g.beginPath(); g.moveTo(s.x - s.len, s.y); g.lineTo(s.x, s.y); g.stroke()
      }
    }
    for (const w of wins) {
      const a = Math.pow(Math.max(0, Math.sin(t / w.per + w.ph)), 6) * 0.85 + 0.05
      g.fillStyle = `rgba(255,196,110,${a.toFixed(3)})`
      g.fillRect(w.x + m.x * -6, w.y + m.y * -4, w.w, w.h)
    }
    g.globalCompositeOperation = 'source-over'
  }

  resize()
  return { draw, resize, destroy: () => cv.remove() }
}

// ── 3D wireframe globe with route arcs from Kuwait ──────────────────────────
function createGlobe(page, before) {
  const cv = makeCanvas(page, 'fx-globe', before)
  const g = cv.getContext('2d')
  const rad = d => (d * Math.PI) / 180
  const vec = (lat, lon) => ({ x: Math.cos(rad(lat)) * Math.sin(rad(lon)), y: Math.sin(rad(lat)), z: Math.cos(rad(lat)) * Math.cos(rad(lon)) })
  const cities = [[29.4, 47.9], [26.2, 50.6], [24.7, 46.7], [25.2, 55.3], [25.3, 51.5], [23.6, 58.6], [19.1, 72.9], [1.35, 103.8], [22.3, 114.2], [31.2, 121.5]].map(([a, b]) => vec(a, b))
  const hub = cities[0]
  const arcs = cities.slice(1).map((c, i) => {
    const om = Math.acos(hub.x * c.x + hub.y * c.y + hub.z * c.z), s = Math.sin(om), pts = []
    for (let k = 0; k <= 48; k++) {
      const t = k / 48, a = Math.sin((1 - t) * om) / s, b = Math.sin(t * om) / s, lift = 1 + 0.16 * Math.sin(Math.PI * t)
      pts.push({ x: (a * hub.x + b * c.x) * lift, y: (a * hub.y + b * c.y) * lift, z: (a * hub.z + b * c.z) * lift })
    }
    return { pts, per: 3200 + i * 450, off: i * 0.13 }
  })
  const grid = []
  for (let lon = 0; lon < 360; lon += 20) { const l = []; for (let lat = -90; lat <= 90; lat += 4) l.push(vec(lat, lon)); grid.push(l) }
  for (let lat = -60; lat <= 60; lat += 20) { const l = []; for (let lon = 0; lon <= 360; lon += 5) l.push(vec(lat, lon)); grid.push(l) }

  let cx = 0, cy = 0, R = 0, shown = false

  function resize() {
    const r = page.getBoundingClientRect()
    const D = Math.min(r.height * 0.55, r.width * 0.36)
    shown = r.width >= 900
    cv.style.display = shown ? 'block' : 'none'
    if (!shown) return
    const size = D * 1.3
    cx = size / 2; cy = size / 2; R = D / 2
    cv.style.left = r.width * 0.74 - size / 2 + 'px'
    cv.style.top = r.height * 0.46 - size / 2 + 'px'
    setupCanvas(cv, g, size, size)
  }

  function draw(t, m) {
    if (!shown) return
    const yaw = -(1.05 + 0.6 * Math.sin(t / 9000)) + m.x * 0.5, pitch = 0.5 - m.y * 0.2
    const cy1 = Math.cos(yaw), sy1 = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
    const proj = p => {
      const x1 = p.x * cy1 + p.z * sy1, z1 = -p.x * sy1 + p.z * cy1
      return { x: cx + R * x1, y: cy - R * (p.y * cp - z1 * sp), z: p.y * sp + z1 * cp }
    }
    g.clearRect(0, 0, cx * 2, cy * 2)
    const body = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R)
    body.addColorStop(0, 'rgba(40,90,190,.22)'); body.addColorStop(1, 'rgba(5,10,28,.38)')
    g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.fill()
    const front = new Path2D(), back = new Path2D()
    for (const line of grid) {
      let prev = proj(line[0])
      for (let i = 1; i < line.length; i++) {
        const cur = proj(line[i])
        if (prev.z > 0 && cur.z > 0) { front.moveTo(prev.x, prev.y); front.lineTo(cur.x, cur.y) }
        else if (prev.z <= 0 && cur.z <= 0) { back.moveTo(prev.x, prev.y); back.lineTo(cur.x, cur.y) }
        prev = cur
      }
    }
    g.lineWidth = 1
    g.strokeStyle = 'rgba(120,170,255,.07)'; g.stroke(back)
    g.strokeStyle = 'rgba(130,180,255,.30)'; g.stroke(front)
    const rim = g.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.08)
    rim.addColorStop(0, 'rgba(110,170,255,0)'); rim.addColorStop(0.55, 'rgba(120,180,255,.30)'); rim.addColorStop(1, 'rgba(110,170,255,0)')
    g.fillStyle = rim; g.beginPath(); g.arc(cx, cy, R * 1.08, 0, 6.2832); g.fill()
    g.lineWidth = 1.4
    for (const a of arcs) {
      const pp = a.pts.map(proj)
      g.strokeStyle = 'rgba(255,90,110,.65)'; g.beginPath()
      let pen = false
      for (const q of pp) {
        if (q.z > 0.02) { if (pen) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); pen = true } else pen = false
      }
      g.stroke()
      const d = pp[Math.min(48, Math.floor((((t / a.per) + a.off) % 1) * 49))]
      if (d.z > 0.02) { g.fillStyle = '#ff8a99'; g.beginPath(); g.arc(d.x, d.y, 2.6, 0, 6.2832); g.fill() }
    }
    cities.forEach((c, i) => {
      const q = proj(c)
      if (q.z <= 0.02) return
      const pulse = ((t / 1600) + i * 0.17) % 1
      g.strokeStyle = `rgba(255,120,135,${(0.55 * (1 - pulse)).toFixed(3)})`
      g.beginPath(); g.arc(q.x, q.y, 3 + pulse * 9, 0, 6.2832); g.stroke()
      g.fillStyle = i === 0 ? '#ff5a70' : '#ffffff'
      g.beginPath(); g.arc(q.x, q.y, i === 0 ? 4 : 2.6, 0, 6.2832); g.fill()
    })
  }

  resize()
  return { draw, resize, destroy: () => cv.remove() }
}

export function initFx(root) {
  const page = root.querySelector('.page')
  const still = reduced()
  const fine = finePointer()
  const q = s => root.querySelector(s)
  const cleanups = []
  const m = { x: 0, y: 0, tx: 0, ty: 0 }

  const layers = []
  const before = page.querySelector('header')
  if (on('sweep') && !still) {
    const d = document.createElement('div'); d.className = 'fx-sweep'; d.setAttribute('aria-hidden', 'true')
    page.insertBefore(d, before); cleanups.push(() => d.remove())
  }
  if (on('globe')) layers.push(createGlobe(page, before))
  if (on('particles') || on('windows')) layers.push(createParticles(page, before))

  const ro = new ResizeObserver(() => { layers.forEach(l => l.resize()); if (still) layers.forEach(l => l.draw(0, m)) })
  ro.observe(page)
  cleanups.push(() => ro.disconnect(), () => layers.forEach(l => l.destroy()))

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

  if (still) {
    layers.forEach(l => l.draw(0, m))
  } else if (layers.length || par.length) {
    let raf = 0, n = 0
    const frame = t => {
      raf = requestAnimationFrame(frame)
      if (document.hidden) return
      if (backdrop.classList.contains('open') && (n++ & 1)) return
      m.x += (m.tx - m.x) * 0.07; m.y += (m.ty - m.y) * 0.07
      par.forEach(([el, fx, fy]) => { el.style.translate = `${(m.x * fx).toFixed(2)}px ${(m.y * fy).toFixed(2)}px` })
      layers.forEach(l => l.draw(t, m))
    }
    raf = requestAnimationFrame(frame)
    cleanups.push(() => cancelAnimationFrame(raf))
  }

  return () => cleanups.forEach(f => f())
}
