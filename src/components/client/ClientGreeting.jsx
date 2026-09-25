import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnalytixMark } from '../shared/AnalytixLogo'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Key cleared by Login page on every client login → always shows fresh
const SESSION_KEY = 'audit360_client_greeted_v3'

export default function ClientGreeting({ name = 'Karim Rahman', company = 'Kingdom Retail Holdings LLC' }) {
  const [visible, setVisible] = useState(() => {
    try { return !sessionStorage.getItem(SESSION_KEY) } catch { return true }
  })

  const dismiss = () => {
    setVisible(false)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
  }

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(dismiss, 4200)
    return () => clearTimeout(t)
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(4px)' }}
          transition={{ duration: 0.55 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#080C18' }}
          onClick={dismiss}
        >
          {/* Radial glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(230,57,70,0.14) 0%, transparent 70%)' }} />
            <div className="absolute left-[30%] top-[20%] h-[300px] w-[300px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
          </div>

          {/* Grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex flex-col items-center text-center px-8"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="mb-8 flex items-center gap-4"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <AnalytixMark size={56} />
              <span className="text-4xl font-black tracking-[0.18em] text-white"
                style={{ textShadow: '0 0 40px rgba(230,57,70,0.4)' }}>
                AUDIT <span style={{ color: '#E8323C' }}>360</span>
              </span>
            </motion.div>

            {/* Greeting line */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
            >
              <p className="text-4xl font-bold text-white leading-tight">
                {getGreeting()},{' '}
                <span className="text-brand" style={{ textShadow: '0 0 30px rgba(230,57,70,0.5)' }}>
                  {name}
                </span>
              </p>
            </motion.div>

            {/* Welcome line */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="mt-4 text-xl text-slate-300 font-light"
            >
              Welcome to{' '}
              <span className="font-semibold text-white">{company}</span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
              className="mt-2 text-sm text-slate-500"
            >
              AUDIT 360 Client Portal · Analytix Audit &amp; Assurance
            </motion.p>

            {/* Animated dots */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="mt-8 flex items-center gap-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1 w-1 rounded-full bg-brand"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Progress bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-56 h-[2px] rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 4.0, ease: 'linear' }}
            />
          </div>

          <button
            onClick={dismiss}
            className="absolute bottom-8 right-8 text-xs text-slate-600 hover:text-slate-300 transition-colors"
          >
            Skip →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
