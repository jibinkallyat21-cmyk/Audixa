import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { AnalytixMark } from '../shared/AnalytixLogo'
import FinancialDataBackground from '../shared/FinancialDataBackground'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const SESSION_KEY = 'audit360_client_greeted_v3'
const SPRING_EASE = [0.16, 1, 0.3, 1]
const LETTERS = 'AUDIT 360'.split('')

export default function ClientGreeting({ name = 'Karim Rahman', company = 'Kingdom Retail Holdings LLC' }) {
  const [visible, setVisible] = useState(() => {
    try { return !sessionStorage.getItem(SESSION_KEY) } catch { return true }
  })

  const wordRef = useRef(null)
  const sweepRef = useRef(null)

  const dismiss = () => {
    setVisible(false)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
  }

  useEffect(() => {
    if (!visible) return undefined
    const t = setTimeout(dismiss, 3800)
    return () => clearTimeout(t)
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  /* GSAP letter reveal + light sweep — same as CinematicIntro */
  useEffect(() => {
    if (!visible || !wordRef.current) return undefined

    const letters = wordRef.current.querySelectorAll('.greeting-letter')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set(letters, { opacity: 1, y: 0, scale: 1, rotateX: 0 })
        gsap.set(sweepRef.current, { opacity: 0 })
        return
      }

      gsap.set(wordRef.current, { transformPerspective: 600 })
      gsap.set(letters, { opacity: 0, y: 26, scale: 0.82, rotateX: -55, transformOrigin: '50% 100%' })
      gsap.set(sweepRef.current, { xPercent: -160, opacity: 0 })

      const tl = gsap.timeline({ delay: 0.7 })
      tl.to(letters, {
        opacity: 1, y: 0, scale: 1, rotateX: 0,
        duration: 0.9, ease: 'back.out(1.5)', stagger: 0.09,
      }).to(sweepRef.current, {
        xPercent: 160, opacity: 1,
        duration: 1.0, ease: 'power2.inOut',
        onComplete: () => gsap.set(sweepRef.current, { opacity: 0 }),
      }, '-=0.2')
    })

    return () => ctx.revert()
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(4px)' }}
          transition={{ duration: 0.55 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#060914' }}
          onClick={dismiss}
        >
          {/* Financial data watermark — same as cinematic intro */}
          <FinancialDataBackground />

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-10 flex flex-col items-center text-center px-8"
          >
            {/* Logo mark + ANALYTIX wordmark */}
            <motion.div
              className="relative mb-5 flex flex-col items-center gap-2"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: [
                  'drop-shadow(0 0 32px rgba(232,50,60,0.35))',
                  'drop-shadow(0 0 32px rgba(232,50,60,0.55))',
                  'drop-shadow(0 0 32px rgba(232,50,60,0.35))',
                ],
              }}
              transition={{
                opacity: { delay: 0.2, duration: 0.7, ease: SPRING_EASE },
                scale:   { delay: 0.2, duration: 0.7, ease: SPRING_EASE },
                filter:  { delay: 0.9, duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <div style={{ overflow: 'hidden', height: 52 }}>
                <AnalytixMark size={96} className="[object-position:top]" />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.26em' }}>
                ANALYTIX
              </span>
            </motion.div>

            {/* AUDIT 360 — metallic gradient + GSAP letter reveal */}
            <div ref={wordRef} className="relative mt-2 flex overflow-hidden" style={{ perspective: 600 }}>
              {LETTERS.map((letter, i) => (
                <span
                  key={`${letter}-${i}`}
                  className="greeting-letter text-[64px] font-black"
                  style={{
                    letterSpacing: '-0.03em',
                    backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #e6e9ef 40%, #aab2c0 60%, #ffffff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                    display: 'inline-block',
                  }}
                >
                  {letter}
                </span>
              ))}
              {/* Sweeping light */}
              <span
                ref={sweepRef}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
                style={{
                  background: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
                  mixBlendMode: 'overlay',
                }}
              />
            </div>

            {/* Greeting */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.5, ease: SPRING_EASE }}
              className="mt-6 text-2xl font-semibold"
              style={{ color: 'rgba(255,255,255,0.82)' }}
            >
              {getGreeting()},{' '}
              <span style={{ color: '#E8323C', textShadow: '0 0 28px rgba(232,50,60,0.45)' }}>
                {name}
              </span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.45, duration: 0.45 }}
              className="mt-2 text-sm"
              style={{ color: 'rgba(255,255,255,0.32)', letterSpacing: '0.02em' }}
            >
              {company} · Analytix Audit &amp; Assurance
            </motion.p>

            {/* Separator line */}
            <motion.div
              className="mt-10 h-px w-[60vw] max-w-xs"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 2.8, duration: 0.7, ease: SPRING_EASE }}
            />
          </motion.div>

          {/* Progress bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-56 h-[2px] rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3.5, ease: 'linear' }}
            />
          </div>

          <button
            onClick={dismiss}
            className="absolute bottom-8 right-8 text-xs font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
          >
            Skip →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
