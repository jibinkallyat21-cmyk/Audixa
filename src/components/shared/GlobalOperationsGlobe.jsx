import { useRef, useState, useCallback, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Location data — single source of truth ─────────────────────────────── */
export const ANALYTIX_LOCATIONS = [
  { id: 'india',     name: 'India',                code: 'IN', lat: 20.59,  lng: 78.96,  status: 'operational' },
  { id: 'uae',       name: 'United Arab Emirates', code: 'AE', lat: 23.42,  lng: 53.85,  status: 'operational' },
  { id: 'ksa',       name: 'Saudi Arabia',         code: 'SA', lat: 23.89,  lng: 45.08,  status: 'operational' },
  { id: 'qatar',     name: 'Qatar',                code: 'QA', lat: 25.35,  lng: 51.18,  status: 'operational' },
  { id: 'oman',      name: 'Oman',                 code: 'OM', lat: 21.47,  lng: 55.98,  status: 'operational' },
  { id: 'china',     name: 'China',                code: 'CN', lat: 35.86,  lng: 104.20, status: 'operational' },
  { id: 'uk',        name: 'United Kingdom',       code: 'GB', lat: 55.38,  lng: -3.44,  status: 'operational' },
  { id: 'usa',       name: 'United States',        code: 'US', lat: 37.09,  lng: -95.71, status: 'operational' },
  { id: 'bahrain',   name: 'Bahrain',              code: 'BH', lat: 26.07,  lng: 50.56,  status: 'operational' },
  { id: 'kuwait',    name: 'Kuwait',               code: 'KW', lat: 29.38,  lng: 47.98,  status: 'operational' },
  { id: 'singapore', name: 'Singapore',            code: 'SG', lat: 1.35,   lng: 103.82, status: 'operational' },
  { id: 'france',    name: 'France',               code: 'FR', lat: 46.23,  lng: 2.21,   status: 'operational' },
]

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function ll2v3(lat, lng, r = 1) {
  const phi   = (90 - lat)  * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  )
}

/* ─── Globe canvas texture (no external resources) ───────────────────────── */
function makeGlobeTexture() {
  const W = 2048, H = 1024
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')

  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2)
  bg.addColorStop(0, '#081020')
  bg.addColorStop(1, '#040810')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Graticule — every 30°
  ctx.lineWidth = 0.6
  ctx.strokeStyle = 'rgba(30,65,150,0.20)'
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * W
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = ((90 - lat) / 180) * H
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // Equator + prime meridian slightly stronger
  ctx.strokeStyle = 'rgba(45,95,210,0.32)'
  ctx.lineWidth = 1.1
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()

  return new THREE.CanvasTexture(cv)
}

/* ─── Globe sphere ────────────────────────────────────────────────────────── */
function GlobeSphere() {
  const texture = useMemo(makeGlobeTexture, [])
  return (
    <mesh>
      <sphereGeometry args={[1, 80, 80]} />
      <meshPhongMaterial
        map={texture}
        shininess={12}
        specular={new THREE.Color('#0d2060')}
        emissive={new THREE.Color('#020408')}
        emissiveIntensity={0.6}
      />
    </mesh>
  )
}

/* ─── Atmosphere ──────────────────────────────────────────────────────────── */
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[1.08, 36, 36]} />
      <meshBasicMaterial
        color="#1845cc"
        transparent
        opacity={0.055}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

