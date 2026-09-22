import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, Check, Send, UserCircle } from 'lucide-react'
import PageTransition from '../../components/shared/PageTransition'
import { AnalytixMark } from '../../components/shared/AnalytixLogo'

const CARD_SHADOW = {
  boxShadow:
    'rgba(0, 0, 0, 0.04) 0px 2px 4px, rgba(0, 0, 0, 0.08) 0px 8px 24px, rgba(0, 0, 0, 0.06) 0px 24px 48px, rgba(255, 255, 255, 0.9) 0px 1px 0px inset',
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | sent

  const handleSubmit = (e) => {
    e.preventDefault()
    if (status !== 'idle') return
    setStatus('loading')
    setTimeout(() => setStatus('sent'), 1500)
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-6 py-10">
        <div
          className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-9"
          style={CARD_SHADOW}
        >
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5">
              <AnalytixMark size={18} />
            </div>
          </div>

          <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-brand/10" />
            <div
              className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10"
              style={{ boxShadow: 'rgba(232, 50, 60, 0.12) 0px 0px 18px' }}
            >
              <Mail className="h-6 w-6 text-brand" />
            </div>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-[#191c1e]">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-[#525f71]">
            Enter your registered email and we will send you a reset link.
          </p>

          <div className="mt-6 grid grid-cols-1 items-start gap-3 text-left md:grid-cols-12 md:gap-4">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-lg md:col-span-7"
            >
              <div>
                <label
                  htmlFor="resetEmail"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#525f71]"
                >
                  Work Email
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  disabled={status !== 'idle'}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0D1B2A] outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50"
                />
              </div>

              <motion.button
                type="submit"
                disabled={status !== 'idle'}
                whileHover={status === 'idle' ? { y: -1, boxShadow: '0 12px 24px -8px rgba(232, 50, 60,0.45)' } : {}}
                whileTap={status === 'idle' ? { scale: 0.98 } : {}}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-md transition-colors ${
                  status === 'sent' ? 'bg-emerald shadow-emerald/20' : 'bg-brand shadow-brand/20'
                }`}
              >
                {status === 'loading' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                )}
                {status === 'sent' && (
                  <>
                    Reset Link Sent
                    <Check className="h-4 w-4" />
                  </>
                )}
                {status === 'idle' && (
                  <>
                    Send Reset Link
                    <Send className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="flex flex-col justify-center gap-2 rounded-xl bg-navy p-4 text-white md:col-span-5">
              <UserCircle className="h-6 w-6 text-white/70" />
              <p className="text-xs leading-relaxed text-white/70">
                Need help? Contact your Audit Manager directly.
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-medium text-[#525f71] transition-colors hover:text-brand"
          >
            ← Back to Sign In
          </Link>
        </div>

        <p className="mt-6 text-xs text-[#525f71]">
          AUDIXA by Analytix — © 2026 Analytix. All rights reserved.
        </p>
      </div>
    </PageTransition>
  )
}
