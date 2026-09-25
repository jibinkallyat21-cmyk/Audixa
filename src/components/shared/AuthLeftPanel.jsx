import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Shield, LineChart, Users } from 'lucide-react'
import ParticleField from './ParticleField'
import { AnalytixMark } from './AnalytixLogo'

const BENEFITS = [
  { Icon: Shield, label: 'AI-verified document processing' },
  { Icon: LineChart, label: 'Real-time engagement tracking' },
  { Icon: Users, label: 'Seamless client collaboration' },
]

export default function AuthLeftPanel() {
  const mouseRef = useRef({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleMouseMove = (e) => {
    if (isMobile) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
    }
  }

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative hidden min-h-screen w-[55%] flex-col overflow-hidden bg-navy text-white lg:flex"
    >
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ParticleField mouseRef={mouseRef} reduced={isMobile} />
        </Canvas>
      </div>

      {/* Legibility gradient behind the text block */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 45% 50%, rgba(13,27,42,0.6) 0%, transparent 100%)',
        }}
      />

      <div
        className="z-10 flex max-w-[400px] flex-col"
        style={{ position: 'absolute', left: '45%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="animate-fade-in-up flex flex-col items-start opacity-0">
          <AnalytixMark size={32} />
          <h1 className="mt-3 text-[42px] font-black leading-none tracking-[-0.03em] text-white">AUDIXA</h1>
          <p className="mt-1.5 text-[13px] font-normal tracking-[0.08em] text-white/35">by Analytix</p>
        </div>

        <div className="animate-fade-in-up delay-200 mt-6 space-y-3 opacity-0">
          {BENEFITS.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
              <span className="text-[13px] text-white/60">{label}</span>
            </div>
          ))}
        </div>

        <div className="animate-fade-in-up delay-300 mt-10 h-px w-full bg-white/[0.06] opacity-0" />

        <p className="animate-fade-in-up delay-400 mt-4 text-[11px] text-white/20 opacity-0">
          © 2026 Analytix. All rights reserved.
        </p>
      </div>
    </section>
  )
}
