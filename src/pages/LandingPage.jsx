import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { ChevronDown } from 'lucide-react'
import ParticleField from '../components/shared/ParticleField'
import PageTransition from '../components/shared/PageTransition'
import Footer from '../components/shared/Footer'

const EASE = [0.16, 1, 0.3, 1]

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}
const heroItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

const CLIENTS = [
  'Al-Marai Logistics JSC',
  'Al-Rajhi Heavy Industries',
  'Kingdom Retail Holdings LLC',
  'Riyadh Fintech Group',
  'Eastern Petrochemical Supplies',
  'Arabian Cloud Computing',
  'Jeddah Hospitality Holdings',
  'Noor FinTech Micro-Lending',
  'Dammam Hospitality Holdings',
  'Fawaz Telecommunications',
]

function ClientChip({ name }) {
  return (
    <span
      className="mx-2 inline-flex shrink-0 items-center whitespace-nowrap rounded-[20px] border bg-white"
      style={{ borderColor: '#E5E7EB', padding: '8px 20px' }}
    >
      <span className="text-[13px] font-medium" style={{ color: '#374151' }}>
        {name}
      </span>
    </span>
  )
}

function CarouselRow({ direction }) {
  const doubled = [...CLIENTS, ...CLIENTS]
  return (
    <div className="landing-carousel-row overflow-hidden">
      <div
        className={`flex w-max py-2 ${direction === 'left' ? 'landing-scroll-left' : 'landing-scroll-right'}`}
      >
        {doubled.map((name, i) => (
          <ClientChip key={`${name}-${i}`} name={name} />
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
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

  const scrollToFeatures = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <PageTransition>
      <div className="w-full overflow-x-hidden">
        {/* Section 1 — Hero */}
        <section
          onMouseMove={handleMouseMove}
          className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#0A0F1E' }}
        >
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
              <ParticleField mouseRef={mouseRef} reduced={isMobile} />
            </Canvas>
          </div>

          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="show"
            className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center"
          >
            <motion.h1
              variants={heroItem}
              className="font-black text-white"
              style={{ fontSize: '72px', letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              AUDIXA
            </motion.h1>

            <motion.p variants={heroItem} className="mt-5 font-light" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.55)' }}>
              Modernizing KSA Statutory Audits
            </motion.p>

            <motion.p variants={heroItem} className="mt-3 max-w-lg" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)' }}>
              The end-to-end platform for Analytix — from first lead to Qawaem filing.
            </motion.p>

            <motion.div variants={heroItem} className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <motion.button
                type="button"
                onClick={() => navigate('/login')}
                whileHover={{ y: -1, backgroundColor: '#D12C35', boxShadow: '0 8px 24px rgba(232,50,60,0.35)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: EASE }}
                className="rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white"
              >
                Enter Platform →
              </motion.button>
              <motion.button
                type="button"
                onClick={scrollToFeatures}
                whileHover={{ y: -1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15, ease: EASE }}
                className="rounded-md border border-white/25 px-6 py-3 text-sm font-semibold text-white"
              >
                See How It Works ↓
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.button
            type="button"
            onClick={scrollToFeatures}
            aria-label="Scroll to features"
            className="absolute bottom-8 z-10 text-white/40"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.button>
        </section>

        {/* Section 2 — Trusted By carousel */}
        <section className="w-full py-16" style={{ backgroundColor: '#F9FAFB' }}>
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Trusted by leading KSA companies
          </p>
          <div className="space-y-3">
            <CarouselRow direction="left" />
            <CarouselRow direction="right" />
          </div>
        </section>

        {/* Section 4 — CTA footer strip */}
        <section className="w-full px-6 py-24 text-center" style={{ backgroundColor: '#0A0F1E' }}>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to see AUDIXA in action?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Enter the platform and explore all 6 role portals with sample KSA audit data.
          </p>
          <motion.button
            type="button"
            onClick={() => navigate('/login')}
            whileHover={{ y: -1, backgroundColor: '#D12C35', boxShadow: '0 8px 24px rgba(232,50,60,0.35)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="mt-8 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white"
          >
            Enter Platform →
          </motion.button>
        </section>

        <Footer />
      </div>
    </PageTransition>
  )
}
