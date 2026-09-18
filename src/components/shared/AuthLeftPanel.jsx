import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import ParticleField from './ParticleField'
import AnalytixLogo from './AnalytixLogo'

const BENEFITS = [
  { icon: 'verified_user', label: 'AI-Powered Document Verification', delay: 'delay-400' },
  { icon: 'query_stats', label: 'Real-Time Engagement Tracking', delay: 'delay-500' },
  { icon: 'hub', label: 'Seamless Client Collaboration', delay: 'delay-600' },
]

export default function AuthLeftPanel() {
  const mouseRef = useRef({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
    }
  }

  // Live telemetry ticker for the holographic chart panel
  useEffect(() => {
    const tick = () => {
      const timeEl = document.getElementById('lp-time-ticker')
      const streamEl = document.getElementById('lp-metric-stream')
      const reconEl = document.getElementById('lp-metric-reconciled')

      if (timeEl) {
        const now = new Date()
        const h = String(now.getUTCHours()).padStart(2, '0')
        const m = String(now.getUTCMinutes()).padStart(2, '0')
        const s = String(now.getUTCSeconds()).padStart(2, '0')
        timeEl.textContent = `${h}:${m}:${s} UTC`
      }
      if (streamEl) {
        const v = 1420 + Math.floor(Math.random() * 21) - 10
        streamEl.textContent = v.toLocaleString()
      }
      if (reconEl) {
        const opts = ['99.97', '99.98', '99.99', '99.98']
        reconEl.textContent = opts[Math.floor(Math.random() * opts.length)]
      }
    }

    tick()
    const id = setInterval(tick, 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative hidden min-h-screen w-1/2 flex-col justify-between overflow-hidden border-r border-white/10 bg-[#0D1B2A] p-8 text-white lg:flex lg:p-16"
    >
      {/* 3D particle field background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ParticleField mouseRef={mouseRef} />
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/85 to-[#0D1B2A]/70 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#0D1B2A]/40" />

      {/* Animated overlays */}
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {/* Digital grid texture */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Holographic live chart panel */}
        <div className="animate-ambient-float absolute -right-12 top-6 z-[4] hidden w-[360px] origin-top-right scale-90 opacity-60 transition-opacity duration-300 hover:opacity-90 xl:block">
          <div
            className="relative rounded-2xl border border-cyan-500/20 bg-[#0D1B2A]/80 p-4 backdrop-blur-md"
            style={{ boxShadow: 'rgba(0,0,0,0.4) 0px 8px 24px, rgba(14,165,233,0.08) 0px 0px 20px' }}
          >
            <div className="mb-2.5 flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  LIVE AUDIT ENGINE
                </span>
              </div>
              <span
                id="lp-time-ticker"
                className="rounded border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-slate-300"
              >
                00:00:00 UTC
              </span>
            </div>

            <div className="relative h-20 w-full overflow-hidden">
              <div
                className="animate-scan-line absolute bottom-0 top-0 z-20 w-[2px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
                style={{ boxShadow: '0 0 12px #38bdf8' }}
              />
              <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 380 110">
                <defs>
                  <linearGradient id="lp-chartGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lp-lineGrad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#E8323C" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <line stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" x1="0" x2="380" y1="28" y2="28" />
                <line stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" x1="0" x2="380" y1="58" y2="58" />
                <line stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" x1="0" x2="380" y1="88" y2="88" />
                <path d="M 0,90 Q 50,40 100,65 T 190,35 T 280,50 T 380,20 L 380,110 L 0,110 Z" fill="url(#lp-chartGrad)" />
                <path
                  className="animate-dash"
                  d="M 0,90 Q 50,40 100,65 T 190,35 T 280,50 T 380,20"
                  fill="none"
                  stroke="url(#lp-lineGrad)"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
                <circle cx="100" cy="65" fill="#38bdf8" r="3.5" />
                <circle cx="100" cy="65" fill="#38bdf8" opacity="0.6" r="6" className="animate-ping" />
                <circle cx="190" cy="35" fill="#E8323C" r="4" />
                <circle cx="190" cy="35" fill="#E8323C" opacity="0.75" r="7" className="animate-ping" />
                <circle cx="280" cy="50" fill="#38bdf8" r="3.5" />
                <circle cx="380" cy="20" fill="#10b981" r="4.5" />
                <circle cx="380" cy="20" fill="#10b981" opacity="0.8" r="8" className="animate-ping" />
              </svg>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-white/10 pt-2 text-xs">
              <div className="rounded-lg border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-wider text-slate-300">Ledger Reconciliation</div>
                <div className="mt-0.5 flex items-center gap-1 text-[12px] font-bold text-emerald-400">
                  <span id="lp-metric-reconciled">99.98</span>%{' '}
                  <span className="material-symbols-outlined text-[13px]">trending_up</span>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm">
                <div className="text-[9px] uppercase tracking-wider text-slate-300">Verification Stream</div>
                <div className="mt-0.5 flex items-center gap-1 text-[12px] font-bold text-cyan-300">
                  <span id="lp-metric-stream">1,419</span>/s{' '}
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient glow blobs */}
        <div className="animate-glow-pulse pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-red-600/15 blur-3xl" />
        <div
          className="animate-glow-pulse pointer-events-none absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Logo */}
      <div className="animate-fade-in-up relative z-10 flex items-center opacity-0">
        <div className="flex items-center rounded-xl border border-white/20 bg-white px-5 py-3 shadow-xl shadow-black/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
          <AnalytixLogo size="lg" />
        </div>
      </div>

      {/* Brand narrative */}
      <div className="relative z-10 my-auto max-w-xl py-10">
        <h1
          className="animate-fade-in-up delay-200 relative mb-4 inline-block select-none text-5xl font-extrabold opacity-0 sm:text-6xl lg:text-7xl"
          style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", letterSpacing: '-0.04em' }}
        >
          <span
            className="animate-audixa-glow bg-gradient-to-r from-white via-slate-100 to-[#E8323C] bg-clip-text text-transparent"
            style={{ backgroundSize: '200% auto', textShadow: 'rgba(0,0,0,0.4) 0px 2px 12px' }}
          >
            AUDIXA
          </span>
          <span className="pointer-events-none absolute -inset-x-4 -inset-y-2 -z-10 rounded-full bg-gradient-to-r from-transparent via-[#E8323C]/10 to-transparent blur-xl" />
        </h1>

        <p className="animate-fade-in-up delay-300 mb-8 max-w-lg text-lg font-normal leading-relaxed text-slate-200 opacity-0 drop-shadow sm:text-xl">
          Intelligent Audits. Seamless Engagements. Trusted Outcomes.
        </p>

        <div className="animate-fade-in-up delay-300 mb-8 h-px w-full bg-gradient-to-r from-white/30 via-white/15 to-transparent opacity-0" />

        <div className="space-y-4">
          {BENEFITS.map(({ icon, label, delay }) => (
            <div
              key={label}
              className={`group animate-fade-in-up ${delay} -ml-2.5 flex items-center space-x-4 rounded-xl p-2.5 opacity-0 backdrop-blur-[2px] transition-all duration-200 hover:bg-white/[0.08]`}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-[#ffb3af] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-white/15">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </div>
              <span className="text-base font-medium text-slate-100 transition-colors group-hover:text-white sm:text-lg">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="animate-fade-in-up delay-600 relative z-10 pt-6 opacity-0">
        <p className="text-sm text-slate-300">AUDIXA by Analytix — © 2026 Analytix. All rights reserved.</p>
      </div>
    </section>
  )
}
