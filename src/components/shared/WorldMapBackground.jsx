import { useEffect, useRef, useMemo } from 'react'

export const MAP_COUNTRIES = [
  { name: 'India',          flag: '🇮🇳', lat: 20.59,  lng: 78.96  },
  { name: 'UAE',            flag: '🇦🇪', lat: 24.47,  lng: 54.37  },
  { name: 'Saudi Arabia',   flag: '🇸🇦', lat: 24.68,  lng: 46.68  },
  { name: 'Qatar',          flag: '🇶🇦', lat: 25.28,  lng: 51.53  },
  { name: 'Oman',           flag: '🇴🇲', lat: 23.61,  lng: 58.59  },
  { name: 'Kuwait',         flag: '🇰🇼', lat: 29.37,  lng: 47.97  },
  { name: 'Bahrain',        flag: '🇧🇭', lat: 26.07,  lng: 50.55  },
  { name: 'China',          flag: '🇨🇳', lat: 35.86,  lng: 104.2  },
  { name: 'Singapore',      flag: '🇸🇬', lat: 1.35,   lng: 103.82 },
  { name: 'United Kingdom', flag: '🇬🇧', lat: 55.38,  lng: -3.44  },
  { name: 'France',         flag: '🇫🇷', lat: 46.23,  lng: 2.21   },
  { name: 'United States',  flag: '🇺🇸', lat: 37.09,  lng: -95.71 },
]

/* Simplified continent polygons — [lng, lat] pairs */
const CONTINENTS = [
  // North America (main body)
  [[-52,47],[-65,47],[-64,44],[-70,41],[-76,35],[-80,25],[-87,16],[-77,9],[-83,9],
   [-85,16],[-90,17],[-97,16],[-105,23],[-115,32],[-120,34],[-124,38],[-122,49],
   [-100,49],[-95,49],[-91,49],[-85,55],[-78,56],[-72,57],[-64,60],[-57,47],[-52,47]],
  // North America (Canada/Alaska north)
  [[-168,60],[-168,66],[-163,70],[-142,71],[-120,70],[-100,68],[-82,62],[-65,63],
   [-64,62],[-70,57],[-72,55],[-78,55],[-86,58],[-94,57],[-100,57],[-120,62],
   [-140,62],[-155,60],[-168,60]],
  // Greenland
  [[-25,83],[-15,82],[-17,76],[-23,71],[-43,66],[-56,66],[-57,76],[-25,83]],
  // South America
  [[-73,12],[-62,11],[-50,5],[-36,-5],[-35,-9],[-38,-15],[-43,-23],[-48,-28],
   [-51,-33],[-53,-34],[-65,-56],[-68,-55],[-65,-44],[-56,-30],[-50,-30],
   [-46,-24],[-42,-20],[-38,-13],[-35,-5],[-50,0],[-60,5],[-73,12]],
  // Europe
  [[-9,36],[-9,43],[2,51],[-5,48],[2,47],[10,48],[15,52],[20,55],[24,60],[28,60],
   [30,58],[25,55],[22,56],[18,54],[14,55],[14,57],[5,58],[2,59],[0,62],[10,63],
   [15,66],[20,70],[24,70],[28,68],[28,72],[18,72],[14,68],[12,62],[8,58],[5,55],
   [5,51],[0,50],[-5,47],[-8,43],[-5,43],[-9,37],[-9,36]],
  // Africa
  [[-5,35],[10,37],[25,35],[32,31],[36,22],[44,12],[41,0],[42,-3],[40,-10],
   [35,-25],[32,-30],[25,-34],[18,-35],[12,-30],[8,-25],[5,-15],[0,-5],[0,5],
   [-5,8],[-10,5],[-15,12],[-17,14],[-17,22],[-13,28],[-8,32],[-5,35]],
  // Asia (main body)
  [[28,42],[36,36],[42,42],[50,43],[60,52],[70,54],[80,55],[90,55],[100,55],
   [110,58],[120,62],[130,65],[140,68],[150,70],[160,70],[170,70],[180,68],
   [180,55],[165,58],[155,50],[148,44],[142,38],[132,30],[126,26],[120,22],
   [112,22],[108,16],[104,2],[100,4],[96,16],[90,22],[85,22],[80,10],[77,15],
   [72,22],[65,22],[60,22],[56,24],[52,28],[48,28],[46,30],[42,36],[36,35],
   [30,42],[28,42]],
  // Indian peninsula
  [[68,24],[80,8],[80,10],[84,12],[88,22],[92,24],[80,22],[72,22],[68,24]],
  // SE Asia peninsulas
  [[100,20],[102,18],[100,14],[104,1],[100,4],[96,18],[100,20]],
  // Japan
  [[130,31],[131,33],[134,35],[136,36],[140,38],[141,38],[141,35],[136,33],[130,31]],
  // Australia
  [[114,-22],[121,-14],[128,-14],[136,-12],[140,-14],[144,-15],[148,-19],[152,-24],
   [153,-27],[151,-34],[148,-38],[143,-38],[138,-35],[133,-30],[126,-34],[118,-30],
   [114,-22]],
]

