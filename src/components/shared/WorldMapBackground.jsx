import { useEffect, useRef, useMemo } from 'react'

/* ── Country markers ─────────────────────────────────────────────────────── */
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

/* ── Connection edges ────────────────────────────────────────────────────── */
const EDGES = [
  [0,1],[0,2],[0,4],[1,2],[1,3],[1,5],[1,6],[2,3],[3,4],[4,5],[5,6],
  [0,7],[7,8],[9,10],[9,11],[11,2],[9,1],[7,0],[10,11],[9,7],
]

/* ── City lights — [lng, lat, brightness 0-1] ───────────────────────────── */
const CITY_LIGHTS = [
  // North America
  [-74.0,40.7,1.0],[-118.2,34.1,0.9],[-87.6,41.9,0.85],[-95.4,29.8,0.75],
  [-80.2,25.8,0.7],[-75.2,40.0,0.75],[-77.0,38.9,0.75],[-71.1,42.4,0.7],
  [-79.4,43.7,0.7],[-73.6,45.5,0.65],[-123.1,49.2,0.7],[-114.1,51.1,0.6],
  [-104.9,39.7,0.65],[-112.1,33.5,0.6],[-122.3,37.7,0.75],[-121.9,37.3,0.7],
  [-97.5,35.5,0.6],[-90.2,38.6,0.65],[-83.0,42.3,0.65],[-84.4,33.7,0.7],
  [-82.5,27.9,0.6],[-76.6,39.3,0.6],[-86.8,36.2,0.6],[-93.3,44.9,0.6],
  [-99.1,19.4,0.85],[-89.2,13.7,0.5],[-66.9,10.5,0.55],[-64.2,10.7,0.5],
  // South America
  [-46.6,-23.5,0.95],[-43.2,-22.9,0.85],[-58.4,-34.6,0.8],[-70.7,-33.5,0.75],
  [-77.0,-12.0,0.65],[-74.1,4.7,0.65],[-63.2,-7.6,0.55],[-49.3,-16.7,0.55],
  [-51.1,-0.1,0.5],[-38.5,-3.7,0.55],[-35.2,-5.8,0.5],[-48.5,-27.6,0.55],
  [-56.0,-34.9,0.5],[-60.0,-3.1,0.5],
  // Europe
  [-0.1,51.5,1.0],[2.3,48.9,0.95],[13.4,52.5,0.9],[-3.7,40.4,0.85],
  [12.5,41.9,0.85],[4.9,52.4,0.8],[18.1,59.3,0.75],[24.9,60.2,0.7],
  [10.7,59.9,0.7],[12.6,55.7,0.7],[14.4,50.1,0.7],[16.4,48.2,0.7],
  [19.0,47.5,0.7],[21.0,52.2,0.7],[23.7,38.0,0.7],[28.9,41.0,0.8],
  [30.5,50.5,0.7],[17.0,48.1,0.6],[7.4,46.9,0.65],[2.1,41.4,0.65],
  [-8.6,41.2,0.6],[4.4,51.9,0.7],[9.2,45.5,0.65],[11.3,44.5,0.6],
  [8.7,50.1,0.65],[13.0,47.8,0.55],[15.6,38.1,0.6],[-5.0,36.7,0.6],
  // Africa
  [31.2,30.1,0.85],[3.4,6.5,0.75],[28.0,-26.2,0.8],[18.4,-33.9,0.75],
  [36.8,-1.3,0.65],[38.7,9.0,0.6],[2.3,12.4,0.5],[-17.5,14.7,0.5],
  [-4.0,5.4,0.55],[15.3,-4.3,0.5],[32.5,-25.9,0.5],[39.3,-6.8,0.5],
  [32.6,0.3,0.5],[-0.2,5.6,0.5],[13.1,4.4,0.5],[47.5,-18.9,0.45],
  [43.1,11.6,0.45],[3.9,7.4,0.5],[7.5,9.1,0.5],[29.4,-2.6,0.45],
  // Middle East
  [55.3,25.2,0.75],[46.7,24.7,0.75],[51.5,25.3,0.7],[50.6,26.1,0.65],
  [58.6,23.6,0.65],[47.9,29.4,0.65],[44.4,33.3,0.65],[35.9,31.9,0.6],
  [51.4,35.7,0.75],[59.6,35.7,0.6],[57.6,23.6,0.55],[36.3,33.5,0.55],
  // Asia South
  [72.9,19.1,0.95],[77.2,28.7,0.95],[88.4,22.6,0.9],[80.3,13.1,0.85],
  [77.6,12.9,0.85],[78.5,17.4,0.75],[73.9,18.5,0.75],[90.4,23.7,0.8],
  [79.9,6.9,0.65],[73.1,33.7,0.75],[67.0,24.9,0.8],[74.3,31.5,0.75],
  [69.2,34.5,0.6],[85.3,27.7,0.55],[84.0,28.2,0.5],[66.0,22.3,0.5],
  // Asia Southeast
  [100.5,13.8,0.85],[103.8,1.3,0.85],[106.8,-6.2,0.85],[120.9,14.6,0.8],
  [105.9,21.0,0.75],[106.7,10.8,0.75],[101.7,3.2,0.75],[96.2,16.9,0.65],
  [102.7,17.9,0.55],[114.2,4.9,0.5],[107.6,-6.9,0.65],[110.4,-7.0,0.55],
  [112.8,-7.2,0.5],[98.7,3.6,0.55],
  // Asia East
  [116.4,39.9,1.0],[121.5,31.2,1.0],[113.3,23.1,0.95],[104.1,30.7,0.85],
  [121.6,25.0,0.9],[114.2,22.3,0.95],[126.9,37.6,1.0],[139.7,35.7,1.0],
  [135.5,34.7,0.9],[130.4,33.6,0.75],[141.4,43.1,0.65],[106.5,29.6,0.8],
  [108.9,34.3,0.75],[117.1,36.7,0.75],[120.2,30.3,0.8],[110.2,20.0,0.65],
  [111.7,21.2,0.65],[114.3,30.6,0.75],[113.0,28.2,0.7],[118.8,32.1,0.75],
  [125.4,43.8,0.65],[127.0,35.2,0.7],
  // Central Asia / Russia
  [69.3,41.3,0.65],[71.4,51.2,0.55],[76.9,43.3,0.55],[37.6,55.8,0.95],
  [82.9,55.0,0.65],[60.6,56.8,0.65],[49.1,55.8,0.6],[131.9,43.1,0.7],
  [56.3,58.0,0.6],[44.0,56.3,0.55],[40.1,44.0,0.55],[39.7,47.2,0.55],
  // Australia
  [151.2,-33.9,0.85],[144.9,-37.8,0.85],[153.0,-27.5,0.75],[115.9,-32.0,0.7],
  [138.6,-34.9,0.65],[149.1,-35.3,0.6],[130.8,-12.5,0.5],[146.8,-19.3,0.5],
]

