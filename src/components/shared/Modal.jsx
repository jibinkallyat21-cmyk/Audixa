import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

// Single global modal, adapted from the Audit360 console's openModal(title,
// bodyHTML, okFn, okLabel) / __closeModal() pattern: one modal instance,
// opened imperatively via a hook rather than one component per dialog.
// `body` is a React node (not innerHTML) to stay idiomatic React.

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null)
  // modal: { title, body, onConfirm, confirmLabel, cancelLabel } | null

  const openModal = useCallback((config) => setModal(config), [])
  const closeModal = useCallback(() => setModal(null), [])

  const handleConfirm = () => {
    modal?.onConfirm?.()
    closeModal()
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-navy/50 px-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-navy">{modal.title}</h3>
                <button onClick={closeModal} aria-label="Close" className="text-slate-400 hover:text-navy">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm text-slate-600">{modal.body}</div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
                >
                  {modal.cancelLabel || 'Cancel'}
                </button>
                {modal.onConfirm && (
                  <button
                    onClick={handleConfirm}
                    className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-red/20 hover:bg-[#D42731]"
                  >
                    {modal.confirmLabel || 'Save'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within a ModalProvider')
  return ctx
}
