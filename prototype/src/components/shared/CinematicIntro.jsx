import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { AnalytixMark } from './AnalytixLogo'
import FinancialDataBackground from './FinancialDataBackground'

const SESSION_KEY = 'audit360-intro-played'
const SPRING_EASE = [0.16, 1, 0.3, 1]
const LETTERS = 'AUDIT 360'.split('')
const AUDIXA_START = 1.8 // seconds — when the GSAP letter reveal begins

export default function CinematicIntro() {
  const navigate = useNavigate()
  const [alreadyPlayed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      return false
    }
  })
  const [showSkip, setShowSkip] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [done, setDone] = useState(false)

  const wordRef = useRef(null)
  const sweepRef = useRef(null)

  // If intro already played this session, skip straight to login
  useEffect(() => {
    if (alreadyPlayed) navigate('/login', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // GSAP timeline: letters emerge from shadow (fade + scale-up + 3D tilt),
  // then a light sweeps across the settled wordmark once. Kept separate
  // from the Framer Motion beats around it, which handle simpler fades.
  useEffect(() => {
    if (alreadyPlayed || !wordRef.current) return undefined

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const letters = wordRef.current.querySelectorAll('.audixa-letter')

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set(letters, { opacity: 1, y: 0, scale: 1, rotateX: 0 })
        gsap.set(sweepRef.current, { opacity: 0 })
        return
      }

      gsap.set(wordRef.current, { transformPerspective: 600 })
      gsap.set(letters, { opacity: 0, y: 26, scale: 0.82, rotateX: -55, transformOrigin: '50% 100%' })
      gsap.set(sweepRef.current, { xPercent: -160, opacity: 0 })

      const tl = gsap.timeline({ delay: AUDIXA_START })
      tl.to(letters, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.9,
        ease: 'back.out(1.5)',
        stagger: 0.09,
      }).to(
        sweepRef.current,
        {
          xPercent: 160,
          opacity: 1,
          duration: 1.0,
          ease: 'power2.inOut',
          onComplete: () => gsap.set(sweepRef.current, { opacity: 0 }),
        },
        '-=0.2',
      )
    })

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyPlayed])

  useEffect(() => {
    if (alreadyPlayed) return undefined

    const skipTimer = setTimeout(() => setShowSkip(true), 1000)
    const exitTimer = setTimeout(() => setExiting(true), 5400)
    const doneTimer = setTimeout(() => finish(), 5900)

    return () => {
      clearTimeout(skipTimer)
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyPlayed])

  function finish() {
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // sessionStorage unavailable (private mode etc) — degrade to playing once per tab lifetime only
    }
    setDone(true)
    navigate('/login', { replace: true })
  }

  function handleSkip() {
    setExiting(true)
    setTimeout(finish, 350)
  }

  if (done) return null

  return (
    <AnimatePresence>
      {
        <motion.div
          key="cinematic"
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-navy"
          initial={{ opacity: 1, y: 0 }}
          animate={exiting ? { y: '-100%', opacity: 0.4 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: SPRING_EASE }}
          onAnimationComplete={() => {
            if (exiting) finish()
          }}
        >
          <FinancialDataBackground />

          <motion.div
            className="relative z-10 flex flex-col items-center"
            animate={exiting ? { y: -40, opacity: 0.6 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: SPRING_EASE }}
          >
            {/* Beat 2 — logo mark with pulsing ambient glow */}
            <motion.div
              className="relative flex items-center justify-center"
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
                opacity: { delay: 0.6, duration: 0.7, ease: SPRING_EASE },
                scale: { delay: 0.6, duration: 0.7, ease: SPRING_EASE },
                filter: { delay: 1.3, duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <div style={{ overflow: 'hidden', height: 52 }}>
                <AnalytixMark size={96} className="[object-position:top]" />
              </div>
              <span
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.26em',
                  marginTop: '6px',
                }}
              >
                ANALYTIX
              </span>
            </motion.div>

            {/* Beat 4 — AUDIT 360: GSAP letter reveal + sweeping light, metallic gradient fill */}
            <div ref={wordRef} className="relative mt-4 flex overflow-hidden" style={{ perspective: 600 }}>
              {LETTERS.map((letter, i) => (
                <span
                  key={`${letter}-${i}`}
                  className="audixa-letter text-[64px] font-black"
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
              <span
                ref={sweepRef}
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
                style={{
                  background: 'linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
                  mixBlendMode: 'overlay',
                }}
              />
            </div>

            {/* Beat 5 — staged tagline phrases */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 text-center">
              {['Intelligent Audits.', 'Seamless Engagements.', 'Trusted Outcomes.'].map((phrase, i) => (
                <motion.span
                  key={phrase}
                  className="text-[17px]"
                  style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.01em' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.4 + i * 0.25, duration: 0.45, ease: SPRING_EASE }}
                >
                  {phrase}
                </motion.span>
              ))}
            </div>

            {/* Beat 6 — horizontal line draws outward from center */}
            <motion.div
              className="mt-12 h-px w-[70vw] max-w-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 4.4, duration: 0.8, ease: SPRING_EASE }}
            />
          </motion.div>

          <AnimatePresence>
            {showSkip && !exiting && (
              <motion.button
                type="button"
                onClick={handleSkip}
                className="absolute bottom-6 right-6 z-10 text-[12px] font-medium text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                whileHover={{ opacity: 0.7 }}
                transition={{ duration: 0.3 }}
              >
                Skip
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      }
    </AnimatePresence>
  )
}