/* ─── Location marker ─────────────────────────────────────────────────────── */
function LocationMarker({ loc, isSelected, onSelect, onHover }) {
  const pulseRef = useRef()
  const pos = useMemo(() => ll2v3(loc.lat, loc.lng, 1.014), [loc.lat, loc.lng])
  const color = isSelected ? '#FF5561' : '#E8323C'

  useFrame(({ clock }) => {
    if (!pulseRef.current) return
    const phase = (clock.elapsedTime * 0.65 + loc.lat * 0.047) % 1
    pulseRef.current.scale.setScalar(1 + phase * 2.4)
    pulseRef.current.material.opacity = 0.48 * (1 - phase)
  })

  return (
    <group position={pos}>
      {/* Pulse halo */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[isSelected ? 0.020 : 0.014, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.48}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core dot — interactive */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : loc) }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(loc); document.body.style.cursor = 'pointer' }}
        onPointerOut={(e)  => { e.stopPropagation(); onHover(null); document.body.style.cursor = 'default' }}
        tabIndex={0}
        role="button"
        aria-label={`${loc.name} — Analytix operational presence`}
      >
        <sphereGeometry args={[isSelected ? 0.018 : 0.012, 10, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

/* ─── Scene ───────────────────────────────────────────────────────────────── */
function GlobeScene({ selectedLoc, onSelectLoc, onHoverLoc }) {
  const [autoRotate, setAutoRotate] = useState(true)
  const timerRef = useRef(null)

  const pauseRotation  = useCallback(() => {
    setAutoRotate(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const resumeRotation = useCallback(() => {
    timerRef.current = setTimeout(() => setAutoRotate(true), 4000)
  }, [])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <>
      <ambientLight intensity={0.22} />
      <pointLight position={[4, 2.5, 4]}   intensity={1.5} color="#ffffff" />
      <pointLight position={[-3, -2, -3]}  intensity={0.30} color="#2040a0" />

      <GlobeSphere />
      <Atmosphere />

      {ANALYTIX_LOCATIONS.map(loc => (
        <LocationMarker
          key={loc.id}
          loc={loc}
          isSelected={selectedLoc?.id === loc.id}
          onSelect={onSelectLoc}
          onHover={onHoverLoc}
        />
      ))}

      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={0.22}
        enableZoom
        enablePan={false}
        minDistance={1.65}
        maxDistance={3.6}
        zoomSpeed={0.45}
        onStart={pauseRotation}
        onEnd={resumeRotation}
      />
    </>
  )
}

/* ─── Tooltip ─────────────────────────────────────────────────────────────── */
function GlobeTooltip({ loc }) {
  return (
    <AnimatePresence>
      {loc && (
        <motion.div
          key={loc.id}
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.16 }}
          className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 z-50"
          style={{
            background: 'rgba(5,10,24,0.90)',
            border: '1px solid rgba(232,50,60,0.32)',
            borderRadius: '8px',
            padding: '10px 16px',
            backdropFilter: 'blur(12px)',
            whiteSpace: 'nowrap',
          }}
        >
          <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', color: '#E8323C', marginBottom: 2 }}>
            ANALYTIX
          </p>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
            {loc.name}
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            Operational Presence
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Selected location panel ─────────────────────────────────────────────── */
function LocationPanel({ loc, onClose }) {
  return (
    <AnimatePresence>
      {loc && (
        <motion.div
          key={loc.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22 }}
          className="absolute bottom-20 left-6 z-50 w-56"
          style={{
            background: 'rgba(5,10,24,0.92)',
            border: '1px solid rgba(232,50,60,0.30)',
            borderRadius: '12px',
            padding: '18px 20px',
            backdropFilter: 'blur(16px)',
          }}
          role="dialog"
          aria-label={`${loc.name} location information`}
        >
          <div className="flex items-start justify-between mb-3">
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.22em', color: '#E8323C' }}>
              ANALYTIX
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: 18, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              ×
            </button>
          </div>

          <p style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: 8 }}>
            {loc.name}
          </p>

          <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
            <span
              style={{
                display: 'inline-block', width: 7, height: 7,
                borderRadius: '50%', background: '#E8323C',
                animation: 'lp-pulse 2s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.50)' }}>
              Operational Presence
            </span>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingTop: 12,
            fontSize: '10px',
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.28)',
          }}>
            {loc.code} · {loc.status.toUpperCase()}
          </div>

          <style>{`@keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Map controls ────────────────────────────────────────────────────────── */
function MapControls({ onReset }) {
  return (
    <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-1.5">
      <button
        onClick={onReset}
        aria-label="Reset to global view"
        style={{
          background: 'rgba(5,10,24,0.78)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '6px',
          padding: '5px 12px',
          fontSize: '10px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.50)',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.50)'}
      >
        Global View
      </button>
    </div>
  )
}

/* ─── Fallback (no WebGL) ─────────────────────────────────────────────────── */
function GlobeFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0d1b35 0%, #060914 70%)' }}>
      <div className="text-center">
        <div className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: 'rgba(232,50,60,0.7)' }}>
          ANALYTIX GLOBAL OPERATIONS
        </div>
        <div className="mt-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          12 countries · 21+ markets
        </div>
      </div>
    </div>
  )
}

/* ─── Root export ─────────────────────────────────────────────────────────── */
export default function GlobalOperationsGlobe({ className = '' }) {
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [hoveredLoc,  setHoveredLoc]  = useState(null)
  const [webglOk, setWebglOk] = useState(true)

  const handleReset = useCallback(() => {
    setSelectedLoc(null)
    setHoveredLoc(null)
  }, [])

  // Detect WebGL support
  useEffect(() => {
    try {
      const cv = document.createElement('canvas')
      const ok = !!(cv.getContext('webgl') || cv.getContext('experimental-webgl'))
      setWebglOk(ok)
    } catch {
      setWebglOk(false)
    }
  }, [])

  if (!webglOk) return <GlobeFallback />

  return (
    <div
      className={`relative w-full h-full ${className}`}
      role="region"
      aria-label="Analytix global operations map — 12 operational countries"
    >
      <Canvas
        camera={{ position: [0, 0.15, 2.45], fov: 44 }}
        style={{ background: 'transparent' }}
        dpr={[1, Math.min(window.devicePixelRatio, 1.75)]}
        performance={{ min: 0.5 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <GlobeScene
            selectedLoc={selectedLoc}
            onSelectLoc={setSelectedLoc}
            onHoverLoc={setHoveredLoc}
          />
        </Suspense>
      </Canvas>

      {/* HTML overlays */}
      <GlobeTooltip loc={!selectedLoc ? hoveredLoc : null} />
      <LocationPanel loc={selectedLoc} onClose={handleReset} />
      <MapControls onReset={handleReset} />
    </div>
  )
}
