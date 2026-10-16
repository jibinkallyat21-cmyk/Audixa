import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({ variant = 'light' }) {
  const { isDark, toggle } = useTheme()
  const isOnDark = variant === 'dark'

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.92 }}
      title={isDark ? 'Switch to Day mode' : 'Switch to Night mode'}
      className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
      style={{
        background: isOnDark
          ? 'rgba(255,255,255,0.08)'
          : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(13,27,42,0.06)',
        color: isOnDark || isDark ? 'rgba(255,255,255,0.7)' : '#475569',
      }}
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 30, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </motion.div>
    </motion.button>
  )
}