/* ── Better continent polygons — [lng, lat] pairs ───────────────────────── */
const CONTINENTS = [
  // North America (detailed coastline)
  [[-168,60],[-163,63],[-157,68],[-148,70],[-140,70],[-136,59],[-130,54],
   [-127,50],[-124,49],[-124,47],[-124,43],[-124,40],[-122,38],[-122,37],
   [-117,34],[-117,32],[-115,30],[-109,23],[-103,20],[-97,16],[-91,16],
   [-87,16],[-84,11],[-79,8],[-82,9],[-85,11],[-87,16],[-89,16],[-91,17],
   [-97,26],[-97,28],[-93,30],[-90,30],[-89,30],[-85,30],[-82,29],[-81,25],
   [-80,25],[-80,27],[-81,31],[-80,33],[-77,35],[-76,37],[-75,39],[-74,40],
   [-74,41],[-71,41],[-70,42],[-70,43],[-67,45],[-67,47],[-65,44],[-61,45],
   [-56,47],[-52,47],[-53,47],[-57,48],[-56,50],[-64,52],[-64,56],[-72,58],
   [-80,64],[-86,62],[-93,57],[-96,58],[-84,65],[-79,68],[-86,70],
   [-100,71],[-120,72],[-136,70],[-140,70],[-155,60],[-168,60]],
  // Greenland
  [[-25,83],[-15,82],[-17,76],[-23,71],[-43,66],[-56,66],[-57,76],[-25,83]],
  // South America
  [[-73,12],[-65,11],[-62,11],[-60,8],[-52,5],[-49,0],[-44,-3],[-35,-5],
   [-35,-9],[-37,-12],[-39,-15],[-40,-15],[-43,-23],[-44,-23],[-48,-28],
   [-50,-29],[-51,-33],[-52,-34],[-53,-34],[-65,-55],[-68,-56],[-68,-54],
   [-66,-44],[-58,-35],[-56,-30],[-50,-30],[-47,-24],[-44,-22],[-41,-21],
   [-38,-13],[-35,-5],[-50,0],[-62,5],[-73,12]],
  // Europe
  [[-9,36],[-6,36],[-5,38],[-9,39],[-9,43],[-1,44],[2,43],[3,44],
   [2,47],[3,47],[8,48],[10,48],[15,51],[18,54],[21,54],[22,56],[24,56],
   [25,55],[27,57],[22,58],[20,60],[25,60],[28,60],[30,59],[28,56],
   [25,55],[22,56],[18,54],[14,55],[12,56],[10,57],[5,58],[2,59],
   [0,62],[10,63],[15,66],[20,70],[25,70],[28,68],[27,72],[18,72],
   [14,68],[12,62],[8,58],[5,55],[3,51],[0,50],[-5,47],[-8,44],
   [-5,43],[-8,42],[-9,39],[-5,36],[-9,36]],
  // Africa (detailed)
  [[-5,35],[-2,35],[2,37],[8,37],[10,37],[14,36],[18,36],[25,35],
   [30,32],[32,31],[34,28],[36,24],[38,22],[40,20],[42,15],[44,12],
   [45,10],[44,8],[43,5],[42,2],[41,0],[41,-2],[40,-5],[40,-10],
   [38,-15],[36,-20],[34,-25],[32,-30],[28,-34],[25,-34],[22,-35],
   [18,-35],[14,-32],[12,-30],[10,-28],[8,-25],[5,-20],[2,-15],
   [0,-10],[0,-5],[0,0],[0,5],[-2,8],[-5,8],[-8,5],[-10,5],
   [-12,5],[-15,10],[-15,12],[-17,14],[-17,16],[-17,20],[-17,22],
   [-14,27],[-10,31],[-8,32],[-5,35]],
  // Asia (main)
  [[28,42],[32,40],[36,38],[40,38],[42,38],[44,42],[50,43],[55,44],
   [60,52],[65,54],[70,54],[80,55],[90,55],[95,55],[100,55],[104,52],
   [110,58],[115,60],[120,62],[125,64],[130,65],[140,68],[150,70],
   [160,70],[170,70],[175,68],[180,68],[180,55],[170,58],[162,55],
   [158,52],[154,50],[150,46],[148,44],[145,43],[143,40],[140,38],
   [136,36],[135,34],[133,33],[130,31],[128,26],[124,24],[122,22],
   [118,22],[114,22],[110,20],[108,18],[108,16],[104,2],[100,4],
   [98,8],[96,16],[90,22],[85,22],[80,10],[75,12],[72,20],[65,22],
   [62,22],[58,22],[56,24],[52,28],[48,28],[46,30],[42,36],[36,36],
   [32,40],[28,42]],
  // Indian subcontinent
  [[68,24],[72,20],[76,10],[78,8],[80,8],[80,10],[84,12],[88,20],
   [92,24],[86,22],[80,20],[72,22],[68,24]],
  // SE Asia peninsula
  [[100,20],[102,18],[100,14],[100,10],[104,4],[104,2],[102,2],[100,4],
   [96,16],[100,20]],
  // Korean peninsula + Japan rough
  [[125,34],[127,35],[129,35],[130,33],[131,31],[130,32],[132,34],
   [134,35],[136,36],[138,37],[140,38],[141,36],[141,32],[136,34],
   [132,33],[130,31],[125,34]],
  // Japan main islands
  [[130,31],[132,33],[134,34],[136,36],[138,36],[140,38],[141,38],
   [142,36],[140,34],[135,34],[132,33],[130,31]],
  // Australia
  [[114,-22],[118,-20],[121,-16],[124,-14],[128,-14],[132,-12],[136,-12],
   [138,-14],[140,-14],[142,-12],[144,-14],[146,-18],[148,-20],[150,-24],
   [152,-25],[153,-28],[152,-30],[151,-34],[148,-38],[146,-39],[144,-38],
   [140,-36],[138,-35],[135,-32],[132,-30],[128,-34],[124,-34],[120,-34],
   [116,-32],[115,-30],[114,-26],[114,-22]],
]

