import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnalytixMark } from './AnalytixLogo'

const SESSION_KEY = 'audixa-intro-played'
const SPRING_EASE = [0.16, 1, 0.3, 1]
const LETTERS = 'AUDIXA'.split('')

export default function CinematicIntro() {
  const [alreadyPlayed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      return false
    }
  })
  const [showSkip, setShowSkip] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [done, setDone] = useState(alreadyPlayed)

  useEffect(() => {
    if (alreadyPlayed) return undefined

    const skipTimer = setTimeout(() => setShowSkip(true), 1000)
    const exitTimer = setTimeout(() => setExiting(true), 2700)
    const doneTimer = setTimeout(() => finish(), 3200)

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
          transition={{ duration: 0.5, ease: SPRING_EASE }}
          onAnimationComplete={() => {
            if (exiting) finish()
          }}
        >
          <motion.div
            className="flex flex-col items-center"
            animate={exiting ? { y: -40, opacity: 0.6 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: SPRING_EASE }}
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
                opacity: { delay: 0.4, duration: 0.5, ease: SPRING_EASE },
                scale: { delay: 0.4, duration: 0.5, ease: SPRING_EASE },
                filter: { delay: 0.9, duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <AnalytixMark size={64} />
            </motion.div>

            {/* Beat 3 — ANALYTIX wordmark */}
            <motion.p
              className="mt-4 text-[13px] font-black text-white"
              style={{ letterSpacing: '0.2em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4, ease: SPRING_EASE }}
            >
              ANALYTIX
            </motion.p>

            {/* Beat 4 — AUDIXA, letter-by-letter reveal */}
            <div className="mt-3 flex overflow-hidden">
              {LETTERS.map((letter, i) => (
                <motion.span
                  key={`${letter}-${i}`}
                  className="text-[52px] font-black text-white"
                  style={{ letterSpacing: '-0.03em' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + i * 0.04, duration: 0.4, ease: SPRING_EASE }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Beat 5 — staged tagline phrases */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 text-center">
              {['Intelligent Audits.', 'Seamless Engagements.', 'Trusted Outcomes.'].map((phrase, i) => (
                <motion.span
                  key={phrase}
                  className="text-[14px]"
                  style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.01em' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 + i * 0.15, duration: 0.35, ease: SPRING_EASE }}
                >
                  {phrase}
                </motion.span>
              ))}
            </div>

            {/* Beat 6 — horizontal line draws outward from center */}
            <motion.div
              className="mt-10 h-px w-[70vw] max-w-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 2.2, duration: 0.6, ease: SPRING_EASE }}
            />
          </motion.div>

          <AnimatePresence>
            {showSkip && !exiting && (
              <motion.button
                type="button"
                onClick={handleSkip}
                className="absolute bottom-6 right-6 text-[11px] font-medium text-white"
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
