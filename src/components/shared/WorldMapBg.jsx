import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

const OFFICES = [
  { name: 'United States',              coords: [-100.0,  38.5], flag: '🇺🇸' },
  { name: 'United Kingdom',             coords: [  -3.4,  55.0], flag: '🇬🇧' },
  { name: 'France',                     coords: [   2.2,  46.2], flag: '🇫🇷' },
  { name: 'Kuwait',                     coords: [  47.5,  29.3], flag: '🇰🇼' },
  { name: 'Bahrain',                    coords: [  50.55, 26.05], flag: '🇧🇭' },
  { name: 'Saudi Arabia',               coords: [  45.0,  23.8], flag: '🇸🇦' },
  { name: 'UAE',                        coords: [  54.3,  24.3], flag: '🇦🇪' },
  { name: 'Qatar',                      coords: [  51.2,  25.3], flag: '🇶🇦' },
  { name: 'Oman',                       coords: [  57.9,  21.5], flag: '🇴🇲' },
  { name: 'India',                      coords: [  78.9,  22.6], flag: '🇮🇳' },
  { name: 'China',                      coords: [ 104.2,  35.8], flag: '🇨🇳' },
  { name: 'Hong Kong',                  coords: [ 114.2,  22.3], flag: '🇭🇰' },
  { name: 'Singapore',                  coords: [ 103.8,   1.35], flag: '🇸🇬' },
]

const HUB = [47.5, 29.3] // Kuwait as hub

const MAJOR_CITIES = [
  [-74.0,40.7],[-87.6,41.8],[-118.2,34.0],[-95.3,29.7],[-80.2,25.8],[-123.1,49.2],
  [-0.1,51.5],[2.35,48.85],[13.4,52.5],[12.5,41.9],[18.1,59.3],[4.9,52.3],[23.7,38.0],
  [46.7,24.7],[47.98,29.37],[50.58,26.2],[51.5,25.3],[54.4,24.45],[55.27,25.2],[58.4,23.6],[35.9,31.95],
  [77.6,12.97],[72.9,19.1],[77.2,28.6],[88.36,22.57],[80.27,13.08],
  [103.82,1.35],[114.17,22.32],[121.47,31.23],[116.4,39.9],[113.26,23.13],
  [126.98,37.56],[139.69,35.68],[151.2,-33.87],[144.96,-37.81],[115.86,-31.95],
]

// deterministic "random" city lights so they don't shift on re-render
const RANDOM_LIGHTS = (() => {
  const pts = []
  // simple LCG seeded
  let s = 42
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296 }
  for (let i = 0; i < 280; i++) pts.push([-180 + rng() * 360, -55 + rng() * 110])
  return pts
})()

const ALL_LIGHTS = [...RANDOM_LIGHTS, ...MAJOR_CITIES]

function labelOffset(name) {
  if (name === 'Saudi Arabia' || name === 'UAE' || name === 'Oman' || name === 'India' || name === 'Singapore') return [13, 16]
  return [13, -14]
}