function ll2canvas(lat, lng, W, H) {
  return { x: ((lng + 180) / 360) * W, y: ((90 - lat) / 180) * H }
}

function ll2pct(lat, lng) {
  return { x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 }
}

/* Label anchor config to avoid overlap */
const LABEL_CFG = {
  'India':          { side: 'right', dy: -40 },
  'UAE':            { side: 'right', dy: -40 },
  'Saudi Arabia':   { side: 'left',  dy: -40 },
  'Qatar':          { side: 'right', dy: 12  },
  'Oman':           { side: 'right', dy: -40 },
  'Kuwait':         { side: 'left',  dy: -40 },
  'Bahrain':        { side: 'right', dy: 12  },
  'China':          { side: 'right', dy: -40 },
  'Singapore':      { side: 'right', dy: -40 },
  'United Kingdom': { side: 'right', dy: -40 },
  'France':         { side: 'left',  dy: -40 },
  'United States':  { side: 'right', dy: -40 },
}

export default function WorldMapBackground({ className = '' }) {
  const canvasRef = useRef(null)
  const rafRef   = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = 0, H = 0

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width  = W * dpr
      canvas.height = H * dpr
      ctx.resetTransform()
      ctx.scale(dpr, dpr)
    }
    resize()

    let ro
    try { ro = new ResizeObserver(resize); ro.observe(canvas) }
    catch (_) { window.addEventListener('resize', resize) }

    let frame = 0

    function draw() {
      if (!W || !H) { rafRef.current = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, W, H)

      /* ── Background ── */
      const bg = ctx.createRadialGradient(W * 0.35, H * 0.45, 0, W * 0.35, H * 0.45, W * 0.85)
      bg.addColorStop(0,    '#112050')
      bg.addColorStop(0.3,  '#09153a')
      bg.addColorStop(0.65, '#050d28')
      bg.addColorStop(1,    '#030818')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      /* red atmospheric glow bottom-left */
      const rag = ctx.createRadialGradient(W * 0.05, H * 0.9, 0, W * 0.05, H * 0.9, W * 0.55)
      rag.addColorStop(0, 'rgba(180,20,30,0.10)')
      rag.addColorStop(1, 'rgba(180,20,30,0)')
      ctx.fillStyle = rag; ctx.fillRect(0, 0, W, H)

      /* centre glow */
      const cg = ctx.createRadialGradient(W * 0.38, H * 0.48, 0, W * 0.38, H * 0.48, W * 0.38)
      cg.addColorStop(0, 'rgba(30,70,180,0.10)')
      cg.addColorStop(1, 'rgba(30,70,180,0)')
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H)

      /* ── Graticule ── */
      ctx.strokeStyle = 'rgba(35,80,200,0.10)'
      ctx.lineWidth = 0.4
      for (let lng = -180; lng <= 180; lng += 30) {
        const x = ((lng + 180) / 360) * W
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * H
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      /* ── Continent fills with edge glow ── */
      for (const path of CONTINENTS) {
        if (path.length < 3) continue
        ctx.beginPath()
        const [fl, fla] = path[0]
        const fp = ll2canvas(fla, fl, W, H)
        ctx.moveTo(fp.x, fp.y)
        for (let i = 1; i < path.length; i++) {
          const p = ll2canvas(path[i][1], path[i][0], W, H)
          ctx.lineTo(p.x, p.y)
        }
        ctx.closePath()

        /* fill */
        ctx.fillStyle = 'rgba(20,52,135,0.52)'
        ctx.fill()

        /* glowing edge */
        ctx.save()
        ctx.shadowColor = 'rgba(50,110,255,0.45)'
        ctx.shadowBlur = 8
        ctx.strokeStyle = 'rgba(55,115,250,0.42)'
        ctx.lineWidth = 0.8
        ctx.stroke()
        ctx.restore()
      }

      /* ── City lights — warm amber dots ── */
      for (const [lng, lat, bright] of CITY_LIGHTS) {
        const p = ll2canvas(lat, lng, W, H)
        const flicker = bright * (0.82 + 0.18 * Math.sin(frame * 0.04 + lng * 0.3 + lat * 0.2))
        const r = (1 + bright * 2.2) * Math.min(W, H) / 800

        /* outer amber halo */
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4)
        halo.addColorStop(0, `rgba(255,180,50,${flicker * 0.45})`)
        halo.addColorStop(1, 'rgba(255,140,20,0)')
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2)
        ctx.fillStyle = halo; ctx.fill()

        /* core */
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,200,80,${flicker * 0.9})`
        ctx.fill()
      }

      /* ── Connection lines ── */
      for (const [ai, bi] of EDGES) {
        const a = MAP_COUNTRIES[ai], b = MAP_COUNTRIES[bi]
        if (!a || !b) continue
        const pa = ll2canvas(a.lat, a.lng, W, H)
        const pb = ll2canvas(b.lat, b.lng, W, H)

        /* line */
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y)
        ctx.strokeStyle = 'rgba(232,50,60,0.14)'; ctx.lineWidth = 0.8; ctx.stroke()

        /* traveling pulse */
        const phase = ((ai * 0.29 + bi * 0.37 + frame * 0.002) % 1)
        const px = pa.x + (pb.x - pa.x) * phase
        const py = pa.y + (pb.y - pa.y) * phase
        const gr = ctx.createRadialGradient(px, py, 0, px, py, 6)
        gr.addColorStop(0, 'rgba(255,80,80,0.85)')
        gr.addColorStop(1, 'rgba(255,80,80,0)')
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2)
        ctx.fillStyle = gr; ctx.fill()
      }

      /* ── Operational country dots ── */
      for (const loc of MAP_COUNTRIES) {
        const p = ll2canvas(loc.lat, loc.lng, W, H)
        const pulse = (Math.sin(frame * 0.04 + loc.lat * 0.22) + 1) * 0.5

        /* large soft glow */
        const big = 22 + pulse * 14
        const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, big)
        g1.addColorStop(0, `rgba(232,50,60,${0.32 + pulse * 0.22})`)
        g1.addColorStop(1, 'rgba(232,50,60,0)')
        ctx.beginPath(); ctx.arc(p.x, p.y, big, 0, Math.PI * 2)
        ctx.fillStyle = g1; ctx.fill()

        /* mid ring */
        const mid = 10 + pulse * 6
        const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, mid)
        g2.addColorStop(0, `rgba(255,70,70,${0.55 + pulse * 0.25})`)
        g2.addColorStop(1, 'rgba(255,70,70,0)')
        ctx.beginPath(); ctx.arc(p.x, p.y, mid, 0, Math.PI * 2)
        ctx.fillStyle = g2; ctx.fill()

        /* core */
        ctx.save()
        ctx.shadowColor = 'rgba(255,40,40,0.9)'; ctx.shadowBlur = 8
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#ff2222'; ctx.fill()
        ctx.restore()

        /* hot centre */
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = '#ffe0e0'; ctx.fill()
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
    cfg: LABEL_CFG[c.name] || { side: 'right', dy: -40 },
  })), [])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Country labels */}
      {labels.map((loc) => {
        const isLeft = loc.cfg.side === 'left'
        return (
          <div
            key={loc.name}
            className="pointer-events-none absolute"
            style={{
              left: `${loc.pct.x}%`,
              top:  `${loc.pct.y}%`,
              transform: isLeft
                ? `translate(calc(-100% - 8px), ${loc.cfg.dy}px)`
                : `translate(8px, ${loc.cfg.dy}px)`,
              zIndex: 5,
            }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(5,10,30,0.78)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 24,
              padding: '4px 10px 4px 5px',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
            }}>
              {/* flag circle */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                fontSize: 13, lineHeight: 1,
              }}>
                {loc.flag}
              </span>
              <span style={{
                fontSize: 11.5, fontWeight: 600,
                color: 'rgba(255,255,255,0.90)',
                fontFamily: 'system-ui,-apple-system,sans-serif',
                letterSpacing: '0.01em',
              }}>
                {loc.name}
              </span>
            </div>

            {/* connector stem */}
            <div style={{
              display: 'flex',
              justifyContent: isLeft ? 'flex-end' : 'flex-start',
              paddingLeft:  isLeft ? 0   : 16,
              paddingRight: isLeft ? 16  : 0,
              marginTop: 3,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#ff3333',
                boxShadow: '0 0 8px 2px rgba(255,40,40,0.8)',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
