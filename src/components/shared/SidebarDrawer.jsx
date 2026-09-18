import { createContext, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'

// Shared mobile-sidebar mechanics for every portal layout: a hamburger
// button in the header toggles a slide-in drawer holding the same sidebar
// content used at desktop width. Context lets the header (sibling of the
// sidebar) trigger the drawer without prop drilling through each layout.
const DrawerContext = createContext(null)

export function SidebarDrawerProvider({ children }) {
  const [open, setOpen] = useState(false)
  return <DrawerContext.Provider value={{ open, setOpen }}>{children}</DrawerContext.Provider>
}

function useSidebarDrawer() {
  const ctx = useContext(DrawerContext)
  if (!ctx) throw new Error('useSidebarDrawer must be used within SidebarDrawerProvider')
  return ctx
}

export function HamburgerButton() {
  const { open, setOpen } = useSidebarDrawer()
  return (
    <button
      type="button"
      aria-label="Toggle menu"
      onClick={() => setOpen(!open)}
      className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}

export function MobileSidebarWrap({ children }) {
  const { open, setOpen } = useSidebarDrawer()
  return (
    <>
      <div className="hidden lg:block">{children}</div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[110] bg-black/50 lg:hidden"
            />
            <motion.div
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed left-0 top-0 z-[111] h-screen lg:hidden"
              onClick={() => setOpen(false)}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