export default function WorldMapBg({ style }) {
  const svgRef = useRef(null)
  const rendered = useRef(false)

  useEffect(() => {
    if (rendered.current) return
    rendered.current = true

    const svgEl = svgRef.current
    if (!svgEl) return

    const container = svgEl.parentElement
    let W = container.clientWidth
    let H = container.clientHeight

    const svg = d3.select(svgEl)
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('width', '100%')
      .attr('height', '100%')

    const projection = d3.geoNaturalEarth1()
      .scale(W / 5.6)
      .translate([W / 2, H * 0.5])

    const pathGen = d3.geoPath().projection(projection)

    const mapLayer = svg.append('g')
    const lightsLayer = svg.append('g')
    const connLayer = svg.append('g')
    const markerLayer = svg.append('g')

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(world => {
      const land = topojson.feature(world, world.objects.countries)

      // Countries
      mapLayer.selectAll('path')
        .data(land.features)
        .enter().append('path')
        .attr('d', pathGen)
        .attr('fill', '#1a3448')
        .attr('stroke', '#3d5a6e')
        .attr('stroke-width', 0.5)

      // City lights
      lightsLayer.selectAll('.cl')
        .data(ALL_LIGHTS)
        .enter().append('circle')
        .attr('r', (_, i) => i >= RANDOM_LIGHTS.length ? 1.5 : 0.55)
        .attr('fill', (_, i) => i >= RANDOM_LIGHTS.length ? 'rgba(215,235,250,0.72)' : 'rgba(215,235,250,0.36)')
        .attr('cx', d => { const p = projection(d); return p ? p[0] : -999 })
        .attr('cy', d => { const p = projection(d); return p ? p[1] : -999 })

      // Connection arcs from hub
      const hubPt = projection(HUB)
      OFFICES.forEach((o, i) => {
        if (o.name === 'Kuwait') return
        const pt = projection(o.coords)
        if (!pt || !hubPt) return
        const midX = (pt[0] + hubPt[0]) / 2
        const dist = Math.abs(pt[0] - hubPt[0])
        const curve = Math.min(130, 40 + dist * 0.13)
        const d = `M${pt[0]},${pt[1]} Q${midX},${Math.min(pt[1], hubPt[1]) - curve} ${hubPt[0]},${hubPt[1]}`
        connLayer.append('path')
          .attr('d', d)
          .attr('fill', 'none')
          .attr('stroke', i % 4 === 0 ? 'rgba(239,35,60,0.30)' : 'rgba(175,201,220,0.28)')
          .attr('stroke-width', i % 4 === 0 ? 1.3 : 1.1)
      })

      // Markers + labels
      OFFICES.forEach(o => {
        const pt = projection(o.coords)
        if (!pt) return

        const g = markerLayer.append('g').attr('transform', `translate(${pt[0]},${pt[1]})`)

        // glow
        g.append('circle').attr('r', 11).attr('fill', 'rgba(239,35,60,0.18)').style('filter', 'blur(5px)')
        // pin ring
        g.append('circle').attr('r', 5.5).attr('fill', '#ef233c').attr('stroke', 'white').attr('stroke-width', 1.5)
        // center dot
        g.append('circle').attr('r', 1.8).attr('fill', 'white')

        // label
        const [ox, oy] = labelOffset(o.name)
        const lg = g.append('g').attr('transform', `translate(${ox},${oy})`)
        const textW = Math.max(78, o.name.length * 6.6 + 34)

        lg.append('rect')
          .attr('x', 0).attr('y', -15).attr('width', textW).attr('height', 28)
          .attr('rx', 7)
          .attr('fill', 'rgba(3,12,24,0.90)')
          .attr('stroke', 'rgba(80,110,140,0.5)').attr('stroke-width', 0.7)

        // flag (text node — emoji)
        lg.append('text').attr('x', 8).attr('y', 5).attr('font-size', 12).text(o.flag)

        lg.append('text')
          .attr('x', 27).attr('y', 5)
          .attr('fill', '#f0f4f8').attr('font-size', 11.5).attr('font-weight', 600)
          .attr('font-family', 'Inter, system-ui, sans-serif')
          .text(o.name)
      })

      // Resize handler
      const resize = () => {
        W = container.clientWidth
        H = container.clientHeight
        svg.attr('viewBox', `0 0 ${W} ${H}`)
        projection.scale(W / 5.6).translate([W / 2, H * 0.5])

        mapLayer.selectAll('path').attr('d', pathGen)

        lightsLayer.selectAll('circle').each(function(d) {
          if (!d) return
          const p = projection(d)
          if (!p) return
          d3.select(this).attr('cx', p[0]).attr('cy', p[1])
        })

        const hubP = projection(HUB)
        connLayer.selectAll('path').remove()
        OFFICES.forEach((o, i) => {
          if (o.name === 'Kuwait') return
          const pt = projection(o.coords)
          if (!pt || !hubP) return
          const midX = (pt[0] + hubP[0]) / 2
          const dist = Math.abs(pt[0] - hubP[0])
          const curve = Math.min(130, 40 + dist * 0.13)
          const d = `M${pt[0]},${pt[1]} Q${midX},${Math.min(pt[1], hubP[1]) - curve} ${hubP[0]},${hubP[1]}`
          connLayer.append('path').attr('d', d).attr('fill', 'none')
            .attr('stroke', i % 4 === 0 ? 'rgba(239,35,60,0.30)' : 'rgba(175,201,220,0.28)')
            .attr('stroke-width', i % 4 === 0 ? 1.3 : 1.1)
        })

        markerLayer.selectAll('g').each(function(_, i) {
          const o = OFFICES[i]
          if (!o) return
          const p = projection(o.coords)
          if (!p) return
          d3.select(this).attr('transform', `translate(${p[0]},${p[1]})`)
        })
      }

      const ro = new ResizeObserver(resize)
      ro.observe(container)
      return () => ro.disconnect()
    }).catch(() => {})
  }, [])

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block',
        ...style,
      }}
    />
  )
}
