import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, ChevronDown, ChevronUp, Lock, FileText, X, AlertTriangle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import PageTransition from '../../components/shared/PageTransition'
import { useToast } from '../../components/shared/Toast'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'
import Footer from '../../components/shared/Footer'
import ExitDemoButton from '../../components/shared/ExitDemoButton'

// Reuse FO layout pattern inline (no separate import to avoid circular deps)
const CLIENTS = [
  { id: 'cl-001', name: 'Kingdom Retail Holdings LLC', ref: 'KSA-2024-8841', fy: 'FY2024', draftConfirmed: false },
  { id: 'cl-002', name: 'Al-Marai Logistics JSC', ref: 'KSA-2024-8902', fy: 'FY2024', draftConfirmed: false },
]

function UploadSlot({ label, note, locked, lockedReason, acceptFormats, onUpload, currentFile }) {
  const showToast = useToast()
  const fileRef = useRef(null)
  const [file, setFile] = useState(currentFile || null)
  const [error, setError] = useState(null)

  const ALLOWED = acceptFormats || ['pdf']

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!ALLOWED.includes(ext)) {
      setError(`Only ${ALLOWED.map((a) => `.${a.toUpperCase()}`).join(', ')} files are accepted for this document type.`)
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File exceeds 20MB limit.')
      return
    }
    setError(null)
    setFile(f)
    onUpload && onUpload(f)
  }

  if (locked) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Lock className="h-5 w-5 shrink-0 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{lockedReason}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-navy mb-2">{label}</p>
      {note && <p className="text-xs text-amber mb-3 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{note}</p>}

      {file ? (
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 mb-3">
          <FileText className="h-5 w-5 text-emerald shrink-0" />
          <span className="text-sm font-medium text-navy truncate flex-1">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 hover:border-brand hover:text-brand"
        >
          <Upload className="h-4 w-4" /> Click to upload
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept={ALLOWED.map((a) => `.${a}`).join(',')}
        onChange={handleFileChange}
      />
      {error && <p className="mt-1.5 text-xs text-alert-red">{error}</p>}
    </div>
  )
}

function ClientRow({ client }) {
  const showToast = useToast()
  const [expanded, setExpanded] = useState(false)
  const [qawaemRef, setQawaemRef] = useState('')

  const handleUpload = (slotLabel) => (file) => {
    showToast(`Document shared with ${client.name}`)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-navy">{client.name}</p>
            <p className="text-xs text-slate-500">{client.ref}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{client.fy}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <UploadSlot
                label="Engagement Letter"
                acceptFormats={['pdf']}
                onUpload={handleUpload('engagement-letter')}
              />
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-navy mb-2">Zakat Return &amp; Tax Reports</p>
                <UploadSlot
                  label=""
                  acceptFormats={['pdf', 'xlsx']}
                  onUpload={handleUpload('zakat-return')}
                />
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Qawaem Reference Number</label>
                  <input
                    value={qawaemRef}
                    onChange={(e) => setQawaemRef(e.target.value)}
                    placeholder="QAW-2024-XXXXX"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:border-navy"
                  />
                </div>
              </div>
              <UploadSlot
                label="Draft Financial Statements"
                note="Uploading this notifies the client immediately."
                acceptFormats={['pdf']}
                onUpload={handleUpload('draft-afs')}
              />
              <UploadSlot
                label="Final Audited Financial Statements"
                locked={!client.draftConfirmed}
                lockedReason="Final AFS can only be uploaded after the Draft is confirmed by the Account Owner."
                acceptFormats={['pdf']}
                onUpload={handleUpload('final-afs')}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const FO_NAV = [
  { label: 'Dashboard', href: '/fo/dashboard' },
  { label: 'Registration', href: '/fo/registration' },
  { label: 'Leads', href: '/fo/leads' },
  { label: 'Proposals', href: '/fo/proposals' },
  { label: 'Client Documents', href: '/fo/client-documents' },
  { label: 'Meetings', href: '/fo/meetings' },
]

export default function FOClientDocuments() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="flex h-screen w-[200px] shrink-0 flex-col overflow-y-auto bg-navy text-white">
        <div className="flex items-center gap-2 px-5 py-6">
          <AnalytixMark size={24} />
          <div className="leading-tight">
            <p className="text-sm font-bold">AUDIXA</p>
            <p className="text-[10px] text-white/50">Front Office</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {FO_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center rounded-md px-3 py-2.5 text-sm transition-colors ${
                    location.pathname === item.href ? 'bg-white/10 font-medium text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] items-center justify-between border-b border-white/[0.08] bg-navy px-6 text-white">
          <span className="text-sm font-semibold">Client Documents</span>
          <ExitDemoButton />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <PageTransition>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-navy">Client Documents</h1>
                <p className="mt-1 text-sm text-slate-500">Upload documents for each client — they will be visible in the client portal immediately.</p>
              </div>

              <div className="space-y-4">
                {CLIENTS.map((client) => (
                  <ClientRow key={client.id} client={client} />
                ))}
              </div>
            </div>
          </PageTransition>
        </main>
        <Footer />
      </div>
    </div>
  )
}
