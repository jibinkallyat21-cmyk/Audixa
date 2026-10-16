import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ isDark: false, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('audit360_theme') !== 'light' } catch { return true }
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      root.style.setProperty('--c-page', '#080C18')
      root.style.setProperty('--c-head', '#0A0E1C')
      root.style.setProperty('--c-card', '#0F1629')
      root.style.setProperty('--c-card2', '#111c35')
      root.style.setProperty('--c-cardhov', '#162040')
      root.style.setProperty('--c-border', 'rgba(255,255,255,0.07)')
      root.style.setProperty('--c-border2', 'rgba(255,255,255,0.12)')
      root.style.setProperty('--c-text', '#F1F5F9')
      root.style.setProperty('--c-muted', '#94A3B8')
      root.style.setProperty('--c-subtle', '#475569')
      root.style.setProperty('--c-track', 'rgba(255,255,255,0.06)')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
      root.style.setProperty('--c-page', '#F0F4F8')
      root.style.setProperty('--c-head', '#FFFFFF')
      root.style.setProperty('--c-card', '#FFFFFF')
      root.style.setProperty('--c-card2', '#F8FAFC')
      root.style.setProperty('--c-cardhov', '#F8FAFC')
      root.style.setProperty('--c-border', 'rgba(0,0,0,0.07)')
      root.style.setProperty('--c-border2', 'rgba(0,0,0,0.14)')
      root.style.setProperty('--c-text', '#0D1B2A')
      root.style.setProperty('--c-muted', '#374151')
      root.style.setProperty('--c-subtle', '#64748B')
      root.style.setProperty('--c-track', 'rgba(0,0,0,0.08)')
    }
    try { localStorage.setItem('audit360_theme', isDark ? 'dark' : 'light') } catch {}
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
