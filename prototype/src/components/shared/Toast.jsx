import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

// Single-message toast utility, adapted from the Audit360 console's
// __toast(msg) pattern: one visible message at a time, replaced on each new
// call, auto-dismissing after ~2.6s. Exposed as a provider + hook so any
// AUDIXA page/component can call showToast('...') without prop drilling.

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((msg, duration = 2600) => {
    setMessage(msg)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setMessage(null), duration)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed right-5 top-5 z-[100]">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } }}
              exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
              className="flex items-center gap-2.5 rounded-lg border border-slate-700 bg-navy px-4 py-3 text-sm text-white shadow-xl"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald" />
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