/* Connection edges (country index pairs) */
const EDGES = [
  [0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[1,5],[1,6],[2,3],[3,4],[3,5],
  [4,5],[4,6],[5,6],[0,7],[7,8],[9,10],[9,11],[10,11],[9,1],[9,7],[11,2],[7,0],
]

function ll2canvas(lat, lng, W, H) {
  return { x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H }
}

function ll2pct(lat, lng) {
  return { x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 }
}

/* Label offset config so labels don't overlap (dx%, dy in px) */
const LABEL_OFFSETS = {
  'India':          { dx: 0,   dy: -46, anchor: 'left'  },
  'UAE':            { dx: 0,   dy: -46, anchor: 'left'  },
  'Saudi Arabia':   { dx: -1,  dy: -46, anchor: 'right' },
  'Qatar':          { dx: 0,   dy: 10,  anchor: 'left'  },
  'Oman':           { dx: 0,   dy: -46, anchor: 'left'  },
  'Kuwait':         { dx: -1,  dy: -46, anchor: 'right' },
  'Bahrain':        { dx: 0,   dy: 10,  anchor: 'left'  },
  'China':          { dx: 0,   dy: -46, anchor: 'left'  },
  'Singapore':      { dx: 0,   dy: -46, anchor: 'left'  },
  'United Kingdom': { dx: 0,   dy: -46, anchor: 'left'  },
  'France':         { dx: -1,  dy: -46, anchor: 'right' },
  'United States':  { dx: 0,   dy: -46, anchor: 'left'  },
}

export default function WorldMapBackground({ className = '' }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = 0, H = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.resetTransform()
      ctx.scale(dpr, dpr)
    }
    resize()

    let ro
    try {
      ro = new ResizeObserver(resize)
      ro.observe(canvas)
    } catch (_) { window.addEventListener('resize', resize) }

    let frame = 0

    function draw() {
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, W, H)

      // Background
      const bg = ctx.createRadialGradient(W * 0.38, H * 0.48, 0, W * 0.38, H * 0.48, W * 0.8)
      bg.addColorStop(0,    '#0e1f48')
      bg.addColorStop(0.35, '#07132e')
      bg.addColorStop(0.7,  '#04091e')
      bg.addColorStop(1,    '#020812')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Atmospheric red glow (bottom-left like in mockup)
      const rg = ctx.createRadialGradient(W * 0.08, H * 0.88, 0, W * 0.08, H * 0.88, W * 0.5)
      rg.addColorStop(0, 'rgba(200,30,40,0.09)')
      rg.addColorStop(1, 'rgba(200,30,40,0)')
      ctx.fillStyle = rg
      ctx.fillRect(0, 0, W, H)

      // Grid / graticule
      ctx.strokeStyle = 'rgba(35,75,190,0.13)'
      ctx.lineWidth = 0.5
      for (let lng = -180; lng <= 180; lng += 30) {
        const x = ((lng + 180) / 360) * W
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * H
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Continent fills
      for (const path of CONTINENTS) {
        if (path.length < 3) continue
        ctx.beginPath()
        const [fl, fla] = path[0]
        const fp = ll2canvas(fla, fl, W, H)
        ctx.moveTo(fp.x, fp.y)
        for (let i = 1; i < path.length; i++) {
          const [lng, lat] = path[i]
          const p = ll2canvas(lat, lng, W, H)
          ctx.lineTo(p.x, p.y)
        }
        ctx.closePath()
        ctx.fillStyle = 'rgba(22,55,140,0.48)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(45,100,220,0.30)'
        ctx.lineWidth = 0.55
        ctx.stroke()
      }

      // Connection lines + traveling pulses
      for (const [ai, bi] of EDGES) {
        const a = MAP_COUNTRIES[ai]
        const b = MAP_COUNTRIES[bi]
        if (!a || !b) continue
        const pa = ll2canvas(a.lat, a.lng, W, H)
        const pb = ll2canvas(b.lat, b.lng, W, H)

        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.strokeStyle = 'rgba(232,50,60,0.11)'
        ctx.lineWidth = 0.75
        ctx.stroke()

        // Pulse dot traveling along line
        const phase = ((ai * 0.29 + bi * 0.37 + frame * 0.0025) % 1)
        const px = pa.x + (pb.x - pa.x) * phase
        const py = pa.y + (pb.y - pa.y) * phase
        const gr = ctx.createRadialGradient(px, py, 0, px, py, 6)
        gr.addColorStop(0, 'rgba(255,80,80,0.80)')
        gr.addColorStop(1, 'rgba(255,80,80,0)')
        ctx.beginPath()
        ctx.arc(px, py, 6, 0, Math.PI * 2)
        ctx.fillStyle = gr
        ctx.fill()
      }

      // Country glow dots
      for (const loc of MAP_COUNTRIES) {
        const p = ll2canvas(loc.lat, loc.lng, W, H)
        const pulse = (Math.sin(frame * 0.035 + loc.lat * 0.18) + 1) * 0.5

        // Outer pulse ring
        const outerR = 11 + pulse * 9
        const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, outerR)
        g1.addColorStop(0, `rgba(232,50,60,${0.42 + pulse * 0.28})`)
        g1.addColorStop(1, 'rgba(232,50,60,0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, outerR, 0, Math.PI * 2)
        ctx.fillStyle = g1
        ctx.fill()

        // Core red dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ff2222'
        ctx.fill()

        // Inner white hot
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffcccc'
        ctx.fill()
      }

      frame++
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (ro) ro.disconnect()
      else window.removeEventListener('resize', resize)
    }
  }, [])

  const labels = useMemo(() => MAP_COUNTRIES.map(c => ({
    ...c,
    pct: ll2pct(c.lat, c.lng),
    off: LABEL_OFFSETS[c.name] || { dx: 0, dy: -46, anchor: 'left' },
  })), [])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Country flag label overlays */}
      {labels.map((loc) => {
        const isRight = loc.off.anchor === 'right'
        return (
          <div
            key={loc.name}
            className="pointer-events-none absolute"
            style={{
              left: `${loc.pct.x}%`,
              top: `${loc.pct.y}%`,
              transform: isRight
                ? `translate(calc(-100% + -6px), ${loc.off.dy}px)`
                : `translate(6px, ${loc.off.dy}px)`,
              zIndex: 4,
            }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(4,8,22,0.75)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: '20px',
              padding: '3px 9px 3px 3px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: '13px', lineHeight: 1, display: 'block' }}>{loc.flag}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.88)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.01em',
              }}>
                {loc.name}
              </span>
            </div>
            {/* Stem */}
            <div style={{
              display: 'flex',
              justifyContent: isRight ? 'flex-end' : 'flex-start',
              paddingLeft: isRight ? 0 : '14px',
              paddingRight: isRight ? '14px' : 0,
              marginTop: '2px',
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#ff2222',
                boxShadow: '0 0 7px rgba(255,40,40,0.9)',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
